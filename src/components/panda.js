// The panda: the site's mascot and guide. It sits in the hero window; when a
// window opens it peeks over that window's title bar instead. A tap gives one
// short hint about the screen, it reacts to the console, it looks down while a
// 3D figure loads, and it falls asleep after a minute without input.
// Loaded after first paint; until then the hero shows the idle pose drawn into
// the page, and a tap still answers through main.js.
// Motion: pixel frames step (that is character animation); anything that moves
// eases on opacity and transform only. Reduced motion keeps the idle pose and
// still gives hints.

import { renderPanda } from "../data/panda.js";
import { PANDA_HINTS, PANDA_LINES } from "../data/panda-hints.js";
import {
  basePose,
  bodyPose,
  consoleReaction,
  headPose,
  nextHint,
  tapCount,
} from "../navigation/panda-model.js";
import { reduced } from "./reduced-motion.js";

const SLEEP_MS = 60_000;
const SAY_MS = 4_000;
const PEEK_ROWS = 11;
const LABEL = "Panda. Ask for a hint";

const art = new Map();
const draw = (pose, size) => {
  const key = `${size}:${pose}`;
  if (!art.has(key)) {
    art.set(
      key,
      size === "move"
        ? renderPanda(pose, { size: "move" })
        : size === "body"
          ? renderPanda(bodyPose(pose), { size: "body" })
          : renderPanda(headPose(pose), { rows: PEEK_ROWS }),
    );
  }
  return art.get(key);
};

const sceneNow = () => document.documentElement.dataset.scene || "hub";

