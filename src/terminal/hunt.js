// The easter egg hunt's console commands (see data/flags.js). Loaded only when
// one is typed. `io.line(text)` prints a line, `io.wait(ms)` pauses (no pause
// under reduced motion).
import { FLAGS, foundFlags, markFound, unseal } from "../data/flags.js";

export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Prints the capture line for a flag that was just revealed on screen.
export function capture(id, io) {
  const first = markFound(id);
  const name = FLAGS.find((f) => f.id === id).name;
  io.line(
    first
      ? `⚑ Flag captured: ${name} (${foundFlags().length} of ${FLAGS.length}). Type flags to see the rest.`
      : `⚑ Already captured: ${name}.`,
  );
}

function listFlags(io) {
  const found = foundFlags();
  io.line(
    `Capture the flags: ${found.length} of ${FLAGS.length} found. They look like flag{...}.`,
  );
  io.line("");
  // The hint goes on its own line, so the list reads at any width.
  FLAGS.forEach((f, i) => {
    const done = found.includes(f.id);
    io.line(`[${done ? "x" : " "}] ${i + 1}. ${f.name}`);
    if (!done) io.line(`       ${f.hint}`);
  });
  io.line("");
  if (found.length === FLAGS.length) {
    io.line("All six. Nicely done. Tell me how you found them: contact.");
    return;
  }
  io.line("Stuck? hint 3 nudges you on flag 3. Ask again for a stronger one.");
  io.line("Found one outside the console? submit flag{...}");
}

// ---------- Hints ----------
// Three per flag, each stronger than the last, beyond the one `flags` shows.
// The last one leaves a single step to take. Kept here, in the lazy chunk.
const HINTS = {
  alias: [
    "Watch the grey suggestion as you type in this console. Now and then it offers a word you'd never guess.",
    "Type alias. One shortcut is half hidden: th*********ip. The prompt's suggestions know the rest.",
    "Thirteen letters, starts with th, ends with ip, and a panda would snack on it. Type it as one word.",
  ],
  recon: [
    "Recon starts with a port scan. nmap is installed here: scan the host called max.",
    "nmap max shows one port that isn't a normal service. Connect to it with nc <host> <port>.",
    "Port 1337 is listening. nc max 1337.",
  ],
  timing: [
    "cat /etc/passwd lists the users. One logs in through /usr/bin/login, so try login with any password.",
    "Wrong passwords don't all fail equally fast: each right letter makes the check take longer. login ? times every first letter.",
    "Grow it a letter at a time: the slowest from login ? starts the next guess, as in login b?. It's six letters long.",
  ],
  console: [
    "Open the browser's developer tools (F12, or ⌥⌘I on a Mac) and read the Console tab. Reload if it's empty.",
    "One message asks you to decode a string. It's base64.",
    'Paste it into atob("...") in that same console. The flag is in the middle of what comes out.',
  ],
  disclosure: [
    "Websites publish a security contact at a standard address, set out in RFC 9116.",
    "The address is /.well-known/security.txt. Open it in the address bar.",
    "Read /.well-known/security.txt to the very last line, then submit what's there.",
  ],
  robots: [
    "robots.txt tells search engines what to skip. Open /robots.txt on this site.",
    "It hides /admin. Open that, then view the page source (⌥⌘U on a Mac, Ctrl+U elsewhere).",
    "A comment in the source admits the default login was never changed. The username and password are the same word.",
  ],
};

// How many hints each flag has had this visit.
const hintsGiven = new Map();

