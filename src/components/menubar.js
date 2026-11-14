// The menu bar clock. It reads the visitor's own clock, once a minute.
export function formatClock(date) {
  return date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, " ");
}

// The speaker: sound is off until it is switched on, and loads only then.
function initSound() {
  const button = document.querySelector(".menubar-sound");
  if (!button) return;
  let sound = null;
  try {
    button.dataset.saved = localStorage.getItem("portfolio.sound") ?? "";
  } catch {
    // Private mode: it starts off each visit.
  }
  const apply = async (enabled) => {
    sound ??= await import("./sound.js");
    const result = sound.setSound(enabled);
    button.setAttribute("aria-pressed", String(result));
    try {
      localStorage.setItem("portfolio.sound", result ? "1" : "0");
    } catch {
      // Not saved; fine.
    }
  };
  button.addEventListener("click", () =>
    apply(button.getAttribute("aria-pressed") !== "true"),
  );
  document.addEventListener(
    "click",
    (event) => {
      if (!sound || event.target.closest(".menubar-sound")) return;
      const name = sound.soundFor(event.target);
      if (name) sound.play(name);
    },
    true,
  );
  window.addEventListener("portfolio:led-sound", () => sound?.play("led"));
}

export function initMenubar() {
  initSound();
  const clock = document.querySelector(".menubar-clock");
  if (!clock) return;
  const tick = () => {
    clock.textContent = formatClock(new Date());
  };
  tick();
  window.setInterval(tick, 20_000);
}
