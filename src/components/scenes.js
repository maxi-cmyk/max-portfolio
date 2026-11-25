import { allProjects, caseStudyProjects } from "../data/projects.js";
import { parseRoute, workHash } from "../navigation/routes.js";
import {
  createSceneMachine,
  parentScene,
  routeToScene,
  scenePath,
  sceneToHash,
} from "../navigation/scenes.js";
import { renderCaseMap } from "./case-map.js";
import { getWorkCategories, initWork, renderWork } from "./work.js";
import { initHeroTerminal } from "./hero-terminal.js";
import { initPalette } from "./palette-ui.js";
import { createLights } from "./lights.js";
import { figureFor } from "../data/figures.js";
import { renderControls } from "./figure-controls.js";
import { createExhibit, fillExhibit } from "./exhibit.js";
import {
  createWindowMemory,
  parseZoomed,
  toggleZoomed,
} from "../navigation/windows.js";
import { pickTransition } from "../navigation/transitions.js";
import { createTransitions } from "./transitions.js";
import { reduced } from "./reduced-motion.js";
import { initCertificates } from "./certificates.js";

const baseTitle = "Max Leong — Portfolio";
const instant = { behavior: "instant" };

// Scene -> the element that holds it, its heading, its desktop icon and its
// window title. The shell path is derived from the active scene.
const SCENE_ELEMENTS = {
  hub: {
    el: "#home",
    heading: "#site-title",
    icon: "work",
    title: "About Max",
  },
  work: {
    el: "#work",
    heading: "#work-title",
    icon: "work",
    title: "Work",
  },
  case: {
    el: "#case",
    heading: "#case-title",
    icon: "work",
    title: "Case study",
  },
  skills: {
    el: "#skills",
    heading: "#skills-title",
    icon: "skills",
    title: "Skills",
  },
  credentials: {
    el: "#certificates",
    heading: "#certificates-title",
    icon: "credentials",
    title: "Credentials",
  },
  contact: {
    el: "#contact",
    heading: "#contact-title",
    icon: "contact",
    title: "Contact",
  },
};

const $ = (selector) => document.querySelector(selector);

let machine;
let drawer;
let palette;
let workInfo = { slugs: [], index: 0, current: null };
let rendered = null;
let transitions;
let pendingDirection = 0;
let lastTrigger = null;
let promotedHeadings = [];
const memory = createWindowMemory();
const lightsByScene = new Map();
let zoomed = [];

function el(scene) {
  return $(SCENE_ELEMENTS[scene].el);
}

export function go(hash, { replace = false } = {}) {
  if (hash !== location.hash) {
    history[replace ? "replaceState" : "pushState"](history.state, "", hash);
  }
  handleRoute({ force: hash === location.hash });
}

function buildCaseScene() {
  const section = document.createElement("section");
  section.id = "case";
  section.className = "case";
  section.setAttribute("aria-labelledby", "case-title");
  section.hidden = true;
  section.innerHTML = `<div class="case-copy">
    <h2 id="case-title" tabindex="-1"></h2>
    <div class="case-note"><p id="case-body" class="case-body"></p></div>
    <div id="case-map"></div>
    <p id="case-links" class="case-actions"></p>
  </div>`;
  $("#landing-view").append(section);
}

// The Work window carries the exhibit: the open project's clips and its
// figure as slides (exhibit.js), placed in the open project's card.
function buildStages() {
  const scene = $("#work");
  if (!scene) return;
  const exhibit = createExhibit(`<div class="stage-body">
        <div class="figure-frame"><div class="figure-host" data-figure="" data-figure-state="idle"></div></div>
        <p class="figure-caption" data-caption></p>
        <div class="figure-controls" data-controls></div>
        <p class="figure-readout" data-readout></p>
      </div>`);
  const anchor = scene.querySelector(":scope > .statusbar");
  if (anchor) anchor.before(exhibit);
  else scene.append(exhibit);
}

const FIGURE_NUMBER = { winding: 2, terminal: 3, torus: 4, robustness: 5 };
const stageCleanup = new Map();

