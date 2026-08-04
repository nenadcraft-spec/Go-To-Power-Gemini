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
            .join("");
    }

    return clean.padStart(6, "0").slice(0, 6);
}

function adjustColor(hex, percent) {
    const clean = normalizeHex(hex);
    const number = Number.parseInt(clean, 16);

    if (!Number.isFinite(number)) {
        return "#ffffff";
    }

    const amount = Math.round(2.55 * percent);

    const red = clampColor(
        ((number >> 16) & 0xff) + amount
    );

    const green = clampColor(
        ((number >> 8) & 0xff) + amount
    );

    const blue = clampColor(
        (number & 0xff) + amount
    );

    return (
        "#" +
        red.toString(16).padStart(2, "0") +
        green.toString(16).padStart(2, "0") +
        blue.toString(16).padStart(2, "0")
    );
}

function hexToRgba(hex, alpha) {
    const clean = normalizeHex(hex);
    const number = Number.parseInt(clean, 16);

    if (!Number.isFinite(number)) {
        return `rgba(255,255,255,${alpha})`;
    }

    const red = (number >> 16) & 0xff;
    const green = (number >> 8) & 0xff;
    const blue = number & 0xff;

    return `rgba(${red},${green},${blue},${alpha})`;
}

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

/* ============================================================
   VECTOR HELPERS
============================================================ */

function normalizeVector(x, y) {
    const length = Math.hypot(x, y);

    if (length < 0.0001) {
        return {
            x: 1,
            y: 0,
            length: 0
        };
    }

    return {
        x: x / length,
        y: y / length,
        length
    };
}

function limitVelocity(body, maxSpeed) {
    const speedSquared =
        body.vx * body.vx +
        body.vy * body.vy;

    const maxSquared =
        maxSpeed * maxSpeed;

    if (speedSquared <= maxSquared) {
        return;
    }

    const speed = Math.sqrt(speedSquared);
    const scale = maxSpeed / speed;

    body.vx *= scale;
    body.vy *= scale;
}

/* ============================================================
   CANVAS / RETINA
============================================================ */

function resizeCanvas() {
    const wrapper = canvas.parentElement;

    if (!wrapper) {
        return;
    }

    const rect = wrapper.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
        return;
    }

    ENGINE.width = rect.width;
    ENGINE.height = rect.height;

    ENGINE.dpr = Math.min(
        window.devicePixelRatio || 1,
        CONFIG.devicePixelRatioLimit
    );

    canvas.width = Math.max(
        1,
        Math.round(ENGINE.width * ENGINE.dpr)
    );

    canvas.height = Math.max(
        1,
        Math.round(ENGINE.height * ENGINE.dpr)
    );

    canvas.style.width = `${ENGINE.width}px`;
    canvas.style.height = `${ENGINE.height}px`;

    ctx.setTransform(
        ENGINE.dpr,
        0,
        0,
        ENGINE.dpr,
        0,
        0
    );

    updateWorldLayout();

    POINTER.x = ENGINE.width * 0.5;
    POINTER.y = ENGINE.height * 0.5;
}

function updateWorldLayout() {
    if (!ENGINE.initialized) {
        return;
    }

    createPortals();

    ENGINE.tilt.x = ENGINE.width * 0.5;
    ENGINE.tilt.y = ENGINE.height * 0.5;

    keepRabbitsInsideWorld();
}

function keepRabbitsInsideWorld() {
    for (const rabbit of ENGINE.rabbits) {
        rabbit.x = clamp(
            rabbit.x,
            rabbit.radius,
            ENGINE.width - rabbit.radius
        );

        rabbit.y = clamp(
            rabbit.y,
            rabbit.radius,
            ENGINE.height - rabbit.radius
        );
    }
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("orientationchange", () => {
    window.setTimeout(resizeCanvas, 120);
});

/* ============================================================
   VOID PORTAL
============================================================ */

class VoidPortal {
    constructor(index, x, y, radius, rotationDirection) {
        this.index = index;

        this.x = x;
        this.y = y;
        this.radius = radius;

        this.rotationDirection = rotationDirection;
        this.phase = Math.random() * Math.PI * 2;
    }

    containsRabbit(rabbit) {
        const captureRadius =
            this.radius * 0.62;

        const combined =
            captureRadius +
            rabbit.radius * 0.28;

        return (
            distanceSquared(
                this.x,
                this.y,
                rabbit.x,
                rabbit.y
            ) <= combined * combined
        );
    }

    draw(context, timeSeconds) {
        const pulse =
            Math.sin(
                timeSeconds * 2.7 +
                this.phase
            ) * 3;

        const outerRadius =
            this.radius + pulse;

        context.save();

        context.translate(
            this.x,
            this.y
        );

        const glow =
            context.createRadialGradient(
                0,
                0,
                this.radius * 0.18,
                0,
                0,
                outerRadius * 1.38
            );

        glow.addColorStop(
            0,
            "rgba(0,0,0,1)"
        );

        glow.addColorStop(
            0.35,
            "rgba(31,8,65,0.96)"
        );

        glow.addColorStop(
            0.64,
            "rgba(126,34,206,0.40)"
        );

        glow.addColorStop(
            0.82,
            "rgba(6,182,212,0.17)"
        );

        glow.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        context.fillStyle = glow;

        context.beginPath();

        context.arc(
            0,
            0,
            outerRadius * 1.38,
            0,
            Math.PI * 2
        );

        context.fill();

        context.save();

        context.rotate(
            timeSeconds *
            0.7 *
            this.rotationDirection
        );

        for (let ring = 0; ring < 4; ring += 1) {
            const ringRadius =
                this.radius *
                (0.45 + ring * 0.15);

            context.strokeStyle =
                ring % 2 === 0
                    ? `rgba(155,77,255,${0.38 - ring * 0.055})`
                    : `rgba(6,182,212,${0.30 - ring * 0.045})`;

            context.lineWidth =
                Math.max(1, 3 - ring * 0.45);

            context.setLineDash([
                7 + ring * 2,
                9 + ring * 3
            ]);

            context.lineDashOffset =
                timeSeconds *
                24 *
                this.rotationDirection *
                (ring + 1);

            context.beginPath();

            context.arc(
                0,
                0,
                ringRadius,
                ring * 0.35,
                Math.PI * 1.4 +
                    ring * 0.4
            );

            context.stroke();
        }

        context.restore();

        context.setLineDash([]);

        const core =
            context.createRadialGradient(
                -this.radius * 0.12,
                -this.radius * 0.15,
                0,
                0,
                0,
                this.radius * 0.68
            );

        core.addColorStop(
            0,
            "rgba(89,28,135,0.34)"
        );

        core.addColorStop(
            0.28,
            "rgba(20,4,39,0.92)"
        );

        core.addColorStop(
            0.7,
            "rgba(1,0,5,1)"
        );

        core.addColorStop(
            1,
            "rgba(0,0,0,1)"
        );

        context.fillStyle = core;

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.62,
            0,
            Math.PI * 2
        );

        context.fill();

        context.strokeStyle =
            "rgba(183,104,255,0.55)";

        context.lineWidth = 1.5;

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.68,
            0,
            Math.PI * 2
        );

        context.stroke();

        context.restore();
    }
}

