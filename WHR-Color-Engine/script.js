"use strict";

/* ==========================================================
   WHITE HAT RABBIT STUDIOS
   WHR COLOR ENGINE v2.0

   LABORATORY ENGINE

   SISTEMI:

PLAY pokretanje
Proceduralna COLOR FLOW muzika
3 RGB roditelja
Direktan prenos energije dodirom
Roditelji prolaze jedni kroz druge
RGB prikaz tokom preklapanja
4 VOID reaktora
Gravitaciono usisavanje
VOID memorija dve različite boje
Izbacivanje trajnih kombinovanih zečeva
Yellow / Magenta / Cyan
White TILT impuls
Smile Engine
Uslov pobede: 5 istih kombinacija
Mobile-first 9:16
Retina Canvas
Fixed timestep fizika
   ========================================================== */
/* ==========================================================
   CENTRALNA KONFIGURACIJA
   ========================================================== */

const CONFIG = Object.freeze({

/* Engine */

simulationSpeed: 0.72,

maxDelta: 1 / 30,
physicsStep: 1 / 120,
maxSubSteps: 8,

devicePixelRatioLimit: 2,

/* Arena */

wallPadding: 8,
wallBounce: 0.88,

gravity: 260,

airFriction: 0.9992,
floorFriction: 0.992,

/* Parent rabbits */

parentRadiusMobile: 39,
parentRadiusDesktop: 43,

parentMaxSpeed: 620,

parentInitialMinSpeed: 80,
parentInitialMaxSpeed: 145,

pointerImpulse: 430,
pointerHitPadding: 22,

/* Combined rabbits */

combinedRadiusFactor: 0.86,
combinedMaxSpeed: 560,

combinedSpawnSpeedMin: 210,
combinedSpawnSpeedMax: 330,

combinedCollisionBounce: 0.96,

/* Jači odskok dece od arene */

combinedWallBounce: 1.02,
combinedWallKick: 1.08,
combinedMinimumWallSpeed: 125,

/* CHILD REPRODUCTION */

childReproductionCooldown: 2.15,
childReproductionInitialCooldown: 1.05,
childReproductionMinImpactSpeed: 105,

childReproductionSpawnSpeedMin: 215,
childReproductionSpawnSpeedMax: 315,

childMaximumPopulation: 36,

/* PARENT ↔ PARENT COLLISION */

parentCollisionBounce: 0.92,

/* Overlap */

overlapDisplayMinimum: 0.08,
overlapGlowMaximum: 1,

/* VOID */

voidRadiusMobile: 37,
voidRadiusDesktop: 43,

voidInsetMobile: 43,
voidInsetDesktop: 51,

voidGravityRadiusFactor: 4.2,
voidCaptureRadiusFactor: 0.62,

voidPullForce: 1680,
voidSpiralForce: 570,

voidMaximumPullAcceleration: 1450,

voidMemoryHoldTime: 0.82,
voidProcessingTime: 1.15,

voidParentCooldown: 1.45,

voidReleaseDistanceFactor: 1.5,
voidParentReleaseSpeed: 235,

voidSpawnCooldown: 0.48,

/* TILT */

tiltRadiusMobile: 38,
tiltRadiusDesktop: 44,

tiltImpulseRadiusFactor: 4.6,
tiltImpulseForce: 510,

tiltCooldown: 0.28,

/* Particles */

maximumParticles: 240,

/* Win */

victoryTarget: 5,
victoryDelay: 0.85,

gameOverDelay: 0.75,

/* Smile Engine */

smileIdleMinimum: 2.8,
smileIdleMaximum: 6.2,

smileDurationMinimum: 0.65,
smileDurationMaximum: 1.45,

/* Music */

musicMasterVolume: 0.12,
musicTempo: 100,

/* Debug */

debug: false
});

/* ==========================================================
   DOM
   ========================================================== */

const canvas =
    document.getElementById("gameCanvas");

const playButton =
    document.getElementById("playButton");

const restartButton =
    document.getElementById("restartButton");

const soundButton =
    document.getElementById("soundButton");

const soundLabel =
    document.getElementById("soundLabel");

const startScreen =
    document.getElementById("startScreen");

const victoryScreen =
    document.getElementById("victoryScreen");

const victoryColorOrb =
    document.getElementById("victoryColorOrb");

const victoryMessage =
    document.getElementById("victoryMessage");

const victoryTitle =
    document.getElementById("victoryTitle");

const victoryKicker =
    victoryScreen
        ? victoryScreen.querySelector(".victory-kicker")
        : null;

const statusMessage =
    document.getElementById("statusMessage");

const statusText =
    document.getElementById("statusText");

const yellowCount =
    document.getElementById("yellowCount");

const magentaCount =
    document.getElementById("magentaCount");

const cyanCount =
    document.getElementById("cyanCount");

if (!canvas) {

throw new Error(
    'Canvas sa ID-em "gameCanvas" nije pronađen.'
);
}

const ctx =
    canvas.getContext(
        "2d",
        {
            alpha: false,
            desynchronized: true
        }
    );

if (!ctx) {

throw new Error(
    "Canvas 2D Context nije dostupan."
);
}

/* ==========================================================
   BOJE
   ========================================================== */

const PRIMARY_COLORS = Object.freeze({

RED: Object.freeze({

    id: "RED",

    label: "Red",

    hex: "#ff304f",

    rgb: [255, 0, 0]
}),

GREEN: Object.freeze({

    id: "GREEN",

    label: "Green",

    hex: "#24e96f",

    rgb: [0, 255, 0]
}),

BLUE: Object.freeze({

    id: "BLUE",

    label: "Blue",

    hex: "#1976ff",

    rgb: [0, 0, 255]
})
});

const COLOR_RECIPES = Object.freeze({

"GREEN+RED": Object.freeze({

    id: "YELLOW",

    label: "Yellow",

    parents: ["RED", "GREEN"],

    hex: "#ffe52e",

    darkHex: "#a87e00",

    rgb: [255, 255, 0]
}),

"BLUE+RED": Object.freeze({

    id: "MAGENTA",

    label: "Magenta",

    parents: ["RED", "BLUE"],

    hex: "#ff2bd6",

    darkHex: "#790058",

    rgb: [255, 0, 255]
}),

"BLUE+GREEN": Object.freeze({

    id: "CYAN",

    label: "Cyan",

    parents: ["GREEN", "BLUE"],

    hex: "#00f2ff",

    darkHex: "#006c78",

    rgb: [0, 255, 255]
})
});

const COMBINATION_DEFINITIONS = Object.freeze({

YELLOW:
    COLOR_RECIPES["GREEN+RED"],

MAGENTA:
    COLOR_RECIPES["BLUE+RED"],

CYAN:
    COLOR_RECIPES["BLUE+GREEN"]
});

/* ==========================================================
   ENGINE STATE
   ========================================================== */

const ENGINE = {

width: 0,
height: 0,
dpr: 1,

initialized: false,

mode: "STANDBY",

lastTimestamp: 0,

accumulator: 0,

realTime: 0,
simulationTime: 0,

parents: [],

combinedRabbits: [],

voids: [],

particles: [],

overlapEffects: [],

tilt: null,

nextRabbitId: 1,

counts: {

    YELLOW: 0,
    MAGENTA: 0,
    CYAN: 0
},

winningColorId: null,

victoryTimer: 0,

gameOverTimer: 0,
gameOverReason: null,

tiltCooldown: 0,

backgroundStars: []
};

const POINTER = {

x: 0,
y: 0,

active: false,

pointerId: null
};

/* ==========================================================
   OPŠTE FUNKCIJE
   ========================================================== */

function clamp(
    value,
    minimum,
    maximum
) {

return Math.max(
    minimum,
    Math.min(
        maximum,
        value
    )
);
}

function lerp(
    start,
    end,
    amount
) {

return (
    start +
    (end - start) *
    amount
);
}

function inverseLerp(
    start,
    end,
    value
) {

if (start === end) {

    return 0;
}

return clamp(
    (value - start) /
    (end - start),
    0,
    1
);
}

function randomRange(
    minimum,
    maximum
) {

return (
    minimum +
    Math.random() *
    (maximum - minimum)
);
}

function randomInteger(
    minimum,
    maximum
) {

return Math.floor(
    randomRange(
        minimum,
        maximum + 1
    )
);
}

function chooseRandom(array) {

return array[
    Math.floor(
        Math.random() *
        array.length
    )
];
}

function distanceSquared(
    x1,
    y1,
    x2,
    y2
) {

const dx =
    x2 - x1;

const dy =
    y2 - y1;

return (
    dx * dx +
    dy * dy
);
}

function normalizeVector(
    x,
    y
) {

const length =
    Math.hypot(
        x,
        y
    );

if (length < 0.000001) {

    return {

        x: 1,
        y: 0,
        length: 0
    };
}

return {

    x:
        x / length,

    y:
        y / length,

    length
};
}

function limitVelocity(
    body,
    maximumSpeed
) {

const speedSquared =
    body.vx * body.vx +
    body.vy * body.vy;

const maximumSquared =
    maximumSpeed *
    maximumSpeed;

if (
    speedSquared <=
    maximumSquared
) {

    return;
}

const speed =
    Math.sqrt(
        speedSquared
    );

const scale =
    maximumSpeed /
    speed;

body.vx *= scale;
body.vy *= scale;
}

function normalizeHex(hex) {

let value =
    String(hex)
        .replace("#", "")
        .trim();

if (
    value.length === 3
) {

    value =
        value
            .split("")
            .map(
                character =>
                    character +
                    character
            )
            .join("");
}

return value
    .padStart(6, "0")
    .slice(0, 6);
}

function hexToRgb(hex) {

const value =
    Number.parseInt(
        normalizeHex(hex),
        16
    );

if (
    !Number.isFinite(value)
) {

    return {

        red: 255,
        green: 255,
        blue: 255
    };
}

return {

    red:
        (value >> 16) &
        255,

    green:
        (value >> 8) &
        255,

    blue:
        value &
        255
};
}

function hexToRgba(
    hex,
    alpha
) {

const color =
    hexToRgb(hex);

return (
    `rgba(` +
    `${color.red},` +
    `${color.green},` +
    `${color.blue},` +
    `${alpha}` +
    `)`
);
}

function adjustColor(
    hex,
    percent
) {

const rgb =
    hexToRgb(hex);

const amount =
    Math.round(
        2.55 *
        percent
    );

const red =
    clamp(
        rgb.red +
        amount,
        0,
        255
    );

const green =
    clamp(
        rgb.green +
        amount,
        0,
        255
    );

const blue =
    clamp(
        rgb.blue +
        amount,
        0,
        255
    );

return (
    "#" +
    Math.round(red)
        .toString(16)
        .padStart(2, "0") +
    Math.round(green)
        .toString(16)
        .padStart(2, "0") +
    Math.round(blue)
        .toString(16)
        .padStart(2, "0")
);
}

function roundedRectPath(
    context,
    x,
    y,
    width,
    height,
    radius
) {

const safeRadius =
    Math.min(
        Math.max(
            0,
            radius
        ),
        Math.abs(width) * 0.5,
        Math.abs(height) * 0.5
    );

context.beginPath();

context.moveTo(
    x + safeRadius,
    y
);

context.lineTo(
    x + width - safeRadius,
    y
);

context.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + safeRadius
);

context.lineTo(
    x + width,
    y + height - safeRadius
);

context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
);

context.lineTo(
    x + safeRadius,
    y + height
);

context.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - safeRadius
);

context.lineTo(
    x,
    y + safeRadius
);

context.quadraticCurveTo(
    x,
    y,
    x + safeRadius,
    y
);

context.closePath();
}

function createRecipeKey(
    firstColorId,
    secondColorId
) {

return [
    firstColorId,
    secondColorId
]
    .sort()
    .join("+");
}

function getRecipe(
    firstColorId,
    secondColorId
) {

return (
    COLOR_RECIPES[
        createRecipeKey(
            firstColorId,
            secondColorId
        )
    ] ||
    null
);
}

function getParentRadius() {

return (
    ENGINE.width < 700
        ? CONFIG.parentRadiusMobile
        : CONFIG.parentRadiusDesktop
);
}

function getVoidRadius() {

return (
    ENGINE.width < 700
        ? CONFIG.voidRadiusMobile
        : CONFIG.voidRadiusDesktop
);
}

function getVoidInset() {

return (
    ENGINE.width < 700
        ? CONFIG.voidInsetMobile
        : CONFIG.voidInsetDesktop
);
}

function getTiltRadius() {

return (
    ENGINE.width < 700
        ? CONFIG.tiltRadiusMobile
        : CONFIG.tiltRadiusDesktop
);
}

/* ==========================================================
   RECIPE VALIDATION
   ========================================================== */

function validateRecipes() {

const primaryIds =
    new Set(
        Object.keys(
            PRIMARY_COLORS
        )
    );

const resultIds =
    new Set();

for (
    const [
        recipeKey,
        recipe
    ] of
    Object.entries(
        COLOR_RECIPES
    )
) {

    if (
        !recipe ||
        typeof recipe !== "object"
    ) {

        throw new Error(
            `Neispravan recept: ${recipeKey}`
        );
    }

    if (
        !Array.isArray(
            recipe.parents
        ) ||
        recipe.parents.length !== 2
    ) {

        throw new Error(
            `Recept ${recipeKey} mora imati dva roditelja.`
        );
    }

    const expectedKey =
        createRecipeKey(
            recipe.parents[0],
            recipe.parents[1]
        );

    if (
        expectedKey !==
        recipeKey
    ) {

        throw new Error(
            `Neispravan ključ recepta ${recipeKey}. ` +
            `Očekivano: ${expectedKey}`
        );
    }

    for (
        const parentId
        of recipe.parents
    ) {

        if (
            !primaryIds.has(
                parentId
            )
        ) {

            throw new Error(
                `Nepoznat RGB roditelj: ${parentId}`
            );
        }
    }

    if (
        resultIds.has(
            recipe.id
        )
    ) {

        throw new Error(
            `Duplikat kombinacije: ${recipe.id}`
        );
    }

    resultIds.add(
        recipe.id
    );
}

if (
    Object.keys(
        COLOR_RECIPES
    ).length !== 3
) {

    throw new Error(
        "RGB motor mora imati tačno tri recepta prve generacije."
    );
}
}

/* ==========================================================
   STATUS UI
   ========================================================== */

let statusTimeoutId = 0;

