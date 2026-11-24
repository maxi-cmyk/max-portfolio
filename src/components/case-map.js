// The drawn diagram that carries each one-page case study: a flowchart, a
// chain that splits into outputs, two builds or two comparisons side by side,
// an upload that splits into two analyses, or events across devices. Each
// layout has its own shape below. `level` 0 is the static page, whose
// headings sit one level lower. Pure: returns HTML, so the static page can
// use it too.

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");

// One box: a label over a detail line.
function node(label, { detail, cls = "", style = "", led } = {}) {
  const swatch = led
    ? `<i class="led led-${esc(led)}" aria-hidden="true"></i>`
    : "";
  return `<li class="case-map-node${cls}"${style ? ` style="${style}"` : ""}><b>${swatch}${esc(label)}</b>${detail ? `<span>${esc(detail)}</span>` : ""}</li>`;
}

// A diagram, then what follows it, with no blank lines between.
const page = (...parts) => parts.filter(Boolean).join("\n  ");

// The short notes under a diagram.
function after(notes, level) {
  if (!notes) return "";
  const heading = level === 0 ? "h4" : "h3";
  return `<section class="case-after-flow">
    <${heading}>${esc(notes.title)}</${heading}>
    ${notes.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
  </section>`;
}

function flowchart(
  { title, intake, decision, pending, approved, after: notes },
  level,
) {
  return page(
    `<figure class="case-map case-map--branching case-map--decision">
    <figcaption>${esc(title)}</figcaption>
    <ol class="case-map-intake" role="list">
      ${intake.map(({ label, detail }) => node(label, { detail })).join("")}
      <li>
        <b class="case-map-root">${esc(decision)}</b>
        <ol class="case-map-outcomes" role="list">
          ${node(pending.label, { detail: pending.detail, cls: " is-pending" })}
          ${node(approved.label, { detail: approved.detail, cls: " is-approved" })}
        </ol>
      </li>
    </ol>
  </figure>`,
    after(notes, level),
  );
}

function platforms({ title, engine, builds, note }) {
  return `<figure class="case-map case-map--branching case-map--platforms">
    <figcaption>${esc(title)}</figcaption>
    <div class="case-map-root"><b>${esc(engine.label)}</b><span>${esc(engine.detail)}</span></div>
    <ul class="case-map-outcomes" role="list">${builds
      .map(
        ({ label, input, output, timing }) => `<li class="case-map-node">
          <b>${esc(label)}</b>
          <dl>
            <div><dt>Input</dt><dd>${esc(input)}</dd></div>
            <div><dt>Output</dt><dd>${esc(output)}</dd></div>
          </dl>
          <p class="case-map-timing">${esc(timing)}</p>
        </li>`,
      )
      .join("")}</ul>
  </figure>
  <p class="case-map-footnote">${esc(note)}</p>`;
}

// Stages in a column, then a bar that splits into outputs (music_LEDs'
// colour bands, Conway's two displays), an optional results table, then notes.
function signalChain(
  { title, stages, output, outputs, results, after: notes },
  level,
) {
  const split = outputs?.length
    ? `<ol class="case-map-outcomes" role="list" style="--outputs:${outputs.length}">${outputs
        .map(({ label, detail, led }) => node(label, { detail, led }))
        .join("")}</ol>`
    : "";
  return page(
    `<figure class="case-map case-map--branching case-map--signal">
    <figcaption>${esc(title)}</figcaption>
    <ol class="case-map-intake" role="list">
      ${stages.map(({ label, detail }) => node(label, { detail })).join("")}
      <li>
        <div class="case-map-root"><b>${esc(output.label)}</b><span>${esc(output.detail)}</span></div>${split}
      </li>
    </ol>
  </figure>`,
    results && renderTable(results),
    after(notes, level),
  );
}

