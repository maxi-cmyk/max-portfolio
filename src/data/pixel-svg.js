// Turns a pixel grid (rows of colour keys, null for empty) into crisp SVG: one
// path per colour, one run of same-coloured pixels per rectangle. Colours are
// classes (c-k ink, c-p paper, ...) so CSS decides the actual colour. Shared by
// the desktop icons and the panda; kept on its own so the panda's lazy chunk
// does not pull the icon drawings into the main bundle. Pure: no DOM.
export function toSvg(g, className, extra = "") {
  const h = g.length;
  const w = g[0].length;
  const paths = {};
  g.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const k = row[x];
      if (!k) {
        x++;
        continue;
      }
      let n = 1;
      while (row[x + n] === k) n++;
      (paths[k] ??= []).push(`M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  });
  const body = Object.entries(paths)
    .map(([k, d]) => `<path class="c-${k}" d="${d.join("")}"/>`)
    .join("");
  return `<svg class="${className}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${body}${extra}</svg>`;
}
