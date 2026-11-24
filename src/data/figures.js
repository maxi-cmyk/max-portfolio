// Which project gets which figure, what its controls are, and the caption
// that says exactly what is real and what is schematic. Most are 3D
// (figures/stage.js); a `panel` figure is drawn in HTML and a 2D canvas
// instead (figures/panels.js). Pure data.

const ms = (v) => `${v}`;

export const FIGURES = {
  "music-leds": {
    id: "winding",
    title: "Winding machine",
    controls: [
      {
        type: "range",
        id: "bin",
        label: "Winding frequency",
        min: 0,
        max: 64,
        step: 1,
        value: 3,
        unit: "Hz",
        scale: 50,
      },
      { type: "toggle", id: "auto", label: "Auto-sweep", value: true },
    ],
    caption:
      "Tones at 150, 600 and 1800 Hz wound around an axis. At a matching frequency the curve goes lopsided. LED bands: 50–250 Hz red, 300–1000 Hz green, 1050–2500 Hz blue.",
  },
  "timing-attack-lab": {
    id: "terminal",
    // Not 3D: an HTML terminal (figures/timing-terminal.js).
    panel: true,
    title: "Timing attack",
    controls: [{ type: "toggle", id: "paused", label: "Pause", value: false }],
    caption:
      "Illustrative timings, exaggerated to be readable: 50 ms plus 40 ms for each right leading character. The lab's own vulnerable mode adds 1 ms per matching byte of a 4-byte secret; measured results are WIP.",
  },
  "conway-game-of-life": {
    id: "torus",
    title: "The 32×8 grid as a torus",
    controls: [
      { type: "button", id: "glider", label: "Add glider" },
      { type: "button", id: "reset", label: "Reseed" },
    ],
    caption:
      "A render of the grid's wrap-around: the board is a flat 32×8 LED matrix, but each edge counts the opposite edge as its neighbour, so the grid behaves like a torus. A glider leaving one edge returns at the other.",
  },
  cya: {
    id: "robustness",
    // A recorded prediction panel (figures/robustness.js).
    panel: true,
    title: "Real or AI-generated?",
    controls: [],
    caption:
      "Predictions recorded with cya on these exact image files. The raw AI scores are uncalibrated.",
  },
};

export const figureFor = (slug) =>
  Object.hasOwn(FIGURES, slug) ? FIGURES[slug] : null;

// The control values a figure starts with.
export const defaultParams = (figure) =>
  Object.fromEntries(
    figure.controls
      .filter((c) => c.id && "value" in c)
      .map((c) => [c.id, c.value]),
  );

void ms;
