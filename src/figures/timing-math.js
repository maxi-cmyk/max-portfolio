// The timing lab's attack as data (Fig. 3, figures/timing-terminal.js plays
// it). Against the early-exit compare, each right leading character makes the
// reply slower; against the constant-time compare every reply is the same.
// Pure.

// The lab's own design: a 4-byte synthetic secret, and a vulnerable mode that
// sleeps 1 ms after each matching byte (its default).
export const SECRET_BYTES = 4;
export const DELAY_MS = 1;

export const SECRET = "bead";
export const BASE_MS = 50;
export const STEP_MS = 40;

// How many leading characters of a guess are right.
export const matching = (guess, secret = SECRET) => {
  let n = 0;
  while (n < guess.length && guess[n] === secret[n]) n += 1;
  return n;
};

// A few milliseconds of repeatable noise, so the replies look measured.
const jitter = (guess) =>
  ([...guess].reduce((sum, c, i) => sum + c.charCodeAt(0) * (i + 3), 0) % 5) -
  2;

export function replyMs(guess, constantTime = false) {
  const right = constantTime ? 0 : matching(guess);
  return BASE_MS + STEP_MS * right + jitter(guess);
}

const ROUNDS = [
  ["a", "b", "c"],
  ["ba", "bd", "be"],
  ["bea", "beb", "bec"],
  ["beac", "bead"],
];
const CONSTANT = ["a", "b", "c", "be"];

// The whole session as lines: a heading, guesses with their reply times, the
// character each round keeps, and the verdicts.
export function timingScript() {
  const lines = [{ kind: "head", text: "early-exit compare" }];
  ROUNDS.forEach((guesses, round) => {
    const replies = guesses.map((guess) => ({
      kind: "guess",
      guess,
      ms: replyMs(guess),
      round: round + 1,
    }));
    const slowest = replies.reduce((a, b) => (b.ms > a.ms ? b : a));
    slowest.slowest = true;
    lines.push(...replies);
    const found = matching(slowest.guess) === SECRET.length;
    lines.push({
      kind: found ? "done" : "keep",
      text: found
        ? `match: the secret is "${slowest.guess}"`
        : `slowest: "${slowest.guess}", keep it`,
    });
  });
  lines.push({ kind: "head", text: "constant-time compare" });
  lines.push(
    ...CONSTANT.map((guess) => ({
      kind: "guess",
      guess,
      ms: replyMs(guess, true),
      constant: true,
    })),
  );
  lines.push({ kind: "flat", text: "no slowest guess: nothing to rank" });
  return lines;
}
