// The About window as a live console. It reuses the terminal's runner, history and
// completion, with the hero's own commands (terminal/hero-script.js).
import { CommandHistory } from "../terminal/history.js";
import { getTerminalTabAction } from "../terminal/input.js";
import { getHeroCandidates, heroCommand } from "../terminal/hero-script.js";
import {
  appendCommand,
  appendSuggestions,
  revealLatest,
} from "./terminal/runner.js";
import { createLights } from "./lights.js";
import { screenPath } from "../data/mac-screen.js";
import { reduced } from "./reduced-motion.js";

const phone = () => matchMedia("(max-width: 699px)").matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function initHeroTerminal() {
  const about = document.querySelector("#home .about");
  const output = document.getElementById("hero-output");
  const form = document.getElementById("hero-form");
  const input = document.getElementById("hero-input");
  const bar = about?.querySelector(".titlebar");
  if (!about || !output || !form || !input || !bar) {
    return { open() {}, close() {}, toggle() {}, isOpen: () => false };
  }

  const history = new CommandHistory();
  // The little Mac's screen echoes what is typed, then the command just run,
  // then goes back to saying hello.
  const screen = about.querySelector(".mac-screen-text");
  let hello;
  const echo = (text, { settle = false } = {}) => {
    window.clearTimeout(hello);
    screen?.setAttribute("d", screenPath(text));
    if (settle) {
      hello = window.setTimeout(
        () => screen?.setAttribute("d", screenPath(input.value)),
        3500,
      );
    }
  };
  const target = { output, container: about, resolve: heroCommand };
  const title = bar.querySelector(".titlebar-title");
  const idleTitle = title.textContent;

  const lights = createLights({
    name: "About Max",
    onClose: () => exit(),
    onMinimize: () => exit(),
    onZoom: () => (about.classList.contains("is-terminal") ? exit() : enter()),
  });
  bar.querySelector(".lights")?.replaceWith(lights.el);
  const [red, yellow, green] = lights.el.querySelectorAll(".light");
  const viewport = window.visualViewport;
  const fitConsole = () => {
    const bottom =
      phone() && viewport.scale === 1
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
    about.style.setProperty("--console-viewport-bottom", `${bottom}px`);
  };
  const setDesktopInert = (inert) => {
    about.parentElement
      .querySelectorAll(".desktop-icons, .desk-artwork")
      .forEach((element) => (element.inert = inert));
  };
  const syncLights = () => {
    const on = about.classList.contains("is-terminal");
    for (const light of [red, yellow]) {
      light.classList.toggle("is-off", !on);
      light.disabled = !on;
    }
    lights.setZoomed(on);
    green.setAttribute(
      "aria-label",
      on ? "Shrink the console" : "Expand the console",
    );
  };

  function enter() {
    // An expanded console always shows its screen, with a first line if it is empty.
    output.hidden = false;
    if (!output.childElementCount) {
      const welcome = document.createElement("p");
      welcome.className = "welcome";
      welcome.textContent = "Type help to see available commands.";
      output.append(welcome);
    }
    about.classList.add("is-terminal");
    setDesktopInert(true);
    if (viewport) {
      fitConsole();
      viewport.addEventListener("resize", fitConsole);
      viewport.addEventListener("scroll", fitConsole);
    }
    title.textContent = "max@portfolio:~/console";
    syncLights();
    revealLatest(output);
  }
  function exit() {
    about.classList.remove("is-terminal");
    setDesktopInert(false);
    viewport?.removeEventListener("resize", fitConsole);
    viewport?.removeEventListener("scroll", fitConsole);
    about.style.removeProperty("--console-viewport-bottom");
    title.textContent = idleTitle;
    syncLights();
    input.blur();
  }
  syncLights();

  function run(command) {
    if (!command.trim()) return;
    history.push(command);
    echo(command, { settle: true });
    output.hidden = false;
    appendCommand(command, target);
    const result = heroCommand(command);
    // The panda reacts to what the console did (components/panda.js).
    window.dispatchEvent(
      new CustomEvent("portfolio:console", {
        detail: {
          kind: result.kind,
          unknown: /command not found/.test(result.output ?? ""),
        },
      }),
    );
    if (result.kind === "game")
      window.dispatchEvent(new Event("portfolio:play"));
    if (result.kind === "led") {
      window.dispatchEvent(new Event("portfolio:led-sound"));
      window.dispatchEvent(
        new CustomEvent("portfolio:led", { detail: { text: result.led } }),
      );
    }
    if (result.kind === "clear") {
      output.hidden = !about.classList.contains("is-terminal");
    } else if (
      // A phone's first command opens the full console; so does the panda egg,
      // whose drawing needs the room.
      (phone() || result.kind === "panda") &&
      result.kind !== "nav" &&
      !about.classList.contains("is-terminal")
    )
      enter();
  }

  input.addEventListener("input", () => echo(input.value));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = input.value;
    input.value = "";
    run(command);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      exit();
    } else if (event.key === "Tab") {
      const action = getTerminalTabAction(input.value, {
        shiftKey: event.shiftKey,
        candidates: getHeroCandidates(),
      });
      if (!action.preventDefault) return;
      event.preventDefault();
      const result = action.autocomplete;
      if (!result.hasMatch) return;
      if (result.completion) input.value = result.completion;
      if (result.hasMultiple) {
        output.hidden = false;
        appendSuggestions(
          input.value,
          result.matches,
          (selected) => {
            input.value = selected;
            input.focus();
          },
          target,
        );
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const previous = history.navigateUp(input.value);
      if (previous !== null) input.value = previous;
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = history.navigateDown();
      if (next !== null) input.value = next;
    }
  });

  // Leaving the desktop closes the expanded console; the output is kept.
  window.addEventListener("portfolio:scene", () => {
    if (document.documentElement.dataset.scene !== "hub") exit();
  });

  // The Terminal icon, the backtick key and `#terminal` open the console
  // expanded with the prompt focused; Esc and the red light close it.
  const api = {
    open() {
      enter();
      input.focus({ preventScroll: true });
    },
    close() {
      exit();
    },
    toggle() {
      api.isOpen() ? api.close() : api.open();
    },
    isOpen: () => about.classList.contains("is-terminal"),
    run,
  };
  return api;
}

