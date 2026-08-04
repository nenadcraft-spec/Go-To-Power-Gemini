"use strict";

/**
 * =========================================================
 * WHR: MASTER RABBIT MATERIAL ENGINE v6.1.4
 * FULL COMPATIBILITY FIX
 * =========================================================
 *
 * Popravke:
 * 1. Uklonjen prerani pristup masterRabbit objektu.
 * 2. resizeCanvas() se prvi put poziva tek iz init().
 * 3. Uklonjen ctx.roundRect() radi kompatibilnosti.
 * 4. Uklonjen ctx.filter radi kompatibilnosti.
 * 5. Retina rendering sa devicePixelRatio limitom.
 * 6. Stabilan delta-time.
 * 7. Touch-first eye tracking.
 * 8. Klik reaguje samo kada je zec pogođen.
 * 9. Pravac udara kontroliše tilt, recoil i uši.
 * 10. Mekana senka bez blur filtera.
 * 11. Popravljen RGB proračun.
 * 12. Prirodnija unutrašnja magla.
 * 13. Render error prikaz na ekranu.
 */

/* =========================================================
   DOM & CANVAS
========================================================= */

const canvas = document.getElementById("rabbitStage");

if (!canvas) {
    throw new Error(
        'Canvas element sa id="rabbitStage" nije pronađen.'
    );
}

const ctx = canvas.getContext("2d");

if (!ctx) {
    throw new Error("2D Canvas context nije dostupan.");
}

const controlsText =
    document.querySelector(".engine-controls p");

const statusText =
    document.querySelector(".hud-status");

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
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function clampColor(value) {
    return Math.max(
        0,
        Math.min(255, Math.round(value))
    );
}

function adjustColor(hex, percent) {
    const cleanHex =
        String(hex).replace("#", "");

    const number =
        Number.parseInt(cleanHex, 16);

    if (!Number.isFinite(number)) {
        return "#ffffff";
    }

    const amount =
        Math.round(2.55 * percent);

    const red =
        clampColor(
            (number >> 16) + amount
        );

    const green =
        clampColor(
            ((number >> 8) & 0xff) +
            amount
        );

    const blue =
        clampColor(
            (number & 0xff) + amount
        );

    return `#${[
        red
            .toString(16)
            .padStart(2, "0"),

        green
            .toString(16)
            .padStart(2, "0"),

        blue
            .toString(16)
            .padStart(2, "0")
    ].join("")}`;
}

function hexToRgba(hex, alpha) {
    const cleanHex =
        String(hex).replace("#", "");

    const number =
        Number.parseInt(cleanHex, 16);

    if (!Number.isFinite(number)) {
        return `rgba(255,255,255,${alpha})`;
    }

    const red = number >> 16;
    const green = (number >> 8) & 0xff;
    const blue = number & 0xff;

    return `rgba(${red},${green},${blue},${alpha})`;
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
    const safeRadius =
        Math.min(
            Math.max(0, radius),
            Math.abs(width) / 2,
            Math.abs(height) / 2
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

/* =========================================================
   RESIZE / RETINA
========================================================= */

function resizeCanvas() {
    const parent = canvas.parentElement;

    if (!parent) {
        throw new Error(
            "Canvas nema parent element."
        );
    }

    const rect =
        parent.getBoundingClientRect();

    if (
        rect.width <= 0 ||
        rect.height <= 0
    ) {
        return;
    }

    deviceScale =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    gameWidth = rect.width;
    gameHeight = rect.height;

    canvas.width =
        Math.max(
            1,
            Math.round(
                gameWidth * deviceScale
            )
        );

    canvas.height =
        Math.max(
            1,
            Math.round(
                gameHeight * deviceScale
            )
        );

    canvas.style.width =
        `${gameWidth}px`;

    canvas.style.height =
        `${gameHeight}px`;

    ctx.setTransform(
        deviceScale,
        0,
        0,
        deviceScale,
        0,
        0
    );

    pointer.x =
        gameWidth * 0.5;

    pointer.y =
        gameHeight * 0.3;
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
            120
        );
    }
);

/* =========================================================
   PROCEDURAL RABBIT
========================================================= */

