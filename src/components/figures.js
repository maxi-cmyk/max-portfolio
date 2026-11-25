// Keep the pixel-art placeholder until a nearby figure needs the 3D stage.
import { chooseRenderMode } from "../figures/mode.js";

export function initFigures() {
  const hosts = [...document.querySelectorAll("[data-figure]")];
  if (!hosts.length) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mode = () => chooseRenderMode({
    reducedMotion: motion.matches,
    saveData: Boolean(navigator.connection?.saveData),
    deviceMemory: navigator.deviceMemory,
    cores: navigator.hardwareConcurrency,
  });
  let stage;
  let loading;
  let unavailable = mode() === "fallback";
  const nearby = new Set();
  const showFallback = (host) => {
    if (host.dataset.figure) host.dataset.figureState = "fallback";
  };

  function sync(host) {
    if (!host.dataset.figure) {
      stage?.swap(host);
      return;
    }
    if (unavailable) {
      showFallback(host);
      return;
    }
    if (!nearby.has(host)) return;
    if (stage) {
      stage.swap(host);
      return;
    }
    loading ??= import("../figures/stage.js")
      .then((module) => {
        stage = module.createStage({ mode: mode() });
        for (const visible of nearby) sync(visible);
      })
      .catch(() => {
        unavailable = true;
        hosts.forEach(showFallback);
      });
  }

  window.addEventListener("portfolio:figure", ({ detail: { host } }) =>
    sync(host),
  );
  motion.addEventListener("change", () => stage?.setMode(motion.matches ? "still" : "live"));
  if (unavailable) {
    hosts.forEach(showFallback);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) nearby.add(target);
        else nearby.delete(target);
      }
      for (const host of nearby) sync(host);
    },
    { rootMargin: "100px" },
  );
  hosts.forEach((host) => observer.observe(host));
}
