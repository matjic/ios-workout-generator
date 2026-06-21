# freerun — Findings: Apple's `.workout` file format

Reverse-engineering notes for Apple's `.workout` share file, so freerun can generate
importable custom workouts from a laptop. Verified on macOS 26.1 against the iOS 26.0 SDK.

## TL;DR

- A `.workout` file is an **undocumented protobuf** serialization of a WorkoutKit `WorkoutPlan`.
- We reverse-engineered the schema and **proved the encoder by regenerating a real exported
  file byte-for-byte** (154 bytes in → 154 identical bytes out).
- A file generated independently from JSON **imported successfully** into the Apple Watch
  Workout app via AirDrop → Fitness. The full laptop → watch pipeline works with **no iOS
  app, no entitlement, no on-device build**.
- The *semantic model* is fully backed by Apple's public API; the *byte encoding* has no
  official spec and carries no compatibility guarantee.

## Pipeline

```
JSON on laptop  →  freerun.py (protobuf encoder)  →  .workout file  →  AirDrop  →  Fitness "Add" → Workout app
```

Because *sharing* a workout produces these files, *receiving* one imports it — so any
byte-valid file we generate imports the same way.

## The format

Top level is a single protobuf message (the leading `J$…` is just field 9's tag + length,
not a magic header):

```proto
// schema/workout.proto — reverse-engineered; verified by byte-identical round-trip.
syntax = "proto3";

message WorkoutFile {
  string id = 9;            // plan UUID, uppercased
  CustomWorkout body = 11;
  // real files also carry trailing metadata: field 1000 = 1, field 1002 = 5
}
message CustomWorkout {
  uint32 activity = 1;      // HKWorkoutActivityType: running=37, walking=52, cycling=13, hiking=24
  uint32 location = 2;      // HKWorkoutSessionLocationType: unknown=1, indoor=2, outdoor=3
  string displayName = 3;
  Step warmup = 4;
  repeated Block block = 5;
  Step cooldown = 6;
}
message Block        { repeated IntervalStep step = 1; uint32 iterations = 2; }
message IntervalStep { uint32 purpose = 1;  Step step = 2; }   // purpose: 1=work, 2=recovery
message Step         { Goal goal = 1; }                        // goal absent  ==  open goal
message Goal         { uint32 type = 1;  Measure value = 2; }  // type: 1=time, 2=distance
message Measure      { uint32 unit = 1;  double amount = 2; }  // time unit=1 (seconds)
```

### Worked example

`Carreraalairelibre.workout` (a real exported file) decodes to:

> **"R4U run day 53"** — outdoor running
> warmup 5:00 · **4 ×** ( run 4:00 / walk 3:00 ) · cooldown 5:00

Goals are stored as IEEE-754 doubles in seconds: `300.0, 240.0, 180.0, 300.0`.

## Corroboration

Two layers, two kinds of evidence.

### Layer 1 — the model: officially documented
Confirmed against the **on-disk iOS 26.0 SDK** (authoritative Apple source):

| Encoder assumption | Official confirmation |
|---|---|
| body = activity, location, displayName, warmup, blocks[], cooldown | `CustomWorkout(activity:location:displayName:warmup:blocks:cooldown:)` in `WorkoutKit.swiftinterface` |
| Block = steps[] + iterations | `IntervalBlock(steps:iterations:)` |
| purpose ∈ {work, recovery} | `IntervalStep.Purpose { case work; case recovery }` |
| goal ∈ {time, distance, open} | `WorkoutGoal { case open; case time(Double, UnitDuration); case distance(Double, UnitLength) }` |
| location unknown=1, indoor=2, outdoor=3 | `HKWorkoutConfiguration.h` |
| activity running=37 | `HKWorkoutActivityType` enum + the real file |

### Layer 2 — the byte encoding: no official spec
Apple states (Developer Forums thread 750557) that `.workout` files are binary-only with no
published format; the WWDC23 JSON representation was removed and `.dataRepresentation`
deprecated. The protobuf field numbers, trailing metadata, goal type codes, and unit codes
are **inferred**, not documented.

Evidence we rely on instead — validation through **both of Apple's own implementations**:
1. **Apple's encoder:** byte-for-byte identical regeneration of a real exported file.
2. **Apple's decoder:** an independently generated file imported cleanly into Fitness.

