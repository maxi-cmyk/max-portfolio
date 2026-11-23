// The hunt's flags that are revealed on screen, XOR-ed with the secret that
// unlocks each (the alias, the timing-attack password, the default login), so
// they can only be read by solving the puzzle. Kept apart from flags.js so the
// panda's egg can open its flag without loading the whole hunt.
export const SEALED = {
  alias: "EgQEBRoaCV0+AVwHERoJOgEJXxET",
  recon: "V19SUEoDQ1JfbEMHQ0dsBgIABEo=",
  timing: "BA0MBRQKAxMBGzAKGggZPQMKAwoeHw==",
  robots: "BwgMDhVeBAIMHAIVOw4bC14SOx4dHAgPCDYPXQANAxQ=",
};

export function unseal(id, key) {
  const bytes = atob(SEALED[id]);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(
      bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    );
  }
  return out;
}
