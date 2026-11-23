// Pencil doodles: small line drawings on a 40×40 grid, stroked in graphite and
// roughened by the page's pencil filter (styles/components/pencil.css). Used by
// the Skills layers, the Selected work cards and Contact. Pure: no DOM.

export const DOODLES = {
  chip: '<rect x="9" y="9" width="22" height="22" rx="2"/><rect x="15" y="15" width="10" height="10"/><path d="M14 9V4M20 9V4M26 9V4M14 31v5M20 31v5M26 31v5M9 14H4M9 20H4M9 26H4M31 14h5M31 20h5M31 26h5"/>',
  code: '<path d="M13 9 5 20l8 11M27 9l8 11-8 11M23 7l-6 26"/>',
  lock: '<path d="M12 18v-5a8 8 0 0 1 16 0v5"/><rect x="8" y="18" width="24" height="17" rx="2"/><path d="M20 24v5"/>',
  db: '<ellipse cx="20" cy="9" rx="12" ry="4"/><path d="M8 9v22c0 2 5 4 12 4s12-2 12-4V9M8 20c0 2 5 4 12 4s12-2 12-4"/>',
  window:
    '<rect x="5" y="7" width="30" height="25" rx="2"/><path d="M5 13h30M9 10h1M12 10h1M15 10h1M10 19h12M10 24h18"/>',
  eye: '<path d="M3 20s6-10 17-10 17 10 17 10-6 10-17 10S3 20 3 20z"/><circle cx="20" cy="20" r="5"/><path d="M20 20h.5"/>',
  wave: '<path d="M3 20h5l3-9 4 18 4-24 4 28 4-20 3 7h7"/>',
  grid: '<rect x="4" y="10" width="32" height="20" rx="2"/><path d="M8 15h1M12 15h1M16 19h1M20 15h1M20 19h1M24 23h1M28 19h1M12 23h1"/>',
  rocket:
    '<path d="M20 5c6 5 8 12 6 20h-12c-2-8 0-15 6-20z"/><circle cx="20" cy="15" r="3"/><path d="M14 25l-5 6 7-2M26 25l5 6-7-2M17 31l3 5 3-5"/>',
  mic: '<rect x="15" y="4" width="10" height="18" rx="5"/><path d="M10 18a10 10 0 0 0 20 0M20 28v7M14 35h12"/>',
  photo:
    '<rect x="5" y="8" width="30" height="24" rx="2"/><path d="M20 27s-7-4-7-8a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 4-7 8-7 8z"/>',
  lens: '<circle cx="17" cy="17" r="10"/><path d="M24 24l11 11M12 17h10M17 12v10"/>',
  mail: '<rect x="4" y="9" width="32" height="22" rx="2"/><path d="M4 11l16 12 16-12"/>',
  card: '<rect x="4" y="9" width="32" height="22" rx="3"/><path d="M9 15h6v5H9zM20 15h10M20 20h7M9 26h22"/>',
  page: '<path d="M10 4h14l7 7v25H10zM24 4v7h7M15 18h11M15 23h11M15 28h7"/>',
};

export const doodle = (name, className = "pk-doodle") =>
  `<svg class="${className}" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${DOODLES[name]}</svg>`;

// Which doodle stands for what.
export const PROJECT_DOODLE = {
  "music-leds": "wave",
  "timing-attack-lab": "lock",
  "conway-game-of-life": "grid",
  asteroids: "rocket",
  itspeak: "mic",
  echo: "photo",
  cya: "lens",
};
export const GROUP_DOODLE = {
  "signals-hardware": "chip",
  "systems-security": "lock",
  "applied-ai": "eye",
};

// The rough-edge filters every pencil line goes through. Drawn once, at the top
// of the page, so no window hides them.
export const PENCIL_FILTERS =
  '<svg class="pencil-defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="pencil-rough" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter><filter id="pencil-rough2" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></svg>';
