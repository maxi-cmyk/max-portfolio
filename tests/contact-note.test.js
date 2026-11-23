import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  contactNote,
  localTime,
  zoneOffset,
} from "../src/data/contact-note.js";
import { isWip } from "../src/data/projects.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const note = html.slice(
  html.indexOf('<aside class="contact-note"'),
  html.indexOf("</aside>", html.indexOf('<aside class="contact-note"')),
);

test("zone offsets come from the time-zone data, daylight saving included", () => {
  const winter = new Date("2026-01-15T12:00:00Z");
  const summer = new Date("2026-07-15T12:00:00Z");
  assert.equal(zoneOffset(winter, "Asia/Singapore"), 480);
  assert.equal(zoneOffset(winter, "Asia/Kolkata"), 330);
  assert.equal(zoneOffset(winter, "America/New_York"), -300);
  assert.equal(zoneOffset(summer, "America/New_York"), -240);
  assert.equal(zoneOffset(winter, "UTC"), 0);
});

test("the local time says how it compares with the visitor's clock", () => {
  const at = new Date("2026-11-23T13:02:00Z");
  const sg = (offset) => localTime(at, "Asia/Singapore", offset);
  assert.deepEqual(sg(480), { time: "9:02 pm", diff: "same time as you" });
  assert.equal(sg(-300).diff, "13 h ahead of you");
  assert.equal(sg(600).diff, "2 h behind you");
  assert.equal(sg(330).diff, "2.5 h ahead of you");
});

test("the Contact window carries the note, without any WIP line", () => {
  const contact = html.slice(
    html.indexOf('id="contact"'),
    html.indexOf("</footer>", html.indexOf('id="contact"')),
  );
  assert.match(contact, /<aside class="contact-note"/);
  assert.doesNotMatch(note, /\bWIP\b/);
  for (const line of contactNote.lines) {
    const shown = note.includes(`<dt>${line.label}</dt>`);
    assert.equal(shown, !isWip(line.main), line.label);
  }
  // Without the script: the place, and the UTC offset under it.
  assert.match(
    note,
    /data-local-time data-tz="Asia\/Singapore" data-place="Singapore">Singapore<\/span><span class="note-detail" data-local-detail>UTC\+8</,
  );
  assert.match(note, /<time datetime="\d{4}-\d{2}-\d{2}">/);
  assert.match(contactNote.updated, /^\d{4}-\d{2}-\d{2}$/);
});
