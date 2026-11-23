// Scene transitions. Every kind is short, smooth and interruptible, and animates
// only opacity and transform, so the browser can run it off the main thread.
// The caller passes `apply`, which swaps the scene; it runs exactly once, even if
// the transition is cancelled first. Reduced motion just calls `apply`.
//
// Where the browser has View Transitions, the old screen stays up as a picture
// while the new one comes in, so nothing ever goes blank, and named elements
// travel from their old box to their new one (view-transitions.css). `pairs`
// names them: `old()` before the swap, `new()` after it. Elsewhere the WAAPI
// motion below animates the new scene in.

import { reduced } from "./reduced-motion.js";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";

export function createTransitions({
  reducedMotion = reduced,
  speed = () => 1,
} = {}) {
  let token = 0;
  let pending = null;
  let current = null;
  const animations = new Set();
  const root = () => document.documentElement;
  const canMorph = () =>
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function";

  const flush = () => {
    if (!pending) return;
    const apply = pending;
    pending = null;
    apply();
  };
  // The shared 3D canvas cannot fade with a window, so it is hidden while one
  // moves and fades back in once the window has settled (figures.css).
  const moving = (on) =>
    document.documentElement?.classList.toggle("is-moving", on);
  const cleanup = () => {
    animations.forEach((a) => a.cancel());
    animations.clear();
    moving(false);
  };
  const play = (node, keyframes, options) => {
    const animation = node.animate(keyframes, options);
    animations.add(animation);
    return animation.finished.catch(() => {});
  };

  // A newer navigation, or a click mid-transition, lands here: stop everything
  // and apply any scene swap that has not happened.
  function cancel() {
    token += 1;
    if (current) {
      const { vt, names } = current;
      current = null;
      unname(names);
      delete root().dataset.vt;
      vt.skipTransition();
    }
    cleanup();
    flush();
  }

  // Names are set only while a transition runs; each must be unique then.
  const name = (pairs, names) => {
    for (const [node, label] of pairs ?? []) {
      if (!node || names.some(([n]) => n === node)) continue;
      node.style.viewTransitionName = label;
      names.push([node, label]);
    }
  };
  const unname = (names) => {
    for (const [node] of names.splice(0)) node.style.viewTransitionName = "";
  };

  async function morph(kind, { pairs }, duration) {
    const names = [];
    name(pairs?.old?.(), names);
    root().dataset.vt = kind;
    root().style.setProperty("--vt-d", `${duration}ms`);
    const vt = document.startViewTransition(() => {
      // A newer navigation skipped this one and has applied the swap already.
      if (current?.vt !== vt) return;
      unname(names);
      flush();
      name(pairs?.new?.(), names);
    });
    current = { vt, names };
    await vt.finished.catch(() => {});
    if (current?.vt === vt) {
      current = null;
      unname(names);
      delete root().dataset.vt;
    }
  }

  const swap = (apply) => {
    pending = null;
    apply();
  };

  // A window opens: it rises a few pixels into place as it fades in. When the
  // control that opened it is known, it grows from that point.
  async function open({ apply, scene, source }, duration) {
    swap(apply);
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const origin = source
      ? `${source.left + source.width / 2 - rect.left}px ${source.top + source.height / 2 - rect.top}px`
      : "50% 40%";
    await play(
      scene,
      [
        {
          opacity: 0,
          transform: "translateY(10px) scale(0.97)",
          transformOrigin: origin,
        },
        { opacity: 1, transform: "none", transformOrigin: origin },
      ],
      { duration, easing: EASE_OUT },
    );
  }

  // A window closes: it sinks and fades quickly, then what is behind fades in.
  async function close({ apply, scene, from }, duration) {
    const t = token;
    if (from) {
      await play(
        from,
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateY(6px) scale(0.985)" },
        ],
        { duration: duration * 0.4, easing: EASE_IN, fill: "forwards" },
      );
      if (t !== token) return;
    }
    swap(apply);
    // The closed window was held at its last frame; release it now it is hidden.
    animations.forEach((a) => a.cancel());
    animations.clear();
    if (scene) {
      await play(scene, [{ opacity: 0 }, { opacity: 1 }], {
        duration: duration * (from ? 0.6 : 1),
        easing: EASE_OUT,
      });
    }
  }

  // Sideways: the next card or step glides in from the side it came from.
  async function slide(kind, { apply, scene }, duration) {
    swap(apply);
    if (!scene) return;
    const x = kind === "slide-next" ? 18 : -18;
    await play(
      scene,
      [
        { opacity: 0, transform: `translateX(${x}px)` },
        { opacity: 1, transform: "none" },
      ],
      { duration, easing: EASE_OUT },
    );
  }

  // A change of topic: a plain cross-fade.
  async function fade({ apply, scene }, duration) {
    swap(apply);
    if (!scene) return;
    await play(scene, [{ opacity: 0 }, { opacity: 1 }], {
      duration,
      easing: EASE_OUT,
    });
  }

  async function run(kind, options) {
    cancel();
    if (kind === "none" || reducedMotion()) {
      options.apply();
      return;
    }
    pending = options.apply;
    const t = token;
    const baseDuration = options.compact
      ? 170
      : ({ open: 280, close: 240 }[kind] ?? 180);
    const duration = baseDuration * speed();
    if (canMorph()) {
      await morph(kind, options, duration);
      if (t === token) flush();
      return;
    }
    moving(true);
    if (kind === "open") await open(options, duration);
    else if (kind === "close") await close(options, duration);
    else if (kind === "fade") await fade(options, duration);
    else await slide(kind, options, duration);
    if (t === token) {
      flush();
      cleanup();
    }
  }

  return {
    run,
    cancel,
    isRunning: () =>
      pending !== null || animations.size > 0 || current !== null,
  };
}
