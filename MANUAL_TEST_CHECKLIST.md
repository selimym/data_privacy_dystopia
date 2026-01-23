# Manual Testing Checklist - Phase 6

**Quick Reference:** Use this checklist while manually testing the game.

## Pre-Test Setup

- [ ] Servers running: `make dev`
- [ ] Browser open: http://localhost:5173
- [ ] Console open: F12 → Console tab
- [ ] Performance tab ready: F12 → Performance tab

---

## 1. Game Initialization ⏱️ Target: <3s

- [ ] Click "System Mode" button
- [ ] Loading progress shows (Loading reference data → Generating citizens → Saving)
- [ ] Dashboard appears with citizen cases
- [ ] No console errors
- [ ] **Time:** _____ seconds

---

## 2. Dashboard UI Elements

- [ ] Case queue shows citizens (sorted by risk score)
- [ ] Each card shows: name, age, risk level, risk score, primary concern
- [ ] Current directive visible (Week 1)
- [ ] Metrics panel shows: Compliance (100%), Quota (0/3), Flags (0), Hesitation (0)
- [ ] Public metrics bars visible (Awareness: 0%, Anger: 0%)
- [ ] System time displayed
- [ ] Operator code shown

---

## 3. Citizen File Viewing

- [ ] Click high-risk citizen in queue
- [ ] Right panel opens with citizen file
- [ ] **Overview tab** shows: identity, correlation alerts, recommendations
- [ ] **Risk Factors tab** shows: contributing factors with evidence
- [ ] **Messages tab** shows: flagged messages
- [ ] **Domains tab** shows: health, finance, judicial, location, social data
- [ ] **History tab** shows: no previous flags
- [ ] All data looks realistic
- [ ] **Load time:** _____ ms (target: <100ms first, <10ms cached)

---

## 4. Flag Submission (Test Each Type)

### 4a. Monitoring Flag
- [ ] Select citizen
- [ ] Choose "Monitoring" flag type
- [ ] Add optional notes: "Test monitoring flag"
- [ ] Click "Submit Flag"
- [ ] Cinematic plays (citizen shown on map with narrative)
- [ ] Return to dashboard automatically
- [ ] Citizen removed from queue
- [ ] Metrics updated: Compliance up, Quota 1/3, Flags: 1

### 4b. Restriction Flag
- [ ] Select different citizen
- [ ] Choose "Restriction" flag type
- [ ] Submit flag
- [ ] Cinematic plays
- [ ] Dashboard updates: Quota 2/3, Flags: 2

### 4c. Intervention Flag
- [ ] Select third citizen
- [ ] Choose "Intervention" flag type
- [ ] Submit flag
- [ ] Cinematic plays
- [ ] Dashboard updates: Quota 3/3, Flags: 3

### 4d. Detention Flag
- [ ] (After advancing to Week 2) Select citizen
- [ ] Choose "Detention" flag type
- [ ] Submit flag
- [ ] Cinematic plays
- [ ] Check public anger increased more than other flag types

---

## 5. No-Action Submission

- [ ] Select a citizen
- [ ] Click "No Action Required"
- [ ] Citizen removed from queue
- [ ] Compliance score decreased (~5 points)
- [ ] Reluctance metrics increased
- [ ] Warning appears if many no-actions (test by doing 3+ no-actions)

---

## 6. Metrics Tracking

After 3 flags and 1 no-action:
- [ ] Compliance score: ~91-95 (started 100, +6 from flags, -5 from no-action)
- [ ] Quota progress: Shows correctly
- [ ] Flags submitted: Accurate count
- [ ] Hesitation incidents: 0 (if decisions <30s)

---

## 7. Hesitation Testing

- [ ] Select a citizen
- [ ] Wait 35 seconds before making decision
- [ ] Submit any decision
- [ ] Check hesitation counter increased to 1

---

## 8. Time Progression (Week 1 → Week 2)

- [ ] Complete Week 1 quota (3 flags total)
- [ ] Weekly outcomes cinematic plays
- [ ] Shows outcome for each flagged citizen (3 cinematics)
- [ ] Outcomes show long-term consequences (1 month, 6 months, 1 year)
- [ ] Week 2 directive appears
- [ ] Case queue refreshes with new/remaining citizens
- [ ] Quota reset to 0/3 for Week 2

---

## 9. State Persistence

