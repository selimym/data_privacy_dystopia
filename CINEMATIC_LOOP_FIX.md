# Cinematic Loop Fix

## Problem
After completing the first week quota (3 flags), the game would get stuck in an infinite loop:
1. Show cinematics for flagged NPCs
2. Advance to next directive
3. Return to dashboard and immediately advance again
4. Keep looping until reaching week 6, then crash with "No more directives available"

## Root Causes

### Issue 1: Infinite Advancement Loop
When returning from cinematics, `SystemDashboardScene.create()` would call `checkAndAdvanceTime()` again, which would immediately try to advance because the directive had already been marked as complete.

**Flow:**
1. Quota met → Show cinematics → Call `advanceDirective()` → Return to dashboard
2. Dashboard `create()` → `checkAndAdvanceTime()` called again
3. Since directive was already advanced, it would try to advance again
4. Loop continues through all weeks until error

### Issue 2: Cumulative Flag Counting
The quota check used `total_flags_submitted` which is cumulative across ALL weeks, not per-week.

**Example:**
- Week 1: User flags 3 citizens, `total_flags_submitted = 3`
- Week 2: `total_flags_submitted` still = 3, but week 2 quota = 2
- Check: `3 >= 2` ✓ (would incorrectly trigger advancement)

## Fixes Applied

### Fix 1: Skip Advance Check Flag
**Files:** `SystemDashboardScene.ts`, `WorldScene.ts`

Added `skipAdvanceCheck` flag that prevents re-checking quota when returning from cinematics:
- WorldScene passes `skipAdvanceCheck: true` when returning to dashboard
- Dashboard checks this flag and skips quota check if true
- Flag is reset after being used

### Fix 2: Per-Week Flag Counting
**File:** `SystemDashboardScene.ts`

Changed quota check to count flags for CURRENT week only:
```typescript
// OLD: Used cumulative total_flags_submitted
const flagsSubmitted = systemState.dashboard.operator.total_flags_submitted;

// NEW: Count flags for current week only
const allFlags = gameStore.getAllFlags();
const currentWeek = gameStore.getCurrentWeek();
const flagsThisWeek = allFlags.filter(flag => {
  const flagDirective = gameStore.getDirective(flag.directive_id);
  return flagDirective && flagDirective.week_number === currentWeek;
}).length;
```

## Testing

Build succeeds with no TypeScript errors:
```bash
make build
# ✓ built successfully
```

## Expected Behavior After Fix

1. Week 1: User flags 3 citizens (quota = 2)
2. Quota met → Show cinematics → Advance to week 2
3. Return to dashboard with `skipAdvanceCheck=true`
4. Skip quota check, user can continue in week 2
5. Week 2: Only flags submitted IN week 2 count toward week 2 quota
6. No more infinite loops or premature advancements

## Files Modified

1. `frontend/src/scenes/SystemDashboardScene.ts`:
   - Added `skipAdvanceCheck` property
   - Modified `init()` to accept `skipAdvanceCheck` parameter
   - Modified `checkAndAdvanceTime()` to check flag and count per-week flags

2. `frontend/src/scenes/WorldScene.ts`:
   - Modified `exitCinematicMode()` to pass `skipAdvanceCheck: true`
