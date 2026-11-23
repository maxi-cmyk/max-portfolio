// The Contact note's local time: the time where Max is, and how far that is
// from the visitor's own clock. Updated on the minute.
import { localTime } from "../data/contact-note.js";

export function initLocalTime() {
  const nodes = document.querySelectorAll("[data-local-time]");
  if (!nodes.length) return;
  const tick = () => {
    const now = new Date();
    for (const node of nodes) {
      const { time, diff } = localTime(
        now,
        node.dataset.tz,
        -now.getTimezoneOffset(),
      );
      node.textContent = time;
      const detail = node.parentElement.querySelector("[data-local-detail]");
      if (detail) detail.textContent = `${node.dataset.place} · ${diff}`;
    }
  };
  tick();
  setTimeout(
    () => {
      tick();
      setInterval(tick, 60_000);
    },
    (60 - new Date().getSeconds()) * 1000,
  );
}
