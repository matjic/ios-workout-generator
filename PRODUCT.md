# Product

## Register

product

## Users

A runner building structured run/walk workouts for their Apple Watch — primarily the
author and like-minded "slower-ramp" runners following None-to-Run-style gentle
progressions. They're technically comfortable (they found a tool that builds an
undocumented binary format from JSON) but they're here to get one thing done: describe
intervals, get a `.workout` file, and move it to their watch. Context of use is a quick
session at a desk or on a phone, often right before or between runs. They are not browsing;
they arrived with intent.

## Product Purpose

Turn a plainly-described workout (name, activity, warmup/cooldown, repeat blocks of
work/recovery steps with time or distance goals) into Apple's `.workout` file, entirely in
the browser — nothing uploaded. It exists because Apple ships no first-party way to author
custom interval workouts without writing a native WorkoutKit app, and the file format is
undocumented. Success is: a user lands, fills the form, and gets a valid file onto their
watch with zero friction and zero doubt that it'll work. The web UI is one of three faces
(library, CLI, web); the web UI's job is to make the format approachable to someone who
doesn't want to touch JSON.

## Brand Personality

Precise, technical, trustworthy. Three words: **exacting, quiet, credible.** The voice of a
well-made developer tool (Linear, Raycast, Stripe's dashboard) — confident because it's
correct, not because it's loud. It earns trust by being legible and exact: clear labels,
honest hints, sensible defaults, no marketing gloss. The tool should disappear into the
task. Reassurance comes from precision ("verified byte-for-byte"), not from cheerleading.

## Anti-references

- **Hardcore gym / bodybuilding apps** — no aggressive red/black, no bold italics, no
  "NO PAIN NO GAIN" intensity. This serves gentle progressions, not maxing out.
- **Generic SaaS landing templates** — no gradient hero, no three-feature-card grid, no
  purple-blob illustrations, no marketing scaffolding. This is a tool, not a pitch.
- **Cluttered consumer fitness apps** — no activity rings everywhere, gamified badges,
  streaks, ad density, or MyFitnessPal busyness. One task, clearly presented.
- **Toy / childish** — no cutesy mascots, no bubbly-rounded everything, no playfulness that
  undercuts the "this produces a real, correct file" credibility.

## Design Principles

1. **The tool disappears into the task.** Earned familiarity over novelty. Standard form
   affordances, predictable behavior, nothing to relearn. Success is the user not noticing
   the UI.
2. **Correctness is the brand.** The whole value proposition is "this produces a valid file
   that works on your watch." The interface should radiate that precision — exact labels,
   honest copy about what's verified vs. inferred, no overpromising.
3. **Privacy is visible, not buried.** "Everything runs in your browser — nothing is
   uploaded" is a core trust signal; keep it legible, not fine print.
4. **Match the user's gentleness.** The audience is easing into running. The UI should feel
   calm and unintimidating even while being technically exact — supportive, never
   performance-pressure.
5. **Structure mirrors the workout.** The form's shape should read like the workout itself
   (warmup → repeat blocks of work/recovery → cooldown), so the mental model and the
   interface are the same thing.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text and placeholders ≥4.5:1 against their backgrounds; the
current dark theme's muted gray (`--mut`) on dark surfaces should be contrast-checked and
bumped toward the ink end where it's borderline. All interactive controls fully
keyboard-operable with a visible focus ring (forms, add/remove block & step buttons,
download/share). Honor `prefers-reduced-motion` for any added motion. Don't rely on color
alone to signal step type (work vs. recovery) — pair with text/icon. Targets comfortable on
touch (the iPhone path is first-class).
