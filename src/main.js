import { initMotion } from "./components/motion.js";
import { initBackgroundArt } from "./components/background-art.js";
import { initLedMatrix } from "./components/led-matrix.js";
import { runBoot } from "./components/boot.js";
import {
  getMascotHint,
  getTerminalPlaceholder,
} from "./terminal/easter-eggs.js";
import { initScenes, playHeroReveal } from "./components/scenes.js";
import { initFocusTooling } from "./components/focus-tooling.js";
import { initFigures } from "./components/figures.js";
import { initMenubar } from "./components/menubar.js";
import { initLocalTime } from "./components/local-time.js";
import { playHeroIntro } from "./components/hero-terminal.js";

// The easter egg that flashes "type alias" in the prompt lives on the hero console.
const input = document.querySelector("#hero-input");
const bootScreen = document.querySelector("#boot-screen");
const pandaMascot = document.querySelector("#panda-mascot");
const mascotHint = document.querySelector("#mascot-hint");

let mascotClicks = 0;
let aliasTeaserTimer;

function flashAliasPlaceholder() {
  input.placeholder = getTerminalPlaceholder(true);
  input.classList.add("is-alias-teaser");

  window.setTimeout(() => {
    input.placeholder = getTerminalPlaceholder(false);
    input.classList.remove("is-alias-teaser");
  }, 500);
}

function startAliasTeaser(active) {
  window.clearInterval(aliasTeaserTimer);
  input.placeholder = getTerminalPlaceholder(false);
  input.classList.remove("is-alias-teaser");
  if (!active) return;
  aliasTeaserTimer = window.setInterval(() => {
    const bounds = input.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < window.innerHeight)
      flashAliasPlaceholder();
  }, 12000);
}

function handleMascotClick() {
  mascotClicks += 1;
  const hint = getMascotHint(mascotClicks);

  if (!hint) return;

  mascotHint.hidden = false;
  mascotHint.textContent = `// ${hint}`;
  pandaMascot.classList.add("has-hint");
}

pandaMascot.addEventListener("click", handleMascotClick);
initFocusTooling();
initScenes();
initMenubar();
initLocalTime();
initFigures();
initBackgroundArt();
const motion = initMotion();
// The desk's motion (the OLED's attract mode) loads after first paint.
(window.requestIdleCallback ?? ((fn) => setTimeout(fn, 600)))(() =>
  import("./components/desk.js").then((module) => module.initDesk(motion)),
);
// The panda (poses, hints, reactions) takes over its button after first paint;
// until then the click handler above answers.
(window.requestIdleCallback ?? ((fn) => setTimeout(fn, 400)))(() =>
  import("./components/panda.js").then((module) => {
    pandaMascot.removeEventListener("click", handleMascotClick);
    module.initPanda({ hero: pandaMascot, heroSay: mascotHint });
  }),
);
// The pop-up menus replace the native selects after first paint.
(window.requestIdleCallback ?? ((fn) => setTimeout(fn, 500)))(() =>
  import("./components/popup-menu.js").then((module) =>
    module.initPopupMenus(),
  ),
);
motion.register(input, startAliasTeaser);
initLedMatrix(motion);
document.documentElement.classList.add("is-enhanced");
// The dot-matrix name (with its Fourier intro) loads right after first paint; until
// then, and if it cannot start, the h1's text is what shows.
const oled = import("./components/oled-name.js").then((module) =>
  module.initOledName(),
);
// The start screen (once per visit), then the hero's typed intro.
runBoot(bootScreen).finally(() =>
  playHeroIntro(
    () => oled.then((o) => (o ? o.play() : playHeroReveal())),
    () => oled.then((o) => (o ? o.finish() : playHeroReveal())),
  ),
);

// For anyone who opens DevTools: a greeting, and one of the hunt's flags,
// base64-encoded (see data/flags.js and `flags` in the console). The flag sits
// inside a fixed 63 bytes of random padding, off a 3-byte boundary, so the
// blob's length says nothing about the flag, and the well-known encoding of
// "flag{" (ZmxhZ3...) never appears: you have to decode it to see it.
console.log(
  "%cmax@portfolio:~$%c hello, fellow snoop. ʕ•ᴥ•ʔ",
  "color:#7a2e5d;font:700 14px monospace",
  "font:14px monospace",
);
console.log(
  "Found a bug? Report it the proper way: /.well-known/security.txt\nSince you're here, decode this: Y01yaHNsRDJmbGFne3Nub29weV9zbm9vcGVyfVdXV2VRaG9BdmpwT2RxVlRKTktMTW02cmxIRDFpcGlwQmRR\nType flags in the site's console to see the hunt.",
);
