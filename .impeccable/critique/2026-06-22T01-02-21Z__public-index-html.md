---
target: public/index.html
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-06-22T01-02-21Z
slug: public-index-html
---
# Critique: public/index.html (re-run)

## Design Health Score: 34/40 (Good) — up from 24/40

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Download names file + next step; inline validation + aria-live status |
| 2 | Match System / Real World | 3 | Plain language; "block" mild jargon |
| 3 | User Control and Freedom | 3 | Add/Duplicate/Remove present; no undo for removal |
| 4 | Consistency and Standards | 4 | Unified button vocabulary, states, tokens |
| 5 | Error Prevention | 3 | Pre-submit validation, empty-guard, negative-repeat clamp; goal free-text |
| 6 | Recognition Rather Than Recall | 3 | Hints/options visible; Duplicate cuts recall |
| 7 | Flexibility and Efficiency | 3 | Duplicate-block accelerator; no shortcuts/reorder/import |
| 8 | Aesthetic and Minimalist Design | 4 | Clear 3-tier hierarchy, tokenized, intentional |
| 9 | Error Recovery | 4 | Inline plain-language errors by field, focuses first, preserves input |
| 10 | Help and Documentation | 3 | Errors teach goal grammar; no dedicated help link |

## Anti-Patterns Verdict
Pass. Detector clean (exit 0); flat-hierarchy resolved. Distinctive, deliberate, no new tells.

## What's Working
- Error moment now a strength (h9 1->4): no alert(); inline plain-language validation, focus first offender, preserves input.
- Feedback everywhere it was absent (h1 2->4): download confirms with filename + next step; empty-guard; negative-repeat hang fixed.
- Hierarchy carried by type (aesthetic 3->4): 12/16/28 scale + full state vocabulary.

## Remaining Issues (all P2/P3 — no P0/P1)
- [P2] No undo on removal (block/step removal instant + irreversible). -> harden / small feature.
- [P3] No keyboard accelerators / reorder. Fine for v0.1.
- [P3] No help link to README/findings from the UI. -> clarify.
- [P3] Goal stays free-text; validation catches but a picker would prevent. Deliberate tradeoff.
