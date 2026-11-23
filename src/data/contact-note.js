// The sticky note in the Contact window: a short "currently" note in the
// spirit of a /now page, kept up to date by hand. A line left as WIP is not
// shown and is listed by `npm run wip`. Change `updated` whenever a line does.
import { WIP } from "./projects.js";

export const contactNote = {
  updated: "2026-11-23",
  // Each line: a short label, the main value (bold), and an optional detail
  // line under it.
  lines: [
    {
      label: "Building",
      main: "timing-attack-lab",
      href: "#work/timing-attack-lab",
      detail: "A lab on how comparisons leak timing",
    },
    { label: "Into", main: "Low-level logic, hardware and cybersecurity" },
    // What you are looking for, e.g. "Summer 2027 internships in security".
    { label: "Open to", main: WIP },
    // How soon you usually answer, e.g. "Within a day or two".
    { label: "Replies", main: WIP },
  ],
  place: "Singapore",
  timeZone: "Asia/Singapore",
};

// The zone's offset from UTC in minutes at `date`, from the browser's own
// time-zone data, so daylight saving is always right.
export function zoneOffset(date, timeZone) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName").value;
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

// The time there ("9:02 pm") and how it compares with the visitor's own clock
// ("8 h ahead of you"); `visitorOffset` is in minutes east of UTC.
export function localTime(date, timeZone, visitorOffset) {
  const time = date
    .toLocaleTimeString("en-GB", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, " ");
  const hours = (zoneOffset(date, timeZone) - visitorOffset) / 60;
  const diff =
    hours === 0
      ? "same time as you"
      : `${Math.abs(hours)} h ${hours > 0 ? "ahead of" : "behind"} you`;
  return { time, diff };
}
