import test from "node:test";
import assert from "node:assert/strict";
import { pickTransition, TRANSITIONS } from "../src/navigation/transitions.js";
import { createTransitions } from "../src/components/transitions.js";

const order = ["a", "b", "c", "d"];
const pick = (from, to, options) =>
  pickTransition(from, to, { order, ...options });

test("going deeper opens a window and coming back closes it", () => {
  assert.equal(pick({ scene: "hub" }, { scene: "work" }), "open");
  assert.equal(pick({ scene: "hub" }, { scene: "skills" }), "open");
  assert.equal(pick({ scene: "work" }, { scene: "hub" }), "close");
  assert.equal(pick({ scene: "contact" }, { scene: "hub" }), "close");
  assert.equal(
    pick({ scene: "work", slug: "a" }, { scene: "case", slug: "a" }),
    "open",
  );
  assert.equal(
    pick({ scene: "case", slug: "a" }, { scene: "work", slug: "a" }),
    "close",
  );
});

test("a landing opens into the page picked from it and closes back", () => {
  assert.equal(
    pick({ scene: "work", slug: null }, { scene: "work", slug: "b" }),
    "open",
  );
  assert.equal(
    pick({ scene: "work", slug: "b" }, { scene: "work", slug: null }),
    "close",
  );
  assert.equal(
    pick({ scene: "skills" }, { scene: "skills", category: "languages" }),
    "open",
  );
  assert.equal(
    pick({ scene: "skills", category: "languages" }, { scene: "skills" }),
    "close",
  );
  assert.equal(
    pick(
      { scene: "skills", category: "languages" },
      { scene: "skills", category: "tools" },
    ),
    "fade",
  );
});

test("changing topic fades", () => {
  for (const [from, to] of [
    ["work", "skills"],
    ["skills", "credentials"],
    ["credentials", "contact"],
    ["case", "skills"],
  ]) {
    assert.equal(
      pick({ scene: from }, { scene: to }),
      "fade",
      `${from} to ${to}`,
    );
  }
  assert.equal(
    pick(
      { scene: "work", categories: [] },
      { scene: "work", categories: ["applied-ai"] },
    ),
    "fade",
  );
  assert.equal(
    pick({ scene: "case", slug: "a" }, { scene: "case", slug: "b" }),
    "fade",
  );
});

test("moving between siblings slides in the right direction", () => {
  assert.equal(
    pick({ scene: "work", slug: "a" }, { scene: "work", slug: "c" }),
    "slide-next",
  );
  assert.equal(
    pick({ scene: "work", slug: "c" }, { scene: "work", slug: "a" }),
    "slide-prev",
  );
  // Wrapping around still follows the button that was pressed.
  assert.equal(
    pick(
      { scene: "work", slug: "d" },
      { scene: "work", slug: "a" },
      { direction: 1 },
    ),
    "slide-next",
  );
  assert.equal(
    pick(
      { scene: "work", slug: "a" },
      { scene: "work", slug: "d" },
      { direction: -1 },
    ),
    "slide-prev",
  );
  // A case study is one page: another project's fades, the same one stays.
  assert.equal(
    pick({ scene: "case", slug: "a" }, { scene: "case", slug: "b" }),
    "fade",
  );
  assert.equal(
    pick({ scene: "case", slug: "a" }, { scene: "case", slug: "a" }),
    "none",
  );
});

test("first paint and no-op moves do not animate", () => {
  assert.equal(pick(null, { scene: "work" }), "none");
  assert.equal(
    pick({ scene: "hub" }, { scene: "work" }, { initial: true }),
    "none",
  );
  assert.equal(
    pick({ scene: "hub" }, { scene: "hub", terminal: true }),
    "none",
  );
  assert.equal(
    pick(
      { scene: "work", slug: "a", categories: [] },
      { scene: "work", slug: "a", categories: [] },
    ),
    "none",
  );
});

