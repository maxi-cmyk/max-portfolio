// Fig. 3 (timing-attack-lab): the attack as a short looping terminal session.
// Against the early-exit compare, each right leading character makes the
// reply slower, so the slowest guess gives the next character away. Against
// the constant-time compare every reply takes the same time. The timings are
// illustrative and exaggerated to be readable (the lab's own vulnerable mode
// adds 1 ms per matching byte); the caption says so.
import {
  BASE_MS,
  SECRET,
  SECRET_BYTES,
  STEP_MS,
  timingScript,
} from "./timing-math.js";

const MAX_MS = BASE_MS + STEP_MS * SECRET_BYTES;

function lineElement(line) {
  const el = document.createElement("div");
  el.className = `tt-line is-${line.kind}${line.slowest ? " is-slowest" : ""}`;
  if (line.kind === "guess") {
    el.innerHTML = `<span class="tt-cmd">$ guess <b></b></span><span class="tt-ms"></span><span class="tt-bar"></span>`;
  } else {
    el.textContent = line.kind === "head" ? `--- ${line.text} ---` : line.text;
  }
  return el;
}

function showReply(el, line) {
  el.querySelector(".tt-ms").textContent = `${line.ms} ms`;
  el.querySelector(".tt-bar").style.setProperty(
    "--w",
    `${Math.round((line.ms / MAX_MS) * 100)}%`,
  );
  el.classList.add("has-reply");
}

const status = (line) => {
  if (line.constant) return "Constant time: every guess takes the same time";
  if (line.round) {
    return `Early exit: finding character ${line.round} of ${SECRET.length}`;
  }
  return "";
};

export function mountTimingTerminal(container, { reduced, say, report }) {
  const script = timingScript();
  container.innerHTML = `<div class="tt" aria-hidden="true"><div class="tt-lines"></div></div>
    <p class="visually-hidden">${script
      .map((l) =>
        l.kind === "guess"
          ? `Guess ${l.guess}: ${l.ms} milliseconds${l.slowest ? ", the slowest" : ""}.`
          : `${l.text}.`,
      )
      .join(" ")}</p>`;
  const out = container.querySelector(".tt-lines");

  // Under reduced motion the whole session shows at once.
  const showAll = () => {
    out.replaceChildren(
      ...script.map((line) => {
        const el = lineElement(line);
        if (line.kind === "guess") {
          el.querySelector("b").textContent = line.guess;
          showReply(el, line);
        }
        return el;
      }),
    );
    say(`Early exit gives "${SECRET}" away; constant time gives nothing`);
  };
  if (reduced) {
    container.querySelector(".tt").classList.add("is-static");
    showAll();
    // Nothing plays, so there is nothing to pause.
    return { controls: false, setActive() {}, set() {}, destroy() {} };
  }

  // The session as timed frames: each applies one change, then waits.
  function* frames() {
    for (;;) {
      for (const line of script) {
        const el = lineElement(line);
        if (line.kind !== "guess") {
          yield [() => out.append(el), line.kind === "head" ? 500 : 950];
          continue;
        }
        yield [
          () => {
            out.append(el);
            say(status(line));
          },
          120,
        ];
        const name = el.querySelector("b");
        for (const c of line.guess) {
          yield [() => (name.textContent += c), 70];
        }
        yield [() => showReply(el, line), 420];
      }
      yield [() => {}, 2200];
      yield [() => out.replaceChildren(), 300];
    }
  }

  const tape = frames();
  let timer = 0;
  let active = false;
  let paused = false;
  let wait = 0;
  const run = () => {
    timer = 0;
    const [apply, next] = tape.next().value;
    apply();
    wait = next;
    schedule();
  };
  function schedule() {
    clearTimeout(timer);
    timer = 0;
    if (active && !paused) timer = setTimeout(run, wait);
  }

  return {
    setActive(on) {
      active = on;
      schedule();
    },
    set(id, value) {
      if (id !== "paused") return;
      paused = Boolean(value);
      report({ paused });
      schedule();
    },
    destroy() {
      clearTimeout(timer);
      active = false;
    },
  };
}
