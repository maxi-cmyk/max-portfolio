// The Work window's exhibit: one framed panel that steps through a project's
// clips and its 3D figure. Slides sit side by side in a scroll-snapped track,
// so a phone can swipe between them (except on the 3D drawing, where a
// sideways drag turns the figure). Arrows in the title bar, dots under the
// panel and the arrow keys move between slides too; nothing rotates by itself.
// A clip plays, muted and looping, only while its slide is showing and on
// screen. The figure's slide stays in the track, so the figure keeps its state.
import { isWip } from "../data/projects.js";
import { reduced } from "./reduced-motion.js";

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// The panel, around the figure's own body (its host, caption and controls).
export function createExhibit(figureBody) {
  const stage = document.createElement("section");
  stage.className = "stage exhibit is-empty";
  stage.setAttribute("aria-roledescription", "carousel");
  stage.setAttribute("aria-label", "Project exhibits");
  stage.innerHTML = `<div class="stage-bar"><span data-stage-title></span><span class="exhibit-nav" data-exhibit-nav hidden><span class="exhibit-count" data-exhibit-count></span><button type="button" class="exhibit-arrow" data-exhibit-step="-1" aria-label="Previous exhibit"><span aria-hidden="true">‹</span></button><button type="button" class="exhibit-arrow" data-exhibit-step="1" aria-label="Next exhibit"><span aria-hidden="true">›</span></button></span></div>
    <div class="exhibit-track" data-exhibit-track role="group" aria-label="Exhibit slides">
      <div class="exhibit-slide is-figure" data-exhibit-figure role="group" aria-roledescription="slide">${figureBody}</div>
    </div>
    <div class="exhibit-dots" data-exhibit-dots hidden></div>`;
  wire(stage);
  return stage;
}

// A clip (or a photo) as a slide.
function clipSlide(m) {
  const slide = document.createElement("div");
  slide.className = "exhibit-slide is-clip";
  slide.setAttribute("role", "group");
  slide.setAttribute("aria-roledescription", "slide");
  slide.dataset.title = m.title ?? "";
  const portrait = m.height > m.width;
  const shape = portrait
    ? ""
    : ` style="aspect-ratio: ${m.width} / ${m.height}"`;
  const poster = m.poster ? ` poster="${esc(m.poster)}"` : "";
  const media =
    m.kind === "video"
      ? `<video src="${esc(m.src)}"${poster} muted loop playsinline preload="none" controls aria-label="${esc(m.alt)}"></video>`
      : `<img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy" decoding="async">`;
  slide.innerHTML = `<div class="exhibit-screen${portrait ? " is-portrait" : ""}"${shape}>${media}</div>${m.caption ? `<p class="figure-caption">${esc(m.caption)}</p>` : ""}`;
  return slide;
}

// The slides a project gets, in order: its real clips and photos first (the
// proof that it works), then its 3D figure. `figureTitle` is the figure
// slide's title, or null when the project has none.
export function exhibitSlides(project, figureTitle) {
  return [
    ...(project?.media ?? [])
      .filter((m) => !isWip(m.src))
      .map((m) => ({ kind: "clip", title: m.title ?? "", media: m })),
    ...(figureTitle ? [{ kind: "figure", title: figureTitle }] : []),
  ];
}

