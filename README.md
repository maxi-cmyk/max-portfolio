# Max Leong — NFC portfolio

A Vite site with a retro desktop theme, a retro Macintosh-style desktop (pixel icons, an About window, and every other scene as a window with close, minimize and zoom boxes, a menu bar, and a workbench desk with the project boards lying on it), the About window as a live console (typed banner, `cat <project>`, `open <name>`, `led <text>` for the desk's LED matrix; the little Mac's screen echoes what you type), a command palette, and one shared project collection, Skills as a pencil-drawn stack of layers from the hardware up, each skill saying what it did in each project, dark instrument screens (a dot-matrix name drawn by Fourier circles again every 14 seconds, datasheet strips, 3D figures), and a desk of project boards that move and link. Without JavaScript it is one linear page. Three project groups (Signals & hardware, Systems & security, Applied AI & products) filter work with any-match logic; each project has one case-study URL. Facts that are not yet known are left off the page rather than invented; `npm run wip` lists every gap.

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

## URLs

- `#home`, `#work`, `#skills`, `#certificates` (also `#credentials`), `#contact`: scenes. The Terminal icon and `#terminal` open the expanded console with the prompt focused. Esc closes it.
- `#work/echo` opens Echo in the project pager. `#project/echo` opens its single-page case study, including from old numbered or `/read` links.
- `#project/asteroids` opens the single-page Asteroids case study. Older numbered links resolve here.
- `#work?categories=signals-hardware,applied-ai`: the pager walks only the matching projects (add `&project=<slug>` to pick one).
- `#project/music-leds`: a permanent case-study link.
- Existing `#focus` and `#focus/<category>` links map to the shared work index. The retired ids `engineering`, `cybersecurity`, `ai-math` and `hackathons` still resolve (to the new groups, or to all work for `hackathons`).
- Unknown fragments show a recovery message with a link to all work.

Closing a project opened from the site returns through browser history and restores the list position and initiating control. A direct or refreshed project link returns to the saved browsing context when available, otherwise all work.

## Deploy

Publish `dist/` using a static host. The build command is `npm ci && npm run verify`; the output directory is `dist`. Public asset paths assume the site is served at the domain root. No backend, environment variables, or credentials are required. Configure the host to serve `index.html` for the root; routing uses URL fragments.

The social preview image uses a root-relative URL. If a host or sharing crawler requires absolute social-image URLs, set the production origin there once the final domain is known; no domain is assumed in this repository.

`nextSteps.md` and `.impeccable/` remain local planning/review files. Builds and `node_modules/` stay ignored. No deployment is performed by the local build commands.

## Keyboard and touch

Cmd/Ctrl+K opens the palette. The project picker, pager buttons, arrows and swipes navigate Work. Focused media and input controls handle their own arrow keys. Esc goes up one level. Scene logic lives in `src/navigation/scenes.js` (pure, tested) and `src/components/scenes.js` (DOM).

## Photos, screenshots and clips

Each work card has a media slot (`media` in `src/data/projects.js`). Until a file exists nothing is shown for it (`npm run wip` says what to supply). To fill one, put the file in `public/assets/media/` (for example `music-leds.webp`, `conway.mp4`, plus a `poster` image for clips) and set `src`, `alt`, and optionally `poster`, `width`, `height` and `caption`; then run `npm run content`. Alt text is required: the tests fail while `alt` is still WIP, or when a named file is missing.

## Motion

Scene changes use four short smooth transitions that animate only opacity and transform (open, close, slide, fade; `src/navigation/transitions.js` picks one, `src/components/transitions.js` plays it). The shared 3D canvas is hidden while a window moves and fades back in afterwards. Reduced motion applies every change at once.

## Windows

Every window has a striped title bar with a boxed shell-prompt title (`max@portfolio:~/work`) and three square buttons: red closes it (one level up, like Esc), amber minimizes it to its desktop icon (opening the icon restores the same place), green zooms it to full screen. Pure state lives in `src/navigation/windows.js`; the buttons are `src/components/lights.js`.

## 3D figures

Figures sit in the Work panel's carousel (`src/components/exhibit.js`). Two are Three.js drawings in the site's blueprint style: a Fourier winding machine (music_LED) and a torus rendering the wrap-around of Conway's flat 32×8 LED grid. Two are HTML panels that need no WebGL (`src/figures/panels.js`): a looping terminal session of the timing attack (timing-attack-lab), and a photo and an AI-generated scene with recorded cya predictions, before and after JPEG, blur and resizing. `src/data/figures.js` says which project gets which figure, what its controls are, and what is real or illustrative in its caption. One shared off-screen WebGL renderer (`src/figures/stage.js`) draws each figure and copies it into a canvas inside its host, so figures scroll with the page, and the whole 3D chunk loads lazily: when a figure comes on screen, or about 2.5s after the page settles, when it is fetched and each figure's shaders are compiled in idle time so no first frame stalls. Either way only if the device qualifies (`src/figures/mode.js`). Reduced motion draws one still frame; no WebGL, Save-Data or a weak device keep the pixel-art drawing. `npm run verify` enforces gzip budgets: 40 kB for the main bundle and 160 kB per lazy chunk.
