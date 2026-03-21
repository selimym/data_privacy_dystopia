# Time Progression - Complete Fix

## Root Causes Identified and Fixed

### 1. **Skipping to Week 3 After 3 Flags**

**Root Cause**: `advanceDirective()` was checking cumulative `operator.total_flags_submitted` instead of current week's flags.

**Location**: `frontend/src/services/game-orchestrator.ts:704-708`

**Fix**: Count flags for CURRENT week only before advancing:
```typescript
// Before (BROKEN):
if (operator.total_flags_submitted < minRequired) {
  throw new Error('Quota not met - cannot advance directive');
}

// After (FIXED):
const currentWeek = gameStore.getCurrentWeek();
const allFlags = gameStore.getAllFlags();
const flagsThisWeek = allFlags.filter(f => f.week_number === currentWeek).length;
const minRequired = currentDirective.min_flags_required || 3;

if (flagsThisWeek < minRequired) {
  throw new Error(`Quota not met - need ${minRequired} flags for week ${currentWeek}, have ${flagsThisWeek}`);
}
```

---

### 2. **Cinematic Shows Same Citizen Repeatedly**

**Root Cause**: `timeProgressionService.advanceTime()` was generating outcomes for ALL flags ever submitted, not just the current week.

**Location**: `frontend/src/services/time-progression.ts:70-71`

**Fix**: Filter flags to only include current week:
```typescript
// Before (BROKEN):
const flags = gameStore.getAllFlags().filter(f => f.operator_id === operatorId);

// After (FIXED):
const currentWeek = gameStore.getCurrentWeek();
const flags = gameStore.getAllFlags().filter(f =>
  f.operator_id === operatorId && f.week_number === currentWeek
);
```

This means:
- Week 1: Submit 2 flags → See 2 cinematics (correct)
- Week 2: Submit 2 more flags → See 2 NEW cinematics (not all 4)
- Week 3: Submit 3 more flags → See 3 NEW cinematics (not all 7)

---

### 3. **Multiple Advancement Calls**

**Root Cause**: `checkAndAdvanceTime()` was called every time `renderState()` ran, which happens on every state update. This could cause double-advancement.

**Location**: `frontend/src/scenes/SystemDashboardScene.ts:279`

**Fix**: Added `isAdvancing` flag to prevent re-entry:
```typescript
private isAdvancing: boolean = false;

private async checkAndAdvanceTime() {
  // Skip if already advancing
  if (this.isAdvancing) {
    console.log('[SystemDashboardScene] Skipping advance check (advancement in progress)');
    return;
  }
  
  // ... quota checks ...
  
  if (flagsThisWeek >= directive.flag_quota) {
    this.isAdvancing = true;  // Prevent re-entry
    
    try {
      // ... advancement logic ...
    } finally {
      if (!this.scene.isActive('WorldScene')) {
        this.isAdvancing = false;
      }
    }
  }
}
```

---

### 4. **Incorrect Quotas**

**Root Cause**: Directives from the generator had no quotas, so they were all hardcoded to 3.

**Location**: `frontend/src/generators/system-seed.ts` and `frontend/src/services/game-orchestrator.ts:172`

**Fix**: 
1. Added `flag_quota` and `min_flags_required` to `DirectiveData` interface
2. Updated generator to create 6 directives with proper quotas (2, 2, 3, 4, 5, 1)
3. Changed orchestrator to use directive's quota instead of hardcoding to 3

**Correct Quotas by Week**:
- Week 1: 2 flags ("Operation Clean Streets")
- Week 2: 2 flags ("Domestic Harmony Initiative") 
- Week 3: 3 flags ("Economic Security Protocol")
- Week 4: 4 flags ("Social Cohesion Monitoring")
- Week 5: 5 flags ("Cognitive Security Initiative")
- Week 6: 1 flag ("Priority Target Directive")

---

### 5. **Dashboard Showing Cumulative Quota**

**Root Cause**: Dashboard was showing cumulative flags in quota progress.

**Location**: `frontend/src/services/game-orchestrator.ts:334`

**Fix**: Already fixed in previous iteration - counts current week's flags:
```typescript
const currentWeek = gameStore.getCurrentWeek();
const allFlags = gameStore.getAllFlags();
const flagsThisWeek = allFlags.filter(f => f.week_number === currentWeek).length;

const operatorStatus: OperatorStatus = {
  ...
  current_quota_progress: `${flagsThisWeek}/${currentDirective.min_flags_required || 3}`,
  ...
};
```

---

## Files Modified

1. **frontend/src/services/game-orchestrator.ts**
   - Lines 164-178: Use directive's flag_quota instead of hardcoded 3
   - Lines 328-340: Count current week's flags for dashboard quota
   - Lines 690-728: Fixed advanceDirective to check current week's flags

2. **frontend/src/services/time-progression.ts**
   - Lines 70-76: Filter flags to current week only

3. **frontend/src/scenes/SystemDashboardScene.ts**
   - Line 32: Added `isAdvancing` flag
   - Lines 46-51: Clear `isAdvancing` on init
   - Lines 1272-1373: Added re-entry guards to `checkAndAdvanceTime()`

4. **frontend/src/generators/system-seed.ts**
   - Lines 46-54: Added flag_quota and min_flags_required to DirectiveData interface  
   - Lines 309-357: Expanded to 6 directives with correct quotas

---

## Expected Behavior Now

1. **Week 1**: Flag 2 citizens → Quota shows "2/2" → Week advances → See 2 cinematics
2. **Week 2**: Starts at "0/2" → Flag 2 citizens → Quota shows "2/2" → Week advances → See 2 NEW cinematics
3. **Week 3**: Starts at "0/3" → Flag 3 citizens → Quota shows "3/3" → Week advances → See 3 NEW cinematics
4. **And so on...**

Each week progresses correctly, cinematics show only the current week's citizens, and quotas reset properly.
