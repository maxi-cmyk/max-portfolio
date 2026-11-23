// The easter egg hunt: seven flags hidden around the site, in the form
// flag{...}. Only their SHA-256 hashes are kept here, so reading the source
// doesn't give them away; `submit flag{...}` in the console checks one. A flag
// shown on screen is stored XOR-ed with the secret that unlocks it (the alias,
// the timing-attack password, the default login), so it can only be read by
// solving that puzzle (data/sealed.js). Found flags are remembered in this
// browser only.

export { SEALED, unseal } from "./sealed.js";

export const FLAGS = [
  {
    id: "alias",
    name: "The panda's alias",
    hint: "The prompt sometimes whispers a command. Then ask `alias`.",
    sha256: "6f3eaf0dabb72773a546ba2bb09095d9ec812cca6f9b90eb5f1a0fa6446dd83e",
  },
  {
    id: "recon",
    name: "An open port",
    hint: "Scan the host. Something odd is listening.",
    sha256: "6de655cedaec9e40d7e7554f81f656c7a1977f60e3c54223b9088cd36c013ace",
  },
  {
    id: "timing",
    name: "A leaky login",
    hint: "One user's shell is /usr/bin/login. Time it.",
    sha256: "0b92b4e3418aca3201b95d0292cdfbd2f9dd0066de01007a0939342fe6ac9d8b",
  },
  {
    id: "console",
    name: "DevTools",
    hint: "Developers open the browser console. So do snoops.",
    sha256: "107974838ad4d8a177408bafa92cb7ffe4a6303242960cab386c7855adfa0a49",
  },
  {
    id: "disclosure",
    name: "Responsible disclosure",
    hint: "Where would you report a bug here? RFC 9116 knows.",
    sha256: "be6bc122cf8db6a2fcd9a5685a074a321475db56819a95addcaeff113701a4ba",
  },
  {
    id: "robots",
    name: "Keep out, crawlers",
    hint: "What does robots.txt ask crawlers to skip?",
    sha256: "c7c6700f7998dc0bce437f8d9d4541ffeac8f38f0d803d40896d8df3e411e260",
  },
  {
    id: "card",
    name: "The physical card",
    hint: "Tap the real card with an NFC reader app, not just a browser.",
    sha256: "38e0cc65418143b33220ff52df5bfc1511606d3d09eb7d355501459be56f0804",
  },
];

const STORE = "portfolio.flags";

export function foundFlags() {
  try {
    const ids = JSON.parse(localStorage.getItem(STORE) ?? "[]");
    return FLAGS.map((f) => f.id).filter((id) => ids.includes(id));
  } catch {
    return [];
  }
}

// Marks a flag found. Returns true the first time.
export function markFound(id) {
  const found = foundFlags();
  if (found.includes(id)) return false;
  try {
    localStorage.setItem(STORE, JSON.stringify([...found, id]));
  } catch {
    // Private mode: it still counts for this visit's messages.
  }
  return true;
}
