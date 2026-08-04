"use strict";

/**
 * ============================================================
 * WHR: POWER UP! VOID WORLD
 * VERSION: v6.2.0 FOUNDATION
 * ============================================================
 *
 * OVA VERZIJA SADRŽI SAMO:
 *
 * - 7 proceduralnih zečeva
 * - zajedničku fiziku
 * - gravitaciju
 * - sudare zečeva
 * - odbijanje od zidova
 * - centralni TILT bumper bez ušiju
 * - 4 VOID portala u uglovima
 * - teleportaciju između VOID portala
 * - squash / stretch reakciju
 * - Retina Canvas podršku
 * - touch i mouse podršku
 *
 * OVA VERZIJA NEMA:
 *
 * - score
 * - lives
 * - time
 * - level
 * - specijalne moći
 * - lasere
 * - bossove
 * - zvukove
 * - fliper ručice
 *
 * ============================================================
 */

/* ============================================================
   CONFIG
============================================================ */

const CONFIG = {
    gravity: 720,
    bounce: 0.84,

    portalDelay: 0.42,
    portalExitSpeed: 480,

    rabbitRadius: 27,
    tiltRadius: 58,

    maxSpeed: 860,

    wallPadding: 8,
    floorFriction: 0.997,
    airFriction: 0.999,

    rabbitCollisionBounce: 0.92,
    tiltBounce: 1.04,

    portalRadius: 42,
    portalInset: 48,

    maxDelta: 1 / 30,
    physicsStep: 1 / 120,
    maxSubSteps: 8,

    pointerImpulse: 430,

    devicePixelRatioLimit: 2,

    debug: false
};

/* ============================================================
   DOM
============================================================ */

const canvas = document.getElementById("rabbitStage");

if (!canvas) {
    throw new Error(
        'Canvas element sa id="rabbitStage" nije pronađen.'
    );
}

const ctx = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true
});

if (!ctx) {
    throw new Error("Canvas 2D context nije dostupan.");
}

const statusText = document.querySelector(".hud-status");
const controlsText = document.querySelector(".engine-controls p");

/* ============================================================
   GLOBAL ENGINE STATE
============================================================ */

const ENGINE = {
    width: 0,
    height: 0,
    dpr: 1,

    lastTimestamp: 0,
    accumulator: 0,

    elapsedTime: 0,

    running: true,
    initialized: false,

    rabbits: [],
    portals: [],
    tilt: null,

    nextRabbitId: 1
};

const POINTER = {
    x: 0,
    y: 0,
    active: false
};

/* ============================================================
   COLOR DEFINITIONS
============================================================ */

const RABBIT_DEFINITIONS = [
    {
        name: "WHITE",
        color: "#d8e4f2"
    },
    {
        name: "BLACK",
        color: "#252936"
    },
    {
        name: "BLUE",
        color: "#1677ff"
    },
    {
        name: "GOLD",
        color: "#ffbd22"
    },
    {
        name: "RED",
        color: "#ff334f"
    },
    {
        name: "GREEN",
        color: "#19d86f"
    },
    {
        name: "PURPLE",
        color: "#9b4dff"
    }
];

/* ============================================================
   BASIC UTILITIES
============================================================ */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return dx * dx + dy * dy;
}

function clampColor(value) {
    return clamp(Math.round(value), 0, 255);
}

function normalizeHex(hex) {
    let clean = String(hex).replace("#", "").trim();

    if (clean.length === 3) {
        clean = clean
            .split("")
            .map(character => character + character)
            .join
