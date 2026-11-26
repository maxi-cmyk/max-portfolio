import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { certificates } from "../src/data/certificates.js";
import cyaPredictions from "../src/data/cya-predictions.json" with { type: "json" };
const html = readFileSync("dist/index.html", "utf8");
const standaloneErrors = ["404", "403"].map((code) => {
  const page = readFileSync(`dist/${code}.html`, "utf8");
  if (
    !page.includes(`data-error="${code}"`) ||
    !page.includes(`src="/assets/error-${code}.svg"`)
  ) {
    throw new Error(`Missing error window or artwork in ${code}.html`);
  }
  return page;
});
const paths = new Set(
  [
    ...[html, ...standaloneErrors].join("\n").matchAll(
      /(?:href|src|content|poster)="(?:https:\/\/nfc-portfolio-card\.vercel\.app)?(\/assets\/[^"?#]+)"/g,
    ),
  ].map((m) => m[1]),
);
for (const c of certificates) {
  paths.add(c.pdfUrl);
  paths.add(c.previewUrl);
}
for (const [name, { sha256 }] of Object.entries(cyaPredictions.images)) {
  const path = `/assets/media/cya/${name}`;
  paths.add(path);
  if (createHash("sha256").update(readFileSync(`dist${path}`)).digest("hex") !== sha256)
    throw new Error(`cya image changed since inference: ${path}`);
}
for (const path of paths) {
  const file = `dist${path}`;
  if (!statSync(file).size) throw new Error(`Empty public asset: ${file}`);
  const data = readFileSync(file);
  if (file.endsWith(".pdf") && data.subarray(0, 5).toString() !== "%PDF-")
    throw new Error(`Invalid PDF: ${file}`);
}
// JavaScript budgets, gzipped. The main bundle is on the critical path; the 3D
// stage (three.js) loads lazily, only when a figure is on screen.
const MAIN_BUDGET = 40 * 1024;
const LAZY_BUDGET = 160 * 1024;
const mainFile = html.match(/src="\/assets\/(index-[^"]+\.js)"/)?.[1];
for (const name of readdirSync("dist/assets").filter((n) =>
  n.endsWith(".js"),
)) {
  const size = gzipSync(readFileSync(`dist/assets/${name}`), {
    level: 9,
  }).length;
  const limit = name === mainFile ? MAIN_BUDGET : LAZY_BUDGET;
  if (size > limit) {
    throw new Error(
      `${name} is ${(size / 1024).toFixed(1)} kB gzipped, over its ${(limit / 1024).toFixed(0)} kB budget`,
    );
  }
}
// The page's Content-Security-Policy (vercel.json) allows inline scripts only
// by hash, so an edited inline script would be blocked in production. Every
// inline script in the built page must have its hash in the policy.
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const policies = vercel.headers
  .flatMap((rule) => rule.headers)
  .filter((h) => h.key === "Content-Security-Policy")
  .map((h) => h.value);
if (!policies.length)
  throw new Error("vercel.json has no Content-Security-Policy");
for (const [, body] of html.matchAll(
  /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,
)) {
  const hash = `'sha256-${createHash("sha256").update(body).digest("base64")}'`;
  for (const csp of policies) {
    if (!csp.includes(hash)) {
      throw new Error(
        `An inline script changed: put ${hash} in the CSP in vercel.json (script-src)`,
      );
    }
  }
}
// security.txt (RFC 9116) must be served and must not be about to expire.
const securityTxt = "dist/.well-known/security.txt";
if (!existsSync(securityTxt)) throw new Error(`Missing ${securityTxt}`);
const expires = readFileSync(securityTxt, "utf8").match(
  /^Expires: (.+)$/m,
)?.[1];
const left = (new Date(expires) - Date.now()) / 86_400_000;
if (!(left > 30)) {
  throw new Error(
    `security.txt expires ${expires}; move Expires on (at most a year ahead)`,
  );
}
if (!html.includes('id="work"') || !html.includes('class="static-case-study"'))
  throw new Error("Missing static portfolio content");
console.log(
  `Verified ${paths.size} public assets, static fallback content, the CSP script hashes and security.txt.`,
);
