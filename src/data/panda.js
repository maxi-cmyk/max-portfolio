// The panda: the site's mascot, drawn as pixel grids in the same style as the
// desktop icons. Each pose is a list of rows, one character per pixel, so the
// art can be edited by hand:
//   .  empty        k  ink (ears, patches, arms)
//   p  paper (face, belly)   m  plum (cheeks)   n  navy (the keyboard)
// Two sizes: a 16×14 head for title bars and small spots, and a 24×24 seated
// panda for the hero. Pure: no DOM.
import { toSvg } from "./pixel-svg.js";

// ---------- Heads, 16 × 14 ----------

// The shared top: ears, crown and the upper face.
const CROWN = [
  "..kkk......kkk..",
  ".kkkkk....kkkkk.",
  ".kkkkkkkkkkkkkk.",
  ".kkppppppppppkk.",
  "kppppppppppppppk",
  "kppppppppppppppk",
];
// The lower face without a mouth, and the chin.
const CHIN = [".kppppppppppppk.", "..kppppppppppk..", "...kkkkkkkkkk..."];

// Eyes: three rows across the patches. The paper pixel is the eye's shine.
const EYES = {
  open: ["kppkkkppppkkkppk", "kpkkpkppppkpkkpk", "kpkkkkppppkkkkpk"],
  shut: ["kppkkkppppkkkppk", "kpkkkkppppkkkkpk", "kpkkkkppppkkkkpk"],
  left: ["kppkkkppppkkkppk", "kpkpkkppppkpkkpk", "kpkkkkppppkkkkpk"],
  down: ["kppkkkppppkkkppk", "kpkkkkppppkkkkpk", "kpkkpkppppkpkkpk"],
  // Happy eyes: a paper slit across each patch, as when smiling.
  happy: ["kppkkkppppkkkppk", "kpkppkppppkppkpk", "kpkkkkppppkkkkpk"],
};
// The nose and the mouth: two rows.
const MOUTH = {
  smile: ["kppkkppkkppkkppk", "kmppppkppkppppmk"],
  open: ["kppkkppkkppkkppk", "kmpppppkkpppppmk"],
  rest: ["kppkkppkkppkkppk", "kmppppppppppppmk"],
};

const head = (eyes, mouth, chin = CHIN) => [
  ...CROWN,
  ...EYES[eyes],
  ...MOUTH[mouth],
  ...chin,
];

export const HEADS = {
  idle: head("open", "smile"),
  blink: head("shut", "smile"),
  curious: head("left", "rest"),
  happy: head("happy", "open"),
  // Munching: a microchip (ink, with paper pins) held to its mouth.
  munching: head("down", "open", [
    ".kpppkkkkkkpppk.",
    "..kpkpkppkpkpk..",
    "...kkkkkkkkkk...",
  ]),
  // Asleep: eyes shut and the mouth at rest. The "// zzz" line says the rest.
  asleep: head("shut", "rest"),
  // Peeking: only the top of the head over an edge, eyes looking down, both
  // paws gripping the edge.
  peeking: [
    ...CROWN,
    ...EYES.down,
    "kppkkppkkppkkppk",
    "kkkkkkkkkkkkkkkk",
    ".kkk........kkk.",
    "................",
    "................",
  ],
};

// ---------- Seated panda, 24 × 24 ----------

const pad = (row) => `....${row}....`;
const BODY = [
  ".....kkkkkkkkkkkkkk.....",
  "....kkkkppppppppkkkk....",
  "...kkkkkppppppppkkkkk...",
  "...kkkkppppppppppkkkk...",
  "...kkkppppppppppppkkk...",
  "...kkkppppppppppppkkk...",
  "....kppppppppppppppk....",
  "...kkkkppppppppppkkkk...",
  "..kkkkkkppppppppkkkkkk..",
  "..kkkkkkkkkkkkkkkkkkkk..",
];

const seated = (face, body = BODY) => [...HEADS[face].map(pad), ...body];

// Working: both paws on a navy keyboard.
const TYPING = [
  ...BODY.slice(0, 4),
  "....kkkkppppppppkkkk....",
  "....kkknnnnnnnnnnkkk....",
  "....knnnnnnnnnnnnnnk....",
  ...BODY.slice(7),
];

