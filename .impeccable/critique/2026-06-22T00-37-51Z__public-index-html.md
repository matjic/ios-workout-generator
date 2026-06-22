---
target: public/index.html
total_score: 24
p0_count: 0
p1_count: 2
timestamp: 2026-06-22T00-37-51Z
slug: public-index-html
---
# Critique: public/index.html

## Design Health Score: 24/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Download fires silently, no confirmation/feedback |
| 2 | Match System / Real World | 3 | Strong plain language; "block" mild jargon |
| 3 | User Control and Freedom | 3 | Can remove blocks/steps but no undo |
| 4 | Consistency and Standards | 3 | Consistent vocabulary; tiny-button sizing wobble |
| 5 | Error Prevention | 2 | No goal-syntax validation until submit; can build bodyless workout |
| 6 | Recognition Rather Than Recall | 3 | Options + goal hint stay visible |
| 7 | Flexibility and Efficiency | 2 | No duplicate-block, reorder, import, or shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and focused; slightly flat hierarchy |
| 9 | Error Recovery | 1 | alert() dumps raw exception string |
| 10 | Help and Documentation | 2 | One inline hint + bottom note; no docs link |

## Anti-Patterns Verdict
Not AI slop. Hand-built dev-tool aesthetic, committed dark palette, specific copy, structure mirrors domain. No gradient text, eyebrows, card grids, hero-metric, or glassmorphism.
Detector: 1 finding — flat-type-hierarchy (line 12): sizes cluster 12/13/14/15px, single jump to 22px.
Contrast verified OK: --mut #8a96a6 ~6.5:1 on bg, ~6.1:1 on card — passes AA. Hierarchy problem is SIZE not legibility.
No browser overlay (no automation / dev server in session).

## Priority Issues
- [P1] No visible focus states for keyboard users. Custom buttons have no :focus-visible; weak/invisible ring on dark. WCAG 2.4.7 fail. Fix: high-contrast focus ring on inputs/selects/buttons. -> /impeccable audit
- [P1] Error recovery is a raw alert() exposing e.message. Blocking, jargon, points at nothing. Fix: inline plain-language validation before build, near field. -> /impeccable harden then /impeccable clarify
- [P2] No success feedback on download. No toast/filename/next-step. Fix: confirmation naming file + import next step. -> /impeccable harden
- [P2] Flat type hierarchy (detector + review agree). Everything 12-15px; hierarchy leans on accent color only. Fix: widen scale to >=1.2 ratio. -> /impeccable typeset
- [P2] Tiny tap targets on phone-first flow. Delete/add buttons 4-9px padding, under 44px. Fix: >=44px targets, separate destructive from additive. -> /impeccable adapt

## Persona Red Flags
- Sam (a11y): no focus ring; labels not programmatically associated (for/id); X delete title-only.
- Casey (mobile): primary download scrolls away from thumb zone; small targets; no state persistence on refresh/tab-switch.
- Morgan (N2R runner, project persona): no duplicate-block / load-last for repetitive multi-day plans; no reassurance copy at error moment.

## Minor Observations
- Removing all blocks allows bodyless build (encoder throw caught by alert). Needs guard + empty state.
- Show JSON panel has no copy button.
- Bottom import instructions static and easy to miss; better as contextual post-download guidance.
- Uppercase letter-spaced labels fine as labels (not the banned eyebrow) but add to flat-scale sameness.

## Questions to Consider
- Make invalid goals impossible to submit rather than caught after.
- Show parsed-workout confidence readout (step count, est. duration) before download.
- Smallest feature to remove most repetition: duplicate-block or import-last.
