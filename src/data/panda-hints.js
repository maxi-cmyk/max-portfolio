// What the panda says. Lowercase, short (eight words at most), and true of the
// screen it is said on. One list per window; a tap says the next line it has not
// said yet in this visit, so it never repeats itself. Edit freely.
export const PANDA_HINTS = {
  hub: ["try: open echo", "type help in the console", "try: led hello"],
  work: [
    "four of these have a 3D figure",
    "the case-study panel lists every step",
    "arrow keys walk through the projects",
  ],
  case: [
    "the numbered boxes jump between steps",
    "arrow keys step through too",
    "the full write-up is below",
  ],
  skills: ["tap a skill to see its projects"],
  credentials: ["more certificates are on the way"],
  contact: ["save the card to your contacts"],
};

// Lines for moments rather than screens.
export const PANDA_LINES = {
  greet: "hi. tap me for a hint",
  unknown: "try: help",
  led: "nice",
  asleep: "zzz",
  snack: "snack protocol armed",
};
