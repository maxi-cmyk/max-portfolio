import {
  allProjects,
  caseStudyProjects,
  normalizeCategories,
  resolveCategory,
} from "../data/projects.js";
import { SKILL_CATEGORIES } from "../data/skill-stack.js";

// A project can ride along with a filter: #work?categories=a,b&project=slug
export function workHash(categories = [], slug = null) {
  const selected = normalizeCategories(categories);
  if (!selected.length) return slug ? `#work/${slug}` : "#work";
  const base = `#work?categories=${selected.join(",")}`;
  return slug ? `${base}&project=${slug}` : base;
}

export function projectHash(slug) {
  return `#project/${slug}`;
}

export function skillsHash(category) {
  return category ? `#skills/${category}` : "#skills";
}

const SECTION_IDS = ["home", "terminal", "certificates", "contact", "skills"];
const SECTION_ALIASES = { credentials: "certificates" };

// Hashes: #home #terminal #work #work/<slug> #work?categories=a,b
// #project/<slug> (the old #project/<slug>/<step> and /read links open it)
// #skills #certificates (also #credentials) #contact
// Retired category ids in #focus/... and ?categories= still resolve.
export function parseRoute(hash = "") {
  if (hash.startsWith("#skills/")) {
    const category = hash.slice("#skills/".length);
    return SKILL_CATEGORIES.some(({ id }) => id === category)
      ? { kind: "section", id: "skills", category }
      : { kind: "missing" };
  }
  if (hash === "#focus" || hash === "#work" || hash.startsWith("#work?")) {
    const query = new URLSearchParams(hash.split("?")[1] || "");
    const raw = (query.get("categories") || "").split(",").filter(Boolean);
    const resolved = raw.map(resolveCategory);
    if (resolved.some((id) => id === undefined)) return { kind: "missing" };
    const categories = normalizeCategories(resolved.filter(Boolean));
    const slug = query.get("project");
    if (slug !== null && !allProjects.some((p) => p.slug === slug)) {
      return { kind: "missing" };
    }
    return {
      kind: "work",
      categories,
      hash: workHash(categories, slug),
      ...(slug ? { slug } : {}),
    };
  }
  if (hash.startsWith("#work/")) {
    const slug = hash.slice(6);
    return allProjects.some((p) => p.slug === slug)
      ? { kind: "work", categories: [], hash: `#work/${slug}`, slug }
      : { kind: "missing" };
  }
  if (hash.startsWith("#focus/")) {
    const id = resolveCategory(hash.slice(7));
    if (id === undefined) return { kind: "missing" };
    const categories = id ? [id] : [];
    return { kind: "work", categories, hash: workHash(categories) };
  }
  if (hash.startsWith("#project/")) {
    const [slug, step, ...rest] = hash.slice(9).split("/");
    const project = caseStudyProjects.find((p) => p.slug === slug);
    if (!project || rest.length) {
      return { kind: "missing" };
    }
    if (step === undefined) return { kind: "project", slug };
    // Case studies were once paged; old step and full write-up links open the
    // one page.
    if (step === "read" || /^[1-9]\d?$/.test(step)) {
      return { kind: "project", slug, hash: projectHash(slug) };
    }
    return { kind: "missing" };
  }
  const raw = hash.slice(1) || "home";
  const id = Object.hasOwn(SECTION_ALIASES, raw) ? SECTION_ALIASES[raw] : raw;
  return SECTION_IDS.includes(id)
    ? { kind: "section", id }
    : { kind: "missing" };
}
