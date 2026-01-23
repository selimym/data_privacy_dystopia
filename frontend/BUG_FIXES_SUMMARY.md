# Bug Fixes Summary - Public Metrics & Week Advancement

## Issues Fixed

### 1. Public Metrics Not Displaying
**Problem**: The public metrics (International Awareness and Public Anger) were always showing "Loading metrics..." even though the metrics were being computed correctly in the console.

**Root Cause**: The `PublicMetricsDisplay.update()` method had an optimization that skipped rendering if values hadn't changed. However, when metrics were first loaded (transitioning from `undefined` to having values), the values were often `0`, which matched the initialized state. This caused the update to be skipped and the display never rendered the actual metrics.

**Fix**: Added a check for the first update in `PublicMetricsDisplay.ts:178-191`:
```typescript
const isFirstUpdate = !this.config.metrics;
// Always update if this is the first time we're receiving metrics
if (!isFirstUpdate && !awarenessChanged && !angerChanged && !tierChanged) {
  return;
}
```

**Files Changed**:
- `frontend/src/ui/system/PublicMetricsDisplay.ts`

---

### 2. Not Advancing to Next Week After Quota Met
**Problem**: After returning from cinematics, the system would not check if the directive quota was met, preventing progression to the next week.

**Root Cause**: The `checkAndAdvanceTime()` method was only called once during scene creation. When returning from cinematics with `skipAdvanceCheck=true`, the check would be skipped and never run again. The metrics polling would resume, but there was no mechanism to trigger another advance check.

**Fix**:
1. Modified `renderState()` to call `checkAndAdvanceTime()` on every state update (when `skipAdvanceCheck=false`):
   - `frontend/src/scenes/SystemDashboardScene.ts:262-279`

2. Updated the `create()` method to properly resume polling after cinematics without double-checking:
   - `frontend/src/scenes/SystemDashboardScene.ts:69-84`

3. Fixed TypeScript warnings by removing unnecessary `await` keywords from synchronous calls:
   - `frontend/src/scenes/SystemDashboardScene.ts:1335, 1339`

**Files Changed**:
- `frontend/src/scenes/SystemDashboardScene.ts`

---

### 3. UI Improvements
**Changes**: Reduced padding and spacing in public metrics display to make it more compact:
- Reduced padding from 20px/24px to 14px/18px
- Reduced progress bar height from 32px to 26px
- Reduced icon size from 24px to 20px
- Reduced spacing between metric rows from 20px to 14px
- Added CSS for `.public-metrics-container` and `.metrics-loading`

**Files Changed**:
- `frontend/src/styles/system.css`

---

## How It Works Now

1. **Metrics Display**:
   - Metrics are initialized with "Loading metrics..." state
   - When first metrics load (even if they're 0), the display updates immediately
   - Subsequent updates only re-render if values actually change

2. **Week Advancement**:
   - Every time state updates (via polling or user actions), `checkAndAdvanceTime()` is called
   - If quota is met and `skipAdvanceCheck=false`, weekly cinematics are shown
   - When returning from weekly cinematics, `skipAdvanceCheck=true` prevents immediate re-check
   - The flag is reset inside `checkAndAdvanceTime()`, allowing future checks
   - Future flag submissions trigger state updates → renderState → checkAndAdvanceTime → advancement if quota met

3. **Flow Example**:
   ```
   Submit flag → immediate cinematic → return to dashboard →
   state updates → renderState → checkAndAdvanceTime (skipAdvanceCheck=false) →
   quota check → if met: weekly cinematics → return with skipAdvanceCheck=true →
   renderState → skip check → reset skipAdvanceCheck → ready for next check
   ```

---

## Testing Recommendations

1. Test that public metrics display immediately on dashboard load
2. Test that metrics update when values change
3. Test that reaching directive quota triggers weekly advancement
4. Test that returning from weekly cinematics doesn't cause infinite loop
5. Test that subsequent flags can still trigger advancement
