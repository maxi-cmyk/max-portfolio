import test from "node:test";
import assert from "node:assert/strict";
import { BODIES, HEADS, MOVES, renderPanda } from "../src/data/panda.js";
import { PANDA_HINTS, PANDA_LINES } from "../src/data/panda-hints.js";
import {
  STREAK_MS,
  basePose,
  bodyPose,
  consoleReaction,
  headPose,
  nextHint,
  tapCount,
} from "../src/navigation/panda-model.js";

const check = (poses, width, height) => {
  for (const [name, rows] of Object.entries(poses)) {
    assert.equal(rows.length, height, `${name}: ${rows.length} rows`);
    rows.forEach((row, y) => {
      assert.equal(row.length, width, `${name}, row ${y}: "${row}"`);
      assert.match(row, /^[.kpmn]+$/, `${name}, row ${y}: "${row}"`);
    });
  }
};

test("every panda pose is a full grid in the palette", () => {
  check(HEADS, 16, 14);
  check(BODIES, 24, 24);
  check(MOVES, 24, 24);
  assert.match(renderPanda("roll", { size: "move" }), /px-panda-roll/);
});

test("panda poses render as crisp SVG with theme colour classes", () => {
  const svg = renderPanda("idle");
  assert.match(svg, /viewBox="0 0 16 14"/);
  assert.match(svg, /class="c-k"/);
  assert.match(renderPanda("waving", { size: "body" }), /viewBox="0 0 24 24"/);
  assert.throws(() => renderPanda("dancing"));
});

test("every window has a hint, and every line is short and lowercase", () => {
  for (const scene of [
    "hub",
    "work",
    "case",
    "skills",
    "credentials",
    "contact",
  ]) {
    assert.ok(PANDA_HINTS[scene]?.length, `${scene} has no hint`);
  }
  for (const line of [
    ...Object.values(PANDA_HINTS).flat(),
    ...Object.values(PANDA_LINES),
  ]) {
    assert.ok(line.split(/\s+/).length <= 8, `too long: ${line}`);
    assert.equal(line, line.toLowerCase().replace("3d", "3D"), line);
  }
});

test("hints never repeat in one visit", () => {
  const said = new Set();
  const lines = PANDA_HINTS.work;
  for (const expected of lines) {
    const line = nextHint(lines, said);
    assert.equal(line, expected);
    said.add(line);
  }
  assert.equal(nextHint(lines, said), null);
});

test("each size draws a pose it has", () => {
  for (const pose of [
    "idle",
    "blink",
    "curious",
    "happy",
    "munching",
    "asleep",
    "working",
    "waving",
    "peeking",
  ]) {
    assert.ok(BODIES[bodyPose(pose)], `body: ${pose}`);
    assert.ok(HEADS[headPose(pose)], `head: ${pose}`);
  }
  assert.match(renderPanda("idle", { rows: 11 }), /viewBox="0 0 16 11"/);
});

test("asleep outranks working, which outranks idle", () => {
  assert.equal(basePose({}), "idle");
  assert.equal(basePose({ working: true }), "working");
  assert.equal(basePose({ asleep: true, working: true }), "asleep");
});

test("quick taps count up and a pause starts again", () => {
  assert.equal(tapCount(0, -Infinity, 0), 1);
  assert.equal(tapCount(1, 1000, 1500), 2);
  assert.equal(tapCount(2, 1500, 1500 + STREAK_MS + 1), 1);
});

test("console results get a reaction, and unknown commands a pointer to help", () => {
  assert.deepEqual(consoleReaction({ kind: "error", unknown: true }), {
    pose: "curious",
    ms: 1800,
    line: "unknown",
  });
  assert.equal(consoleReaction({ kind: "led" }).line, "led");
  assert.equal(consoleReaction({ kind: "panda" }).then, "happy");
  assert.equal(consoleReaction({ kind: "clear" }), null);
  assert.equal(consoleReaction({ kind: "help" }).line, undefined);
});
