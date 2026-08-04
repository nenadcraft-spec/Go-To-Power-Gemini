"use strict";

/**
 * =========================================================
 * WHR: MASTER RABBIT MATERIAL ENGINE v6.1.3
 * COMPATIBILITY FIX BUILD
 * =========================================================
 *
 * Popravke:
 * 1. Uklonjen ctx.roundRect() radi kompatibilnosti.
 * 2. Uklonjen ctx.filter radi kompatibilnosti.
 * 3. Retina rendering sa devicePixelRatio limitom.
 * 4. Stabilan delta-time.
 * 5. Touch-first eye tracking.
 * 6. Klik reaguje samo kada je zec pogođen.
 * 7. Pravac udara kontroliše tilt, recoil i uši.
 * 8. Mekana senka bez blur filtera.
 * 9. Popravljen RGB proračun.
 * 10. Prirodnija unutrašnja magla.
 * 11. Render error prikaz na ekranu.
 */

/* =========================================================
   DOM & CANVAS
========================================================= */

const canvas = document.getElementById("rabbitStage");

if (!canvas) {
    throw new Error('Canvas element sa id="rabbitStage" nije pronađen.');
}

const ctx = canvas.getContext("2d");

if (!ctx) {
    throw new Error("2D Canvas context nije dostupan.");
}

const controlsText = document.querySelector(".engine-controls p");
const statusText = document.querySelector(".hud-status");

/* =========================================================
   GLOBAL STATE
========================================================= */

let gameWidth = 0;
let gameHeight = 0;
let deviceScale = 1;
let lastTimestamp = 0;
let renderStopped = false;

const pointer = {
    x: 0,
    y: 0,
    active: false
};

/* =========================================================
   BASIC UTILITIES
========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function clampColor(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function adjustColor(hex, percent) {
    const cleanHex = String(hex).replace("#", "");
    const number = Number.parseInt(cleanHex, 16);

    if (!Number.isFinite(number)) {
        return "#ffffff";
    }

    const amount = Math.round(2.55 * percent);

    const red = clampColor((number >> 16) + amount);
    const green = clampColor(((number >> 8) & 0xff) + amount);
    const blue = clampColor((number & 0xff) + amount);

    return `#${[
        red.toString(16).padStart(2, "0"),
        green.toString(16).padStart(2, "0"),
        blue.toString(16).padStart(2, "0")
    ].join("")}`;
}

function hexToRgba(hex, alpha) {
    const cleanHex = String(hex).replace("#", "");
    const number = Number.parseInt(cleanHex, 16);

    if (!Number.isFinite(number)) {
        return `rgba(255, 255, 255, ${alpha})`;
    }

    const red = number >> 16;
    const green = (number >> 8) & 0xff;
    const blue = number & 0xff;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/* =========================================================
   COMPATIBLE ROUNDED RECT PATH
========================================================= */

function roundedRectPath(
    context,
    x,
    y,
    width,
    height,
    radius
) {
    const safeRadius = Math.min(
        Math.max(0, radius),
        Math.abs(width) / 2,
        Math.abs(height) / 2
    );

    context.beginPath();
    context.moveTo(x + safeRadius, y);

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

/* =========================================================
   RESIZE / RETINA
========================================================= */

function resizeCanvas() {
    const parent = canvas.parentElement;

    if (!parent) {
        throw new Error("Canvas nema parent element.");
    }

    const rect = parent.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
        return;
    }

    deviceScale = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    gameWidth = rect.width;
    gameHeight = rect.height;

    canvas.width = Math.max(
        1,
        Math.round(gameWidth * deviceScale)
    );

    canvas.height = Math.max(
        1,
        Math.round(gameHeight * deviceScale)
    );

    canvas.style.width = `${gameWidth}px`;
    canvas.style.height = `${gameHeight}px`;

    ctx.setTransform(
        deviceScale,
        0,
        0,
        deviceScale,
        0,
        0
    );

    pointer.x = gameWidth * 0.5;
    pointer.y = gameHeight * 0.3;

    masterRabbit.x = gameWidth * 0.5;
    masterRabbit.y = gameHeight * 0.48;
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("orientationchange", () => {
    window.setTimeout(resizeCanvas, 120);
});

/* =========================================================
   PROCEDURAL RABBIT
========================================================= */

class ProceduralRabbit {
    constructor(x, y, radius, baseColor) {
        this.x = x;
        this.y = y;

        this.baseRadius = radius;
        this.baseColor = baseColor;

        this.motionSeed = Math.random() * 100;

        this.breathe = 0;
        this.microVibe = 0;

        this.squashX = 1;
        this.squashY = 1;

        this.squ