// The exhibit shows the open project's clips and figure, and moves into its
// card: after the summary on a phone, beside it on a laptop (exhibit.css).
function updateStage(slug) {
  const stage = $("#work .exhibit");
  if (!stage) return;
  updateFigure(stage, slug);
  const figure = figureFor(slug);
  fillExhibit(
    stage,
    allProjects.find((p) => p.slug === slug),
    figure ? `Fig. ${FIGURE_NUMBER[figure.id]} · ${figure.title}` : null,
  );
  const slot = $("#work-projects > :not([hidden]) [data-exhibit-slot]");
  if (slot && stage.parentElement !== slot) slot.append(stage);
}

// Swaps the figure slide to the project's figure: a 3D figure drawn by the
// shared stage into the host, or a panel (HTML and 2D canvas) beside it.
function updateFigure(stage, slug) {
  const host = stage.querySelector(".figure-host");
  const frame = stage.querySelector(".figure-frame");
  const figure = figureFor(slug);
  if ((figure?.id ?? "") === (stage.dataset.figureId ?? "")) return;
  stageCleanup.get(stage)?.();
  stageCleanup.delete(stage);
  stage.dataset.figureId = figure?.id ?? "";
  frame.classList.toggle("is-panel", Boolean(figure?.panel));
  stage.querySelector("[data-caption]").textContent = figure?.caption ?? "";
  stage.querySelector("[data-readout]").textContent = "";
  stage.querySelector("[data-controls]").replaceChildren();
  const want = figure && !figure.panel ? figure.id : "";
  if (host.dataset.figure !== want) {
    if (want) {
      const fallback = $(
        "#work-projects > :not([hidden]) [data-figure-fallback]",
      );
      host.replaceChildren(fallback?.content.cloneNode(true) ?? "");
      host.dataset.figureState = "waiting";
    }
    host.dataset.figure = want;
    window.dispatchEvent(
      new CustomEvent("portfolio:figure", { detail: { host } }),
    );
  }
  if (!figure) return;
  const cleanups = [];
  if (figure.panel) {
    const panel = document.createElement("div");
    panel.className = "figure-panel";
    frame.append(panel);
    let live = true;
    let unmount = null;
    import("../figures/panels.js").then(({ mountPanel }) => {
      if (live) unmount = mountPanel(figure.id, panel, { host, stage });
    });
    cleanups.push(() => {
      live = false;
      unmount?.();
      panel.remove();
    });
  }
  cleanups.push(
    renderControls(stage.querySelector("[data-controls]"), host, figure),
  );
  stageCleanup.set(stage, () => cleanups.forEach((done) => done?.()));
}

// Every scene except the desktop is a window: a striped title bar with a close
// box. The close box goes one level up, like Esc.
function buildTitleBars() {
  zoomed = parseZoomed(sessionStorageGet("zoomed"));
  for (const [scene, { el: selector, title, icon }] of Object.entries(
    SCENE_ELEMENTS,
  )) {
    if (scene === "hub") continue;
    const node = $(selector);
    if (!node || node.querySelector(":scope > .titlebar")) continue;
    const lights = createLights({
      name: title,
      onClose: () => goUp(),
      onMinimize: () => minimize(scene, icon),
      onZoom: () => toggleZoom(scene),
    });
    const bar = document.createElement("div");
    bar.className = "titlebar";
    bar.innerHTML =
      '<span class="titlebar-title" aria-hidden="true"><span class="titlebar-prefix">max@portfolio:</span><span class="titlebar-folder"></span><span class="titlebar-path"></span><span class="titlebar-suffix"></span></span>';
    bar.prepend(lights.el);
    node.prepend(bar);
    lightsByScene.set(scene, lights);
    node.classList.toggle("is-zoomed", zoomed.includes(scene));
    lights.setZoomed(zoomed.includes(scene));
  }
}

