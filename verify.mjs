// Byte-identity check: the JS encoder must reproduce a real exported file exactly.
// Run: node verify.mjs
import { encodeWorkout } from "./src/encoder.js";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

// Decoded parameters of a real exported file (Carreraalairelibre.workout).
const workout = {
  name: "R4U run day 53",
  activity: "running",
  location: "outdoor",
  warmup: { goal: "5min" },
  blocks: [{ repeat: 4, steps: [
    { type: "work", goal: "4min" },
    { type: "recovery", goal: "3min" },
  ] }],
  cooldown: { goal: "5min" },
};

const mine = encodeWorkout(workout, "B47E9C8A-88B9-4158-A997-6D286FDCDDEF");

const fixture = `${homedir()}/Downloads/Carreraalairelibre.workout`;
let orig;
try {
  orig = new Uint8Array(readFileSync(fixture));
} catch {
  console.log(`(no fixture at ${fixture} — skipping byte compare; generated ${mine.length} bytes)`);
  process.exit(0);
}

const identical = mine.length === orig.length && mine.every((b, i) => b === orig[i]);
console.log(`mine=${mine.length}B  orig=${orig.length}B  IDENTICAL=${identical}`);
if (!identical) {
  const i = [...mine].findIndex((b, i) => b !== orig[i]);
  console.log(`first diff at byte ${i}`);
  process.exit(1);
}
