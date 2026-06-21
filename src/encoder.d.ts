// Type definitions for ios-workout-generator's encoder.

export type Activity = "running" | "walking" | "cycling" | "hiking" | "swimming";
export type Location = "outdoor" | "indoor";
export type StepType = "work" | "recovery";

/** A goal string: time (`"30s"`, `"5min"`, `"1min30s"`), distance (`"400m"`, `"1km"`, `"1mi"`), or `"open"`. */
export type Goal = string;

export interface Step {
  goal: Goal;
}

export interface IntervalStep {
  type: StepType;
  /** Defaults to `"open"` if omitted. */
  goal?: Goal;
}

export interface Block {
  /** Number of times the step sequence repeats. Defaults to 1. */
  repeat?: number;
  steps: IntervalStep[];
}

export interface Workout {
  name: string;
  /** Defaults to `"running"`. */
  activity?: Activity;
  /** Defaults to `"outdoor"`. */
  location?: Location;
  warmup?: Step;
  blocks?: Block[];
  cooldown?: Step;
}

/**
 * Encode a workout into Apple `.workout` file bytes (a WorkoutKit plan).
 * @param planId Optional uppercased UUID; a random one is generated if omitted.
 */
export function encodeWorkout(workout: Workout, planId?: string): Uint8Array;

/** A safe `<name>.workout` filename for download / Content-Disposition. */
export function workoutFilename(name: string): string;