function renderWindowPath(state) {
  if (state.scene === "hub") return;
  const path = scenePath(state);
  const label = el(state.scene).querySelector(
    ":scope > .titlebar .titlebar-title",
  );
  const folder = path.startsWith("~/work/") ? "~/work/" : "";
  const suffix = state.scene === "case" ? "/case" : "";
  const leaf = path.slice(folder.length, path.length - suffix.length);
  label.title = `max@portfolio:${path}`;
  label.classList.toggle("is-long-path", Boolean(folder) && path.length > 21);
  label.querySelector(".titlebar-folder").textContent = folder;
  label.querySelector(".titlebar-path").textContent = leaf;
  label.querySelector(".titlebar-suffix").textContent = suffix;
}

function sessionStorageGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function toggleZoom(scene) {
  zoomed = toggleZoomed(zoomed, scene);
  const on = zoomed.includes(scene);
  el(scene)?.classList.toggle("is-zoomed", on);
  lightsByScene.get(scene)?.setZoomed(on);
  try {
    sessionStorage.setItem("zoomed", JSON.stringify(zoomed));
  } catch {
    // Private mode: zoom simply is not remembered.
  }
}

// Minimizing parks the window under its desktop icon; opening the icon again
// brings it back exactly where it was.
function minimize(scene, iconKey) {
  memory.minimize(iconKey, location.hash);
  go("#home");
}

function syncIcons() {
  document.querySelectorAll("[data-icon]").forEach((node) => {
    if (node.dataset.icon === "terminal") return;
    const parked = memory.has(node.dataset.icon);
    node.classList.toggle("is-minimized", parked);
    const note = node.querySelector(".icon-state");
    if (parked && !note) {
      node.insertAdjacentHTML(
        "beforeend",
        '<span class="icon-state visually-hidden"> (window minimized)</span>',
      );
    } else if (!parked) note?.remove();
  });
}

// A case study is one page: the summary, the project's diagram and notes,
// then its links.
function renderCase(state) {
  const project = caseStudyProjects.find((p) => p.slug === state.slug);
  $("#case").classList.add("is-single-page");
  $("#case-title").textContent = project.name;
  $("#case-body").textContent = project.insights.summary;
  $("#case-map").innerHTML = renderCaseMap(project.insights);
  $("#case-links").innerHTML = [
    ...(project.live ? [project.live] : []),
    ...project.links,
  ]
    .map(
      (l) =>
        `<a class="terminal-link" href="${l.url}" target="_blank" rel="noreferrer">${l.label === "github" ? "Source" : l.label} ↗</a>`,
    )
    .join("");
  return { project };
}

function describe(state, info) {
  switch (state.scene) {
    case "hub":
      return { title: baseTitle, say: "Home" };
    case "work": {
      if (!info.current) {
        return {
          title: `Selected work — ${baseTitle}`,
          say: "Selected work. Choose a project to open.",
        };
      }
      const name = allProjects.find((p) => p.slug === info.current).name;
      return {
        title: `${name} — ${baseTitle}`,
        say: `Work. Project ${workInfo.index + 1} of ${workInfo.slugs.length}: ${name}.`,
      };
    }
    case "case":
      return {
        title: `${info.project.name} — ${baseTitle}`,
        say: `${info.project.name} case study.`,
      };
    case "skills":
      return {
        title: `${info.name} — ${baseTitle}`,
        say: state.category ? `Skills. ${info.name}.` : info.name,
      };
    default: {
      const names = {
        credentials: "Credentials",
        contact: "Contact",
      };
      return {
        title: `${names[state.scene]} — ${baseTitle}`,
        say: names[state.scene],
      };
    }
  }
}

function renderSkills(category) {
  const skills = el("skills");
  const headingId = category ? `skills-title-${category}` : "skills-title";
  skills.querySelector("[data-skills-landing]").hidden = Boolean(category);
  skills.querySelectorAll("[data-skill-page]").forEach((page) => {
    page.hidden = page.dataset.skillPage !== category;
  });
  skills.setAttribute("aria-labelledby", headingId);
  const heading = document.getElementById(headingId);
  return { heading, name: heading.textContent };
}