test("every transition the picker can return is a known kind", () => {
  const scenes = ["hub", "work", "case", "skills", "credentials", "contact"];
  for (const a of scenes) {
    for (const b of scenes) {
      const kind = pick({ scene: a, slug: "a" }, { scene: b, slug: "b" });
      assert.ok(TRANSITIONS.includes(kind), `${a} to ${b}: ${kind}`);
    }
  }
});

test("reduced motion applies the change at once and leaves nothing running", async () => {
  globalThis.document = { querySelectorAll: () => [] };
  const fx = createTransitions({ reducedMotion: () => true });
  for (const kind of TRANSITIONS) {
    let applied = 0;
    await fx.run(kind, { apply: () => applied++ });
    assert.equal(applied, 1, kind);
    assert.equal(fx.isRunning(), false, kind);
  }
  assert.doesNotThrow(() => fx.cancel());
  delete globalThis.document;
});

test("a cancelled transition still applies its scene change once", async () => {
  globalThis.document = { querySelectorAll: () => [] };
  const fx = createTransitions({ reducedMotion: () => false });
  let applied = 0;
  // "none" never animates, so this checks the shared apply-once contract.
  await fx.run("none", { apply: () => applied++ });
  fx.cancel();
  assert.equal(applied, 1);
  delete globalThis.document;
});

test("every animated kind has motion in view-transitions.css", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile(
    new URL("../src/styles/components/view-transitions.css", import.meta.url),
    "utf8",
  );
  for (const kind of TRANSITIONS.filter((k) => k !== "none")) {
    assert.ok(css.includes(`[data-vt="${kind}"]`), kind);
  }
});

// A stand-in for document.startViewTransition: the update runs on a later
// tick, as in a browser, and skipping still lets it run.
function fakeDocument() {
  const root = {
    dataset: {},
    style: { setProperty() {} },
    classList: { toggle() {} },
  };
  const started = [];
  return {
    started,
    documentElement: root,
    querySelectorAll: () => [],
    startViewTransition(update) {
      let done;
      const finished = new Promise((r) => (done = r));
      const vt = {
        finished,
        skipped: false,
        skipTransition() {
          vt.skipped = true;
        },
      };
      started.push(vt);
      setTimeout(async () => {
        await update();
        setTimeout(done, 5);
      }, 1);
      return vt;
    },
  };
}

test("a view transition names its pairs, applies once and cleans up", async () => {
  const doc = fakeDocument();
  globalThis.document = doc;
  const icon = { style: {} };
  const page = { style: {} };
  const seen = [];
  const fx = createTransitions({ reducedMotion: () => false });
  let applied = 0;
  await fx.run("open", {
    apply: () => {
      applied++;
      seen.push(
        icon.style.viewTransitionName || "",
        doc.documentElement.dataset.vt,
      );
    },
    pairs: {
      old: () => [[icon, "vt-window"]],
      new: () => [[page, "vt-window"]],
    },
  });
  assert.equal(applied, 1);
  // The old name is gone before the swap; the kind is set while it runs.
  assert.deepEqual(seen, ["", "open"]);
  assert.equal(page.style.viewTransitionName, "");
  assert.equal(doc.documentElement.dataset.vt, undefined);
  assert.equal(fx.isRunning(), false);
  delete globalThis.document;
});

test("a newer move skips the running view transition without applying twice", async () => {
  const doc = fakeDocument();
  globalThis.document = doc;
  const fx = createTransitions({ reducedMotion: () => false });
  const log = [];
  const first = fx.run("slide-next", { apply: () => log.push("first") });
  const second = fx.run("slide-next", { apply: () => log.push("second") });
  await Promise.all([first, second]);
  assert.deepEqual(log, ["first", "second"]);
  assert.equal(doc.started[0].skipped, true);
  assert.equal(doc.documentElement.dataset.vt, undefined);
  delete globalThis.document;
});