function setStatus(
    message,
    state = "normal",
    duration = 0
) {

statusText.textContent =
    message;

statusMessage.classList.remove(
    "is-warning",
    "is-success"
);

if (
    state === "warning"
) {

    statusMessage.classList.add(
        "is-warning"
    );
}

if (
    state === "success"
) {

    statusMessage.classList.add(
        "is-success"
    );
}

window.clearTimeout(
    statusTimeoutId
);

if (
    duration > 0
) {

    statusTimeoutId =
        window.setTimeout(
            () => {

                if (
                    ENGINE.mode ===
                    "RUNNING"
                ) {

                    setStatus(
                        "COLOR ENGINE ACTIVE"
                    );
                }

            },
            duration
        );
}
}

function updateCounter(
    colorId,
    animate = true
) {

const elementMap = {

    YELLOW:
        yellowCount,

    MAGENTA:
        magentaCount,

    CYAN:
        cyanCount
};

const valueElement =
    elementMap[colorId];

if (!valueElement) {

    return;
}

const count =
    ENGINE.counts[colorId] ||
    0;

valueElement.textContent =
    `${count} / ${CONFIG.victoryTarget}`;

if (!animate) {

    return;
}

const counter =
    valueElement.closest(
        ".combination-counter"
    );

if (!counter) {

    return;
}

counter.classList.remove(
    "is-updated"
);

void counter.offsetWidth;

counter.classList.add(
    "is-updated"
);

window.setTimeout(
    () => {

        counter.classList.remove(
            "is-updated"
        );

    },
    420
);
}

function updateAllCounters(
    animate = false
) {

updateCounter(
    "YELLOW",
    animate
);

updateCounter(
    "MAGENTA",
    animate
);

updateCounter(
    "CYAN",
    animate
);
}

/* =========================================================
   WHR MUSIC ENGINE - "NEON STATIC" (by Claude & WHR Crew)
   Originalna WHR univerzum tema, 100% proceduralna,
   komponovana i generisana cistim Web Audio API-jem.
   ========================================================= */

const NOTE_INDEX = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

function noteFreq(note) {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 0;
  const [, name, octaveStr] = match;
  const octave = Number(octaveStr);
  const semitoneFromA4 = NOTE_INDEX[name] + (octave - 4) * 12 - 9;
  return 440 * Math.pow(2, semitoneFromA4 / 12);
}

class MusicEngine {
  constructor(audioFX) {
    this.audioFX = audioFX || null;
    this.ctx = (audioFX && audioFX.ctx) || null;
    // SOUND dugme je jedini autoritet za SFX i muziku.
    this.enabled = audioFX
      ? audioFX.enabled
      : localStorage.getItem(MusicEngine.KEY) !== "false";
    this.playing = false;

    this.tempo = 132;
    this.stepSeconds = 60 / this.tempo / 4; // 16th note
    this.stepsPerBar = 16;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.lookaheadMs = 25;
    this.scheduleAheadSec = 0.12;
    this.timerId = null;
    this.introTimerId = null;
    this.introSources = new Set();

    this.intensity = 1;
    this.master = null;

    this.bass = [
      "A2", null, null, null, "E2", null, null, null,
      "F2", null, null, null, "G2", null, null, null,
      "A2", null, null, null, "E2", null, null, null,
      "D2", null, null, null, "G2", null, null, null,
      "A2", null, "A2", null, "E2", null, "A2", null,
      "F2", null, "F2", null, "G2", null, "E2", null,
      "A2", null, "A2", null, "E2", null, "A2", null,
      "D2", null, "F2", null, "G2", null, "G2", null,
      "D2", null, "D2", null, "A2", null, "D2", null,
      "F2", null, "G2", null, "A2", null, "A2", null,
      "D2", null, "D2", null, "A2", null, "D2", null,
      "C2", null, "E2", null, "F2", null, "G2", null,
      "A2", null, "A2", "A2", "E2", null, "E2", "E2",
      "F2", null, "F2", "F2", "G2", "G2", "A2", "A2",
      "G2", null, "F2", null, "E2", null, "D2", null,
      "C2", null, "D2", null, "E2", null, "A2", null,
    ];

    this.arp = [
      null, "C5", null, "E4", null, "C5", null, "A4",
      null, "A4", null, "F4", null, "A4", null, "C5",
      null, "E5", null, "C5", null, "A4", null, "C5",
      null, "F4", null, "A4", null, "D5", null, "B4",
      "A4", "C5", "E4", "C5", "A4", "C5", "E4", "G4",
      "F4", "A4", "C5", "A4", "G4", "B4", "D5", "E4",
      "A4", "E5", "C5", "E5", "A4", "C5", "E4", "A4",
      "D4", "F4", "A4", "F4", "G4", "D5", "B4", "G4",
      "D4", "F4", "A4", "F4", "D4", "F4", "A4", "C5",
      "F4", "A4", "C5", "A4", "A4", "C5", "E5", "D5",
      "D4", "A4", "F4", "A4", "D4", "F4", "A4", "D5",
      "C4", "E4", "G4", "E4", "F4", "A4", "C5", "D5",
      "A4", "C5", "E5", "C5", "A4", "E4", "C5", "A4",
      "F4", "A4", "D5", "C5", "G4", "B4", "D5", "E5",
      "C4", "E4", "G4", "C5", "E5", "G5", "A5", "G5",
      "E5", "C5", "A4", "G4", "E4", "C4", "E4", "A4",
    ];

    this.lead = [
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      "E5", null, null, "C5", null, "A4", null, null,
      "D5", null, "C5", null, "A4", null, "G4", null,
      "E5", null, null, "G5", null, "E5", null, null,
      "D5", null, "B4", null, "D5", null, "A4", null,
      "A5", null, null, "F5", null, "D5", null, null,
      "G5", null, "F5", null, "D5", null, "C5", null,
      "A5", null, null, "C6", null, "A5", null, null,
      "G5", null, "E5", null, "G5", null, "D5", null,
      "C6", "B5", "A5", "G5", "F5", "E5", "D5", "C5",
      "B4", "A4", null, null, "E5", null, "A4", null,
      "G4", null, "A4", null, "C5", null, "D5", null,
      "E5", null, null, null, null, null, null, null,
    ];

    this.hi = [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 1, 1, 0, 1, 1,
      1, 1, 1, 0, 1, 1, 1, 0,
      1, 1, 1, 0, 1, 1, 1, 0,
      1, 1, 1, 0, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
    ];
  }


ensureContext() {

    if (
        this.context
    ) {

        return;
    }

    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (
        !AudioContextClass
    ) {

        this.isEnabled = false;

        setStatus(
            "WEB AUDIO NIJE DOSTUPAN",
            "warning",
            2400
        );

        return;
    }

    this.context =
        new AudioContextClass();

    this.masterGain =
        this.context.createGain();

    this.filter =
        this.context.createBiquadFilter();

    this.filter.type =
        "lowpass";

    this.filter.frequency.value =
        1800;

    this.filter.Q.value =
        0.5;

    this.masterGain.gain.value =
        0;

    this.filter.connect(
        this.masterGain
    );

    this.masterGain.connect(
        this.context.destination
    );
}


midiToFrequency(midi) {

    return (
        440 *
        Math.pow(
            2,
            (midi - 69) /
            12
        )
    );
}


scheduleTone(options) {

    if (
        !this.context ||
        !this.masterGain ||
        !this.isEnabled
    ) {

        return;
    }

    const oscillator =
        this.context.createOscillator();

    const gain =
        this.context.createGain();

    const pan =
        this.context.createStereoPanner
            ? this.context.createStereoPanner()
            : null;

    oscillator.type =
        options.type ||
        "sine";

    oscillator.frequency.setValueAtTime(
        options.frequency,
        options.time
    );

    if (
        Number.isFinite(
            options.detune
        )
    ) {

        oscillator.detune.setValueAtTime(
            options.detune,
            options.time
        );
    }

    const attack =
        options.attack ??
        0.025;

    const release =
        options.release ??
        0.6;

    const volume =
        options.volume ??
        0.04;

    gain.gain.setValueAtTime(
        0.0001,
        options.time
    );

    gain.gain.exponentialRampToValueAtTime(
        Math.max(
            0.0001,
            volume
        ),
        options.time +
        attack
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        options.time +
        release
    );

    oscillator.connect(
        gain
    );

    if (pan) {

        pan.pan.setValueAtTime(
            clamp(
                options.pan || 0,
                -1,
                1
            ),
            options.time
        );

        gain.connect(
            pan
        );

        pan.connect(
            this.filter
        );

    } else {

        gain.connect(
            this.filter
        );
    }

    oscillator.start(
        options.time
    );

    oscillator.stop(
        options.time +
        release +
        0.08
    );
}


scheduleBass(
    time,
    step
) {

    const midi =
        this.bassPattern[
            step %
            this.bassPattern.length
        ];

    this.scheduleTone({

        frequency:
            this.midiToFrequency(
                midi
            ),

        time,

        type:
            "triangle",

        volume:
            0.045,

        attack:
            0.03,

        release:
            0.78,

        pan:
            -0.12
    });
}


scheduleArp(
    time,
    step
) {

    const scaleIndex =
        this.arpPattern[
            step %
            this.arpPattern.length
        ];

    const octaveShift =
        step % 4 === 3
            ? 12
            : 0;

    const midi =
        this.scale[
            scaleIndex %
            this.scale.length
        ] +
        12 +
        octaveShift;

    this.scheduleTone({

        frequency:
            this.midiToFrequency(
                midi
            ),

        time,

        type:
            "sine",

        volume:
            0.021,

        attack:
            0.018,

        release:
            0.34,

        pan:
            Math.sin(
                step * 0.7
            ) * 0.55
    });
}


scheduleAtmosphere(
    time,
    step
) {

    if (
        step % 8 !== 0
    ) {

        return;
    }

    const roots = [

        45,
        48,
        52,
        43
    ];

    const root =
        roots[
            Math.floor(
                step / 8
            ) %
            roots.length
        ];

    const chord = [

        root,
        root + 7,
        root + 12
    ];

    chord.forEach(
        (
            midi,
            index
        ) => {

            this.scheduleTone({

                frequency:
                    this.midiToFrequency(
                        midi
                    ),

                time:
                    time +
                    index * 0.015,

                type:
                    index === 0
                        ? "triangle"
                        : "sine",

                volume:
                    0.015,

                attack:
                    0.25,

                release:
                    2.6,

                pan:
                    -0.35 +
                    index * 0.35,

                detune:
                    index === 1
                        ? -4
                        : index === 2
                            ? 4
                            : 0
            });
        }
    );
}


scheduler() {

    if (
        !this.context ||
        !this.isPlaying
    ) {

        return;
    }

    const secondsPerBeat =
        60 /
        this.tempo;

    const stepDuration =
        secondsPerBeat /
        2;

    while (
        this.nextNoteTime <
        this.context.currentTime +
        this.lookAhead
    ) {

        this.scheduleBass(
            this.nextNoteTime,
            this.step
        );

        this.scheduleArp(
            this.nextNoteTime,
            this.step
        );

        this.scheduleAtmosphere(
            this.nextNoteTime,
            this.step
        );

        this.nextNoteTime +=
            stepDuration;

        this.step += 1;
    }
}


async start() {

    if (
        !this.isEnabled
    ) {

        return;
    }

    this.ensureContext();

    if (
        !this.context ||
        !this.masterGain
    ) {

        return;
    }

    if (
        this.context.state ===
        "suspended"
    ) {

        await this.context.resume();
    }

    if (
        this.isPlaying
    ) {

        return;
    }

    this.isPlaying = true;

    this.step = 0;

    this.nextNoteTime =
        this.context.currentTime +
        0.08;

    this.masterGain.gain.cancelScheduledValues(
        this.context.currentTime
    );

    this.masterGain.gain.setValueAtTime(
        this.masterGain.gain.value,
        this.context.currentTime
    );

    this.masterGain.gain.linearRampToValueAtTime(
        CONFIG.musicMasterVolume,
        this.context.currentTime +
        0.8
    );

    this.timerId =
        window.setInterval(
            () => {

                this.scheduler();

            },
            this.schedulerInterval
        );
}


stop() {

    if (
        !this.context ||
        !this.masterGain
    ) {

        return;
    }

    this.isPlaying = false;

    if (
        this.timerId !== null
    ) {

        window.clearInterval(
            this.timerId
        );

        this.timerId = null;
    }

    const now =
        this.context.currentTime;

    this.masterGain.gain.cancelScheduledValues(
        now
    );

    this.masterGain.gain.setValueAtTime(
        this.masterGain.gain.value,
        now
    );

    this.masterGain.gain.linearRampToValueAtTime(
        0.0001,
        now + 0.35
    );
}


async setEnabled(enabled) {

    this.isEnabled =
        Boolean(enabled);

    if (
        this.isEnabled
    ) {

        if (
            ENGINE.mode ===
            "RUNNING"
        ) {

            await this.start();
        }

    } else {

        this.stop();
    }
}


playReactionTone(colorId) {

    if (
        !this.context ||
        !this.isEnabled
    ) {

        return;
    }

    const midiMap = {

        YELLOW: 69,
        MAGENTA: 72,
        CYAN: 76
    };

    const midi =
        midiMap[colorId] ||
        72;

    const time =
        this.context.currentTime +
        0.015;

    this.scheduleTone({

        frequency:
            this.midiToFrequency(
                midi
            ),

        time,

        type:
            "sine",

        volume:
            0.058,

        attack:
            0.01,

        release:
            0.55,

        pan:
            0
    });

    this.scheduleTone({

        frequency:
            this.midiToFrequency(
                midi + 7
            ),

        time:
            time + 0.035,

        type:
            "triangle",

        volume:
            0.026,

        attack:
            0.015,

        release:
            0.62,

        pan:
            0.15
    });
}


playImpulseTone() {

    if (
        !this.context ||
        !this.isEnabled
    ) {

        return;
    }

    const time =
        this.context.currentTime;

    this.scheduleTone({

        frequency:
            180,

        time,

        type:
            "sine",

        volume:
            0.05,

        attack:
            0.008,

        release:
            0.32,

        pan:
            0
    });

    this.scheduleTone({

        frequency:
            360,

        time:
            time + 0.02,

        type:
            "triangle",

        volume:
            0.025,

        attack:
            0.008,

        release:
            0.24,

        pan:
            0
    });
}


playVictoryTone(colorId) {

    if (
        !this.context ||
        !this.isEnabled
    ) {

        return;
    }

    const rootMap = {

        YELLOW: 69,
        MAGENTA: 65,
        CYAN: 72
    };

    const root =
        rootMap[colorId] ||
        69;

    const chord = [

        root,
        root + 4,
        root + 7,
        root + 12
    ];

    const now =
        this.context.currentTime +
        0.04;

    chord.forEach(
        (
            midi,
            index
        ) => {

            this.scheduleTone({

                frequency:
                    this.midiToFrequency(
                        midi
                    ),

                time:
                    now +
                    index * 0.09,

                type:
                    index % 2 === 0
                        ? "sine"
                        : "triangle",

                volume:
                    0.05,

                attack:
                    0.025,

                release:
                    1.55,

                pan:
                    -0.45 +
                    index * 0.3
            });
        }
    );
}
}

