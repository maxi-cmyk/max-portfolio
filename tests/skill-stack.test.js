import test from "node:test";
import assert from "node:assert/strict";
import { getSkillGraph } from "../src/data/skills.js";
import {
  CONCEPT_TAGS,
  SKILL_CATEGORIES,
  getSkillStack,
} from "../src/data/skill-stack.js";

test("each project tag maps to one category or concept", () => {
  const { categories } = getSkillStack();
  const concepts = categories.find(({ id }) => id === "concepts");
  for (const { label, projects } of getSkillGraph().skills) {
    const homes = SKILL_CATEGORIES.filter(({ tags }) => tags.includes(label));
    const concept = concepts.rows.find(
      (row) => row.label === CONCEPT_TAGS[label],
    );
    assert.equal(homes.length + Number(Boolean(concept)), 1, label);
    if (concept) {
      assert.ok(
        projects.every((id) =>
          concept.uses.some(({ project }) => project.id === id),
        ),
      );
    }
  }
});

test("skill pages count distinct projects and show short evidence notes", () => {
  for (const category of getSkillStack().categories) {
    const projectIds = new Set();
    for (const row of category.rows) {
      assert.equal(
        row.count,
        new Set(row.uses.map(({ project }) => project.id)).size,
      );
      for (const use of row.uses) {
        projectIds.add(use.project.id);
        assert.ok(use.text, `${use.project.id} / ${row.label} has no phrase`);
        assert.ok(use.text.split(/\s+/).length <= 12, use.text);
      }
    }
    assert.equal(category.projectCount, projectIds.size, category.label);
  }
});

test("headlines are counted from real projects", () => {
  for (const h of getSkillStack().headlines) {
    assert.ok(h.count >= 1, h.text);
    assert.equal(h.count, h.projects.length);
  }
});
