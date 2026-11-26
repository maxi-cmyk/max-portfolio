import { contactNote, zoneOffset } from "../src/data/contact-note.js";
import { readFileSync, writeFileSync } from "node:fs";
import {
  allProjects,
  caseStudyProjects,
  focusCategories,
  categoryLabel,
  isWip,
} from "../src/data/projects.js";
import { getSkillStack, groupSkillUses } from "../src/data/skill-stack.js";
import {
  GROUP_DOODLE,
  PENCIL_FILTERS,
  PROJECT_DOODLE,
  doodle,
} from "../src/data/doodles.js";
import { desktopIcons, renderIcon, renderMac } from "../src/data/icons.js";
import { buildVCard } from "../src/data/vcard.js";
import { figureFor } from "../src/data/figures.js";
import { renderDatasheet } from "../src/data/datasheets.js";
import { certificates } from "../src/data/certificates.js";
import { renderCaseMap } from "../src/components/case-map.js";
import { renderCyaOriginals } from "../src/figures/robustness.js";
import { renderPanda } from "../src/data/panda.js";
import { projectHash, skillsHash } from "../src/navigation/routes.js";

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// The way into a case study: a panel under the hook with a description, when
// provided, and one filled button. Without JavaScript the routes do not exist,
// so the panel is hidden and the card's own "Read case study" details stand
// in.
function caseStrip(p) {
  if (!p.insights?.summary) return "";
  const id = `case-strip-${p.slug}`;
  const teaser = p.insights.teaser
    ? `<p class="case-strip-description">${escape(p.insights.teaser)}</p>`
    : "";
  return `<section class="case-strip" aria-labelledby="${id}"><h4 class="case-strip-label" id="${id}">Case study</h4>${teaser}<a class="push case-strip-open project-insights-btn" id="case-study-work-${p.slug}" href="${projectHash(p.slug)}" data-project="${p.slug}" aria-label="More info about ${escape(p.name)}">More info <span aria-hidden="true">→</span></a></section>`;
}
// A fact row, a photo frame or an email line with nothing real behind it is left
// out of the page rather than shown as a placeholder. `npm run wip` still lists
// every gap, because it reads the data, not the page.
const fact = (label, value) =>
  isWip(value) ? "" : `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`;
const facts = (p) => {
  const rows = `${fact("Role", p.role)}${fact("Proof", p.proof)}`;
  return rows ? `<dl class="project-facts">${rows}</dl>` : "";
};
const mediaLabel = { photo: "Photo", screenshot: "Screenshot", video: "Clip" };
// A media slot shows the real image or clip once `src` is set; until then there
// is no frame at all.
function media(p) {
  return (p.media ?? []).map(mediaItem).join("");
}
function mediaItem(m) {
  if (isWip(m.src)) return "";
  const size =
    m.width && m.height ? ` width="${m.width}" height="${m.height}"` : "";
  const caption = m.caption
    ? `<figcaption>${escape(m.caption)}</figcaption>`
    : "";
  if (m.kind === "video") {
    const poster = m.poster ? ` poster="${escape(m.poster)}"` : "";
    const shape = m.height > m.width ? " is-portrait" : "";
    return `<figure class="media${shape}"><video src="${escape(m.src)}"${poster}${size} muted loop playsinline preload="none" controls aria-label="${escape(m.alt)}"></video>${caption}</figure>`;
  }
  return `<figure class="media"><img src="${escape(m.src)}" alt="${escape(m.alt)}"${size} loading="lazy" decoding="async">${caption}</figure>`;
}
function figureFallback(slug) {
  const figure = figureFor(slug);
  if (!figure || figure.panel) return "";
  const art = figure.id === "torus"
    ? `<img src="/assets/media/conway-torus.webp" width="518" height="345" alt="The 32×8 grid wraps into a ring. Cells that cross a seam reappear on the opposite edge." decoding="async">`
    : doodle(PROJECT_DOODLE[slug]);
  return `<template data-figure-fallback><div class="figure-fallback">${art}</div></template>`;
}
const groups = (p) => p.categories.map(categoryLabel).map(escape).join(" · ");
const outbound = (p) =>
  [
    ...(p.live
      ? [
          `<a class="terminal-link" href="${escape(p.live.url)}" target="_blank" rel="noreferrer">${escape(p.live.label)} ↗</a>`,
        ]
      : []),
    ...p.links.map(
      (l) =>
        `<a class="terminal-link" href="${escape(l.url)}" target="_blank" rel="noreferrer">${l.label === "github" ? "View source on GitHub" : escape(l.label)} ↗</a>`,
    ),
  ].join("");
