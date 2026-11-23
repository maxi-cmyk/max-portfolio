// The /admin honeypot (an easter egg; robots.txt points here). Nothing is sent
// anywhere: the check runs in this page. The flag is stored XOR-ed with the
// default credentials, so it can only be read by logging in with them.
(() => {
  const SEALED = "BwgMDhVeBAIMHAIVOw4bC14SOx4dHAgPCDYPXQANAxQ=";
  const FLAG_COUNT = 7;
  const STORE = "portfolio.flags";
  const unseal = (key) => {
    const bytes = atob(SEALED);
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
      out += String.fromCharCode(
        bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length),
      );
    }
    return out;
  };
  const capture = () => {
    try {
      const found = JSON.parse(localStorage.getItem(STORE) ?? "[]");
      if (!found.includes("robots")) found.push("robots");
      localStorage.setItem(STORE, JSON.stringify(found));
      return found.length;
    } catch {
      return null;
    }
  };
  const form = document.getElementById("login");
  const result = document.getElementById("result");
  let tries = 0;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = form.user.value.trim();
    const pass = form.pass.value;
    form.pass.value = "";
    if (user === "admin" && pass === "admin") {
      const count = capture();
      result.textContent =
        "Welcome, admin. Default credentials: a classic.\n\n" +
        unseal(`${user}:${pass}`) +
        (count ? `\n\n⚑ Flag captured (${count} of ${FLAG_COUNT}).` : "") +
        "\nType flags in the site's console to see the rest.";
      return;
    }
    tries += 1;
    result.textContent =
      "Login failed. This attempt has been logged and reported to the panda. ʕ•̀ᴥ•́ʔ\n" +
      "(It hasn't. Nothing you type here leaves your browser.)" +
      (tries >= 3
        ? "\n\nHint: people forget to remove comments from page source."
        : "");
  });
})();
