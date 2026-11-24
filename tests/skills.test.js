import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allProjects, otherProjects } from "../src/data/projects.js";
import { getSkillGraph, skillId } from "../src/data/skills.js";
import { getSkillStack, groupSkillUses } from "../src/data/skill-stack.js";
import {
  parentScene,
  routeToScene,
  sceneToHash,
  sameScene,
} from "../src/navigation/scenes.js";
import { parseRoute, skillsHash } from "../src/navigation/routes.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const graph = getSkillGraph();

test("every skill is backed by at least one project", () => {
  assert.ok(graph.skills.length > 20);
  const ids = new Set(graph.projects.map((p) => p.id));
  for (const skill of graph.skills) {
    assert.ok(skill.projects.length >= 1, skill.label);
    assert.equal(skill.count, skill.projects.length, skill.label);
    for (const id of skill.projects)
      assert.ok(ids.has(id), `${skill.label}: ${id}`);
  }
});

test("every tag on every project becomes a skill, and skill ids are unique", () => {
  const labels = new Set(graph.skills.map((s) => s.label));
  for (const p of [...allProjects, ...otherProjects]) {
    for (const tag of p.tags) assert.ok(labels.has(tag), `${p.name}: ${tag}`);
  }
  const ids = graph.skills.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(skillId("C++"), "cpp");
  assert.equal(skillId("C"), "c");
  assert.equal(skillId("DFT / FFT"), "dft-fft");
});

test("every project link goes somewhere real", () => {
  for (const node of graph.projects) {
    if (node.external) {
      assert.match(node.href, /^https:\/\/github\.com\//);
    } else {
      assert.notEqual(parseRoute(node.href).kind, "missing", node.href);
    }
  }
});

test("category routes round-trip and go up to Skills", () => {
  const { categories } = getSkillStack();
  for (const { id } of categories) {
    const hash = skillsHash(id);
    const scene = routeToScene(parseRoute(hash));
    assert.equal(sceneToHash(scene), hash);
    assert.equal(sceneToHash(parentScene(scene)), "#skills");
    assert.equal(sameScene(scene, { scene: "skills" }), false);
  }
  for (const hash of ["#skills/", "#skills/nonsense", "#skills/ai/extra"]) {
    assert.equal(parseRoute(hash).kind, "missing");
  }
});

test("draft and missing notes go into the same bare evidence group", () => {
  const project = graph.projects.find(({ id }) => id === "cya");
  const draft = { project, text: "Draft note", draft: true };
  const missing = { project };
  const confirmed = { project, text: "Confirmed note" };
  assert.deepEqual(groupSkillUses([draft, confirmed, missing]), {
    documented: [confirmed],
    bare: [draft, missing],
  });
});

test("static Skills HTML has one row group per skill and hides single-project counts", () => {
  for (const { id, rows } of getSkillStack().categories) {
    const hash = skillsHash(id);
    assert.match(html, new RegExp(`href="${hash}"[^>]+aria-current="page"`));
    const page = html.match(
      new RegExp(
        `<section class="skills-page" id="${hash.slice(1)}"[^>]*>(.*?)</section>`,
        "s",
      ),
    )?.[1];
    assert.ok(page, hash);
    assert.match(page, /<table class="skills-table"><caption[^>]*>/);
    const groups = page.split('<tbody class="skills-group">').slice(1);
    assert.equal(groups.length, rows.length, hash);
    for (const row of rows) {
      const markup = groups.find((part) => part.includes(`id="use-${row.id}"`));
      assert.ok(markup, row.label);
      assert.match(
        markup,
        /^<tr class="skills-group-head"><th scope="rowgroup" colspan="2"/,
      );
      assert.equal(
        markup.match(/<span class="skills-project-count">(.*?)<\/span>/)?.[1],
        row.count > 1 ? `${row.count} projects` : undefined,
        row.label,
      );
      const trs = markup.split("<tr").slice(2);
      for (const use of row.uses) {
        const tr = trs.find((t) => t.includes(`href="${use.project.href}"`));
        assert.ok(tr, use.project.name);
        if (use.text && !use.draft) {
          assert.match(
            tr,
            /^><td>.*<\/a><\/td><td><span class="skills-note">/s,
          );
        } else {
          assert.match(tr, /class="is-bare">/);
          assert.doesNotMatch(tr, /skills-note/);
        }
        if (!use.project.external) {
          assert.ok(
            html.includes(`id="${use.project.href.slice(1)}"`),
            use.project.href,
          );
        }
      }
    }
  }
});