const MUSIC =
    new ColorFlowMusic();

/* ==========================================================
   PARTICLE
   ========================================================== */

class Particle {

constructor(options) {

    this.x =
        options.x;

    this.y =
        options.y;

    this.vx =
        options.vx ||
        0;

    this.vy =
        options.vy ||
        0;

    this.radius =
        options.radius ||
        2;

    this.color =
        options.color ||
        "#ffffff";

    this.life =
        options.life ||
        1;

    this.maximumLife =
        this.life;

    this.drag =
        options.drag ??
        0.985;

    this.gravity =
        options.gravity ??
        0;

    this.glow =
        options.glow ??
        8;
}


update(delta) {

    this.life -=
        delta;

    this.vy +=
        this.gravity *
        delta;

    const damping =
        Math.pow(
            this.drag,
            delta * 60
        );

    this.vx *=
        damping;

    this.vy *=
        damping;

    this.x +=
        this.vx *
        delta;

    this.y +=
        this.vy *
        delta;
}


draw(context) {

    if (
        this.life <= 0
    ) {

        return;
    }

    const alpha =
        clamp(
            this.life /
            this.maximumLife,
            0,
            1
        );

    context.save();

    context.globalAlpha =
        alpha;

    context.fillStyle =
        this.color;

    context.shadowColor =
        this.color;

    context.shadowBlur =
        this.glow;

    context.beginPath();

    context.arc(
        this.x,
        this.y,
        this.radius *
        (
            0.5 +
            alpha * 0.5
        ),
        0,
        Math.PI * 2
    );

    context.fill();

    context.restore();
}
}

/* ==========================================================
   SMILE ENGINE
   ========================================================== */

class SmileController {

constructor() {

    this.smileAmount = 0;

    this.targetSmile = 0;

    this.timer =
        randomRange(
            CONFIG.smileIdleMinimum,
            CONFIG.smileIdleMaximum
        );

    this.smileDuration = 0;
}


trigger(
    strength = 1,
    duration = null
) {

    this.targetSmile =
        clamp(
            strength,
            0,
            1
        );

    this.smileDuration =
        duration ??
        randomRange(
            CONFIG.smileDurationMinimum,
            CONFIG.smileDurationMaximum
        );

    this.timer =
        this.smileDuration;
}


update(delta) {

    this.timer -=
        delta;

    if (
        this.smileDuration > 0
    ) {

        this.smileDuration -=
            delta;

        if (
            this.smileDuration <= 0
        ) {

            this.targetSmile = 0;

            this.timer =
                randomRange(
                    CONFIG.smileIdleMinimum,
                    CONFIG.smileIdleMaximum
                );
        }

    } else if (
        this.timer <= 0
    ) {

        this.trigger(
            randomRange(
                0.28,
                0.62
            )
        );
    }

    this.smileAmount =
        lerp(
            this.smileAmount,
            this.targetSmile,
            1 -
            Math.pow(
                0.001,
                delta
            )
        );
}
}

/* ==========================================================
   RABBIT BASE
   ========================================================== */

class RabbitBase {

constructor(options) {

    this.id =
        ENGINE.nextRabbitId++;

    this.x =
        options.x;

    this.y =
        options.y;

    this.previousX =
        this.x;

    this.previousY =
        this.y;

    this.vx =
        options.vx ||
        0;

    this.vy =
        options.vy ||
        0;

    this.radius =
        options.radius;

    this.baseColor =
        options.baseColor;

    this.rotation =
        randomRange(
            -Math.PI,
            Math.PI
        );

    this.angularVelocity =
        randomRange(
            -0.75,
            0.75
        );

    this.squashX = 1;
    this.squashY = 1;

    this.squashVelocityX = 0;
    this.squashVelocityY = 0;

    this.impactEnergy = 0;

    this.motionSeed =
        Math.random() *
        100;

    this.fogSeed =
        Math.random() *
        Math.PI *
        2;

    this.smile =
        new SmileController();

    this.removed = false;
}


registerImpact(
    normalX,
    normalY,
    speed
) {

    const strength =
        clamp(
            speed / 520,
            0,
            1
        );

    this.impactEnergy =
        Math.max(
            this.impactEnergy,
            strength
        );

    this.squashVelocityX +=
        Math.abs(normalY) *
        strength *
        0.18;

    this.squashVelocityY +=
        Math.abs(normalX) *
        strength *
        0.18;

    this.angularVelocity +=
        normalX *
        randomRange(
            -1.1,
            1.1
        ) *
        strength;
}


updateAnimation(delta) {

    const spring =
        80;

    const damping =
        Math.pow(
            0.7,
            delta * 60
        );

    this.squashVelocityX +=
        (
            1 -
            this.squashX
        ) *
        spring *
        delta;

    this.squashVelocityY +=
        (
            1 -
            this.squashY
        ) *
        spring *
        delta;

    this.squashVelocityX *=
        damping;

    this.squashVelocityY *=
        damping;

    this.squashX +=
        this.squashVelocityX;

    this.squashY +=
        this.squashVelocityY;

    this.squashX =
        clamp(
            this.squashX,
            0.74,
            1.3
        );

    this.squashY =
        clamp(
            this.squashY,
            0.74,
            1.3
        );

    this.impactEnergy =
        Math.max(
            0,
            this.impactEnergy -
            delta * 2.4
        );

    this.smile.update(
        delta
    );
}


integrate(
    delta,
    maximumSpeed
) {

    this.previousX =
        this.x;

    this.previousY =
        this.y;

    this.vy +=
        CONFIG.gravity *
        delta;

    this.vx *=
        Math.pow(
            CONFIG.airFriction,
            delta * 60
        );

    this.vy *=
        Math.pow(
            CONFIG.airFriction,
            delta * 60
        );

    limitVelocity(
        this,
        maximumSpeed
    );

    this.x +=
        this.vx *
        delta;

    this.y +=
        this.vy *
        delta;

    this.rotation +=
        this.angularVelocity *
        delta;

    this.angularVelocity *=
        Math.pow(
            0.986,
            delta * 60
        );

    this.resolveWorldBounds();
}


resolveWorldBounds() {

    const minimumX =
        this.radius +
        CONFIG.wallPadding;

    const maximumX =
        ENGINE.width -
        this.radius -
        CONFIG.wallPadding;

    const minimumY =
        this.radius +
        CONFIG.wallPadding;

    const maximumY =
        ENGINE.height -
        this.radius -
        CONFIG.wallPadding;

    if (
        this.x < minimumX
    ) {

        this.x =
            minimumX;

        if (
            this.vx < 0
        ) {

            const speed =
                Math.abs(
                    this.vx
                );

            this.vx =
                speed *
                CONFIG.wallBounce;

            this.registerImpact(
                1,
                0,
                speed
            );
        }
    }

    if (
        this.x > maximumX
    ) {

        this.x =
            maximumX;

        if (
            this.vx > 0
        ) {

            const speed =
                Math.abs(
                    this.vx
                );

            this.vx =
                -speed *
                CONFIG.wallBounce;

            this.registerImpact(
                -1,
                0,
                speed
            );
        }
    }

    if (
        this.y < minimumY
    ) {

        this.y =
            minimumY;

        if (
            this.vy < 0
        ) {

            const speed =
                Math.abs(
                    this.vy
                );

            this.vy =
                speed *
                CONFIG.wallBounce;

            this.registerImpact(
                0,
                1,
                speed
            );
        }
    }

    if (
        this.y > maximumY
    ) {

        this.y =
            maximumY;

        if (
            this.vy > 0
        ) {

            const speed =
                Math.abs(
                    this.vy
                );

            this.vy =
                -speed *
                CONFIG.wallBounce;

            this.vx *=
                CONFIG.floorFriction;

            this.registerImpact(
                0,
                -1,
                speed
            );
        }
    }
}


drawAura(
    context,
    time,
    intensity = 1
) {

    const pulse =
        Math.sin(
            time * 2.4 +
            this.motionSeed
        ) *
        2.5;

    const auraRadius =
        this.radius +
        13 +
        pulse +
        this.impactEnergy * 8;

    const aura =
        context.createRadialGradient(
            0,
            0,
            this.radius * 0.25,
            0,
            0,
            auraRadius
        );

    aura.addColorStop(
        0,
        hexToRgba(
            this.baseColor,
            0.2 *
            intensity
        )
    );

    aura.addColorStop(
        0.55,
        hexToRgba(
            this.baseColor,
            0.075 *
            intensity
        )
    );

    aura.addColorStop(
        1,
        hexToRgba(
            this.baseColor,
            0
        )
    );

    context.fillStyle =
        aura;

    context.beginPath();

    context.arc(
        0,
        0,
        auraRadius,
        0,
        Math.PI * 2
    );

    context.fill();
}


drawShadow(context) {

    context.fillStyle =
        "rgba(0,0,0,0.27)";

    context.beginPath();

    context.ellipse(
        3,
        this.radius * 0.84,
        this.radius * 0.85,
        this.radius * 0.25,
        0,
        0,
        Math.PI * 2
    );

    context.fill();
}


drawBody(context) {

    const light =
        adjustColor(
            this.baseColor,
            36
        );

    const middle =
        adjustColor(
            this.baseColor,
            5
        );

    const shadow =
        adjustColor(
            this.baseColor,
            -52
        );

    const gradient =
        context.createRadialGradient(
            -this.radius * 0.34,
            -this.radius * 0.38,
            this.radius * 0.04,
            0,
            this.radius * 0.08,
            this.radius * 1.07
        );

    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        0.2,
        light
    );

    gradient.addColorStop(
        0.62,
        middle
    );

    gradient.addColorStop(
        1,
        shadow
    );

    context.fillStyle =
        gradient;

    context.shadowColor =
        this.baseColor;

    context.shadowBlur =
        11 +
        this.impactEnergy * 12;

    context.beginPath();

    context.arc(
        0,
        0,
        this.radius,
        0,
        Math.PI * 2
    );

    context.fill();

    context.shadowBlur = 0;

    context.strokeStyle =
        hexToRgba(
            adjustColor(
                this.baseColor,
                30
            ),
            0.75
        );

    context.lineWidth = 2;

    context.beginPath();

    context.arc(
        0,
        0,
        this.radius,
        0,
        Math.PI * 2
    );

    context.stroke();
}


drawFog(
    context,
    time
) {

    context.save();

    context.beginPath();

    context.arc(
        0,
        0,
        this.radius * 0.77,
        0,
        Math.PI * 2
    );

    context.clip();

    context.globalCompositeOperation =
        "screen";

    for (
        let index = 0;
        index < 3;
        index += 1
    ) {

        const direction =
            index % 2 === 0
                ? 1
                : -1;

        const angle =
            time *
            (
                0.38 +
                index * 0.11
            ) *
            direction +
            this.fogSeed +
            index * 2.1;

        const x =
            Math.cos(angle) *
            this.radius *
            0.21;

        const y =
            Math.sin(
                angle * 1.2
            ) *
            this.radius *
            0.18;

        const size =
            this.radius *
            (
                0.24 +
                index * 0.03
            );

        const fog =
            context.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                size
            );

        fog.addColorStop(
            0,
            index === 1
                ? "rgba(255,255,255,0.2)"
                : hexToRgba(
                    this.baseColor,
                    0.2
                )
        );

        fog.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        context.fillStyle =
            fog;

        context.beginPath();

        context.arc(
            x,
            y,
            size,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    context.restore();
}


drawFace(context) {

    const smileAmount =
        this.smile.smileAmount;

    context.save();

    context.fillStyle =
        "rgba(3,10,17,0.96)";

    roundedRectPath(
        context,
        -this.radius * 0.46,
        -this.radius * 0.17,
        this.radius * 0.92,
        this.radius * 0.28,
        6
    );

    context.fill();

    context.strokeStyle =
        "rgba(255,255,255,0.15)";

    context.lineWidth = 1;

    context.stroke();

    const eyeGradient =
        context.createLinearGradient(
            -this.radius * 0.34,
            0,
            this.radius * 0.34,
            0
        );

    eyeGradient.addColorStop(
        0,
        hexToRgba(
            this.baseColor,
            0
        )
    );

    eyeGradient.addColorStop(
        0.19,
        this.baseColor
    );

    eyeGradient.addColorStop(
        0.5,
        "#ffffff"
    );

    eyeGradient.addColorStop(
        0.81,
        this.baseColor
    );

    eyeGradient.addColorStop(
        1,
        hexToRgba(
            this.baseColor,
            0
        )
    );

    context.fillStyle =
        eyeGradient;

    context.shadowColor =
        this.baseColor;

    context.shadowBlur =
        8;

    context.fillRect(
        -this.radius * 0.34,
        -this.radius * 0.09,
        this.radius * 0.68,
        this.radius * 0.065
    );

    context.shadowBlur = 0;

    if (
        smileAmount > 0.04
    ) {

        context.strokeStyle =
            hexToRgba(
                "#ffffff",
                0.38 +
                smileAmount * 0.42
            );

        context.lineWidth =
            1.4;

        context.lineCap =
            "round";

        context.beginPath();

        context.moveTo(
            -this.radius * 0.15,
            this.radius * 0.025
        );

        context.quadraticCurveTo(
            0,
            this.radius *
            (
                0.09 +
                smileAmount * 0.075
            ),
            this.radius * 0.15,
            this.radius * 0.025
        );

        context.stroke();
    }

    context.restore();
}


drawGlass(context) {

    const glass =
        context.createLinearGradient(
            -this.radius,
            -this.radius,
            this.radius,
            this.radius
        );

    glass.addColorStop(
        0,
        "rgba(255,255,255,0.44)"
    );

    glass.addColorStop(
        0.22,
        "rgba(255,255,255,0.08)"
    );

    glass.addColorStop(
        0.56,
        "rgba(255,255,255,0.01)"
    );

    glass.addColorStop(
        0.9,
        hexToRgba(
            this.baseColor,
            0.11
        )
    );

    glass.addColorStop(
        1,
        "rgba(0,0,0,0.22)"
    );

    context.fillStyle =
        glass;

    context.beginPath();

    context.arc(
        0,
        0,
        this.radius * 0.94,
        0,
        Math.PI * 2
    );

    context.fill();
}


drawHighlight(
    context,
    time
) {

    const offset =
        Math.sin(
            time * 1.2 +
            this.motionSeed
        ) *
        this.radius *
        0.055;

    const highlight =
        context.createRadialGradient(
            -this.radius * 0.32 +
            offset,
            -this.radius * 0.4,
            0,
            -this.radius * 0.32 +
            offset,
            -this.radius * 0.4,
            this.radius * 0.43
        );

    highlight.addColorStop(
        0,
        "rgba(255,255,255,0.48)"
    );

    highlight.addColorStop(
        1,
        "rgba(255,255,255,0)"
    );

    context.fillStyle =
        highlight;

    context.beginPath();

    context.ellipse(
        -this.radius * 0.29 +
        offset,
        -this.radius * 0.38,
        this.radius * 0.3,
        this.radius * 0.13,
        -0.42,
        0,
        Math.PI * 2
    );

    context.fill();
}


drawRabbit(
    context,
    time,
    auraIntensity = 1
) {

    const speed =
        Math.hypot(
            this.vx,
            this.vy
        );

    const speedRatio =
        clamp(
            speed /
            CONFIG.parentMaxSpeed,
            0,
            1
        );

    let angle =
        Math.atan2(
            this.vy,
            this.vx
        );

    if (
        speed < 12
    ) {

        angle =
            this.rotation;
    }

    context.save();

    context.translate(
        this.x,
        this.y
    );

    context.rotate(
        angle
    );

    context.scale(
        this.squashX *
        (
            1 +
            speedRatio * 0.07
        ),
        this.squashY *
        (
            1 -
            speedRatio * 0.04
        )
    );

    this.drawAura(
        context,
        time,
        auraIntensity
    );

    this.drawShadow(
        context
    );

    this.drawBody(
        context
    );

    this.drawFog(
        context,
        time
    );

    this.drawFace(
        context
    );

    this.drawGlass(
        context
    );

    this.drawHighlight(
        context,
        time
    );

    context.restore();
}
}

