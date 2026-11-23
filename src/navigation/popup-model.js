// The keyboard model for the pop-up menus (components/popup-menu.js), kept free
// of the DOM so it can be tested on its own. Indexes are 0-based; nothing wraps,
// as on a classic Mac menu.

// Arrow keys move one row; Home, End, Page Up and Page Down jump to an end.
// Any other key returns null: it is not a move.
export function popupMove(key, index, count) {
  if (count < 1) return null;
  const last = count - 1;
  switch (key) {
    case "ArrowDown":
      return Math.min(index + 1, last);
    case "ArrowUp":
      return Math.max(index - 1, 0);
    case "Home":
    case "PageUp":
      return 0;
    case "End":
    case "PageDown":
      return last;
    default:
      return null;
  }
}

// Typing jumps to the first row that starts with what was typed, searching
// from the current row onward and round to the top. Pressing one letter again
// and again steps through every row that starts with it. -1 means no match.
export function typeAhead(labels, typed, from = 0) {
  const query = typed.toLowerCase();
  if (!query || !labels.length) return -1;
  const repeated = [...query].every((c) => c === query[0]);
  const needle = repeated ? query[0] : query;
  // A new single letter or a repeat moves past the current row; a longer word
  // may still match the row it is on.
  const start = repeated ? from + 1 : from;
  for (let i = 0; i < labels.length; i += 1) {
    const at = (start + i) % labels.length;
    if (labels[at].trim().toLowerCase().startsWith(needle)) return at;
  }
  return -1;
}

// Where the menu opens: over its button, so the chosen row sits where the
// button's text was, then nudged to stay on screen. Returns the menu's top.
export function popupTop({
  buttonTop,
  buttonHeight,
  rowHeight,
  index,
  menuHeight,
  padding = 0,
  viewport,
  margin = 8,
}) {
  const aligned =
    buttonTop + (buttonHeight - rowHeight) / 2 - padding - index * rowHeight;
  const lowest = viewport - menuHeight - margin;
  return Math.max(margin, Math.min(aligned, lowest));
}
