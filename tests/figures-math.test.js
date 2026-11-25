import test from "node:test";
import assert from "node:assert/strict";
import {
  BINS,
  FS,
  N,
  TONES,
  bandOf,
  binFrequency,
  centerOfMass,
  exampleSignal,
  spectrum,
  windingPoints,
} from "../src/figures/winding-math.js";
import {
  HEIGHT,
  WIDTH,
  addGlider,
  emptyBoard,
  population,
  seedBoard,
  step,
} from "../src/figures/life.js";
import cyaPredictions from "../src/data/cya-predictions.json" with { type: "json" };
import { renderCyaOriginals } from "../src/figures/robustness.js";
import {
  BASE_MS,
  DELAY_MS,
  SECRET,
  SECRET_BYTES,
  STEP_MS,
  matching,
  replyMs,
  timingScript,
} from "../src/figures/timing-math.js";
import { FIGURES, defaultParams, figureFor } from "../src/data/figures.js";
import { allProjects } from "../src/data/projects.js";
import { createTorusFigure } from "../src/figures/torus.js";

test("the torus pauses generations and accepts manual changes while paused", () => {
  const figure = createTorusFigure({ navy: "#12376b", plum: "#7a2e5d", muted: "#545454" });
  const update = () => figure.update({
    dt: 0.2,
    pointer: { x: 0, y: 0 },
    orbit: { yaw: 0, pitch: 0 },
    still: false,
  });
  update();
  const running = figure.readout();
  figure.set("paused", true);
  update();
  assert.equal(figure.readout(), running);
  figure.set("glider", true);
  update();
  assert.match(figure.readout(), /^Generation 1 · 10 live cells$/);
  figure.set("reset", true);
  update();
  assert.match(figure.readout(), /^Generation 0 · 5 live cells$/);
  figure.set("paused", false);
  update();
  assert.match(figure.readout(), /^Generation 1 · 5 live cells$/);
});

test("the winding machine finds each tone at its own bin and nowhere else", () => {
  assert.equal(N, 128);
  assert.equal(FS, 6400);
  assert.equal(binFrequency(1), 50, "bins are 50 Hz apart");
  const spec = spectrum(exampleSignal());
  assert.equal(spec.length, BINS);
  const total = TONES.reduce((s, t) => s + t.amp, 0);
  for (const tone of TONES) {
    const k = tone.freq / 50;
    // The centre of mass is half the tone's (normalised) amplitude.
    assert.ok(
      Math.abs(spec[k] - tone.amp / 2 / total) < 1e-9,
      `${tone.freq} Hz`,
    );
  }
  const loud = spec
    .map((v, k) => [k, v])
    .filter(([, v]) => v > 1e-6)
    .map(([k]) => k);
  assert.deepEqual(
    loud,
    TONES.map((t) => t.freq / 50),
  );
});

test("winding at bin 0 is the raw signal, and the average is the DC level", () => {
  const signal = exampleSignal();
  const points = windingPoints(signal, 0);
  points.forEach(([x, y], i) => {
    assert.ok(Math.abs(x - signal[i]) < 1e-12 && Math.abs(y) < 1e-12);
  });
  const [cx] = centerOfMass(points);
  assert.ok(Math.abs(cx) < 1e-9, "the example signal has no DC offset");
});

test("each firmware band holds exactly the tone it should", () => {
  assert.equal(bandOf(150), "red");
  assert.equal(bandOf(600), "green");
  assert.equal(bandOf(1800), "blue");
  assert.equal(bandOf(0), null);
  assert.equal(bandOf(275), null, "between red and green");
  assert.equal(bandOf(3000), null, "above blue");
  assert.equal(bandOf(50), "red");
  assert.equal(bandOf(2500), "blue");
});

test("a glider travels across the wrapped board and comes home", () => {
  let cells = seedBoard();
  assert.equal(population(cells), 5);
  const start = cells.join("");
  cells = step(cells);
  assert.equal(population(cells), 5);
  // After 4 generations the glider has moved one cell down and to the right.
  let moved = seedBoard();
  for (let i = 0; i < 4; i++) moved = step(moved);
  assert.equal(moved.join(""), addGlider(emptyBoard(), 3, 2).join(""));
  // 32 columns × 8 rows: it is back where it began after lcm(32, 8) × 4 = 128 generations.
  cells = seedBoard();
  for (let i = 0; i < 128; i++) cells = step(cells);
  assert.equal(cells.join(""), start);
  assert.equal(cells.length, WIDTH * HEIGHT);
});

