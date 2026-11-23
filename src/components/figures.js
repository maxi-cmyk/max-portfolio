// Keep the pixel-art placeholder until a nearby figure needs the 3D stage.
import { chooseRenderMode } from "../figures/mode.js";

export function initFigures() {
  const hosts = [...document.querySelectorAll("[data-figure]")];
  if (!hosts.length) return;

  const mode = chooseRenderMode({
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    saveData: Boolean(navigator.connection?.saveData),
    deviceMemory: navigator.deviceMemory,
    cores: navigator.hardwareConcurrency,
  });
  let stage;
  let loading;
  let unavailable = mode === "fallback";
  const nearby = new Set();
  const showFallback = (host) => {
    host.dataset.figureState = "fallback";
    host.closest(".stage")?.classList.add("no-3d");
  };

  function sync(host) {
    if (unavailable) {
      showFallback(host);
      return;
    }
    if (!host.dataset.figure) {
      stage?.swap(host);
      return;
    }
    if (!nearby.has(host)) return;
    if (stage) {
      stage.swap(host);
      return;
    }
    loading ??= import("../figures/stage.js")
      .then((module) => {
        stage = module.createStage({ mode });
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