// The static page has one site title. An open window has its own heading
// hierarchy, including a project or Skills detail where one is selected.
function promoteHeadings(heading, region) {
  for (const previous of promotedHeadings) previous.removeAttribute("aria-level");
  promotedHeadings = [];
  if (!heading || heading.tagName === "H1") return;

  const base = Number(heading.tagName[1]);
  for (const node of region.querySelectorAll("h2, h3, h4, h5, h6")) {
    const level = Number(node.tagName[1]);
    if (node !== heading && level <= base) continue;
    node.setAttribute("aria-level", String(level - base + 1));
    promotedHeadings.push(node);
  }
}

function render(state, { initial = false } = {}) {
  const key = `${state.scene}|${state.slug ?? state.category ?? ""}`;
  const changed = rendered !== key;
  const returningFromCase =
    state.scene === "work" && state.slug && rendered === `case|${state.slug}`;
  rendered = key;

  document.documentElement.dataset.scene = state.scene;
  window.dispatchEvent(new Event("portfolio:scene"));
  if (state.scene !== "hub") memory.clear(SCENE_ELEMENTS[state.scene].icon);
  syncIcons();
  for (const [scene, { el: selector }] of Object.entries(SCENE_ELEMENTS)) {
    const node = $(selector);
    if (node) node.hidden = scene !== state.scene;
  }
  $("#route-notice").hidden = !state.missing;

  let info = {};
  if (state.scene === "work") {
    workInfo = renderWork(state.categories ?? [], state.slug);
    info = {
      current: workInfo.current,
      heading: $("#work-projects > :not([hidden]) .project-card-title"),
    };
  }
  if (state.scene === "case") info = renderCase(state);
  if (state.scene === "skills") info = renderSkills(state.category);
  if (state.scene === "credentials") initCertificates();
  const heading = info.heading ?? $(SCENE_ELEMENTS[state.scene].heading);
  promoteHeadings(
    heading,
    heading?.closest(".full-project-card, [data-skill-page]") ?? el(state.scene),
  );
  // A filter can fall back to another card, so use the project actually shown.
  renderWindowPath(
    state.scene === "work" ? { ...state, slug: workInfo.current } : state,
  );
  if (state.scene === "work") updateStage(workInfo.current);

  if (state.terminal) drawer.open();
  else if (drawer.isOpen() && changed) drawer.close();

  const { title, say } = describe(state, info);
  document.title = state.missing ? `Page not found — ${baseTitle}` : title;
  $("#scene-status").textContent = state.missing
    ? "That page could not be found."
    : say;

  const usingPopup = document.activeElement?.closest?.(".popup");
  if (changed && !initial && !usingPopup) {
    const opener = returningFromCase && document.getElementById(`case-study-work-${state.slug}`);
    if (opener?.getClientRects().length) {
      opener.focus();
    } else {
      (state.missing ? $("#route-notice") : heading)?.focus({ preventScroll: true });
      el(state.scene)?.scrollTo?.({ top: 0, ...instant });
    }
  }
}

// ---------- What travels in a transition (view-transitions.css) ----------
const shown = (selector, root = document) =>
  [...root.querySelectorAll(selector)].find(
    (node) => node.getClientRects().length,
  ) ?? null;

// The box a page fills: its whole window when it opens from the desktop or
// another window, or just the part that changed inside the same window.
function pageBox(state, inside) {
  if (!inside) return el(state.scene);
  if (state.scene === "work" && state.slug)
    return shown("#work-projects > article:not([hidden])");
  if (state.scene === "skills" && state.category)
    return shown("#skills [data-skill-page]:not([hidden]) .skills-paper");
  return el(state.scene);
}