test("Life follows B3/S23: blinkers oscillate, blocks stay, lone cells die", () => {
  const board = emptyBoard();
  for (const x of [5, 6, 7]) board[3 * WIDTH + x] = 1;
  const flipped = step(board);
  assert.equal(population(flipped), 3);
  assert.equal(
    flipped[2 * WIDTH + 6] + flipped[3 * WIDTH + 6] + flipped[4 * WIDTH + 6],
    3,
  );
  assert.deepEqual([...step(flipped)], [...board]);
  const block = emptyBoard();
  for (const [x, y] of [
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
  ])
    block[y * WIDTH + x] = 1;
  assert.deepEqual([...step(block)], [...block]);
  const lone = emptyBoard();
  lone[0] = 1;
  assert.equal(population(step(lone)), 0);
  // Wrapping: a cell on one edge is a neighbour of the opposite edge.
  const wrap = emptyBoard();
  for (const y of [HEIGHT - 1, 0, 1]) wrap[y * WIDTH] = 1;
  assert.equal(step(wrap)[0 * WIDTH + 1], 1, "the seam is crossed");
});

test("cya records every example and shows the original predictions", () => {
  for (const sample of ["photo", "generated"]) {
    for (const edit of ["original", "jpeg", "blur", "resize"]) {
      const { score, sha256 } = cyaPredictions.images[`${sample}-${edit}.jpg`];
      assert.ok(Number.isFinite(score) && score >= 0 && score <= 1);
      assert.match(sha256, /^[a-f0-9]{64}$/);
    }
  }
  const originals = renderCyaOriginals();
  assert.match(originals, /photo-original.jpg[\s\S]+cya predicted <strong>Camera photo/);
  assert.match(originals, /generated-original.jpg[\s\S]+cya predicted <strong>AI-generated/);
  assert.match(originals, /140 of 141 correct/);
  // The generated image crosses the detector's decision threshold after JPEG.
  assert.ok(cyaPredictions.images["generated-jpeg.jpg"].score < 0.5);
});

test("the timing session gives the secret away only through the early exit", () => {
  assert.equal(SECRET.length, SECRET_BYTES);
  assert.equal(DELAY_MS, 1);
  assert.equal(matching("bex"), 2);
  // Each right leading character adds STEP_MS, give or take the jitter.
  for (const guess of ["a", "b", "be", "bea", "bead"]) {
    const expected = BASE_MS + STEP_MS * matching(guess);
    assert.ok(Math.abs(replyMs(guess) - expected) <= 2, guess);
    assert.ok(Math.abs(replyMs(guess, true) - BASE_MS) <= 2, guess);
  }
  const lines = timingScript();
  const guesses = lines.filter((l) => l.kind === "guess");
  // Every early-exit round's slowest guess is the right prefix.
  for (const line of guesses.filter((l) => l.slowest)) {
    assert.equal(matching(line.guess), line.guess.length, line.guess);
  }
  assert.ok(lines.some((l) => l.kind === "done" && l.text.includes(SECRET)));
  // Constant time: no guess stands out.
  const flat = guesses.filter((l) => l.constant).map((l) => l.ms);
  assert.ok(Math.max(...flat) - Math.min(...flat) <= 4);
  assert.equal(guesses.filter((l) => l.constant && l.slowest).length, 0);
});

test("every figure has controls the page can build and a caption that says what is real", () => {
  const slugs = new Set(allProjects.map((p) => p.slug));
  for (const [slug, figure] of Object.entries(FIGURES)) {
    assert.ok(slugs.has(slug), slug);
    assert.ok(figure.id && figure.title, slug);
    assert.ok(figure.caption.length > 60, slug);
    assert.equal(figureFor(slug), figure);
    const defaults = defaultParams(figure);
    for (const control of figure.controls) {
      assert.ok(["range", "toggle", "button", "select"].includes(control.type));
      if (control.type === "range") {
        assert.ok(
          control.min <= control.value && control.value <= control.max,
          control.id,
        );
      }
      if (control.type === "select") {
        assert.ok(
          control.options.some((o) => o.value === control.value),
          control.id,
        );
      }
    }
    assert.equal(typeof defaults, "object");
  }
  assert.equal(figureFor("echo"), null);
  assert.equal(figureFor("__proto__"), null);
  // Honesty: illustrations say so; real figures are cited.
  assert.match(FIGURES.cya.caption, /recorded.*exact image files/i);
  assert.match(FIGURES.cya.caption, /uncalibrated/i);
  assert.match(FIGURES["timing-attack-lab"].caption, /Illustrative/);
  assert.match(FIGURES["timing-attack-lab"].caption, /WIP/);
  assert.match(
    FIGURES["music-leds"].caption,
    /50–250 Hz red, 300–1000 Hz green, 1050–2500 Hz blue/,
  );
  assert.match(
    FIGURES["conway-game-of-life"].caption,
    /render[\s\S]+flat 32×8 LED matrix/,
  );
  // The timing and cya figures are drawn in HTML, not 3D.
  assert.equal(FIGURES["timing-attack-lab"].panel, true);
  assert.equal(FIGURES.cya.panel, true);
});