// One root, then two boxes side by side, each with labelled rows and a note
// (the timing lab's two comparisons).
function compare({ title, root, branches, after: notes }, level) {
  return page(
    `<figure class="case-map case-map--branching case-map--platforms case-map--compare">
    <figcaption>${esc(title)}</figcaption>
    <div class="case-map-root"><b>${esc(root.label)}</b><span>${esc(root.detail)}</span></div>
    <ul class="case-map-outcomes" role="list">${branches
      .map(
        ({ label, rows, note }) => `<li class="case-map-node">
          <b>${esc(label)}</b>
          <dl>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
          <p class="case-map-timing">${esc(note)}</p>
        </li>`,
      )
      .join("")}</ul>
  </figure>`,
    after(notes, level),
  );
}

// One upload, two analyses side by side, one merge (it'sPEAK).
function pipeline({ title, source, lanes, merge, after: notes }, level) {
  return page(
    `<figure class="case-map case-map--branching case-map--pipeline">
    <figcaption>${esc(title)}</figcaption>
    <div class="case-map-root"><b>${esc(source.label)}</b><span>${esc(source.detail)}</span></div>
    <ol class="case-map-outcomes" role="list">${lanes
      .map(({ label, detail }) => node(label, { detail }))
      .join("")}</ol>
    <div class="case-map-root case-map-merge"><b>${esc(merge.label)}</b><span>${esc(merge.detail)}</span></div>
  </figure>`,
    after(notes, level),
  );
}

// Events in order, one column per device (Sentinel).
function eventSequence({ title, devices, steps, after: notes }, level) {
  // Lanes in order of first appearance: the sensor, the bridge, the camera.
  const lanes = [];
  for (const s of steps) {
    if (!lanes.some((l) => l.id === s.actor)) {
      const device = devices.find((d) => d.id === s.actor);
      lanes.push({ id: s.actor, label: device?.label ?? s.actorLabel });
    }
  }
  const column = (actor) => lanes.findIndex((l) => l.id === actor) + 1;
  return page(
    `<figure class="case-map case-map--lanes">
    <figcaption>${esc(title)}</figcaption>
    <div class="case-map-grid" style="--lanes:${lanes.length}"><div class="case-map-heads" aria-hidden="true">${lanes.map((l) => `<span>${esc(l.label)}</span>`).join("")}</div><ol class="case-map-chain">${steps
      .map((s, i) =>
        node(s.title, {
          detail: s.body,
          style: `grid-area:${i + 1} / ${column(s.actor)}`,
        }).replace(
          "<b>",
          `<b><small>${esc(lanes[column(s.actor) - 1].label)}: </small>`,
        ),
      )
      .join("")}</ol></div>
  </figure>`,
    after(notes, level),
  );
}

export function renderCaseMap(insights = {}, level = 1) {
  switch (insights.layout) {
    case "flowchart":
      return insights.flowchart ? flowchart(insights.flowchart, level) : "";
    case "platforms":
      return insights.platforms ? platforms(insights.platforms) : "";
    case "signal-chain":
      return insights.signalChain
        ? signalChain(insights.signalChain, level)
        : "";
    case "compare":
      return insights.compare ? compare(insights.compare, level) : "";
    case "pipeline":
      return insights.pipeline ? pipeline(insights.pipeline, level) : "";
    case "event-sequence":
      return insights.eventSequence
        ? eventSequence(insights.eventSequence, level)
        : "";
    default:
      return "";
  }
}

// A results table: a caption, column headers, and the first cell of each row
// as its header. Wide tables scroll inside their own labelled box.
export function renderTable(table) {
  if (!table) return "";
  const head = table.head.map((h) => `<th scope="col">${esc(h)}</th>`).join("");
  const rows = table.rows
    .map(
      ([first, ...rest]) =>
        `<tr><th scope="row">${esc(first)}</th>${rest.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<div class="case-table" role="region" tabindex="0" aria-label="${esc(table.caption)}"><table><caption>${esc(table.caption)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