// Fills the panel for a project.
export function fillExhibit(stage, project, figureTitle) {
  const key = `${project?.slug ?? ""}|${figureTitle ?? ""}`;
  if (stage.dataset.exhibitFor === key) return;
  stage.dataset.exhibitFor = key;
  const track = stage.querySelector("[data-exhibit-track]");
  const figureSlide = stage.querySelector("[data-exhibit-figure]");
  for (const old of track.querySelectorAll(".is-clip")) {
    old.querySelector("video")?.pause();
    stage.exhibit.unwatch(old);
    old.remove();
  }
  const planned = exhibitSlides(project, figureTitle);
  const clips = planned.filter((s) => s.kind === "clip");
  for (const { media } of clips) {
    const slide = clipSlide(media);
    figureSlide.before(slide);
    stage.exhibit.watch(slide);
  }
  figureSlide.hidden = !figureTitle;
  figureSlide.dataset.title = figureTitle ?? "";
  const slides = [...track.children].filter((s) => !s.hidden);
  stage.classList.toggle("is-empty", !slides.length);
  stage.classList.toggle("has-clip", clips.length > 0);
  const many = slides.length > 1;
  if (many) track.tabIndex = 0;
  else track.removeAttribute("tabindex");
  stage.querySelector("[data-exhibit-nav]").hidden = !many;
  const dots = stage.querySelector("[data-exhibit-dots]");
  dots.hidden = !many;
  dots.replaceChildren(
    ...slides.map((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.dataset.exhibitGo = i;
      dot.setAttribute("aria-label", `Show ${slide.dataset.title}`);
      return dot;
    }),
  );
  slides.forEach((slide, i) =>
    slide.setAttribute(
      "aria-label",
      `${i + 1} of ${slides.length}: ${slide.dataset.title}`,
    ),
  );
  track.scrollLeft = 0;
  stage.exhibit.show(0);
}

function wire(stage) {
  const track = stage.querySelector("[data-exhibit-track]");
  let active = 0;
  const slides = () => [...track.children].filter((s) => !s.hidden);

  // Marks the slide in view: its title, the count, the dots, and which slide
  // can take focus.
  function show(index) {
    const list = slides();
    active = Math.max(0, Math.min(index, list.length - 1));
    list.forEach((slide, i) => {
      const current = i === active;
      slide.inert = !current;
      slide.classList.toggle("is-current", current);
    });
    stage.querySelector("[data-stage-title]").textContent =
      list[active]?.dataset.title ?? "";
    stage.querySelector("[data-exhibit-count]").textContent =
      `${active + 1} / ${list.length}`;
    stage
      .querySelectorAll("[data-exhibit-step]")
      .forEach((arrow) =>
        arrow.setAttribute(
          "aria-disabled",
          String(
            (arrow.dataset.exhibitStep === "-1" && active === 0) ||
              (arrow.dataset.exhibitStep === "1" && active === list.length - 1),
          ),
        ),
      );
    stage
      .querySelectorAll("[data-exhibit-go]")
      .forEach((dot, i) =>
        dot.setAttribute("aria-current", String(i === active)),
      );
  }

  function go(index) {
    const list = slides();
    const next = Math.max(0, Math.min(index, list.length - 1));
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: reduced() ? "auto" : "smooth",
    });
    show(next);
  }

  stage.addEventListener("click", (event) => {
    const arrow = event.target.closest("[data-exhibit-step]");
    if (arrow) go(active + Number(arrow.dataset.exhibitStep));
    const dot = event.target.closest("[data-exhibit-go]");
    if (dot) go(Number(dot.dataset.exhibitGo));
  });
  // Left and right step through the slides, unless a slider or another
  // control inside the slide wants the keys.
  stage.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest(".exhibit-slide")) return;
    event.preventDefault();
    go(active + (event.key === "ArrowLeft" ? -1 : 1));
  });
  // A swipe or a trackpad scroll settles on a slide.
  let frame = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      if (index !== active) show(index);
    });
  });
  // The panel changes width with the window: stay on the same slide.
  let trackWidth = 0;
  new ResizeObserver(() => {
    const width = track.clientWidth;
    if (width === trackWidth) return;
    trackWidth = width;
    track.scrollLeft = active * width;
  }).observe(track);

  // Clips play only while at least half of them is on screen: on the
  // current slide, in an open window, scrolled into view.
  const playing = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting && !reduced()) {
          target.play()?.catch(() => {});
        } else if (!isIntersecting) {
          target.pause();
        }
      }
    },
    { threshold: 0.5 },
  );
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", ({ matches }) => {
    if (matches) for (const video of track.querySelectorAll("video")) video.pause();
  });
  stage.exhibit = {
    show,
    watch: (slide) => {
      const video = slide.querySelector("video");
      if (video) playing.observe(video);
    },
    unwatch: (slide) => {
      const video = slide.querySelector("video");
      if (video) playing.unobserve(video);
    },
  };
}
