// Apple `.workout` (WorkoutKit plan) protobuf encoder.
//
// Isomorphic, dependency-free ES module — the package's core, shared by the
// browser UI, the `cli.js` command, and anyone who installs it from npm.
// Schema and corroboration: see findings.md. Verified byte-for-byte against a
// real exported `.workout` file (verify.mjs).

// --- enum maps (harvested from the iOS 26 SDK; see findings.md "Constants") ---
// The activity varint is the HKWorkoutActivityType raw value (running=37 confirmed
// on the wire; the rest follow from the same enum). Not every activity is valid for
// a custom workout — WorkoutKit gates that at runtime via CustomWorkout.supportsActivity.
const ACTIVITY = {
  americanFootball: 1, archery: 2, australianFootball: 3, badminton: 4,
  baseball: 5, basketball: 6, bowling: 7, boxing: 8,
  climbing: 9, cricket: 10, crossTraining: 11, curling: 12,
  cycling: 13, dance: 14, danceInspiredTraining: 15, elliptical: 16,
  equestrianSports: 17, fencing: 18, fishing: 19, functionalStrengthTraining: 20,
  golf: 21, gymnastics: 22, handball: 23, hiking: 24,
  hockey: 25, hunting: 26, lacrosse: 27, martialArts: 28,
  mindAndBody: 29, mixedMetabolicCardioTraining: 30, paddleSports: 31, play: 32,
  preparationAndRecovery: 33, racquetball: 34, rowing: 35, rugby: 36,
  running: 37, sailing: 38, skatingSports: 39, snowSports: 40,
  soccer: 41, softball: 42, squash: 43, stairClimbing: 44,
  surfingSports: 45, swimming: 46, tableTennis: 47, tennis: 48,
  trackAndField: 49, traditionalStrengthTraining: 50, volleyball: 51, walking: 52,
  waterFitness: 53, waterPolo: 54, waterSports: 55, wrestling: 56,
  yoga: 57, barre: 58, coreTraining: 59, crossCountrySkiing: 60,
  downhillSkiing: 61, flexibility: 62, highIntensityIntervalTraining: 63, jumpRope: 64,
  kickboxing: 65, pilates: 66, snowboarding: 67, stairs: 68,
  stepTraining: 69, wheelchairWalkPace: 70, wheelchairRunPace: 71, taiChi: 72,
  mixedCardio: 73, handCycling: 74, discSports: 75, fitnessGaming: 76,
  cardioDance: 77, socialDance: 78, pickleball: 79, cooldown: 80,
  swimBikeRun: 81, transition: 82, underwaterDiving: 83, other: 3000,
};
const LOCATION = { unknown: 1, indoor: 2, outdoor: 3 };
const PURPOSE  = { work: 1, recovery: 2 };
const GOAL_TIME = 1, GOAL_DISTANCE = 2;
const UNIT_SECONDS = 1, UNIT_METERS = 5; // seconds confirmed; meters provisional

// Step alert (Step field 2). Reverse-engineered and verified byte-for-byte against real
// exports (golden tests). Wire shape:
//   Alert{ metric=1, variant=2, target=<metric+2>{ <oneof> } }
//   metric: 2=speed, 3=cadence, 4=power, 5=heart rate. The target message lives at
//   field number (metric + 2): speed→4, cadence→5, power→6, heart rate→7.
//   variant: 1=threshold, 2=range, 3=zone. Within the target, sub-field 1 holds a single
//   value (threshold/zone), sub-field 2 holds a {lower,upper} range.
// Verified variants: HR zone, HR range, speed (pace)/cadence/power thresholds.
// Still uncaptured: range variants (speed/cadence/power), power zone, the .average metric.
const ALERT_METRIC = { speed: 2, cadence: 3, power: 4, heartRate: 5 };
const ALERT_VARIANT = { threshold: 1, range: 2, zone: 3 };
const HR_ZONE_MIN = 1, HR_ZONE_MAX = 5;

