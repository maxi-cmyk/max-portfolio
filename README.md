# Max Leong — NFC portfolio

Hello, this is the repo behind my personal webiste.

## Run locally

Use Node 20.19+ or Node 22.12+ and npm.

```sh
npm ci
npm run dev
```

Vite prints its local URL. Stop with Ctrl+C. To inspect the production build:

```sh
npm run build
npm run preview
```

## Content and assets

- `src/data/projects.js` owns the project cards (hook, role, proof, stack, links), the small projects that appear only in the Skills graph, group membership, and case-study blocks. Each case study is one page: a summary, one diagram in its own layout, and short notes, drawn by `src/components/case-map.js` for both the case scene and the no-JavaScript page.
- `src/data/focus-tools.js` owns the optional tooling disclosure and terminal skills output.
- `src/data/certificates.js` owns certificate metadata.
- `public/assets/` contains the public resume, certificate PDF/preview, favicon, and sharing image. These are versioned source assets, not generated deployment secrets.
- `npm run content` updates the marked static sections in `index.html`. Run it after editing project/certificate data. Development and production builds also run it automatically. Edit the generator rather than the HTML inside generated markers.
- Static project summaries, expandable case studies, certificate links, resume, and contact links remain available when JavaScript cannot load. Filters, terminal commands, and modal details enhance that content.

## Verify

```sh
npm run verify
```

This checks generated-content freshness, runs the Node tests, builds production output, and verifies linked public files exist and PDFs have valid headers. Run `git diff --check` before committing.

Browser checks should cover overlapping filters, reset, legacy category links, project open/close, Back/Forward, refresh/direct links, keyboard focus, and mobile layouts. Browser emulation is separate from real-device testing.

