export const WIP = "WIP";
export const isWip = (value) => value === WIP;

const projectsBySlug = {
  "music-leds": {
    slug: "music-leds",
    categories: ["signals-hardware"],
    hook: "An ESP32 runs a custom FFT on live sound and lights an RGB LED by frequency band.",
    motivation:
      "I wanted a way to teach the Fourier transform using something people could hear and see. An RGB LED reacting to live sound gave me a way to connect the frequency coefficients on screen to something happening on the desk.",
    role: WIP,
    proof: "Live browser demo",
    live: { label: "Try it", url: "https://musicled-webpage.vercel.app" },
    media: [
      {
        kind: "video",
        want: "Clip of the board reacting to music, with the browser's live spectrum.",
        title: "On the desk",
        src: "/assets/media/music-leds.mp4",
        poster: "/assets/media/music-leds-poster.webp",
        width: 540,
        height: 960,
        alt: "Music plays from a laptop in a dark room while the board's RGB LED lights the wall red and green, then the browser's live view shows the measured spectrum in red, green and blue bands.",
        caption:
          "The board listening to music, then its live spectrum in the browser.",
      },
    ],
    name: "music_LEDs",
    meta: "Fourier mathematics · linear algebra · hardware",
    tags: ["C++", "JavaScript", "ESP32", "DFT / FFT", "Web Serial"],
    description:
      "A Fourier and linear algebra teaching project that connects sampled sound, complex basis vectors, and frequency coefficients. A custom ESP32 FFT drives an RGB visualiser, while a browser walkthrough makes the mathematics inspectable.",
    insights: {
      layout: "signal-chain",
      teaser:
        "Follow the signal from microphone to LED and see how the Fourier transform turns sound samples into frequency coefficients.",
      summary:
        "An ESP32 listens through a microphone, runs its own FFT, and turns three frequency bands into red, green and blue light.",
      signalChain: {
        title: "From sound to colour",
        stages: [
          { label: "Microphone", detail: "128 samples at a nominal 6.4 kHz" },
          {
            label: "Clean up",
            detail: "Remove the average, then apply a Hamming window",
          },
          { label: "FFT", detail: "Bins 50 Hz apart, up to 3.2 kHz" },
        ],
        output: {
          label: "RGB LED",
          detail: "Each band's strength sets one colour's brightness.",
        },
        // The firmware's band edges (figures/winding-math.js BANDS; a test
        // keeps them equal).
        outputs: [
          { led: "r", label: "Red", detail: "50–250 Hz" },
          { led: "g", label: "Green", detail: "300–1000 Hz" },
          { led: "b", label: "Blue", detail: "1050–2500 Hz" },
        ],
        after: {
          title: "The maths",
          paragraphs: [
            "The FFT is a change of coordinates: X = Fx, where F is the Fourier matrix, turns 128 samples in time into frequency coefficients. A direct DFT shows that matrix; the radix-2 FFT gets the same answer in O(N log N), and tests check that the two agree.",
            "A browser walkthrough captures a frame from the board over Web Serial and traces the direct DFT and all seven FFT stages against it.",
          ],
        },
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/music_LED" }],
  },
  cya: {
    slug: "cya",
    categories: ["applied-ai"],
    hook: "A detector for real photos and AI-generated images, tested on JPEG compression, blur, and resizing.",
    motivation:
      "I wanted to know what clues would still distinguish a real photo from an AI-generated one after the image had been blurred, resized, or compressed. That question shaped how we tested cya.",
    role: "Data pipeline, detector baselines, evaluation tooling, inference backend and CLI, submission integration.",
    proof: "Held-out test: 140 of 141 images correct (single run)",
    media: [
      {
        kind: "screenshot",
        want: "Screenshot of the upload demo or the results table.",
        src: WIP,
        alt: WIP,
      },
    ],
    name: "cya",
    meta: "TechJam 26 · participant",
    tags: ["Python", "PyTorch", "CLIP / RINE", "FastAPI", "React"],
    description:
      "A team project distinguishing fully authentic from fully AI-generated images. We evaluated the detector on clean, compressed, blurred, and resized images. I built the data pipeline, detector baselines, evaluation tooling, inference backend and CLI, and submission integration.",
    insights: {
      layout: "signal-chain",
      teaser:
        "See how cya scores an image and how JPEG compression, blur, and resizing affect the detector.",
      summary:
        "We tested a detector for real and AI-generated images on JPEG-compressed, blurred, and resized inputs.",
      signalChain: {
        title: "How an image is scored",
        stages: [
          {
            label: "Image",
            detail: "A whole image: fully real or fully AI-generated",
          },
          {
            label: "Frozen CLIP",
            detail: "ViT-L/14-336, reading layers 6, 12, 18 and 24",
          },
          {
            label: "Linear head",
            detail: "The only trained part, fed clean and transformed images",
          },
        ],
        output: {
          label: "Raw score",
          detail: "An uncalibrated sigmoid score at T=1, not a probability.",
        },
        results: {
          caption:
            "Repository-reported evaluation; selection and held-out sets are separate",
          head: ["Dataset", "Accuracy", "Note"],
          rows: [
            ["Clean validation", "100.00%", "Mean across 3 seeds"],
            ["Transformed validation", "99.62%", "Mean robustness accuracy"],
            ["Held-out final test", "99.29%", "140 / 141 images · single run"],
          ],
        },
        after: {
          title: "Notes",
          paragraphs: [
            "Model selection weighs clean and transformed accuracy equally; frequency, colour, PRNU and texture additions were dropped when they failed that gate. The one held-out error was an authentic image called AI-generated, and the figure describes that test set, not guaranteed accuracy on new generators.",
            "I built the infrastructure, data pipeline, baselines, evaluation and robustness tooling, inference backend, CLI and submission. Rae developed augmentation and the texture candidate; Shan He built the first feature extractors and the React frontend.",
          ],
        },
      },
    },
    links: [
      { label: "github", url: "https://github.com/maxi-cmyk/cya-techjam26" },
    ],
  },
  itspeak: {
    slug: "itspeak",
    categories: ["applied-ai"],
    hook: "A rehearsal coach that scores pace, pitch, filler words, posture and eye contact.",
    motivation:
      "I wanted people to be able to practice speaking and build confidence without paying for a coach every time they needed feedback. We built it’sPEAK so people could rehearse on their own and know what to work on before the next take.",
    role: "Backend, persistence, media-analysis pipeline and production deployment.",
    proof: "2nd of 15 teams · SMU .Hack Enrichment Application Programme 2026",
    media: [
      {
        kind: "screenshot",
        want: "Screenshot of the feedback screen.",
        src: WIP,
        alt: WIP,
      },
    ],
    name: "it'sPEAK",
    meta: "SMU HEAP26 · 2nd place",
    tags: [
      "Python",
      "FastAPI",
      "Celery",
      "Redis",
      "Railway",
      "MediaPipe",
      "OpenAI",
    ],
    description:
      "Private web coach for rehearsing presentations. I owned the backend, persistence, media-analysis pipeline, and production deployment work.",
    insights: {
      layout: "pipeline",
      teaser:
        "Trace how one rehearsal recording is split into voice and visual analysis, then turned into coaching cards.",
      summary:
        "A rehearsal coach: upload a recorded talk and get scores for your delivery and your voice, then a few coaching cards.",
      pipeline: {
        title: "One upload, two analysis paths",
        source: {
          label: "Upload",
          detail: "FastAPI validates the rehearsal and queues a Celery job.",
        },
        lanes: [
          {
            label: "Visual delivery",
            detail:
              "MediaPipe signals for eye-contact, expression, posture, gesture, movement, and spatial use.",
          },
          {
            label: "Voice delivery",
            detail:
              "Measures pacing, pitch variation, pauses, and filler words.",
          },
        ],
        merge: {
          label: "Coaching cards",
          detail:
            "An LLM writes the cards from the scores and the chosen speaking style; if the provider fails, deterministic rule-based cards take over.",
        },
        after: {
          title: "Notes",
          paragraphs: [
            "Redis carries job state between the API and the worker, and Railway hosts both. I built the backend, persistence, analysis pipeline and deployment.",
          ],
        },
      },
    },
    links: [
      { label: "github", url: "https://github.com/maxi-cmyk/it-sPeak" },
      {
        label: "devpost",
        url: "https://devpost.com/software/itspeak?ref_content=my-projects-tab&ref_feature=my_projects",
      },
    ],
  },
  echo: {
    slug: "echo",
    categories: ["applied-ai"],
    hook: "A memory companion for people with dementia that adapts to avoid overload.",
    motivation:
      "I wanted to explore how familiar photos and voices could help someone with dementia revisit a memory without the feed becoming overwhelming. That led us to build caregiver review and adapt what the feed shows over time.",
    role: "Backend, database and feed logic.",
    proof: "Best Freshmen Award · iNTUition 2026",
    media: [
      {
        kind: "screenshot",
        want: "Screenshot of the PWA feed.",
        src: WIP,
        alt: WIP,
      },
    ],
    name: "Echo",
    meta: "iNTUition 2026 · Best Freshmen Award",
    tags: ["Next.js", "Supabase", "PostgreSQL", "LLaVA", "ElevenLabs"],
    description:
      "Adaptive reminiscence PWA for people with cognitive impairment. I built the backend, database, and feed logic around familiar media, narration, recall, and accessible interaction.",
    insights: {
      layout: "flowchart",
      teaser:
        "Follow a memory from photo or video upload through caregiver approval to the feed.",
      summary:
        "Echo helps people with dementia revisit familiar photos and videos. I built the backend, database, and logic that controls what appears in the memory feed.",
      flowchart: {
        title: "How a memory reaches the feed",
        intake: [
          {
            label: "Upload a photo or video",
            detail: "A caregiver adds it to private Supabase storage.",
          },
          {
            label: "Draft the memory context",
            detail: "Local LLaVA proposes a summary, people, place, and date.",
          },
        ],
        decision: "Does the caregiver approve the draft?",
        pending: {
          label: "Pending review",
          detail: "The memory stays out of the feed.",
        },
        approved: {
          label: "Approved",
          detail:
            "The memory can appear in the feed, with optional ElevenLabs narration in a generated or familiar voice.",
        },
        after: {
          title: "After a memory is shown",
          paragraphs: [
            "A Like hides an item for 24 hours to reduce repetition. A Recall interaction can inform which active-recall prompts appear later.",
            "Repeated missed taps can switch the feed to larger voice controls. A time-based sundowning setting switches to warmer colours.",
          ],
        },
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/echo" }],
  },
  asteroids: {
    slug: "asteroids",
    categories: ["signals-hardware"],
    hook: "One C++ game engine on two machines: an ESP32 handheld and a WebAssembly browser game.",
    motivation:
      "I built the browser version to try my hand at game development. The handheld was mostly for fun. I wanted to see the same game running on a tiny OLED with a real joystick.",
    role: WIP,
    proof: WIP,
    // A clip of the ESP32 handheld is still to come.
    media: [
      {
        kind: "video",
        want: "Gameplay of the browser build; a clip of the OLED handheld to follow.",
        title: "Demo flight",
        src: "/assets/media/asteroids-web.mp4",
        poster: "/assets/media/asteroids-web-poster.webp",
        width: 960,
        height: 540,
        alt: "The browser game's demo flight: a pixel-art ship clears rocks with shots and a charged laser, then fights a spiked mini-boss.",
        caption:
          "The browser build's demo flight: the game's own autopilot playing a real run.",
      },
    ],
    name: "Asteroids",
    meta: "ESP32 + web",
    tags: ["C++", "ESP32", "WebAssembly", "Canvas", "Gamepad API"],
    description:
      "A side-scrolling Asteroids game: one C++ engine running on an ESP32 handheld and, compiled to WebAssembly, in the browser.",
    insights: {
      layout: "platforms",
      teaser:
        "Compare how the handheld and browser builds handle controls, rendering, and 20 ms simulation ticks.",
      summary:
        "A shared C++ gameplay engine powers the ESP32 handheld and the WebAssembly browser game.",
      platforms: {
        title: "One engine, two builds",
        engine: {
          label: "Shared C++ engine",
          detail:
            "Fixed 20 ms ticks update movement, collisions, waves, and scoring.",
        },
        builds: [
          {
            label: "ESP32 handheld",
            input: "Joystick and fire button",
            output: "128×64 OLED and buzzer",
            timing:
              "The handheld waits out the rest of each 20 ms frame before updating the game.",
          },
          {
            label: "Browser · WebAssembly",
            input: "PS4 controller or keyboard and mouse",
            output: "480×270 Canvas and Web Audio",
            timing:
              "The browser uses animation frames to schedule fixed 20 ms ticks, then redraws when the scene changes.",
          },
        ],
        note: "Each build saves its top five scores with initials to its own local leaderboard.",
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/asteroids" }],
  },
  sentinel: {
    slug: "sentinel",
    categories: ["signals-hardware", "systems-security"],
    hook: "Two ESP32 nodes: one senses motion and raises an alert, an ESP32-CAM streams and takes photos.",
    role: WIP,
    proof: WIP,
    name: "Sentinel",
    meta: "hardware",
    tags: ["ESP32", "ESP32-CAM", "C++", "Blynk", "MJPEG"],
    description:
      "Two ESP32 nodes split sensing from image capture: motion raises a Blynk event, while an ESP32-CAM serves a live stream and flash-assisted JPEG endpoint.",
    insights: {
      layout: "event-sequence",
      summary:
        "Two ESP32 boards: one senses motion and raises the alarm; an ESP32-CAM pauses its live stream to take a flash photo.",
      eventSequence: {
        title: "Detection and capture stay on separate devices",
        devices: [
          {
            id: "sensor",
            label: "PIR node",
            detail: "sensing, arming, panic, siren",
          },
          {
            id: "camera",
            label: "ESP32-CAM",
            detail: "MJPEG stream, flash, JPEG capture",
          },
        ],
        steps: [
          {
            actor: "sensor",
            actorLabel: "PIR node",
            title: "Motion",
            body: "The armed node reads the PIR and sounds the alarm.",
          },
          {
            actor: "bridge",
            actorLabel: "Blynk V6",
            title: "V6 pulse",
            body: "A short pulse on virtual pin V6 logs an intrusion.",
          },
          {
            actor: "camera",
            actorLabel: "ESP32-CAM",
            title: "Capture",
            body: "Stops the QVGA stream, switches to VGA, flashes, takes a JPEG and publishes its URL.",
          },
          {
            actor: "camera",
            actorLabel: "ESP32-CAM",
            title: "Resume",
            body: "Flash off, back to the QVGA live stream.",
          },
        ],
        after: {
          title: "Notes",
          paragraphs: [
            "The sensor node owns PIR, alarm and panic state; the camera owns its own stream and capture state. Blynk virtual pin V6 carries the handoff between them.",
          ],
        },
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/sentinel" }],
  },
  "conway-game-of-life": {
    slug: "conway-game-of-life",
    categories: ["signals-hardware"],
    hook: "Game of Life on a 32×8 LED matrix, run by an ESP32 and streamed to a React dashboard.",
    motivation:
      "I was curious how rules as simple as Conway’s could make a Turing-complete system on an unbounded grid. I wanted to see what it would take to run those same rules on an ESP32 with a 32×8 LED matrix.",
    role: WIP,
    proof: WIP,
    media: [
      {
        kind: "video",
        title: "Game of Life on the LED matrix",
        want: "Short clip of the 32×8 LED matrix running Conway’s Game of Life.",
        src: "/assets/media/conway-game-of-life.mp4",
        poster: "/assets/media/conway-game-of-life-poster.webp",
        width: 720,
        height: 856,
        alt: "Red cells light up and go dark across a 32×8 LED matrix wired to an ESP32 on a breadboard.",
        caption:
          "I turn the potentiometer to speed up or slow down the generations on the LED matrix. The same knob sets how densely the grid is seeded at the start of a new run.",
      },
    ],
    name: "Conway's Game of Life",
    meta: "maths + hardware",
    tags: ["ESP32", "C++", "MAX7219", "SSE", "React"],
    description:
      "An ESP32 runs a 32×8 toroidal simulation on a MAX7219 matrix while a React dashboard receives live metrics, analyzes sessions, and exports results.",
    insights: {
      layout: "signal-chain",
      teaser:
        "Follow one generation from the ESP32’s neighbour counts to the LED matrix and browser dashboard.",
      summary:
        "Game of Life on a 32×8 LED matrix, run by an ESP32 and streamed live to a React dashboard.",
      signalChain: {
        title: "One generation",
        stages: [
          {
            label: "Wrap",
            detail: "Each edge counts the opposite edge as its neighbour",
          },
          {
            label: "Read",
            detail: "cell = (rows[y] >> x) & 1, for all 8 neighbours",
          },
          {
            label: "Decide",
            detail:
              "Born with exactly three neighbours; survives with two or three (B3/S23)",
          },
          {
            label: "Commit",
            detail: "Write a second 8-row buffer, then swap",
          },
        ],
        output: {
          label: "Show the board",
          detail: "Each generation goes to the LEDs and to the browser.",
        },
        outputs: [
          {
            label: "LED matrix",
            detail: "Four chained FC-16 modules as one 32×8 display",
          },
          {
            label: "React dashboard",
            detail:
              "Server-Sent Events; charts density, entropy and autocorrelation; exports CSV or JSON",
          },
        ],
        after: {
          title: "Notes",
          paragraphs: [
            "Each row is one 32-bit integer, so the whole board is 32 bytes and popcount gives the population. A run ends on extinction, a repeated state or a generation cap, and the last 30 summaries are kept.",
          ],
        },
      },
    },
    links: [
      {
        label: "github",
        url: "https://github.com/maxi-cmyk/conway_game_of_life",
      },
    ],
  },
  "timing-attack-lab": {
    slug: "timing-attack-lab",
    categories: ["systems-security"],
    hook: "A localhost lab: how an early-exit comparison leaks a secret, and how constant-time comparison stops it.",
    motivation:
      "My interest in security at the hardware–software boundary got me curious about what a program can reveal through timing. The lab taught me that a check can return the right answer and still leak information if it stops at the first mismatch. That’s why I use hmac.compare_digest() to compare fixed-length secrets.",
    role: WIP,
    proof: WIP,
    media: [
      {
        kind: "screenshot",
        want: "Terminal capture of the timing staircase, once the experiments have run.",
        src: WIP,
        alt: WIP,
      },
    ],
    name: "timing-attack-lab",
    meta: "Learning lab · localhost only",
    tags: ["Python", "Flask", "C", "hmac"],
    description:
      "A sequential, localhost-only lab: a Flask login endpoint with a deliberately vulnerable early-exit comparison, an attacker that times candidate bytes, and a constant-time fix. Measured results are WIP.",
    insights: {
      layout: "compare",
      teaser:
        "Compare how early-exit and constant-time checks behave when verifying a synthetic secret on localhost.",
      summary:
        "A localhost lab: an early-exit comparison leaks a secret through response time, and a constant-time comparison stops it.",
      compare: {
        title: "Same guess, two comparisons",
        root: {
          label: "The login compares a guess with the secret",
          detail: "One byte at a time, against a synthetic 4-byte secret.",
        },
        branches: [
          {
            label: "Early exit",
            rows: [
              ["Check", "Returns at the first wrong byte"],
              ["Leak", "Each right leading byte adds time"],
            ],
            note: "The attacker times all 256 values for a position, keeps the slowest, fixes that byte and moves on.",
          },
          {
            label: "Constant time",
            rows: [
              ["Check", "hmac.compare_digest checks every byte"],
              ["Leak", "None: every guess takes the same time"],
            ],
            note: "With no slowest guess, there is nothing to rank.",
          },
        ],
        after: {
          title: "Notes",
          paragraphs: [
            "Localhost only: the attacker refuses other targets. The vulnerable mode adds 1 ms per matching byte by default, and a C server is ready for a Python-versus-C comparison.",
            "Results: WIP. The timing samples and the vulnerable-versus-constant-time comparison have not been collected yet.",
          ],
        },
      },
    },
    links: [
      {
        label: "github",
        url: "https://github.com/maxi-cmyk/timing-attack-lab",
      },
    ],
  },
};

function selectProjects(...slugs) {
  return slugs.map((slug) => projectsBySlug[slug]);
}

// Groups describe what was built. Hackathon results are badges on the project,
// not a group. Retired category ids stay valid in URLs and terminal commands.
export const focusCategories = {
  "signals-hardware": {
    id: "signals-hardware",
    label: "Signals & hardware",
    title: "signals & hardware/",
    path: "focus/signals-hardware",
    description:
      "Sound, sensors, and ESP32 builds where mathematics meets physical hardware.",
    get projects() {
      return getFilteredProjects([this.id]);
    },
  },
  "systems-security": {
    id: "systems-security",
    label: "Systems & security",
    title: "systems & security/",
    path: "focus/systems-security",
    description:
      "How systems leak, fail, and get defended, measured at the byte and packet level.",
    get projects() {
      return getFilteredProjects([this.id]);
    },
  },
  "applied-ai": {
    id: "applied-ai",
    label: "Applied AI & products",
    title: "applied ai & products/",
    path: "focus/applied-ai",
    description:
      "Models and signal analysis turned into tools that people can use.",
    get projects() {
      return getFilteredProjects([this.id]);
    },
  },
};

// null means the old category no longer filters anything (it shows all work).
export const legacyCategoryAliases = {
  engineering: "signals-hardware",
  cybersecurity: "systems-security",
  "ai-math": "applied-ai",
  hackathons: null,
};

// Returns a current category id, null for "all work", or undefined if unknown.
export function resolveCategory(id) {
  if (Object.hasOwn(focusCategories, id)) return id;
  if (Object.hasOwn(legacyCategoryAliases, id)) {
    return legacyCategoryAliases[id];
  }
  return undefined;
}

// Cards in Selected work, in display order.
export const allProjects = selectProjects(
  "music-leds",
  "timing-attack-lab",
  "conway-game-of-life",
  "asteroids",
  "itspeak",
  "echo",
  "cya",
);

// Everything that has a case study, including Sentinel, which is not a card.
export const caseStudyProjects = [...allProjects, projectsBySlug.sentinel];

// Smaller projects with no page of their own. They appear only as evidence in
// the Skills graph, linking out to their repositories.
export const otherProjects = [
  {
    id: "sentinel",
    name: projectsBySlug.sentinel.name,
    categories: projectsBySlug.sentinel.categories,
    tags: projectsBySlug.sentinel.tags,
    links: projectsBySlug.sentinel.links,
  },
  {
    id: "network-sniffer",
    name: "network_sniffer",
    categories: ["systems-security"],
    tags: ["Scapy", "FastAPI", "WebSockets", "Next.js"],
    links: [
      { label: "github", url: "https://github.com/maxi-cmyk/network_sniffer" },
    ],
  },
  {
    id: "lockingang",
    name: "lockingang",
    categories: ["applied-ai"],
    tags: ["Electron", "React", "FastAPI", "SQLite"],
    links: [
      { label: "github", url: "https://github.com/maxi-cmyk/lockingang" },
      { label: "demo video", url: "https://youtube.com/shorts/wftzCy07OX4" },
    ],
  },
  {
    id: "epicenter",
    name: "epicenter",
    categories: ["applied-ai"],
    tags: ["Next.js", "FastAPI", "Supabase", "Clerk", "OpenAI"],
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/epicenter" }],
  },
  {
    id: "cekcek",
    name: "cekcek",
    categories: ["applied-ai"],
    tags: ["Next.js", "FastAPI", "ClickHouse"],
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/cekcek" }],
  },
  {
    id: "shiftwork",
    name: "Shiftwork",
    categories: ["applied-ai"],
    tags: ["Electron", "Vite", "TypeScript"],
    links: [
      { label: "github", url: "https://github.com/maxi-cmyk/shifting_work" },
    ],
  },
  {
    id: "hologram-ar",
    name: "hologram_AR",
    categories: ["applied-ai"],
    tags: ["Python", "MediaPipe"],
    links: [
      { label: "github", url: "https://github.com/maxi-cmyk/hologram_AR" },
    ],
  },
  {
    id: "cv-experiments",
    name: "Small vision experiments",
    categories: ["applied-ai"],
    tags: ["Python", "MediaPipe", "YOLOv8"],
    links: [
      {
        label: "anti_brainrot",
        url: "https://github.com/maxi-cmyk/anti_brainrot",
      },
      {
        label: "goblin_detector",
        url: "https://github.com/maxi-cmyk/goblin_detector",
      },
    ],
  },
];

export function getCaseStudyLinkLabel() {
  return "view case study";
}

export function normalizeCategories(categories = []) {
  return Object.keys(focusCategories).filter((id) => categories.includes(id));
}

export function getFilteredProjects(categories = []) {
  const selected = normalizeCategories(categories);
  return allProjects.filter(
    (project) =>
      !selected.length ||
      project.categories.some((id) => selected.includes(id)),
  );
}

export function categoryLabel(id) {
  return focusCategories[id]?.label ?? id;
}
