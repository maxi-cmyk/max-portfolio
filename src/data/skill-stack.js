// Skills and concepts are backed by project records. The static Skills pages
// are generated from this data.
import { getSkillGraph, skillId } from "./skills.js";

export const SKILL_CATEGORIES = [
  {
    id: "languages",
    label: "Languages",
    doodle: "code",
    focus: true,
    tags: ["C", "C++", "Python", "JavaScript", "TypeScript"],
  },
  {
    id: "hardware",
    label: "Hardware & protocols",
    short: "Hardware",
    doodle: "chip",
    focus: true,
    tags: [
      "ESP32",
      "ESP32-CAM",
      "MAX7219",
      "Web Serial",
      "MJPEG",
      "SSE",
      "WebSockets",
    ],
  },
  { id: "concepts", label: "Concepts", doodle: "lens", focus: true, tags: [] },
  {
    id: "frameworks",
    label: "Frameworks & web APIs",
    short: "Frameworks",
    doodle: "window",
    tags: [
      "React",
      "Next.js",
      "FastAPI",
      "Flask",
      "Electron",
      "Celery",
      "Scapy",
      "WebAssembly",
      "Canvas",
      "Gamepad API",
    ],
  },
  {
    id: "ai",
    label: "AI & vision",
    short: "AI",
    doodle: "eye",
    tags: [
      "PyTorch",
      "CLIP / RINE",
      "YOLOv8",
      "MediaPipe",
      "OpenAI",
      "LLaVA",
      "ElevenLabs",
    ],
  },
  {
    id: "data",
    label: "Data & services",
    short: "Data",
    doodle: "db",
    tags: [
      "PostgreSQL",
      "Supabase",
      "SQLite",
      "ClickHouse",
      "Redis",
      "Railway",
      "Clerk",
      "Blynk",
      "Vite",
    ],
  },
];

export const CONCEPT_TAGS = {
  "DFT / FFT": "Fourier transforms",
  hmac: "Timing side channels",
};

const CONCEPTS = {
  "Fourier transforms": {
    "music-leds": "compares direct DFT and radix-2 FFT implementations",
  },
  "Timing side channels": {
    "timing-attack-lab": "compares early-exit and constant-time checks",
  },
  "Bit packing": {
    "conway-game-of-life": "packs 256 cells into eight 32-bit rows",
  },
  "One core, two targets": {
    asteroids: "shares C++ gameplay across ESP32 and WebAssembly builds",
  },
  "Live streaming": {
    "conway-game-of-life":
      "sends changed board snapshots over Server-Sent Events",
    "network-sniffer":
      "streams captured traffic to the dashboard over WebSockets",
    sentinel: "serves a live MJPEG stream from the ESP32-CAM",
  },
  "Packet capture": {
    "network-sniffer": "captures and parses packets with Scapy",
  },
  "Background jobs": { itspeak: "runs media analysis in a Celery worker" },
  "Robustness testing": {
    cya: "evaluates accuracy under JPEG compression, blur and resizing",
  },
  "Human review": {
    echo: "requires caregiver approval before delivering a memory",
  },
  Fallbacks: {
    itspeak: "shows rule-based coaching cards if the model is unavailable",
  },
};