function cards() {
  return allProjects
    .map(
      (
        p,
      ) => `<article class="full-project-card" data-project-slug="${p.slug}" data-categories="${p.categories.join(" ")}" id="project/${p.slug}">
    <div class="project-main">
    <header class="project-card-header" id="work/${p.slug}"><h3 class="project-card-title" tabindex="-1">${escape(p.name)}</h3><p class="project-card-meta"><span class="project-categories">${groups(p)}</span> · ${escape(p.meta)}</p></header>
    <p class="project-card-desc">${escape(p.hook)}</p>
    <div class="project-motivation"><h4>Why I built it</h4><p>${escape(p.motivation)}</p></div>
    ${caseStrip(p)}
    ${facts(p)}
    <div class="project-card-links"><div class="project-card-outbound-links">${outbound(p)}</div></div>
    ${figureFallback(p.slug)}
    ${p.media?.some((item) => !isWip(item.src)) ? `<noscript>${media(p)}</noscript>` : ""}
    <div class="project-specs">
      ${renderDatasheet(p.name, p.slug)}
      <div class="project-card-tags" aria-label="Technologies">${p.tags.map((t) => `<span class="tech-badge">${escape(t)}</span>`).join("")}</div>
    </div>
    <details class="static-case-study"><summary>Read case study</summary>${staticCaseStudy(p)}</details>
    </div>
    <div class="project-exhibit" data-exhibit-slot></div>
  </article>`,
    )
    .join("\n");
}
// The case study without JavaScript: the same summary, diagram and notes the
// case scene shows.
function staticCaseStudy(p) {
  const examples = p.slug === "cya" ? renderCyaOriginals() : "";
  return `<p>${escape(p.insights.summary)}</p>${examples}${renderCaseMap(p.insights, 0)}`;
}
// Skills pages share one evidence model and native links, including the static view.
function skillsBlock() {
  const { categories, headlines } = getSkillStack();
  const plural = (n, noun) => `${n} ${noun}${n === 1 ? "" : "s"}`;
  const count = (category) =>
    `${plural(category.rows.length, category.id === "concepts" ? "concept" : "skill")} · ${plural(category.projectCount, "project")}`;
  const cards = headlines
    .map(
      (h) =>
        `<li class="stack-card"><b>${h.count} <small>${h.count === 1 ? "project" : "projects"}</small></b><span>${escape(h.text)}</span></li>`,
    )
    .join("");
  const tiles = categories
    .map((category) => {
      const preview = category.rows
        .slice(0, 5)
        .map(
          (row) =>
            `<li>${escape(row.label)}${row.count > 1 ? ` <small>×${row.count}</small>` : ""}</li>`,
        )
        .join("");
      const more = (limit) =>
        category.rows.length > limit
          ? `<li class="skills-more skills-more-${limit}">+${category.rows.length - limit} more</li>`
          : "";
      return `<li><a class="skills-tile${category.focus ? " is-focus" : ""}" href="${skillsHash(category.id)}" aria-labelledby="skill-tile-${category.id}"><span class="skills-tile-title" id="skill-tile-${category.id}">${doodle(category.doodle)}${escape(category.label)}</span><span class="skills-count">${count(category)}</span><ul class="skills-preview">${preview}${more(4)}${more(5)}</ul><span class="skills-open">Open →</span></a></li>`;
    })
    .join("");
  const projectLink = ({ project }) => {
    const out = project.external ? ' target="_blank" rel="noreferrer"' : "";
    return `<a href="${escape(project.href)}"${out}>${escape(project.name)}${project.external ? " ↗" : ""}</a>`;
  };
  const evidenceNote = ({ text }) =>
    `<span class="skills-note">${escape(text)}</span>`;
  // One table per category: each skill is a row group with a shaded header
  // band, then one row per project. Projects whose note is still a draft get a
  // row with an empty note cell.
  const skillGroup = (row) => {
    const { documented, bare } = groupSkillUses(row.uses);
    const countLabel =
      row.count > 1
        ? `<span class="skills-project-count">${plural(row.count, "project")}</span>`
        : "";
    const head = `<tr class="skills-group-head"><th scope="rowgroup" colspan="2" id="use-${row.id}"><span class="skills-skill">${escape(row.label)}</span>${countLabel}</th></tr>`;
    const uses = [
      ...documented.map(
        (use) =>
          `<tr><td>${projectLink(use)}</td><td>${evidenceNote(use)}</td></tr>`,
      ),
      ...bare.map(
        (use) =>
          `<tr class="is-bare"><td>${projectLink(use)}</td><td><span class="skills-pending" aria-hidden="true">–</span></td></tr>`,
      ),
    ].join("");
    return `<tbody class="skills-group">${head}${uses}</tbody>`;
  };
  const pages = categories
    .map((category) => {
      const title = `skills-title-${category.id}`;
      const tabs = categories
        .map(
          (tab) =>
            `<a href="${skillsHash(tab.id)}" aria-label="${escape(tab.label)}"${tab.id === category.id ? ' aria-current="page"' : ""}><span>${escape(tab.label)}</span>${tab.short ? `<span class="skills-tab-short">${escape(tab.short)}</span>` : ""}</a>`,
        )
        .join("");
      const table = `<table class="skills-table"><caption class="visually-hidden">${escape(category.label)}: each skill, the projects that used it and what it did there</caption><thead><tr><th scope="col">Project</th><th scope="col">What it did there</th></tr></thead>${category.rows.map(skillGroup).join("")}</table>`;
      return `<section class="skills-page" id="${skillsHash(category.id).slice(1)}" data-skill-page="${category.id}"><p class="skills-crumb"><a href="#skills"><span aria-hidden="true">‹</span> Skills</a></p><div class="skills-book"><nav class="skills-tabs" aria-label="Skill categories">${tabs}</nav><div class="skills-paper"><header class="skills-page-heading">${doodle(category.doodle)}<div><h2 id="${title}" tabindex="-1">${escape(category.label)}</h2><p class="skills-count">${count(category)}</p></div></header>${table}</div></div></section>`;
    })
    .join("");
  return `<section id="skills" class="skills" aria-labelledby="skills-title"><div data-skills-landing><div class="section-heading"><div><h2 id="skills-title" tabindex="-1">Skills</h2><p>Open a category to see how each skill was used.</p></div></div><ul class="stack-cards" aria-label="Skills highlights">${cards}</ul><ul class="skills-tiles" aria-label="Skill categories">${tiles}</ul></div>${pages}</section>`;
}
function desk(objects) {
  const art = objects
    .map(([name, file, href, label]) => {
      const svg = readFileSync(
        new URL(`../src/assets/${file}.svg`, import.meta.url),
        "utf8",
      ).trim();
      return `<a class="field-art-card ${name}-art" href="${href}" aria-label="${escape(label)}"><span class="desk-object" aria-hidden="true">${svg}</span></a>`;
    })
    .join("\n");
  return `<template id="desk-artwork"><div class="field-trio desk-artwork">${art}</div></template>`;
}

