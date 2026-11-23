// Plays the start screen, "the card wakes the desk" (frames in terminal/boot.js).
// The card lies on the desk, a field spreads from its coil, then its frame grows
// onto the About window while the menu bar, icons and desk objects pop in
// around it. Any tap, click or key skips to the end. Whether it plays at all is
// decided before the first paint by the small script in index.html's head
// (html.boot-pending); this file only runs what that script started.

import {
  BOOT_ANNOUNCEMENT,
  getBootFrames,
  getBootTiming,
  getTypingFrames,
} from "../terminal/boot.js";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function markSeen() {
  try {
    sessionStorage.setItem("booted", "1");
  } catch {
    // Private mode: the start screen may play again, which is harmless.
  }
}

export function runBoot(screen) {
  const root = document.documentElement;
  if (!screen || !root.classList.contains("boot-pending")) {
    screen?.remove();
    root.classList.remove("boot-hide", "boot-wake");
    return Promise.resolve();
  }
  markSeen();
  const frame = screen.querySelector(".boot-frame");
  const text = screen.querySelector(".boot-text");
  const { typingDelay, grow, fadeOut, fallback } = getBootTiming();
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
  let finish;
  let reveal;
  const revealed = new Promise((resolve) => {
    reveal = resolve;
    finish = () => {
      if (!root.classList.contains("boot-pending")) return;
      timers.forEach(clearTimeout);
      removeEventListener("pointerdown", finish, true);
      removeEventListener("keydown", finish, true);
      // The desktop pops in (if it has not already) and the start layer fades.
      root.classList.remove("boot-pending", "boot-hide");
      screen.classList.add("is-gone");
      setTimeout(() => {
        screen.remove();
        root.classList.remove("boot-wake");
      }, fadeOut + 700);
      resolve();
    };
  });

  const type = (line) => {
    getTypingFrames(line).forEach((part, i) =>
      later(() => (text.textContent = part), i * typingDelay),
    );
  };

  // The frame grows from the card's box onto the About window's box. Animating
  // the box keeps the pencil outline the same thickness.
  const wake = () => {
    screen.classList.add("is-waking");
    root.classList.remove("boot-hide");
    reveal();
    const about = document.querySelector("#home .about");
    if (!about || !frame) return;
    const from = frame.getBoundingClientRect();
    const to = about.getBoundingClientRect();
    frame.style.position = "fixed";
    frame.style.margin = "0";
    const box = (r) => ({
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
    });
    frame.animate([box(from), box(to)], {
      duration: grow,
      easing: EASE,
      fill: "forwards",
    });
  };

  screen.querySelector(".boot-status").textContent = BOOT_ANNOUNCEMENT;
  for (const step of getBootFrames()) {
    later(() => {
      screen.dataset.frame = step.id;
      if (step.line) type(step.line);
      if (step.id === "wake") wake();
      if (step.id === "done") finish();
    }, step.at);
  }
  later(finish, fallback);
  // A tap or key anywhere skips; the Skip button is the visible way to say so.
  addEventListener("pointerdown", finish, true);
  addEventListener("keydown", finish, true);
  return revealed;
}
