import { test, expect, describe } from "bun:test";
import { encodeWorkout, workoutFilename } from "../src/encoder.js";

// ---- tiny protobuf decoder, just enough to assert structure ----
function decode(bytes) {
  const fields = {};
  let i = 0;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  function vary() {
    let shift = 0, v = 0, b;
    do { b = bytes[i++]; v += (b & 0x7f) * 2 ** shift; shift += 7; } while (b & 0x80);
    return v;
  }
  while (i < bytes.length) {
    const tag = vary(), field = tag >> 3, wt = tag & 7;
    let val;
    if (wt === 0) val = vary();
    else if (wt === 1) { val = dv.getFloat64(i, true); i += 8; }
    else if (wt === 2) { const n = vary(); val = bytes.slice(i, i + n); i += n; }
    else throw new Error(`wt ${wt}`);
    (fields[field] ??= []).push(val);
  }
  return fields;
}
const str = (u8) => new TextDecoder().decode(u8);
const body = (bytes) => decode(decode(bytes)[11][0]); // unwrap WorkoutFile.body (field 11)

const BASE = {
  name: "Run", activity: "running", location: "outdoor",
  warmup: { goal: "5min" },
  blocks: [{ repeat: 4, steps: [{ type: "work", goal: "4min" }, { type: "recovery", goal: "3min" }] }],
  cooldown: { goal: "5min" },
};

describe("golden file", () => {
  test("reproduces a real exported .workout byte-for-byte", () => {
    const hex =
      "4a2442343745394338412d383842392d343135382d413939372d3644323836464443444445465a6c082510031a0e52" +
      "34552072756e2064617920353322110a0f0801120b0801110000000000c072402a300a15080112110a0f0801120b08" +
      "01110000000000006e400a15080212110a0f0801120b0801110000000000806640100432110a0f0801120b08011100" +
      "00000000c07240c03e01d03e05";
    const golden = Uint8Array.from(hex.match(/../g).map((h) => parseInt(h, 16)));
    const mine = encodeWorkout(
      { name: "R4U run day 53", activity: "running", location: "outdoor",
        warmup: { goal: "5min" },
        blocks: [{ repeat: 4, steps: [{ type: "work", goal: "4min" }, { type: "recovery", goal: "3min" }] }],
        cooldown: { goal: "5min" } },
      "B47E9C8A-88B9-4158-A997-6D286FDCDDEF",
    );
    expect([...mine]).toEqual([...golden]);
  });
});

describe("structure", () => {
  test("activity / location / displayName map correctly", () => {
    const b = body(encodeWorkout(BASE));
    expect(b[1][0]).toBe(37);          // running
    expect(b[2][0]).toBe(3);           // outdoor
    expect(str(b[3][0])).toBe("Run");  // displayName
  });

  test("defaults to running + outdoor", () => {
    const b = body(encodeWorkout({ name: "x" }));
    expect(b[1][0]).toBe(37);
    expect(b[2][0]).toBe(3);
  });

  test("non-running activity (cycling=13, indoor=2)", () => {
    const b = body(encodeWorkout({ name: "x", activity: "cycling", location: "indoor" }));
    expect(b[1][0]).toBe(13);
    expect(b[2][0]).toBe(2);
  });

  test("repeated blocks and iterations", () => {
    const b = body(encodeWorkout({ name: "x", blocks: [
      { repeat: 4, steps: [{ type: "work", goal: "1min" }] },
      { repeat: 2, steps: [{ type: "recovery", goal: "1min" }] },
    ] }));
    expect(b[5]).toHaveLength(2);                 // two blocks
    expect(decode(b[5][0])[2][0]).toBe(4);        // first block iterations
    expect(decode(b[5][1])[2][0]).toBe(2);        // second block iterations
  });

  test("step purpose: work=1, recovery=2", () => {
    const block = decode(body(encodeWorkout(BASE))[5][0]);
    expect(decode(block[1][0])[1][0]).toBe(1);    // work
    expect(decode(block[1][1])[1][0]).toBe(2);    // recovery
  });

  test("warmup/cooldown omitted when absent", () => {
    const b = body(encodeWorkout({ name: "x", blocks: [] }));
    expect(b[4]).toBeUndefined();
    expect(b[6]).toBeUndefined();
  });

  test("default repeat is 1", () => {
    const block = decode(body(encodeWorkout({ name: "x", blocks: [{ steps: [{ type: "work", goal: "1min" }] }] }))[5][0]);
    expect(block[2][0]).toBe(1);
  });
});

