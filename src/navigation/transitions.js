// Which transition a navigation gets. One kind per meaning, so the motion reads
// as a language: open = go deeper, close = come back up, slide = sideways, fade =
// change of topic. Pure: the animation itself lives in components/transitions.js.

const dir = (a, b, hint) => {
  if (hint) return hint > 0 ? "slide-next" : "slide-prev";
  return b >= a ? "slide-next" : "slide-prev";
};

export function pickTransition(
  from,
  to,
  { initial = false, direction = 0, order = [] } = {},
) {
  if (initial || !from) return "none";
  if (from.scene === to.scene) {
    // A landing and the page opened from it: the tile opens into the page.
    const deeper = (a, b) => (!a && b ? "open" : a && !b ? "close" : null);
    if (to.scene === "skills" && from.category !== to.category) {
      return deeper(from.category, to.category) ?? "fade";
    }
    if (to.scene === "work" && (from.slug ?? null) !== (to.slug ?? null)) {
      const depth = deeper(from.slug, to.slug);
      if (depth) return depth;
      const a = order.indexOf(from.slug ?? order[0]);
      const b = order.indexOf(to.slug ?? order[0]);
      return dir(a, b, direction);
    }
    if (to.scene === "case") {
      if (from.slug !== to.slug) return "fade";
      if ((from.step ?? 1) !== (to.step ?? 1)) {
        return dir(from.step ?? 1, to.step ?? 1, direction);
      }
    }
    if (to.scene === "work") {
      const same =
        (from.categories ?? []).join() === (to.categories ?? []).join();
      return same ? "none" : "fade";
    }
    return "none";
  }
  if (to.scene === "hub") return "close";
  if (from.scene === "hub") return "open";
  if (from.scene === "work" && to.scene === "case") return "open";
  if (from.scene === "case" && to.scene === "work") return "close";
  return "fade";
}

export const TRANSITIONS = [
  "none",
  "open",
  "close",
  "slide-next",
  "slide-prev",
  "fade",
];
