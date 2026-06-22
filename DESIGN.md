---
name: iOS Workout Generator
description: A dark, exacting browser tool that captures interval workouts and records them as a valid Apple .workout file.
colors:
  recorder-black: "#0b0d10"
  recess: "#0e1216"
  slate-panel: "#15191f"
  control-gray: "#1d242c"
  hairline: "#2a313b"
  dim-label: "#8a96a6"
  readout-white: "#e8edf2"
  signal-blue: "#5ac8fa"
  deep-ink: "#06222e"
  fault-red: "#ff8a8a"
  confirm-green: "#7ee0a0"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  control: "8px"
  panel: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-secondary:
    backgroundColor: "{colors.control-gray}"
    textColor: "{colors.readout-white}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  input:
    backgroundColor: "{colors.recess}"
    textColor: "{colors.readout-white}"
    rounded: "{rounded.control}"
    padding: "9px 10px"
  card:
    backgroundColor: "{colors.slate-panel}"
    textColor: "{colors.readout-white}"
    rounded: "{rounded.panel}"
    padding: "16px"
---

# Design System: iOS Workout Generator

## 1. Overview

**Creative North Star: "The Field Recorder"**

This is a rugged, exact logging device rendered as a web page. It opens in a dark, low-glare surface and stays out of the way while you enter intervals; its single job is to capture what you describe and record it as a valid Apple `.workout` file. Trust is earned by precision, not persuasion — clear labels, honest hints about what's verified versus inferred, and a confirmation that names the file it just wrote. Nothing here is decorative; every lit pixel means something.

The system is built on three near-black surfaces separated by hairline borders, one cool signal color that marks only what is live, and a strict three-step type scale. It is calm, legible, and unhurried — the opposite of a workout app that shouts. It explicitly rejects the four things this product must never become: a hardcore-gym surface (no aggressive red/black, no bold italics, no "no pain no gain" intensity); a generic SaaS landing page (no gradient hero, no card-grid, no marketing scaffolding); a cluttered consumer fitness app (no rings, badges, streaks, or ad density); and anything toy or childish (no mascots, no bubbly rounding, no playfulness that undercuts "this produces a real, correct file").

**Key Characteristics:**
- Dark, low-glare working surface — built to be read, not admired.
- One accent (Signal Blue) reserved for live/actionable elements only.
- Flat by doctrine: depth comes from tonal layering and hairlines, never shadow.
- A three-size type scale; hierarchy beyond that is weight, case, and color.
- The form mirrors the workout it builds (warmup → repeat blocks → cooldown).

## 2. Colors

A cool, near-monochrome dark palette with a single luminous accent and two quiet semantic signals.