describe("goals", () => {
  const warmGoal = (g) => decode(decode(body(encodeWorkout({ name: "x", warmup: { goal: g } }))[4][0])[1][0]);

  test("time goal: type=1, unit=1 (seconds), amount in seconds", () => {
    const goal = warmGoal("5min");
    expect(goal[1][0]).toBe(1);                              // GOAL_TIME
    expect(decode(goal[2][0])[1][0]).toBe(1);               // UNIT_SECONDS
    expect(decode(goal[2][0])[2][0]).toBe(300);             // 5min = 300s
  });

  test("compound + bare seconds are equivalent (1min30s == 90s)", () => {
    const ID = "00000000-0000-0000-0000-000000000000";
    expect([...encodeWorkout({ name: "x", warmup: { goal: "1min30s" } }, ID)])
      .toEqual([...encodeWorkout({ name: "x", warmup: { goal: "90s" } }, ID)]);
  });

  test("distance goal: type=2, amount in meters", () => {
    const goal = warmGoal("1km");
    expect(goal[1][0]).toBe(2);                              // GOAL_DISTANCE
    expect(decode(goal[2][0])[2][0]).toBe(1000);            // 1km = 1000m
  });

  test("miles convert to meters", () => {
    const goal = warmGoal("1mi");
    expect(decode(goal[2][0])[2][0]).toBeCloseTo(1609.344, 3);
  });

  test("open goal => empty step body (no goal field)", () => {
    const step = body(encodeWorkout({ name: "x", warmup: { goal: "open" } }))[4][0];
    expect(step).toHaveLength(0);
  });
});

describe("validation", () => {
  test("missing name throws", () => expect(() => encodeWorkout({})).toThrow(/name/));
  test("unknown activity throws", () => expect(() => encodeWorkout({ name: "x", activity: "flying" })).toThrow(/activity/));
  test("unknown location throws", () => expect(() => encodeWorkout({ name: "x", location: "space" })).toThrow(/location/));
  test("bad step type throws", () =>
    expect(() => encodeWorkout({ name: "x", blocks: [{ steps: [{ type: "sprint", goal: "1min" }] }] })).toThrow(/step type/));
  test("bad goal units throw", () =>
    expect(() => encodeWorkout({ name: "x", warmup: { goal: "5 bananas" } })).toThrow(/goal/));
  test("mixed time+distance throws", () =>
    expect(() => encodeWorkout({ name: "x", warmup: { goal: "1min400m" } })).toThrow(/goal/));
});

describe("planId", () => {
  test("provided id is uppercased and embedded", () => {
    const b = decode(encodeWorkout(BASE, "abc-123"));
    expect(str(b[9][0])).toBe("ABC-123");
  });
  test("auto-generated ids differ between calls", () => {
    const id = (x) => str(decode(x)[9][0]);
    expect(id(encodeWorkout(BASE))).not.toBe(id(encodeWorkout(BASE)));
  });
});

describe("workoutFilename", () => {
  test("sanitizes to <slug>.workout", () => {
    expect(workoutFilename("N2R · Day 1!")).toBe("N2R-Day-1.workout");
    expect(workoutFilename("")).toBe("workout.workout");
    expect(workoutFilename("  --weird-- ")).toBe("weird.workout");
  });
});