/* ==========================================================
   RGB PARENT RABBIT
   ========================================================== */

class ParentRabbit extends RabbitBase {

constructor(options) {

    const definition =
        PRIMARY_COLORS[
            options.colorId
        ];

    if (!definition) {

        throw new Error(
            `Nepoznata RGB boja: ${options.colorId}`
        );
    }

    super({

        x:
            options.x,

        y:
            options.y,

        vx:
            options.vx,

        vy:
            options.vy,

        radius:
            options.radius,

        baseColor:
            definition.hex
    });

    this.colorId =
        options.colorId;

    this.definition =
        definition;

    this.voidCooldown = 0;

    this.capturedByVoidId = null;

    this.captureScale = 1;

    this.captureTargetScale = 1;

    this.isCaptured = false;
}


update(delta) {

    this.voidCooldown =
        Math.max(
            0,
            this.voidCooldown -
            delta
        );

    if (
        !this.isCaptured
    ) {

        this.integrate(
            delta,
            CONFIG.parentMaxSpeed
        );
    }

    this.captureScale =
        lerp(
            this.captureScale,
            this.captureTargetScale,
            1 -
            Math.pow(
                0.0001,
                delta
            )
        );

    this.updateAnimation(
        delta
    );
}
   resolveWorldBounds() {

    const minimumX =
        this.radius +
        CONFIG.wallPadding;

    const maximumX =
        ENGINE.width -
        this.radius -
        CONFIG.wallPadding;

    const minimumY =
        this.radius +
        CONFIG.wallPadding;

    const maximumY =
        ENGINE.height -
        this.radius -
        CONFIG.wallPadding;

    const reboundSpeed = speed => {

        return Math.max(
            CONFIG.combinedMinimumWallSpeed,
            speed *
            CONFIG.combinedWallBounce *
            CONFIG.combinedWallKick
        );
    };

    if (this.x < minimumX) {

        this.x = minimumX;

        if (this.vx < 0) {

            const speed =
                Math.abs(this.vx);

            this.vx =
                reboundSpeed(speed);

            this.registerImpact(
                1,
                0,
                speed
            );
        }
    }

    if (this.x > maximumX) {

        this.x = maximumX;

        if (this.vx > 0) {

            const speed =
                Math.abs(this.vx);

            this.vx =
                -reboundSpeed(speed);

            this.registerImpact(
                -1,
                0,
                speed
            );
        }
    }

    if (this.y < minimumY) {

        this.y = minimumY;

        if (this.vy < 0) {

            const speed =
                Math.abs(this.vy);

            this.vy =
                reboundSpeed(speed);

            this.registerImpact(
                0,
                1,
                speed
            );
        }
    }

    if (this.y > maximumY) {

        this.y = maximumY;

        if (this.vy > 0) {

            const speed =
                Math.abs(this.vy);

            this.vy =
                -reboundSpeed(speed);

            this.vx *= 0.998;

            this.registerImpact(
                0,
                -1,
                speed
            );
        }
    }

    limitVelocity(
        this,
        CONFIG.combinedMaxSpeed
    );
}


applyPointerImpulse(
    pointerX,
    pointerY
) {

    const direction =
        normalizeVector(
            this.x -
            pointerX,
            this.y -
            pointerY
        );

    const currentSpeed =
        Math.hypot(
            this.vx,
            this.vy
        );

    const impulse =
        CONFIG.pointerImpulse *
        (
            1 +
            clamp(
                1 -
                currentSpeed /
                CONFIG.parentMaxSpeed,
                0,
                1
            ) *
            0.18
        );

    this.vx +=
        direction.x *
        impulse;

    this.vy +=
        direction.y *
        impulse;

    limitVelocity(
        this,
        CONFIG.parentMaxSpeed
    );

    this.registerImpact(
        direction.x,
        direction.y,
        impulse
    );

    this.smile.trigger(
        randomRange(
            0.55,
            1
        ),
        randomRange(
            0.7,
            1.4
        )
    );

    createImpulseParticles(
        this.x,
        this.y,
        this.baseColor,
        14
    );
}


draw(context, time) {

    context.save();

    context.translate(
        this.x,
        this.y
    );

    context.scale(
        this.captureScale,
        this.captureScale
    );

    context.translate(
        -this.x,
        -this.y
    );

    this.drawRabbit(
        context,
        time,
        1
    );

    context.restore();

    if (
        CONFIG.debug
    ) {

        context.save();

        context.strokeStyle =
            "rgba(255,255,255,0.35)";

        context.lineWidth = 1;

        context.beginPath();

        context.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        context.stroke();

        context.restore();
    }
}
}

/* ==========================================================
   COMBINED RABBIT
   ========================================================== */

class CombinedRabbit extends RabbitBase {

constructor(options) {

    const definition =
        COMBINATION_DEFINITIONS[
            options.colorId
        ];

    if (!definition) {

        throw new Error(
            `Nepoznata kombinovana boja: ${options.colorId}`
        );
    }

    super({

        x:
            options.x,

        y:
            options.y,

        vx:
            options.vx,

        vy:
            options.vy,

        radius:
            options.radius,

        baseColor:
            definition.hex
    });

    this.colorId =
        options.colorId;

    this.definition =
        definition;

    this.spawnAge = 0;

    this.spawnDuration = 0.68;

    this.spawnScale = 0.12;

    this.glowEnergy = 1;
   
   this.generation =
    Number.isFinite(options.generation)
        ? options.generation
        : 1;

this.reproductionCooldown =
    Number.isFinite(options.reproductionCooldown)
        ? options.reproductionCooldown
        : CONFIG.childReproductionInitialCooldown;

    this.smile.trigger(
        1,
        1.6
    );
}


update(delta) {

    this.spawnAge +=
        delta;

    const spawnProgress =
        clamp(
            this.spawnAge /
            this.spawnDuration,
            0,
            1
        );

    const overshoot =
        1 +
        Math.sin(
            spawnProgress *
            Math.PI
        ) *
        0.14;

    this.spawnScale =
        lerp(
            0.12,
            overshoot,
            spawnProgress
        );

    this.glowEnergy =
        Math.max(
            0,
            this.glowEnergy -
            delta * 0.52
        );
   
    this.reproductionCooldown =
    Math.max(
        0,
        this.reproductionCooldown -
        delta
    );

    this.integrate(
        delta,
        CONFIG.combinedMaxSpeed
    );

    this.updateAnimation(
        delta
    );
}


draw(context, time) {

    context.save();

    context.translate(
        this.x,
        this.y
    );

    context.scale(
        this.spawnScale,
        this.spawnScale
    );

    context.translate(
        -this.x,
        -this.y
    );

    this.drawRabbit(
        context,
        time,
        1.25 +
        this.glowEnergy * 0.7
    );

    this.drawCombinationRing(
        context,
        time
    );

    context.restore();
}


drawCombinationRing(
    context,
    time
) {

    context.save();

    context.translate(
        this.x,
        this.y
    );

    context.rotate(
        time *
        0.55 +
        this.motionSeed
    );

    context.strokeStyle =
        hexToRgba(
            this.baseColor,
            0.42
        );

    context.lineWidth =
        1.6;

    context.setLineDash([
        5,
        7
    ]);

    context.lineDashOffset =
        -time * 15;

    context.beginPath();

    context.arc(
        0,
        0,
        this.radius * 1.22,
        0,
        Math.PI * 2
    );

    context.stroke();

    context.restore();
}
}

/* ==========================================================
   WHITE TILT
   ========================================================== */

class WhiteTilt {

constructor(
    x,
    y,
    radius
) {

    this.x = x;
    this.y = y;

    this.radius =
        radius;

    this.pulse = 0;

    this.rotation = 0;

    this.energy = 0;
}


update(
    delta,
    time
) {

    this.energy =
        Math.max(
            0,
            this.energy -
            delta * 2.15
        );

    this.rotation +=
        delta *
        (
            0.18 +
            this.energy * 1.2
        );

    this.pulse =
        Math.sin(
            time * 2
        ) *
        1.4 +
        this.energy * 7;
}


containsPoint(
    x,
    y
) {

    const radius =
        this.radius +
        20;

    return (
        distanceSquared(
            this.x,
            this.y,
            x,
            y
        ) <=
        radius * radius
    );
}


activate() {

    this.energy = 1;

    MUSIC.playImpulseTone();

    createRingParticles(
        this.x,
        this.y,
        "#ffffff",
        34
    );
}


draw(
    context,
    time
) {

    const radius =
        this.radius +
        this.pulse;

    context.save();

    context.translate(
        this.x,
        this.y
    );

    const auraRadius =
        radius *
        (
            1.65 +
            this.energy * 0.42
        );

    const aura =
        context.createRadialGradient(
            0,
            0,
            radius * 0.25,
            0,
            0,
            auraRadius
        );

    aura.addColorStop(
        0,
        `rgba(255,255,255,${
            0.15 +
            this.energy * 0.2
        })`
    );

    aura.addColorStop(
        0.28,
        "rgba(255,48,79,0.07)"
    );

    aura.addColorStop(
        0.48,
        "rgba(36,233,111,0.06)"
    );

    aura.addColorStop(
        0.68,
        "rgba(25,118,255,0.08)"
    );

    aura.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    context.fillStyle =
        aura;

    context.beginPath();

    context.arc(
        0,
        0,
        auraRadius,
        0,
        Math.PI * 2
    );

    context.fill();

    const body =
        context.createRadialGradient(
            -radius * 0.34,
            -radius * 0.38,
            radius * 0.03,
            0,
            radius * 0.08,
            radius * 1.04
        );

    body.addColorStop(
        0,
        "#ffffff"
    );

    body.addColorStop(
        0.25,
        "#f2fbff"
    );

    body.addColorStop(
        0.63,
        "#c4d3e1"
    );

    body.addColorStop(
        1,
        "#323c47"
    );

    context.fillStyle =
        body;

    context.shadowColor =
        "#dffaff";

    context.shadowBlur =
        15 +
        this.energy * 24;

    context.beginPath();

    context.arc(
        0,
        0,
        radius,
        0,
        Math.PI * 2
    );

    context.fill();

    context.shadowBlur = 0;

    context.fillStyle =
        "rgba(4,11,17,0.96)";

    roundedRectPath(
        context,
        -radius * 0.45,
        -radius * 0.17,
        radius * 0.9,
        radius * 0.25,
        6
    );

    context.fill();

    const eye =
        context.createLinearGradient(
            -radius * 0.35,
            0,
            radius * 0.35,
            0
        );

    eye.addColorStop(
        0,
        "rgba(255,48,79,0)"
    );

    eye.addColorStop(
        0.17,
        "#ff304f"
    );

    eye.addColorStop(
        0.4,
        "#24e96f"
    );

    eye.addColorStop(
        0.62,
        "#1976ff"
    );

    eye.addColorStop(
        0.83,
        "#ffffff"
    );

    eye.addColorStop(
        1,
        "rgba(255,255,255,0)"
    );

    context.fillStyle =
        eye;

    context.shadowColor =
        "#ffffff";

    context.shadowBlur =
        9 +
        this.energy * 16;

    context.fillRect(
        -radius * 0.34,
        -radius * 0.09,
        radius * 0.68,
        radius * 0.07
    );

    context.shadowBlur = 0;

    context.save();

    context.rotate(
        this.rotation
    );

    const ringRadius =
        radius * 1.29;

    const ringGradient =
        context.createLinearGradient(
            -ringRadius,
            0,
            ringRadius,
            0
        );

    ringGradient.addColorStop(
        0,
        "#ff304f"
    );

    ringGradient.addColorStop(
        0.24,
        "#ffe52e"
    );

    ringGradient.addColorStop(
        0.46,
        "#24e96f"
    );

    ringGradient.addColorStop(
        0.68,
        "#00f2ff"
    );

    ringGradient.addColorStop(
        0.84,
        "#1976ff"
    );

    ringGradient.addColorStop(
        1,
        "#ff2bd6"
    );

    context.strokeStyle =
        ringGradient;

    context.lineWidth =
        2 +
        this.energy * 1.5;

    context.setLineDash([
        8,
        7
    ]);

    context.lineDashOffset =
        -time * 18;

    context.beginPath();

    context.arc(
        0,
        0,
        ringRadius,
        0,
        Math.PI * 2
    );

    context.stroke();

    context.restore();

    context.restore();
}
}

/* ==========================================================
   VOID REACTOR
   ========================================================== */

