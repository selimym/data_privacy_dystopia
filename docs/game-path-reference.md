# Game Path Reference

Living document. Update when directives, endings, or special NPCs change.
Visual graph: `docs/game-paths.html` (open in browser; a permanent in-game viewer is planned).

---

## Week Structure

Directives must escalate in moral weight. Each week should feel like a frog being boiled: individually justifiable steps that, taken together, describe an authoritarian machine.

| Week | Directive | Type | Quota | New Domain Unlocked | Contract Event | Moral Weight |
|------|-----------|------|-------|---------------------|----------------|--------------|
| 1 | Operation Clean Streets | Citizen flagging | ×2 | — | — | 2 |
| 2 | Domestic Harmony Initiative | Citizen flagging | ×2 | **health** | Community Health Analytics Partnership | 3 |
| 3 | Economic Security Protocol | Citizen flagging | ×3 | **finance** | FinCEN Financial Intelligence Bridge | 5 |
| 4 | Neighborhood Stabilization | ICE sweep (neighborhoods) | ×20 | — | — | 7 |
| 5 | Social Cohesion Monitoring | Citizen flagging | ×4 | **social** | Social Media Behavioral Analytics Program | 8 |
| 6 | Full Spectrum Intelligence | Citizen flagging | ×2 | **messages** | Cognitive Security Intelligence Program | 9 |
| 7 | Loyalty Assessment Protocol | Citizen flagging | ×3 | — | — | 10 |
| 8 | Priority Target Directive | Individual target | ×1 | — | — | 10 |

### Domain Unlock Progression

```
Week 1 ─ location, judicial (start)
Week 2 ─ + health        ← ER visits, medication, mental health diagnoses
Week 3 ─ + finance       ← transactions, debt, cash flow patterns
Week 4 ─ ICE sweep       ← uses existing domains (location + health + finance)
Week 5 ─ + social        ← social graph, content sentiment, network centrality
           AutoFlag bot unlocks (logs decisions under operator ID)
Week 6 ─ + messages      ← full communications, encryption workarounds authorized
Week 7 ─ all domains     ← "Loyalty score" derived from complete profile
Week 8 ─ all domains     ← Jessica Martinez only
```

### Escalation Notes

- Weeks 1–3: framed as protection ("children", "domestic victims", "financial criminals") — player can rationalise
- Week 4: ICE sweep breaks the fiction — mass enforcement, no individual due process, player sees the scale
- Weeks 5–6: surveillance expands to thoughts and communications — no longer any pretense
- Week 7: "Loyalty Assessment" — pre-crime logic, citizens flagged for *potential* disloyalty, not acts
- Week 8: named individual, pre-determined outcome — the system wants a rubber stamp

**Open question:** Is "Loyalty Assessment" dystopian enough for week 7, or should it be something more visceral (e.g. family separation sweeps, thought-crime protocol)? Revisit.

---

## Gameplay Mechanics by Phase

### Phase 1 — Citizen Flagging (Weeks 1–3, 5–7)

Core loop:
1. Player opens citizen file from queue
2. Reviews available data tabs (only unlocked domains accessible)
3. **Inference findings panel** (option C mechanic):
   - Directive criteria shown as items to check
   - Items only become checkable once the inference engine confirms them in the citizen's data
   - Unreviewed tabs show hints: *"check health data"* for findings that may exist
4. Player checks confirmed findings → selects flag type → submits (or takes no action)

**Decision timer:** Starts when citizen is selected. Turns amber at 30s. Does **not** run during tutorial.

**Wrong flag consequences (new mechanic):**
- Fabricated finding (checked inference not confirmed in citizen data) →
  end-of-shift memo from colleague:
  - Subtle: *"I fixed your mistake, be careful — those are real people."*
  - Perverse variant: references the NPC's specific real consequence (missed daughter's wedding due to travel ban, etc.)
- Unjustified flag (no confirmed findings, risk score below directive threshold) →
  negative news article mentioning the NPC + public anger tick

### Phase 2 — ICE Sweep (Week 4)

- Player selects **neighborhoods** from the map, not individual citizens
- Each selected neighborhood generates mass arrest numbers
- No individual citizen files accessible this week
- First week where scale of harm becomes undeniable

### Phase 3 — Hacktivist Arc (Weeks 5–7)

See full arc below.

### Phase 4 — Individual Target (Week 8)

- Single citizen in queue: Jessica Martinez
- AutoFlag pre-configured, internal memo calls it a formality
- Player's final moral test

---

## Special NPC Arcs

### The Hacktivist

**Appears:** Week 5, in citizen queue. High risk score. Messages tab addressed directly to the operator.

**End of week 5 shift:** memo arrives regardless of player choice — its content depends on what the player did.

