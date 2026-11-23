// Skills as evidence: every skill is a stack tag on a project, so a skill can
// never appear without a project behind it. Pure data; data/skill-stack.js
// sorts these into layers for the Skills window.
import { allProjects, focusCategories, otherProjects } from "./projects.js";

// Practice that backs the low-level skills but is not shown as a project.
export const practiceNode = {
  id: "practice",
  name: "Algorithms practice",
  kind: "practice",
  href: "https://github.com/maxi-cmyk/Python-to-C-logic-",
  external: true,
  note: "114 of 150 problems solved in Python, then re-implemented in C (as reported in the repository README).",
  categories: [],
  tags: ["Python", "C"],
};

export function skillId(label) {
  return label
    .toLowerCase()
    .replace(/\+\+/g, "pp")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getSkillGraph() {
  const projects = [
    ...allProjects.map((p) => ({
      id: p.slug,
      name: p.name,
      kind: "project",
      href: `#work/${p.slug}`,
      categories: p.categories,
      tags: p.tags,
    })),
    ...otherProjects.map((e) => ({
      id: e.id,
      name: e.name,
      kind: "other",
      href: e.id === "sentinel" ? "#project/sentinel" : e.links[0].url,
      external: e.id !== "sentinel",
      categories: e.categories,
      tags: e.tags,
    })),
    practiceNode,
  ];
  const order = Object.keys(focusCategories);
  const byLabel = new Map();
  for (const project of projects) {
    for (const tag of project.tags) {
      if (!byLabel.has(tag)) byLabel.set(tag, []);
      byLabel.get(tag).push(project);
    }
  }
  const skills = [...byLabel.entries()]
    .map(([label, linked]) => {
      const votes = new Map();
      for (const project of linked) {
        for (const id of project.categories) {
          votes.set(id, (votes.get(id) ?? 0) + 1);
        }
      }
      const group =
        [...votes.entries()].sort(
          (a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]),
        )[0]?.[0] ?? order[0];
      return {
        id: skillId(label),
        label,
        group,
        count: linked.length,
        projects: linked.map((p) => p.id),
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return {
    skills,
    projects,
    groups: order.map((id) => ({ id, label: focusCategories[id].label })),
  };
}