class VoidReactor {

constructor(
    id,
    x,
    y,
    radius
) {

    this.id = id;

    this.x = x;
    this.y = y;

    this.radius =
        radius;

    this.rotation = 0;

    this.energy = 0;

    this.memory = [];

    this.processing = false;

    this.processingTimer = 0;

    this.spawnCooldown = 0;

    this.flash = 0;
}


update(
    delta,
    time
) {

    this.rotation +=
        delta *
        (
            0.45 +
            this.energy * 1.3
        );

    this.energy =
        Math.max(
            0,
            this.energy -
            delta * 0.5
        );

    this.flash =
        Math.max(
            0,
            this.flash -
            delta * 2.8
        );

    this.spawnCooldown =
        Math.max(
            0,
            this.spawnCooldown -
            delta
        );

    if (
        this.processing
    ) {

        this.processingTimer -=
            delta;

        if (
            this.processingTimer <= 0
        ) {

            this.finishProcessing();
        }
    }

    this.updateCapturedParents(
        delta,
        time
    );
}


updateCapturedParents(
    delta,
    time
) {

    const count =
        this.memory.length;

    for (
        let index = 0;
        index < count;
        index += 1
    ) {

        const rabbit =
            this.memory[index];

        const orbitRadius =
            this.radius *
            (
                0.42 +
                index * 0.12
            );

        const angle =
            time *
            (
                2.1 +
                index * 0.35
            ) +
            index * Math.PI;

        const targetX =
            this.x +
            Math.cos(angle) *
            orbitRadius;

        const targetY =
            this.y +
            Math.sin(angle) *
            orbitRadius;

        rabbit.x =
            lerp(
                rabbit.x,
                targetX,
                1 -
                Math.pow(
                    0.00001,
                    delta
                )
            );

        rabbit.y =
            lerp(
                rabbit.y,
                targetY,
                1 -
                Math.pow(
                    0.00001,
                    delta
                )
            );

        rabbit.vx = 0;
        rabbit.vy = 0;

        rabbit.captureTargetScale =
            this.processing
                ? 0.18
                : 0.46;

        rabbit.updateAnimation(
            delta
        );
    }
}


applyGravity(
    rabbit,
    delta
) {

    if (
        rabbit.isCaptured ||
        rabbit.voidCooldown > 0
    ) {

        return;
    }

    const dx =
        this.x -
        rabbit.x;

    const dy =
        this.y -
        rabbit.y;

    const distance =
        Math.hypot(
            dx,
            dy
        );

    const influenceRadius =
        this.radius *
        CONFIG.voidGravityRadiusFactor;

    if (
        distance >=
        influenceRadius ||
        distance < 0.0001
    ) {

        return;
    }

    const normalized =
        normalizeVector(
            dx,
            dy
        );

    const proximity =
        1 -
        distance /
        influenceRadius;

    const pullAcceleration =
        Math.min(
            CONFIG.voidMaximumPullAcceleration,
            CONFIG.voidPullForce *
            proximity *
            proximity
        );

    const tangentX =
        -normalized.y;

    const tangentY =
        normalized.x;

    const spiralDirection =
        this.id % 2 === 0
            ? 1
            : -1;

    rabbit.vx +=
        (
            normalized.x *
            pullAcceleration +
            tangentX *
            CONFIG.voidSpiralForce *
            proximity *
            spiralDirection
        ) *
        delta;

    rabbit.vy +=
        (
            normalized.y *
            pullAcceleration +
            tangentY *
            CONFIG.voidSpiralForce *
            proximity *
            spiralDirection
        ) *
        delta;

    this.energy =
        Math.max(
            this.energy,
            proximity
        );

    const captureRadius =
        this.radius *
        CONFIG.voidCaptureRadiusFactor;

    if (
        distance <=
        captureRadius
    ) {

        this.tryCapture(
            rabbit
        );
    }
}


tryCapture(rabbit) {

    if (
        this.processing ||
        this.memory.length >= 2 ||
        rabbit.isCaptured ||
        rabbit.voidCooldown > 0
    ) {

        return;
    }

    const alreadyHasColor =
        this.memory.some(
            captured =>
                captured.colorId ===
                rabbit.colorId
        );

    if (
        alreadyHasColor
    ) {

        this.rejectRabbit(
            rabbit
        );

        return;
    }

    rabbit.isCaptured = true;

    rabbit.capturedByVoidId =
        this.id;

    rabbit.captureTargetScale =
        0.46;

    rabbit.vx = 0;
    rabbit.vy = 0;

    this.memory.push(
        rabbit
    );

    this.flash = 1;

    createImplosionParticles(
        rabbit.x,
        rabbit.y,
        rabbit.baseColor,
        18
    );

    setStatus(
        `VOID ${this.id + 1}: ${rabbit.colorId} MEMORISAN`,
        "warning",
        1300
    );

    if (
        this.memory.length === 2
    ) {

        this.beginProcessing();
    }
}


rejectRabbit(rabbit) {

    const direction =
        normalizeVector(
            rabbit.x -
            this.x,
            rabbit.y -
            this.y
        );

    rabbit.vx =
        direction.x *
        CONFIG.voidParentReleaseSpeed;

    rabbit.vy =
        direction.y *
        CONFIG.voidParentReleaseSpeed -
        90;

    rabbit.voidCooldown =
        CONFIG.voidParentCooldown;

    this.flash = 0.65;

    createImpulseParticles(
        rabbit.x,
        rabbit.y,
        rabbit.baseColor,
        10
    );
}


beginProcessing() {

    if (
        this.memory.length !== 2
    ) {

        return;
    }

    const recipe =
        getRecipe(
            this.memory[0].colorId,
            this.memory[1].colorId
        );

    if (!recipe) {

        this.releaseParents();

        return;
    }

    this.processing = true;

    this.processingTimer =
        CONFIG.voidProcessingTime;

    this.energy = 1;

    this.flash = 1;

    setStatus(
        `VOID ${this.id + 1}: ${recipe.id} MATERIALIZACIJA`,
        "warning",
        1600
    );

    createRingParticles(
        this.x,
        this.y,
        recipe.hex,
        26
    );
}


finishProcessing() {

    if (
        this.memory.length !== 2
    ) {

        this.processing = false;

        return;
    }

    const first =
        this.memory[0];

    const second =
        this.memory[1];

    const recipe =
        getRecipe(
            first.colorId,
            second.colorId
        );

    if (!recipe) {

        this.processing = false;

        this.releaseParents();

        return;
    }

    spawnCombinedRabbit(
        this,
        recipe
    );

    this.releaseParents();

    this.processing = false;

    this.processingTimer = 0;

    this.spawnCooldown =
        CONFIG.voidSpawnCooldown;

    this.flash = 1;
    this.energy = 1;
}


releaseParents() {

    const parents =
        [...this.memory];

    this.memory.length = 0;

    parents.forEach(
        (
            rabbit,
            index
        ) => {

            const baseAngle =
                Math.atan2(
                    ENGINE.height * 0.5 -
                    this.y,
                    ENGINE.width * 0.5 -
                    this.x
                );

            const angle =
                baseAngle +
                (
                    index === 0
                        ? -0.42
                        : 0.42
                );

            const releaseDistance =
                this.radius *
                CONFIG.voidReleaseDistanceFactor +
                rabbit.radius;

            rabbit.x =
                this.x +
                Math.cos(angle) *
                releaseDistance;

            rabbit.y =
                this.y +
                Math.sin(angle) *
                releaseDistance;

            rabbit.vx =
                Math.cos(angle) *
                CONFIG.voidParentReleaseSpeed;

            rabbit.vy =
                Math.sin(angle) *
                CONFIG.voidParentReleaseSpeed -
                80;

            rabbit.isCaptured = false;

            rabbit.capturedByVoidId = null;

            rabbit.captureTargetScale = 1;

            rabbit.voidCooldown =
                CONFIG.voidParentCooldown;

            rabbit.smile.trigger(
                0.8,
                1
            );
        }
    );
}


draw(
    context,
    time
) {

    context.save();

    context.translate(
        this.x,
        this.y
    );

    const pulse =
        Math.sin(
            time * 2.3 +
            this.id
        ) *
        1.8;

    const radius =
        this.radius +
        pulse +
        this.energy * 3;

    const outerRadius =
        radius *
        (
            1.72 +
            this.energy * 0.2
        );

    const aura =
        context.createRadialGradient(
            0,
            0,
            radius * 0.22,
            0,
            0,
            outerRadius
        );

    aura.addColorStop(
        0,
        `rgba(255,255,255,${
            0.04 +
            this.flash * 0.14
        })`
    );

    aura.addColorStop(
        0.2,
        `rgba(80,30,150,${
            0.13 +
            this.energy * 0.1
        })`
    );

    aura.addColorStop(
        0.55,
        `rgba(0,242,255,${
            0.035 +
            this.energy * 0.04
        })`
    );

    aura.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    context.fillStyle =
        aura;

    context.beginPath();

    context.arc(
        0,
        0,
        outerRadius,
        0,
        Math.PI * 2
    );

    context.fill();

    context.save();

    context.rotate(
        this.rotation
    );

    context.strokeStyle =
        `rgba(160,90,255,${
            0.32 +
            this.energy * 0.35
        })`;

    context.lineWidth =
        2.2;

    context.setLineDash([
        7,
        6
    ]);

    context.lineDashOffset =
        -time *
        (
            12 +
            this.energy * 22
        );

    context.beginPath();

    context.arc(
        0,
        0,
        radius * 1.17,
        0,
        Math.PI * 2
    );

    context.stroke();

    context.restore();

    const eventHorizon =
        context.createRadialGradient(
            -radius * 0.18,
            -radius * 0.2,
            radius * 0.04,
            0,
            0,
            radius
        );

    eventHorizon.addColorStop(
        0,
        `rgba(190,145,255,${
            0.18 +
            this.flash * 0.45
        })`
    );

    eventHorizon.addColorStop(
        0.18,
        "#190f2c"
    );

    eventHorizon.addColorStop(
        0.54,
        "#050308"
    );

    eventHorizon.addColorStop(
        0.82,
        "#000000"
    );

    eventHorizon.addColorStop(
        1,
        "#000000"
    );

    context.fillStyle =
        eventHorizon;

    context.shadowColor =
        "rgba(128,50,255,0.8)";

    context.shadowBlur =
        12 +
        this.energy * 20;

    context.beginPath();

    context.arc(
        0,
        0,
        radius,
        0,
        Math.PI * 2
    );

    context.fill();

    context.shadowBlur = 0;

    context.save();

    context.rotate(
        -this.rotation * 1.35
    );

    context.strokeStyle =
        `rgba(0,242,255,${
            0.2 +
            this.energy * 0.34
        })`;

    context.lineWidth =
        1.5;

    context.beginPath();

    context.arc(
        0,
        0,
        radius * 0.73,
        0.25,
        Math.PI * 1.45
    );

    context.stroke();

    context.strokeStyle =
        `rgba(255,43,214,${
            0.18 +
            this.energy * 0.3
        })`;

    context.beginPath();

    context.arc(
        0,
        0,
        radius * 0.54,
        Math.PI,
        Math.PI * 2.35
    );

    context.stroke();

    context.restore();

    this.drawMemoryIndicators(
        context,
        radius
    );

    context.restore();
}


drawMemoryIndicators(
    context,
    radius
) {

    for (
        let index = 0;
        index < 2;
        index += 1
    ) {

        const angle =
            -Math.PI * 0.5 +
            (
                index === 0
                    ? -0.3
                    : 0.3
            );

        const x =
            Math.cos(angle) *
            radius * 0.44;

        const y =
            Math.sin(angle) *
            radius * 0.44;

        const rabbit =
            this.memory[index];

        context.fillStyle =
            rabbit
                ? rabbit.baseColor
                : "rgba(255,255,255,0.08)";

        context.shadowColor =
            rabbit
                ? rabbit.baseColor
                : "transparent";

        context.shadowBlur =
            rabbit
                ? 8
                : 0;

        context.beginPath();

        context.arc(
            x,
            y,
            radius * 0.085,
            0,
            Math.PI * 2
        );

        context.fill();

        context.shadowBlur = 0;
    }
}
}

/* ==========================================================
   OVERLAP EFFECT
   ========================================================== */

class OverlapEffect {

constructor(
    firstRabbit,
    secondRabbit,
    recipe
) {

    this.firstRabbit =
        firstRabbit;

    this.secondRabbit =
        secondRabbit;

    this.recipe =
        recipe;

    this.strength = 0;

    this.targetStrength = 0;

    this.x = 0;
    this.y = 0;

    this.active = true;
}


update(delta) {

    const dx =
        this.secondRabbit.x -
        this.firstRabbit.x;

    const dy =
        this.secondRabbit.y -
        this.firstRabbit.y;

    const distance =
        Math.hypot(
            dx,
            dy
        );

    const combinedRadius =
        this.firstRabbit.radius +
        this.secondRabbit.radius;

    const overlap =
        combinedRadius -
        distance;

    this.targetStrength =
        overlap > 0
            ? clamp(
                overlap /
                (
                    Math.min(
                        this.firstRabbit.radius,
                        this.secondRabbit.radius
                    ) *
                    1.35
                ),
                0,
                CONFIG.overlapGlowMaximum
            )
            : 0;

    this.strength =
        lerp(
            this.strength,
            this.targetStrength,
            1 -
            Math.pow(
                0.0005,
                delta
            )
        );

    this.x =
        (
            this.firstRabbit.x +
            this.secondRabbit.x
        ) *
        0.5;

    this.y =
        (
            this.firstRabbit.y +
            this.secondRabbit.y
        ) *
        0.5;

    if (
        this.targetStrength <= 0 &&
        this.strength < 0.015
    ) {

        this.active = false;
    }
}


draw(
    context,
    time
) {

    if (
        this.strength <
        CONFIG.overlapDisplayMinimum
    ) {

        return;
    }

    const radius =
        lerp(
            15,
            38,
            this.strength
        );

    context.save();

    context.translate(
        this.x,
        this.y
    );

    const glow =
        context.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            radius * 1.65
        );

    glow.addColorStop(
        0,
        hexToRgba(
            this.recipe.hex,
            0.54 *
            this.strength
        )
    );

    glow.addColorStop(
        0.38,
        hexToRgba(
            this.recipe.hex,
            0.19 *
            this.strength
        )
    );

    glow.addColorStop(
        1,
        hexToRgba(
            this.recipe.hex,
            0
        )
    );

    context.fillStyle =
        glow;

    context.beginPath();

    context.arc(
        0,
        0,
        radius * 1.65,
        0,
        Math.PI * 2
    );

    context.fill();

    context.globalAlpha =
        clamp(
            this.strength,
            0,
            1
        );

    context.fillStyle =
        this.recipe.hex;

