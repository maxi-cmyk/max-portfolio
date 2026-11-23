import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chooseRenderMode } from "../src/figures/mode.js";
import { approach } from "../src/figures/ease.js";
import { buildVCard } from "../src/data/vcard.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("a device is given the lightest mode it can handle", () => {
  assert.equal(chooseRenderMode({}), "live");
  assert.equal(chooseRenderMode({ reducedMotion: true }), "still");
  assert.equal(chooseRenderMode({ webgl: false }), "fallback");
  assert.equal(chooseRenderMode({ saveData: true }), "fallback");
  assert.equal(chooseRenderMode({ deviceMemory: 2 }), "fallback");
  assert.equal(chooseRenderMode({ cores: 2 }), "fallback");
  assert.equal(chooseRenderMode({ deviceMemory: 8, cores: 8 }), "live");
  // No WebGL wins over everything else.
  assert.equal(
    chooseRenderMode({ webgl: false, reducedMotion: true }),
    "fallback",
  );
});

test("easing approaches its target without overshooting", () => {
  let value = 0;
  for (let i = 0; i < 200; i++) {
    value = approach(value, 1, 0.016, 5);
    assert.ok(value <= 1);
  }
  assert.ok(value > 0.99);
  assert.equal(approach(0.4, 0.4, 0.016), 0.4);
});

test("the contact card has the public facts and nothing invented", () => {
  const card = buildVCard();
  assert.ok(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(card.endsWith("END:VCARD\r\n"));
  assert.match(card, /FN:Max Leong/);
  assert.match(card, /https:\/\/github\.com\/maxi-cmyk/);
  assert.match(card, /linkedin\.com\/in\/maxleongruisheng/);
  assert.match(card, /EMAIL;TYPE=INTERNET:maxleong32@gmail\.com/);
  assert.doesNotMatch(card, /TEL/, "the phone number is not guessed");
  assert.ok(!card.replace(/\r\n/g, "").includes("\n"));
});

test("Contact has no 3D figure but keeps the save-contact link", () => {
  const contact = html.slice(
    html.indexOf('id="contact"'),
    html.indexOf("</footer>", html.indexOf('id="contact"')),
  );
  assert.doesNotMatch(contact, /data-figure=/);
  assert.doesNotMatch(contact, /figure-frame/);
  assert.match(
    contact,
    /href="data:text\/vcard;charset=utf-8,[^"]+" download="Max_Leong\.vcf"/,
  );
  assert.doesNotMatch(html, /data-figure="card"/);
});