// The control on the parent page that opens `state`: a desktop icon, a Work
// tile, a Skills tile or a project's case-study link.
function openerOf(state, parent) {
  if (parent.scene === "hub")
    return $(
      `#home .icon[data-icon="${SCENE_ELEMENTS[state.scene].icon}"] .px-icon`,
    );
  if (state.scene === "case")
    return shown(`#work-projects a[href^="#project/${state.slug}"]`);
  if (state.scene === "work")
    return shown(`#work-landing [data-tile-slug="${state.slug}"] .work-tile`);
  if (state.scene === "skills")
    return shown(`#skills .skills-tile[href="#skills/${state.category}"]`);
  return null;
}

function transitionPairs(kind, from, to) {
  const inside = from.scene === to.scene;
  const clicked =
    lastTrigger?.el?.isConnected &&
    performance.now() - lastTrigger.at < 800 &&
    lastTrigger.el.getClientRects().length
      ? lastTrigger.el
      : null;
  if (kind === "open") {
    // A desktop icon's picture travels, not its label (or the note beside it).
    const source = clicked?.querySelector(".px-icon") ?? clicked;
    return {
      old: () => [[source ?? openerOf(to, from), "vt-window"]],
      new: () => [[pageBox(to, inside), "vt-window"]],
    };
  }
  if (kind === "close") {
    return {
      old: () => [[pageBox(from, inside), "vt-window"]],
      new: () => [[openerOf(from, to), "vt-window"]],
    };
  }
  // Sideways: project to project, the card slides.
  const marks = () =>
    to.scene === "work" ? [[pageBox(to, true), "vt-slide"]] : [];
  if (kind.startsWith("slide")) return { old: marks, new: marks };
  // Skills category to category: the paper stays, the current tab moves.
  if (inside && to.scene === "skills") {
    const page = () => [
      [pageBox(to, true), "vt-paper"],
      [
        shown("#skills [data-skill-page]:not([hidden]) [aria-current='page']"),
        "vt-tab",
      ],
    ];
    return { old: page, new: page };
  }
  return null;
}

// Where an opening window grows from: the control that was just used.
function triggerRect() {
  if (lastTrigger && performance.now() - lastTrigger.at < 800) {
    return lastTrigger.rect;
  }
  return null;
}

function handleRoute({ initial = false, force = false } = {}) {
  const route = parseRoute(location.hash);
  const target = routeToScene(route);
  if (route.hash && location.hash !== route.hash) {
    history.replaceState(history.state, "", route.hash);
  }
  const before = { ...machine.state };
  const kind = pickTransition(before, target, {
    initial,
    direction: pendingDirection,
    order: workInfo.slugs,
  });
  pendingDirection = 0;
  const seq = machine.go(target, { animate: kind !== "none" });
  if (!(initial || force || seq !== null)) return;

  const apply = () => render(machine.state, { initial });
  if (kind === "none" || seq === null) {
    transitions.cancel();
    apply();
    machine.settle(machine.state.seq);
    settled();
    return;
  }
  const sceneEl =
    target.scene === "work" ? $("#work-projects") : el(target.scene);
  const inside = before.scene === target.scene;
  const betweenProjectAndCase =
    (before.scene === "work" && target.scene === "case") ||
    (before.scene === "case" && target.scene === "work");
  transitions
    .run(kind, {
      apply,
      compact: inside || betweenProjectAndCase,
      pairs: transitionPairs(kind, before, target),
      scene: kind.startsWith("slide") || inside ? sceneEl : el(target.scene),
      source: kind === "open" ? triggerRect() : null,
      from: kind === "close" ? el(before.scene) : null,
    })
    .then(() => {
      machine.settle(seq);
      settled();
    });
}

// The motion has finished: things that wait for a still window can appear.
const settled = () => window.dispatchEvent(new Event("portfolio:settled"));

// Sideways moves (project to project) replace the history entry,
// so Back leaves the scene instead of paging through every card.
function sideways(hash) {
  go(hash, { replace: true });
}

function neighbour(direction) {
  const { scene } = machine.state;
  if (scene === "work" && workInfo.current && workInfo.slugs.length) {
    pendingDirection = direction;
    const i =
      (workInfo.index + direction + workInfo.slugs.length) %
      workInfo.slugs.length;
    sideways(workHash(getWorkCategories(), workInfo.slugs[i]));
  }
}

