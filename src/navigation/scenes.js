// Pure scene logic: which scene a route means, what a scene's URL is, where
// "up" goes, and a small state machine that stays correct when a new
// navigation interrupts one still animating. No DOM in this file.
import { allProjects } from "../data/projects.js";
import { projectHash, skillsHash, workHash } from "./routes.js";

export const SCENES = [
  "hub",
  "work",
  "case",
  "skills",
  "credentials",
  "contact",
];

const SECTION_SCENES = {
  home: "hub",
  terminal: "hub",
  certificates: "credentials",
  contact: "contact",
  skills: "skills",
};

const hubTarget = () => ({ scene: "hub" });

export function routeToScene(route) {
  switch (route?.kind) {
    case "work":
      return {
        scene: "work",
        slug: route.slug ?? null,
        categories: route.categories ?? [],
      };
    case "project":
      return { scene: "case", slug: route.slug };
    case "section":
      return {
        scene: SECTION_SCENES[route.id] ?? "hub",
        terminal: route.id === "terminal",
        ...(route.category ? { category: route.category } : {}),
      };
    default:
      return { ...hubTarget(), missing: true };
  }
}

export function sceneToHash(target) {
  switch (target.scene) {
    case "work":
      return workHash(target.categories ?? [], target.slug);
    case "case":
      return projectHash(target.slug);
    case "skills":
      return skillsHash(target.category);
    case "credentials":
      return "#certificates";
    case "contact":
      return "#contact";
    default:
      return "#home";
  }
}

export function scenePath({ scene, slug, categories, category }) {
  switch (scene) {
    case "work": {
      const folder = slug ?? (categories?.length === 1 ? categories[0] : "");
      return folder ? `~/work/${folder}` : "~/work";
    }
    case "case":
      return `~/work/${slug}/case`;
    case "skills":
      return category ? `~/skills/${category}` : "~/skills";
    case "credentials":
      return "~/credentials";
    case "contact":
      return "~/contact";
    default:
      return "~";
  }
}

// One step "up": a case study to its project, a project to the Selected work
// landing, every other scene to the hub. Hub has no parent.
export function parentScene(target) {
  if (target.scene === "hub") return null;
  if (target.scene === "skills" && target.category) return { scene: "skills" };
  if (target.scene === "work" && target.slug) {
    return { scene: "work", slug: null, categories: target.categories ?? [] };
  }
  if (target.scene === "case") {
    const inPager = allProjects.some((p) => p.slug === target.slug);
    return {
      scene: "work",
      slug: inPager ? target.slug : null,
      categories: [],
    };
  }
  return hubTarget();
}

// Same place on screen? (terminal and missing flags are not places.)
export function sameScene(a, b) {
  if (a.scene !== b.scene) return false;
  if (a.scene === "skills")
    return (a.category ?? null) === (b.category ?? null);
  if (a.scene === "work") {
    return (
      (a.slug ?? null) === (b.slug ?? null) &&
      (a.categories ?? []).join() === (b.categories ?? []).join()
    );
  }
  if (a.scene === "case") {
    return a.slug === b.slug;
  }
  return true;
}

// Phases: "idle" (settled) or "transitioning" (animation running).
// A newer go() always wins: the older settle() is then ignored, and the new
// navigation starts from whatever the interrupted one was heading to.
export function createSceneMachine(initial = hubTarget()) {
  let state = {
    ...initial,
    phase: "idle",
    seq: 0,
    from: null,
    interrupted: false,
  };
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => listener(state));
  return {
    get state() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Returns the sequence number, or null when the target is where we are.
    go(target, { animate = false } = {}) {
      const unchanged =
        sameScene(state, target) &&
        Boolean(state.terminal) === Boolean(target.terminal) &&
        Boolean(state.missing) === Boolean(target.missing);
      if (unchanged) return null;
      const seq = state.seq + 1;
      state = {
        ...target,
        phase: animate ? "transitioning" : "idle",
        seq,
        from: { scene: state.scene, slug: state.slug },
        interrupted: state.phase === "transitioning",
      };
      emit();
      return seq;
    },
    settle(seq) {
      if (seq !== state.seq || state.phase === "idle") return false;
      state = { ...state, phase: "idle", interrupted: false };
      emit();
      return true;
    },
  };
}
