// One shared WebGL renderer for every figure on the page, drawing off screen.
// Each figure is rendered there and copied into a plain 2D canvas inside its
// host, so the drawing scrolls with the page natively (a fixed overlay redrawn
// on scroll lags the scroll on phones and bounces), and adding figures never
// adds WebGL contexts. A host can change figure (the Work window swaps
// figures as you change project) and its controls arrive as events. This module
// imports three.js and is loaded lazily.
import { WebGLRenderer } from "three";
import { disposeFigure } from "./common.js";
import { createOrbit, dragOrbit, stepOrbit } from "./orbit.js";
import { createTorusFigure } from "./torus.js";
import { createWindingFigure } from "./winding.js";

const FIGURES = {
  winding: createWindingFigure,
  torus: createTorusFigure,
};
const IDLE_FRAME_MS = 1000 / 30 - 2;

// A figure takes its colours from the element it draws into, so a dark
// instrument screen (.is-dark) gets pale line art on near-black automatically.
const palette = (host) => {
  const style = getComputedStyle(host);
  const css = (name, fallback) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    ink: css("--ink", "#1d1d1d"),
    paper: css("--panel", "#f4f3ed"),
    navy: css("--navy", "#12376b"),
    acid: css("--acid", "#1e4f9e"),
    plum: css("--warm", "#7a2e5d"),
    muted: css("--muted", "#545454"),
  };
};

