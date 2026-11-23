export const WIP = "WIP";
export const isWip = (value) => value === WIP;

const projectsBySlug = {
  "music-leds": {
    slug: "music-leds",
    categories: ["signals-hardware"],
    hook: "A custom FFT on an ESP32 turns sound into colour, and a browser walkthrough lets you inspect each step of the transform.",
    role: WIP,
    proof: "Live browser demo",
    live: { label: "Try it", url: "https://musicled-webpage.vercel.app" },
    media: {
      kind: "photo",
      want: "Photo of the board running: ESP32, microphone and the RGB LED lit.",
      src: WIP,
      alt: WIP,
    },
    name: "music_LEDs",
    meta: "Fourier mathematics · linear algebra · hardware",
    tags: ["C++", "JavaScript", "ESP32", "DFT / FFT", "Web Serial"],
    description:
      "A Fourier and linear algebra teaching project that connects sampled sound, complex basis vectors, and frequency coefficients. A custom ESP32 FFT drives an RGB visualiser, while a browser walkthrough makes the mathematics inspectable.",
    insights: {
      layout: "algorithm",
      summary:
        "The central idea is a change of coordinates: one vector describes sound samples in time; another describes their frequency components. A readable direct DFT exposes the Fourier-matrix calculation, and a radix-2 FFT computes the same transform efficiently for the hardware visualiser.",
      overview: {
        more: [
          "The browser's Demo and Presenter views connect tone generation, Web Serial telemetry, and the linear algebra walkthrough. A captured frame keeps samples, Fourier coefficients, and RGB output together so the direct DFT and seven FFT stages can be traced against the same input. A labelled seeded frame supports explanation when the board is unavailable.",
        ],
      },
      howItWorks: {
        steps: [
          {
            title: "Build the input vector",
            body: "The microphone supplies 128 samples at a nominal 6.4 kHz. Subtracting the mean removes the DC offset; a Hamming window reduces leakage before the transform. The prepared samples become the entries of x.",
            code: "x = [x[0], x[1], …, x[N−1]]ᵀ",
            table: {
              caption: "One frame at the nominal sample rate",
              head: ["", "Value"],
              rows: [
                ["Samples per frame", "128"],
                ["Sample rate", "6.4 kHz (nominal)"],
                ["Bin spacing", "50 Hz"],
                ["Nyquist limit", "3.2 kHz"],
              ],
            },
          },
          {
            title: "Project onto a Fourier basis",
            body: "For each bin k, the direct DFT multiplies the samples by complex sinusoidal weights and adds them. This is an inner product with a basis vector; stacking the weighted rows gives the Fourier matrix F and the equation X = Fx.",
            more: [
              "The firmware implements both a direct DFT and an iterative radix-2 FFT. Known-signal tests and coefficient comparisons check agreement; an RGB light alone cannot establish that the mathematics is correct.",
              "Both describe the same linear transformation. The direct method exposes the matrix; the FFT reuses smaller calculations, reducing O(N²) work to O(N log N).",
            ],
            code: "X[k] = Σ x[n] exp(−2πikn/N)",
          },
          {
            title: "Reconstruct and visualise",
            body: "The inverse transform combines the complex coefficients with their basis vectors to reconstruct the prepared signal. The live visualiser instead uses magnitudes from selected frequency bands to control red, green, and blue intensity; colour shows band strength rather than the complete signal.",
            more: [
              "An ESP32 reads an analog microphone and drives a common-cathode RGB LED. The physical path is speaker → air → microphone → ESP32; the browser does not inject test samples into the firmware.",
            ],
            code: "x = F*X / N   (F* is the conjugate transpose)",
            table: {
              caption: "Which frequency band drives each LED channel",
              head: ["Channel", "Band"],
              rows: [
                ["Red", "50–250 Hz"],
                ["Green", "300–1000 Hz"],
                ["Blue", "1050–2500 Hz"],
              ],
            },
          },
        ],
      },
      diagram: {
        label: "Sound, Fourier mathematics, and visible output",
        nodes: [
          { label: "Microphone", detail: "128 time-domain samples" },
          { label: "Prepare x", detail: "Centre + Hamming window" },
          { label: "DFT / FFT", detail: "Complex coefficients X" },
          {
            label: "RGB + browser",
            detail: "Band strengths + coefficient walkthrough",
          },
        ],
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/music_LED" }],
  },
  cya: {
    slug: "cya",
    categories: ["applied-ai"],
    hook: "An AI-image detector that still tells real from generated after JPEG recompression, blur and resizing: 99.62% mean accuracy on transformed validation images.",
    role: "Data pipeline, detector baselines, evaluation tooling, inference backend and CLI, submission integration.",
    proof: "Held-out test: 140 of 141 images correct (single run)",
    media: {
      kind: "screenshot",
      want: "Screenshot of the upload demo or the results table.",
      src: WIP,
      alt: WIP,
    },
    name: "cya",
    meta: "TechJam 26 · participant",
    tags: ["Python", "PyTorch", "CLIP / RINE", "FastAPI", "React"],
    description:
      "A team project distinguishing fully authentic from fully AI-generated images, with robustness to compression, blur, and resizing. I built the data pipeline, detector baselines, evaluation tooling, inference backend and CLI, and submission integration.",
    insights: {
      layout: "algorithm",
      summary:
        "cya asks whether an image detector still works after everyday transformations. The retained controlled-RINE model uses intermediate features from a frozen CLIP backbone and a trained linear head; candidate additions were rejected when they failed the robustness gate.",
      overview: {
        more: [
          "The task covers fully authentic versus fully AI-generated images, not localisation of partial edits. The CLI and FastAPI service share model inference, while React provides the demonstration interface.",
          "I built the repository infrastructure, reproducible configuration, Colab workflows, image-data pipeline, CLIP/RINE baselines, evaluation and robustness tooling, physical-feature experiments, inference backend and CLI, and final-test/submission integration. Rae developed augmentation and the texture candidate; Shan He built initial feature extractors and the React/Vite frontend.",
        ],
      },
      diagram: {
        label: "Shared inference behind the CLI and image-upload demo",
        nodes: [
          { label: "Image input", detail: "Directory CLI or React upload" },
          {
            label: "Shared inference",
            detail: "Python package + FastAPI adapter",
          },
          {
            label: "CLIP / RINE",
            detail: "Frozen features + trained linear head",
          },
          { label: "Prediction", detail: "Class + raw model score" },
        ],
      },
      howItWorks: {
        steps: [
          {
            title: "Train a compact decision layer",
            body: "Keep CLIP's ViT-L/14-336 backbone frozen and combine intermediate-layer representations from layers 6, 12, 18, and 24. Train a lightweight linear head under a balanced clean-or-one-transform sampler.",
          },
          {
            title: "Test common transformations",
            body: "A strong clean-image result is only one part of the evaluation; the model also has to retain its performance when the image changes. Evaluate clean images and transformed versions under JPEG recompression, blur, and resizing.",
            more: [
              "Model selection weights clean accuracy and mean transform accuracy equally; frequency, colour, PRNU, and texture additions were not retained when they failed the selection gate.",
            ],
          },
          {
            title: "Keep the final test separate",
            body: "The submission reports 140 correct predictions out of 141 held-out images: 69 of 69 AI-generated images and 71 of 72 authentic images. The single error was an authentic image classified as AI-generated.",
            more: [
              "The 99.81% mean selection score across three seeds combines 100.00% clean accuracy with 99.62% mean robustness accuracy. It is not the held-out result or an event ranking, and the held-out figure describes that evaluation set, not guaranteed accuracy on new generators or image distributions.",
              "Outputs are raw, uncalibrated sigmoid scores at T=1; they should not be interpreted as calibrated probabilities or proof of an image's origin.",
            ],
            table: {
              caption:
                "Repository-reported evaluation; selection and held-out sets are separate",
              head: ["Evaluation", "Accuracy", "Context"],
              rows: [
                ["Clean validation", "100.00%", "Mean across 3 seeds"],
                ["Transformed validation", "99.62%", "Mean robustness accuracy"],
                [
                  "Held-out final test",
                  "99.29%",
                  "140 / 141 images · single run",
                ],
              ],
            },
          },
        ],
      },
    },
    links: [
      { label: "github", url: "https://github.com/maxi-cmyk/cya-techjam26" },
    ],
  },
  itspeak: {
    slug: "itspeak",
    categories: ["applied-ai"],
    hook: "A private coach that turns a rehearsal recording into measured feedback on pace, pitch, filler words, posture and eye contact, then tracks progress against a baseline.",
    role: "Backend, persistence, media-analysis pipeline and production deployment.",
    proof: "2nd place · SMU .Hack Enrichment Application Programme 2026",
    live: { label: "Try it", url: "https://it-s-peak-ruddy.vercel.app" },
    media: {
      kind: "screenshot",
      want: "Screenshot of the feedback screen.",
      src: WIP,
      alt: WIP,
    },
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
      summary:
        "An asynchronous analysis system that turns an uploaded rehearsal into separate delivery and voice signals, normalized scores, and focused coaching cards.",
      overview: {
        more: [
          "FastAPI hands the rehearsal to a Celery worker, where visual delivery and vocal delivery are analyzed separately before their scores meet one coaching contract.",
        ],
      },
      pipeline: {
        title: "One upload, two analysis paths",
        source: {
          label: "Private rehearsal",
          detail: "Validated upload becomes an asynchronous analysis job.",
          more: [
            "FastAPI handles upload and job orchestration while Celery performs the expensive media work outside the request lifecycle. Railway hosts the deployed backend services, and Redis carries job state between the API and worker.",
          ],
        },
        lanes: [
          {
            label: "Visual delivery",
            steps: [
              "Decode video frames",
              "Derive MediaPipe signals",
              "Normalize delivery scores",
            ],
            detail:
              "Video analysis derives eye-contact, expression, posture, gesture, movement, and spatial-use signals.",
          },
          {
            label: "Voice delivery",
            steps: [
              "Extract the audio track",
              "Measure pace, pitch, pauses, and fillers",
              "Normalize voice scores",
            ],
            detail:
              "The audio path measures pacing, pitch variation, pauses, and filler words before producing normalized delivery scores.",
          },
        ],
        merge: {
          label: "Coaching contract",
          detail:
            "The coaching layer receives scored telemetry and the chosen speaking archetype. Validated LLM cards are the primary output; provider failures activate deterministic rule-based cards.",
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
    hook: "A reminiscence companion for people with dementia that favours familiar memories and adapts its interactions to reduce overload.",
    role: "Backend, database and feed logic.",
    proof: "Best Freshmen Award · iNTUition 2026",
    live: { label: "Try it", url: "https://echo-patient-pwa.vercel.app" },
    media: {
      kind: "screenshot",
      want: "Screenshot of the PWA feed.",
      src: WIP,
      alt: WIP,
    },
    name: "Echo",
    meta: "iNTUition 2026 · Best Freshmen Award",
    tags: ["Next.js", "Supabase", "PostgreSQL", "LLaVA", "ElevenLabs"],
    description:
      "Adaptive reminiscence PWA for people with cognitive impairment. I built the backend, database, and feed logic around familiar media, narration, recall, and accessible interaction.",
    insights: {
      layout: "lifecycle",
      summary:
        "A caregiver-reviewed media pipeline turns personal photos and videos into approved memories, then presents them through a low-friction feed with narration, recall prompts, cooldowns, and adaptive voice controls.",
      overview: {
        more: [
          "A caregiver approves generated context before delivery, and later interactions adapt how approved memories are presented.",
        ],
      },
      lifecycle: {
        title: "A memory is reviewed before it becomes familiar",
        steps: [
          {
            title: "Upload",
            body: "A caregiver adds a personal photo or video to private storage. Uploads enter Supabase Storage.",
          },
          {
            title: "Extract context",
            body: "A Next.js route asks a locally hosted LLaVA model to propose a summary, people, place, and date context for the upload.",
          },
          {
            title: "Caregiver review",
            body: "The memory remains in needs-review state until a caregiver approves its context. Nothing generated reaches the feed before that approval.",
            state: "gate",
          },
          {
            title: "Familiar delivery",
            body: "The approved feed presents the memory with optional narration, generated or in a familiar voice through ElevenLabs.",
            more: [
              "Approved memories are filtered by cooldown before display. A Like hides an item for 24 hours to reduce repetition.",
            ],
          },
          {
            title: "Recall",
            body: "Recall records a meaningful interaction, and that interaction can surface a later active-recall prompt.",
          },
          {
            title: "Adapt access",
            body: "Repeated missed taps can switch the interface into a larger voice-control mode. A time-based sundowning setting activates a warmer presentation.",
          },
        ],
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/echo" }],
  },
  asteroids: {
    slug: "asteroids",
    categories: ["signals-hardware"],
    hook: "One C++ game core, two machines: an ESP32 arcade shooter with an OLED, and a WebAssembly browser version playable with a PS4 controller or keyboard and mouse.",
    role: WIP,
    proof: WIP,
    media: {
      kind: "video",
      want: "Screen capture of the browser build and a clip of the OLED game.",
      src: WIP,
      alt: WIP,
    },
    name: "Asteroids",
    meta: "ESP32 + web",
    tags: ["C++", "ESP32", "WebAssembly", "Canvas", "Gamepad API"],
    description:
      "Two versions of an arcade shooter: an ESP32 hardware game and a WebAssembly browser game playable with a PS4 controller or keyboard and mouse.",
    insights: {
      layout: "frame-loop",
      summary:
        "Two playable versions share a C++ gameplay core: an ESP32 game with a joystick and OLED, and a pixel-art browser game with PS4 controller or keyboard and mouse controls. The browser version adds a larger world and aimed combat.",
      overview: {
        more: [
          "Both versions advance simulation in 20 ms steps. Platform adapters connect the gameplay to physical controls or browser input, rendering, audio, and storage; each platform also supplies its own randomness.",
        ],
        table: {
          caption: "One gameplay core on two machines",
          head: ["", "ESP32", "Browser"],
          rows: [
            ["Display", "128×64 OLED", "Canvas, 480×270 pixel art"],
            [
              "Controls",
              "Joystick and fire button",
              "PS4 controller, or keyboard and mouse",
            ],
            ["Sound", "Buzzer through LEDC", "Web Audio"],
            ["High scores", "Top five in Preferences", "Top five in localStorage"],
          ],
        },
      },
      frameLoop: {
        title: "Shared gameplay, two ways to play",
        budget: "20 ms",
        phases: [
          {
            label: "Sample",
            detail:
              "Read joystick/button input or keyboard, mouse, and gamepad controls.",
            more: [
              "This is a platform adapter. The browser adds remappable controls and saved settings.",
            ],
          },
          {
            label: "Update",
            core: true,
            detail:
              "Advance waves, collisions, and pickups across capped object pools.",
            more: [
              "This is the shared C++ core; in the browser it runs as WebAssembly. Escalating waves add entrance patterns and faster rocks; score chains, multishot, shields, and saved initials make each run more than a survival timer.",
              "Aiming, a charged laser, manual shields, and precision movement are browser-specific additions.",
            ],
          },
          {
            label: "Render",
            detail:
              "Draw the OLED framebuffer or export entity state for the Canvas sprite renderer.",
            more: [
              "A platform adapter again: the ESP32 draws its 128×64 OLED, while Canvas renders the browser's 480×270 pixel-art world.",
            ],
          },
          {
            label: "Sound",
            detail:
              "Play non-blocking sound patterns through LEDC or Web Audio.",
          },
        ],
        after: {
          label: "Separate score tables",
          detail:
            "The top five initials/scores persist in ESP32 Preferences or a browser-specific localStorage table.",
          more: [
            "Browser and ESP32 score tables stay separate. The browser also records run statistics and has a practice mode that cannot write ranked scores.",
          ],
        },
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/asteroids" }],
  },
  sentinel: {
    slug: "sentinel",
    categories: ["signals-hardware", "systems-security"],
    hook: "Two ESP32 nodes split sensing from image capture: motion raises a Blynk event, while an ESP32-CAM serves a live stream and flash-assisted JPEG endpoint.",
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
        "The sensor node owns PIR, alarm, and panic state; Blynk virtual pins bridge that state to a camera node that temporarily pauses its stream for a higher-resolution capture.",
      overview: {
        more: [
          "A standard ESP32 reads the PIR sensor and controls the buzzer and status LED. The ESP32-CAM remains independently responsible for camera initialization, HTTP streaming, and capture state; Blynk virtual pin V6 carries the handoff between them.",
        ],
      },
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
            title: "Motion is detected",
            body: "The armed sensor node reads PIR state and raises the intrusion alarm. The current firmware polls the PIR input in its main loop.",
          },
          {
            actor: "bridge",
            actorLabel: "Blynk V6",
            title: "Blynk V6 carries the trigger",
            body: "Motion writes a short pulse to Blynk virtual pin V6 and logs an intrusion event. The camera's V6 handler runs the next three steps.",
          },
          {
            actor: "camera",
            actorLabel: "ESP32-CAM",
            title: "The live stream pauses",
            body: "The camera handler temporarily stops QVGA streaming and switches to VGA.",
          },
          {
            actor: "camera",
            actorLabel: "ESP32-CAM",
            title: "Flash-assisted JPEG is captured",
            body: "The node enables the flash, captures the frame, and publishes its URL.",
          },
          {
            actor: "camera",
            actorLabel: "ESP32-CAM",
            title: "The stream is restored",
            body: "Flash is disabled and the camera returns to its QVGA live-stream state.",
          },
        ],
      },
    },
    links: [{ label: "github", url: "https://github.com/maxi-cmyk/sentinel" }],
  },
  "conway-game-of-life": {
    slug: "conway-game-of-life",
    categories: ["signals-hardware"],
    hook: "A 32×8 toroidal Game of Life runs on an ESP32 and an LED matrix, streaming entropy and birth/death telemetry to a React dashboard.",
    role: WIP,
    proof: WIP,
    media: {
      kind: "video",
      want: "Short clip of the 32×8 matrix running, beside the dashboard.",
      src: WIP,
      alt: WIP,
    },
    name: "Conway's Game of Life",
    meta: "maths + hardware",
    tags: ["ESP32", "C++", "MAX7219", "SSE", "React"],
    description:
      "An ESP32 runs a 32×8 toroidal simulation on a MAX7219 matrix while a React dashboard receives live metrics, analyzes sessions, and exports results.",
    insights: {
      layout: "algorithm",
      summary:
        "Each of the eight rows is packed into one 32-bit integer, so neighbor reads, births, deaths, population counts, and state hashes stay compact while the board drives both physical and browser views.",
      overview: {
        more: [
          "The simulation packs each row into a 32-bit strip and advances the whole board through a read, decide, commit sequence.",
        ],
      },
      howItWorks: {
        steps: [
          {
            title: "Wrap the coordinates",
            body: "For each cell, row and column offsets loop across the opposite edge. A cell on the far left can therefore count neighbors from the far right, forming a 32×8 torus.",
            code: "wrapped = (index + size) % size",
          },
          {
            title: "Read and count bits",
            body: "A shift moves the requested cell into the least-significant position and a mask extracts its state. Repeating that read across the eight surrounding coordinates produces the neighbor count.",
            more: [
              "Eight uint32_t rows represent all 256 cells, and popcount computes population, births, and deaths efficiently.",
            ],
            code: "cell = (rows[y] >> x) & 1",
          },
          {
            title: "Commit the next generation",
            body: "Live cells survive with two or three neighbors; dead cells are born with exactly three. A separate eight-row buffer keeps every decision tied to the same source generation.",
            more: [
              "One generation reads a stable 32-byte board, writes the next 32-byte board, then swaps them before display and analysis.",
            ],
            code: "B3 / S23  →  nextRows[8]",
          },
          {
            title: "Show and analyse the run",
            body: "The MD_MAX72XX driver updates four chained FC-16 modules as one 32×8 display. The local HTTP service publishes changed snapshots over one Server-Sent Events stream to the React dashboard.",
            more: [
              "The firmware ends runs on extinction, repeated-state stagnation, or a generation cap and persists up to 30 summaries. The dashboard charts density, entropy, autocorrelation, peak population, and exports CSV or JSON.",
            ],
          },
        ],
      },
      diagram: {
        label: "Simulation, display, and analysis flow",
        nodes: [
          { label: "ESP32 engine", detail: "8 × uint32_t toroidal grid" },
          { label: "MAX7219", detail: "32×8 physical display" },
          { label: "SSE /events", detail: "changed snapshots only" },
          { label: "React dashboard", detail: "controls, charts, sessions" },
          { label: "CSV / JSON", detail: "portable analysis data" },
        ],
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
    hook: "A localhost-only lab on how early-exit comparisons leak timing, how an attacker can recover a secret from it, and how constant-time comparison closes the leak.",
    role: WIP,
    proof: WIP,
    media: {
      kind: "screenshot",
      want: "Terminal capture of the timing staircase, once the experiments have run.",
      src: WIP,
      alt: WIP,
    },
    name: "timing-attack-lab",
    meta: "Learning lab · localhost only",
    tags: ["Python", "Flask", "C", "hmac"],
    description:
      "A sequential, localhost-only lab: a Flask login endpoint with a deliberately vulnerable early-exit comparison, an attacker that times candidate bytes, and a constant-time fix. Measured results are WIP.",
    insights: {
      layout: "algorithm",
      summary:
        "Status: learning lab in progress. Comparing secrets byte by byte and returning on the first mismatch leaks how many leading bytes were right through response time. The lab builds the vulnerable comparison, an attacker that measures it, and the constant-time fix. Measured results and the Python-versus-C comparison are WIP.",
      overview: {
        more: [
          "The lab runs on localhost against a synthetic secret, and the starter attacker accepts localhost targets only. It must not be used against accounts, credentials, or systems you do not own.",
        ],
      },
      howItWorks: {
        steps: [
          {
            title: "Leak the prefix length",
            body: "The vulnerable comparison returns on the first mismatched byte and sleeps after every matching one, so each extra correct byte adds a small delay to the response.",
            code: "if a != b: return False  /  sleep(delay)",
          },
          {
            title: "Rank 256 guesses per byte",
            body: "For each position the attacker times all 256 byte values over repeated samples, keeps the slowest average, fixes that byte, and moves to the next position.",
            code: "score[b] = mean(timings(prefix + b))",
          },
          {
            title: "Remove the signal",
            body: "A constant-time comparison built on hmac.compare_digest checks every byte regardless of mismatches, so response time no longer reveals how many leading bytes were correct.",
            more: [
              "Passwords should still be stored with a password-hashing algorithm such as Argon2 or bcrypt.",
              "The repository has a Flask login endpoint with vulnerable and fixed modes, an attacker module for measuring and scoring candidates, a check runner, and a C server for a Python-versus-C comparison.",
              "Results: WIP. Raw timing samples, per-position latency distributions, and the vulnerable-versus-constant-time comparison have not been collected yet.",
            ],
            code: "hmac.compare_digest(candidate, expected)",
          },
        ],
      },
      diagram: {
        label: "Request, comparison, measurement, and guess",
        nodes: [
          { label: "Login request", detail: "Candidate bytes over localhost" },
          { label: "Comparison", detail: "Early exit or constant time" },
          { label: "Timing samples", detail: "Mean, median, trimmed mean" },
          { label: "Ranked guess", detail: "One byte at a time" },
        ],
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
