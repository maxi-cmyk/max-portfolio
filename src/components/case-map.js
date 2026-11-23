// A small drawn map of a project's case study: the lifecycle, the two
// analysis lanes, the frame loop or the two-device sequence, with the current
// step lit. Numbers match the step rail (the Overview is step 1). Algorithm
// projects have their own 3D figure, so their flow diagram shows on the
// Overview only. Step 0 lights nothing (the static page). Pure: returns HTML,
// so the static page can use it too.

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");

// One box; `n` is its step number in the case study.
function node(n, step, label, { detail, tag, cls = "", style = "" } = {}) {
  const current = n === step;
  return `<li class="case-map-node${cls}${current ? " is-current" : ""}"${style ? ` style="${style}"` : ""}${current ? ' aria-current="step"' : ""}>${n ? `<span class="case-map-n" aria-hidden="true">${n}</span>` : ""}<b>${esc(label)}</b>${detail ? `<span>${esc(detail)}</span>` : ""}${tag ? `<small>${esc(tag)}</small>` : ""}</li>`;
}

const figure = (kind, caption, inner) =>
  `<figure class="case-map case-map--${kind}">${inner}<figcaption>${esc(caption)}</figcaption></figure>`;

function flow({ label, nodes }) {
  return figure(
    "flow",
    label,
    `<ol class="case-map-chain">${nodes.map((n) => node(0, -1, n.label, { detail: n.detail })).join("")}</ol>`,
  );
}

function lifecycle({ title, steps }, step) {
  return figure(
    "lifecycle",
    title,
    `<ol class="case-map-chain">${steps
      .map((s, i) =>
        node(i + 2, step, s.title, {
          cls: s.state === "gate" ? " is-gate" : "",
          tag: s.state === "gate" ? "approval gate" : "",
        }),
      )
      .join("")}</ol>`,
  );
}

function pipeline({ title, source, lanes, merge }, step) {
  const lane = (l, i) => {
    const n = i + 3;
    const current = n === step;
    return `<li class="case-map-lane${current ? " is-current" : ""}"${current ? ' aria-current="step"' : ""}><b><span class="case-map-n" aria-hidden="true">${n}</span>${esc(l.label)}</b><ol>${l.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></li>`;
  };
  return figure(
    "pipeline",
    title,
    `<ol class="case-map-chain">${node(2, step, source.label)}<li class="case-map-split"><ol class="case-map-lanes">${lanes.map(lane).join("")}</ol></li>${node(lanes.length + 3, step, merge.label)}</ol>`,
  );
}

function frameLoop({ title, budget, phases, after }, step) {
  return figure(
    "loop",
    title,
    `<p class="case-map-tick">Every ${esc(budget)}</p><ol class="case-map-chain case-map-ring">${phases
      .map((p, i) =>
        node(i + 2, step, p.label, {
          cls: p.core ? " is-core" : "",
          tag: p.core ? "shared core" : "platform",
        }),
      )
      .join("")}</ol><ol class="case-map-chain case-map-after">${node(phases.length + 2, step, after.label)}</ol>`,
  );
}

function eventSequence({ title, devices, steps }, step) {
  // Lanes in order of first appearance: the sensor, the bridge, the camera.
  const lanes = [];
  for (const s of steps) {
    if (!lanes.some((l) => l.id === s.actor)) {
      const device = devices.find((d) => d.id === s.actor);
      lanes.push({ id: s.actor, label: device?.label ?? s.actorLabel });
    }
  }
  const column = (actor) => lanes.findIndex((l) => l.id === actor) + 1;
  return figure(
    "lanes",
    title,
    `<div class="case-map-grid" style="--lanes:${lanes.length}"><div class="case-map-heads" aria-hidden="true">${lanes.map((l) => `<span>${esc(l.label)}</span>`).join("")}</div><ol class="case-map-chain">${steps
      .map((s, i) =>
        node(i + 2, step, s.title, {
          style: `grid-area:${i + 1} / ${column(s.actor)}`,
          tag: lanes[column(s.actor) - 1].label,
        }),
      )
      .join("")}</ol></div>`,
  );
}

export function renderCaseMap(insights = {}, step = 1) {
  switch (insights.layout) {
    case "algorithm":
      return step <= 1 && insights.diagram ? flow(insights.diagram) : "";
    case "lifecycle":
      return insights.lifecycle ? lifecycle(insights.lifecycle, step) : "";
    case "pipeline":
      return insights.pipeline ? pipeline(insights.pipeline, step) : "";
    case "frame-loop":
      return insights.frameLoop ? frameLoop(insights.frameLoop, step) : "";
    case "event-sequence":
      return insights.eventSequence
        ? eventSequence(insights.eventSequence, step)
        : "";
    default:
      return "";
  }
}

// A step's table: a caption, column headers, and the first cell of each row as
// its header. Wide tables scroll inside their own labelled box.
export function renderStepTable(table) {
  if (!table) return "";
  const head = table.head
    .map((h) => `<th scope="col">${esc(h)}</th>`)
    .join("");
  const rows = table.rows
    .map(
      ([first, ...rest]) =>
        `<tr><th scope="row">${esc(first)}</th>${rest.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<div class="case-table" role="region" tabindex="0" aria-label="${esc(table.caption)}"><table><caption>${esc(table.caption)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