### Primary
- **Signal Blue** (#5ac8fa): The only saturated color. Marks what is live or actionable — the primary Download button, links, the current block heading, and every focus ring. It is the system's voice and is never used as decoration.

### Neutral
- **Recorder Black** (#0b0d10): The body surface. A near-black with a faint cool cast; the base layer everything sits on.
- **Recess** (#0e1216): The slightly deeper well used for inputs, selects, and the JSON readout — fields read as recessed into the panel.
- **Slate Panel** (#15191f): Card and block surfaces, one step up from the body.
- **Control Gray** (#1d242c): Secondary button fill — present but quiet next to the accent.
- **Hairline** (#2a313b): Every border and divider. The system's primary tool for separation.
- **Readout White** (#e8edf2): Primary text. Cool near-white, high contrast on every surface.
- **Dim Label** (#8a96a6): Field labels, hints, and secondary text. Verified at ~6:1 on the dark surfaces — muted, never illegible.
- **Deep Ink** (#06222e): Text on the Signal Blue button; a dark teal-ink that keeps the accent button readable.

### Tertiary (semantic)
- **Fault Red** (#ff8a8a): Inline validation errors and the destructive-hover on the remove-step control. Tinted at 8% for the error status panel.
- **Confirm Green** (#7ee0a0): Success only — the status line after a file is built. Tinted at 8% for the success panel.

### Named Rules
**The Signal Rule.** Signal Blue (#5ac8fa) is reserved for what is live or actionable — primary action, links, current-item headings, focus. If a blue element isn't interactive or doesn't indicate state, it's wrong. Its rarity is what makes it read as "live."

**The Three-Surface Rule.** Depth is exactly three near-black steps — Recorder Black (#0b0d10) → Recess (#0e1216) → Slate Panel (#15191f) — divided by Hairline (#2a313b). Never reach for a fourth surface or a shadow to separate things.

## 3. Typography

**Display Font:** System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
**Body Font:** Same system stack — one family throughout.
**Mono Font:** `ui-monospace, SFMono-Regular, Menlo, monospace` — for the JSON readout and inline code only.

**Character:** One native system family carries the entire UI — it loads instantly, renders natively on the user's device, and keeps the tool feeling like part of the OS rather than a branded web app. Personality comes from the scale and weight discipline, not from a typeface choice. Monospace appears only where characters must align (the JSON output, goal-grammar code samples).

### Hierarchy
- **Display / h1** (650 weight, 1.75rem / 28px, line-height 1.15, letter-spacing −0.02em): The page title only. `text-wrap: balance`.
- **Body** (400 weight, 1rem / 16px, line-height 1.55): All running text, inputs, selects, and buttons. 16px is a floor — it keeps text legible and prevents iOS focus-zoom. Prose capped at ~60ch.
- **Label** (600 weight, 0.75rem / 12px, uppercase, letter-spacing 0.05em): Field labels and block headings (`h3`). Hierarchy here is carried by case + weight + color, not size.
- **Caption** (400 weight, 0.75rem / 12px): Hints, inline errors, and the monospace JSON readout.

### Named Rules
**The Three-Step Rule.** Exactly three sizes exist: 12px, 16px, 28px (`--fs-caption`, `--fs-body`, `--fs-title`). If a new element seems to need a fourth size, change its weight, case, or color instead. A muddy 12/13/14/15px cluster is the failure state this rule exists to prevent.

## 4. Elevation

This system has no shadows. It is flat by doctrine. Depth is conveyed entirely through tonal layering — three stepped near-black surfaces — and single-pixel Hairline borders. A card is not "lifted"; it is a lighter surface inside a darker one, outlined by a hairline. The only motion-driven depth cue is the mobile action bar, which uses a solid fill and a top hairline (never a glass blur) to separate itself from scrolling content.

### Named Rules
**The Flat Rule.** No `box-shadow`, anywhere. If something needs to feel separate, step its background one surface lighter and draw a Hairline border. If it looks like it's floating, it's wrong.

## 5. Components

Every interactive element shares one shape language (8px controls, 12px panels), one hairline border, and the same Signal-Blue focus ring.

### Buttons
- **Shape:** Gently rounded (8px / `{rounded.control}`).
- **Primary:** Signal Blue fill (#5ac8fa), Deep Ink text (#06222e), 600 weight, padding 9px 14px. Used once per context for the committing action (Download).
- **Secondary:** Control Gray fill (#1d242c), Readout White text, hairline border. Used for Show JSON, Add/Duplicate/Remove.
- **Tiny:** Caption size (12px), padding 6px 10px — the in-card block/step controls.
- **Hover / Focus:** Hover lifts the border to Dim Label (secondary) or brightens 8% (primary); the destructive remove-step control shifts to Fault Red on hover. Focus is always a 2px Signal-Blue `:focus-visible` ring at 2px offset. Active nudges down 1px. All transitions 150ms; suppressed under `prefers-reduced-motion`.
- **Touch:** Under `pointer: coarse`, every control grows to ≥44px and the primary action pins to a fixed bottom bar within thumb reach.

### Cards / Containers
- **Corner Style:** 12px (`{rounded.panel}`).
- **Background:** Slate Panel (#15191f) on the Recorder Black body.
- **Shadow Strategy:** None — see The Flat Rule. Separation is the hairline border.
- **Border:** 1px Hairline (#2a313b).
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** Recess fill (#0e1216), 1px Hairline border, 8px radius, 16px text. Labels sit above (static fields) or wrap the control (generated rows) and are always programmatically associated.
- **Focus:** 2px Signal-Blue ring; border also lifts to Dim Label on hover.
- **Error:** `aria-invalid` sets a Fault-Red border and renders a plain-language `.field-err` caption directly beneath, near the offending field.

### Status Panel (signature component)
A single polite live-region below the actions. Two states: **success** (Confirm Green text, 8% green fill + 40% green border) naming the built file and the next step; **error** (Fault Red, 8% red fill) summarizing what to fix. It is the system's one moment of feedback and the payoff of "correctness is the brand."

## 6. Do's and Don'ts

### Do:
- **Do** reserve Signal Blue (#5ac8fa) for live and actionable elements only (The Signal Rule).
- **Do** keep depth flat: tonal surface steps + hairline borders, never a shadow (The Flat Rule).
- **Do** hold the type scale to three sizes — 12 / 16 / 28px — and carry finer hierarchy with weight, case, and color (The Three-Step Rule).
- **Do** keep body and input text at 16px to stay legible and avoid iOS focus-zoom.
- **Do** confirm every successful action with a status line that names the file and the next step; report errors inline, in plain language, beside the field.
- **Do** give every control a visible Signal-Blue focus ring and a ≥44px touch target on coarse pointers.

### Don't:
- **Don't** look like a hardcore-gym app: no aggressive red/black, no bold italics, no "no pain no gain" intensity.
- **Don't** look like a generic SaaS landing page: no gradient hero, no three-card feature grid, no marketing scaffolding or tracked-uppercase eyebrows on every section.
- **Don't** look like a cluttered consumer fitness app: no activity rings, gamified badges, streaks, or ad density.
- **Don't** drift toy or childish: no mascots, no bubbly over-rounding, no playfulness that undercuts "this produces a real, correct file."
- **Don't** introduce a second accent hue or a fourth type size — the restraint is the identity.
- **Don't** use glassmorphism or a backdrop blur for the mobile action bar; use a solid fill and a hairline.
- **Don't** surface a raw exception string to the user — validate before building and explain the fix.
