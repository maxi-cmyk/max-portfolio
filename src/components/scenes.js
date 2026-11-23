import { allProjects, caseStudyProjects } from "../data/projects.js";
import { getCaseStudyView } from "../data/case-study-steps.js";
import { parseRoute, projectHash, workHash } from "../navigation/routes.js";
import {
  createSceneMachine,
  parentScene,
  routeToScene,
  sceneToHash,
} from "../navigation/scenes.js";
import { renderCaseMap, renderStepTable } from "./case-map.js";
import { getWorkCategories, initWork, renderWork } from "./work.js";
import { initHeroTerminal } from "./hero-terminal.js";
import { renderDatasheet } from "../data/datasheets.js";
import { initPalette } from "./palette-ui.js";
import { createLights } from "./lights.js";
import { figureFor } from "../data/figures.js";
import { renderControls } from "./figure-controls.js";
import {
  createWindowMemory,
  parseZoomed,
  toggleZoomed,
} from "../navigation/windows.js";
import { pickTransition } from "../navigation/transitions.js";
import { createTransitions } from "./transitions.js";
import { reduced } from "./reduced-motion.js";

const baseTitle = "Max Leong — Portfolio";
const instant = { behavior: "instant" };

// Scene -> the element that holds it, its heading, its desktop icon and its
// window title. `title` names the window for screen readers and the browser tab;
// `path` is what its title bar shows, as a shell prompt would.
const SCENE_ELEMENTS = {
  hub: {
    el: "#home",
    heading: "#site-title",
    icon: "work",
    title: "About Max",
    path: "~",
  },
  work: {
    el: "#work",
    heading: "#work-title",
    icon: "work",
    title: "Work",
    path: "~/work",
  },
  case: {
    el: "#case",
    heading: "#case-title",
    icon: "work",
    title: "Case study",
    path: "~/work/case",
  },
  skills: {
    el: "#skills",
    heading: "#skills-title",
    icon: "skills",
    title: "Skills",
    path: "~/skills",
  },
  credentials: {
    el: "#certificates",
    heading: "#certificates-title",
    icon: "credentials",
    title: "Credentials",
    path: "~/credentials",
  },
  contact: {
    el: "#contact",
    heading: "#contact-title",
    icon: "contact",
    title: "Contact",
    path: "~/contact",
  },
};

const $ = (selector) => document.querySelector(selector);