// `hint` alone nudges on the first flag not yet found; `hint 3` on flag 3.
export function hint(arg, io) {
  const found = foundFlags();
  let index;
  if (!arg) {
    index = FLAGS.findIndex((f) => !found.includes(f.id));
    if (index === -1) {
      io.line("All six found. No hints needed.");
      return;
    }
  } else {
    index = Number(arg) - 1;
    if (!Number.isInteger(index) || !FLAGS[index]) {
      io.line(`usage: hint [1-${FLAGS.length}]   the numbers are in flags`);
      return;
    }
  }
  const flag = FLAGS[index];
  const label = `${index + 1}. ${flag.name}`;
  if (found.includes(flag.id)) {
    io.line(`You already have ${label}.`);
    return;
  }
  const hints = HINTS[flag.id];
  const level = Math.min((hintsGiven.get(flag.id) ?? 0) + 1, hints.length);
  hintsGiven.set(flag.id, level);
  io.line(`Hint ${level} of ${hints.length} for ${label}:`);
  io.line(`  ${hints[level - 1]}`);
  if (level < hints.length) io.line(`Still stuck? hint ${index + 1} again.`);
}

async function submit(text, io) {
  const flag = text.trim();
  if (!/^flag\{[^}]+\}$/.test(flag)) {
    io.line("usage: submit flag{...}");
    return;
  }
  const hash = await sha256(flag);
  const match = FLAGS.find((f) => f.sha256 === hash);
  if (!match) {
    io.line("✗ Not a flag from this site. Keep looking.");
    return;
  }
  capture(match.id, io);
}

// ---------- Recon ----------
const HOSTS =
  /^(max|localhost|127\.0\.0\.1|portfolio|nfc-portfolio-card\.vercel\.app)$/;

const PASSWD = `root:x:0:0:root:/root:/bin/bash
max:x:1000:1000:Max Leong:/home/max:/bin/zsh
panda:x:1337:1337:panda.sys,,,:/home/panda:/usr/bin/login
visitor:x:1001:1001::/home/visitor:/bin/sh`;

async function nmap(host, io) {
  if (!host) {
    io.line("usage: nmap <host>   e.g. nmap max");
    return;
  }
  if (!HOSTS.test(host)) {
    io.line(
      `Note: ${host} is not this site. Scan only what you own: try nmap max.`,
    );
    return;
  }
  io.line(`Starting Nmap 7.95 against ${host} (127.0.0.1)`);
  await io.wait(500);
  for (const row of [
    "PORT      STATE     SERVICE",
    "22/tcp    closed    ssh",
    "80/tcp    open      http      redirects to 443",
    "443/tcp   open      https     the portfolio, HSTS preload",
    "1337/tcp  open      panda?    unknown banner",
    "8080/tcp  filtered  http-proxy",
  ]) {
    io.line(row);
    await io.wait(120);
  }
  io.line("Nmap done: 1 host up, scanned in 0.42 seconds.");
}

async function netcat(host, port, io) {
  if (!host || !port) {
    io.line("usage: nc <host> <port>");
    return;
  }
  if (!HOSTS.test(host)) {
    io.line(`nc: ${host}: not this site. Try nc max <port>.`);
    return;
  }
  if (port !== "1337") {
    io.line(
      `nc: connect to ${host} port ${port} (tcp) failed: Connection refused`,
    );
    return;
  }
  io.line(`Connected to ${host}:1337.`);
  await io.wait(400);
  io.line("panda.sys v1.3.37 ready. ʕ•ᴥ•ʔ");
  await io.wait(400);
  io.line("> you found my back door. here, have a snack:");
  await io.wait(400);
  io.line(unseal("recon", "1337"));
  io.line("Connection closed by foreign host.");
  capture("recon", io);
}

// ---------- The leaky login ----------
// The password is kept only as the SHA-256 of each of its prefixes. The check
// walks it one character at a time and stops at the first wrong one, and each
// right character costs time: the early-exit comparison timing-attack-lab
// measures. Reading the response times gives the password away, one letter at
// a time. (The times are simulated, with a little jitter.)
const PREFIXES = [
  "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
  "970f519c2cadbcefb1e81694f904bc6229dd2a8300e98c6d0d4fc4bfca584140",
  "bd66796784e4bb256fb9b0f4a9e1a13330e9122b261baf72e443ee97968d5fbe",
  "c5db57bbb8ab118cfc285ee540ff7259335695af73fd829ea411670a25cdae1a",
  "ac66763969e0e2b9be0092dd008739fcbee92fd32aa62ceb0b9525abf5f7bf84",
  "add1743eae5bbd8ea17b3d3b3531d0f3de072d10599edc0d8e107af90e52245a",
];
export const LOGIN = { base: 38, perChar: 52, jitter: 14 };

