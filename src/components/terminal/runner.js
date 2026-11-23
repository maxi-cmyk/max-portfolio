import { resolveCommand } from "../../terminal/commands/index.js";
import { getLatestResultScrollOptions } from "../../terminal/scroll.js";
import { createProjectInsightsButton } from "../project-insights-button.js";
import { reduced } from "../reduced-motion.js";

// Shows the newest result from its first line: its command row at the top of
// the pane (or as far down as the pane scrolls), so a long result never opens
// halfway through. The page itself moves only as far as needed to show the
// console.
export function revealLatest(output, { smooth = false } = {}) {
  const rows = output?.querySelectorAll(":scope > p");
  const row = rows?.[rows.length - 1];
  if (!row) return;
  const pad = parseFloat(getComputedStyle(output).paddingTop) || 0;
  const top =
    output.scrollTop +
    row.getBoundingClientRect().top -
    output.getBoundingClientRect().top -
    pad;
  output.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  output.scrollIntoView({ block: "nearest", behavior: "auto" });
}

// The runner prints into whatever console passes its own output pane, window and
// command resolver (the hero console in the About window).
export function appendCommand(command, target = {}) {
  const { output, container: terminalContainer } = target;
  const result = (target.resolve ?? resolveCommand)(command);

  if (result.kind === "clear") {
    output.replaceChildren();
    output.classList.remove("is-panda-output", "is-projects-output");
    output.scrollTop = 0;
    if (terminalContainer) {
      terminalContainer.scrollIntoView({
        behavior: "instant",
        block: "center",
      });
    }
    return;
  }

  const commandRow = document.createElement("p");
  commandRow.innerHTML =
    '<span class="prompt">max@portfolio:~$</span> <span class="command"></span>';
  commandRow.querySelector(".command").textContent = command;

  const resultRow = document.createElement(
    result.links || result.projects ? "div" : "pre",
  );
  // The panda egg's art gets its own class: plain "panda" is the mascot's
  // (panda.css sizes that to a 48px button).
  resultRow.className = `result ${result.kind === "panda" ? "panda-art" : result.kind}`;

  if (result.projects) {
    const heading = document.createElement("pre");
    heading.className = "result-text";
    heading.textContent = result.output;
    resultRow.append(heading);

    result.projects.forEach((projectData, index) => {
      const { slug, name, meta, description, links } = projectData;
      const project = document.createElement("section");
      project.className = "project-entry";

      const title = document.createElement("p");
      title.className = "project-title";
      title.textContent = `[${String(index + 1).padStart(2, "0")}] ${name} · ${meta}`;

      const summary = document.createElement("p");
      summary.className = "project-description";
      summary.textContent = description;

      const projectLinks = links.map(({ label, url }) => {
        const projectLink = document.createElement("a");
        projectLink.className = "terminal-link";
        projectLink.href = url;
        projectLink.target = "_blank";
        projectLink.rel = "noreferrer";
        projectLink.textContent = `${label === "github" ? "View source on GitHub" : label} ↗`;
        return projectLink;
      });

      const projectLinksContainer = document.createElement("div");
      projectLinksContainer.className = "project-entry-links";
      projectLinksContainer.append(...projectLinks);

      if (slug) {
        projectLinksContainer.append(createProjectInsightsButton(projectData));
      }

      project.append(title, summary, projectLinksContainer);
      resultRow.append(project);
    });
  } else if (result.links) {
    const text = document.createElement("pre");
    text.className = "result-text";
    text.textContent = result.output;
    resultRow.append(text);

    result.links.forEach(({ label, url, download }) => {
      const link = document.createElement("a");
      link.className = "terminal-link";
      link.href = url;
      if (download) {
        link.download = download;
      } else if (!url.startsWith("mailto:")) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      link.textContent = `${label} → ${url.replace(/^(https:\/\/|mailto:)/, "")}`;
      resultRow.append(link);
    });
  } else if (result.kind === "sudo") {
    const lines = result.output.split("\n");
    const prefersReducedMotion = reduced();

    if (prefersReducedMotion) {
      resultRow.textContent = result.output;
    } else {
      resultRow.textContent = "";
      lines.forEach((line, index) => {
        window.setTimeout(() => {
          resultRow.textContent += (index > 0 ? "\n" : "") + line;
          output.scrollTop = output.scrollHeight;
          output.scrollIntoView({ block: "nearest" });

          if (index === 1 && terminalContainer) {
            terminalContainer.classList.add("is-glitching");
          } else if (index === lines.length - 2 && terminalContainer) {
            terminalContainer.classList.remove("is-glitching");
          }
        }, index * 500);
      });
    }
  } else if (result.kind === "panda") {
    const stages = result.stages || [result.output];
    const prefersReducedMotion = reduced();

    const pandaMascot = document.querySelector("#panda-mascot");
    if (pandaMascot) {
      pandaMascot.classList.add("is-celebrating");
      window.setTimeout(
        () => {
          pandaMascot.classList.remove("is-celebrating");
        },
        (stages.length + 2) * 500,
      );
    }

    if (prefersReducedMotion) {
      resultRow.textContent = result.output;
    } else {
      resultRow.textContent = "";
      stages.forEach((stage, index) => {
        window.setTimeout(() => {
          resultRow.textContent += (index > 0 ? "\n" : "") + stage;
          output.scrollTop = output.scrollHeight;
          output.scrollIntoView({ block: "nearest" });
        }, index * 500);
      });
    }
  } else if (result.kind === "hunt") {
    resultRow.textContent = "";
    runHunt(result.command);
  } else {
    resultRow.textContent = result.output;
  }

  // A line printed after the result, for the hunt's commands and captures.
  function line(text) {
    resultRow.textContent += (resultRow.textContent ? "\n" : "") + text;
    revealLatest(output);
  }
  const io = {
    line,
    wait: (ms) =>
      reduced() ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)),
  };
  function runHunt(command) {
    import("../../terminal/hunt.js").then((hunt) => hunt.runHunt(command, io));
  }
  // A result that reveals a flag captures it once its text has printed.
  if (result.flag) {
    const printed =
      result.stages && !reduced() ? result.stages.length * 500 : 0;
    window.setTimeout(
      () =>
        import("../../terminal/hunt.js").then((hunt) =>
          hunt.capture(result.flag, io),
        ),
      printed,
    );
  }

  output.append(commandRow, resultRow);
  output.classList.toggle(
    "is-panda-output",
    Boolean(output.querySelector(".result.panda-art")),
  );
  output.classList.toggle(
    "is-projects-output",
    Boolean(output.querySelector(".result.projects")),
  );
  const streams = result.kind === "sudo" || result.kind === "panda";
  if (streams) output.scrollTop = output.scrollHeight;
  else window.requestAnimationFrame(() => revealLatest(output));

  if (result.navTarget) {
    window.setTimeout(() => {
      window.location.hash = result.navTarget;
    }, 150);
  }
}

export function appendSuggestions(
  currentInput,
  suggestions,
  onSelect,
  target = {},
) {
  const { output } = target;
  if (!output || !suggestions || suggestions.length === 0) return;

  const commandRow = document.createElement("p");
  commandRow.innerHTML =
    '<span class="prompt">max@portfolio:~$</span> <span class="command"></span>';
  commandRow.querySelector(".command").textContent = currentInput;

  const resultRow = document.createElement("div");
  resultRow.className = "result suggestions is-flash";

  const list = document.createElement("div");
  list.className = "suggestion-list";

  suggestions.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion-item";
    btn.textContent = item;
    btn.addEventListener("click", () => {
      if (typeof onSelect === "function") {
        onSelect(item);
      }
    });
    list.append(btn);
  });

  resultRow.append(list);
  output.append(commandRow, resultRow);
  output.scrollTop = output.scrollHeight;

  const prefersReducedMotion = reduced();

  window.requestAnimationFrame(() => {
    resultRow.scrollIntoView(
      getLatestResultScrollOptions(prefersReducedMotion),
    );
  });
}
