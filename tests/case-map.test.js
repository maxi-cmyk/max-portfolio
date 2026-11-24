import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { caseStudyProjects } from "../src/data/projects.js";
import { renderCaseMap, renderTable } from "../src/components/case-map.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const text = (markup) =>
  markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/ :/g, ":");
const find = (slug) => caseStudyProjects.find((p) => p.slug === slug);

test("every case study is one page: a summary and one diagram", () => {
  for (const project of caseStudyProjects) {
    const { insights } = project;
    assert.ok(insights.summary, project.name);
    const map = renderCaseMap(insights);
    assert.match(map, /<figure class="case-map /, project.name);
    // Nothing is paged or lit any more.
    assert.doesNotMatch(map, /aria-current|case-map-n"/, project.name);
    for (const gone of ["howItWorks", "overview", "diagram"]) {
      assert.equal(gone in insights, false, `${project.name}: ${gone}`);
    }
  }
});

test("without JavaScript every case study shows the same content", () => {
  for (const project of caseStudyProjects) {
    const map = renderCaseMap(project.insights, 0);
    assert.ok(html.includes(map), project.name);
    // The static page's notes sit a heading level lower.
    if (/case-after-flow/.test(map)) {
      assert.match(map, /<h4>/, project.name);
      assert.match(renderCaseMap(project.insights), /<h3>/, project.name);
    }
  }
  assert.doesNotMatch(
    html,
    /full write-up|project-modal|case-transform-sketch/i,
  );
});

test("each layout draws its own shape", () => {
  assert.match(
    text(renderCaseMap(find("music-leds").insights)),
    /Microphone[\s\S]+Clean up[\s\S]+FFT[\s\S]+RGB LED[\s\S]+Red[\s\S]+Green[\s\S]+Blue/,
  );
  assert.match(
    renderCaseMap(find("music-leds").insights),
    /led-r[\s\S]+led-g[\s\S]+led-b/,
  );
  assert.match(
    text(renderCaseMap(find("conway-game-of-life").insights)),
    /Wrap[\s\S]+Read[\s\S]+Decide[\s\S]+Commit[\s\S]+LED matrix[\s\S]+React dashboard/,
  );
  const cya = renderCaseMap(find("cya").insights);
  assert.match(text(cya), /Frozen CLIP[\s\S]+Linear head[\s\S]+Raw score/);
  assert.match(cya, /<table>[\s\S]+99\.29%/);
  assert.match(
    text(renderCaseMap(find("timing-attack-lab").insights)),
    /Early exit[\s\S]+Constant time[\s\S]+Results: WIP/,
  );
  assert.match(
    text(renderCaseMap(find("itspeak").insights)),
    /Upload[\s\S]+Visual delivery[\s\S]+Voice delivery[\s\S]+Coaching cards/,
  );
  const sentinel = renderCaseMap(find("sentinel").insights);
  assert.equal(sentinel.match(/class="case-map-node/g).length, 4);
  assert.match(text(sentinel), /PIR node: Motion[\s\S]+ESP32-CAM: Resume/);
  assert.match(
    text(renderCaseMap(find("echo").insights)),
    /Pending review[\s\S]+stays out of the feed[\s\S]+Approved[\s\S]+can appear in the feed/,
  );
  assert.match(
    text(renderCaseMap(find("asteroids").insights)),
    /Shared C\+\+ engine[\s\S]+ESP32 handheld[\s\S]+Browser · WebAssembly/,
  );
});

test("results tables name their rows and escape their text", () => {
  const markup = renderTable({
    caption: "A <b> & c",
    head: ["", "Value"],
    rows: [["Rate", "6.4 kHz"]],
  });
  assert.match(markup, /<th scope="row">Rate<\/th><td>6\.4 kHz<\/td>/);
  assert.match(markup, /aria-label="A &lt;b> &amp; c"/);
  assert.doesNotMatch(markup, /<b>/);
  assert.equal(renderTable(undefined), "");
});