class ProceduralRabbit {
    constructor(
        x,
        y,
        radius,
        baseColor
    ) {
        this.x = x;
        this.y = y;

        this.baseRadius = radius;
        this.baseColor = baseColor;

        this.motionSeed =
            Math.random() * 100;

        this.breathe = 0;
        this.microVibe = 0;

        this.squashX = 1;
        this.squashY = 1;

        this.squashVelocityX = 0;
        this.squashVelocityY = 0;

        this.tilt = 0;
        this.tiltVelocity = 0;

        this.recoil = 0;
        this.recoilVelocity = 0;

        this.leftEarAngle = -0.15;
        this.rightEarAngle = 0.15;

        this.earVelocityLeft = 0;
        this.earVelocityRight = 0;

        this.hitTimer = 0;

        this.eyeX = 0;
        this.eyeY = 0;

        this.eyeTargetX = 0;
        this.eyeTargetY = 0;

        this.fogBlobs = [
            {
                angle: 0,
                distance: radius * 0.34,
                speed: 0.95,
                size: radius * 0.44,
                seed: Math.random() * 10
            },
            {
                angle: 2.1,
                distance: radius * 0.25,
                speed: -1.18,
                size: radius * 0.34,
                seed: Math.random() * 10
            },
            {
                angle: 4.2,
                distance: radius * 0.39,
                speed: 0.82,
                size: radius * 0.3,
                seed: Math.random() * 10
            },
            {
                angle: 5.4,
                distance: radius * 0.18,
                speed: -0.68,
                size: radius * 0.26,
                seed: Math.random() * 10
            }
        ];
    }

    triggerStrike(
        pointerX,
        pointerY
    ) {
        const dx =
            pointerX - this.x;

        const dy =
            pointerY - this.y;

        const direction =
            Math.atan2(dy, dx);

        const horizontalImpact =
            clamp(
                dx / this.baseRadius,
                -1,
                1
            );

        const verticalImpact =
            clamp(
                dy / this.baseRadius,
                -1,
                1
            );

        this.squashX = 1.34;
        this.squashY = 0.72;

        this.squashVelocityX = -0.07;
        this.squashVelocityY = 0.08;

        this.tilt =
            clamp(
                -horizontalImpact * 0.24,
                -0.32,
                0.32
            );

        this.tiltVelocity =
            -horizontalImpact * 0.025;

        this.recoil = 14;

        this.recoilVelocity =
            -verticalImpact * 0.6;

        this.earVelocityLeft +=
            -Math.cos(direction) * 0.19 -
            horizontalImpact * 0.05;

        this.earVelocityRight +=
            Math.cos(direction) * 0.19 -
            horizontalImpact * 0.05;

        this.hitTimer = 0.24;
    }

    update(
        timeSeconds,
        delta
    ) {
        const safeDelta =
            Math.min(delta, 0.033);

        this.updateBreathing(
            timeSeconds
        );

        this.updateBodySpring(
            safeDelta
        );

        this.updateEarSpring(
            timeSeconds,
            safeDelta
        );

        this.updateEyeTracking(
            safeDelta
        );

        this.updateFog(
            safeDelta
        );

        this.hitTimer =
            Math.max(
                0,
                this.hitTimer - safeDelta
            );
    }

    updateBreathing(timeSeconds) {
        this.breathe =
            Math.sin(
                timeSeconds * 2.15 +
                this.motionSeed
            ) * 1.7;

        this.microVibe =
            Math.sin(
                timeSeconds * 8.4 +
                this.motionSeed
            ) * 0.16 +
            Math.sin(
                timeSeconds * 13.7 +
                this.motionSeed * 2
            ) * 0.07;
    }

    updateBodySpring(delta) {
        const springStrength = 72;
        const damping = 0.72;

        this.squashVelocityX +=
            (1 - this.squashX) *
            springStrength *
            delta;

        this.squashVelocityY +=
            (1 - this.squashY) *
            springStrength *
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
                0.72,
                1.42
            );

        this.squashY =
            clamp(
                this.squashY,
                0.65,
                1.35
            );

        this.tiltVelocity +=
            (0 - this.tilt) *
            48 *
            delta;

        this.tiltVelocity *=
            0.78;

        this.tilt +=
            this.tiltVelocity;

        this.recoilVelocity +=
            (0 - this.recoil) *
            52 *
            delta;

        this.recoilVelocity *=
            0.76;