export function createStage({ mode }) {
  const canvas = document.createElement("canvas");

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);

  const entries = new Map();
  let raf = 0;
  let last = 0;
  let clock = 0;
  let sinceReport = 0;
  let failed = false;

  const visibility = new IntersectionObserver((changes) => {
    for (const { target, isIntersecting } of changes) {
      const entry = entries.get(target);
      if (entry) entry.visible = isIntersecting;
    }
    schedule();
  });
  const sizes = new ResizeObserver((changes) => {
    for (const { target } of changes) {
      const entry = entries.get(target);
      if (!entry) continue;
      entry.width = target.clientWidth;
      entry.height = target.clientHeight;
      entry.needsFit = true;
    }
    schedule();
  });

  // The off-screen buffer only grows, to the largest figure drawn so far.
  let ratio = 0;
  let bufW = 0;
  let bufH = 0;
  const fit = (w, h) => {
    const r = Math.min(window.devicePixelRatio || 1, 1.5);
    if (r === ratio && w <= bufW && h <= bufH) return;
    ratio = r;
    bufW = Math.max(bufW, w);
    bufH = Math.max(bufH, h);
    renderer.setPixelRatio(ratio);
    renderer.setSize(bufW, bufH, false);
  };

  // Copies the figure just rendered (the bottom-left w by h of the buffer)
  // into the host's own canvas.
  function present(entry, w, h) {
    const out = entry.canvas;
    // The Work window refills its host with the next project's fallback art.
    if (out.parentNode !== entry.host) entry.host.prepend(out);
    const sw = Math.floor(w * ratio);
    const sh = Math.floor(h * ratio);
    if (out.width !== sw || out.height !== sh) {
      out.width = sw;
      out.height = sh;
    }
    entry.ctx.clearRect(0, 0, sw, sh);
    entry.ctx.drawImage(canvas, 0, canvas.height - sh, sw, sh, 0, 0, sw, sh);
  }

  // Tells the controls what the figure changed, and refreshes the readout.
  function report(host, entry, force = false) {
    const params = entry.figure.params?.();
    const text = entry.figure.readout?.();
    const key = JSON.stringify(params);
    if (params && (force || key !== entry.paramsKey)) {
      entry.paramsKey = key;
      host.dispatchEvent(
        new CustomEvent("figure:state", { bubbles: true, detail: params }),
      );
    }
    if (text !== undefined && (force || text !== entry.readout)) {
      entry.readout = text;
      const el = host.closest(".stage")?.querySelector("[data-readout]");
      if (el) el.textContent = text;
    }
  }

  function draw(now) {
    raf = 0;
    if (failed || document.hidden) return;
    const visible = [...entries.values()].filter(
      (entry) => entry.visible && entry.width >= 2 && entry.height >= 2,
    );
    if (!visible.length) {
      last = 0;
      return;
    }
    const interactive = visible.some(
      ({ orbit, activeUntil, dirty, needsFit }) =>
        dirty ||
        needsFit ||
        orbit.dragging ||
        orbit.vyaw ||
        orbit.vpitch ||
        now < activeUntil,
    );
    if (mode === "live" && !interactive && now - last < IDLE_FRAME_MS) {
      schedule();
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    clock += dt;
    sinceReport += dt;
    renderer.setScissorTest(true);
    let moving = false;
    for (const entry of visible) {
      const { host, width: w, height: h } = entry;
      fit(w, h);
      if (entry.needsFit) {
        entry.figure.setSize(w, h);
        if (entry.thumb) entry.figure.camera.position.z *= 0.58;
        entry.needsFit = false;
      }
      if (stepOrbit(entry.orbit, dt)) moving = true;
      entry.figure.update({
        time: clock,
        dt,
        pointer: entry.pointer,
        orbit: entry.orbit,
        still: mode === "still",
      });
      renderer.setViewport(0, 0, w, h);
      renderer.setScissor(0, 0, w, h);
      renderer.clear();
      renderer.render(entry.figure.scene, entry.figure.camera);
      present(entry, w, h);
      if (host.dataset.figureState !== mode) host.dataset.figureState = mode;
      if (entry.dirty || sinceReport > 0.2) {
        report(host, entry, entry.dirty);
        entry.dirty = false;
      }
    }
    if (sinceReport > 0.2) sinceReport = 0;
    if (mode === "live" || moving) schedule();
  }

  function schedule() {
    if (!raf && !failed) raf = requestAnimationFrame(draw);
  }

  function build(host) {
    const id = host.dataset.figure;
    const factory = FIGURES[id];
    if (!factory) return null;
    const figure = factory(palette(host));
    return {
      id,
      host,
      figure,
      pointer: { x: 0, y: 0 },
      orbit: createOrbit(),
      thumb: host.hasAttribute("data-thumb"),
      paramsKey: "",
      readout: "",
      dirty: true,
      needsFit: true,
      activeUntil: 0,
    };
  }

  function listen(host, entry) {
    // Tile thumbnails only turn on their own; the tile is a link.
    if (host.hasAttribute("data-thumb")) return;
    const { signal } = entry.listeners;
    const track = (event) => {
      const r = host.getBoundingClientRect();
      entry.pointer.x = ((event.clientX - r.left) / r.width) * 2 - 1;
      entry.pointer.y = ((event.clientY - r.top) / r.height) * 2 - 1;
      entry.activeUntil = performance.now() + 150;
      schedule();
    };
    if (mode === "live") {
      host.addEventListener("pointermove", track, { signal });
      host.addEventListener(
        "pointerenter",
        () => {
          entry.figure.setHover?.(true);
          entry.activeUntil = performance.now() + 150;
          schedule();
        },
        { signal },
      );
      host.addEventListener(
        "pointerleave",
        () => {
          entry.figure.setHover?.(false);
          entry.pointer.x = entry.pointer.y = 0;
          entry.activeUntil = performance.now() + 150;
          schedule();
        },
        { signal },
      );
    }
    // Drag to turn the figure. On touch, a vertical swipe still scrolls the page
    // (touch-action: pan-y), so a finger turns it left and right only.
    let dragFrom = null;
    host.addEventListener(
      "pointerdown",
      (event) => {
        entry.figure.nudge?.(1);
        dragFrom = { x: event.clientX, y: event.clientY, t: event.timeStamp };
        entry.orbit.dragging = true;
        entry.orbit.vyaw = entry.orbit.vpitch = 0;
        host.setPointerCapture?.(event.pointerId);
        host.classList.add("is-turning");
        schedule();
      },
      { signal },
    );
    host.addEventListener(
      "pointermove",
      (event) => {
        if (!dragFrom) return;
        const dt = (event.timeStamp - dragFrom.t) / 1000;
        dragOrbit(
          entry.orbit,
          event.clientX - dragFrom.x,
          event.pointerType === "touch" ? 0 : event.clientY - dragFrom.y,
          dt,
        );
        dragFrom = { x: event.clientX, y: event.clientY, t: event.timeStamp };
        schedule();
      },
      { signal },
    );
    const release = () => {
      if (!dragFrom) return;
      dragFrom = null;
      entry.orbit.dragging = false;
      host.classList.remove("is-turning");
      schedule();
    };
    host.addEventListener("pointerup", release, { signal });
    host.addEventListener("pointercancel", release, { signal });
    host.addEventListener("lostpointercapture", release, { signal });
  }

  function mount(host) {
    if (entries.has(host) || failed) return;
    const entry = build(host);
    if (!entry) return;
    entry.canvas = document.createElement("canvas");
    entry.canvas.className = "figure-canvas";
    entry.canvas.setAttribute("aria-hidden", "true");
    entry.ctx = entry.canvas.getContext("2d");
    entry.listeners = new AbortController();
    host.prepend(entry.canvas);
    entries.set(host, entry);
    visibility.observe(host);
    sizes.observe(host);
    listen(host, entry);
    report(host, entry, true);
    schedule();
  }

  // The host now names a different figure (or none): replace or remove it.
  function swap(host) {
    const old = entries.get(host);
    if (!old) return mount(host);
    if (old.id === host.dataset.figure) return;
    disposeFigure(old.figure);
    const entry = build(host);
    if (entry) {
      // Keep the host's listeners (they read the live entry) by reusing the
      // pointer object and pointing the old closures at the new figure.
      entry.pointer = old.pointer;
      entry.orbit = old.orbit;
      entries.set(host, Object.assign(old, entry));
      host.dataset.figureState = "waiting";
      report(host, old, true);
    } else {
      old.canvas.remove();
      old.listeners.abort();
      host.classList.remove("is-turning");
      visibility.unobserve(host);
      sizes.unobserve(host);
      entries.delete(host);
      host.dataset.figureState = "idle";
    }
    schedule();
  }

  // Controls arrive as events from the page.
  window.addEventListener("figure:control", (event) => {
    const { host, id, value } = event.detail;
    const entry = entries.get(host);
    if (!entry) return;
    entry.figure.set?.(id, value);
    entry.dirty = true;
    schedule();
  });

  window.addEventListener("resize", schedule);
  document.addEventListener("visibilitychange", schedule);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    failed = true;
    visibility.disconnect();
    sizes.disconnect();
    for (const [host, entry] of entries) {
      host.dataset.figureState = "fallback";
      entry.canvas.remove();
    }
  });

  return { swap };
}
