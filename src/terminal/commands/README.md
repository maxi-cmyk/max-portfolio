# Terminal command modules

Each terminal response lives in the file for its feature:

- `about.js` — short personal introduction
- `project.js` — project entries, descriptions, and project-specific links
- `contact.js` — public profile links
- `help.js` — visible command help
- `panda.js` — hidden `thebananachip` response and panda art

`index.js` is only the command router. It imports these modules and maps typed command names to their responses.

## The easter egg hunt

`flags` in the hero console lists seven hidden `flag{...}` flags. The hunt's commands (`flags`, `hint`, `submit`, `alias`, `id`, `uname`, `nmap`, `nc`, `login`, `cat /etc/passwd`, `cat /etc/shadow`) are routed in `../hero-script.js` and run in `../hunt.js`, which loads only when one is typed. Flag hashes and the one-line hints `flags` shows live in `src/data/flags.js`; the three stronger hints per flag that `hint <n>` gives in turn live in `hunt.js`. Flags shown on screen are sealed in `src/data/sealed.js`. Flags found elsewhere live in `public/.well-known/security.txt`, `public/admin/` (pointed to by `public/robots.txt`), the DevTools greeting at the end of `src/main.js`, and the physical NFC card.