    context.shadowColor =
        this.recipe.hex;

    context.shadowBlur =
        12;

    context.beginPath();

    context.arc(
        0,
        0,
        radius * 0.34,
        0,
        Math.PI * 2
    );

    context.fill();

    context.shadowBlur = 0;

    context.rotate(
        time
    );

    context.strokeStyle =
        hexToRgba(
            this.recipe.hex,
            0.72
        );

    context.lineWidth = 1.4;

    context.setLineDash([
        4,
        5
    ]);

    context.beginPath();

    context.arc(
        0,
        0,
        radius * 0.72,
        0,
        Math.PI * 2
    );

    context.stroke();

    context.restore();
}
}

/* ==========================================================
   PARTICLE FACTORIES
   ========================================================== */

function addParticle(particle) {

ENGINE.particles.push(
    particle
);

if (
    ENGINE.particles.length >
    CONFIG.maximumParticles
) {

    ENGINE.particles.splice(
        0,
        ENGINE.particles.length -
        CONFIG.maximumParticles
    );
}
}

function createImpulseParticles(
    x,
    y,
    color,
    count
) {

for (
    let index = 0;
    index < count;
    index += 1
) {

    const angle =
        randomRange(
            0,
            Math.PI * 2
        );

    const speed =
        randomRange(
            55,
            190
        );

    addParticle(
        new Particle({

            x,
            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius:
                randomRange(
                    1.2,
                    3.2
                ),

            color,

            life:
                randomRange(
                    0.35,
                    0.9
                ),

            drag:
                0.965,

            gravity:
                45,

            glow:
                randomRange(
                    5,
                    12
                )
        })
    );
}
}

function createImplosionParticles(
    x,
    y,
    color,
    count
) {

for (
    let index = 0;
    index < count;
    index += 1
) {

    const angle =
        randomRange(
            0,
            Math.PI * 2
        );

    const distance =
        randomRange(
            22,
            70
        );

    const startX =
        x +
        Math.cos(angle) *
        distance;

    const startY =
        y +
        Math.sin(angle) *
        distance;

    const direction =
        normalizeVector(
            x - startX,
            y - startY
        );

    const speed =
        randomRange(
            70,
            190
        );

    addParticle(
        new Particle({

            x:
                startX,

            y:
                startY,

            vx:
                direction.x *
                speed,

            vy:
                direction.y *
                speed,

            radius:
                randomRange(
                    1,
                    2.7
                ),

            color,

            life:
                randomRange(
                    0.35,
                    0.75
                ),

            drag:
                0.99,

            glow:
                9
        })
    );
}
}

function createRingParticles(
    x,
    y,
    color,
    count
) {

for (
    let index = 0;
    index < count;
    index += 1
) {

    const angle =
        (
            index /
            count
        ) *
        Math.PI *
        2;

    const speed =
        randomRange(
            95,
            185
        );

    addParticle(
        new Particle({

            x,
            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius:
                randomRange(
                    1.2,
                    3
                ),

            color,

            life:
                randomRange(
                    0.55,
                    1
                ),

            drag:
                0.975,

            glow:
                10
        })
    );
}
}

/* ==========================================================
   WORLD CREATION
   ========================================================== */

function createBackgroundStars() {

ENGINE.backgroundStars.length = 0;

const area =
    ENGINE.width *
    ENGINE.height;

const count =
    clamp(
        Math.round(
            area / 14500
        ),
        24,
        90
    );

for (
    let index = 0;
    index < count;
    index += 1
) {

    ENGINE.backgroundStars.push({

        x:
            Math.random() *
            ENGINE.width,

        y:
            Math.random() *
            ENGINE.height,

        radius:
            randomRange(
                0.4,
                1.6
            ),

        alpha:
            randomRange(
                0.08,
                0.35
            ),

        phase:
            randomRange(
                0,
                Math.PI * 2
            ),

        speed:
            randomRange(
                0.25,
                1
            )
    });
}
}

function createParents() {

ENGINE.parents.length = 0;

const radius =
    getParentRadius();

const centerX =
    ENGINE.width * 0.5;

const centerY =
    ENGINE.height * 0.5;

const minimumDimension =
    Math.min(
        ENGINE.width,
        ENGINE.height
    );

const spawnDistance =
    clamp(
        minimumDimension * 0.24,
        radius * 2.5,
        145
    );

const definitions = [

    {

        colorId:
            "RED",

        angle:
            -Math.PI * 0.5
    },

    {

        colorId:
            "GREEN",

        angle:
            Math.PI * 0.16
    },

    {

        colorId:
            "BLUE",

        angle:
            Math.PI * 0.84
    }
];

for (
    const item
    of definitions
) {

    const x =
        centerX +
        Math.cos(
            item.angle
        ) *
        spawnDistance;

    const y =
        centerY +
        Math.sin(
            item.angle
        ) *
        spawnDistance;

    const movementAngle =
        item.angle +
        Math.PI +
        randomRange(
            -0.5,
            0.5
        );

    const speed =
        randomRange(
            CONFIG.parentInitialMinSpeed,
            CONFIG.parentInitialMaxSpeed
        );

    ENGINE.parents.push(
        new ParentRabbit({

            colorId:
                item.colorId,

            x,
            y,

            vx:
                Math.cos(
                    movementAngle
                ) *
                speed,

            vy:
                Math.sin(
                    movementAngle
                ) *
                speed,

            radius
        })
    );
}
}

function createVoids() {

ENGINE.voids.length = 0;

const radius =
    getVoidRadius();

const inset =
    getVoidInset();

const positions = [

    {

        x:
            inset,

        y:
            inset
    },

    {

        x:
            ENGINE.width -
            inset,

        y:
            inset
    },

    {

        x:
            ENGINE.width -
            inset,

        y:
            ENGINE.height -
            inset
    },

    {

        x:
            inset,

        y:
            ENGINE.height -
            inset
    }
];

positions.forEach(
    (
        position,
        index
    ) => {

        ENGINE.voids.push(
            new VoidReactor(
                index,
                position.x,
                position.y,
                radius
            )
        );
    }
);
}

function createTilt() {

ENGINE.tilt =
    new WhiteTilt(
        ENGINE.width * 0.5,
        ENGINE.height * 0.5,
        getTiltRadius()
    );
}

function resetCounts() {

ENGINE.counts.YELLOW = 0;
ENGINE.counts.MAGENTA = 0;
ENGINE.counts.CYAN = 0;

updateAllCounters(
    false
);
}

function resetWorld() {

ENGINE.nextRabbitId = 1;

ENGINE.combinedRabbits.length = 0;

ENGINE.particles.length = 0;

ENGINE.overlapEffects.length = 0;

ENGINE.winningColorId = null;

ENGINE.victoryTimer = 0;

ENGINE.gameOverTimer = 0;
ENGINE.gameOverReason = null;

ENGINE.tiltCooldown = 0;

resetCounts();

createParents();

createVoids();

createTilt();

keepEntitiesInsideWorld();
}

/* ==========================================================
   RESIZE / RETINA
   ========================================================== */

function resizeCanvas() {

const rectangle =
    canvas.getBoundingClientRect();

if (
    rectangle.width <= 0 ||
    rectangle.height <= 0
) {

    return;
}

const previousWidth =
    ENGINE.width;

const previousHeight =
    ENGINE.height;

ENGINE.width =
    rectangle.width;

ENGINE.height =
    rectangle.height;

ENGINE.dpr =
    Math.min(
        window.devicePixelRatio ||
        1,
        CONFIG.devicePixelRatioLimit
    );

canvas.width =
    Math.max(
        1,
        Math.round(
            ENGINE.width *
            ENGINE.dpr
        )
    );

canvas.height =
    Math.max(
        1,
        Math.round(
            ENGINE.height *
            ENGINE.dpr
        )
    );

canvas.style.width =
    `${ENGINE.width}px`;

canvas.style.height =
    `${ENGINE.height}px`;

ctx.setTransform(
    ENGINE.dpr,
    0,
    0,
    ENGINE.dpr,
    0,
    0
);

POINTER.x =
    ENGINE.width * 0.5;

POINTER.y =
    ENGINE.height * 0.5;

createBackgroundStars();

if (
    ENGINE.initialized &&
    previousWidth > 0 &&
    previousHeight > 0
) {

    const scaleX =
        ENGINE.width /
        previousWidth;

    const scaleY =
        ENGINE.height /
        previousHeight;

    for (
        const rabbit
        of [
            ...ENGINE.parents,
            ...ENGINE.combinedRabbits
        ]
    ) {

        rabbit.x *=
            scaleX;

        rabbit.y *=
            scaleY;

        rabbit.radius =
            rabbit instanceof ParentRabbit
                ? getParentRadius()
                : getParentRadius() *
                    CONFIG.combinedRadiusFactor;
    }

    createVoids();

    if (
        ENGINE.tilt
    ) {

        ENGINE.tilt.x =
            ENGINE.width *
            0.5;

        ENGINE.tilt.y =
            ENGINE.height *
            0.5;

        ENGINE.tilt.radius =
            getTiltRadius();
    }

    keepEntitiesInsideWorld();
}
}

function keepEntitiesInsideWorld() {

for (
    const rabbit
    of [
        ...ENGINE.parents,
        ...ENGINE.combinedRabbits
    ]
) {

    rabbit.x =
        clamp(
            rabbit.x,
            rabbit.radius,
            ENGINE.width -
            rabbit.radius
        );

    rabbit.y =
        clamp(
            rabbit.y,
            rabbit.radius,
            ENGINE.height -
            rabbit.radius
        );
}
}

window.addEventListener(
    "resize",
    resizeCanvas
);

window.addEventListener(
    "orientationchange",
    () => {

    window.setTimeout(
        resizeCanvas,
        160
    );
}
);

/* ==========================================================
   SPAWN KOMBINOVANOG ZECA
   ========================================================== */

function spawnCombinedRabbit(
    voidReactor,
    recipe
) {

const targetX =
    ENGINE.width *
    0.5;

const targetY =
    ENGINE.height *
    0.5;

const baseDirection =
    normalizeVector(
        targetX -
        voidReactor.x,
        targetY -
        voidReactor.y
    );

const randomAngle =
    randomRange(
        -0.42,
        0.42
    );

const cosine =
    Math.cos(
        randomAngle
    );

const sine =
    Math.sin(
        randomAngle
    );

const directionX =
    baseDirection.x *
    cosine -
    baseDirection.y *
    sine;

const directionY =
    baseDirection.x *
    sine +
    baseDirection.y *
    cosine;

const radius =
    getParentRadius() *
    CONFIG.combinedRadiusFactor;

const spawnDistance =
    voidReactor.radius *
    1.48 +
    radius;

const speed =
    randomRange(
        CONFIG.combinedSpawnSpeedMin,
        CONFIG.combinedSpawnSpeedMax
    );

const rabbit =
    new CombinedRabbit({

        colorId:
            recipe.id,

        x:
            voidReactor.x +
            directionX *
            spawnDistance,

        y:
            voidReactor.y +
            directionY *
            spawnDistance,

        vx:
            directionX *
            speed,

        vy:
            directionY *
            speed -
            70,

        radius
    });

ENGINE.combinedRabbits.push(
    rabbit
);

ENGINE.counts[
    recipe.id
] += 1;

updateCounter(
    recipe.id,
    true
);

createRingParticles(
    rabbit.x,
    rabbit.y,
    recipe.hex,
    34
);

createImpulseParticles(
    rabbit.x,
    rabbit.y,
    recipe.hex,
    20
);

MUSIC.playReactionTone(
    recipe.id
);

setStatus(
    `${recipe.id} MATERIJALIZOVAN • ${
        ENGINE.counts[recipe.id]
    } / ${CONFIG.victoryTarget}`,
    "success",
    1800
);

for (
    const parent
    of ENGINE.parents
) {

    parent.smile.trigger(
        randomRange(
            0.65,
            1
        ),
        randomRange(
            0.75,
            1.4
        )
    );
}

checkVictory(
    recipe.id
);
}

/* ==========================================================
   CHILD GENERATIONS
   ISTA BOJA + ISTA BOJA = NOVO DETE ISTE BOJE
   ========================================================== */

function spawnChildFromChildren(
    first,
    second
) {

if (
    ENGINE.mode !== "RUNNING" ||
    !first ||
    !second ||
    first.colorId !== second.colorId
) {

    return;
}

if (
    ENGINE.combinedRabbits.length >=
    CONFIG.childMaximumPopulation
) {

    return;
}

const definition =
    COMBINATION_DEFINITIONS[
        first.colorId
    ];

if (!definition) {

    return;
}

const radius =
    getParentRadius() *
    CONFIG.combinedRadiusFactor;

const midpointX =
    (
        first.x +
        second.x
    ) * 0.5;

const midpointY =
    (
        first.y +
        second.y
    ) * 0.5;

const angle =
    randomRange(
        0,
        Math.PI * 2
    );

const speed =
    randomRange(
        CONFIG.childReproductionSpawnSpeedMin,
        CONFIG.childReproductionSpawnSpeedMax
    );

const generation =
    Math.max(
        first.generation || 1,
        second.generation || 1
    ) + 1;

const rabbit =
    new CombinedRabbit({

        colorId:
            first.colorId,

        x:
            clamp(
                midpointX,
                radius +
                CONFIG.wallPadding,
                ENGINE.width -
                radius -
                CONFIG.wallPadding
            ),

        y:
            clamp(
                midpointY,
                radius +
                CONFIG.wallPadding,
                ENGINE.height -
                radius -
                CONFIG.wallPadding
            ),

        vx:
            Math.cos(angle) *
            speed,

        vy:
            Math.sin(angle) *
            speed -
            90,

        radius,

        generation,

        reproductionCooldown:
            CONFIG.childReproductionInitialCooldown
    });

ENGINE.combinedRabbits.push(
    rabbit
);

ENGINE.counts[
    rabbit.colorId
] += 1;

updateCounter(
    rabbit.colorId,
    true
);

createRingParticles(
    rabbit.x,
    rabbit.y,
    definition.hex,
    24
);

createImpulseParticles(
    rabbit.x,
    rabbit.y,
    definition.hex,
    14
);

MUSIC.playReactionTone(
    rabbit.colorId
);

setStatus(
    `${rabbit.colorId} GEN ${generation} • NOVO DETE`,
    "success",
    1100
);

checkVictory(
    rabbit.colorId
);
}

/* ==========================================================
   VOID LOCKOUT

   3 roditelja
   3 različita VOID-a
   = GAME OVER
   ========================================================== */