function desktop() {
  const item = (i) => {
    const inner = `${renderIcon(i.icon)}<span class="icon-label">${escape(i.label)}</span>`;
    const download = i.download ? ` download="${escape(i.download)}"` : "";
    return `<a class="icon" data-icon="${i.key}" href="${escape(i.href)}"${download}>${inner}</a>`;
  };
  return [
    `<nav class="desktop-icons" aria-label="Sections">${desktopIcons.map(item).join("")}</nav>`,
    // Left to right along the desk's edge, so reading order matches the row.
    desk([
      ["scope", "oscilloscope", "#work/music-leds", "music_LEDs"],
      [
        "cyber",
        "network-nodes",
        "#work/timing-attack-lab",
        "timing-attack-lab",
      ],
      ["esp32", "esp32", "#work/music-leds", "music_LEDs"],
      [
        "matrix",
        "led-matrix",
        "#work/conway-game-of-life",
        "Conway's Game of Life",
      ],
      ["cassette", "echo-cassette", "#work/echo", "Echo"],
      ["asteroids", "asteroids-display", "#work/asteroids", "Asteroids"],
      ["camera", "camera-board", "#project/sentinel", "Sentinel"],
    ]),
  ].join("\n");
}
// The Selected work landing: every project as a tile, grouped. JavaScript shows
// it; without JavaScript the full cards below are the page.
// Each card opens with a pencil doodle of its project, on hatched paper.
const tileScreen = (p) =>
  `<span class="tile-screen" aria-hidden="true">${doodle(PROJECT_DOODLE[p.slug] ?? "page")}</span>`;