        this.recoil +=
            this.recoilVelocity;

        if (
            Math.abs(this.recoil) <
            0.01
        ) {
            this.recoil = 0;
        }
    }

    updateEarSpring(
        timeSeconds,
        delta
    ) {
        const earWave =
            Math.sin(
                timeSeconds * 2.7 +
                this.motionSeed
            ) * 0.038;

        const targetLeft =
            -0.15 + earWave;

        const targetRight =
            0.15 - earWave;

        const spring = 70;
        const damping = 0.78;

        this.earVelocityLeft +=
            (
                targetLeft -
                this.leftEarAngle
            ) *
            spring *
            delta;

        this.earVelocityRight +=
            (
                targetRight -
                this.rightEarAngle
            ) *
            spring *
            delta;

        this.earVelocityLeft *=
            damping;

        this.earVelocityRight *=
            damping;

        this.leftEarAngle +=
            this.earVelocityLeft;

        this.rightEarAngle +=
            this.earVelocityRight;

        this.leftEarAngle =
            clamp(
                this.leftEarAngle,
                -0.62,
                0.18
            );

        this.rightEarAngle =
            clamp(
                this.rightEarAngle,
                -0.18,
                0.62
            );
    }

    updateEyeTracking(delta) {
        const dx =
            pointer.x - this.x;

        const dy =
            pointer.y - this.y;

        const angle =
            Math.atan2(dy, dx);

        this.eyeTargetX =
            Math.cos(angle) *
            this.baseRadius *
            0.085;

        this.eyeTargetY =
            Math.sin(angle) *
            this.baseRadius *
            0.045;

        const smoothing =
            Math.min(
                1,
                delta * 12
            );

        this.eyeX +=
            (
                this.eyeTargetX -
                this.eyeX
            ) *
            smoothing;

        this.eyeY +=
            (
                this.eyeTargetY -
                this.eyeY
            ) *
            smoothing;
    }

    updateFog(delta) {
        this.fogBlobs.forEach(
            blob => {
                blob.angle +=
                    blob.speed *
                    delta;
            }
        );
    }

    drawShadow(context) {
        const shadowY =
            this.y +
            this.baseRadius * 1.03;

        const recoilFactor =
            clamp(
                1 -
                Math.abs(
                    this.recoil
                ) / 80,
                0.68,
                1
            );

        context.save();

        context.fillStyle =
            "rgba(0,0,0,0.09)";

        context.beginPath();

        context.ellipse(
            this.x,
            shadowY,
            this.baseRadius *
                1.15 *
                recoilFactor,
            this.baseRadius *
                0.36 *
                recoilFactor,
            0,
            0,
            Math.PI * 2
        );

        context.fill();

        context.fillStyle =
            "rgba(0,0,0,0.18)";

        context.beginPath();

        context.ellipse(
            this.x,
            shadowY,
            this.baseRadius *
                0.8 *
                recoilFactor,
            this.baseRadius *
                0.22 *
                recoilFactor,
            0,
            0,
            Math.PI * 2
        );

        context.fill();

        context.restore();
    }

    draw(
        context,
        timeSeconds
    ) {
        const radius =
            this.baseRadius +
            this.breathe;

        const lightColor =
            adjustColor(
                this.baseColor,
                34
            );

        const innerColor =
            adjustColor(
                this.baseColor,
                14
            );

        const shadowColor =
            adjustColor(
                this.baseColor,
                -54
            );

        const rimColor =
            adjustColor(
                this.baseColor,
                24
            );

        context.save();

        context.translate(
            this.x,
            this.y +
                this.recoil +
                this.microVibe
        );

        context.rotate(
            this.tilt
        );

        context.scale(
            this.squashX,
            this.squashY
        );

        this.drawAura(
            context,
            radius,
            timeSeconds
        );

        this.drawEars(
            context,
            radius,
            lightColor,
            innerColor,
            shadowColor,
            rimColor
        );

        this.drawBody(
            context,
            radius,
            lightColor,
            shadowColor
        );

        this.drawInnerCore(
            context,
            radius
        );

        this.drawFog(
            context,
            radius,
            timeSeconds
        );

        this.drawVisor(
            context,
            radius
        );

        this.drawGlassLayer(
            context,
            radius
        );

        this.drawMovingHighlight(
            context,
            radius,
            timeSeconds
        );

        context.restore();
    }

    drawAura(
        context,
        radius,
        timeSeconds
    ) {
        const pulse =
            Math.sin(
                timeSeconds * 2.2 +
                this.motionSeed
            ) * 3;

        const auraRadius =
            radius + 18 + pulse;

        const aura =
            context.createRadialGradient(
                0,
                0,
                radius * 0.45,
                0,
                0,
                auraRadius
            );

        aura.addColorStop(
            0,
            hexToRgba(
                "#06b6d4",
                this.hitTimer > 0
                    ? 0.26
                    : 0.12
            )
        );

        aura.addColorStop(
            0.65,
            hexToRgba(
                this.baseColor,
                0.06
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

    drawEars(
        context,
        radius,
        lightColor,
        innerColor,
        shadowColor,
        rimColor
    ) {
        const ears = [
            {
                angle:
                    this.leftEarAngle,
                x:
                    -radius * 0.42
            },
            {
                angle:
                    this.rightEarAngle,
                x:
                    radius * 0.42
            }
        ];

        ears.forEach(
            ear => {
                context.save();

                context.translate(
                    ear.x,
                    -radius * 0.83
                );

                context.rotate(
                    ear.angle
                );

                const earGradient =
                    context.createLinearGradient(
                        0,
                        -radius * 0.85,
                        0,
                        radius * 0.1
                    );

                earGradient.addColorStop(
                    0,
                    lightColor
                );

                earGradient.addColorStop(
                    0.48,
                    innerColor
                );

                earGradient.addColorStop(
                    1,
                    shadowColor
                );

                context.shadowColor =
                    "#06b6d4";

                context.shadowBlur =
                    this.hitTimer > 0
                        ? 13
                        : 7;

                context.fillStyle =
                    earGradient;

                context.beginPath();

                context.ellipse(
                    0,
                    -radius * 0.46,
                    radius * 0.22,
                    radius * 0.61,
                    0,
                    0,
                    Math.PI * 2
                );

                context.fill();

                context.shadowBlur = 0;

                context.strokeStyle =
                    rimColor;

                context.lineWidth = 2;

                context.stroke();

                const innerEar =
                    context.createLinearGradient(
                        0,
                        -radius * 0.75,
                        0,
                        0
                    );

                innerEar.addColorStop(
                    0,
                    "rgba(255,255,255,0.30)"
                );

                innerEar.addColorStop(
                    0.45,
                    "rgba(6,182,212,0.22)"
                );

                innerEar.addColorStop(
                    1,
                    "rgba(6,182,212,0.05)"
                );

                context.fillStyle =
                    innerEar;

                context.beginPath();

                context.ellipse(
                    0,
                    -radius * 0.4,
                    radius * 0.095,
                    radius * 0.36,
                    0,
                    0,
                    Math.PI * 2
                );

                context.fill();

                context.restore();
            }
        );
    }

    drawBody(
        context,
        radius,
        lightColor,
        shadowColor
    ) {
        const bodyGradient =
            context.createRadialGradient(
                -radius * 0.34,
                -radius * 0.35,
                radius * 0.04,
                0,
                radius * 0.08,
                radius * 1.08
            );

        bodyGradient.addColorStop(
            0,
            "#ffffff"
        );

        bodyGradient.addColorStop(
            0.24,
            lightColor
        );

        bodyGradient.addColorStop(
            0.68,
            this.hitTimer > 0
                ? "#ec4899"
                : this.baseColor
        );

        bodyGradient.addColorStop(
            1,
            shadowColor
        );

        context.fillStyle =
            bodyGradient;

        context.shadowColor =
            this.hitTimer > 0
                ? "#ec4899"
                : "#06b6d4";

        context.shadowBlur =
            this.hitTimer > 0
                ? 30
                : 13;

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

        const rimGradient =
            context.createLinearGradient(
                -radius,
                -radius,
                radius,
                radius
            );

        rimGradient.addColorStop(
            0,
            "rgba(255,255,255,0.78)"
        );

        rimGradient.addColorStop(
            0.22,
            "rgba(6,182,212,0.62)"
        );

        rimGradient.addColorStop(
            0.72,
            "rgba(184,197,214,0.20)"
        );

        rimGradient.addColorStop(
            1,
            "rgba(0,0,0,0.70)"
        );

        context.strokeStyle =
            rimGradient;

        context.lineWidth = 2.8;

        context.beginPath();

        context.arc(
            0,
            0,
            radius,
            0,
            Math.PI * 2
        );

        context.stroke();
    }

    drawInnerCore(
        context,
        radius
    ) {
        const coreGradient =
            context.createRadialGradient(
                0,
                -radius * 0.08,
                radius * 0.04,
                0,
                0,
                radius * 0.74
            );

        coreGradient.addColorStop(
            0,
            "rgba(255,255,255,0.34)"
        );

        coreGradient.addColorStop(
            0.3,
            "rgba(6,182,212,0.16)"
        );

        coreGradient.addColorStop(
            0.75,
            hexToRgba(
                this.baseColor,
                0.09
            )
        );

        coreGradient.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        context.fillStyle =
            coreGradient;

        context.beginPath();

        context.arc(
            0,
            0,
            radius * 0.76,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    drawFog(
        context,
        radius,
        timeSeconds
    ) {
        context.save();

        context.beginPath();

        context.arc(
            0,
            0,
            radius * 0.79,
            0,
            Math.PI * 2
        );

        context.clip();

        context.globalCompositeOperation =
            "screen";

        this.fogBlobs.forEach(
            (blob, index) => {
                const wobbleX =
                    Math.sin(
                        blob.angle * 1.7 +
                        blob.seed +
                        timeSeconds * 0.3
                    ) *
                    radius *
                    0.065;

                const wobbleY =
                    Math.cos(
                        blob.angle * 1.28 +
                        blob.seed +
                        timeSeconds * 0.22
                    ) *
                    radius *
                    0.055;

                const blobX =
                    Math.cos(
                        blob.angle
                    ) *
                    blob.distance +
                    wobbleX;

                const blobY =
                    Math.sin(
                        blob.angle
                    ) *
                    blob.distance *
                    0.68 +
                    wobbleY;

                const fogGradient =
                    context.createRadialGradient(
                        blobX,
                        blobY,
                        0,
                        blobX,
                        blobY,
                        blob.size
                    );

                fogGradient.addColorStop(
                    0,
                    index % 2 === 0
                        ? "rgba(255,255,255,0.24)"
                        : "rgba(6,182,212,0.24)"
                );

                fogGradient.addColorStop(
                    0.45,
                    hexToRgba(
                        this.baseColor,
                        0.18
                    )
                );

                fogGradient.addColorStop(
                    1,
                    "rgba(0,0,0,0)"
                );

                context.fillStyle =
                    fogGradient;

                context.beginPath();

                context.arc(
                    blobX,
                    blobY,
                    blob.size,
                    0,
                    Math.PI * 2
                );

                context.fill();
            }
        );

        context.restore();
    }

    drawVisor(
        context,
        radius
    ) {
        context.save();

        context.shadowBlur = 0;

        context.fillStyle =
            "rgba(4,15,22,0.94)";

        roundedRectPath(
            context,
            -radius * 0.44,
            -radius * 0.18,
            radius * 0.88,
            radius * 0.25,
            6
        );

        context.fill();

        context.strokeStyle =
            "rgba(255,255,255,0.17)";

        context.lineWidth = 1;

        context.stroke();

        context.save();

        roundedRectPath(
            context,
            -radius * 0.4,
            -radius * 0.145,
            radius * 0.8,
            radius * 0.17,
            5
        );

        context.clip();

        context.translate(
            this.eyeX,
            this.eyeY
        );

        const eyeGradient =
            context.createLinearGradient(
                -radius * 0.32,
                0,
                radius * 0.32,
                0
            );

        eyeGradient.addColorStop(
            0,
            "rgba(6,182,212,0)"
        );

        eyeGradient.addColorStop(
            0.2,
            "#06b6d4"
        );

        eyeGradient.addColorStop(
            0.5,
            "#b8ffff"
        );

        eyeGradient.addColorStop(
            0.8,
            "#06b6d4"
        );

        eyeGradient.addColorStop(
            1,
            "rgba(6,182,212,0)"
        );

        context.fillStyle =
            eyeGradient;

        context.shadowColor =
            "#06b6d4";

        context.shadowBlur = 12;

        context.fillRect(
            -radius * 0.34,
            -radius * 0.105,
            radius * 0.68,
            radius * 0.09
        );

        context.shadowBlur = 0;

        context.fillStyle =
            "rgba(255,255,255,0.9)";

        context.fillRect(
            -radius * 0.2,
            -radius * 0.095,
            radius * 0.16,
            1.8
        );

        context.restore();
        context.restore();
    }

    drawGlassLayer(
        context,
        radius
    ) {
        const glassGradient =
            context.createLinearGradient(
                -radius,
                -radius,
                radius,
                radius
            );

        glassGradient.addColorStop(
            0,
            "rgba(255,255,255,0.46)"
        );

        glassGradient.addColorStop(
            0.22,
            "rgba(255,255,255,0.08)"
        );

        glassGradient.addColorStop(
            0.52,
            "rgba(255,255,255,0.01)"
        );

        glassGradient.addColorStop(
            0.88,
            "rgba(6,182,212,0.16)"
        );

        glassGradient.addColorStop(
            1,
            "rgba(0,0,0,0.22)"
        );

        context.fillStyle =
            glassGradient;

        context.beginPath();

        context.arc(
            0,
            0,
            radius * 0.95,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    drawMovingHighlight(
        context,
        radius,
        timeSeconds
    ) {
        const highlightOffset =
            Math.sin(
                timeSeconds * 1.25 +
                this.motionSeed
            ) *
            radius *
            0.12;

        const highlightGradient =
            context.createRadialGradient(
                -radius * 0.33 +
                    highlightOffset,
                -radius * 0.43,
                0,
                -radius * 0.33 +
                    highlightOffset,
                -radius * 0.43,
                radius * 0.52
            );

        highlightGradient.addColorStop(
            0,
            "rgba(255,255,255,0.50)"
        );

        highlightGradient.addColorStop(
            0.28,
            "rgba(255,255,255,0.14)"
        );

        highlightGradient.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        context.fillStyle =
            highlightGradient;

        context.beginPath();

        context.ellipse(
            -radius * 0.3 +
                highlightOffset,
            -radius * 0.42,
            radius * 0.36,
            radius * 0.17,
            -0.42,
            0,
            Math.PI * 2
        );

        context.fill();
    }
}

/* =========================================================
   MASTER RABBIT
========================================================= */

const masterRabbit =
    new ProceduralRabbit(
        0,
        0,
        65,
        "#b8c5d6"
    );

/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground(
    context,
    timeSeconds
) {
    const background =
        context.createRadialGradient(
            gameWidth * 0.5,
            gameHeight * 0.46,
            10,
            gameWidth * 0.5,
            gameHeight * 0.46,
            Math.max(
                gameWidth,
                gameHeight
            ) * 0.7
        );

    background.addColorStop(
        0,
        "rgba(20,8,38,1)"
    );

    background.addColorStop(
        0.5,
        "rgba(6,2,14,1)"
    );

    background.addColorStop(
        1,
        "rgba(0,0,0,1)"
    );

    context.fillStyle =
        background;

    context.fillRect(
        0,
        0,
        gameWidth,
        gameHeight
    );

    context.save();

    context.strokeStyle =
        "rgba(6,182,212,0.055)";

    context.lineWidth = 1;

    const gridSize = 42;

    const offset =
        (timeSeconds * 5) %
        gridSize;

    for (
        let x = -gridSize;
        x <= gameWidth + gridSize;
        x += gridSize
    ) {
        context.beginPath();

        context.moveTo(
            x,
            0
        );

        context.lineTo(
            x +
                Math.sin(
                    timeSeconds
                ) * 3,
            gameHeight
        );

        context.stroke();
    }

    for (
        let y =
            -gridSize + offset;
        y <=
            gameHeight +
            gridSize;
        y += gridSize
    ) {
        context.beginPath();

        context.moveTo(
            0,
            y
        );

        context.lineTo(
            gameWidth,
            y
        );

        context.stroke();
    }

    context.restore();

    const fogPulse =
        Math.sin(
            timeSeconds * 0.6
        ) * 18;

    const fog =
        context.createRadialGradient(
            gameWidth * 0.5,
            gameHeight * 0.5 +
                fogPulse,
            0,
            gameWidth * 0.5,
            gameHeight * 0.5 +
                fogPulse,
            Math.min(
                gameWidth,
                gameHeight
            ) * 0.48
        );

    fog.addColorStop(
        0,
        "rgba(6,182,212,0.028)"
    );

    fog.addColorStop(
        0.5,
        "rgba(168,85,247,0.018)"
    );

    fog.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    context.fillStyle =
        fog;

    context.fillRect(
        0,
        0,
        gameWidth,
        gameHeight
    );
}

/* =========================================================
   RENDER ERROR
========================================================= */

function showRenderError(error) {
    renderStopped = true;

    console.error(
        "WHR RENDER ERROR:",
        error
    );

    if (statusText) {
        statusText.textContent =
            "RENDER ERROR";

        statusText.style.color =
            "#ff3d64";
    }

    if (controlsText) {
        controlsText.textContent =
            `GREŠKA: ${error.message}`;

        controlsText.style.color =
            "#ff8ba1";

        controlsText.style.borderColor =
            "rgba(255,61,100,0.6)";
    }

    ctx.setTransform(
        deviceScale,
        0,
        0,
        deviceScale,
        0,
        0
    );

    ctx.fillStyle =
        "#050008";

    ctx.fillRect(
        0,
        0,
        gameWidth,
        gameHeight
    );

    ctx.fillStyle =
        "#ff3d64";

    ctx.font =
        "bold 16px monospace";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "WHR RENDER ERROR",
        gameWidth / 2,
        gameHeight / 2 - 10
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "12px monospace";

    ctx.fillText(
        String(
            error.message
        ).slice(0, 45),
        gameWidth / 2,
        gameHeight / 2 + 18
    );
}

/* =========================================================
   MAIN LOOP
========================================================= */

function renderStage(timestamp) {
    if (renderStopped) {
        return;
    }

    try {
        if (!lastTimestamp) {
            lastTimestamp =
                timestamp;
        }

        const delta =
            Math.min(
                (
                    timestamp -
                    lastTimestamp
                ) / 1000,
                0.033
            );

        lastTimestamp =
            timestamp;

        const timeSeconds =
            timestamp / 1000;

        ctx.setTransform(
            deviceScale,
            0,
            0,
            deviceScale,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            gameWidth,
            gameHeight
        );

        drawBackground(
            ctx,
            timeSeconds
        );

        masterRabbit.x =
            gameWidth * 0.5;

        masterRabbit.y =
            gameHeight * 0.49;

        masterRabbit.update(
            timeSeconds,
            delta
        );

        masterRabbit.drawShadow(
            ctx
        );

        masterRabbit.draw(
            ctx,
            timeSeconds
        );

        window.requestAnimationFrame(
            renderStage
        );
    } catch (error) {
        showRenderError(error);
    }
}

/* =========================================================
   POINTER EVENTS
========================================================= */

function updatePointerFromEvent(
    event
) {
    const rect =
        canvas.getBoundingClientRect();

    pointer.x =
        event.clientX -
        rect.left;

    pointer.y =
        event.clientY -
        rect.top;

    pointer.active = true;
}

window.addEventListener(
    "pointermove",
    event => {
        updatePointerFromEvent(
            event
        );
    }
);

canvas.addEventListener(
    "pointerdown",
    event => {
        event.preventDefault();

        updatePointerFromEvent(
            event
        );

        const hitDistance =
            Math.hypot(
                pointer.x -
                    masterRabbit.x,
                pointer.y -
                    masterRabbit.y
            );

        if (
            hitDistance <=
            masterRabbit.baseRadius +
                22
        ) {
            masterRabbit.triggerStrike(
                pointer.x,
                pointer.y
            );
        }
    },
    {
        passive: false
    }
);

canvas.addEventListener(
    "contextmenu",
    event => {
        event.preventDefault();
    }
);

/* =========================================================
   INITIALIZATION
========================================================= */

function init() {
    resizeCanvas();

    masterRabbit.x =
        gameWidth * 0.5;

    masterRabbit.y =
        gameHeight * 0.49;

    if (statusText) {
        statusText.textContent =
            "COMPATIBILITY CORE: ONLINE";
    }

    if (controlsText) {
        controlsText.textContent =
            "Pogodi zeca prstom ili mišem.";
    }

    window.requestAnimationFrame(
        renderStage
    );
}

init();
