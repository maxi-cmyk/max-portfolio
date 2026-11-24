// Figures that are not 3D: drawn with HTML and a 2D canvas, so they need no
// WebGL. Each mounts into the exhibit's figure slide and returns a cleanup.
// They play only while on screen (the current slide, scrolled into view, tab
// visible), stop under reduced motion, and take their controls as the same
// "figure:control" events the 3D figures get. Loaded lazily.
import { reduced } from "../components/reduced-motion.js";
import { mountRobustness } from "./robustness.js";
import { mountTimingTerminal } from "./timing-terminal.js";

const PANELS = {
  terminal: mountTimingTerminal,
  robustness: mountRobustness,
};

export function mountPanel(id, container, { host, stage }) {
  const mount = PANELS[id];
  if (!mount) return () => {};
  const listeners = new AbortController();
  const readout = stage.querySelector("[data-readout]");
  const controls = stage.querySelector("[data-controls]");
  const panel = mount(container, {
    reduced: reduced(),
    say: (text) => {
      if (readout && readout.textContent !== text) readout.textContent = text;
    },
    // Tells the controls what the figure changed (an auto-play stopping).
    report: (params) =>
      host.dispatchEvent(
        new CustomEvent("figure:state", { bubbles: true, detail: params }),
      ),
  });

  // A panel that does not play hides its controls (a Pause with nothing to
  // pause).
  if (panel.controls === false) controls.hidden = true;

  // On screen: at least half of it showing, in a visible tab.
  let onScreen = false;
  const sync = () => panel.setActive(onScreen && !document.hidden);
  const watch = new IntersectionObserver(
    ([entry]) => {
      onScreen = panel.visibilityTarget
        ? entry.intersectionRatio >= 0.5
        : entry.isIntersecting;
      sync();
    },
    { threshold: 0.5 },
  );
  watch.observe(panel.visibilityTarget ?? container);
  document.addEventListener("visibilitychange", sync, {
    signal: listeners.signal,
  });
  window.addEventListener(
    "figure:control",
    ({ detail }) => {
      if (detail.host === host) panel.set(detail.id, detail.value);
    },
    { signal: listeners.signal },
  );
  return () => {
    watch.disconnect();
    listeners.abort();
    panel.destroy();
    controls.hidden = false;
  };
}
