# Time Progression Race Condition Fix

## Problem Summary

The time progression logic in SystemDashboardScene.ts had a race condition that could cause confusion when advancing between weekly directives:

1. **Flag counting used indirect lookups**: Flags stored only `directive_id`, requiring a lookup to get `week_number` for each flag
2. **Timing window vulnerability**: Week advancement happened before cinematics, creating a window where the quota check could run with inconsistent state
3. **No guards against double-advancement**: If `checkAndAdvanceTime()` was called during scene transitions, it could potentially cause issues

## Solution Implemented

### Fix 1: Store `week_number` Directly on Flags

**File**: `frontend/src/types/system.ts`

Added `week_number: number` field to `CitizenFlagRead` interface. This eliminates the need to look up directives when counting flags, making the logic more robust and efficient.

```typescript
export interface CitizenFlagRead {
  id: string;
  operator_id: string;
  citizen_id: string;
  directive_id: string;
  week_number: number;  // NEW: Store week number directly
  // ... other fields
}
```

### Fix 2: Populate `week_number` When Creating Flags

**Files Modified**:
- `frontend/src/services/game-orchestrator.ts` (submitFlag function)
- `frontend/src/services/operator-tracker.ts` (recordDecision function)

Both flag creation paths now store the current week number directly on the flag record:

```typescript
// Get current directive week number for the flag
const flagDirective = operator.current_directive_id
  ? gameStore.getDirective(operator.current_directive_id)
  : null;
const currentWeekNumber = flagDirective?.week_number || 1;

const flag: CitizenFlagRead = {
  // ...
  week_number: currentWeekNumber,  // Store week number directly
  // ...
};
```

### Fix 3: Simplified Flag Counting with Guards

**File**: `frontend/src/scenes/SystemDashboardScene.ts` (checkAndAdvanceTime function)

Replaced indirect directive lookup with direct `week_number` comparison and added multiple guards:

```typescript
// Use stored week_number field for reliable filtering (no directive lookup needed)
const flagsThisWeek = allFlags.filter(flag => flag.week_number === currentWeek).length;

// Guard: Check if we're currently in a cinematic transition
if (this.scene.isActive('WorldScene')) {
  console.log('[checkAndAdvanceTime] Skipping - WorldScene is active (cinematic in progress)');
  return;
}

// Guard: Verify this directive matches the current week
if (directive.week_number !== currentWeek) {
  console.warn(`[checkAndAdvanceTime] Directive week doesn't match current week`);
  return;
}
```

## Benefits

1. **Eliminates race conditions**: Direct week_number storage removes timing-dependent directive lookups
2. **More robust**: Multiple guards prevent double-advancement scenarios
3. **Better performance**: No need to look up directives for every flag when counting
4. **Easier to debug**: Direct week_number makes it clear which week each flag belongs to

## Testing Recommendations

1. **Complete multiple weeks**: Verify quota advancement works correctly across multiple directives
2. **Return from cinematics**: Ensure no double-advancement when returning from outcome cinematics
3. **Save/load during cinematics**: Test that saving during cinematic transitions maintains correct state

## Migration Notes

- **Breaking change**: Existing save games will need to be reset
- All flags now require the `week_number` field
