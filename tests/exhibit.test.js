import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { allProjects } from "../src/data/projects.js";

// exhibit.js imports reduced-motion.js, which only touches matchMedia when
// asked; the slide plan itself is pure.
const { exhibitSlides } = await import("../src/components/exhibit.js");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const project = (slug) => allProjects.find((p) => p.slug === slug);

test("the exhibit shows a project's clips first, then its 3D figure", () => {
  const plan = (slug, figure) =>
    exhibitSlides(project(slug), figure).map(({ kind, title }) => [
      kind,
      title,
    ]);
  assert.deepEqual(plan("music-leds", "Fig. 2 · Winding machine"), [
    ["clip", "On the desk"],
    ["figure", "Fig. 2 · Winding machine"],
  ]);
  assert.deepEqual(plan("conway-game-of-life", "Fig. 4 · The 32×8 grid as a torus"), [
    ["clip", "Game of Life on the LED matrix"],
    ["figure", "Fig. 4 · The 32×8 grid as a torus"],
  ]);
  assert.deepEqual(plan("asteroids", null), [["clip", "Demo flight"]]);
  assert.deepEqual(plan("timing-attack-lab", "Fig. 3 · Timing attack"), [
    ["figure", "Fig. 3 · Timing attack"],
  ]);
  // A WIP photo slot is never a slide; no media and no figure is no panel.
  assert.deepEqual(plan("cya", "Fig. 5 · Robustness check"), [
    ["figure", "Fig. 5 · Robustness check"],
  ]);
  assert.deepEqual(plan("echo", null), []);
});

test("every card has a slot for the exhibit, and keeps its clips without JavaScript", () => {
  for (const p of allProjects) {
    const start = html.indexOf(`data-project-slug="${p.slug}"`);
    const card = html.slice(start, html.indexOf("</article>", start));
    assert.match(card, /<div class="project-main">/, p.name);
    assert.match(
      card,
      /<\/div>\s*<div class="project-exhibit" data-exhibit-slot><\/div>\s*$/,
      p.name,
    );
    for (const m of p.media) {
      if (m.src !== "WIP") assert.ok(card.includes(`src="${m.src}"`), p.name);
    }
  }
});