// Waving: the right arm is raised beside the head.
const waving = () => {
  const rows = seated("happy");
  const arm = {
    6: "kk",
    7: "kkk",
    8: "kkk",
    9: "kkk",
    10: "kk",
    11: "kk",
    12: "kk",
    13: "kk",
  };
  for (const [y, ink] of Object.entries(arm)) {
    const row = rows[y].split("");
    [...ink].forEach((c, i) => (row[20 + i] = c));
    rows[y] = row.join("");
  }
  // The shoulder reaches the raised arm, and that side no longer hangs an arm.
  rows[14] = ".....kkkkkkkkkkkkkkkkk..";
  rows[15] = "....kkkkppppppppkk......";
  rows[16] = "...kkkkkppppppppkk......";
  return rows;
};

export const BODIES = {
  idle: seated("idle"),
  blink: seated("blink"),
  curious: seated("curious"),
  happy: seated("happy"),
  munching: seated("munching"),
  asleep: seated("asleep"),
  working: seated("curious", TYPING),
  waving: waving(),
};

// ---------- On the move, 24 × 24, facing right ----------

// Walking on all fours, seen from the side: two frames, legs together and legs
// apart. Facing left is the same art mirrored.
const SIDE = [
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "..............kkk.......",
  ".............kkkkk......",
  ".............kkkkkkkk...",
  "............kkpppppppk..",
  "............kpppppppppk.",
  "............kppppkkkpppk",
  "...kkkkkkkkkkppppkpkpppk",
  "..kpppppppkkkppppkkkpppk",
  "..kpppppppkkkkpppppppkkk",
  "..kpppppppkkkkkppppppk..",
  "..kpppppppkkkkkkkkkkk...",
  "..kppppppppkkkkk........",
  "..kppppppppkkkkk........",
  "..kkkkkpppkkkkkk........",
];
const LEGS = {
  together: [
    "...kkkk...kkkk..........",
    "...kkkk...kkkk..........",
    "...kkkk...kkkk..........",
    "..kkkkk..kkkkk..........",
    "........................",
  ],
  apart: [
    "..kkkk.....kkkk.........",
    ".kkkk.......kkkk........",
    ".kkkk.......kkkk........",
    "kkkk.........kkkk.......",
    "........................",
  ],
};

// Curled into a ball to roll: a paper disc with an ink rim, tucked paws, ears
// and a face, so a turn of the ball is easy to see.
function ball() {
  const size = 24;
  const c = 11.5;
  const rows = Array.from({ length: size }, () => Array(size).fill("."));
  const dot = (x, y, r, k) => {
    for (let j = 0; j < size; j += 1)
      for (let i = 0; i < size; i += 1)
        if ((i - x) ** 2 + (j - y) ** 2 <= r * r) rows[j][i] = k;
  };
  dot(c, c, 10.6, "k");
  dot(c, c, 9.6, "p");
  for (const deg of [35, 145, 215, 325]) {
    const a = (deg * Math.PI) / 180;
    dot(c + Math.cos(a) * 7.4, c + Math.sin(a) * 7.4, 2.4, "k");
  }
  dot(7.5, 9.5, 1.6, "k");
  dot(15.5, 9.5, 1.6, "k");
  rows[9][7] = "p";
  rows[9][15] = "p";
  rows[13][11] = "k";
  rows[13][12] = "k";
  rows[14][10] = "m";
  rows[14][13] = "m";
  return rows.map((row) => row.join(""));
}

export const MOVES = {
  walk1: [...SIDE, ...LEGS.together],
  walk2: [...SIDE, ...LEGS.apart],
  roll: ball(),
};

// ---------- Rendering ----------

const toGrid = (rows) =>
  rows.map((row) => [...row].map((c) => (c === "." ? null : c)));

// `rows` keeps only the top of a pose: a head peeking over a title bar shows
// its ears and eyes and nothing below.
export function renderPanda(pose, { size = "head", rows } = {}) {
  const art = { body: BODIES, head: HEADS, move: MOVES }[size]?.[pose];
  if (!art) throw new Error(`No ${size} pose "${pose}"`);
  const grid = toGrid(rows ? art.slice(0, rows) : art);
  return toSvg(grid, `px-panda px-panda-${size} px-panda-${pose}`);
}
