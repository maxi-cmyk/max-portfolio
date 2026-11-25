import { defaultParams } from "../data/figures.js";

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const display = (control, value) =>
  `${Math.round(value * (control.scale ?? 1))} ${control.unit ?? ""}`.trim();

function updateToggle(button, control, on) {
  if (control.resumeLabel) {
    button.textContent = on ? control.resumeLabel : control.label;
  } else {
    button.textContent = control.label;
    button.setAttribute("aria-pressed", String(on));
  }
}

// Builds a figure's controls (sliders, switches, buttons, pop-ups). Every change
// is sent to the stage as a `figure:control` event; the figure's own changes
// (an auto-sweep, an auto-play stopping) come back as `figure:state` and
// update them.
export function renderControls(container, host, figure) {
  const params = defaultParams(figure);
  container.replaceChildren();
  const send = (id, value) =>
    window.dispatchEvent(
      new CustomEvent("figure:control", { detail: { host, id, value } }),
    );

  for (const control of figure.controls) {
    const wrap = document.createElement("div");
    wrap.className = `control control-${control.type}`;
    if (control.type === "range") {
      const id = `ctl-${control.id}-${Math.random().toString(36).slice(2, 7)}`;
      wrap.innerHTML = `<label class="slider" for="${id}"><span class="slider-name">${esc(control.label)}</span><input id="${id}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${params[control.id]}" data-control="${control.id}"><output for="${id}">${display(control, params[control.id])}</output></label>`;
      const input = wrap.querySelector("input");
      const output = wrap.querySelector("output");
      input.setAttribute(
        "aria-valuetext",
        display(control, params[control.id]),
      );
      input.addEventListener("input", () => {
        const value = Number(input.value);
        output.textContent = display(control, value);
        input.setAttribute("aria-valuetext", display(control, value));
        send(control.id, value);
      });
    } else if (control.type === "toggle") {
      wrap.innerHTML = `<button type="button" class="push" data-control="${control.id}"></button>`;
      const button = wrap.querySelector("button");
      updateToggle(button, control, params[control.id]);
      if (control.resumeLabel) button.disabled = true;
      button.addEventListener("click", () => {
        params[control.id] = !params[control.id];
        updateToggle(button, control, params[control.id]);
        send(control.id, params[control.id]);
      });
    } else if (control.type === "button") {
      wrap.innerHTML = `<button type="button" class="push" data-control="${control.id}">${esc(control.label)}</button>`;
      wrap
        .querySelector("button")
        .addEventListener("click", () => send(control.id, true));
    } else if (control.type === "select") {
      wrap.innerHTML = `<label class="popup"><span class="slider-name">${esc(control.label)}</span><select data-control="${control.id}">${control.options
        .map(
          (o) =>
            `<option value="${esc(o.value)}"${o.value === params[control.id] ? " selected" : ""}>${esc(o.label)}</option>`,
        )
        .join("")}</select></label>`;
      wrap
        .querySelector("select")
        .addEventListener("change", (e) => send(control.id, e.target.value));
    }
    container.append(wrap);
  }
  // Push the starting values to a figure that is already running.
  for (const control of figure.controls) {
    if (control.id && "value" in control) send(control.id, params[control.id]);
  }

  const stage = container.closest(".stage");
  const sync = (event) => {
    if (event.target !== host) return;
    for (const control of figure.controls) {
      const value = event.detail?.[control.id];
      if (value === undefined) continue;
      const node = container.querySelector(`[data-control="${control.id}"]`);
      if (!node) continue;
      params[control.id] = value;
      if (control.resumeLabel) node.disabled = false;
      if (node === document.activeElement) continue;
      if (control.type === "range") {
        node.value = value;
        node.nextElementSibling.textContent = display(control, value);
        node.setAttribute("aria-valuetext", display(control, value));
      } else if (control.type === "toggle") {
        updateToggle(node, control, Boolean(value));
      } else if (control.type === "select") node.value = value;
    }
  };
  stage?.addEventListener("figure:state", sync);
  return () => stage?.removeEventListener("figure:state", sync);
}