export function initPanda({ hero, heroSay }) {
  if (!hero) return;
  hero.setAttribute("aria-label", LABEL);
  hero.removeAttribute("aria-describedby");
  // One polite live region for everything it says, wherever it is on screen.
  heroSay?.removeAttribute("aria-live");
  const live = document.createElement("p");
  live.className = "visually-hidden";
  live.setAttribute("aria-live", "polite");
  document.body.append(live);

  // A head for each window's title bar, at its right end.
  const peeks = new Map();
  document.querySelectorAll(".scene > .titlebar").forEach((bar) => {
    const scene = bar.parentElement;
    if (scene.id === "home") return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "panda-peek";
    button.setAttribute("aria-label", LABEL);
    button.innerHTML = `<span class="panda-peek-art"></span>`;
    const say = document.createElement("span");
    say.className = "panda-say";
    say.setAttribute("aria-hidden", "true");
    say.hidden = true;
    bar.append(button, say);
    button.addEventListener("click", tap);
    peeks.set(scene, { button, say, art: button.firstElementChild });
  });
  const peekHere = () =>
    [...peeks.entries()].find(([scene]) => !scene.hidden)?.[1] ?? null;

  // ---------- Pose ----------
  let asleep = false;
  let working = false;
  let reaction = null; // { pose, until }
  let reactionTimer = 0;
  let shown = "";
  let strolling = null; // { stop } while it walks or rolls

  const current = () => reaction?.pose ?? basePose({ asleep, working });
  function render(next = current()) {
    // Reduced motion: one still pose; it still talks.
    const pose = reduced() ? "idle" : next;
    if (pose === shown) return;
    shown = pose;
    // While it walks, the walk frames own the hero; the peek still updates.
    if (!strolling) hero.innerHTML = draw(pose, "body");
    const peek = peekHere();
    if (peek) peek.art.innerHTML = draw(pose, "head");
  }
  function react(pose, ms, then) {
    clearTimeout(reactionTimer);
    reaction = { pose };
    render();
    reactionTimer = setTimeout(() => {
      if (then) return react(then, 1200);
      reaction = null;
      render();
    }, ms);
  }

  // Blink every few seconds while idle; a single still frame, so it is kept
  // under reduced motion only as the idle pose.
  function blink() {
    setTimeout(
      () => {
        if (!document.hidden && current() === "idle" && !reduced()) {
          render("blink");
          setTimeout(() => render(), 140);
        }
        blink();
      },
      3000 + Math.random() * 3000,
    );
  }

  // ---------- Speech ----------
  const said = new Map();
  let sayTimer = 0;
  function say(text) {
    clearTimeout(sayTimer);
    const peek = sceneNow() === "hub" ? null : peekHere();
    const bubble = peek ? peek.say : heroSay;
    for (const node of [heroSay, ...[...peeks.values()].map((p) => p.say)]) {
      if (node && node !== bubble) node.hidden = true;
    }
    if (bubble) {
      bubble.textContent = `// ${text}`;
      bubble.hidden = false;
      sayTimer = setTimeout(() => (bubble.hidden = true), SAY_MS);
    }
    live.textContent = text;
  }

  // ---------- Taps ----------
  let taps = 0;
  let lastTap = 0;
  function tap() {
    stopStroll();
    const now = performance.now();
    taps = tapCount(taps, lastTap, now);
    lastTap = now;
    if (taps >= 3) {
      taps = 0;
      react("munching", 1600);
      say(PANDA_LINES.snack);
      return;
    }
    const scene = sceneNow();
    if (!said.has(scene)) said.set(scene, new Set());
    const line = nextHint(PANDA_HINTS[scene], said.get(scene));
    if (line) {
      said.get(scene).add(line);
      react("curious", 1600);
      say(line);
    } else {
      react("happy", 900);
    }
  }
  hero.addEventListener("click", tap);

  // ---------- The console ----------
  window.addEventListener("portfolio:console", (event) => {
    stopStroll();
    const next = consoleReaction(event.detail ?? {});
    if (!next) return;
    react(next.pose, next.ms, next.then);
    if (next.line) say(PANDA_LINES[next.line]);
  });

  // ---------- Windows: peek over the title bar of the one that opened ----------
  let placedIn = null;
  function placePeek() {
    // Paging through projects or steps keeps the same window: stay put.
    if (sceneNow() === placedIn) return;
    placedIn = sceneNow();
    peeks.forEach((p) => p.button.classList.remove("is-here"));
    waiting = true;
  }
  // The scene event arrives before the new window is shown, so the head pops
  // up once the window has finished opening (scenes.js: portfolio:settled).
  let waiting = false;
  function showPeek() {
    if (!waiting) return;
    waiting = false;
    const peek = sceneNow() === "hub" ? null : peekHere();
    if (!peek) return;
    shown = "";
    working = loading();
    render();
    peek.button.classList.add("is-here");
  }
  window.addEventListener("portfolio:scene", placePeek);
  window.addEventListener("portfolio:settled", showPeek);

  // ---------- Working while a figure loads ----------
  // A figure is loading when its host is waiting and on screen (a host below
  // the fold waits without loading).
  const loading = () =>
    [...document.querySelectorAll('[data-figure-state="waiting"]')].some(
      (host) => {
        const r = host.getBoundingClientRect();
        return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
      },
    );
  const checkWorking = () => {
    const now = loading();
    if (now !== working) {
      working = now;
      render();
    }
  };
  new MutationObserver(checkWorking).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-figure-state"],
  });

  // ---------- Asleep after a minute without input ----------
  let lastInput = performance.now();
  let saidZzz = false;
  const wake = () => {
    lastInput = performance.now();
    if (asleep) {
      asleep = false;
      render();
    }
  };
  for (const type of ["pointerdown", "keydown", "wheel", "touchstart"]) {
    window.addEventListener(type, wake, { capture: true, passive: true });
  }
  setInterval(() => {
    if (asleep || document.hidden) return;
    if (performance.now() - lastInput < SLEEP_MS) return;
    asleep = true;
    render();
    if (!saidZzz) {
      saidZzz = true;
      say(PANDA_LINES.asleep);
    }
  }, 5_000);

  // ---------- Strolls: every 7 to 10 seconds it walks or rolls along its row ----------
  // It walks on all fours (two frames, stepping) or curls up and rolls, sits a
  // moment looking about, then walks home. Only on the desktop, only when it
  // is awake, quiet and not reacting; never under reduced motion. It moves by
  // transform alone, so nothing around it shifts.
  const row = hero.parentElement;
  let x = 0;
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const busy = () =>
    asleep ||
    reaction ||
    reduced() ||
    document.hidden ||
    sceneNow() !== "hub" ||
    (heroSay && !heroSay.hidden);
  const place = (to) => {
    x = to;
    hero.style.transform = to ? `translateX(${to}px)` : "";
  };

  function travel(to, { roll = false } = {}, run) {
    const from = x;
    const distance = Math.abs(to - from);
    if (distance < 4) return Promise.resolve();
    const left = to < from;
    const ms = (distance / (roll ? 150 : 60)) * 1000;
    const easing = roll ? "cubic-bezier(0.3, 0, 0.4, 1)" : "linear";
    let frame = 0;
    const show = () => {
      hero.innerHTML = draw(
        roll ? "roll" : frame++ % 2 ? "walk2" : "walk1",
        "move",
      );
      if (left && !roll) hero.firstElementChild.style.scale = "-1 1";
    };
    show();
    const stepper = roll ? 0 : setInterval(show, 170);
    const move = hero.animate(
      [
        { transform: `translateX(${from}px)` },
        { transform: `translateX(${to}px)` },
      ],
      { duration: ms, easing, fill: "forwards" },
    );
    // A ball 48px across turns once for every 151px it rolls.
    const spin = roll
      ? hero.firstElementChild.animate(
          [
            { rotate: "0deg" },
            {
              rotate: `${((left ? -1 : 1) * distance * 360) / (Math.PI * 48)}deg`,
            },
          ],
          { duration: ms, easing, fill: "forwards" },
        )
      : null;
    run.stops.push(() => {
      clearInterval(stepper);
      spin?.cancel();
      move.cancel();
    });
    return move.finished.then(
      () => {
        clearInterval(stepper);
        place(to);
        move.cancel();
      },
      () => {},
    );
  }

  async function stroll() {
    const room = row.clientWidth - hero.offsetWidth - 8;
    if (busy() || room < 80) return schedule();
    const run = { stops: [], stopped: false };
    strolling = run;
    try {
      const roll = Math.random() < 0.35;
      await travel(
        Math.round(room * (0.45 + Math.random() * 0.55)),
        { roll },
        run,
      );
      if (run.stopped) return;
      hero.innerHTML = draw(roll ? "happy" : "curious", "body");
      await wait(1800);
      if (run.stopped) return;
      await travel(0, {}, run);
    } finally {
      if (strolling === run) {
        strolling = null;
        shown = "";
        render();
      }
      schedule();
    }
  }

  // Interrupted (a tap, the console, another window): back home quickly.
  function stopStroll() {
    const run = strolling;
    if (!run) return;
    // Where it is right now, mid-step, before its animations are dropped.
    const from = new DOMMatrix(getComputedStyle(hero).transform).m41;
    run.stopped = true;
    run.stops.forEach((stop) => stop());
    strolling = null;
    place(0);
    shown = "";
    render();
    if (Math.abs(from) > 1 && !reduced()) {
      hero.animate(
        [{ transform: `translateX(${from}px)` }, { transform: "none" }],
        { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  }

  let strollTimer = 0;
  function schedule(first = false) {
    clearTimeout(strollTimer);
    strollTimer = setTimeout(
      stroll,
      (first ? 4_000 : 7_000) + Math.random() * 3_000,
    );
  }
  window.addEventListener("portfolio:scene", stopStroll);

  // ---------- First visit: a wave and how to use it ----------
  render();
  // Loaded after the first scene has settled, so it peeks straight away.
  placePeek();
  showPeek();
  blink();
  schedule(true);
  let greeted = false;
  try {
    greeted = sessionStorage.getItem("panda-greeted") === "1";
    sessionStorage.setItem("panda-greeted", "1");
  } catch {
    // Private mode: it may wave again on the next visit, which is harmless.
  }
  if (!greeted && sceneNow() === "hub") {
    setTimeout(() => {
      react("waving", 2400);
      say(PANDA_LINES.greet);
    }, 2500);
  }
}