function checkVoidLockoutGameOver() {

if (
    ENGINE.mode !== "RUNNING"
) {

    return;
}

const capturedParents =
    ENGINE.parents.filter(
        parent =>
            parent.isCaptured &&
            parent.capturedByVoidId !== null
    );

if (
    capturedParents.length !== 3
) {

    return;
}

const occupiedVoidIds =
    new Set(
        capturedParents.map(
            parent =>
                parent.capturedByVoidId
        )
    );

if (
    occupiedVoidIds.size !== 3
) {

    return;
}

const validLockout =
    [...occupiedVoidIds]
        .every(
            voidId => {

                const reactor =
                    ENGINE.voids[
                        voidId
                    ];

                return (
                    reactor &&
                    reactor.memory.length === 1 &&
                    !reactor.processing
                );
            }
        );

if (
    !validLockout
) {

    return;
}

ENGINE.mode =
    "GAME_OVER_PENDING";

ENGINE.gameOverReason =
    "THREE_PARENTS_THREE_VOIDS";

ENGINE.gameOverTimer =
    CONFIG.gameOverDelay;

setStatus(
    "VOID LOCKOUT • 3 RODITELJA / 3 REAKTORA",
    "warning"
);

for (
    const reactor
    of ENGINE.voids
) {

    reactor.singleOccupantTimer = 0;
}
}

/* ==========================================================
   VICTORY
   ========================================================== */

function checkVictory(colorId) {

if (
    ENGINE.mode !==
    "RUNNING"
) {

    return;
}

if (
    ENGINE.counts[colorId] <
    CONFIG.victoryTarget
) {

    return;
}

ENGINE.winningColorId =
    colorId;

ENGINE.victoryTimer =
    CONFIG.victoryDelay;

ENGINE.mode =
    "VICTORY_PENDING";

setStatus(
    `${colorId} ×${CONFIG.victoryTarget} • EKSPERIMENT ZAVRŠEN`,
    "success"
);

const definition =
    COMBINATION_DEFINITIONS[
        colorId
    ];

createVictoryParticles(
    definition.hex
);

MUSIC.playVictoryTone(
    colorId
);
}

function createVictoryParticles(color) {

const centerX =
    ENGINE.width * 0.5;

const centerY =
    ENGINE.height * 0.5;

for (
    let index = 0;
    index < 90;
    index += 1
) {

    const angle =
        randomRange(
            0,
            Math.PI * 2
        );

    const speed =
        randomRange(
            80,
            350
        );

    addParticle(
        new Particle({

            x:
                centerX,

            y:
                centerY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius:
                randomRange(
                    1.5,
                    4.5
                ),

            color:
                Math.random() < 0.22
                    ? "#ffffff"
                    : color,

            life:
                randomRange(
                    0.8,
                    2
                ),

            drag:
                0.98,

            gravity:
                110,

            glow:
                14
        })
    );
}
}

function showGameOverScreen() {

ENGINE.mode =
    "GAME_OVER";

document.body.classList.remove(
    "game-running",
    "game-won"
);

document.body.classList.add(
    "game-over"
);

if (
    victoryKicker
) {

    victoryKicker.textContent =
        "EXPERIMENT FAILED";
}

if (
    victoryTitle
) {

    victoryTitle.textContent =
        "VOID LOCKOUT";
}

victoryColorOrb.style.background =
    "radial-gradient(" +
    "circle at 34% 28%," +
    "#ffffff 0%," +
    "#8b5cf6 24%," +
    "#32145f 58%," +
    "#030108 100%" +
    ")";

victoryColorOrb.style.boxShadow =
    "0 0 28px rgba(139,92,246,0.4)," +
    "0 0 70px rgba(139,92,246,0.18)," +
    "inset 0 0 24px rgba(255,255,255,0.16)";

victoryMessage.textContent =
    "Sva tri RGB roditelja ostala su zarobljena " +
    "u tri različita VOID reaktora.";

restartButton.textContent =
    "↻ PONOVI EKSPERIMENT";

victoryScreen.classList.add(
    "is-visible"
);

victoryScreen.setAttribute(
    "aria-hidden",
    "false"
);

victoryScreen.scrollTop = 0;

MUSIC.playReactionTone(
    "MAGENTA"
);
}

function showVictoryScreen() {

const colorId =
    ENGINE.winningColorId;

const definition =
    COMBINATION_DEFINITIONS[
        colorId
    ];

if (!definition) {

    return;
}

ENGINE.mode =
    "WON";

if (
    victoryKicker
) {

    victoryKicker.textContent =
        "EXPERIMENT COMPLETE";
}

if (
    victoryTitle
) {

    victoryTitle.textContent =
        "LABORATORIJA JE ZAVRŠENA";
}

restartButton.textContent =
    "↻ PONOVI EKSPERIMENT";

document.body.classList.remove(
    "game-running",
    "game-over"
);

document.body.classList.add(
    "game-won"
);

victoryColorOrb.style.background =
    `radial-gradient(` +
    `circle at 34% 28%,` +
    `#ffffff 0%,` +
    `${definition.hex} 28%,` +
    `${definition.darkHex} 68%,` +
    `#001015 100%` +
    `)`;

victoryColorOrb.style.boxShadow =
    `0 0 28px ${hexToRgba(
        definition.hex,
        0.38
    )},` +
    `0 0 70px ${hexToRgba(
        definition.hex,
        0.18
    )},` +
    `inset 0 0 24px rgba(255,255,255,0.2)`;

victoryMessage.textContent =
    `Napravljeno je ${CONFIG.victoryTarget} ` +
    `${definition.label} kombinovanih zečeva. ` +
    `RGB eksperiment je uspešno završen.`;

victoryScreen.classList.add(
    "is-visible"
);

victoryScreen.setAttribute(
    "aria-hidden",
    "false"
);
}

/* ==========================================================
   OVERLAP SISTEM
   ========================================================== */

function updateOverlapEffects(delta) {

const activeKeys =
    new Set();

for (
    let firstIndex = 0;
    firstIndex <
    ENGINE.parents.length;
    firstIndex += 1
) {

    const first =
        ENGINE.parents[
            firstIndex
        ];

    if (
        first.isCaptured
    ) {

        continue;
    }

    for (
        let secondIndex =
            firstIndex + 1;
        secondIndex <
        ENGINE.parents.length;
        secondIndex += 1
    ) {

        const second =
            ENGINE.parents[
                secondIndex
            ];

        if (
            second.isCaptured
        ) {

            continue;
        }

        const recipe =
            getRecipe(
                first.colorId,
                second.colorId
            );

        if (!recipe) {

            continue;
        }

        const maximumDistance =
            first.radius +
            second.radius;

        if (
            distanceSquared(
                first.x,
                first.y,
                second.x,
                second.y
            ) >
            maximumDistance *
            maximumDistance
        ) {

            continue;
        }

        const key =
            first.id <
            second.id
                ? `${first.id}:${second.id}`
                : `${second.id}:${first.id}`;

        activeKeys.add(
            key
        );

        let effect =
            ENGINE.overlapEffects.find(
                item =>
                    item.key ===
                    key
            );

        if (!effect) {

            effect =
                new OverlapEffect(
                    first,
                    second,
                    recipe
                );

            effect.key =
                key;

            ENGINE.overlapEffects.push(
                effect
            );
        }
    }
}

for (
    const effect
    of ENGINE.overlapEffects
) {

    if (
        !activeKeys.has(
            effect.key
        )
    ) {

        effect.targetStrength = 0;
    }

    effect.update(
        delta
    );
}

ENGINE.overlapEffects =
    ENGINE.overlapEffects.filter(
        effect =>
            effect.active
    );
}

/* ==========================================================
   PARENT COLLISION LAYER

   Parent ↔ Parent = YES
   Parent ↔ Child  = NO
   ========================================================== */

function resolveParentRabbitCollisions() {

const parents =
    ENGINE.parents;

for (
    let i = 0;
    i < parents.length;
    i += 1
) {

    const first =
        parents[i];

    if (
        first.isCaptured
    ) {

        continue;
    }

    for (
        let j = i + 1;
        j < parents.length;
        j += 1
    ) {

        const second =
            parents[j];

        if (
            second.isCaptured
        ) {

            continue;
        }

        const dx =
            second.x -
            first.x;

        const dy =
            second.y -
            first.y;

        const minimumDistance =
            first.radius +
            second.radius;

        const distanceSquaredValue =
            dx * dx +
            dy * dy;

        if (
            distanceSquaredValue >=
            minimumDistance *
            minimumDistance
        ) {

            continue;
        }

        let distance =
            Math.sqrt(
                distanceSquaredValue
            );

        let normalX;
        let normalY;

        if (
            distance < 0.0001
        ) {

            const angle =
                randomRange(
                    0,
                    Math.PI * 2
                );

            normalX =
                Math.cos(angle);

            normalY =
                Math.sin(angle);

            distance =
                0.0001;

        } else {

            normalX =
                dx / distance;

            normalY =
                dy / distance;
        }

        const overlap =
            minimumDistance -
            distance;

        const correction =
            overlap * 0.5;

        first.x -=
            normalX *
            correction;

        first.y -=
            normalY *
            correction;

        second.x +=
            normalX *
            correction;

        second.y +=
            normalY *
            correction;

        const relativeVelocityX =
            second.vx -
            first.vx;

        const relativeVelocityY =
            second.vy -
            first.vy;

        const velocityAlongNormal =
            relativeVelocityX *
            normalX +
            relativeVelocityY *
            normalY;

        if (
            velocityAlongNormal > 0
        ) {

            continue;
        }

        const impulse =
            -(
                1 +
                CONFIG.parentCollisionBounce
            ) *
            velocityAlongNormal /
            2;

        const impulseX =
            impulse *
            normalX;

        const impulseY =
            impulse *
            normalY;

        first.vx -= impulseX;
        first.vy -= impulseY;

        second.vx += impulseX;
        second.vy += impulseY;

        first.registerImpact(
            -normalX,
            -normalY,
            Math.abs(
                velocityAlongNormal
            )
        );

        second.registerImpact(
            normalX,
            normalY,
            Math.abs(
                velocityAlongNormal
            )
        );
    }
}
}

/* ==========================================================
   KOMBINOVANI SUDARI
   ========================================================== */

function resolveCombinedRabbitCollisions() {

const rabbits =
    ENGINE.combinedRabbits;

for (
    let firstIndex = 0;
    firstIndex <
    rabbits.length;
    firstIndex += 1
) {

    const first =
        rabbits[
            firstIndex
        ];

    for (
        let secondIndex =
            firstIndex + 1;
        secondIndex <
        rabbits.length;
        secondIndex += 1
    ) {

        const second =
            rabbits[
                secondIndex
            ];

        const dx =
            second.x -
            first.x;

        const dy =
            second.y -
            first.y;

        const minimumDistance =
            first.radius +
            second.radius;

        const distanceSquaredValue =
            dx * dx +
            dy * dy;

        if (
            distanceSquaredValue >=
            minimumDistance *
            minimumDistance
        ) {

            continue;
        }

        let distance =
            Math.sqrt(
                distanceSquaredValue
            );

        let normalX;
        let normalY;

        if (
            distance <
            0.0001
        ) {

            const angle =
                randomRange(
                    0,
                    Math.PI * 2
                );

            normalX =
                Math.cos(angle);

            normalY =
                Math.sin(angle);

            distance =
                0.0001;

        } else {

            normalX =
                dx /
                distance;

            normalY =
                dy /
                distance;
        }

        const overlap =
            minimumDistance -
            distance;

        const correction =
            overlap *
            0.5;

        first.x -=
            normalX *
            correction;

        first.y -=
            normalY *
            correction;

        second.x +=
            normalX *
            correction;

        second.y +=
            normalY *
            correction;

        const relativeVelocityX =
            second.vx -
            first.vx;

        const relativeVelocityY =
            second.vy -
            first.vy;

        const velocityAlongNormal =
            relativeVelocityX *
            normalX +
            relativeVelocityY *
            normalY;
       const impactSpeed =
    Math.max(
        0,
        -velocityAlongNormal
    );

const shouldReproduce =
    first.colorId === second.colorId &&
    first.reproductionCooldown <= 0 &&
    second.reproductionCooldown <= 0 &&
    impactSpeed >=
        CONFIG.childReproductionMinImpactSpeed &&
    ENGINE.mode === "RUNNING" &&
    ENGINE.combinedRabbits.length <
        CONFIG.childMaximumPopulation;

if (
    shouldReproduce
) {

    first.reproductionCooldown =
        CONFIG.childReproductionCooldown;

    second.reproductionCooldown =
        CONFIG.childReproductionCooldown;
}

        if (
            velocityAlongNormal > 0
        ) {

            continue;
        }

        const impulse =
            -(
                1 +
                CONFIG.combinedCollisionBounce
            ) *
            velocityAlongNormal /
            2;

        const impulseX =
            impulse *
            normalX;

        const impulseY =
            impulse *
            normalY;

        first.vx -=
            impulseX;

        first.vy -=
            impulseY;

        second.vx +=
            impulseX;

        second.vy +=
            impulseY;

        first.registerImpact(
            -normalX,
            -normalY,
            Math.abs(
                velocityAlongNormal
            )
        );

        second.registerImpact(
            normalX,
            normalY,
            Math.abs(
                velocityAlongNormal
            )
        );

        first.smile.trigger(
            0.5,
            0.7
        );

        second.smile.trigger(
    0.5,
    0.7
);

if (
    shouldReproduce
) {

     spawnChildFromChildren(
        first,
        second
    );
}

    }
}
}
   
/* ==========================================================
   TILT IMPULSE
   ========================================================== */

function activateTilt() {

if (
    !ENGINE.tilt ||
    ENGINE.tiltCooldown > 0 ||
    ENGINE.mode !== "RUNNING"
) {

    return;
}

ENGINE.tiltCooldown =
    CONFIG.tiltCooldown;

ENGINE.tilt.activate();

const allRabbits = [

    ...ENGINE.parents.filter(
        rabbit =>
            !rabbit.isCaptured
    ),

    ...ENGINE.combinedRabbits
];

const influenceRadius =
    ENGINE.tilt.radius *
    CONFIG.tiltImpulseRadiusFactor;

for (
    const rabbit
    of allRabbits
) {

    const dx =
        rabbit.x -
        ENGINE.tilt.x;

    const dy =
        rabbit.y -
        ENGINE.tilt.y;

    const distance =
        Math.hypot(
            dx,
            dy
        );

    if (
        distance >=
        influenceRadius
    ) {

        continue;
    }

    const direction =
        normalizeVector(
            dx,
            dy
        );

    const strength =
        1 -
        distance /
        influenceRadius;

    const impulse =
        CONFIG.tiltImpulseForce *
        strength *
        strength;

    rabbit.vx +=
        direction.x *
        impulse;

    rabbit.vy +=
        direction.y *
        impulse;

    rabbit.registerImpact(
        direction.x,
        direction.y,
        impulse
    );

    rabbit.smile.trigger(
        0.75,
        0.9
    );
}

setStatus(
    "WHITE PULSE AKTIVIRAN",
    "success",
    1100
);
}