let machine;
let drawer;
let palette;
let workInfo = { slugs: [], index: 0, current: null };
let caseInfo = { slug: null, step: 1, total: 1 };
let rendered = null;
let transitions;
let pendingDirection = 0;
let lastTrigger = null;
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
    <nav id="case-rail" class="case-rail" aria-label="Case-study steps"></nav>
    <p id="case-kicker" class="case-kicker"></p>
    <h2 id="case-title" tabindex="-1"></h2>
    <div class="case-note"><p id="case-body" class="case-body"></p>
      <div id="case-more" class="case-more"></div>
      <pre id="case-code" class="case-code" hidden><code></code></pre>
      <div id="case-table"></div>
    </div>
    <div id="case-map"></div>
    <details id="case-specs" class="project-specs"><summary>Technical details</summary><div id="case-sheet"></div></details>
    <p id="case-links" class="case-actions"></p>
    <nav id="case-status" class="case-pager statusbar" aria-label="Case-study pagination"></nav>
  </div>`;
  $("#landing-view").append(section);
}

// Work and case-study windows carry a stage for the project's 3D figure; a
// project with no figure yet shows an explicit WIP frame.
function buildStages() {
  for (const selector of ["#work", "#case"]) {
    const scene = $(selector);
    if (!scene) continue;
    const figure = document.createElement("figure");
    figure.className = "stage is-empty";
    figure.setAttribute("role", "group");
    figure.setAttribute("aria-label", "Project figure");
    const work = selector === "#work";
    const body = `<div class="stage-body">
        <div class="figure-frame"><div class="figure-host" data-figure="" data-figure-state="idle" aria-hidden="true"></div></div>
        <p class="figure-caption" data-caption></p>
        <div class="figure-controls" data-controls></div>
        <p class="figure-readout" data-readout></p>
      </div>`;
    figure.innerHTML = `<div class="stage-bar"><span data-stage-title></span></div>${work ? body : `<div class="case-figure-sketch"></div><details class="case-figure-controls" open><summary>Explore the interactive figure</summary>${body}</details>`}`;
    if (!work) {
      figure
        .querySelector(".case-figure-sketch")
        .append($("#case-transform-sketch").content.cloneNode(true));
    }
    const anchor = scene.querySelector(":scope > .statusbar");
    if (anchor) anchor.before(figure);
    else scene.append(figure);
  }
}

const FIGURE_NUMBER = { winding: 2, staircase: 3, torus: 4, boundary: 5 };
const stageCleanup = new Map();

function updateStage(selector, slug, step, total) {
  const stage = $(`${selector} > .stage`);
  if (!stage) return;
  const host = stage.querySelector(".figure-host");
  const figure = figureFor(slug);
  const disclosure = stage.querySelector(".case-figure-controls");
  if (disclosure) {
    const sketch = slug === "cya" && step === 3;
    if (sketch !== stage.classList.contains("has-step-sketch")) {
      stage.classList.toggle("has-step-sketch", sketch);
      disclosure.open = !sketch;
    }
  }
  if (!figure) {
    stageCleanup.get(host)?.();
    stageCleanup.delete(host);
    stage.classList.add("is-empty");
    stage.querySelector("[data-stage-title]").textContent = "";
    stage.querySelector("[data-caption]").textContent = "";
    stage.querySelector("[data-readout]").textContent = "";
    stage.querySelector("[data-controls]").replaceChildren();
    if (host.dataset.figure) {
      host.dataset.figure = "";
      window.dispatchEvent(
        new CustomEvent("portfolio:figure", { detail: { host } }),
      );
    }
    return;
  }
  stage.classList.remove("is-empty");
  stage.querySelector("[data-stage-title]").textContent =
    `Fig. ${FIGURE_NUMBER[figure.id]} · ${step ? `step ${step}` : figure.title}`;
  if (step) {
    host.dataset.step = step;
    host.dataset.stepTotal = total;
  }
  if (host.dataset.figure !== figure.id) {
    stageCleanup.get(host)?.();
    if (selector === "#work") {
      const fallback = $(
        "#work-projects > :not([hidden]) [data-figure-fallback]",
      );
      host.replaceChildren(fallback.content.cloneNode(true));
    }
    host.dataset.figure = figure.id;
    if (host.dataset.figureState === "idle")
      host.dataset.figureState = "waiting";
    stage.querySelector("[data-caption]").textContent = figure.caption;
    stageCleanup.set(
      host,
      renderControls(stage.querySelector("[data-controls]"), host, figure),
    );
    window.dispatchEvent(
      new CustomEvent("portfolio:figure", { detail: { host } }),
    );
  }
  if (step) {
    window.dispatchEvent(
      new CustomEvent("figure:step", { detail: { host, step, total } }),
    );
  }
}

// Every scene except the desktop is a window: a striped title bar with a close
// box. The close box goes one level up, like Esc.
function buildTitleBars() {
  zoomed = parseZoomed(sessionStorageGet("zoomed"));
  for (const [scene, { el: selector, title, icon, path }] of Object.entries(
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
    bar.innerHTML = `<span class="titlebar-title" aria-hidden="true">max@portfolio:${path}</span>`;
    bar.prepend(lights.el);
    node.prepend(bar);
    lightsByScene.set(scene, lights);
    node.classList.toggle("is-zoomed", zoomed.includes(scene));
    lights.setZoomed(zoomed.includes(scene));
  }
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

function renderCase(state) {
  const project = caseStudyProjects.find((p) => p.slug === state.slug);
  const steps = getCaseStudyView(project.insights);
  const step = Math.min(Math.max(state.step ?? 1, 1), steps.length);
  caseInfo = { slug: project.slug, step, total: steps.length };
  const current = steps[step - 1];
  $("#case-kicker").textContent =
    `Step ${step} of ${steps.length} · ${project.name}`;
  $("#case-title").textContent = current.title;
  const specs = $("#case-specs");
  const sheet = step === 1 ? renderDatasheet(project.name, project.slug) : "";
  specs.hidden = !sheet;
  specs.open = false;
  $("#case-sheet").innerHTML = sheet;
  $("#case-body").textContent = current.body;
  $("#case-more").replaceChildren(
    ...(current.more ?? []).map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    }),
  );
  $("#case-table").innerHTML = renderStepTable(current.table);
  $("#case-map").innerHTML = renderCaseMap(project.insights, step);
  const code = $("#case-code");
  code.hidden = !current.code;
  code.querySelector("code").textContent = current.code ?? "";
  const hash = (n) => projectHash(project.slug, n > 1 ? n : undefined);
  const prev = ((step - 2 + steps.length) % steps.length) + 1;
  const next = (step % steps.length) + 1;
  const text = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  // The rail: one numbered box per step, the current one filled. Each names its
  // step on hover and to screen readers; the current title is the heading below.
  $("#case-rail").innerHTML = `<ol style="--steps:${steps.length}">${steps
    .map((s, i) => {
      const title = text(s.title).replace(/"/g, "&quot;");
      const current = i + 1 === step ? ' aria-current="step"' : "";
      return `<li${i + 1 < step ? ' class="is-done"' : ""}><a href="${hash(i + 1)}" data-sideways data-title="${title}" aria-label="Step ${i + 1}: ${title}"${current}>${i + 1}</a></li>`;
    })
    .join("")}</ol>`;
  $("#case-status").innerHTML =
    `<a class="push" href="${hash(prev)}" data-sideways aria-label="Previous step">‹ Prev</a>
    <p class="work-count">Step ${step} of ${steps.length}</p>
    <a class="push" href="${hash(next)}" data-sideways aria-label="Next step">Next ›</a>`;
  $("#case-links").innerHTML = [
    ...(project.live ? [project.live] : []),
    ...project.links,
  ]
    .map(
      (l) =>
        `<a class="terminal-link" href="${l.url}" target="_blank" rel="noreferrer">${l.label === "github" ? "Source" : l.label} ↗</a>`,
    )
    .join("");
  return { project, step, total: steps.length, title: current.title };
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
        say: `${info.project.name} case study. Step ${info.step} of ${info.total}: ${info.title}.`,
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
  skills.querySelector(".titlebar-title").textContent =
    `max@portfolio:~/skills${category ? `/${category}` : ""}`;
  const heading = document.getElementById(headingId);
  return { heading, name: heading.textContent };
}

function render(state, { initial = false } = {}) {
  const key = `${state.scene}|${state.slug ?? state.category ?? ""}|${state.step ?? ""}`;
  const changed = rendered !== key;
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
  if (state.scene === "work") updateStage("#work", workInfo.current);
  if (state.scene === "case")
    updateStage("#case", state.slug, info.step, info.total);

  if (state.terminal) drawer.open();
  else if (drawer.isOpen() && changed) drawer.close();

  const { title, say } = describe(state, info);
  document.title = state.missing ? `Page not found — ${baseTitle}` : title;
  $("#scene-status").textContent = state.missing
    ? "That page could not be found."
    : say;

  const usingPopup = document.activeElement?.closest?.(".popup");
  if (changed && !initial && !usingPopup) {
    const heading = state.missing
      ? $("#route-notice")
      : (info.heading ?? $(SCENE_ELEMENTS[state.scene].heading));
    heading?.focus({ preventScroll: true });
    el(state.scene)?.scrollTo?.({ top: 0, ...instant });
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
  // Sideways: the card or note slides; the current step marks glide.
  const marks = () =>
    to.scene === "case"
      ? [
          [$("#case .case-note"), "vt-slide"],
          [$("#case-rail [aria-current]"), "vt-step"],
          [$("#case-map [aria-current]"), "vt-mapnode"],
        ]
      : to.scene === "work"
        ? [[pageBox(to, true), "vt-slide"]]
        : [];
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

// Sideways moves (project to project, step to step) replace the history entry,
// so Back leaves the scene instead of paging through every card.
function sideways(hash) {
  go(hash, { replace: true });
}

function neighbour(direction) {
  const { scene } = machine.state;
  pendingDirection = direction;
  if (scene === "work" && workInfo.current && workInfo.slugs.length) {
    const i =
      (workInfo.index + direction + workInfo.slugs.length) %
      workInfo.slugs.length;
    sideways(workHash(getWorkCategories(), workInfo.slugs[i]));
  } else if (scene === "case") {
    const n =
      ((caseInfo.step - 1 + direction + caseInfo.total) % caseInfo.total) + 1;
    sideways(projectHash(caseInfo.slug, n > 1 ? n : undefined));
  }
}

function goUp() {
  const up = parentScene(machine.state);
  if (up) go(sceneToHash(up));
}

function isTyping(target) {
  return target.closest?.("input, textarea, select, [contenteditable='true']");
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
    const typing = isTyping(event.target);
    const palettable =
      (event.key === "k" || event.key === "K") &&
      (event.metaKey || event.ctrlKey);
    if (palettable) {
      event.preventDefault();
      palette.open();
      return;
    }
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    if (event.key === "/") {
      event.preventDefault();
      palette.open();
    } else if (event.key === "`") {
      event.preventDefault();
      drawer.toggle();
    } else if (event.key === "ArrowLeft") neighbour(-1);
    else if (event.key === "ArrowRight") neighbour(1);
    else if (/^[1-9]$/.test(event.key) && machine.state.scene === "work") {
      const slug = workInfo.slugs[Number(event.key) - 1];
      if (slug) sideways(workHash(getWorkCategories(), slug));
    } else if (event.key === "Escape") {
      if (drawer.isOpen()) drawer.close({ restoreFocus: true });
      else goUp();
    }
  });

  // Touch swipes mirror the visible buttons; they stay off the screen edges so
  // they never fight the browser's own Back swipe.
  let start = null;
  const zone = (event) => event.target.closest?.("#work-projects, #case");
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || !zone(event)) return;
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