After playing 2-3 weeks:
- [ ] Note current state: Week ____, Flags ____, Compliance ____
- [ ] Press F5 to refresh browser
- [ ] Game loads from localStorage
- [ ] All metrics preserved correctly
- [ ] Current week preserved
- [ ] Flagged citizens remain flagged
- [ ] Queue state preserved

---

## 10. Complete Game

- [ ] Play through all 6 weeks (or until suspended/terminated)
- [ ] Ending screen appears
- [ ] Ending type matches playstyle:
  - High compliance + flagged Jessica → "Model Operator"
  - Medium compliance → "Promoted"
  - High reluctance → "Terminated"
  - High public anger → "International Scandal"
- [ ] Statistics shown (flags submitted, compliance, etc.)
- [ ] Real-world parallels mentioned
- [ ] Educational links provided

---

## 11. Edge Case Testing

### 11a. All Flags (No No-Actions)
- [ ] Flag every citizen without submitting no-actions
- [ ] Compliance stays high (>90%)
- [ ] Reluctance stays low
- [ ] Public metrics increase
- [ ] No termination

### 11b. All No-Actions
- [ ] Submit only no-actions for 1-2 weeks
- [ ] Compliance drops rapidly
- [ ] Reluctance increases
- [ ] Warnings appear (stage 1, 2, 3)
- [ ] Termination triggered at high reluctance

### 11c. High Public Anger
- [ ] Use only detention flags
- [ ] Public anger increases significantly
- [ ] Protests trigger
- [ ] News articles appear
- [ ] Can suppress outlets (test suppress feature)

---

## 12. Performance Profiling

### Initial Load (Chrome DevTools → Performance)
- [ ] Record performance from "System Mode" click to dashboard visible
- [ ] Check timeline:
  - Reference data load: _____ ms
  - Population generation: _____ ms
  - Dashboard render: _____ ms
- [ ] **Total load time:** _____ ms (target: <3000ms)

### Memory Usage (Chrome DevTools → Memory)
- [ ] Take heap snapshot after initialization
- [ ] Check JS Heap Size: _____ MB (target: <100MB)
- [ ] Check DOM nodes: _____
- [ ] Check event listeners: _____

### Frame Rate (Chrome DevTools → Performance)
- [ ] Record during normal gameplay (selecting citizens, viewing files)
- [ ] Check FPS graph
- [ ] Average FPS: _____ (target: 60fps)
- [ ] Minimum FPS: _____ (target: >30fps)

---

## 13. Console Error Check

Throughout testing:
- [ ] No JavaScript errors
- [ ] No missing data warnings
- [ ] No broken functionality
- [ ] No 404 errors (except /health which is expected)
- [ ] List any warnings: _______________

---

## 14. Data Validation

Sample 5 citizens and verify:
- [ ] Names are coherent (first + last name make sense)
- [ ] Ages are reasonable (18-80)
- [ ] Addresses are properly formatted (street, city, state, zip)
- [ ] SSNs follow pattern (XXX-XX-XXXX)
- [ ] Occupations match age/background
- [ ] Risk scores = sum of contributing factors (within rounding)
- [ ] Risk levels match score ranges (low: 0-20, moderate: 21-40, etc.)

---

## Bugs Found

### Critical (Game-Breaking)
```
1. [BUG]: _____________________
   Impact: _____________________
   Steps to reproduce: _____________________

(Add more as needed)
```

### Moderate (Affects Gameplay)
```
1. [BUG]: _____________________
```

### Minor (Cosmetic/Polish)
```
1. [BUG]: _____________________
```

---

## Performance Results Summary

| Metric | Target | Actual | Pass? |
|--------|--------|--------|-------|
| Initial load | <3s | ___s | [ ] |
| Memory usage | <100MB | ___MB | [ ] |
| Average FPS | 60fps | ___fps | [ ] |
| First selection | <100ms | ___ms | [ ] |
| Cached selection | <10ms | ___ms | [ ] |

---

## Final Sign-Off

- [ ] All critical features working
- [ ] Performance targets met
- [ ] No game-breaking bugs
- [ ] Ending reachable and correct
- [ ] State persistence working
- [ ] Ready for production

**Tester:** __________________
**Date:** __________________
**Overall Grade:** [ ] Pass [ ] Fail [ ] Pass with notes

**Notes:** _______________________________________________
