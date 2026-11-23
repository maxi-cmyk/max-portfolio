// The panda's decisions, kept free of the DOM so they can be tested: which line
// to say, which pose to draw at each size, and how taps add up.

// The first line on this screen's list that has not been said in this visit, or
// null once they are all used: the panda never repeats itself.
export function nextHint(lines = [], said = new Set()) {
  return lines.find((line) => !said.has(line)) ?? null;
}

// The seated panda in the hero has every pose except peeking; a head peeking
// over a title bar has every pose except the two that need arms.
export function bodyPose(pose) {
  return pose === "peeking" ? "idle" : pose;
}
export function headPose(pose) {
  if (pose === "waving") return "happy";
  // While a figure loads it looks down at the window it sits on.
  if (pose === "working") return "peeking";
  return pose;
}

// Its resting pose when no reaction is playing: asleep after a minute without
// input, working while a figure loads, otherwise idle.
export function basePose({ asleep = false, working = false } = {}) {
  if (asleep) return "asleep";
  if (working) return "working";
  return "idle";
}

// Taps close together count up; a pause starts again from one.
export const STREAK_MS = 1200;
export function tapCount(count, lastAt, now) {
  return now - lastAt <= STREAK_MS ? count + 1 : 1;
}

// What a console result makes it do: a pose, for how long, and a line or none.
export function consoleReaction({ kind, unknown = false }) {
  if (kind === "panda") return { pose: "munching", ms: 1600, then: "happy" };
  if (kind === "led") return { pose: "happy", ms: 1400, line: "led" };
  if (kind === "error")
    return unknown
      ? { pose: "curious", ms: 1800, line: "unknown" }
      : { pose: "curious", ms: 1200 };
  if (kind === "clear") return null;
  return { pose: "happy", ms: 900 };
}