// What each skill did in each project. Twelve words at most.
export const USES = {
  "music-leds": {
    "C++": "firmware with a direct DFT and an iterative radix-2 FFT",
    JavaScript: "browser walkthrough that traces each FFT stage on one frame",
    ESP32: "samples a microphone at 6.4 kHz and drives an RGB LED",
    "DFT / FFT":
      "128-point transform with 50 Hz bins, checked on known signals",
    "Web Serial":
      "streams samples and coefficients from the board to the browser",
  },
  "timing-attack-lab": {
    Python: "attacker that times candidate bytes and scores them",
    Flask: "login endpoint with vulnerable and constant-time modes",
    C: "C server for a Python-versus-C timing comparison",
    hmac: "constant-time comparison that closes the early-exit leak",
  },
  "conway-game-of-life": {
    ESP32: "runs a 32×8 toroidal Game of Life and an HTTP service",
    "C++": "eight uint32_t rows; bit shifts and popcount each generation",
    MAX7219: "drives four chained FC-16 modules as one 32×8 display",
    SSE: "streams changed board snapshots to the dashboard",
    React: "dashboard charting density, entropy and autocorrelation",
  },
  asteroids: {
    "C++": "one gameplay core shared by the ESP32 and browser builds",
    ESP32: "arcade build with a 128×64 OLED, joystick and buzzer",
    WebAssembly: "runs the shared C++ gameplay in the browser",
    Canvas: "renders the 480×270 pixel-art world",
    "Gamepad API": "PS4 controller play with remappable controls",
  },
  itspeak: {
    Python: "video and audio analysis of rehearsal recordings",
    FastAPI: "upload and job orchestration for the analysis",
    Celery: "runs the heavy media analysis outside the request",
    Redis: "carries job state between the API and the worker",
    Railway: "hosts the deployed back-end services",
    MediaPipe: "eye contact, posture, gesture and movement signals",
    OpenAI: "coaching cards from scored telemetry, with a rule-based fallback",
  },
  echo: {
    "Next.js": "the app, and the route that sends uploads for captioning",
    Supabase: "storage for uploaded photos and videos",
    PostgreSQL: "stores memories with review states and cooldowns",
    LLaVA: "locally hosted; drafts summary, people, place and date",
    ElevenLabs: "generated or familiar-voice narration",
  },
  cya: {
    Python: "data pipeline, baselines, evaluation and robustness tooling",
    PyTorch: "trains a linear head on frozen CLIP features",
    "CLIP / RINE": "intermediate CLIP features behind the retained detector",
    FastAPI: "inference service sharing the model with the CLI",
    React: "demo interface, built by a teammate",
  },
  sentinel: {
    ESP32: "reads PIR motion and drives the buzzer and status LED",
    "ESP32-CAM": "serves a live stream and captures flash-assisted JPEGs",
    "C++": "firmware for the sensor and camera nodes",
    Blynk: "routes the capture trigger and logs intrusion alerts",
    MJPEG: "streams camera frames over HTTP",
  },
  "network-sniffer": {
    Scapy: "captures and parses packets",
    FastAPI: "serves the live packet stream",
    WebSockets: "pushes batches of packets to the dashboard",
    "Next.js": "renders the live traffic dashboard",
  },
  lockingang: {
    Electron: "hosts the desktop app and starts its chatbot server",
    React: "renders the study planner and review interface",
    FastAPI: "serves the chatbot API to the desktop app",
    SQLite: "stores study data with WAL for background updates",
  },
  epicenter: {
    "Next.js": "renders separate patient and staff applications",
    FastAPI: "serves registration, queue and review workflows",
    Supabase: "stores appointments, queue tickets and audit events",
    Clerk: "authenticates patient and staff accounts",
    OpenAI: "analyzes documents and supports the reviewed assistant",
  },
  cekcek: {
    "Next.js": "renders the household energy dashboard",
    FastAPI: "provides energy usage, grid and forecast endpoints",
    ClickHouse: "stores and aggregates meter readings for the dashboard",
  },
  shiftwork: {
    Electron: "hosts the desktop focus-session app",
    Vite: "bundles the Electron renderer",
    TypeScript: "types the renderer and its focus-session components",
  },
  "hologram-ar": {
    Python: "runs the gesture-driven AR prototype",
    MediaPipe: "tracks hand landmarks for gesture controls",
  },
  "cv-experiments": {
    Python: "runs webcam tracking in both experiments",
    MediaPipe: "tracks face landmarks to estimate head tilt",
    YOLOv8: "extracts pose keypoints for the posture game",
  },
};

// The first lines a visitor reads: the strongest evidence, each counted from
// the projects (`all`: a project needs every tag; `any`: one is enough).
export const HEADLINES = [
  { text: "C++ firmware on ESP32 boards", all: ["C++", "ESP32"] },
  {
    text: "Security labs: timing leaks and packet capture",
    any: ["hmac", "Scapy"],
  },
  { text: "Python back ends behind FastAPI", any: ["FastAPI"] },
  {
    text: "Computer vision and image models",
    any: ["MediaPipe", "YOLOv8", "CLIP / RINE"],
  },
];

export function groupSkillUses(uses) {
  const documented = [];
  const bare = [];
  for (const use of uses) {
    if (use.text && !use.draft) documented.push(use);
    else bare.push(use);
  }
  return { documented, bare };
}

export function getSkillStack() {
  const { skills, projects } = getSkillGraph();
  const byLabel = new Map(skills.map((skill) => [skill.label, skill]));
  const byId = new Map(projects.map((project) => [project.id, project]));
  const evidence = (id, entry) => ({
    project: byId.get(id),
    ...(typeof entry === "string" ? { text: entry } : entry),
  });
  const countProjects = (uses) =>
    new Set(uses.map(({ project }) => project.id)).size;
  const row = (label, uses) => ({
    id: skillId(label),
    label,
    uses,
    count: countProjects(uses),
  });
  const categories = SKILL_CATEGORIES.map((category) => {
    const rows =
      category.id === "concepts"
        ? Object.entries(CONCEPTS).map(([label, entries]) =>
            row(
              label,
              Object.entries(entries).map(([id, entry]) => evidence(id, entry)),
            ),
          )
        : category.tags.map((label) =>
            row(
              label,
              byLabel
                .get(label)
                .projects.map((id) => evidence(id, USES[id]?.[label])),
            ),
          );
    rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    return {
      ...category,
      rows,
      projectCount: countProjects(rows.flatMap(({ uses }) => uses)),
    };
  });
  const headlines = HEADLINES.map((h) => {
    const backed = projects.filter((p) =>
      h.all
        ? h.all.every((t) => p.tags.includes(t))
        : h.any.some((t) => p.tags.includes(t)),
    );
    return {
      text: h.text,
      count: backed.length,
      projects: backed.map((p) => p.name),
    };
  });
  return { categories, headlines };
}
