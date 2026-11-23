import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { caseStudyProjects } from "../src/data/projects.js";
import { getCaseStudyView } from "../src/data/case-study-steps.js";
import { renderCaseMap, renderStepTable } from "../src/components/case-map.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const lit = (markup) => markup.match(/aria-current="step"/g)?.length ?? 0;
const text = (markup) => markup.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");

test("each mapped step lights the one box that names it", () => {
  for (const project of caseStudyProjects) {
    const { insights } = project;
    const view = getCaseStudyView(insights);
    if (insights.layout === "algorithm") {
      assert.match(renderCaseMap(insights, 1), /case-map--flow/, project.name);
      for (let n = 2; n <= view.length; n += 1) {
        assert.equal(renderCaseMap(insights, n), "", project.name);
      }
      continue;
    }
    assert.equal(
      lit(renderCaseMap(insights, 1)),
      0,
      `${project.name} overview`,
    );
    for (let n = 2; n <= view.length; n += 1) {
      const map = renderCaseMap(insights, n);
      assert.equal(lit(map), 1, `${project.name} step ${n}`);
      const current = map.match(
        /<li[^>]*aria-current="step"[^>]*>(.*?)<\/(?:b|li)>/,
      );
      assert.ok(
        text(current[1]).includes(view[n - 1].title),
        `${project.name} step ${n}: ${view[n - 1].title}`,
      );
    }
  }
});

test("step tables name their rows and escape their text", () => {
  const markup = renderStepTable({
    caption: "A <b> & c",
    head: ["", "Value"],
    rows: [["Rate", "6.4 kHz"]],
  });
  assert.match(markup, /<th scope="row">Rate<\/th><td>6\.4 kHz<\/td>/);
  assert.match(markup, /aria-label="A &lt;b> &amp; c"/);
  assert.doesNotMatch(markup, /<b>/);
  assert.equal(renderStepTable(undefined), "");
});

test("without JavaScript every case study shows the same steps", () => {
  for (const project of caseStudyProjects) {
    getCaseStudyView(project.insights).forEach((step, i) => {
      const title = step.title.replace(/&/g, "&amp;");
      assert.ok(
        html.includes(`<h4>${i + 1}. ${title}</h4>`),
        `${project.name}: ${step.title}`,
      );
    });
  }
  assert.doesNotMatch(html, /full write-up|project-modal/i);
});