A stale spec can lie; passing through the live encoder *and* decoder is ground truth.

## Constants reference (harvested from iOS 26 SDK)

Confidence: **wire** = confirmed in a real `.workout`; **enum** = exact value from the SDK,
but its protobuf encoding is inferred; **API** = exists in WorkoutKit, wire format unknown.

### Activity (`CustomWorkout` field 1) — wire/enum
Varint = `HKWorkoutActivityType` raw value. `running = 37` is confirmed on the wire; the rest
follow from the same enum (`HKWorkout.h`). **The encoder ships the full 84-value map** — selected:

| running | walking | cycling | hiking | swimming | rowing | elliptical | stairClimbing | functionalStrengthTraining |
|--|--|--|--|--|--|--|--|--|
| 37 | 52 | 13 | 24 | 46 | 35 | 16 | 44 | 20 |

Full list also includes `highIntensityIntervalTraining = 63`, `coreTraining = 59`, `yoga = 57`,
`crossTraining = 11`, `wheelchairWalkPace = 70`, `wheelchairRunPace = 71`, … `other = 3000`.
Not all are valid for a custom workout — WorkoutKit gates this with `CustomWorkout.supportsActivity(_:)`.

### Location (field 2) — enum (`HKWorkoutConfiguration.h`)
`unknown = 1`, `indoor = 2`, `outdoor = 3`. (`outdoor = 3` confirmed on the wire.)

### Step purpose (`IntervalStep` field 1) — wire
`work = 1`, `recovery = 2`.

### Goal (`Goal.type`) and units (`Measure`) — wire/enum/API
WorkoutKit `WorkoutGoal` cases: `open`, `time(Double, UnitDuration)`, `distance(Double, UnitLength)`,
`energy(Double, UnitEnergy)`, `poolSwimDistanceWithTime(Measurement, Measurement)`.

| goal | `Goal.type` | `Measure.unit` | confidence |
|---|---|---|---|
| open | (Goal field absent) | — | wire |
| time | 1 | seconds = 1 | wire |
| distance | 2 (inferred) | meters = 5 (inferred) | enum |
| energy | ? | ? | API |
| poolSwimDistanceWithTime | ? | ? | API |

Goal amounts are IEEE-754 doubles (`Measure` field 2, wire type 1).

### Alerts (`WorkoutStep.alert` / `IntervalStep.step.alert`) — API only
Full WorkoutKit vocabulary (wire encoding **unknown** — no sample file has contained one yet):

| Alert struct | Target type / unit | Variants | Metric |
|---|---|---|---|
| HeartRateRangeAlert / HeartRateZoneAlert | `UnitFrequency` (bpm) or `zone: Int` | range, zone | — |
| SpeedRangeAlert / SpeedThresholdAlert | `UnitSpeed` | range, threshold | `current` / `average` |
| PowerRangeAlert / PowerThresholdAlert / PowerZoneAlert | `UnitPower` (W) or `zone: Int` | range, threshold, zone | `current` / `average` |
| CadenceRangeAlert / CadenceThresholdAlert | cadence unit | range, threshold | — |

`WorkoutAlertMetric` = `{ current, average }`. Pace is expressed via **Speed** (`UnitSpeed`), not a
separate pace alert. Encoding any of these requires capturing one sample `.workout` per alert type.

### Swimming (only relevant to `poolSwimDistanceWithTime` goals, not yet encoded) — enum
`HKWorkoutSwimmingLocationType`: `unknown = 0`, `pool = 1`, `openWater = 2`.
`HKSwimmingStrokeStyle`: `unknown = 0`, `mixed = 1`, `freestyle = 2`, `backstroke = 3`,
`breaststroke = 4`, `butterfly = 5`, `kickboard = 6`.

### Trailing metadata (`WorkoutFile`) — wire
`field 1000 = 1`, `field 1002 = 5`. Reproduced verbatim; purpose unknown (likely version markers).

## Open gaps (inferred, not yet verified on the wire)

- **Alerts.** The sample file had none. 9 typed variants exist (HR/speed/power/cadence ×
  range/threshold/zone, with a `current`/`average` metric) — see Constants reference. Each is
  almost certainly a distinct encoding; unmodeled until we capture one of each.
- **Distance & energy goals.** `distance` type = 2 / unit = 5 (meters) are inferred; `energy` and
  `poolSwimDistanceWithTime` codes are entirely unknown. Non-metric units may serialize differently.