// How many leading characters of `guess` are right: the early exit.
export async function matchingPrefix(guess) {
  let n = 0;
  while (
    n < guess.length &&
    n < PREFIXES.length &&
    (await sha256(guess.slice(0, n + 1))) === PREFIXES[n]
  ) {
    n += 1;
  }
  return n;
}

export async function responseTime(guess, random = Math.random) {
  const n = await matchingPrefix(guess);
  return Math.round(LOGIN.base + n * LOGIN.perChar + random() * LOGIN.jitter);
}

let failures = 0;

async function login(guess, io) {
  if (!guess) {
    io.line("panda.sys login. usage: login <password>");
    return;
  }
  // `login ba?` times every letter in place of the ?.
  if (guess.includes("?")) {
    const rows = [];
    for (const c of "abcdefghijklmnopqrstuvwxyz") {
      const g = guess.replace("?", c);
      rows.push(
        `${g.padEnd(guess.length + 1)}${String(await responseTime(g)).padStart(4)} ms`,
      );
    }
    // Four to a line on a laptop, two on a phone.
    const cols = globalThis.matchMedia?.("(max-width: 699px)").matches ? 2 : 4;
    for (let i = 0; i < rows.length; i += cols) {
      io.line(rows.slice(i, i + cols).join("    "));
      await io.wait(60);
    }
    io.line("The slowest guess got furthest through the check.");
    return;
  }
  const ms = await responseTime(guess);
  await io.wait(ms);
  if (
    guess.length === PREFIXES.length &&
    (await matchingPrefix(guess)) === PREFIXES.length
  ) {
    failures = 0;
    io.line(`Access granted (${ms} ms). Welcome back, panda.`);
    io.line(unseal("timing", guess));
    io.line(
      "The check gave the password away one letter at a time. That's timing-attack-lab: open timing-attack-lab.",
    );
    capture("timing", io);
    return;
  }
  failures += 1;
  io.line(`Access denied. (${ms} ms)`);
  if (failures === 2) {
    io.line(
      "Hint: the response times aren't all the same. login ? times every letter in place of the ?, and login a? the next one.",
    );
  }
}

// `command` is the whole line as typed.
export async function runHunt(command, io) {
  const line = command.trim().replace(/\s+/g, " ");
  const [word, ...rest] = line.split(" ");
  const lower = word.toLowerCase();
  if (lower === "flags") return listFlags(io);
  if (lower === "submit") return submit(rest.join(" "), io);
  if (lower === "hint" || lower === "hints") return hint(rest[0], io);
  if (lower === "alias") {
    io.line("alias ll='ls -l'");
    io.line("alias please='sudo'");
    io.line("alias panda='th*********ip'");
    return;
  }
  if (lower === "id") {
    io.line(
      "uid=1001(visitor) gid=1001(visitor) groups=1001(visitor),27(curious)",
    );
    return;
  }
  if (lower === "uname") {
    io.line(
      rest[0] === "-a"
        ? "PandaOS portfolio 1.3.37 #1 SMP PREEMPT x86_64 GNU/Bamboo"
        : "PandaOS",
    );
    return;
  }
  if (lower === "nmap") return nmap(rest.at(-1), io);
  if (lower === "nc" || lower === "telnet") return netcat(rest[0], rest[1], io);
  if (lower === "login") return login(rest.join(" "), io);
  if (line === "cat /etc/passwd") {
    for (const row of PASSWD.split("\n")) io.line(row);
    return;
  }
  if (line === "cat /etc/shadow") {
    io.line("cat: /etc/shadow: Permission denied");
    return;
  }
  io.line(`${word}: command not found`);
}