/* ============================================================
   CENTRAL TILT BUMPER
============================================================ */

class TiltBumper {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.baseColor = "#d7e4f2";

        this.pulse = 0;
        this.hitEnergy = 0;
        this.rotation = 0;
    }

    registerHit(impactSpeed) {
        this.hitEnergy = clamp(
            this.hitEnergy +
                impactSpeed / 700,
            0,
            1
        );
    }

    update(delta, timeSeconds) {
        this.hitEnergy = Math.max(
            0,
            this.hitEnergy - delta * 2.8
        );

        this.pulse =
            Math.sin(timeSeconds * 2.2) *
            1.8 +
            this.hitEnergy * 5;

        this.rotation +=
            delta *
            (0.12 + this.hitEnergy * 0.5);
    }

    draw(context, timeSeconds) {
        const radius =
            this.radius +
            this.pulse;

        const lightColor =
            adjustColor(
                this.baseColor,
                26
            );

        const shadowColor =
            adjustColor(
                this.baseColor,
                -58
            );

        context.save();

        context.translate(
            this.x,
            this.y
        );

        this.drawShadow(
            context,
            radius
        );

        const aura =
            context.createRadialGradient(
                0,
                0,
                radius * 0.45,
                0,
                0,
                radius * 1.5
            );

        aura.addColorStop(
            0,
            `rgba(6,182,212,${
                0.12 +
                this.hitEnergy * 0.16
            })`
        );

        aura.addColorStop(
            0.6,
            `rgba(155,77,255,${
                0.06 +
                this.hitEnergy * 0.08
            })`
        );

        aura.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        context.fillStyle = aura;

        context.beginPath();

        context.arc(
            0,
            0,
            radius * 1.5,
            0,
            Math.PI * 2
        );

        context.fill();

        const body =
            context.createRadialGradient(
                -radius * 0.35,
                -radius * 0.38,
                radius * 0.04,
                0,
                radius * 0.1,
                radius * 1.05
            );

        body.addColorStop(
            0,
            "#ffffff"
        );

        body.addColorStop(
            0.2,
            lightColor
        );

        body.addColorStop(
            0.62,
            this.baseColor
        );

        body.addColorStop(
            1,
            shadowColor
        );

        context.fillStyle = body;

        context.shadowColor =
            this.hitEnergy > 0.05
                ? "#ec4899"
                : "#06b6d4";

        context.shadowBlur =
            16 +
            this.hitEnergy * 20;

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

        const rim =
            context.createLinearGradient(
                -radius,
                -radius,
                radius,
                radius
            );

        rim.addColorStop(
            0,
            "rgba(255,255,255,0.95)"
        );

        rim.addColorStop(
            0.3,
            "rgba(6,182,212,0.74)"
        );

        rim.addColorStop(
            0.72,
            "rgba(155,77,255,0.31)"
        );

        rim.addColorStop(
            1,
            "rgba(0,0,0,0.78)"
        );

        context.strokeStyle = rim;
        context.lineWidth = 3;

        context.beginPath();

        context.arc(
            0,
            0,
            radius,
            0,
            Math.PI * 2
        );

        context.stroke();

        this.drawInnerFog(
            context,
            radius,
            timeSeconds
        );

        this.drawVisor(
            context,
            radius
        );

        this.drawGlass(
            context,
            radius
        );

        this.drawTiltRing(
            context,
            radius,
            timeSeconds
        );

        context.restore();
    }

    drawShadow(context, radius) {
        context.save();

        context.fillStyle =
            "rgba(0,0,0,0.36)";

        context.beginPath();

        context.ellipse(
            0,
            radius * 1.02,
            radius * 0.88,
            radius * 0.25,
            0,
            0,
            Math.PI * 2
        );

        context.fill();

        context.restore();
    }

    drawInnerFog(
        context,
        radius,
        timeSeconds
    ) {
        context.save();

        context.beginPath();

        context.arc(
            0,
            0,
            radius * 0.78,
            0,
            Math.PI * 2
        );

        context.clip();

        context.globalCompositeOperation =
            "screen";

        for (let index = 0; index < 4; index += 1) {
            const angle =
                timeSeconds *
                    (0.35 + index * 0.08) *
                    (index % 2 === 0 ? 1 : -1) +
                index * 1.7;

            const x =
                Math.cos(angle) *
                radius *
                (0.18 + index * 0.045);

            const y =
                Math.sin(angle * 1.2) *
                radius *
                0.22;

            const size =
                radius *
                (0.27 + index * 0.025);

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
                index % 2 === 0
                    ? "rgba(255,255,255,0.19)"
                    : "rgba(6,182,212,0.19)"
            );

            fog.addColorStop(
                0.5,
                "rgba(155,77,255,0.10)"
            );

            fog.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            context.fillStyle = fog;

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

    drawVisor(context, radius) {
        context.save();

        context.fillStyle =
            "rgba(3,12,18,0.95)";

        roundedRectPath(
            context,
            -radius * 0.45,
            -radius * 0.17,
            radius * 0.9,
            radius * 0.25,
            7
        );

        context.fill();

        context.strokeStyle =
            "rgba(255,255,255,0.19)";

        context.lineWidth = 1;
        context.stroke();

        const eye =
            context.createLinearGradient(
                -radius * 0.34,
                0,
                radius * 0.34,
                0
            );

        eye.addColorStop(
            0,
            "rgba(6,182,212,0)"
        );

        eye.addColorStop(
            0.2,
            "#06b6d4"
        );

        eye.addColorStop(
            0.5,
            "#e6ffff"
        );

        eye.addColorStop(
            0.8,
            "#06b6d4"
        );

        eye.addColorStop(
            1,
            "rgba(6,182,212,0)"
        );

        context.fillStyle = eye;

        context.shadowColor =
            "#06b6d4";

        context.shadowBlur =
            12 +
            this.hitEnergy * 10;

        context.fillRect(
            -radius * 0.34,
            -radius * 0.09,
            radius * 0.68,
            radius * 0.075
        );

        context.shadowBlur = 0;

        context.restore();
    }

    drawGlass(context, radius) {
        const glass =
            context.createLinearGradient(
                -radius,
                -radius,
                radius,
                radius
            );

        glass.addColorStop(
            0,
            "rgba(255,255,255,0.45)"
        );

        glass.addColorStop(
            0.22,
            "rgba(255,255,255,0.09)"
        );

        glass.addColorStop(
            0.55,
            "rgba(255,255,255,0.01)"
        );

        glass.addColorStop(
            0.88,
            "rgba(6,182,212,0.13)"
        );

        glass.addColorStop(
            1,
            "rgba(0,0,0,0.22)"
        );

        context.fillStyle = glass;

        context.beginPath();

        context.arc(
            0,
            0,
            radius * 0.94,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    drawTiltRing(
        context,
        radius,
        timeSeconds
    ) {
        context.save();

        context.rotate(
            this.rotation
        );

        context.strokeStyle =
            `rgba(236,72,153,${
                0.3 +
                this.hitEnergy * 0.4
            })`;

        context.lineWidth =
            2 +
            this.hitEnergy * 2;

        context.setLineDash([
            12,
            9
        ]);

        context.lineDashOffset =
            -timeSeconds * 20;

        context.beginPath();

        context.arc(
            0,
            0,
            radius * 1.13,
            0,
            Math.PI * 2
        );

        context.stroke();

        context.setLineDash([]);
        context.restore();
    }
}

/* ============================================================
   PHYSICS RABBIT
============================================================ */

class Rabbit {
    constructor(options) {
        this.id = ENGINE.nextRabbitId;
        ENGINE.nextRabbitId += 1;

        this.name = options.name;
        this.baseColor = options.color;

        this.x = options.x;
        this.y = options.y;

        this.previousX = this.x;
        this.previousY = this.y;

        this.vx = options.vx;
        this.vy = options.vy;

        this.radius = options.radius;
        this.mass = this.radius * this.radius;

        this.rotation = randomRange(
            -0.15,
            0.15
        );

        this.angularVelocity = randomRange(
            -0.7,
            0.7
        );

        this.squashX = 1;
        this.squashY = 1;

        this.squashVelocityX = 0;
        this.squashVelocityY = 0;

        this.impactEnergy = 0;

        this.portalCooldown = 0;
        this.portalLockIndex = -1;

        this.teleportAlpha = 1;
        this.teleportScale = 1;

        this.motionSeed =
            Math.random() * 100;

        this.fogPhase =
            Math.random() *
            Math.PI *
            2;
    }

    applyForce(x, y) {
        this.vx += x;
        this.vy += y;
    }

    registerImpact(
        normalX,
        normalY,
        impactSpeed
    ) {
        const strength = clamp(
            impactSpeed / 720,
            0,
            1
        );

        this.impactEnergy = Math.max(
            this.impactEnergy,
            strength
        );

        const horizontal =
            Math.abs(normalX);

        const vertical =
            Math.abs(normalY);

        this.squashVelocityX +=
            vertical * strength * 0.23 -
            horizontal * strength * 0.15;

        this.squashVelocityY +=
            horizontal * strength * 0.23 -
            vertical * strength * 0.15;

        this.angularVelocity +=
            normalX *
            strength *
            randomRange(-2.2, 2.2);
    }

    updatePhysics(delta) {
        this.previousX = this.x;
        this.previousY = this.y;

        this.portalCooldown = Math.max(
            0,
            this.portalCooldown - delta
        );

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
            CONFIG.maxSpeed
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
                0.985,
                delta * 60
            );
    }

    updateAnimation(delta) {
        const spring = 92;
        const damping = Math.pow(
            0.72,
            delta * 60
        );

        this.squashVelocityX +=
            (1 - this.squashX) *
            spring *
            delta;

        this.squashVelocityY +=
            (1 - this.squashY) *
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

        this.squashX = clamp(
            this.squashX,
            0.72,
            1.34
        );

        this.squashY = clamp(
            this.squashY,
            0.72,
            1.34
        );

        this.impactEnergy = Math.max(
            0,
            this.impactEnergy -
                delta * 2.4
        );

        const targetAlpha =
            this.portalCooldown >
                CONFIG.portalDelay * 0.72
                ? 0.78
                : 1;

        const targetScale =
            this.portalCooldown >
                CONFIG.portalDelay * 0.72
                ? 0.82
                : 1;

        const smoothing =
            1 -
            Math.exp(-delta * 12);

        this.teleportAlpha = lerp(
            this.teleportAlpha,
            targetAlpha,
            smoothing
        );

        this.teleportScale = lerp(
            this.teleportScale,
            targetScale,
            smoothing
        );
    }

    draw(context, timeSeconds) {
        const speed =
            Math.hypot(
                this.vx,
                this.vy
            );

        const speedStretch =
            clamp(
                speed /
                    CONFIG.maxSpeed,
                0,
                1
            );

        let velocityAngle =
            Math.atan2(
                this.vy,
                this.vx
            );

        if (speed < 25) {
            velocityAngle =
                this.rotation;
        }

        const motionStretch =
            1 +
            speedStretch * 0.1;

        const motionSquash =
            1 -
            speedStretch * 0.055;

        context.save();

        context.globalAlpha =
            this.teleportAlpha;

        context.translate(
            this.x,
            this.y
        );

        context.rotate(
            velocityAngle
        );

        context.scale(
            this.squashX *
                motionStretch *
                this.teleportScale,
            this.squashY *
                motionSquash *
                this.teleportScale
        );

        this.drawAura(
            context,
            timeSeconds
        );

        this.drawShadow(
            context,
            velocityAngle
        );

        this.drawBody(
            context
        );

        this.drawInnerFog(
            context,
            timeSeconds
        );

        this.drawVisor(
            context
        );

        this.drawGlass(
            context
        );

        this.drawHighlight(
            context,
            timeSeconds
        );

        context.restore();

        if (CONFIG.debug) {
            this.drawDebug(context);
        }
    }

    drawAura(
        context,
        timeSeconds
    ) {
        const pulse =
            Math.sin(
                timeSeconds * 3 +
                this.motionSeed
            ) * 2;

        const auraRadius =
            this.radius +
            12 +
            pulse +
            this.impactEnergy * 8;

        const aura =
            context.createRadialGradient(
                0,
                0,
                this.radius * 0.4,
                0,
                0,
                auraRadius
            );

        aura.addColorStop(
            0,
            hexToRgba(
                this.baseColor,
                0.16 +
                    this.impactEnergy *
                    0.1
            )
        );

        aura.addColorStop(
            0.6,
            hexToRgba(
                this.baseColor,
                0.07
            )
        );

        aura.addColorStop(
            1,
            hexToRgba(
                this.baseColor,
                0
            )
        );

        context.fillStyle = aura;

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
        context.save();

        context.rotate(
            -Math.atan2(
                this.vy,
                this.vx
            )
        );

        context.fillStyle =
            "rgba(0,0,0,0.25)";

        context.beginPath();

        context.ellipse(
            4,
            this.radius * 0.82,
            this.radius * 0.88,
            this.radius * 0.28,
            0,
            0,
            Math.PI * 2
        );

        context.fill();

        context.restore();
    }

    drawBody(context) {
        const lightColor =
            adjustColor(
                this.baseColor,
                34
            );

        const middleColor =
            adjustColor(
                this.baseColor,
                8
            );

        const shadowColor =
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
                this.radius * 1.08
            );

        gradient.addColorStop(
            0,
            "#ffffff"
        );

        gradient.addColorStop(
            0.21,
            lightColor
        );

        gradient.addColorStop(
            0.62,
            middleColor
        );

        gradient.addColorStop(
            1,
            shadowColor
        );

        context.fillStyle = gradient;

        context.shadowColor =
            this.impactEnergy > 0.08
                ? "#ec4899"
                : this.baseColor;

        context.shadowBlur =
            8 +
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

        const rim =
            context.createLinearGradient(
                -this.radius,
                -this.radius,
                this.radius,
                this.radius
            );

        rim.addColorStop(
            0,
            "rgba(255,255,255,0.84)"
        );

        rim.addColorStop(
            0.28,
            hexToRgba(
                adjustColor(
                    this.baseColor,
                    28
                ),
                0.72
            )
        );

        rim.addColorStop(
            0.75,
            "rgba(255,255,255,0.13)"
        );

        rim.addColorStop(
            1,
            "rgba(0,0,0,0.72)"
        );

        context.strokeStyle = rim;
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

    drawInnerFog(
        context,
        timeSeconds
    ) {
        context.save();

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.75,
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
            const angle =
                timeSeconds *
                    (0.55 +
                        index * 0.13) *
                    (index % 2 === 0
                        ? 1
                        : -1) +
                this.fogPhase +
                index * 2.1;

            const x =
                Math.cos(angle) *
                this.radius *
                (0.14 +
                    index * 0.07);

            const y =
                Math.sin(angle * 1.3) *
                this.radius *
                0.17;

            const size =
                this.radius *
                (0.25 +
                    index * 0.035);

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
                    ? "rgba(6,182,212,0.24)"
                    : "rgba(255,255,255,0.21)"
            );

            fog.addColorStop(
                0.5,
                hexToRgba(
                    this.baseColor,
                    0.14
                )
            );

            fog.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            context.fillStyle = fog;

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

    drawVisor(context) {
        context.save();

        context.fillStyle =
            "rgba(3,13,20,0.94)";

        roundedRectPath(
            context,
            -this.radius * 0.44,
            -this.radius * 0.16,
            this.radius * 0.88,
            this.radius * 0.24,
            5
        );

        context.fill();

        context.strokeStyle =
            "rgba(255,255,255,0.18)";

        context.lineWidth = 1;
        context.stroke();

        const eye =
            context.createLinearGradient(
                -this.radius * 0.34,
                0,
                this.radius * 0.34,
                0
            );

        eye.addColorStop(
            0,
            "rgba(6,182,212,0)"
        );

        eye.addColorStop(
            0.2,
            "#06b6d4"
        );

        eye.addColorStop(
            0.5,
            "#eaffff"
        );

        eye.addColorStop(
            0.8,
            "#06b6d4"
        );

        eye.addColorStop(
            1,
            "rgba(6,182,212,0)"
        );

        context.fillStyle = eye;

        context.shadowColor =
            "#06b6d4";

        context.shadowBlur =
            7 +
            this.impactEnergy * 9;

        context.fillRect(
            -this.radius * 0.33,
            -this.radius * 0.085,
            this.radius * 0.66,
            this.radius * 0.07
        );

        context.shadowBlur = 0;

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
            "rgba(255,255,255,0.42)"
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
            0.88,
            "rgba(6,182,212,0.12)"
        );

        glass.addColorStop(
            1,
            "rgba(0,0,0,0.22)"
        );

        context.fillStyle = glass;

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
        timeSeconds
    ) {
        const offset =
            Math.sin(
                timeSeconds * 1.4 +
                this.motionSeed
            ) *
            this.radius *
            0.08;

        const highlight =
            context.createRadialGradient(
                -this.radius * 0.32 +
                    offset,
                -this.radius * 0.4,
                0,
                -this.radius * 0.32 +
                    offset,
                -this.radius * 0.4,
                this.radius * 0.45
            );

        highlight.addColorStop(
            0,
            "rgba(255,255,255,0.48)"
        );

        highlight.addColorStop(
            0.3,
            "rgba(255,255,255,0.13)"
        );

        highlight.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        context.fillStyle = highlight;

        context.beginPath();

        context.ellipse(
            -this.radius * 0.28 +
                offset,
            -this.radius * 0.39,
            this.radius * 0.31,
            this.radius * 0.13,
            -0.4,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    drawDebug(context) {
        context.save();

        context.strokeStyle =
            "rgba(255,255,255,0.45)";

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

        context.strokeStyle =
            "#ff3d64";

        context.beginPath();

        context.moveTo(
            this.x,
            this.y
        );

        context.lineTo(
            this.x + this.vx * 0.08,
            this.y + this.vy * 0.08
        );

        context.stroke();

        context.restore();
    }
}

/* ============================================================
   WORLD CREATION
============================================================ */

function createPortals() {
    const radius = Math.min(
        CONFIG.portalRadius,
        Math.max(
            30,
            ENGINE.width * 0.1
        )
    );

    const inset = Math.max(
        radius + 7,
        Math.min(
            CONFIG.portalInset,
            ENGINE.width * 0.13
        )
    );

    ENGINE.portals = [
        new VoidPortal(
            0,
            inset,
            inset,
            radius,
            1
        ),

        new VoidPortal(
            1,
            ENGINE.width - inset,
            inset,
            radius,
            -1
        ),

        new VoidPortal(
            2,
            ENGINE.width - inset,
            ENGINE.height - inset,
            radius,
            1
        ),

        new VoidPortal(
            3,
            inset,
            ENGINE.height - inset,
            radius,
            -1
        )
    ];
}

function createTilt() {
    const responsiveRadius = clamp(
        ENGINE.width * 0.145,
        46,
        CONFIG.tiltRadius
    );

    ENGINE.tilt = new TiltBumper(
        ENGINE.width * 0.5,
        ENGINE.height * 0.5,
        responsiveRadius
    );
}

function createRabbits() {
    ENGINE.rabbits.length = 0;

    const radius = clamp(
        ENGINE.width * 0.067,
        21,
        CONFIG.rabbitRadius
    );

    const positions = [
        {
            x: 0.30,
            y: 0.19
        },
        {
            x: 0.50,
            y: 0.15
        },
        {
            x: 0.70,
            y: 0.21
        },
        {
            x: 0.25,
            y: 0.39
        },
        {
            x: 0.75,
            y: 0.39
        },
        {
            x: 0.35,
            y: 0.68
        },
        {
            x: 0.65,
            y: 0.70
        }
    ];

    for (
        let index = 0;
        index < RABBIT_DEFINITIONS.length;
        index += 1
    ) {
        const definition =
            RABBIT_DEFINITIONS[index];

        const position =
            positions[index];

        const direction =
            index % 2 === 0
                ? 1
                : -1;

        const rabbit = new Rabbit({
            name: definition.name,
            color: definition.color,

            x:
                ENGINE.width *
                position.x,

            y:
                ENGINE.height *
                position.y,

            vx:
                randomRange(
                    90,
                    210
                ) *
                direction,

            vy:
                randomRange(
                    -170,
                    60
                ),

            radius
        });

        ENGINE.rabbits.push(
            rabbit
        );
    }
}

/* ============================================================
   WALL COLLISIONS
============================================================ */

function resolveWallCollisions(rabbit) {
    const left =
        CONFIG.wallPadding +
        rabbit.radius;

    const right =
        ENGINE.width -
        CONFIG.wallPadding -
        rabbit.radius;

    const top =
        CONFIG.wallPadding +
        rabbit.radius;

    const bottom =
        ENGINE.height -
        CONFIG.wallPadding -
        rabbit.radius;

    if (rabbit.x < left) {
        rabbit.x = left;

        if (rabbit.vx < 0) {
            const impact =
                Math.abs(rabbit.vx);

            rabbit.vx =
                -rabbit.vx *
                CONFIG.bounce;

            rabbit.registerImpact(
                1,
                0,
                impact
            );
        }
    }

    if (rabbit.x > right) {
        rabbit.x = right;

        if (rabbit.vx > 0) {
            const impact =
                Math.abs(rabbit.vx);

            rabbit.vx =
                -rabbit.vx *
                CONFIG.bounce;

            rabbit.registerImpact(
                -1,
                0,
                impact
            );
        }
    }

    if (rabbit.y < top) {
        rabbit.y = top;

        if (rabbit.vy < 0) {
            const impact =
                Math.abs(rabbit.vy);

            rabbit.vy =
                -rabbit.vy *
                CONFIG.bounce;

            rabbit.registerImpact(
                0,
                1,
                impact
            );
        }
    }

    if (rabbit.y > bottom) {
        rabbit.y = bottom;

        if (rabbit.vy > 0) {
            const impact =
                Math.abs(rabbit.vy);

            rabbit.vy =
                -rabbit.vy *
                CONFIG.bounce;

            rabbit.vx *=
                CONFIG.floorFriction;

            rabbit.registerImpact(
                0,
                -1,
                impact
            );
        }
    }
}

/* ============================================================
   TILT COLLISION
============================================================ */

function resolveTiltCollision(rabbit) {
    const tilt = ENGINE.tilt;

    const dx =
        rabbit.x - tilt.x;

    const dy =
        rabbit.y - tilt.y;

    const minimumDistance =
        rabbit.radius +
        tilt.radius;

    const distanceSq =
        dx * dx +
        dy * dy;

    if (
        distanceSq >=
        minimumDistance *
            minimumDistance
    ) {
        return;
    }

    const normal =
        normalizeVector(dx, dy);

    const overlap =
        minimumDistance -
        normal.length;

    rabbit.x +=
        normal.x *
        overlap;

    rabbit.y +=
        normal.y *
        overlap;

    const velocityAlongNormal =
        rabbit.vx * normal.x +
        rabbit.vy * normal.y;

    if (velocityAlongNormal >= 0) {
        return;
    }

    const impactSpeed =
        Math.abs(
            velocityAlongNormal
        );

    const impulse =
        -(1 + CONFIG.tiltBounce) *
        velocityAlongNormal;

    rabbit.vx +=
        normal.x *
        impulse;

    rabbit.vy +=
        normal.y *
        impulse;

    const minimumExitSpeed =
        260;

    const currentSpeed =
        Math.hypot(
            rabbit.vx,
            rabbit.vy
        );

    if (
        currentSpeed <
        minimumExitSpeed
    ) {
        rabbit.vx +=
            normal.x *
            (
                minimumExitSpeed -
                currentSpeed
            );

        rabbit.vy +=
            normal.y *
            (
                minimumExitSpeed -
                currentSpeed
            );
    }

    rabbit.registerImpact(
        normal.x,
        normal.y,
        impactSpeed
    );

    tilt.registerHit(
        impactSpeed
    );

    limitVelocity(
        rabbit,
        CONFIG.maxSpeed
    );
}

/* ============================================================
   RABBIT TO RABBIT COLLISIONS
============================================================ */

function resolveRabbitPair(
    first,
    second
) {
    const dx =
        second.x - first.x;

    const dy =
        second.y - first.y;

    const minimumDistance =
        first.radius +
        second.radius;

    const distanceSq =
        dx * dx +
        dy * dy;

    if (
        distanceSq >=
        minimumDistance *
            minimumDistance
    ) {
        return;
    }

    let normalX;
    let normalY;
    let distance;

    if (distanceSq < 0.0001) {
        const angle =
            Math.random() *
            Math.PI *
            2;

        normalX =
            Math.cos(angle);

        normalY =
            Math.sin(angle);

        distance = 0;
    } else {
        distance =
            Math.sqrt(distanceSq);

        normalX =
            dx / distance;

        normalY =
            dy / distance;
    }

    const overlap =
        minimumDistance -
        distance;

    const totalMass =
        first.mass +
        second.mass;

    const firstRatio =
        second.mass /
        totalMass;

    const secondRatio =
        first.mass /
        totalMass;

    first.x -=
        normalX *
        overlap *
        firstRatio;

    first.y -=
        normalY *
        overlap *
        firstRatio;

    second.x +=
        normalX *
        overlap *
        secondRatio;

    second.y +=
        normalY *
        overlap *
        secondRatio;

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

    if (velocityAlongNormal > 0) {
        return;
    }

    const restitution =
        CONFIG.rabbitCollisionBounce;

    const impulseMagnitude =
        -(
            1 +
            restitution
        ) *
        velocityAlongNormal /
        (
            1 / first.mass +
            1 / second.mass
        );

    const impulseX =
        impulseMagnitude *
        normalX;

    const impulseY =
        impulseMagnitude *
        normalY;

    first.vx -=
        impulseX /
        first.mass;

    first.vy -=
        impulseY /
        first.mass;

    second.vx +=
        impulseX /
        second.mass;

    second.vy +=
        impulseY /
        second.mass;

    const impactSpeed =
        Math.abs(
            velocityAlongNormal
        );

    first.registerImpact(
        -normalX,
        -normalY,
        impactSpeed
    );

    second.registerImpact(
        normalX,
        normalY,
        impactSpeed
    );

    limitVelocity(
        first,
        CONFIG.maxSpeed
    );

    limitVelocity(
        second,
        CONFIG.maxSpeed
    );
}

function resolveAllRabbitCollisions() {
    const rabbits =
        ENGINE.rabbits;

    for (
        let firstIndex = 0;
        firstIndex <
        rabbits.length - 1;
        firstIndex += 1
    ) {
        for (
            let secondIndex =
                firstIndex + 1;
            secondIndex <
            rabbits.length;
            secondIndex += 1
        ) {
            resolveRabbitPair(
                rabbits[firstIndex],
                rabbits[secondIndex]
            );
        }
    }
}

/* ============================================================
   VOID TELEPORTATION
============================================================ */

function chooseExitPortal(entryPortal) {
    const possiblePortals =
        ENGINE.portals.filter(
            portal =>
                portal.index !==
                entryPortal.index
        );

    if (
        possiblePortals.length === 0
    ) {
        return entryPortal;
    }

    const randomIndex =
        Math.floor(
            Math.random() *
            possiblePortals.length
        );

    return possiblePortals[
        randomIndex
    ];
}

function getPortalExitDirection(
    portal
) {
    const centerX =
        ENGINE.width * 0.5;

    const centerY =
        ENGINE.height * 0.5;

    const direction =
        normalizeVector(
            centerX - portal.x,
            centerY - portal.y
        );

    const randomAngle =
        randomRange(
            -0.32,
            0.32
        );

    const cosine =
        Math.cos(randomAngle);

    const sine =
        Math.sin(randomAngle);

    return {
        x:
            direction.x *
                cosine -
            direction.y *
                sine,

        y:
            direction.x *
                sine +
            direction.y *
                cosine
    };
}

function teleportRabbit(
    rabbit,
    entryPortal
) {
    const exitPortal =
        chooseExitPortal(
            entryPortal
        );

    const exitDirection =
        getPortalExitDirection(
            exitPortal
        );

    const exitDistance =
        exitPortal.radius +
        rabbit.radius +
        10;

    rabbit.x =
        exitPortal.x +
        exitDirection.x *
        exitDistance;

    rabbit.y =
        exitPortal.y +
        exitDirection.y *
        exitDistance;

    const retainedSpeed =
        Math.hypot(
            rabbit.vx,
            rabbit.vy
        ) * 0.34;

    const exitSpeed =
        Math.max(
            CONFIG.portalExitSpeed,
            retainedSpeed
        );

    rabbit.vx =
        exitDirection.x *
            exitSpeed +
        randomRange(
            -65,
            65
        );

    rabbit.vy =
        exitDirection.y *
            exitSpeed +
        randomRange(
            -65,
            65
        );

    rabbit.portalCooldown =
        CONFIG.portalDelay;

    rabbit.portalLockIndex =
        exitPortal.index;

    rabbit.teleportAlpha =
        0.28;

    rabbit.teleportScale =
        0.56;

    rabbit.squashX = 0.72;
    rabbit.squashY = 1.28;

    rabbit.squashVelocityX =
        0.12;

    rabbit.squashVelocityY =
        -0.12;

    limitVelocity(
        rabbit,
        CONFIG.maxSpeed
    );
}

function checkRabbitPortals(rabbit) {
    if (rabbit.portalCooldown > 0) {
        return;
    }

    for (const portal of ENGINE.portals) {
        if (
            portal.index ===
                rabbit.portalLockIndex &&
            portal.containsRabbit(rabbit)
        ) {
            continue;
        }

        if (
            portal.containsRabbit(
                rabbit
            )
        ) {
            teleportRabbit(
                rabbit,
                portal
            );

            return;
        }
    }

    rabbit.portalLockIndex = -1;
}

/* ============================================================
   PHYSICS UPDATE
============================================================ */

function physicsStep(delta) {
    for (const rabbit of ENGINE.rabbits) {
        rabbit.updatePhysics(delta);

        resolveWallCollisions(
            rabbit
        );

        resolveTiltCollision(
            rabbit
        );
    }

    resolveAllRabbitCollisions();

    for (const rabbit of ENGINE.rabbits) {
        resolveWallCollisions(
            rabbit
        );

        resolveTiltCollision(
            rabbit
        );

        checkRabbitPortals(
            rabbit
        );

        rabbit.updateAnimation(
            delta
        );
    }
}

/* ============================================================
   BACKGROUND
============================================================ */

function drawBackground(
    context,
    timeSeconds
) {
    const background =
        context.createRadialGradient(
            ENGINE.width * 0.5,
            ENGINE.height * 0.48,
            10,
            ENGINE.width * 0.5,
            ENGINE.height * 0.48,
            Math.max(
                ENGINE.width,
                ENGINE.height
            ) * 0.72
        );

    background.addColorStop(
        0,
        "#160a29"
    );

    background.addColorStop(
        0.42,
        "#090316"
    );

    background.addColorStop(
        0.78,
        "#030108"
    );

    background.addColorStop(
        1,
        "#000000"
    );

    context.fillStyle =
        background;

    context.fillRect(
        0,
        0,
        ENGINE.width,
        ENGINE.height
    );

    drawGrid(
        context,
        timeSeconds
    );

    drawWorldFog(
        context,
        timeSeconds
    );

    drawEdgeVignette(
        context
    );
}

function drawGrid(
    context,
    timeSeconds
) {
    const gridSize = 40;

    const verticalOffset =
        (
            timeSeconds *
            7
        ) %
        gridSize;

    context.save();

    context.strokeStyle =
        "rgba(6,182,212,0.055)";

    context.lineWidth = 1;

    for (
        let x = 0;
        x <= ENGINE.width;
        x += gridSize
    ) {
        context.beginPath();

        context.moveTo(
            x,
            0
        );

        context.lineTo(
            x,
            ENGINE.height
        );

        context.stroke();
    }

    for (
        let y =
            -gridSize +
            verticalOffset;
        y <=
        ENGINE.height +
            gridSize;
        y += gridSize
    ) {
        context.beginPath();

        context.moveTo(
            0,
            y
        );

        context.lineTo(
            ENGINE.width,
            y
        );

        context.stroke();
    }

    context.restore();
}

function drawWorldFog(
    context,
    timeSeconds
) {
    const driftX =
        Math.sin(
            timeSeconds * 0.28
        ) *
        ENGINE.width *
        0.08;

    const driftY =
        Math.cos(
            timeSeconds * 0.22
        ) *
        ENGINE.height *
        0.05;

    const fog =
        context.createRadialGradient(
            ENGINE.width * 0.5 +
                driftX,
            ENGINE.height * 0.5 +
                driftY,
            0,
            ENGINE.width * 0.5 +
                driftX,
            ENGINE.height * 0.5 +
                driftY,
            Math.min(
                ENGINE.width,
                ENGINE.height
            ) * 0.72
        );

    fog.addColorStop(
        0,
        "rgba(6,182,212,0.045)"
    );

    fog.addColorStop(
        0.45,
        "rgba(155,77,255,0.035)"
    );

    fog.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    context.fillStyle = fog;

    context.fillRect(
        0,
        0,
        ENGINE.width,
        ENGINE.height
    );
}

function drawEdgeVignette(context) {
    const vignette =
        context.createRadialGradient(
            ENGINE.width * 0.5,
            ENGINE.height * 0.5,
            Math.min(
                ENGINE.width,
                ENGINE.height
            ) * 0.18,
            ENGINE.width * 0.5,
            ENGINE.height * 0.5,
            Math.max(
                ENGINE.width,
                ENGINE.height
            ) * 0.72
        );

    vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        0.72,
        "rgba(0,0,0,0.08)"
    );

    vignette.addColorStop(
        1,
        "rgba(0,0,0,0.7)"
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

/* ============================================================
   RENDER
============================================================ */

function renderWorld(timeSeconds) {
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
        timeSeconds
    );

    for (const portal of ENGINE.portals) {
        portal.draw(
            ctx,
            timeSeconds
        );
    }

    const sortedRabbits =
        [...ENGINE.rabbits].sort(
            (first, second) =>
                first.y -
                second.y
        );

    for (const rabbit of sortedRabbits) {
        rabbit.draw(
            ctx,
            timeSeconds
        );
    }

    ENGINE.tilt.draw(
        ctx,
        timeSeconds
    );
}

/* ============================================================
   POINTER INPUT
============================================================ */

function updatePointerFromEvent(event) {
    const rect =
        canvas.getBoundingClientRect();

    POINTER.x =
        event.clientX -
        rect.left;

    POINTER.y =
        event.clientY -
        rect.top;

    POINTER.active = true;
}

function findRabbitAt(
    x,
    y
) {
    let selected = null;
    let selectedDistance = Infinity;

    for (const rabbit of ENGINE.rabbits) {
        const dx =
            x - rabbit.x;

        const dy =
            y - rabbit.y;

        const distance =
            Math.hypot(dx, dy);

        const hitRadius =
            rabbit.radius + 12;

        if (
            distance <= hitRadius &&
            distance <
                selectedDistance
        ) {
            selected = rabbit;
            selectedDistance =
                distance;
        }
    }

    return selected;
}

function strikeRabbit(
    rabbit,
    pointerX,
    pointerY
) {
    let dx =
        rabbit.x -
        pointerX;

    let dy =
        rabbit.y -
        pointerY;

    if (
        Math.abs(dx) < 0.001 &&
        Math.abs(dy) < 0.001
    ) {
        dx = randomRange(-1, 1);
        dy = randomRange(-1, 1);
    }

    const direction =
        normalizeVector(dx, dy);

    rabbit.vx +=
        direction.x *
        CONFIG.pointerImpulse;

    rabbit.vy +=
        direction.y *
        CONFIG.pointerImpulse -
        80;

    rabbit.registerImpact(
        -direction.x,
        -direction.y,
        CONFIG.pointerImpulse
    );

    rabbit.squashX = 1.25;
    rabbit.squashY = 0.78;

    rabbit.squashVelocityX =
        -0.1;

    rabbit.squashVelocityY =
        0.1;

    limitVelocity(
        rabbit,
        CONFIG.maxSpeed
    );
}

canvas.addEventListener(
    "pointerdown",
    event => {
        event.preventDefault();

        updatePointerFromEvent(
            event
        );

        const rabbit =
            findRabbitAt(
                POINTER.x,
                POINTER.y
            );

        if (rabbit) {
            strikeRabbit(
                rabbit,
                POINTER.x,
                POINTER.y
            );
        }
    },
    {
        passive: false
    }
);

canvas.addEventListener(
    "pointermove",
    event => {
        updatePointerFromEvent(
            event
        );
    },
    {
        passive: true
    }
);

canvas.addEventListener(
    "contextmenu",
    event => {
        event.preventDefault();
    }
);

/* ============================================================
   MAIN LOOP
============================================================ */

function animationLoop(timestamp) {
    if (!ENGINE.running) {
        return;
    }

    try {
        if (!ENGINE.lastTimestamp) {
            ENGINE.lastTimestamp =
                timestamp;
        }

        let frameDelta =
            (
                timestamp -
                ENGINE.lastTimestamp
            ) /
            1000;

        ENGINE.lastTimestamp =
            timestamp;

        frameDelta = Math.min(
            frameDelta,
            CONFIG.maxDelta
        );

        ENGINE.elapsedTime +=
            frameDelta;

        ENGINE.accumulator +=
            frameDelta;

        let steps = 0;

        while (
            ENGINE.accumulator >=
                CONFIG.physicsStep &&
            steps <
                CONFIG.maxSubSteps
        ) {
            physicsStep(
                CONFIG.physicsStep
            );

            ENGINE.accumulator -=
                CONFIG.physicsStep;

            steps += 1;
        }

        if (
            steps ===
            CONFIG.maxSubSteps
        ) {
            ENGINE.accumulator = 0;
        }

        ENGINE.tilt.update(
            frameDelta,
            ENGINE.elapsedTime
        );

        renderWorld(
            ENGINE.elapsedTime
        );

        window.requestAnimationFrame(
            animationLoop
        );
    } catch (error) {
        showFatalError(error);
    }
}

/* ============================================================
   ERROR HANDLING
============================================================ */

function showFatalError(error) {
    ENGINE.running = false;

    console.error(
        "WHR ENGINE ERROR:",
        error
    );

    if (statusText) {
        statusText.textContent =
            "ENGINE ERROR";

        statusText.style.color =
            "#ff3d64";
    }

    if (controlsText) {
        controlsText.textContent =
            `GREŠKA: ${
                error.message ||
                "Nepoznata greška"
            }`;

        controlsText.style.color =
            "#ff8ba1";
    }

    ctx.setTransform(
        ENGINE.dpr,
        0,
        0,
        ENGINE.dpr,
        0,
        0
    );

    ctx.fillStyle =
        "#050008";

    ctx.fillRect(
        0,
        0,
        ENGINE.width,
        ENGINE.height
    );

    ctx.fillStyle =
        "#ff3d64";

    ctx.font =
        "bold 17px monospace";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "WHR ENGINE ERROR",
        ENGINE.width * 0.5,
        ENGINE.height * 0.5 - 12
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "12px monospace";

    ctx.fillText(
        String(
            error.message ||
            "Nepoznata greška"
        ).slice(0, 48),
        ENGINE.width * 0.5,
        ENGINE.height * 0.5 + 18
    );
}

/* ============================================================
   INITIALIZATION
============================================================ */

function init() {
    resizeCanvas();

    createPortals();
    createTilt();
    createRabbits();

    ENGINE.initialized = true;

    updateWorldLayout();

    if (statusText) {
        statusText.textContent =
            "FOUNDATION CORE: ONLINE";
    }

    if (controlsText) {
        controlsText.textContent =
            "Dodirni zeca i odbaci ga kroz VOID.";
    }

    window.requestAnimationFrame(
        animationLoop
    );
}

init();