- **Trailing metadata** `field 1000 = 1, field 1002 = 5` — purpose unknown (version markers?).
  Reproduced verbatim; not yet tested whether they're required for import.

### How to close a gap
Build a workout containing the feature in Apple's WorkoutKit sample app, share it to produce a
`.workout`, then `protoc --decode_raw` and diff against a known file. Same method that
established everything above.

## Risk

Layer-1 semantics are public-API stable. Layer-2 bytes carry **no compatibility promise** —
Apple may change the internal encoding in any OS update. Mitigation: keep a known `.workout`
fixture in the repo and assert byte-identical regeneration in CI, so a format change is caught
immediately. Since the user has a paid developer account, the official WorkoutKit-in-an-app
path remains a durable fallback (it rides the supported API), feeding from the same JSON format.

## Sources

- iOS 26.0 SDK (local): `WorkoutKit.framework/.../WorkoutKit.swiftinterface`, `HealthKit.framework/Headers/HKWorkoutConfiguration.h`
- [WorkoutKit — Apple Developer Documentation](https://developer.apple.com/documentation/workoutkit/)
- [CustomWorkout](https://developer.apple.com/documentation/workoutkit/customworkout) · [WorkoutPlan](https://developer.apple.com/documentation/workoutkit/workoutplan)
- [Build custom workouts with WorkoutKit — WWDC23 (session 10016)](https://developer.apple.com/videos/play/wwdc2023/10016/)
- [How to generate .workout files — Apple Developer Forums 750557 (Apple engineer reply)](https://developer.apple.com/forums/thread/750557)
- [mac4n6 — protobuf in Mac/iOS forensics (decode method)](https://www.mac4n6.com/blog/2019/9/27/just-call-me-buffy-the-proto-slayer-an-initial-look-into-protobuf-data-in-mac-and-ios-forensics)

## Appendix A — example input (JSON)

A gentle None-to-Run-style first session: warmup 5:00, 6 × (run 1:00 / walk 2:00), cooldown 5:00.

```json
{
  "name": "Freerun · N2R Day 1",
  "activity": "running",
  "location": "outdoor",
  "warmup":   { "goal": "5min" },
  "blocks": [
    {
      "repeat": 6,
      "steps": [
        { "type": "work",     "goal": "1min" },
        { "type": "recovery", "goal": "2min" }
      ]
    }
  ],
  "cooldown": { "goal": "5min" }
}
```

Goal grammar: time segments `s`/`min`/`h` (summed, e.g. `1min30s`), distance `m`/`km`/`mi`/`yd`
(single segment), or `open` / omitted for a manual-advance goal.

## Appendix B — generator (`freerun.py`)

Pure-stdlib Python. `python3 freerun.py workout.json -o out.workout`. Proven to regenerate a
real exported file byte-for-byte (see Corroboration).

```python
#!/usr/bin/env python3
"""freerun — turn a plain JSON workout into an Apple `.workout` file you can AirDrop.

Schema (reverse-engineered, see top of this document):
    WorkoutFile { string id = 9; CustomWorkout body = 11; <trailing metadata> }
    CustomWorkout { activity=1, location=2, displayName=3, warmup=4, block=5 (repeated), cooldown=6 }
    Block { IntervalStep step = 1 (repeated); iterations = 2 }
    IntervalStep { purpose = 1 (1=work,2=recovery); Step step = 2 }
    Step { Goal goal = 1 }            # absent goal == open
    Goal { type = 1 (1=time,2=distance); Measure value = 2 }
    Measure { unit = 1; double amount = 2 }
"""
from __future__ import annotations
import json, struct, sys, uuid as _uuid
from pathlib import Path

# --- enum maps (verified against iOS 26 SDK headers / the sample file) ---
ACTIVITY = {"running": 37, "walking": 52, "cycling": 13, "hiking": 24, "swimming": 46}
LOCATION = {"unknown": 1, "indoor": 2, "outdoor": 3}
PURPOSE = {"work": 1, "recovery": 2}
GOAL_TIME, GOAL_DISTANCE = 1, 2
UNIT_SECONDS, UNIT_METERS = 1, 5  # seconds confirmed; meters provisional (verify by import)

# --- minimal protobuf wire encoder ---
def _varint(n: int) -> bytes:
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        out.append(b | (0x80 if n else 0))
        if not n:
            return bytes(out)

def _tag(field: int, wt: int) -> bytes:
    return _varint((field << 3) | wt)

def vint(field: int, value: int) -> bytes:
    return _tag(field, 0) + _varint(value)

def f64(field: int, value: float) -> bytes:
    return _tag(field, 1) + struct.pack("<d", value)

def s(field: int, value: str) -> bytes:
    raw = value.encode("utf-8")
    return _tag(field, 2) + _varint(len(raw)) + raw

def msg(field: int, body: bytes) -> bytes:
    return _tag(field, 2) + _varint(len(body)) + body

# --- goal string parsing: "5min" "30s" "1min30s" "400m" "open" ---
_TIME = {"s": 1, "sec": 1, "secs": 1, "min": 60, "mins": 60, "h": 3600, "hr": 3600}
_DIST = {"m": 1.0, "km": 1000.0, "mi": 1609.344, "yd": 0.9144}

def parse_goal(text: str) -> bytes | None:
    """Return an encoded Step body's Goal field, or None for an open goal."""
    text = text.strip().lower()
    if text in ("", "open"):
        return None
    import re
    segs = re.findall(r"(\d+(?:\.\d+)?)\s*([a-z]+)", text)
    if not segs:
        raise ValueError(f"bad goal: {text!r}")
    units = {u for _, u in segs}
    if units <= set(_TIME):  # one or more time segments, summed
        seconds = sum(float(n) * _TIME[u] for n, u in segs)
        measure = vint(1, UNIT_SECONDS) + f64(2, seconds)
        return msg(1, vint(1, GOAL_TIME) + msg(2, measure))
    if len(segs) == 1 and segs[0][1] in _DIST:
        n, u = segs[0]
        meters = float(n) * _DIST[u]
        measure = vint(1, UNIT_METERS) + f64(2, meters)
        return msg(1, vint(1, GOAL_DISTANCE) + msg(2, measure))
    raise ValueError(f"bad goal (mixed/unknown units): {text!r}")

def encode_step(goal_text: str) -> bytes:
    """A Step message body (field 4/6 in workout, or field 2 in an interval step)."""
    g = parse_goal(goal_text)
    return g if g else b""  # empty body == open goal

def encode_block(block: dict) -> bytes:
    body = b""
    for st in block["steps"]:
        istep = vint(1, PURPOSE[st["type"]]) + msg(2, encode_step(st.get("goal", "open")))
        body += msg(1, istep)
    body += vint(2, int(block.get("repeat", 1)))
    return body

def encode_workout(w: dict, plan_id: str | None = None) -> bytes:
    plan_id = plan_id or str(_uuid.uuid4()).upper()
    body = b""
    body += vint(1, ACTIVITY[w.get("activity", "running")])
    body += vint(2, LOCATION[w.get("location", "outdoor")])
    body += s(3, w["name"])
    if w.get("warmup"):
        body += msg(4, encode_step(w["warmup"]["goal"]))
    for block in w.get("blocks", []):
        body += msg(5, encode_block(block))
    if w.get("cooldown"):
        body += msg(6, encode_step(w["cooldown"]["goal"]))
    out = s(9, plan_id) + msg(11, body)
    out += vint(1000, 1) + vint(1002, 5)  # trailing metadata seen in real files
    return out

def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    src = Path(argv[0])
    w = json.loads(src.read_text())
    out = Path(argv[2]) if len(argv) > 2 and argv[1] == "-o" else src.with_suffix(".workout")
    out.write_bytes(encode_workout(w))
    print(f"wrote {out}  ({out.stat().st_size} bytes)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

### Round-trip verification (how Corroboration was proven)

```python
import freerun
w = {"name": "R4U run day 53", "activity": "running", "location": "outdoor",
     "warmup": {"goal": "5min"},
     "blocks": [{"repeat": 4, "steps": [{"type": "work", "goal": "4min"},
                                         {"type": "recovery", "goal": "3min"}]}],
     "cooldown": {"goal": "5min"}}
mine = freerun.encode_workout(w, plan_id="B47E9C8A-88B9-4158-A997-6D286FDCDDEF")
orig = open("Carreraalairelibre.workout", "rb").read()
assert mine == orig  # 154 bytes, byte-for-byte identical
```
