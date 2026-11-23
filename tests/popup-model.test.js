import test from "node:test";
import assert from "node:assert/strict";
import {
  popupMove,
  popupTop,
  typeAhead,
} from "../src/navigation/popup-model.js";

test("arrow keys move one row and stop at the ends", () => {
  assert.equal(popupMove("ArrowDown", 0, 4), 1);
  assert.equal(popupMove("ArrowDown", 3, 4), 3);
  assert.equal(popupMove("ArrowUp", 2, 4), 1);
  assert.equal(popupMove("ArrowUp", 0, 4), 0);
});

test("Home, End and the page keys jump to an end; other keys are not moves", () => {
  assert.equal(popupMove("Home", 2, 4), 0);
  assert.equal(popupMove("PageUp", 2, 4), 0);
  assert.equal(popupMove("End", 1, 4), 3);
  assert.equal(popupMove("PageDown", 1, 4), 3);
  assert.equal(popupMove("Enter", 1, 4), null);
  assert.equal(popupMove("a", 1, 4), null);
  assert.equal(popupMove("ArrowDown", 0, 0), null);
});

test("typing jumps to a match, and one letter again steps through its matches", () => {
  const labels = ["All work", "Applied AI & products", "Hardware", "Security"];
  assert.equal(typeAhead(labels, "h", 0), 2);
  assert.equal(typeAhead(labels, "a", 0), 1);
  assert.equal(typeAhead(labels, "aa", 1), 0);
  assert.equal(typeAhead(labels, "app", 0), 1);
  assert.equal(typeAhead(labels, "all", 0), 0);
  assert.equal(typeAhead(labels, "S", 3), 3);
  assert.equal(typeAhead(labels, "z", 0), -1);
  assert.equal(typeAhead(labels, "", 0), -1);
});

test("the menu opens with the chosen row over the button, and stays on screen", () => {
  const base = {
    buttonHeight: 44,
    rowHeight: 40,
    padding: 4,
    viewport: 800,
  };
  // Third row chosen: the menu starts two rows (and its padding) above.
  assert.equal(
    popupTop({ ...base, buttonTop: 400, index: 2, menuHeight: 168 }),
    400 + 2 - 4 - 80,
  );
  // Near the top it is pushed down; near the bottom, pushed up.
  assert.equal(
    popupTop({ ...base, buttonTop: 20, index: 3, menuHeight: 168 }),
    8,
  );
  assert.equal(
    popupTop({ ...base, buttonTop: 760, index: 0, menuHeight: 168 }),
    800 - 168 - 8,
  );
});
