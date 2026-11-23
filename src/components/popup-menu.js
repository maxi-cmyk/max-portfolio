// Pop-up menus in the classic Mac manner, in place of the native selects. Each
// `label.popup select` keeps working as the source of truth: the select is
// hidden, a button shows its current option, and choosing a row sets the
// select's value and fires its own `change` event, so the code that owns the
// select (work.js, figure-controls.js) needs no changes. This file loads after
// first paint; until then, and without JavaScript, the native select is used.

import { popupMove, popupTop, typeAhead } from "../navigation/popup-model.js";

const ROW = 40;
const PAD = 4;
let uid = 0;
let open = null;

const valueDesc = Object.getOwnPropertyDescriptor(
  HTMLSelectElement.prototype,
  "value",
);
const indexDesc = Object.getOwnPropertyDescriptor(
  HTMLSelectElement.prototype,
  "selectedIndex",
);

function enhance(select) {
  if (select.dataset.popup) return;
  const label = select.closest("label.popup");
  if (!label) return;
  const id = `popup-${(uid += 1)}`;
  select.dataset.popup = id;

  // The button is named by the select's label, then its current value, e.g.
  // "Show projects in, All work".
  const name = document.createElement("span");
  name.id = `${id}-name`;
  name.className = "visually-hidden";
  name.textContent =
    select.getAttribute("aria-label") ??
    label.querySelector("span")?.textContent ??
    "";
  const button = document.createElement("button");
  button.type = "button";
  button.id = `${id}-button`;
  button.className = "popup-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-labelledby", `${name.id} ${id}-value`);
  button.innerHTML = `<span class="popup-value" id="${id}-value"></span><svg viewBox="0 0 12 16" aria-hidden="true" focusable="false"><path d="M6 1 10 6H2zM6 15 2 10h8z"/></svg>`;
  select.classList.add("is-replaced");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  // The hidden select stays in the same cell as the button, so the button is as
  // wide as the longest option and does not change width with its value.
  const field = document.createElement("span");
  field.className = "popup-field";
  select.before(field);
  field.append(select, button);
  label.append(name);

  const sync = () => {
    const option = select.options[select.selectedIndex];
    button.querySelector(".popup-value").textContent = option?.text ?? "";
  };
  // The owners set `select.value` directly and rebuild the options; both must
  // reach the button.
  Object.defineProperty(select, "value", {
    configurable: true,
    get: () => valueDesc.get.call(select),
    set: (v) => {
      valueDesc.set.call(select, v);
      sync();
    },
  });
  Object.defineProperty(select, "selectedIndex", {
    configurable: true,
    get: () => indexDesc.get.call(select),
    set: (v) => {
      indexDesc.set.call(select, v);
      sync();
    },
  });
  new MutationObserver(sync).observe(select, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  select.addEventListener("change", sync);
  sync();

  button.addEventListener("click", () => {
    if (open?.select === select) close();
    else show(select, button);
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      show(select, button);
    }
  });
}

function show(select, button) {
  close({ restore: false });
  const options = [...select.options];
  if (!options.length) return;
  const id = select.dataset.popup;
  const list = document.createElement("ul");
  list.className = "popup-menu";
  list.id = `${id}-list`;
  list.setAttribute("role", "listbox");
  list.setAttribute("tabindex", "-1");
  list.setAttribute("aria-labelledby", `${id}-name`);
  const chosen = Math.max(select.selectedIndex, 0);
  list.innerHTML = options
    .map((o, i) => {
      const li = document.createElement("li");
      li.id = `${id}-opt-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === chosen));
      li.textContent = o.text;
      return li.outerHTML;
    })
    .join("");
  document.body.append(list);

  // Open over the button, the chosen row where the button's text was, and wide
  // enough for the longest row.
  const rect = button.getBoundingClientRect();
  list.style.minWidth = `${Math.round(rect.width)}px`;
  const height = Math.min(
    // Rows, the top and bottom padding, and the 1px border.
    options.length * ROW + PAD * 2 + 2,
    window.innerHeight - 16,
  );
  list.style.maxHeight = `${height}px`;
  const top = popupTop({
    buttonTop: rect.top,
    buttonHeight: rect.height,
    rowHeight: ROW,
    index: chosen,
    menuHeight: height,
    padding: PAD,
    viewport: window.innerHeight,
  });
  const width = list.offsetWidth;
  const left = Math.max(
    8,
    Math.min(rect.left, document.documentElement.clientWidth - width - 8),
  );
  list.style.top = `${Math.round(top)}px`;
  list.style.left = `${Math.round(left)}px`;

  const labels = options.map((o) => o.text);
  let active = chosen;
  let typed = "";
  let typedAt = 0;
  const rows = [...list.children];
  const highlight = (i) => {
    rows[active]?.classList.remove("is-active");
    active = i;
    const row = rows[active];
    row.classList.add("is-active");
    list.setAttribute("aria-activedescendant", row.id);
    row.scrollIntoView({ block: "nearest" });
  };
  const choose = (i) => {
    close();
    if (i === select.selectedIndex) return;
    select.value = options[i].value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };

  list.addEventListener("keydown", (event) => {
    // Every key belongs to the menu while it is open: Escape must not also close
    // the window, nor the arrows step through projects.
    event.stopPropagation();
    const move = popupMove(event.key, active, rows.length);
    if (move !== null) {
      event.preventDefault();
      highlight(move);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close();
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      const now = performance.now();
      typed = now - typedAt > 700 ? event.key : typed + event.key;
      typedAt = now;
      const hit = typeAhead(labels, typed, active);
      if (hit >= 0) highlight(hit);
    }
  });
  list.addEventListener("pointermove", (event) => {
    const row = event.target.closest('[role="option"]');
    if (row) highlight(rows.indexOf(row));
  });
  list.addEventListener("click", (event) => {
    const row = event.target.closest('[role="option"]');
    if (row) choose(rows.indexOf(row));
  });

  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-controls", list.id);
  open = { select, button, list };
  highlight(chosen);
  list.focus({ preventScroll: true });
  list.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 120,
    easing: "ease-out",
  });
}

function close({ restore = true } = {}) {
  if (!open) return;
  const { button, list } = open;
  open = null;
  button.setAttribute("aria-expanded", "false");
  button.removeAttribute("aria-controls");
  list.remove();
  if (restore) button.focus({ preventScroll: true });
}

function scan(root) {
  if (root.matches?.("label.popup select")) enhance(root);
  root.querySelectorAll?.("label.popup select").forEach(enhance);
}

export function initPopupMenus() {
  scan(document);
  // Figure controls and the Work menus are built later, so watch for them.
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) scan(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
  // A click outside, a scroll, a resize or a new route closes the menu without
  // choosing.
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        open &&
        !open.list.contains(event.target) &&
        event.target !== open.button &&
        !open.button.contains(event.target)
      ) {
        close({ restore: false });
      }
    },
    true,
  );
  window.addEventListener("resize", () => close({ restore: false }));
  window.addEventListener("hashchange", () => close({ restore: false }));
  document.addEventListener(
    "scroll",
    (event) => {
      if (open && !open.list.contains(event.target)) close({ restore: false });
    },
    true,
  );
}