/* ==========================================================
   POINTER / TOUCH
   ========================================================== */

function updatePointerPosition(event) {

const rectangle =
    canvas.getBoundingClientRect();

POINTER.x =
    clamp(
        event.clientX -
        rectangle.left,
        0,
        rectangle.width
    );

POINTER.y =
    clamp(
        event.clientY -
        rectangle.top,
        0,
        rectangle.height
    );
}

function handlePointerDown(event) {

if (
    ENGINE.mode !==
    "RUNNING"
) {

    return;
}

event.preventDefault();

POINTER.active = true;

POINTER.pointerId =
    event.pointerId;

updatePointerPosition(
    event
);

if (
    canvas.setPointerCapture
) {

    try {

        canvas.setPointerCapture(
            event.pointerId
        );

    } catch (error) {

        console.warn(
            "Pointer capture nije dostupan.",
            error
        );
    }
}

if (
    ENGINE.tilt &&
    ENGINE.tilt.containsPoint(
        POINTER.x,
        POINTER.y
    )
) {

    activateTilt();

    return;
}

let closestRabbit = null;

let closestDistanceSquared =
    Number.POSITIVE_INFINITY;

for (
    const rabbit
    of ENGINE.parents
) {

    if (
        rabbit.isCaptured
    ) {

        continue;
    }

    const hitRadius =
        rabbit.radius +
        CONFIG.pointerHitPadding;

    const currentDistanceSquared =
        distanceSquared(
            POINTER.x,
            POINTER.y,
            rabbit.x,
            rabbit.y
        );

    if (
        currentDistanceSquared <=
        hitRadius *
        hitRadius &&
        currentDistanceSquared <
        closestDistanceSquared
    ) {

        closestRabbit =
            rabbit;

        closestDistanceSquared =
            currentDistanceSquared;
    }
}

if (
    closestRabbit
) {

    closestRabbit.applyPointerImpulse(
        POINTER.x,
        POINTER.y
    );

    setStatus(
        `${closestRabbit.colorId}: ENERGIJA PRENETA`,
        "success",
        900
    );

    return;
}

createImpulseParticles(
    POINTER.x,
    POINTER.y,
    "#6f7d96",
    5
);
}

function handlePointerMove(event) {

if (
    !POINTER.active ||
    event.pointerId !==
    POINTER.pointerId
) {

    return;
}

updatePointerPosition(
    event
);
}

function handlePointerUp(event) {

if (
    event.pointerId !==
    POINTER.pointerId
) {

    return;
}

POINTER.active = false;

POINTER.pointerId = null;

if (
    canvas.releasePointerCapture
) {

    try {

        canvas.releasePointerCapture(
            event.pointerId
        );

    } catch (error) {

        console.warn(
            "Pointer release nije dostupan.",
            error
        );
    }
}
}

canvas.addEventListener(
    "pointerdown",
    handlePointerDown,
    {
        passive: false
    }
);

canvas.addEventListener(
    "pointermove",
    handlePointerMove,
    {
        passive: false
    }
);

canvas.addEventListener(
    "pointerup",
    handlePointerUp
);

canvas.addEventListener(
    "pointercancel",
    handlePointerUp
);

canvas.addEventListener(
    "contextmenu",
    event => {

    event.preventDefault();
}
);

/* ==========================================================
   GAME CONTROL
   ========================================================== */

async function startGame() {

resetWorld();

ENGINE.mode =
    "RUNNING";

ENGINE.lastTimestamp =
    performance.now();

ENGINE.accumulator = 0;
if (
    victoryKicker
) {

    victoryKicker.textContent =
        "EXPERIMENT COMPLETE";
}

if (
    victoryTitle
) {

    victoryTitle.textContent =
        "LABORATORIJA JE ZAVRŠENA";
}

restartButton.textContent =
    "↻ PONOVI EKSPERIMENT";

document.body.classList.remove(
    "game-won"
);

document.body.classList.add(
    "game-running"
);

startScreen.classList.remove(
    "is-visible"
);

victoryScreen.classList.remove(
    "is-visible"
);

victoryScreen.setAttribute(
    "aria-hidden",
    "true"
);

setStatus(
    "COLOR ENGINE ACTIVE",
    "success",
    1200
);

if (
    MUSIC.isEnabled
) {

    await MUSIC.start();
}
}

async function restartGame() {

await startGame();
}

async function toggleMusic() {

const nextEnabled =
    !MUSIC.isEnabled;

await MUSIC.setEnabled(
    nextEnabled
);

soundButton.setAttribute(
    "aria-pressed",
    String(
        nextEnabled
    )
);

soundLabel.textContent =
    nextEnabled
        ? "MUSIC ON"
        : "MUSIC OFF";

document.body.classList.toggle(
    "music-disabled",
    !nextEnabled
);

setStatus(
    nextEnabled
        ? "COLOR FLOW UKLJUČEN"
        : "COLOR FLOW ISKLJUČEN",
    nextEnabled
        ? "success"
        : "warning",
    1000
);
}

playButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    restartGame
);

soundButton.addEventListener(
    "click",
    toggleMusic
);

/* ==========================================================
   PHYSICS UPDATE
   ========================================================== */

function updatePhysics(delta) {

if (
    ENGINE.mode !==
    "RUNNING" &&
    ENGINE.mode !==
    "VICTORY_PENDING"
) {

    return;
}

ENGINE.simulationTime +=
    delta;

ENGINE.tiltCooldown =
    Math.max(
        0,
        ENGINE.tiltCooldown -
        delta
    );

for (
    const parent
    of ENGINE.parents
) {

    if (
        !parent.isCaptured
    ) {

        for (
            const voidReactor
            of ENGINE.voids
        ) {

            voidReactor.applyGravity(
                parent,
                delta
            );

            if (
                parent.isCaptured
            ) {

                break;
            }
        }
    }

    parent.update(
        delta
    );
}
resolveParentRabbitCollisions();

checkVoidLockoutGameOver();

for (
    const rabbit
    of ENGINE.combinedRabbits
) {

    rabbit.update(
        delta
    );
}

resolveCombinedRabbitCollisions();

updateOverlapEffects(
    delta
);
}

/* ==========================================================
   REAL-TIME UPDATE
   ========================================================== */

function updateRealTime(delta) {

ENGINE.realTime +=
    delta;

if (
    ENGINE.tilt
) {

    ENGINE.tilt.update(
        delta,
        ENGINE.realTime
    );
}

for (
    const voidReactor
    of ENGINE.voids
) {

    voidReactor.update(
        delta,
        ENGINE.realTime
    );
}

for (
    const particle
    of ENGINE.particles
) {

    particle.update(
        delta
    );
}

ENGINE.particles =
    ENGINE.particles.filter(
        particle =>
            particle.life > 0
    );

if (
    ENGINE.mode ===
    "VICTORY_PENDING"
) {

    ENGINE.victoryTimer -=
        delta;

    if (
        ENGINE.victoryTimer <= 0
    ) {

        showVictoryScreen();
    }
}

if (
    ENGINE.mode ===
    "GAME_OVER_PENDING"
) {

    ENGINE.gameOverTimer -=
        delta;

    if (
        ENGINE.gameOverTimer <= 0
    ) {

        showGameOverScreen();
    }
}

}
/* ==========================================================
   BACKGROUND RENDER
   ========================================================== */

function drawBackground(
    context,
    time
) {

const gradient =
    context.createRadialGradient(
        ENGINE.width * 0.5,
        ENGINE.height * 0.43,
        20,
        ENGINE.width * 0.5,
        ENGINE.height * 0.5,
        Math.max(
            ENGINE.width,
            ENGINE.height
        ) *
        0.72
    );

gradient.addColorStop(
    0,
    "#151d31"
);

gradient.addColorStop(
    0.42,
    "#080b15"
);

gradient.addColorStop(
    1,
    "#020308"
);

context.fillStyle =
    gradient;

context.fillRect(
    0,
    0,
    ENGINE.width,
    ENGINE.height
);

drawStars(
    context,
    time
);

drawGrid(
    context
);

drawVignette(
    context
);
}

function drawStars(
    context,
    time
) {

context.save();

for (
    const star
    of ENGINE.backgroundStars
) {

    const alpha =
        star.alpha *
        (
            0.55 +
            Math.sin(
                time *
                star.speed +
                star.phase
            ) *
            0.45
        );

    context.fillStyle =
        `rgba(200,225,255,${
            Math.max(
                0.02,
                alpha
            )
        })`;

    context.beginPath();

    context.arc(
        star.x,
        star.y,
        star.radius,
        0,
        Math.PI * 2
    );

    context.fill();
}

context.restore();
}

function drawGrid(context) {

const gridSize =
    ENGINE.width < 500
        ? 32
        : 42;

context.save();

context.strokeStyle =
    "rgba(255,255,255,0.022)";

context.lineWidth = 1;

context.beginPath();

for (
    let x = 0;
    x <= ENGINE.width;
    x += gridSize
) {

    context.moveTo(
        x,
        0
    );

    context.lineTo(
        x,
        ENGINE.height
    );
}

for (
    let y = 0;
    y <= ENGINE.height;
    y += gridSize
) {

    context.moveTo(
        0,
        y
    );

    context.lineTo(
        ENGINE.width,
        y
    );
}

context.stroke();

context.restore();
}

function drawVignette(context) {

const vignette =
    context.createRadialGradient(
        ENGINE.width * 0.5,
        ENGINE.height * 0.5,
        Math.min(
            ENGINE.width,
            ENGINE.height
        ) *
        0.18,
        ENGINE.width * 0.5,
        ENGINE.height * 0.5,
        Math.max(
            ENGINE.width,
            ENGINE.height
        ) *
        0.72
    );

vignette.addColorStop(
    0,
    "rgba(0,0,0,0)"
);

vignette.addColorStop(
    0.72,
    "rgba(0,0,0,0.18)"
);

vignette.addColorStop(
    1,
    "rgba(0,0,0,0.66)"
);

context.fillStyle =
    vignette;

context.fillRect(
    0,
    0,
    ENGINE.width,
    ENGINE.height
);
}

/* ==========================================================
   RENDER
   ========================================================== */

function render() {

ctx.setTransform(
    ENGINE.dpr,
    0,
    0,
    ENGINE.dpr,
    0,
    0
);

ctx.clearRect(
    0,
    0,
    ENGINE.width,
    ENGINE.height
);

drawBackground(
    ctx,
    ENGINE.realTime
);

for (
    const voidReactor
    of ENGINE.voids
) {

    voidReactor.draw(
        ctx,
        ENGINE.realTime
    );
}

for (
    const effect
    of ENGINE.overlapEffects
) {

    effect.draw(
        ctx,
        ENGINE.realTime
    );
}

if (
    ENGINE.tilt
) {

    ENGINE.tilt.draw(
        ctx,
        ENGINE.realTime
    );
}

for (
    const rabbit
    of ENGINE.combinedRabbits
) {

    rabbit.draw(
        ctx,
        ENGINE.realTime
    );
}

for (
    const parent
    of ENGINE.parents
) {

    parent.draw(
        ctx,
        ENGINE.realTime
    );
}

for (
    const particle
    of ENGINE.particles
) {

    particle.draw(
        ctx
    );
}

if (
    CONFIG.debug
) {

    drawDebug(
        ctx
    );
}
}

/* ==========================================================
   DEBUG
   ========================================================== */

function drawDebug(context) {

context.save();

context.fillStyle =
    "rgba(0,0,0,0.72)";

context.fillRect(
    8,
    72,
    180,
    104
);

context.fillStyle =
    "#ffffff";

context.font =
    "11px monospace";

context.textBaseline =
    "top";

const lines = [

    `MODE: ${ENGINE.mode}`,

    `PARENTS: ${ENGINE.parents.length}`,

    `COMBINED: ${ENGINE.combinedRabbits.length}`,

    `PARTICLES: ${ENGINE.particles.length}`,

    `Y: ${ENGINE.counts.YELLOW}`,

    `M: ${ENGINE.counts.MAGENTA}`,

    `C: ${ENGINE.counts.CYAN}`
];

lines.forEach(
    (
        line,
        index
    ) => {

        context.fillText(
            line,
            14,
            78 +
            index * 13
        );
    }
);

context.restore();
}

window.addEventListener(
    "keydown",
    event => {

    if (
        event.key.toLowerCase() ===
        "d"
    ) {

        CONFIG.debug =
            !CONFIG.debug;
    }
}
);

/* ==========================================================
   MAIN LOOP
   ========================================================== */

function gameLoop(timestamp) {

if (
    ENGINE.lastTimestamp === 0
) {

    ENGINE.lastTimestamp =
        timestamp;
}

const rawDelta =
    (
        timestamp -
        ENGINE.lastTimestamp
    ) /
    1000;

ENGINE.lastTimestamp =
    timestamp;

const realDelta =
    clamp(
        rawDelta,
        0,
        CONFIG.maxDelta
    );

updateRealTime(
    realDelta
);

if (
    ENGINE.mode ===
    "RUNNING" ||
    ENGINE.mode ===
    "VICTORY_PENDING"
) {

    ENGINE.accumulator +=
        realDelta *
        CONFIG.simulationSpeed;

    let subSteps = 0;

    while (
        ENGINE.accumulator >=
        CONFIG.physicsStep &&
        subSteps <
        CONFIG.maxSubSteps
    ) {

        updatePhysics(
            CONFIG.physicsStep
        );

        ENGINE.accumulator -=
            CONFIG.physicsStep;

        subSteps += 1;
    }

    if (
        subSteps >=
        CONFIG.maxSubSteps
    ) {

        ENGINE.accumulator = 0;
    }
}

render();

window.requestAnimationFrame(
    gameLoop
);
}

/* ==========================================================
   INITIALIZATION
   ========================================================== */

function initialize() {

validateRecipes();

resizeCanvas();

resetWorld();

ENGINE.mode =
    "STANDBY";

ENGINE.initialized = true;

ENGINE.lastTimestamp =
    performance.now();

setStatus(
    "LABORATORY STANDBY"
);

updateAllCounters(
    false
);

window.requestAnimationFrame(
    gameLoop
);
}

initialize();
