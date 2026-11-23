// The desk comes alive: the ESP32's LED cycles through the three bands' colours
// (in CSS) and the OLED plays an Asteroids attract mode. Nothing follows the
// pointer. It runs only while the desktop is on screen, and stops for reduced
// motion. Loaded after first paint.
const onHub = () => document.documentElement.dataset.scene === "hub";

// ---- the OLED's attract mode: vector rocks drift, a ship turns and fires -------
const W = 108;
const H = 56;
function rock(seed, size) {
  const points = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = size * (0.7 + 0.3 * Math.abs(Math.sin(seed * 7.3 + i * 2.1)));
    points.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return points;
}

function initAttract(display, motion) {
  const canvas = document.createElement("canvas");
  canvas.className = "oled-attract";
  canvas.width = W;
  canvas.height = H;
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  display.append(canvas);
  const rocks = [
    { x: 20, y: 14, vx: 0.18, vy: 0.1, s: 8, seed: 1, spin: 0.01, a: 0 },
    { x: 80, y: 40, vx: -0.12, vy: 0.14, s: 10, seed: 2, spin: -0.008, a: 1 },
    { x: 54, y: 8, vx: 0.08, vy: -0.1, s: 6, seed: 3, spin: 0.014, a: 2 },
    { x: 96, y: 12, vx: -0.16, vy: -0.06, s: 5, seed: 4, spin: -0.012, a: 3 },
  ].map((r) => ({ ...r, shape: rock(r.seed, r.s) }));
  let ship = 0;
  let shot = null;
  let tick = 0;
  let raf = 0;
  let last = 0;
  let active = false;

  const line = (points, x, y, a) => {
    ctx.beginPath();
    points.forEach(([px, py], i) => {
      const rx = x + px * Math.cos(a) - py * Math.sin(a);
      const ry = y + px * Math.sin(a) + py * Math.cos(a);
      i ? ctx.lineTo(rx, ry) : ctx.moveTo(rx, ry);
    });
    ctx.closePath();
    ctx.stroke();
  };

  function frame(now) {
    raf = 0;
    if (active && onHub()) raf = requestAnimationFrame(frame);
    else return;
    if (now - last < 50) return; // 20 ms steps are the game's; 50 ms is plenty here
    last = now;
    tick++;
    ctx.fillStyle = "#d9edf6";
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#12376b";
    for (const r of rocks) {
      r.x = (r.x + r.vx + W + r.s * 2) % (W + r.s * 2);
      r.y = (r.y + r.vy + H + r.s * 2) % (H + r.s * 2);
      r.a += r.spin;
      line(r.shape, r.x - r.s, r.y - r.s, r.a);
    }
    // The ship turns slowly in the middle and fires a shot every couple of seconds.
    ship += 0.05;
    ctx.strokeStyle = "#7a2e5d";
    line(
      [
        [0, -5],
        [3.5, 4],
        [0, 2],
        [-3.5, 4],
      ],
      W / 2,
      H / 2,
      ship,
    );
    if (tick % 36 === 0)
      shot = { x: W / 2, y: H / 2, a: ship - Math.PI / 2, life: 18 };
    if (shot) {
      shot.x += Math.cos(shot.a) * 3;
      shot.y += Math.sin(shot.a) * 3;
      ctx.fillStyle = "#7a2e5d";
      ctx.fillRect(shot.x - 1, shot.y - 1, 2, 2);
      if (--shot.life <= 0) shot = null;
    }
  }
  const kick = () => {
    if (!raf && active && onHub()) {
      raf = requestAnimationFrame(frame);
    }
  };
  motion.register(display, (running) => {
    active = running;
    kick();
  });
  window.addEventListener("portfolio:scene", kick);
}

export function initDesk(motion) {
  const oled = document.querySelector("#home .asteroids-art .desk-object");
  if (oled) initAttract(oled, motion);
}
