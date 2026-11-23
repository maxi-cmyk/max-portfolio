import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FLAGS, SEALED, foundFlags, unseal } from "../src/data/flags.js";
import {
  LOGIN,
  matchingPrefix,
  responseTime,
  runHunt,
  sha256,
} from "../src/terminal/hunt.js";
import { heroCommand } from "../src/terminal/hero-script.js";
import { pandaCommand } from "../src/terminal/commands/panda.js";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hashOf = (id) => FLAGS.find((f) => f.id === id).sha256;
const flagIn = (text) => text.match(/flag\{[^}]+\}/)?.[0];

// A stand-in for the browser's storage, and a console that records lines.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
const run = async (command) => {
  const lines = [];
  await runHunt(command, { line: (t) => lines.push(t), wait: async () => {} });
  return lines.join("\n");
};

test("six flags, each a distinct SHA-256", () => {
  assert.equal(FLAGS.length, 6);
  assert.equal(new Set(FLAGS.map((f) => f.sha256)).size, 6);
  for (const f of FLAGS) assert.match(f.sha256, /^[0-9a-f]{64}$/, f.id);
});

test("the flags shown on screen open only with their own secret", async () => {
  const keys = { alias: "thebananachip", recon: "1337", robots: "admin:admin" };
  for (const [id, key] of Object.entries(keys)) {
    assert.equal(await sha256(unseal(id, key)), hashOf(id), id);
    assert.notEqual(await sha256(unseal(id, "wrong")), hashOf(id), id);
  }
});

test("the leaky login falls to a timing attack, one letter at a time", async () => {
  // The attack itself: keep the letter that gets furthest through the check.
  let password = "";
  for (let i = 0; i < 12; i++) {
    let next = null;
    for (const c of "abcdefghijklmnopqrstuvwxyz") {
      if ((await matchingPrefix(password + c)) > password.length) next = c;
    }
    if (!next) break;
    password += next;
  }
  assert.ok(password.length >= 4, "recovered a password");
  assert.equal(await sha256(unseal("timing", password)), hashOf("timing"));
  // A right letter is slower than a wrong one by more than the jitter.
  const right = await responseTime(password.slice(0, 2), () => 0);
  const wrong = await responseTime(`${password[0]}#`, () => 1);
  assert.ok(right - wrong >= LOGIN.perChar - LOGIN.jitter);
  const out = await run(`login ${password}`);
  assert.match(out, /Access granted/);
  assert.match(out, /Flag captured: A leaky login/);
  assert.match(await run("login nope"), /Access denied\. \(\d+ ms\)/);
});

test("the flags hidden outside the console are real", async () => {
  const security = read("public/.well-known/security.txt");
  assert.equal(await sha256(flagIn(security)), hashOf("disclosure"));
  // The DevTools flag is padded inside a fixed-length blob and only shows
  // once decoded; the well-known encoding of "flag{" is not in the source.
  const main = read("src/main.js");
  const b64 = main.match(/decode this: ([A-Za-z0-9+/]+={0,2})/)[1];
  const decoded = atob(b64);
  assert.equal(await sha256(flagIn(decoded)), hashOf("console"));
  assert.equal(decoded.length, 63, "fixed length, whatever the flag");
  assert.ok(!b64.includes("ZmxhZ"), "no aligned flag{");
  assert.ok(!main.includes(flagIn(decoded)), "the flag is not in the source");
  // The /admin page carries the same sealed flag, and robots.txt points to it.
  assert.ok(read("public/admin/admin.js").includes(SEALED.robots));
  assert.match(read("public/robots.txt"), /^Disallow: \/admin$/m);
  const admin = read("public/admin/index.html");
  assert.match(admin, /<meta name="robots" content="noindex" \/>/);
  assert.match(admin, /admin \/ admin/);
  assert.match(admin, /<script src="\/admin\/admin\.js"><\/script>/);
  assert.doesNotMatch(admin, /<script>/, "no inline script under the CSP");
});

test("the panda's alias reveals and captures the first flag", async () => {
  assert.equal(pandaCommand.flag, "alias");
  assert.equal(await sha256(pandaCommand.stages.at(-1)), hashOf("alias"));
});

test("recon leads to the open port, and nc there gives a flag", async () => {
  assert.match(await run("nmap max"), /1337\/tcp\s+open/);
  assert.match(await run("nmap example.com"), /not this site/);
  assert.match(await run("cat /etc/passwd"), /panda:.*\/usr\/bin\/login/);
  assert.match(await run("cat /etc/shadow"), /Permission denied/);
  assert.match(await run("alias"), /alias panda='th\*+ip'/);
  const nc = await run("nc max 1337");
  assert.equal(await sha256(flagIn(nc)), hashOf("recon"));
  assert.match(await run("nc max 22"), /Connection refused/);
});

test("flags lists the hunt and submit checks by hash", async () => {
  store.clear();
  assert.match(await run("flags"), /0 of 6 found/);
  assert.match(await run("submit flag{not_a_real_one}"), /Not a flag/);
  assert.match(await run("submit nonsense"), /usage/);
  const security = read("public/.well-known/security.txt");
  assert.match(
    await run(`submit ${flagIn(security)}`),
    /Flag captured: Responsible disclosure \(1 of 6\)/,
  );
  assert.match(await run(`submit ${flagIn(security)}`), /Already captured/);
  assert.deepEqual(foundFlags(), ["disclosure"]);
  assert.match(await run("flags"), /^\[x\] 5\. Responsible disclosure$/m);
});

test("hint escalates, one flag at a time, and stops at the last", async () => {
  store.clear();
  // No number: the first flag not yet found.
  assert.match(await run("hint"), /Hint 1 of 3 for 1\. The panda's alias/);
  assert.match(await run("hint 1"), /Hint 2 of 3 for 1\./);
  const last = await run("hint 1");
  assert.match(last, /Hint 3 of 3 for 1\./);
  assert.doesNotMatch(last, /again/);
  assert.match(await run("hint 1"), /Hint 3 of 3/);
  assert.match(await run("hint 2"), /Hint 1 of 3 for 2\. An open port/);
  assert.match(await run("hint 9"), /usage: hint \[1-6\]/);
  assert.match(await run("hint x"), /usage/);
  // A flag already found gets no hint.
  const security = read("public/.well-known/security.txt");
  await run(`submit ${flagIn(security)}`);
  assert.match(await run("hint 5"), /already have 5\. Responsible disclosure/);
  // No hint gives a flag away.
  for (let n = 1; n <= 6; n++) {
    for (let i = 0; i < 3; i++) assert.ok(!flagIn(await run(`hint ${n}`)));
  }
});

test("the console routes the hunt and help points to it", () => {
  for (const c of [
    "flags",
    "submit flag{x}",
    "hint",
    "hint 3",
    "alias",
    "id",
    "uname -a",
    "nmap max",
    "nc max 1337",
    "login abc",
    "cat /etc/passwd",
  ]) {
    assert.equal(heroCommand(c).kind, "hunt", c);
  }
  assert.equal(heroCommand("please rm -rf /").kind, "sudo");
  const help = heroCommand("help").output;
  assert.match(help, /flags\s+6 flags are hidden/);
  assert.match(help, /hint \[n\]\s+A nudge/);
  assert.match(help, /submit flag\{\.\.\.\}\s+Check a flag/);
});