function goUp() {
  const up = parentScene(machine.state);
  if (up) go(sceneToHash(up));
}

function wireInput() {
  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || anchor.getAttribute("href") === "#") return;
    event.preventDefault();
    lastTrigger = {
      el: anchor,
      rect: anchor.getBoundingClientRect(),
      at: performance.now(),
    };
    const iconKey = anchor.closest("[data-icon]")?.dataset.icon;
    const parked = iconKey && memory.restore(iconKey);
    const label = anchor.getAttribute("aria-label") ?? "";
    pendingDirection = /^Next/.test(label)
      ? 1
      : /^Previous/.test(label)
        ? -1
        : 0;
    go(parked || anchor.getAttribute("href"), {
      replace: anchor.hasAttribute("data-sideways"),
    });
  });
  window.addEventListener("hashchange", () => handleRoute());
  document.addEventListener("change", (event) => {
    const select = event.target;
    if (select.id === "work-group") {
      // Switching group inside a project opens that group's first project.
      const cats =
        select.value && select.value !== "__multi" ? [select.value] : [];
      const first = allProjects.find(
        (p) => !cats.length || p.categories.some((c) => cats.includes(c)),
      );
      go(workHash(cats, first?.slug ?? null));
    } else if (select.id === "work-jump") {
      sideways(workHash(getWorkCategories(), select.value));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const palettable =
      (event.key === "k" || event.key === "K") &&
      (event.metaKey || event.ctrlKey);
    if (palettable) {
      event.preventDefault();
      palette.open();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (document.fullscreenElement || document.querySelector("dialog[open]")) return;
    const control = event.target.closest?.(
      "input, textarea, select, video, audio, button, summary, [contenteditable], [role='listbox'], [role='combobox']",
    );
    if (control && (event.key !== "Escape" || !drawer.isOpen())) return;
    if (event.key === "ArrowLeft") neighbour(-1);
    else if (event.key === "ArrowRight") neighbour(1);
    else if (event.key === "Escape") {
      if (drawer.isOpen()) drawer.close({ restoreFocus: true });
      else goUp();
    }
  });

  // Touch swipes mirror the visible buttons; they stay off the screen edges so
  // they never fight the browser's own Back swipe.
  let start = null;
  const zone = (event) => event.target.closest?.("#work-projects");
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || !zone(event)) return;
    if (event.target.closest(".figure-host.is-turning")) return;
    const edge = 28;
    if (event.clientX < edge || event.clientX > window.innerWidth - edge)
      return;
    start = { x: event.clientX, y: event.clientY };
  });
  document.addEventListener("pointerup", (event) => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      neighbour(dx < 0 ? 1 : -1);
    }
  });
  document.addEventListener("pointercancel", () => (start = null));
}

export function initScenes() {
  document.documentElement.classList.add("is-scenes");
  history.scrollRestoration = "manual";
  initWork();
  buildCaseScene();
  buildStages();
  buildTitleBars();
  for (const { el: selector, heading } of Object.values(SCENE_ELEMENTS)) {
    $(selector)?.classList.add("scene");
    const node = $(heading);
    if (node && !node.hasAttribute("tabindex")) node.tabIndex = -1;
  }
  document
    .querySelectorAll("[data-scenes-only]")
    .forEach((node) => (node.hidden = false));
  drawer = initHeroTerminal();
  palette = initPalette({ go, openTerminal: () => drawer.open() });
  machine = createSceneMachine();
  transitions = createTransitions();
  wireInput();
  handleRoute({ initial: true });
  return { go, drawer, palette };
}

// The name rises into place, once, when the page first appears.
export function playHeroReveal() {
  const title = $("#site-title");
  if (!title || machine?.state.scene !== "hub" || reduced()) {
    return;
  }
  title.animate(
    [
      { opacity: 0, transform: "translateY(6px)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
}
