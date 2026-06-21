# ios-workout-generator

Generate Apple&nbsp;Watch custom workout (`.workout`) files from plain JSON, then import them to
your watch/phone. No iOS app or developer account needed to *use* it. Available three ways:

- **Web UI** — a static page that builds the file in your browser (nothing is uploaded).
- **CLI** — `bunx ios-workout-generator workout.json`.
- **Library** — `import { encodeWorkout } from "ios-workout-generator"`.

It produces Apple's `.workout` format (a WorkoutKit `WorkoutPlan`). That format is undocumented;
we reverse-engineered it and verified the encoder byte-for-byte against a real exported file.
Full format, schema, and corroboration: **[findings.md](./findings.md)**.

## How it works

```
workout JSON  →  encoder (src/encoder.js)  →  .workout file  →  Fitness → Add → Apple Watch
```

One dependency-free encoder powers all three faces. The Web UI uses a build-time copy at
`public/encoder.js`.

## Use as a library

```js
import { encodeWorkout, workoutFilename } from "ios-workout-generator";

const bytes = encodeWorkout({
  name: "N2R Day 1",
  activity: "running",      // running | walking | cycling | hiking
  location: "outdoor",      // outdoor | indoor
  warmup:  { goal: "5min" },
  blocks:  [{ repeat: 6, steps: [
             { type: "work",     goal: "1min" },   // run
             { type: "recovery", goal: "2min" }] }], // walk
  cooldown: { goal: "5min" },
});                          // → Uint8Array; write it as `${workoutFilename(name)}`
```

Goal grammar: time (`30s`, `5min`, `1min30s`), distance (`400m`, `1km`, `1mi`, `yd`), or `open`.
Ships with TypeScript types (`src/encoder.d.ts`).

## Import paths (JSON file → watch)

- **Mac:** download/generate the file, AirDrop to iPhone, tap it → Fitness → Add. *(Verified.)*
- **iPhone:** the UI's “Share to phone…” (Web Share API), or open the file from Files → Fitness
  → Add. *(Likely; verify on-device.)*

Imported workouts appear in the Watch's **Workout** app under the matching activity tile
(e.g. `outdoor running` → **Outdoor Run** → ••• → your workout).

## Develop (bun)

```sh
bun install
bun test           # unit tests (incl. byte-identical golden-file check)
bun run verify     # extra: re-checks against a real exported .workout if present
bun run dev        # static site at http://localhost:8788  (wrangler pages dev)
bun run gen workout.json    # CLI: write a .workout from JSON
bun run deploy     # publish the static site to Cloudflare Pages
```

## Status & caveats

- Time goals are fully verified; **alerts** (HR/pace/power) and **distance-goal units** are
  inferred and not yet round-tripped — see findings.md “Open gaps.”
- The `.workout` byte format is undocumented and carries no compatibility guarantee; Apple could
  change it in an OS update. `bun run verify` is the canary.