// A tile names its figure: 3D, or an animation drawn on the page.
const figureBadge = (p) => {
  const figure = figureFor(p.slug);
  if (!figure) return "";
  return `<span class="tile-badge">${figure.panel ? "Animated figure" : "3D figure"}</span>`;
};
const tile = (p) => {
  return `<li data-tile-slug="${p.slug}" data-primary-group="${p.categories[0]}"><a class="work-tile" href="#work/${p.slug}">${tileScreen(p)}<span class="tile-name">${escape(p.name)}</span><span class="tile-meta">${escape(p.meta)}</span><span class="tile-hook">${escape(p.hook)}</span><span class="tile-badges">${figureBadge(p)}</span></a></li>`;
};
const landing = () =>
  `<div id="work-landing" class="work-landing" hidden>${Object.values(
    focusCategories,
  )
    .map(
      (c) =>
        `<section class="work-group" data-group="${c.id}" aria-labelledby="wg-${c.id}"><h3 id="wg-${c.id}">${doodle(GROUP_DOODLE[c.id])}${escape(c.label)}</h3><p>${escape(c.description)}</p><ul class="work-tiles">${allProjects
          .filter((p) => p.categories.includes(c.id))
          .map(tile)
          .join("")}</ul></section>`,
    )
    .join("")}</div>`;
const additionalStaticCaseStudies = () =>
  caseStudyProjects
    .filter((project) => !allProjects.includes(project))
    .map(
      (p) =>
        `<article class="full-project-card" id="project/${p.slug}"><h3>${escape(p.name)}</h3>${staticCaseStudy(p)}<p>${outbound(p)}</p></article>`,
    )
    .join("");
