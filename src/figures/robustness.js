// Recorded outputs of cya's controlled-RINE model for the exact exhibit files.
import predictions from "../data/cya-predictions.json" with { type: "json" };

const ASSET_ROOT = "/assets/media/cya/";
const SAMPLES = [
  {
    id: "photo",
    label: "Camera photo",
    alt: "A pavilion beside a river between wooded cliffs.",
  },
  {
    id: "generated",
    label: "AI-generated",
    alt: "A generated scene of a wooden pavilion beside a forested river.",
  },
];
const EDITS = {
  original: {
    label: "Original",
    detail: "cya classifies both originals correctly.",
  },
  blur: { label: "Blur", detail: "Gaussian blur with a 5 px radius." },
  resize: {
    label: "Resize",
    detail: "Downscaled to 30% of the original size.",
  },
  jpeg: {
    label: "JPEG recompression",
    detail: "At JPEG quality 18, cya misclassifies the generated image.",
  },
};
const SEQUENCE = ["original", "original", "blur", "resize", "jpeg"];
const FRAME_DURATION = 3000;

const resultNote =
  "Held-out test: 140 of 141 correct. The one miss was a photo called AI-generated.";

function sampleCard({ id, label, alt }, edit, { lazy, showEdit } = {}) {
  const file = `${id}-${edit}.jpg`;
  const { score } = predictions.images[file];
  const predicted = score >= 0.5 ? SAMPLES[1].label : SAMPLES[0].label;
  const wrong = predicted !== label;
  return `<figure class="rb-sample" data-cya-sample="${id}">
    <img src="${ASSET_ROOT}${file}" alt="${alt}" width="960" height="640"${lazy ? ' loading="lazy" decoding="async"' : ""}>
    <figcaption>
      ${showEdit ? `<b class="rb-phase">${EDITS[edit].label}</b>` : ""}
      <b>${label}</b>
      <p class="rb-prediction">cya predicted <strong>${predicted}</strong>${wrong ? '<span class="rb-miss">Misclassified</span>' : ""}</p>
      <p class="rb-score">AI score ${score.toFixed(3)}</p>
    </figcaption>
  </figure>`;
}

function sampleCards(edit, options) {
  return SAMPLES.map((sample) => sampleCard(sample, edit, options)).join("");
}

export function renderCyaOriginals() {
  return `<figure class="rb-static">
    <figcaption>cya predictions on the original examples</figcaption>
    <div class="rb-samples">${sampleCards("original", { lazy: true })}</div>
    <p class="rb-note">Raw AI scores are uncalibrated. ${resultNote}</p>
  </figure>`;
}

export function mountRobustness(container, { reduced }) {
  if (reduced) {
    const generated = SAMPLES[1];
    container.innerHTML = `<div class="rb rb-comparison">
      <div class="rb-samples">${sampleCard(generated, "original", { showEdit: true })}${sampleCard(generated, "jpeg", { showEdit: true })}</div>
      <p class="rb-note">${resultNote}</p>
    </div>`;
    return { controls: false, setActive() {}, set() {}, destroy() {} };
  }

  container.innerHTML = `<div class="rb rb-playback" data-active-sample="photo">
    <div class="rb-samples">${sampleCards("original")}</div>
    <progress class="rb-progress" max="1" value="0" aria-label="cya animation progress"></progress>
    <div class="rb-playback-bar">
      <div>
        <b class="rb-phase" data-cya-phase>Original</b>
        <p class="rb-note" data-cya-status>${EDITS.original.detail}</p>
      </div>
      <button type="button" class="push" data-cya-playback>Pause</button>
    </div>
    <p class="rb-note">${resultNote}</p>
  </div>`;

  const panel = container.querySelector(".rb-playback");
  const samples = panel.querySelector(".rb-samples");
  const progress = panel.querySelector(".rb-progress");
  const phase = panel.querySelector("[data-cya-phase]");
  const status = panel.querySelector("[data-cya-status]");
  const button = panel.querySelector("[data-cya-playback]");
  const compact = matchMedia("(max-width: 699px)");
  const decoded = new Map();
  let active = false;
  let paused = false;
  let finished = false;
  let loading = false;
  let destroyed = false;
  let sequence = SEQUENCE;
  let frame = -1;
  let remaining = 0;
  let deadline;
  let timer;
  let progressFrame;

  function showProgress(now) {
    const timeLeft =
      timer === undefined ? remaining : Math.max(0, deadline - now);
    const last = sequence.length - 1;
    const elapsed = frame + 1 - timeLeft / FRAME_DURATION;
    // Hold just short of full while the last image is decoding.
    progress.value =
      frame === last ? 1 : Math.max(0, Math.min(0.99, elapsed / last));
  }

  function tickProgress(now) {
    showProgress(now);
    progressFrame = requestAnimationFrame(tickProgress);
  }

  function stopClock() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    remaining = Math.max(0, deadline - performance.now());
    cancelAnimationFrame(progressFrame);
    showProgress(performance.now());
  }

  function prepare(edit) {
    if (!decoded.has(edit)) {
      decoded.set(
        edit,
        Promise.all(
          SAMPLES.map(async ({ id }) => {
            const image = new Image();
            image.src = `${ASSET_ROOT}${id}-${edit}.jpg`;
            await image.decode();
          }),
        ).catch((error) => {
          decoded.delete(edit);
          throw error;
        }),
      );
    }
    return decoded.get(edit);
  }

  function sync() {
    if (!active || paused || finished) {
      stopClock();
      return;
    }
    if (loading || timer !== undefined || destroyed) return;
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = undefined;
      remaining = 0;
      cancelAnimationFrame(progressFrame);
      showProgress(performance.now());
      void advance();
    }, remaining);
    if (remaining > 0) progressFrame = requestAnimationFrame(tickProgress);
  }

  async function advance() {
    if (frame < 0) sequence = compact.matches ? SEQUENCE : SEQUENCE.slice(1);
    const next = frame + 1;
    const edit = sequence[next];
    loading = true;
    try {
      await prepare(edit);
      if (!active || paused || destroyed) return;
      panel.dataset.activeSample = next === 0 ? "photo" : "generated";
      samples.innerHTML = sampleCards(edit);
      if (next > 0)
        samples.animate([{ opacity: 0.72 }, { opacity: 1 }], {
          duration: 220,
          easing: "ease-out",
        });
      phase.textContent = EDITS[edit].label;
      status.textContent = EDITS[edit].detail;
      frame = next;
      remaining = FRAME_DURATION;
      showProgress(performance.now());
      if (frame === sequence.length - 1) {
        finished = true;
        button.textContent = "Replay";
      }
    } catch {
      if (destroyed) return;
      finished = true;
      status.textContent = "This frame could not be loaded.";
      button.textContent = "Replay";
    } finally {
      loading = false;
      sync();
    }
  }

  function togglePlayback() {
    if (finished) {
      frame = -1;
      remaining = 0;
      progress.value = 0;
      finished = false;
      paused = false;
    } else {
      paused = !paused;
    }
    button.textContent = paused ? "Resume" : "Pause";
    sync();
  }

  button.addEventListener("click", togglePlayback);
  return {
    controls: false,
    visibilityTarget: samples,
    setActive(on) {
      active = on;
      sync();
    },
    set() {},
    destroy() {
      destroyed = true;
      stopClock();
      button.removeEventListener("click", togglePlayback);
    },
  };
}
