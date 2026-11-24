import assert from "node:assert/strict";
import test from "node:test";
import { allProjects } from "../src/data/projects.js";
import { parseRoute } from "../src/navigation/routes.js";
import {
  LED_MAX,
  getHeroCandidates,
  heroCommand,
} from "../src/terminal/hero-script.js";

test("common typed commands run and print something", () => {
  for (const command of ["about", "skills", "projects", "contact", "resume"]) {
    const result = heroCommand(command);
    assert.ok(result.output, `${command} printed nothing`);
    assert.notEqual(result.kind, "error", command);
  }
});

test("navigation commands go to routes that exist", () => {
  for (const word of [
    "projects",
    "work",
    "skills",
    "certs",
    "credentials",
    "open contact",
    "open terminal",
  ]) {
    const result = heroCommand(word);
    assert.equal(result.kind, "nav", word);
    assert.notEqual(parseRoute(result.navTarget).kind, "missing", word);
  }
});

test("every featured project can be read with cat and opened with open", () => {
  for (const project of allProjects) {
    const read = heroCommand(`cat ${project.slug}`);
    assert.match(read.output, new RegExp(project.name.replace(/[()]/g, "")));
    assert.ok(read.output.includes(project.hook), project.slug);
    assert.deepEqual(read.links, project.links);
    const go = heroCommand(`open ${project.slug}`);
    assert.equal(go.navTarget, `#work/${project.slug}`);
    assert.equal(parseRoute(go.navTarget).slug, project.slug);
  }
});

test("unknown names are errors that say what to try, never guesses", () => {
  assert.equal(heroCommand("cat nothing-here").kind, "error");
  assert.equal(heroCommand("open nowhere").kind, "error");
  assert.match(heroCommand("open nowhere").output, /ls/);
  assert.equal(heroCommand("frobnicate").kind, "error");
});

test("led accepts what the matrix can draw and refuses the rest", () => {
  const ok = heroCommand("led hello, world!");
  assert.equal(ok.kind, "led");
  assert.equal(ok.led, "HELLO, WORLD!");
  assert.equal(heroCommand("led").kind, "error");
  assert.equal(heroCommand("led héllo").kind, "error");
  assert.equal(heroCommand(`led ${"a".repeat(LED_MAX + 1)}`).kind, "error");
  assert.equal(heroCommand(`led ${"a".repeat(LED_MAX)}`).kind, "led");
});

test("the old terminal's commands still work in the hero", () => {
  assert.equal(heroCommand("contact").kind, "contact");
  assert.equal(heroCommand("resume").kind, "resume");
  assert.equal(heroCommand("clear").kind, "clear");
  assert.equal(heroCommand("thebananachip").kind, "panda");
  assert.equal(heroCommand("sudo rm -rf /").kind, "sudo");
});

test("help lists every command the hero adds", () => {
  const help = heroCommand("help").output;
  for (const word of [
    "whoami",
    "ls",
    "cat <project>",
    "open <name>",
    "led <text>",
  ]) {
    assert.ok(help.includes(word), word);
  }
});

test("the arcade commands are gone and the Asteroids project still opens", () => {
  for (const command of ["play", "asteroids"]) {
    assert.equal(heroCommand(command).kind, "error");
    assert.ok(!getHeroCandidates().includes(command));
  }
  assert.doesNotMatch(heroCommand("help").output, /^\s*play\b/m);
  assert.equal(heroCommand("open asteroids").navTarget, "#work/asteroids");
});

test("tab completion knows the hero's words and the project names", () => {
  const words = getHeroCandidates();
  for (const word of ["whoami", "ls", "led ", "cat music-leds", "open echo"]) {
    assert.ok(words.includes(word), word);
  }
});
