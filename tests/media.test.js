import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { allProjects, isWip } from "../src/data/projects.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("every work card has a media slot that says what to supply", () => {
  for (const project of allProjects) {
    assert.ok(project.media?.length, project.name);
    for (const m of project.media) {
      assert.ok(
        ["photo", "screenshot", "video"].includes(m.kind),
        project.name,
      );
      assert.ok(m.want.length > 10, project.name);
      assert.ok(m.src && m.alt, project.name);
    }
  }
});

test("a filled media slot has real alt text and a file that exists", () => {
  for (const project of allProjects) {
    for (const m of project.media) {
      checkMedia(project, m);
    }
  }
});

function checkMedia(project, m) {
  {
    if (isWip(m.src)) return;
    // A clip becomes a slide in the exhibit, so it names itself.
    if (m.kind === "video")
      assert.ok(m.title, `${project.name}: a clip needs a title`);
    assert.ok(!isWip(m.alt), `${project.name}: alt text is still WIP`);
    assert.match(m.src, /^\/assets\/media\//, project.name);
    assert.ok(
      existsSync(new URL(`../public${m.src}`, import.meta.url)),
      `${project.name}: ${m.src} is missing from public/`,
    );
    if (m.poster) {
      assert.ok(
        existsSync(new URL(`../public${m.poster}`, import.meta.url)),
        `${project.name}: poster ${m.poster} is missing`,
      );
    }
  }
}

test("the static page shows a media slot only for real media, never a WIP frame", () => {
  const slots = [...html.matchAll(/<figure class="media[ "]/g)].length;
  const real = allProjects
    .flatMap((p) => p.media)
    .filter((m) => !isWip(m.src)).length;
  assert.equal(slots, real);
  assert.equal([...html.matchAll(/class="media media-wip"/g)].length, 0);
});
