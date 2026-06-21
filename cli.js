#!/usr/bin/env node
// ios-workout-generator CLI — JSON workout -> Apple `.workout` file.
//
//   bun cli.js workout.json [-o out.workout]
//   cat workout.json | bun cli.js [-o out.workout]
//   npx ios-workout-generator workout.json
import { encodeWorkout, workoutFilename } from "./src/encoder.js";
import { readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
let input = null;
let output = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "-o" || a === "--out") output = argv[++i];
  else if (a === "-h" || a === "--help") {
    console.log("usage: ios-workout-generator <workout.json> [-o out.workout]   (or pipe JSON via stdin)");
    process.exit(0);
  } else input = a;
}

const raw = input && input !== "-" ? readFileSync(input, "utf8") : readFileSync(0, "utf8");

let workout;
try {
  workout = JSON.parse(raw);
} catch (e) {
  console.error("invalid JSON:", e.message);
  process.exit(1);
}

let bytes;
try {
  bytes = encodeWorkout(workout);
} catch (e) {
  console.error("error:", e.message);
  process.exit(1);
}

const out = output || workoutFilename(workout.name);
writeFileSync(out, bytes);
console.error(`wrote ${out} (${bytes.length} bytes)`);