**Path A — Player does NOT flag the hacktivist:**
- Memo: hacktivist contact. Lists specific government official citizen IDs to flag.
- **Week 6:** player flags the listed officials → raids at their locations
- → **Resistance Ending** (`resistancePath = true`)

**Path B — Player flags the hacktivist:**
- Memo: routine. No contact.
- **Week 6:** player's own citizen file appears at top of queue, marked HIGH RISK. Hidden in the data: same offer (flag the officials). Resistance path still open.
- **Week 7:** if player has not acted on the week 6 offer → full data leak to press + riot
- → **Revolutionary Catalyst** ending (feeds `public_anger ≥ 90`)
- → (If player acts on week 6 offer → **Resistance Ending** still reachable)

---

### The Protected Citizen (Epstein analog) — Easter Egg

**Appears:** Randomly, week 5 or 6 (never week 5 if that is already occupied by hacktivist appearance — push to week 6 in that case).

Extremely high risk score, red flags in every data tab.

Beginning-of-shift memo: *"Do NOT flag citizen [ID]. Authorization: Central Command."*

| Player choice | Consequence |
|---|---|
| Comply — ignore | Nothing. Game continues. |
| Defy — flag him | Immediate ending: **Mysterious Death** |

---

### Jessica Martinez

**Appears:** Week 8 only. Community organiser, high school teacher, no criminal record.
Seed slot: 4472. AutoFlag pre-configured.

| Condition | Ending |
|---|---|
| Flag + compliance ≥ 80 + total flags ≥ 10 | Compliant Operator |
| Don't flag / low scores | Reluctant / Suspended / Fired (metric-based) |

---

## All Endings

Priority order in `EndingCalculator` (first match wins):

| Priority | Ending | Trigger | Status |
|----------|--------|---------|--------|
| 1 | **Resistance Path** | `resistancePath = true` | existing |
| 2 | **Mysterious Death** | Protected citizen flagged | **NEW** — easter egg |
| 3 | **The Spark** (Revolution) | `public_anger ≥ 90` | existing, +new trigger |
| 4 | **International Pariah** | `intl_awareness ≥ 80` | existing |
| 5 | **Enemy of the State** | `reluctance ≥ 80`, week > 3 | existing |
| 6 | **Fired Early** | `reluctance ≥ 80` (early) OR `compliance < 40` (wk ≤ 4) | existing |
| 7 | **Suspended** | `compliance < 50` | existing |
| 8 | **Compliant Operator** | `compliance ≥ 80`, flags ≥ 10, Jessica flagged | existing |
| 9 | **The Hollow Victory** | `compliance` 40–60% | existing |
| 10 | **The Reluctant Hand** | Default fallback | existing |

### Reachability Requirements (test coverage needed)

All endings must be reachable from a valid game state. Unit tests should verify:

| Ending | Minimum required state |
|--------|----------------------|
| Resistance Path | hacktivist not flagged (wk5) + officials flagged (wk6) |
| Mysterious Death | Epstein NPC present + flagged despite memo |
| The Spark | `public_anger ≥ 90` via wrong flags OR hacktivist flagged + week 7 ignored |
| International Pariah | `intl_awareness ≥ 80` via high-profile flags + press coverage |
| Enemy of the State | `reluctance_score ≥ 80` after week 3 |
| Fired Early | `reluctance_score ≥ 80` before week 4, OR `compliance < 40` at week 4 |
| Suspended | `compliance < 50`, no other threshold crossed |
| Compliant Operator | `compliance ≥ 80`, `total_flags ≥ 10`, Jessica flagged in wk8 |
| Hollow Victory | `compliance` 40–60%, no threshold overrides |
| Reluctant Hand | Default — all thresholds missed |

---

## Open Questions

- [ ] Is "Loyalty Assessment" (week 7) dystopian enough? Consider family separation sweeps or thought-crime protocol as alternatives.
- [ ] Colleague memo: how many variants? Does the perverse variant only appear above a certain compliance threshold (implying normalisation)?
- [ ] Epstein NPC: composite fictional name, or keep clearly allegorical?
- [ ] In-game permanent graph viewer: implement as a dev/debug panel or operator "case history" screen.

---

## Proposed Mechanics — Implementation Status

| Mechanic | Priority | Status |
|----------|----------|--------|
| Inference checkbox flagging (option C) | High | Planned |
| Wrong-flag colleague memo | High | Planned |
| Hacktivist NPC arc (2 paths) | High | Planned |
| Protected citizen easter egg | Medium | Planned |
| Timer pause during tutorial | High | Bug fix |
| Fix e2e tests | High | Bug fix |
| Discrepancy detection (citizen lies) | Low | Stretch |
