import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { BLIPS, soundFor } from "../src/components/sound.js";
import { getBootFrames, getBootTiming } from "../src/terminal/boot.js";

test("every blip is short and in a comfortable range", () => {
  for (const [name, notes] of Object.entries(BLIPS)) {
    const total = notes.reduce((sum, [, ms]) => sum + ms, 0);
    assert.ok(total <= 450, `${name} lasts ${total} ms`);
    for (const [hz, ms] of notes) {
      assert.ok(hz >= 400 && hz <= 2200, `${name}: ${hz} Hz`);
      assert.ok(ms >= 20 && ms <= 200, `${name}: ${ms} ms`);
    }
  }
});

test("a press picks the right blip, and plain text makes none", () => {
  const target = (matches) => ({
    closest: (selector) => matches.some((m) => selector.includes(m)),
  });
  assert.equal(soundFor(target([".light.red"])), "close");
  assert.equal(soundFor(target([".icon"])), "open");
  assert.equal(soundFor(target([".push"])), "tap");
  assert.equal(soundFor(target([])), null);
});

test("sound is off by default and the speaker is a real, named button", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(
    html,
    /class="menubar-sound"\s+aria-pressed="false"\s+aria-label="Sound effects"/,
  );
});

test("the start screen is short, in order, and says what the card does", () => {
  const frames = getBootFrames();
  const at = frames.map((f) => f.at);
  assert.deepEqual(
    at,
    [...at].sort((a, b) => a - b),
    "frames run in order",
  );
  assert.equal(at[0], 0);
  assert.ok(at.at(-1) <= 1600, `ends at ${at.at(-1)} ms`);
  assert.deepEqual(
    frames.map((f) => f.id),
    ["tap", "field", "wake", "done"],
  );
  assert.match(frames.map((f) => f.line).join("\n"), /13\.56 MHz/);
  const { grow, fallback } = getBootTiming();
  assert.ok(
    frames[2].at + grow <= frames[3].at,
    "the frame lands before the end",
  );
  assert.ok(fallback <= 3000);
});