// First arrival of a session: the banner types itself in about a second and a half.
// Any tap or key finishes it at once. Without motion, or on later visits, it shows
// at once, which is also what the page looks like without JavaScript.
export async function playHeroIntro(reveal, settle) {
  const about = document.querySelector("#home .about");
  const lines = [...document.querySelectorAll("#home .hero-line")];
  const seen = (() => {
    try {
      return sessionStorage.getItem("heroTyped") === "1";
    } catch {
      return false;
    }
  })();
  const hash = location.hash;
  if (
    !about ||
    lines.length < 2 ||
    reduced() ||
    seen ||
    (hash && hash !== "#home")
  ) {
    (settle ?? reveal)();
    return;
  }
  try {
    sessionStorage.setItem("heroTyped", "1");
  } catch {
    // Private mode: it may play again, which is harmless.
  }

  const typed = lines.map((line) => line.querySelector(".hero-typed"));
  const words = typed.map((span) => span.textContent);
  let skipped = false;
  const finish = () => {
    skipped = true;
    settle?.();
    typed.forEach((span, i) => (span.textContent = words[i]));
    about.classList.remove("is-intro");
    lines.forEach((line) => line.classList.remove("is-pending"));
  };
  const skip = () => {
    finish();
    cleanup();
  };
  const cleanup = () => {
    removeEventListener("pointerdown", skip, true);
    removeEventListener("keydown", skip, true);
  };
  addEventListener("pointerdown", skip, true);
  addEventListener("keydown", skip, true);

  about.classList.add("is-intro");
  typed.forEach((span) => (span.textContent = ""));
  lines.forEach((line) => line.classList.add("is-pending"));

  const type = async (i) => {
    lines[i].classList.remove("is-pending");
    for (const char of words[i]) {
      if (skipped) return;
      typed[i].textContent += char;
      await wait(30);
    }
  };

  await type(0);
  if (skipped) return reveal();
  await wait(140);
  about.classList.remove("is-intro-name");
  about.classList.add("is-intro-lede");
  reveal();
  await wait(650);
  if (skipped) return;
  await type(1);
  if (skipped) return;
  await wait(120);
  finish();
  cleanup();
}