const TIME = { s: 1, sec: 1, secs: 1, min: 60, mins: 60, h: 3600, hr: 3600 };
const DIST = { m: 1, km: 1000, mi: 1609.344, yd: 0.9144 };

// --- minimal protobuf wire encoder ---
function concat(parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function varint(n) {
  const out = [];
  n = Math.trunc(n);
  do {
    const b = n % 128;
    n = Math.floor(n / 128);
    out.push(b | (n ? 0x80 : 0));
  } while (n);
  return Uint8Array.from(out);
}

const tag = (field, wt) => varint(field * 8 + wt);
const vint = (field, value) => concat([tag(field, 0), varint(value)]);

function f64(field, value) {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setFloat64(0, value, true); // little-endian
  return concat([tag(field, 1), buf]);
}

function str(field, value) {
  const raw = new TextEncoder().encode(value);
  return concat([tag(field, 2), varint(raw.length), raw]);
}

const msg = (field, body) => concat([tag(field, 2), varint(body.length), body]);

// --- goal parsing: "5min" "30s" "1min30s" "400m" "open" ---
function parseGoal(text) {
  text = String(text).trim().toLowerCase();
  if (text === "" || text === "open") return null;
  const segs = [...text.matchAll(/(\d+(?:\.\d+)?)\s*([a-z]+)/g)].map((m) => [parseFloat(m[1]), m[2]]);
  if (segs.length === 0) throw new Error(`bad goal: ${text}`);
  if (segs.every(([, u]) => u in TIME)) {
    const seconds = segs.reduce((s, [n, u]) => s + n * TIME[u], 0);
    const measure = concat([vint(1, UNIT_SECONDS), f64(2, seconds)]);
    return msg(1, concat([vint(1, GOAL_TIME), msg(2, measure)]));
  }
  if (segs.length === 1 && segs[0][1] in DIST) {
    const [n, u] = segs[0];
    const measure = concat([vint(1, UNIT_METERS), f64(2, n * DIST[u])]);
    return msg(1, concat([vint(1, GOAL_DISTANCE), msg(2, measure)]));
  }
  throw new Error(`bad goal (mixed/unknown units): ${text}`);
}

// Encode a step alert into its `Alert` body, or null when there's no alert.
// Currently only `{ type:"heartRateZone", zone:1..5 }` is supported (see ALERT_*).
// A Measure{ unit=1, amount=2 }. Used by goals, by speed targets (unit=m/s), and by the
// trailing per-metric "current" block that threshold alerts carry (amount fixed at 1.0).
function measure(unit, amount) { return concat([vint(1, unit), f64(2, amount)]); }

function encodeAlert(alert) {
  if (alert == null) return null;
  // The target message sits at field (metric + 2); within it, sub-field 1 = single value
  // (threshold/zone), sub-field 2 = range.
  const target = (metric, body) => msg(metric + 2, body);

  switch (alert.type) {
    case "heartRateZone": {
      const zone = Math.trunc(alert.zone);
      if (!(zone >= HR_ZONE_MIN && zone <= HR_ZONE_MAX)) {
        throw new Error(`heart-rate zone must be ${HR_ZONE_MIN}-${HR_ZONE_MAX}, got: ${alert.zone}`);
      }
      return concat([vint(1, ALERT_METRIC.heartRate), vint(2, ALERT_VARIANT.zone),
        target(ALERT_METRIC.heartRate, msg(1, vint(1, zone)))]);
    }
    case "heartRateRange": {
      const min = Number(alert.min), max = Number(alert.max);
      if (!(Number.isFinite(min) && Number.isFinite(max) && min >= 1 && max > min)) {
        throw new Error(`heart-rate range needs 1 <= min < max bpm, got: ${alert.min}-${alert.max}`);
      }
      const range = concat([msg(1, f64(1, min)), msg(2, f64(1, max))]); // bare bpm doubles, no unit
      return concat([vint(1, ALERT_METRIC.heartRate), vint(2, ALERT_VARIANT.range),
        target(ALERT_METRIC.heartRate, msg(2, range))]);
    }
    case "speed": { // pace, as metres/second; metric fixed to .current until a sample says otherwise
      const mps = Number(alert.mps);
      if (!(Number.isFinite(mps) && mps > 0)) throw new Error(`speed alert needs mps > 0, got: ${alert.mps}`);
      const spec = concat([msg(1, measure(1, mps)), msg(2, measure(1, 1))]); // value (m/s) + current block
      return concat([vint(1, ALERT_METRIC.speed), vint(2, ALERT_VARIANT.threshold),
        target(ALERT_METRIC.speed, msg(1, spec))]);
    }
    case "cadence": { // counts per minute (e.g. running steps/min); metric fixed to .current
      const spm = Math.trunc(alert.spm);
      if (!(spm > 0)) throw new Error(`cadence alert needs spm > 0, got: ${alert.spm}`);
      const spec = concat([vint(1, spm), msg(2, measure(2, 1))]); // count + current block
      return concat([vint(1, ALERT_METRIC.cadence), vint(2, ALERT_VARIANT.threshold),
        target(ALERT_METRIC.cadence, msg(1, spec))]);
    }
    case "power": { // watts; threshold spec is a bare Measure (no trailing current block, unlike speed)
      const watts = Number(alert.watts);
      if (!(Number.isFinite(watts) && watts > 0)) throw new Error(`power alert needs watts > 0, got: ${alert.watts}`);
      return concat([vint(1, ALERT_METRIC.power), vint(2, ALERT_VARIANT.threshold),
        target(ALERT_METRIC.power, msg(1, measure(1, watts)))]);
    }
    default:
      throw new Error(`unsupported alert type: ${alert.type}`);
  }
}

// A `Step` body: goal (field 1, absent == open) plus an optional alert (field 2).
function encodeStep(goalText, alert) {
  const parts = [];
  const goal = parseGoal(goalText);
  if (goal) parts.push(goal);
  const a = encodeAlert(alert);
  if (a) parts.push(msg(2, a));
  return parts.length ? concat(parts) : new Uint8Array(0); // empty body == open, no alert
}

function encodeBlock(block) {
  const parts = [];
  for (const st of block.steps) {
    if (!(st.type in PURPOSE)) throw new Error(`bad step type: ${st.type}`);
    const istep = concat([vint(1, PURPOSE[st.type]), msg(2, encodeStep(st.goal ?? "open", st.alert))]);
    parts.push(msg(1, istep));
  }
  parts.push(vint(2, Math.trunc(block.repeat ?? 1)));
  return concat(parts);
}

/** Encode a workout object into Apple `.workout` bytes (Uint8Array). */
export function encodeWorkout(w, planId) {
  if (!w || typeof w.name !== "string") throw new Error("workout needs a name");
  const activity = w.activity ?? "running";
  const location = w.location ?? "outdoor";
  if (!(activity in ACTIVITY)) throw new Error(`unknown activity: ${activity}`);
  if (!(location in LOCATION)) throw new Error(`unknown location: ${location}`);
  planId = (planId ?? crypto.randomUUID()).toUpperCase();

  const parts = [vint(1, ACTIVITY[activity]), vint(2, LOCATION[location]), str(3, w.name)];
  if (w.warmup) parts.push(msg(4, encodeStep(w.warmup.goal, w.warmup.alert)));
  for (const block of w.blocks ?? []) parts.push(msg(5, encodeBlock(block)));
  if (w.cooldown) parts.push(msg(6, encodeStep(w.cooldown.goal, w.cooldown.alert)));

  return concat([
    str(9, planId),
    msg(11, concat(parts)),
    vint(1000, 1), vint(1002, 5), // trailing metadata seen in real files
  ]);
}

/** A safe `<name>.workout` filename for download / Content-Disposition. */
export function workoutFilename(name) {
  const base = String(name || "workout").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "workout";
  return `${base}.workout`;
}