const contactCard = `<a class="push" href="data:text/vcard;charset=utf-8,${encodeURIComponent(buildVCard())}" download="Max_Leong.vcf">Save contact card (.vcf)</a>`;
// The "currently" sticky note. WIP lines are left out; the clock line shows the
// place and UTC offset until the script fills in the live time.
const contactNoteBlock = () => {
  const n = contactNote;
  const offset = zoneOffset(new Date(), n.timeZone) / 60;
  const utc = `UTC${offset < 0 ? "−" : "+"}${Math.abs(offset)}`;
  const main = (l) =>
    l.href
      ? `<a class="note-main" href="${escape(l.href)}">${escape(l.main)}</a>`
      : `<span class="note-main">${escape(l.main)}</span>`;
  const detail = (text, attr = "") =>
    text ? `<span class="note-detail"${attr}>${escape(text)}</span>` : "";
  const line = (l) =>
    isWip(l.main)
      ? ""
      : `<div><dt>${escape(l.label)}</dt><dd>${main(l)}${detail(l.detail)}</dd></div>`;
  // Until the script runs, the place is the main value and the UTC offset the
  // detail; then it shows the live time, with the place and the difference.
  const clock = `<div class="note-time"><dt>Local time</dt><dd><span class="note-main note-clock" data-local-time data-tz="${escape(n.timeZone)}" data-place="${escape(n.place)}">${escape(n.place)}</span>${detail(utc, " data-local-detail")}</dd></div>`;
  const updated = new Date(`${n.updated}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  );
  return `<aside class="contact-note" aria-labelledby="contact-note-title"><h3 id="contact-note-title">Currently</h3><dl>${n.lines.map(line).join("")}${clock}</dl><p class="contact-note-updated">Updated <time datetime="${escape(n.updated)}">${updated}</time></p></aside>`;
};
// The HTTP 404 and the missing-fragment view share the same window.
const notFoundWindow = readFileSync(
  new URL("../404.html", import.meta.url),
  "utf8",
).match(/<!-- error-window:start -->\n([\s\S]*?)\n *<!-- error-window:end -->/);
if (!notFoundWindow) throw new Error("Missing 404 window markers");

const blocks = {
  "not-found": notFoundWindow[1]
    .replaceAll('href="/#', 'href="#')
    .replace(/^/gm, "    "),
  contactcard: contactCard,
  contactnote: contactNoteBlock(),
  mac: `<figure class="mac-art is-paper" aria-hidden="true">${renderMac()}</figure>`,
  // The panda's idle pose, drawn into the page so it shows before any script.
  panda: renderPanda("idle", { size: "body" }),
  desktop: desktop(),
  work: `<section id="work" class="work" aria-labelledby="work-title"><div class="section-heading"><div><h2 id="work-title" tabindex="-1">Selected work</h2><p><span data-work-summary>${allProjects.length} projects in ${Object.keys(focusCategories).length} groups.</span> <em>Pick a card</em> to open it.</p></div></div>
    ${landing()}
    <div id="work-filters" class="work-filters" role="group" aria-label="Filter projects by category" hidden><button type="button" data-work-filter="" aria-pressed="true">All work</button>${Object.keys(
      focusCategories,
    )
      .map(
        (id) =>
          `<button type="button" data-work-filter="${id}" aria-pressed="false">${escape(categoryLabel(id))}</button>`,
      )
      .join("")}</div>
    <p id="work-count" class="work-count" role="status" aria-live="polite" aria-atomic="true">${allProjects.length} projects</p>
    <div id="work-projects" class="work-projects">${cards()}</div>
    <noscript>${additionalStaticCaseStudies()}</noscript>
  </section>`,
  skills: skillsBlock(),
  certificates:
    certificates
      .map(
        (c) =>
          `<article class="certificate-entry"><noscript><a class="certificate-preview" href="${escape(c.pdfUrl)}"><img src="${escape(c.previewUrl)}" alt="${escape(c.previewAlt)}" width="${c.previewWidth}" height="${c.previewHeight}" loading="lazy" decoding="async"></a></noscript><div class="certificate-details"><p class="certificate-date">${escape(c.issued)}</p><h3>${escape(c.title)}</h3><p class="certificate-issuer">${escape(c.issuer)}</p><p>${escape(c.summary)}</p><a class="pk-btn" href="${escape(c.pdfUrl)}">Open certificate PDF ↗</a></div></article>`,
      )
      .join("") +
    // Room on the board for the certificates still to come.
    '<p class="certificate-next" aria-hidden="true">space for the next one</p>',
  // The pencil filters, once, at the top of the page.
  pencil: PENCIL_FILTERS,
};
export function generateContent(html) {
  for (const [name, content] of Object.entries(blocks)) {
    const start = `<!-- generated:${name}:start -->`;
    const end = `<!-- generated:${name}:end -->`;
    const a = html.indexOf(start),
      b = html.indexOf(end);
    if (a === -1 || b === -1)
      throw new Error(`Missing generated content markers: ${name}`);
    html =
      html.slice(0, a + start.length) +
      "\n" +
      content.replace(/[ \t]+$/gm, "") +
      "\n" +
      html.slice(b);
  }
  return html;
}
const current = readFileSync("index.html", "utf8");
const generated = generateContent(current);
if (process.argv.includes("--check")) {
  if (current !== generated) {
    console.error("Static project content is stale. Run npm run content.");
    process.exitCode = 1;
  }
} else writeFileSync("index.html", generated);
