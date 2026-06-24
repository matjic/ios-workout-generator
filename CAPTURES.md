# `.workout` captures still needed

The alert/goal wire format is reverse-engineered by **diffing real exported `.workout` files** —
the SDK gives the API shape, not the bytes. Each item below is one capture that unlocks a piece of
the format we can't otherwise verify. See `findings.md` for everything already decoded.

## How to capture (the method that's worked for all 6 so far)

1. **Start from the same baseline workout** so diffs stay clean. Every verified sample is:
   - Name `Freerun · N2R Day 1`, activity **Running**, **Outdoor**
   - Warmup 5 min · one block ×6 of [ work 1 min, recovery 2 min ] · cooldown 5 min
   - The alert goes on the **recovery step**, and **only the alert changes** between captures.
   - (It doesn't have to be byte-identical — just change one thing at a time so the new bytes stand out.)
2. Build it in whatever app exports custom workouts, then **share/export** to a `.workout` file.
3. Drop it in `~/Downloads` (or hand it over) and decode to eyeball it yourself:
   ```sh
   protoc --decode_raw < "Carreraalairelibre 8.workout"
   ```
4. Send it and I'll diff, model it in `src/encoder.js`, add a golden test, and update `findings.md`.

The number after the name (the file index) doesn't matter — name them however; just tell me which is which.

---

## The list

Priority order — top ones teach the most.

- [ ] **1. `.average` metric** — *highest value.*
  Set a **pace** (or power) alert to **Average** instead of Current.
  - Why: every threshold we've seen used `.current`. Speed/cadence carry a trailing `{1:X, 2:1.0}`
    block; **power carries none at all** — so we genuinely can't guess where/how "average" is encoded.
  - What to watch: whether the `1.0` becomes `2.0`, or a new field appears.

- [ ] **2. Power zone** — e.g. **zone 3**.
  - Why: I can *infer* this (`6{ 1{ 1:<zone> } }`, mirroring HR zone) with high confidence, but it'd be
    the one alert shipped on a guess. One capture turns it into a verified fact.

- [ ] **3. Cadence range** — e.g. **165–175 spm**.
  - Why: cadence *threshold* stored a bare integer (`170`), unlike HR/speed. Unclear how its range
    bounds wrap.

- [ ] **4. Power range** — e.g. **180–220 W**.
  - Why: power threshold is a bare `Measure`; want to confirm the range bound shape.

- [ ] **5. Speed / pace range** — e.g. **8:30–9:30 /mi**.
  - Why: speed threshold wraps value + a current block; unclear whether that repeats per bound in a range.

### Optional — non-alert goal types (only if you want them supported)

- [ ] **6. Energy goal** — a step with a **calorie** goal (e.g. 200 kcal).
  - Why: `WorkoutGoal.energy` is the one goal type we don't model; need its type code + `UnitEnergy` code.

- [ ] **7. Pool-swim goal** — a `poolSwimDistanceWithTime` workout (needs Pool Swim + a pool length).
  - Why: separate goal encoding; also reveals how pool length / swimming location is stored.

### Non-interval workout types (low priority — different top-level message)

- [ ] **8. A `PacerWorkout`** ("Marcador de ritmo") or **`SwimBikeRun`** ("Multideporte") export.
  - Why: these aren't the `CustomWorkout` body (field 11) we encode; each is a new top-level structure.

---

## Already verified (for reference)

Activity enum (all 84, vs `HKWorkout.h`), location, step purpose, time/distance goals, and **6 alert
variants**: HR zone, HR range, pace (speed) threshold, cadence threshold, power threshold — all
reproduced byte-for-byte. Full detail in `findings.md`.
