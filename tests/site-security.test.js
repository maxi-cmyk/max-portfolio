import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const html = read("index.html");
const vercel = JSON.parse(read("vercel.json"));
const headerFor = (source, key) =>
  vercel.headers
    .filter((rule) => rule.source === source)
    .flatMap((rule) => rule.headers)
    .find((h) => h.key === key)?.value;

test("the page sends a strict Content-Security-Policy", () => {
  for (const source of ["/", "/index.html"]) {
    const csp = headerFor(source, "Content-Security-Policy");
    assert.ok(csp, source);
    const directive = (name) =>
      csp
        .split(";")
        .map((d) => d.trim())
        .find((d) => d.startsWith(`${name} `));
    const scripts = directive("script-src");
    assert.match(scripts, /^script-src 'self'( 'sha256-[A-Za-z0-9+/=]+')+$/);
    assert.doesNotMatch(csp, /unsafe-eval/);
    assert.equal(directive("object-src"), "object-src 'none'");
    assert.equal(directive("frame-ancestors"), "frame-ancestors 'none'");
    assert.equal(directive("base-uri"), "base-uri 'self'");
    assert.equal(directive("default-src"), "default-src 'self'");
  }
});

test("every response carries the hardening headers", () => {
  const all = (key) => headerFor("/(.*)", key);
  assert.equal(all("X-Content-Type-Options"), "nosniff");
  assert.equal(all("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(all("X-Frame-Options"), "DENY");
  assert.match(
    all("Permissions-Policy"),
    /camera=\(\).*microphone=\(\).*geolocation=\(\)/,
  );
  // PDFs open in the browser's viewer, which a page CSP can break.
  assert.equal(headerFor("/(.*)", "Content-Security-Policy"), undefined);
});

test("security.txt follows RFC 9116", () => {
  const txt = read("public/.well-known/security.txt");
  assert.match(txt, /^Contact: mailto:\S+@\S+$/m);
  const expires = new Date(txt.match(/^Expires: (.+)$/m)[1]);
  const days = (expires - Date.now()) / 86_400_000;
  assert.ok(days > 0 && days <= 366, `Expires is ${days.toFixed(0)} days away`);
  assert.match(
    txt,
    /^Canonical: https:\/\/nfc-portfolio-card\.vercel\.app\/\.well-known\/security\.txt$/m,
  );
});

test("share and search tags describe the site with absolute URLs", () => {
  const meta = (attr, name) =>
    html.match(
      new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]+)"`),
    )?.[1];
  const description = html.match(/name="description"\s+content="([^"]+)"/)?.[1];
  assert.match(description, /low-level logic, hardware and cybersecurity/);
  assert.match(
    meta("property", "og:description"),
    /low-level logic, hardware and cybersecurity/,
  );
  for (const name of ["og:url", "og:image"]) {
    assert.match(
      meta("property", name),
      /^https:\/\/nfc-portfolio-card\.vercel\.app\//,
      name,
    );
  }
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/nfc-portfolio-card\.vercel\.app\/" \/>/,
  );
});

test("a Skills category page starts at H2, not H3", () => {
  const pages = [
    ...html.matchAll(
      /data-skill-page="([^"]+)"[\s\S]*?<(h\d) id="skills-title-\1"/g,
    ),
  ];
  assert.ok(pages.length >= 6);
  for (const [, id, tag] of pages) assert.equal(tag, "h2", id);
});
