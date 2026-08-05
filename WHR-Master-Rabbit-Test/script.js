"use strict";

/**
 * ============================================================
 * WHITE HAT RABBIT STUDIOS
 * WHR MASTER RABBIT TEST
 * COLOR ENGINE PROTOTYPE v1.0
 * ============================================================
 *
 * OVA VERZIJA SADRŽI:
 *
 * - 3 osnovna svetlosna zeca:
 *      RED
 *      GREEN
 *      BLUE
 *
 * - 4 VOID rupe
 * - centralni beli TILT
 * - usporenu simulaciju na 10%
 * - Retina Canvas podršku
 * - mobile-first 9:16 podršku
 * - touch i mouse podršku
 * - prolazak osnovnih zečeva jednih kroz druge
 * - privremeni render kombinacije tokom preklapanja
 * - aditivno RGB mešanje svetlosti
 * - VOID memoriju za dve osnovne boje
 * - VOID generisanje privremenih kombinovanih zečeva
 * - poseban render za:
 *      RED + GREEN = YELLOW
 *      RED + BLUE = MAGENTA
 *      GREEN + BLUE = CYAN
 *
 * - maksimalno 4 aktivna VOID rezultata
 * - trajanje VOID rezultata: 3 stvarne sekunde
 * - fade-out pre uklanjanja
 * - VOID imunitet kombinovanih zečeva
 * - zaštitu od ponovnog usisavanja
 * - zaštitu od duplog brojanja kontakta
 * - ograničenu VOID memoriju
 * - VOID memory timeout
 * - validaciju kombinacija pri pokretanju
 * - delta-time zaštitu
 * - debug režim preko tastera D
 *
 * OVA VERZIJA NEMA:
 *
 * - score
 * - lives
 * - level
 * - globalni timer
 * - HUD
 * - zvuk
 * - Morzeovu azbuku
 * - TILT pitanja
 * - TILT charge
 * - TILT eksploziju
 * - Windmill
 * - Rabbit Hole
 * - Boss
 * - lasere
 *
 * ============================================================
 */

/* ============================================================
   CONFIG
============================================================ */

const CONFIG = {
    gameSpeed: 0.10,

    gravity: 500,
    wallBounce: 0.88,
    floorFriction: 0.998,
    airFriction: 0.9995,

    rabbitRadius: 30,
    rabbitMaxSpeed: 520,

    wallPadding: 9,

    tiltRadius: 43,
    tiltBounce: 1.03,

    voidRadius: 43,
    voidInset: 49,

    voidCaptureFactor: 0.58,
    voidRabbitCooldown: 2.2,
    voidMemoryTimeout: 6.0,
    voidSpawnCooldown: 4.5,
    voidRepelForce: 300,

    resultLifetime: 3.0,
    resultFadeDuration: 0.45,
    resultDriftSpeed: 80,

    maxActiveVoidResults: 4,

    overlapGlowLimit: 21,

    maxDelta: 1 / 30,
    physicsStep: 1 / 120,
    maxSubSteps: 8,

    pointerImpulse: 280,
    pointerHitPadding: 16,

    devicePixelRatioLimit: 2,

    debug: false
};

/* ============================================================
   DOM
============================================================ */

const canvas = document.getElementById("gameCanvas");

if (!canvas) {
    throw new Error(
        'Canvas sa id="gameCanvas" nije pronađen.'
    );
}

const ctx = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true
});

if (!ctx) {
    throw new Error(
        "Canvas 2D context nije dostupan."
    );
}

/* ============================================================
   ENGINE STATE
============================================================ */

const ENGINE = {
    width: 0,
    height: 0,
    dpr: 1,

    initialized: false,
    running: true,

    lastTimestamp: 0,
    accumulator: 0,

    realTime: 0,
    simulationTime: 0,

    rabbits: [],
    voidResults: [],
    voidPortals: [],
    overlaps: new Map(),

    tilt: null,

    nextRabbitId: 1,
    nextResultId: 1,

    fps: 0,
    fpsFrames: 0,
    fpsAccumulator: 0
};

const POINTER = {
    x: 0,
    y: 0,
    active: false
};

/* ============================================================
   COLOR SYSTEM
============================================================ */

const PRIMARY_COLORS = Object.freeze({
    RED: {
        id: "RED",
        label: "Red",
        hex: "#ff304f",
        rgb: [255, 0, 0]
    },

    GREEN: {
        id: "GREEN",
        label: "Green",
        hex: "#24e96f",
        rgb: [0, 255, 0]
    },

    BLUE: {
        id: "BLUE",
        label: "Blue",
        hex: "#1976ff",
        rgb: [0, 0, 255]
    }
});

const COLOR_RECIPES = Object.freeze({
    "GREEN+RED": {
        id: "YELLOW",
        label: "Yellow",
        parents: ["RED", "GREEN"],
        hex: "#ffe52e",
        rgb: [255, 255, 0],
        renderProfile: "SOLAR_FUSION"
    },

    "BLUE+RED": {
        id: "MAGENTA",
        label: "Magenta",
        parents: ["RED", "BLUE"],
        hex: "#ff2bd6",
        rgb: [255, 0, 255],
        renderProfile: "DUAL_SPIRAL"
    },

    "BLUE+GREEN": {
        id: "CYAN",
        label: "Cyan",
        parents: ["GREEN", "BLUE"],
        hex: "#00f2ff",
        rgb: [0, 255, 255],
        renderProfile: "AQUA_WAVE"
    }
});

/* ============================================================
   BASIC UTILITIES
============================================================ */

function clamp(value, minimum, maximum) {
    return Math.max(
        minimum,
        Math.min(maximum, value)
    );
}

function lerp(start, end, amount) {
    return (
        start +
        (end - start) *
        amount
    );
}

function randomRange(minimum, maximum) {
    return (
        minimum +
        Math.random() *
        (maximum - minimum)
    );
}

function distanceSquared(
    x1,
    y1,
    x2,
    y2
) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return dx * dx + dy * dy;
}

function normalizeVector(x, y) {
    const length = Math.hypot(x, y);

    if (length < 0.000001) {
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

function limitVelocity(body, maximumSpeed) {
    const speedSquared =
        body.vx * body.vx +
        body.vy * body.vy;

    const maximumSquared =
        maximumSpeed *
        maximumSpeed;

    if (speedSquared <= maximumSquared) {
        return;
    }

    const speed =
        Math.sqrt(speedSquared);

    const scale =
        maximumSpeed / speed;

    body.vx *= scale;
    body.vy *= scale;
}

function normalizeHex(hex) {
    let clean = String(hex)
        .replace("#", "")
        .trim();

    if (clean.length === 3) {
        clean = clean
            .split("")
            .map(character => character + character)
            .join("");
    }

    return clean
        .padStart(6, "0")
        .slice(0, 6);
}

function clampColor(value) {
    return clamp(
        Math.round(value),
        0,
        255
    );
}

function adjustColor(hex, percent) {
    const clean = normalizeHex(hex);
    const numeric = Number.parseInt(clean, 16);

    if (!Number.isFinite(numeric)) {
        return "#ffffff";
    }

    const amount =
        Math.round(2.55 * percent);

    const red = clampColor(
        ((numeric >> 16) & 255) +
        amount
    );

    const green = clampColor(
        ((numeric >> 8) & 255) +
        amount
    );

    const blue = clampColor(
        (numeric & 255) +
        amount
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
    const numeric = Number.parseInt(clean, 16);

    if (!Number.isFinite(numeric)) {
        return `rgba(255,255,255,${alpha})`;
    }

    const red =
        (numeric >> 16) & 255;

    const green =
        (numeric >> 8) & 255;

    const blue =
        numeric & 255;

    return (
        `rgba(${red},${green},${blue},${alpha})`
    );
}

function createPairKey(
    firstId,
    secondId
) {
    return (
        firstId < secondId
            ? `${firstId}:${secondId}`
            : `${secondId}:${firstId}`
    );
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
        ] || null
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
   RECIPE VALIDATION
============================================================ */

function validateColorRecipes() {
    const knownPrimaryIds =
        new Set(
            Object.keys(PRIMARY_COLORS)
        );

    const knownResultIds =
        new Set();

    for (
        const [recipeKey, recipe]
        of Object.entries(COLOR_RECIPES)
    ) {
        if (!recipe || typeof recipe !== "object") {
            throw new Error(
                `Neispravan recept: ${recipeKey}`
            );
        }

        if (
            !Array.isArray(recipe.parents) ||
            recipe.parents.length !== 2
        ) {
            throw new Error(
                `Recept ${recipeKey} mora imati dva roditelja.`
            );
        }

        const canonicalKey =
            createRecipeKey(
                recipe.parents[0],
                recipe.parents[1]
            );

        if (canonicalKey !== recipeKey) {
            throw new Error(
                `Recept ${recipeKey} nije kanonski sortiran. ` +
                `Očekivano: ${canonicalKey}`
            );
        }

        if (
            recipe.parents[0] ===
            recipe.parents[1]
        ) {
            throw new Error(
                `Recept ${recipeKey} koristi istu boju dva puta.`
            );
        }

        for (const parent of recipe.parents) {
            if (!knownPrimaryIds.has(parent)) {
                throw new Error(
                    `Nepoznata osnovna boja ${parent} u receptu ${recipeKey}.`
                );
            }
        }

        if (
            !recipe.id ||
            typeof recipe.id !== "string"
        ) {
            throw new Error(
                `Recept ${recipeKey} nema result ID.`
            );
        }

        if (knownResultIds.has(recipe.id)) {
            throw new Error(
                `Duplikat result ID-a: ${recipe.id}`
            );
        }

        knownResultIds.add(recipe.id);

        if (
            !recipe.hex ||
            typeof recipe.hex !== "string"
        ) {
            throw new Error(
                `Recept ${recipeKey} nema HEX boju.`
            );
        }

        if (
            !recipe.renderProfile ||
            typeof recipe.renderProfile !== "string"
        ) {
            throw new Error(
                `Recept ${recipeKey} nema render profil.`
            );
        }
    }

    const expectedRecipeCount = 3;

    if (
        Object.keys(COLOR_RECIPES).length !==
        expectedRecipeCount
    ) {
        throw new Error(
            `RGB prototip mora imati tačno ${expectedRecipeCount} recepta.`
        );
    }
}

/* ============================================================
   CANVAS / RETINA
============================================================ */

function resizeCanvas() {
    const rect =
        canvas.getBoundingClientRect();

    if (
        rect.width <= 0 ||
        rect.height <= 0
    ) {
        return;
    }

    ENGINE.width =
        rect.width;

    ENGINE.height =
        rect.height;

    ENGINE.dpr = Math.min(
        window.devicePixelRatio || 1,
        CONFIG.devicePixelRatioLimit
    );

    canvas.width = Math.max(
        1,
        Math.round(
            ENGINE.width *
            ENGINE.dpr
        )
    );

    canvas.height = Math.max(
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

    if (ENGINE.initialized) {
        updateWorldLayout();
    }

    POINTER.x =
        ENGINE.width * 0.5;

    POINTER.y =
        ENGINE.height * 0.5;
}

function updateWorldLayout() {
    createVoidPortals();

    if (ENGINE.tilt) {
        ENGINE.tilt.x =
            ENGINE.width * 0.5;

        ENGINE.tilt.y =
            ENGINE.height * 0.5;

        ENGINE.tilt.radius =
            getResponsiveTiltRadius();
    }

    keepAllEntitiesInsideWorld();
}

function keepAllEntitiesInsideWorld() {
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

    for (const result of ENGINE.voidResults) {
        result.x = clamp(
            result.x,
            result.radius,
            ENGINE.width - result.radius
        );

        result.y = clamp(
            result.y,
            result.radius,
            ENGINE.height - result.radius
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
            140
        );
    }
);

/* ============================================================
   CENTRAL WHITE TILT
============================================================ */

class WhiteTilt {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.baseColor =
            "#eef7ff";

        this.rotation = 0;
        this.pulse = 0;
        this.touchEnergy = 0;
        this.hitEnergy = 0;
    }

    containsPoint(x, y) {
        const hitRadius =
            this.radius + 18;

        return (
            distanceSquared(
                this.x,
                this.y,
                x,
                y
            ) <=
            hitRadius * hitRadius
        );
    }

    registerTouch() {
        this.touchEnergy = 1;
    }

    registerImpact(impactSpeed) {
        this.hitEnergy = clamp(
            this.hitEnergy +
            impactSpeed / 500,
            0,
            1
        );
    }

    update(realDelta, realTime) {
        this.touchEnergy = Math.max(
            0,
            this.touchEnergy -
            realDelta * 2.8
        );

        this.hitEnergy = Math.max(
            0,
            this.hitEnergy -
            realDelta * 2.3
        );

        this.rotation +=
            realDelta *
            (
                0.12 +
                this.touchEnergy * 0.7 +
                this.hitEnergy * 0.4
            );

        this.pulse =
            Math.sin(realTime * 1.8) *
            1.5 +
            this.touchEnergy * 4 +
            this.hitEnergy * 3;
    }

    draw(context, realTime) {
        const radius =
            this.radius +
            this.pulse;

        context.save();

        context.translate(
            this.x,
            this.y
        );

        this.drawAura(
            context,
            radius
        );

        this.drawBody(
            context,
            radius
        );

        this.drawFog(
            context,
            radius,
            realTime
        );

        this.drawVisor(
            context,
            radius
        );

        this.drawGlass(
            context,
            radius
        );

        this.drawSpectrumRing(
            context,
            radius,
            realTime
        );

        context.restore();
    }

    drawAura(context, radius) {
        const auraRadius =
            radius *
            (
                1.65 +
                this.touchEnergy * 0.25
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
                0.16 +
                this.touchEnergy * 0.12
            })`
        );

        aura.addColorStop(
            0.28,
            "rgba(255,60,80,0.08)"
        );

        aura.addColorStop(
            0.48,
            "rgba(60,255,110,0.07)"
        );

        aura.addColorStop(
            0.68,
            "rgba(30,120,255,0.08)"
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
            auraRadius,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    drawBody(context, radius) {
        const body =
            context.createRadialGradient(
                -radius * 0.35,
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
            0.24,
            "#f4fbff"
        );

        body.addColorStop(
            0.62,
            "#cbd9e6"
        );

        body.addColorStop(
            1,
            "#35404d"
        );

        context.fillStyle = body;

        context.shadowColor =
            "#dffaff";

        context.shadowBlur =
            14 +
            this.touchEnergy * 18 +
            this.hitEnergy * 10;

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
            "rgba(255,255,255,1)"
        );

        rim.addColorStop(
            0.3,
            "rgba(0,242,255,0.68)"
        );

        rim.addColorStop(
            0.55,
            "rgba(255,229,46,0.38)"
        );

        rim.addColorStop(
            0.78,
            "rgba(255,43,214,0.48)"
        );

        rim.addColorStop(
            1,
            "rgba(20,25,32,0.9)"
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
    }

    drawFog(
        context,
        radius,
        realTime
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

        const colors = [
            "rgba(255,48,79,0.16)",
            "rgba(36,233,111,0.15)",
            "rgba(25,118,255,0.16)",
            "rgba(255,255,255,0.17)"
        ];

        for (
            let index = 0;
            index < colors.length;
            index += 1
        ) {
            const direction =
                index % 2 === 0
                    ? 1
                    : -1;

            const angle =
                realTime *
                (
                    0.3 +
                    index * 0.07
                ) *
                direction +
                index * 1.55;

            const x =
                Math.cos(angle) *
                radius *
                0.22;

            const y =
                Math.sin(angle * 1.3) *
                radius *
                0.19;

            const size =
                radius *
                (
                    0.26 +
                    index * 0.02
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
                colors[index]
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
            "rgba(4,11,17,0.95)";

        roundedRectPath(
            context,
            -radius * 0.45,
            -radius * 0.17,
            radius * 0.9,
            radius * 0.25,
            6
        );

        context.fill();

        context.strokeStyle =
            "rgba(255,255,255,0.2)";

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
            "rgba(255,48,79,0)"
        );

        eye.addColorStop(
            0.2,
            "#ff304f"
        );

        eye.addColorStop(
            0.4,
            "#24e96f"
        );

        eye.addColorStop(
            0.6,
            "#1976ff"
        );

        eye.addColorStop(
            0.8,
            "#ffffff"
        );

        eye.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        context.fillStyle = eye;

        context.shadowColor =
            "#ffffff";

        context.shadowBlur =
            9 +
            this.touchEnergy * 12;

        context.fillRect(
            -radius * 0.34,
            -radius * 0.09,
            radius * 0.68,
            radius * 0.075
        );

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
            "rgba(255,255,255,0.46)"
        );

        glass.addColorStop(
            0.25,
            "rgba(255,255,255,0.08)"
        );

        glass.addColorStop(
            0.58,
            "rgba(255,255,255,0.01)"
        );

        glass.addColorStop(
            0.9,
            "rgba(0,242,255,0.12)"
        );

        glass.addColorStop(
            1,
            "rgba(0,0,0,0.2)"
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

    drawSpectrumRing(
        context,
        radius,
        realTime
    ) {
        const ringRadius =
            radius * 1.28;

        context.save();

        context.rotate(
            this.rotation +
            realTime * 0.05
        );

        const gradient =
            context.createLinearGradient(
                -ringRadius,
                0,
                ringRadius,
                0
            );

        gradient.addColorStop(
            0,
            "#ff304f"
        );

        gradient.addColorStop(
            0.25,
            "#ffe52e"
        );

        gradient.addColorStop(
            0.5,
            "#24e96f"
        );

        gradient.addColorStop(
            0.72,
            "#00f2ff"
        );

        gradient.addColorStop(
            0.88,
            "#1976ff"
        );

        gradient.addColorStop(
            1,
            "#ff2bd6"
        );

        context.strokeStyle = gradient;

        context.lineWidth =
            2 +
            this.touchEnergy * 1.4;

        context.setLineDash([
            9,
            7
        ]);

        context.lineDashOffset =
            -realTime * 18;

        context.beginPath();

        context.arc(
            0,
            0,
            ringRadius,
            0,
            Math.PI * 2
        );

        context.stroke();

        context.setLineDash([]);

        context.restore();
    }
}

/* ============================================================
   PRIMARY RABBIT
============================================================ */

class PrimaryRabbit {
    constructor(options) {
        this.id =
            ENGINE.nextRabbitId++;

        this.colorId =
            options.colorId;

        this.definition =
            PRIMARY_COLORS[
                this.colorId
            ];

        if (!this.definition) {
            throw new Error(
                `Nepoznata osnovna boja: ${this.colorId}`
            );
        }

        this.baseColor =
            this.definition.hex;

        this.x =
            options.x;

        this.y =
            options.y;

        this.previousX =
            this.x;

        this.previousY =
            this.y;

        this.vx =
            options.vx;

        this.vy =
            options.vy;

        this.radius =
            options.radius;

        this.rotation =
            randomRange(
                -0.18,
                0.18
            );

        this.angularVelocity =
            randomRange(
                -0.55,
                0.55
            );

        this.squashX = 1;
        this.squashY = 1;

        this.squashVelocityX = 0;
        this.squashVelocityY = 0;

        this.impactEnergy = 0;

        this.voidCooldown = 0;
        this.claimedByVoid = null;

        this.motionSeed =
            Math.random() *
            100;

        this.fogPhase =
            Math.random() *
            Math.PI *
            2;
    }

    get isVoidResult() {
        return false;
    }

    get voidImmune() {
        return false;
    }

    registerImpact(
        normalX,
        normalY,
        impactSpeed
    ) {
        const strength =
            clamp(
                impactSpeed / 500,
                0,
                1
            );

        this.impactEnergy = Math.max(
            this.impactEnergy,
            strength
        );

        this.squashVelocityX +=
            Math.abs(normalY) *
            strength *
            0.17;

        this.squashVelocityY +=
            Math.abs(normalX) *
            strength *
            0.17;

        this.angularVelocity +=
            normalX *
            strength *
            randomRange(
                -1.5,
                1.5
            );
    }

    updatePhysics(simulationDelta) {
        this.previousX =
            this.x;

        this.previousY =
            this.y;

        this.voidCooldown = Math.max(
            0,
            this.voidCooldown -
            simulationDelta
        );

        this.vy +=
            CONFIG.gravity *
            simulationDelta;

        this.vx *=
            Math.pow(
                CONFIG.airFriction,
                simulationDelta * 60
            );

        this.vy *=
            Math.pow(
                CONFIG.airFriction,
                simulationDelta * 60
            );

        limitVelocity(
            this,
            CONFIG.rabbitMaxSpeed
        );

        this.x +=
            this.vx *
            simulationDelta;

        this.y +=
            this.vy *
            simulationDelta;

        this.rotation +=
            this.angularVelocity *
            simulationDelta;

        this.angularVelocity *=
            Math.pow(
                0.986,
                simulationDelta * 60
            );
    }

    updateAnimation(realDelta) {
        const spring = 84;

        const damping =
            Math.pow(
                0.72,
                realDelta * 60
            );

        this.squashVelocityX +=
            (1 - this.squashX) *
            spring *
            realDelta;

        this.squashVelocityY +=
            (1 - this.squashY) *
            spring *
            realDelta;

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
            0.76,
            1.28
        );

        this.squashY = clamp(
            this.squashY,
            0.76,
            1.28
        );

        this.impactEnergy = Math.max(
            0,
            this.impactEnergy -
            realDelta * 2.2
        );
    }

    draw(context, realTime) {
        const speed =
            Math.hypot(
                this.vx,
                this.vy
            );

        const speedRatio =
            clamp(
                speed /
                CONFIG.rabbitMaxSpeed,
                0,
                1
            );

        let angle =
            Math.atan2(
                this.vy,
                this.vx
            );

        if (speed < 15) {
            angle =
                this.rotation;
        }

        context.save();

        context.translate(
            this.x,
            this.y
        );

        context.rotate(angle);

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
            realTime
        );

        this.drawShadow(context);
        this.drawBody(context);

        this.drawFog(
            context,
            realTime
        );

        this.drawVisor(context);
        this.drawGlass(context);

        this.drawHighlight(
            context,
            realTime
        );

        context.restore();

        if (CONFIG.debug) {
            this.drawDebug(context);
        }
    }

    drawAura(
        context,
        realTime
    ) {
        const pulse =
            Math.sin(
                realTime * 2.3 +
                this.motionSeed
            ) * 2;

        const radius =
            this.radius +
            12 +
            pulse +
            this.impactEnergy * 7;

        const aura =
            context.createRadialGradient(
                0,
                0,
                this.radius * 0.3,
                0,
                0,
                radius
            );

        aura.addColorStop(
            0,
            hexToRgba(
                this.baseColor,
                0.18
            )
        );

        aura.addColorStop(
            0.55,
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
            radius,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    drawShadow(context) {
        context.fillStyle =
            "rgba(0,0,0,0.24)";

        context.beginPath();

        context.ellipse(
            3,
            this.radius * 0.82,
            this.radius * 0.88,
            this.radius * 0.27,
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
                34
            );

        const middle =
            adjustColor(
                this.baseColor,
                7
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
                this.radius * 1.06
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

        context.fillStyle = gradient;

        context.shadowColor =
            this.baseColor;

        context.shadowBlur =
            10 +
            this.impactEnergy * 10;

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
                    26
                ),
                0.72
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
        realTime
    ) {
        context.save();

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.76,
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
                realTime *
                (
                    0.45 +
                    index * 0.1
                ) *
                direction +
                this.fogPhase +
                index * 1.9;

            const x =
                Math.cos(angle) *
                this.radius *
                0.2;

            const y =
                Math.sin(
                    angle * 1.25
                ) *
                this.radius *
                0.18;

            const size =
                this.radius *
                (
                    0.24 +
                    index * 0.035
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
                    ? "rgba(255,255,255,0.21)"
                    : hexToRgba(
                        this.baseColor,
                        0.22
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
        context.fillStyle =
            "rgba(3,11,17,0.95)";

        roundedRectPath(
            context,
            -this.radius * 0.44,
            -this.radius * 0.16,
            this.radius * 0.88,
            this.radius * 0.24,
            5
        );

        context.fill();

        const eye =
            context.createLinearGradient(
                -this.radius * 0.34,
                0,
                this.radius * 0.34,
                0
            );

        eye.addColorStop(
            0,
            hexToRgba(
                this.baseColor,
                0
            )
        );

        eye.addColorStop(
            0.2,
            this.baseColor
        );

        eye.addColorStop(
            0.5,
            "#ffffff"
        );

        eye.addColorStop(
            0.8,
            this.baseColor
        );

        eye.addColorStop(
            1,
            hexToRgba(
                this.baseColor,
                0
            )
        );

        context.fillStyle = eye;

        context.shadowColor =
            this.baseColor;

        context.shadowBlur = 9;

        context.fillRect(
            -this.radius * 0.33,
            -this.radius * 0.085,
            this.radius * 0.66,
            this.radius * 0.07
        );

        context.shadowBlur = 0;
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
            "rgba(255,255,255,0.43)"
        );

        glass.addColorStop(
            0.22,
            "rgba(255,255,255,0.08)"
        );

        glass.addColorStop(
            0.57,
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
        realTime
    ) {
        const offset =
            Math.sin(
                realTime * 1.25 +
                this.motionSeed
            ) *
            this.radius *
            0.06;

        const highlight =
            context.createRadialGradient(
                -this.radius * 0.32 +
                offset,
                -this.radius * 0.4,
                0,
                -this.radius * 0.32 +
                offset,
                -this.radius * 0.4,
                this.radius * 0.44
            );

        highlight.addColorStop(
            0,
            "rgba(255,255,255,0.5)"
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
            this.radius * 0.3,
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
            this.baseColor;

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

        context.fillStyle =
            "#ffffff";

        context.font =
            "10px monospace";

        context.textAlign =
            "center";

        context.fillText(
            `${this.id}:${this.colorId}`,
            this.x,
            this.y -
            this.radius -
            7
        );

        context.restore();
    }
}

/* ============================================================
   VOID RESULT RABBIT
============================================================ */

class VoidResultRabbit {
    constructor(options) {
        this.id =
            `VOID_RESULT_${ENGINE.nextResultId++}`;

        this.recipe =
            options.recipe;

        this.resultId =
            this.recipe.id;

        this.baseColor =
            this.recipe.hex;

        this.parents = [
            ...this.recipe.parents
        ];

        this.renderProfile =
            this.recipe.renderProfile;

        this.x =
            options.x;

        this.y =
            options.y;

        this.vx =
            options.vx;

        this.vy =
            options.vy;

        this.radius =
            options.radius;

        this.sourceVoidId =
            options.sourceVoidId;

        this.spawnGeneration = 1;

        this.isVoidResult = true;
        this.voidImmune = true;

        this.age = 0;
        this.lifetime =
            CONFIG.resultLifetime;

        this.fadeDuration =
            CONFIG.resultFadeDuration;

        this.isDespawning = false;

        this.rotation =
            Math.random() *
            Math.PI *
            2;

        this.phase =
            Math.random() *
            Math.PI *
            2;

        this.scale = 0.35;
        this.alpha = 0;
    }

    update(
        realDelta,
        simulationDelta
    ) {
        this.age +=
            realDelta;

        const remaining =
            this.lifetime -
            this.age;

        if (
            remaining <=
            this.fadeDuration
        ) {
            this.isDespawning = true;
        }

        const spawnProgress =
            clamp(
                this.age / 0.28,
                0,
                1
            );

        this.scale = lerp(
            this.scale,
            1,
            1 -
            Math.exp(
                -realDelta * 12
            )
        );

        this.alpha = Math.min(
            spawnProgress,
            remaining <=
            this.fadeDuration
                ? clamp(
                    remaining /
                    this.fadeDuration,
                    0,
                    1
                )
                : 1
        );

        this.x +=
            this.vx *
            simulationDelta;

        this.y +=
            this.vy *
            simulationDelta;

        this.vx *=
            Math.pow(
                0.994,
                simulationDelta * 60
            );

        this.vy *=
            Math.pow(
                0.994,
                simulationDelta * 60
            );

        this.rotation +=
            realDelta * 0.7;

        resolveResultWallCollision(this);
    }

    get expired() {
        return (
            this.age >=
            this.lifetime
        );
    }

    draw(context, realTime) {
        context.save();

        context.globalAlpha =
            this.alpha;

        context.translate(
            this.x,
            this.y
        );

        context.rotate(
            this.rotation * 0.12
        );

        context.scale(
            this.scale,
            this.scale
        );

        switch (this.renderProfile) {
            case "SOLAR_FUSION":
                this.drawSolarFusion(
                    context,
                    realTime
                );
                break;

            case "DUAL_SPIRAL":
                this.drawDualSpiral(
                    context,
                    realTime
                );
                break;

            case "AQUA_WAVE":
                this.drawAquaWave(
                    context,
                    realTime
                );
                break;

            default:
                this.drawFallback(
                    context,
                    realTime
                );
                break;
        }

        context.restore();

        if (CONFIG.debug) {
            this.drawDebug(context);
        }
    }

    drawBaseShell(
        context,
        centerColor,
        edgeColor
    ) {
        const body =
            context.createRadialGradient(
                -this.radius * 0.32,
                -this.radius * 0.37,
                this.radius * 0.03,
                0,
                this.radius * 0.09,
                this.radius * 1.05
            );

        body.addColorStop(
            0,
            "#ffffff"
        );

        body.addColorStop(
            0.24,
            centerColor
        );

        body.addColorStop(
            0.68,
            this.baseColor
        );

        body.addColorStop(
            1,
            edgeColor
        );

        context.fillStyle = body;

        context.shadowColor =
            this.baseColor;

        context.shadowBlur = 22;

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
            "rgba(255,255,255,0.72)";

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

    drawResultVisor(
        context,
        eyeColors
    ) {
        context.fillStyle =
            "rgba(4,8,13,0.96)";

        roundedRectPath(
            context,
            -this.radius * 0.45,
            -this.radius * 0.16,
            this.radius * 0.9,
            this.radius * 0.24,
            5
        );

        context.fill();

        const eye =
            context.createLinearGradient(
                -this.radius * 0.34,
                0,
                this.radius * 0.34,
                0
            );

        eye.addColorStop(
            0,
            "rgba(255,255,255,0)"
        );

        for (
            let index = 0;
            index < eyeColors.length;
            index += 1
        ) {
            eye.addColorStop(
                (
                    index + 1
                ) /
                (
                    eyeColors.length + 1
                ),
                eyeColors[index]
            );
        }

        eye.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        context.fillStyle = eye;

        context.shadowColor =
            this.baseColor;

        context.shadowBlur = 12;

        context.fillRect(
            -this.radius * 0.34,
            -this.radius * 0.085,
            this.radius * 0.68,
            this.radius * 0.07
        );

        context.shadowBlur = 0;
    }

    drawSolarFusion(
        context,
        realTime
    ) {
        const pulse =
            1 +
            Math.sin(
                realTime * 6 +
                this.phase
            ) * 0.06;

        context.save();

        context.scale(
            pulse,
            pulse
        );

        const aura =
            context.createRadialGradient(
                0,
                0,
                this.radius * 0.3,
                0,
                0,
                this.radius * 1.8
            );

        aura.addColorStop(
            0,
            "rgba(255,245,100,0.34)"
        );

        aura.addColorStop(
            0.42,
            "rgba(255,130,20,0.14)"
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
            this.radius * 1.8,
            0,
            Math.PI * 2
        );

        context.fill();

        this.drawBaseShell(
            context,
            "#fff8a8",
            "#7a4300"
        );

        context.save();

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.78,
            0,
            Math.PI * 2
        );

        context.clip();

        context.strokeStyle =
            "rgba(255,95,20,0.65)";

        context.lineWidth = 3;

        for (
            let index = 0;
            index < 5;
            index += 1
        ) {
            const angle =
                realTime *
                (
                    0.55 +
                    index * 0.08
                ) +
                index * 1.2;

            context.beginPath();

            context.arc(
                Math.cos(angle) *
                this.radius * 0.15,
                Math.sin(angle) *
                this.radius * 0.14,
                this.radius *
                (
                    0.23 +
                    index * 0.025
                ),
                0,
                Math.PI * 1.35
            );

            context.stroke();
        }

        context.restore();

        this.drawResultVisor(
            context,
            [
                "#ff304f",
                "#ffe52e",
                "#24e96f"
            ]
        );

        context.restore();
    }

    drawDualSpiral(
        context,
        realTime
    ) {
        const aura =
            context.createRadialGradient(
                0,
                0,
                this.radius * 0.2,
                0,
                0,
                this.radius * 1.75
            );

        aura.addColorStop(
            0,
            "rgba(255,43,214,0.34)"
        );

        aura.addColorStop(
            0.45,
            "rgba(110,35,255,0.15)"
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
            this.radius * 1.75,
            0,
            Math.PI * 2
        );

        context.fill();

        this.drawBaseShell(
            context,
            "#ffb3f2",
            "#390050"
        );

        context.save();

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.8,
            0,
            Math.PI * 2
        );

        context.clip();

        context.globalCompositeOperation =
            "screen";

        for (
            let stream = 0;
            stream < 2;
            stream += 1
        ) {
            const direction =
                stream === 0
                    ? 1
                    : -1;

            const color =
                stream === 0
                    ? "#ff304f"
                    : "#1976ff";

            context.strokeStyle =
                hexToRgba(
                    color,
                    0.78
                );

            context.lineWidth = 4;

            context.beginPath();

            for (
                let step = 0;
                step <= 40;
                step += 1
            ) {
                const progress =
                    step / 40;

                const angle =
                    realTime *
                    1.5 *
                    direction +
                    progress *
                    Math.PI *
                    4 *
                    direction;

                const radius =
                    progress *
                    this.radius *
                    0.72;

                const x =
                    Math.cos(angle) *
                    radius;

                const y =
                    Math.sin(angle) *
                    radius;

                if (step === 0) {
                    context.moveTo(
                        x,
                        y
                    );
                } else {
                    context.lineTo(
                        x,
                        y
                    );
                }
            }

            context.stroke();
        }

        context.restore();

        this.drawResultVisor(
            context,
            [
                "#ff304f",
                "#ff2bd6",
                "#1976ff"
            ]
        );
    }

    drawAquaWave(
        context,
        realTime
    ) {
        const aura =
            context.createRadialGradient(
                0,
                0,
                this.radius * 0.22,
                0,
                0,
                this.radius * 1.78
            );

        aura.addColorStop(
            0,
            "rgba(0,242,255,0.34)"
        );

        aura.addColorStop(
            0.45,
            "rgba(0,120,255,0.13)"
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
            this.radius * 1.78,
            0,
            Math.PI * 2
        );

        context.fill();

        this.drawBaseShell(
            context,
            "#b6ffff",
            "#003e52"
        );

        context.save();

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.8,
            0,
            Math.PI * 2
        );

        context.clip();

        context.globalCompositeOperation =
            "screen";

        for (
            let wave = 0;
            wave < 5;
            wave += 1
        ) {
            context.strokeStyle =
                wave % 2 === 0
                    ? "rgba(0,242,255,0.72)"
                    : "rgba(36,233,111,0.55)";

            context.lineWidth =
                2.3;

            context.beginPath();

            for (
                let step = 0;
                step <= 40;
                step += 1
            ) {
                const progress =
                    step / 40;

                const x =
                    -this.radius *
                    0.78 +
                    progress *
                    this.radius *
                    1.56;

                const y =
                    -this.radius *
                    0.45 +
                    wave *
                    this.radius *
                    0.22 +
                    Math.sin(
                        progress *
                        Math.PI *
                        3 +
                        realTime *
                        2 +
                        wave
                    ) *
                    this.radius *
                    0.09;

                if (step === 0) {
                    context.moveTo(
                        x,
                        y
                    );
                } else {
                    context.lineTo(
                        x,
                        y
                    );
                }
            }

            context.stroke();
        }

        context.restore();

        this.drawResultVisor(
            context,
            [
                "#24e96f",
                "#00f2ff",
                "#1976ff"
            ]
        );
    }

    drawFallback(context) {
        this.drawBaseShell(
            context,
            adjustColor(
                this.baseColor,
                28
            ),
            adjustColor(
                this.baseColor,
                -58
            )
        );

        this.drawResultVisor(
            context,
            [this.baseColor]
        );
    }

    drawDebug(context) {
        context.save();

        context.strokeStyle =
            "#ffffff";

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

        context.fillStyle =
            "#ffffff";

        context.font =
            "9px monospace";

        context.textAlign =
            "center";

        context.fillText(
            this.resultId,
            this.x,
            this.y -
            this.radius -
            8
        );

        context.restore();
    }
}

/* ============================================================
   VOID PORTAL
============================================================ */

class VoidPortal {
    constructor(
        index,
        x,
        y,
        radius,
        rotationDirection
    ) {
        this.index = index;

        this.x = x;
        this.y = y;

        this.radius = radius;

        this.rotationDirection =
            rotationDirection;

        this.phase =
            Math.random() *
            Math.PI *
            2;

        this.memory = [];

        this.memoryTimer = 0;
        this.spawnCooldown = 0;

        this.flash = 0;
        this.capturePulse = 0;
    }

    get id() {
        return `VOID_${this.index}`;
    }

    canAcceptRabbit(rabbit) {
        return (
            rabbit &&
            !rabbit.isVoidResult &&
            !rabbit.voidImmune &&
            !rabbit.claimedByVoid &&
            rabbit.voidCooldown <= 0 &&
            this.spawnCooldown <= 0
        );
    }

    containsRabbit(rabbit) {
        const captureRadius =
            this.radius *
            CONFIG.voidCaptureFactor;

        const combined =
            captureRadius +
            rabbit.radius * 0.2;

        return (
            distanceSquared(
                this.x,
                this.y,
                rabbit.x,
                rabbit.y
            ) <=
            combined * combined
        );
    }

    captureRabbit(rabbit) {
        if (!this.canAcceptRabbit(rabbit)) {
            return false;
        }

        rabbit.claimedByVoid =
            this.id;

        rabbit.voidCooldown =
            CONFIG.voidRabbitCooldown;

        const alreadyStored =
            this.memory.includes(
                rabbit.colorId
            );

        if (!alreadyStored) {
            this.memory.push(
                rabbit.colorId
            );

            this.memoryTimer =
                CONFIG.voidMemoryTimeout;

            this.capturePulse = 1;
            this.flash = 1;
        }

        repelRabbitFromVoid(
            rabbit,
            this
        );

        rabbit.claimedByVoid = null;

        if (this.memory.length >= 2) {
            this.trySpawnResult();
        }

        return true;
    }

    trySpawnResult() {
        if (this.memory.length < 2) {
            return false;
        }

        if (
            ENGINE.voidResults.length >=
            CONFIG.maxActiveVoidResults
        ) {
            return false;
        }

        const recipe =
            getRecipe(
                this.memory[0],
                this.memory[1]
            );

        if (!recipe) {
            this.clearMemory();
            return false;
        }

        spawnVoidResult(
            this,
            recipe
        );

        this.spawnCooldown =
            CONFIG.voidSpawnCooldown;

        this.flash = 1.5;

        this.clearMemory();

        return true;
    }

    clearMemory() {
        this.memory.length = 0;
        this.memoryTimer = 0;
    }

    update(realDelta, realTime) {
        this.spawnCooldown = Math.max(
            0,
            this.spawnCooldown -
            realDelta
        );

        this.memoryTimer = Math.max(
            0,
            this.memoryTimer -
            realDelta
        );

        this.flash = Math.max(
            0,
            this.flash -
            realDelta * 2.8
        );

        this.capturePulse = Math.max(
            0,
            this.capturePulse -
            realDelta * 2.3
        );

        if (
            this.memory.length > 0 &&
            this.memoryTimer <= 0
        ) {
            this.clearMemory();
        }

        if (
            this.memory.length >= 2 &&
            this.spawnCooldown <= 0
        ) {
            this.trySpawnResult();
        }

        this.currentPulse =
            Math.sin(
                realTime * 2.3 +
                this.phase
            ) * 2.5 +
            this.flash * 3;
    }

    draw(context, realTime) {
        const outerRadius =
            this.radius +
            this.currentPulse;

        context.save();

        context.translate(
            this.x,
            this.y
        );

        this.drawAura(
            context,
            outerRadius
        );

        this.drawRings(
            context,
            realTime
        );

        this.drawCore(context);

        this.drawMemory(
            context,
            realTime
        );

        context.restore();

        if (CONFIG.debug) {
            this.drawDebug(context);
        }
    }

    drawAura(
        context,
        outerRadius
    ) {
        const aura =
            context.createRadialGradient(
                0,
                0,
                this.radius * 0.2,
                0,
                0,
                outerRadius * 1.48
            );

        aura.addColorStop(
            0,
            "rgba(0,0,0,1)"
        );

        aura.addColorStop(
            0.35,
            "rgba(24,4,46,0.98)"
        );

        aura.addColorStop(
            0.64,
            `rgba(108,34,190,${
                0.34 +
                this.flash * 0.12
            })`
        );

        aura.addColorStop(
            0.84,
            `rgba(0,242,255,${
                0.12 +
                this.flash * 0.08
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
            outerRadius * 1.48,
            0,
            Math.PI * 2
        );

        context.fill();
    }

    drawRings(
        context,
        realTime
    ) {
        context.save();

        context.rotate(
            realTime *
            0.62 *
            this.rotationDirection
        );

        for (
            let ring = 0;
            ring < 4;
            ring += 1
        ) {
            const radius =
                this.radius *
                (
                    0.45 +
                    ring * 0.15
                );

            context.strokeStyle =
                ring % 2 === 0
                    ? `rgba(170,74,255,${
                        0.38 -
                        ring * 0.055
                    })`
                    : `rgba(0,242,255,${
                        0.29 -
                        ring * 0.045
                    })`;

            context.lineWidth =
                Math.max(
                    1,
                    2.8 -
                    ring * 0.42
                );

            context.setLineDash([
                7 + ring * 2,
                10 + ring * 3
            ]);

            context.lineDashOffset =
                realTime *
                22 *
                this.rotationDirection *
                (
                    ring + 1
                );

            context.beginPath();

            context.arc(
                0,
                0,
                radius,
                ring * 0.34,
                Math.PI * 1.42 +
                ring * 0.38
            );

            context.stroke();
        }

        context.restore();

        context.setLineDash([]);
    }

    drawCore(context) {
        const core =
            context.createRadialGradient(
                -this.radius * 0.13,
                -this.radius * 0.14,
                0,
                0,
                0,
                this.radius * 0.7
            );

        core.addColorStop(
            0,
            `rgba(130,45,200,${
                0.24 +
                this.flash * 0.1
            })`
        );

        core.addColorStop(
            0.3,
            "rgba(16,3,29,0.96)"
        );

        core.addColorStop(
            0.72,
            "rgba(1,0,4,1)"
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
            "rgba(190,115,255,0.56)";

        context.lineWidth = 1.4;

        context.beginPath();

        context.arc(
            0,
            0,
            this.radius * 0.68,
            0,
            Math.PI * 2
        );

        context.stroke();
    }

    drawMemory(
        context,
        realTime
    ) {
        if (this.memory.length === 0) {
            return;
        }

        context.save();

        context.globalCompositeOperation =
            "screen";

        for (
            let index = 0;
            index < this.memory.length;
            index += 1
        ) {
            const colorId =
                this.memory[index];

            const definition =
                PRIMARY_COLORS[colorId];

            if (!definition) {
                continue;
            }

            const angle =
                realTime *
                (
                    1.2 +
                    index * 0.3
                ) *
                (
                    index % 2 === 0
                        ? 1
                        : -1
                ) +
                index * Math.PI;

            const orbitRadius =
                this.radius * 0.38;

            const x =
                Math.cos(angle) *
                orbitRadius;

            const y =
                Math.sin(angle) *
                orbitRadius;

            context.fillStyle =
                definition.hex;

            context.shadowColor =
                definition.hex;

            context.shadowBlur = 11;

            context.beginPath();

            context.arc(
                x,
                y,
                4.5,
                0,
                Math.PI * 2
            );

            context.fill();
        }

        context.restore();
    }

    drawDebug(context) {
        context.save();

        context.strokeStyle =
            "#ffffff";

        context.lineWidth = 1;

        context.beginPath();

        context.arc(
            this.x,
            this.y,
            this.radius *
            CONFIG.voidCaptureFactor,
            0,
            Math.PI * 2
        );

        context.stroke();

        context.fillStyle =
            "#ffffff";

        context.font =
            "9px monospace";

        context.textAlign =
            "center";

        context.fillText(
            `${this.id} [${this.memory.join(",")}]`,
            this.x,
            this.y +
            this.radius +
            14
        );

        context.restore();
    }
}

/* ============================================================
   WORLD CREATION
============================================================ */

function getResponsiveRabbitRadius() {
    return clamp(
        ENGINE.width * 0.073,
        22,
        CONFIG.rabbitRadius
    );
}

function getResponsiveTiltRadius() {
    return clamp(
        ENGINE.width * 0.11,
        35,
        CONFIG.tiltRadius
    );
}

function getResponsiveVoidRadius() {
    return clamp(
        ENGINE.width * 0.105,
        31,
        CONFIG.voidRadius
    );
}

function createVoidPortals() {
    const radius =
        getResponsiveVoidRadius();

    const inset = Math.max(
        radius + 7,
        Math.min(
            CONFIG.voidInset,
            ENGINE.width * 0.135
        )
    );

    const oldPortals =
        ENGINE.voidPortals;

    const portalData = [
        {
            index: 0,
            x: inset,
            y: inset,
            direction: 1
        },

        {
            index: 1,
            x: ENGINE.width - inset,
            y: inset,
            direction: -1
        },

        {
            index: 2,
            x: ENGINE.width - inset,
            y: ENGINE.height - inset,
            direction: 1
        },

        {
            index: 3,
            x: inset,
            y: ENGINE.height - inset,
            direction: -1
        }
    ];

    ENGINE.voidPortals =
        portalData.map(data => {
            const existing =
                oldPortals.find(
                    portal =>
                        portal.index ===
                        data.index
                );

            if (existing) {
                existing.x = data.x;
                existing.y = data.y;
                existing.radius = radius;
                existing.rotationDirection =
                    data.direction;

                return existing;
            }

            return new VoidPortal(
                data.index,
                data.x,
                data.y,
                radius,
                data.direction
            );
        });
}

function createTilt() {
    ENGINE.tilt =
        new WhiteTilt(
            ENGINE.width * 0.5,
            ENGINE.height * 0.5,
            getResponsiveTiltRadius()
        );
}

function createPrimaryRabbits() {
    ENGINE.rabbits.length = 0;

    const radius =
        getResponsiveRabbitRadius();

    const definitions = [
        {
            colorId: "RED",
            x: 0.30,
            y: 0.24,
            vx: 125,
            vy: -90
        },

        {
            colorId: "GREEN",
            x: 0.70,
            y: 0.28,
            vx: -115,
            vy: -65
        },

        {
            colorId: "BLUE",
            x: 0.50,
            y: 0.70,
            vx: 90,
            vy: -130
        }
    ];

    for (const definition of definitions) {
        ENGINE.rabbits.push(
            new PrimaryRabbit({
                colorId:
                    definition.colorId,

                x:
                    ENGINE.width *
                    definition.x,

                y:
                    ENGINE.height *
                    definition.y,

                vx:
                    definition.vx,

                vy:
                    definition.vy,

                radius
            })
        );
    }
}

/* ============================================================
   WALL COLLISION
============================================================ */

function resolveRabbitWallCollision(rabbit) {
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
                CONFIG.wallBounce;

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
                CONFIG.wallBounce;

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
                CONFIG.wallBounce;

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
                CONFIG.wallBounce;

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

function resolveResultWallCollision(result) {
    const left =
        CONFIG.wallPadding +
        result.radius;

    const right =
        ENGINE.width -
        CONFIG.wallPadding -
        result.radius;

    const top =
        CONFIG.wallPadding +
        result.radius;

    const bottom =
        ENGINE.height -
        CONFIG.wallPadding -
        result.radius;

    if (result.x < left) {
        result.x = left;
        result.vx =
            Math.abs(result.vx);
    }

    if (result.x > right) {
        result.x = right;
        result.vx =
            -Math.abs(result.vx);
    }

    if (result.y < top) {
        result.y = top;
        result.vy =
            Math.abs(result.vy);
    }

    if (result.y > bottom) {
        result.y = bottom;
        result.vy =
            -Math.abs(result.vy);
    }
}

/* ============================================================
   TILT COLLISION
============================================================ */

function resolveTiltCollision(rabbit) {
    const tilt =
        ENGINE.tilt;

    const dx =
        rabbit.x -
        tilt.x;

    const dy =
        rabbit.y -
        tilt.y;

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
        rabbit.vx *
        normal.x +
        rabbit.vy *
        normal.y;

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

    rabbit.registerImpact(
        normal.x,
        normal.y,
        impactSpeed
    );

    tilt.registerImpact(
        impactSpeed
    );

    limitVelocity(
        rabbit,
        CONFIG.rabbitMaxSpeed
    );
}

/* ============================================================
   RABBIT OVERLAP SYSTEM
============================================================ */

function updateRabbitOverlaps(realDelta) {
    const currentKeys =
        new Set();

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
            const first =
                rabbits[firstIndex];

            const second =
                rabbits[secondIndex];

            const dx =
                second.x -
                first.x;

            const dy =
                second.y -
                first.y;

            const distance =
                Math.hypot(dx, dy);

            const maximumDistance =
                first.radius +
                second.radius;

            if (
                distance >=
                maximumDistance
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

            const key =
                createPairKey(
                    first.id,
                    second.id
                );

            currentKeys.add(key);

            const overlapAmount =
                clamp(
                    (
                        maximumDistance -
                        distance
                    ) /
                    maximumDistance,
                    0,
                    1
                );

            let contact =
                ENGINE.overlaps.get(key);

            if (!contact) {
                contact = {
                    key,
                    firstId:
                        first.id,

                    secondId:
                        second.id,

                    recipe,

                    intensity: 0,
                    targetIntensity:
                        overlapAmount,

                    age: 0,
                    exiting: false
                };

                ENGINE.overlaps.set(
                    key,
                    contact
                );
            }

            contact.recipe =
                recipe;

            contact.targetIntensity =
                overlapAmount;

            contact.age +=
                realDelta;

            contact.exiting = false;
        }
    }

    for (
        const [key, contact]
        of ENGINE.overlaps
    ) {
        if (!currentKeys.has(key)) {
            contact.targetIntensity = 0;
            contact.exiting = true;
        }

        const smoothing =
            1 -
            Math.exp(
                -realDelta * 16
            );

        contact.intensity = lerp(
            contact.intensity,
            contact.targetIntensity,
            smoothing
        );

        if (
            contact.exiting &&
            contact.intensity < 0.015
        ) {
            ENGINE.overlaps.delete(key);
        }
    }

    if (
        ENGINE.overlaps.size >
        CONFIG.overlapGlowLimit
    ) {
        const excess =
            ENGINE.overlaps.size -
            CONFIG.overlapGlowLimit;

        const keys =
            ENGINE.overlaps.keys();

        for (
            let index = 0;
            index < excess;
            index += 1
        ) {
            const next =
                keys.next();

            if (!next.done) {
                ENGINE.overlaps.delete(
                    next.value
                );
            }
        }
    }
}

function drawRabbitOverlaps(
    context,
    realTime
) {
    for (const contact of ENGINE.overlaps.values()) {
        if (
            contact.intensity <=
            0.01
        ) {
            continue;
        }

        const first =
            ENGINE.rabbits.find(
                rabbit =>
                    rabbit.id ===
                    contact.firstId
            );

        const second =
            ENGINE.rabbits.find(
                rabbit =>
                    rabbit.id ===
                    contact.secondId
            );

        if (!first || !second) {
            continue;
        }

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

        const overlapRadius =
            Math.min(
                first.radius,
                second.radius
            ) *
            (
                0.34 +
                contact.intensity *
                0.74
            );

        const pulse =
            1 +
            Math.sin(
                realTime * 6 +
                contact.age * 2
            ) *
            0.05;

        context.save();

        context.globalCompositeOperation =
            "screen";

        const aura =
            context.createRadialGradient(
                midpointX,
                midpointY,
                0,
                midpointX,
                midpointY,
                overlapRadius *
                1.55 *
                pulse
            );

        aura.addColorStop(
            0,
            hexToRgba(
                contact.recipe.hex,
                0.72 *
                contact.intensity
            )
        );

        aura.addColorStop(
            0.42,
            hexToRgba(
                contact.recipe.hex,
                0.32 *
                contact.intensity
            )
        );

        aura.addColorStop(
            1,
            hexToRgba(
                contact.recipe.hex,
                0
            )
        );

        context.fillStyle = aura;

        context.shadowColor =
            contact.recipe.hex;

        context.shadowBlur =
            16 *
            contact.intensity;

        context.beginPath();

        context.arc(
            midpointX,
            midpointY,
            overlapRadius *
            1.55 *
            pulse,
            0,
            Math.PI * 2
        );

        context.fill();

        context.strokeStyle =
            hexToRgba(
                contact.recipe.hex,
                0.78 *
                contact.intensity
            );

        context.lineWidth =
            1.5 +
            contact.intensity *
            2.5;

        context.beginPath();

        context.arc(
            midpointX,
            midpointY,
            overlapRadius *
            pulse,
            0,
            Math.PI * 2
        );

        context.stroke();

        context.restore();
    }
}

/* ============================================================
   VOID CAPTURE
============================================================ */

function repelRabbitFromVoid(
    rabbit,
    portal
) {
    const direction =
        normalizeVector(
            rabbit.x -
            portal.x,
            rabbit.y -
            portal.y
        );

    const safeDirection =
        direction.length < 0.001
            ? normalizeVector(
                ENGINE.width * 0.5 -
                portal.x,
                ENGINE.height * 0.5 -
                portal.y
            )
            : direction;

    rabbit.x =
        portal.x +
        safeDirection.x *
        (
            portal.radius +
            rabbit.radius +
            8
        );

    rabbit.y =
        portal.y +
        safeDirection.y *
        (
            portal.radius +
            rabbit.radius +
            8
        );

    rabbit.vx +=
        safeDirection.x *
        CONFIG.voidRepelForce;

    rabbit.vy +=
        safeDirection.y *
        CONFIG.voidRepelForce -
        35;

    rabbit.squashX = 0.8;
    rabbit.squashY = 1.2;

    rabbit.squashVelocityX = 0.08;
    rabbit.squashVelocityY = -0.08;

    limitVelocity(
        rabbit,
        CONFIG.rabbitMaxSpeed
    );
}

function checkVoidCaptures() {
    for (const rabbit of ENGINE.rabbits) {
        if (
            rabbit.voidCooldown > 0 ||
            rabbit.claimedByVoid
        ) {
            continue;
        }

        for (const portal of ENGINE.voidPortals) {
            if (
                portal.containsRabbit(rabbit) &&
                portal.canAcceptRabbit(rabbit)
            ) {
                portal.captureRabbit(
                    rabbit
                );

                break;
            }
        }
    }
}

function spawnVoidResult(
    portal,
    recipe
) {
    if (
        ENGINE.voidResults.length >=
        CONFIG.maxActiveVoidResults
    ) {
        return false;
    }

    const towardCenter =
        normalizeVector(
            ENGINE.width * 0.5 -
            portal.x,
            ENGINE.height * 0.5 -
            portal.y
        );

    const randomAngle =
        randomRange(
            -0.35,
            0.35
        );

    const cosine =
        Math.cos(randomAngle);

    const sine =
        Math.sin(randomAngle);

    const direction = {
        x:
            towardCenter.x *
            cosine -
            towardCenter.y *
            sine,

        y:
            towardCenter.x *
            sine +
            towardCenter.y *
            cosine
    };

    const radius =
        getResponsiveRabbitRadius() *
        1.05;

    const spawnDistance =
        portal.radius +
        radius +
        14;

    const result =
        new VoidResultRabbit({
            recipe,

            x:
                portal.x +
                direction.x *
                spawnDistance,

            y:
                portal.y +
                direction.y *
                spawnDistance,

            vx:
                direction.x *
                CONFIG.resultDriftSpeed,

            vy:
                direction.y *
                CONFIG.resultDriftSpeed -
                20,

            radius,

            sourceVoidId:
                portal.id
        });

    ENGINE.voidResults.push(
        result
    );

    return true;
}

/* ============================================================
   PHYSICS UPDATE
============================================================ */

function physicsStep(simulationDelta) {
    for (const rabbit of ENGINE.rabbits) {
        rabbit.updatePhysics(
            simulationDelta
        );

        resolveRabbitWallCollision(
            rabbit
        );

        resolveTiltCollision(
            rabbit
        );
    }

    /*
     * NEMA rabbit-to-rabbit čvrstih sudara.
     *
     * Osnovni zečevi su svetlosna bića.
     * Prolaze jedni kroz druge.
     */

    checkVoidCaptures();
}

/* ============================================================
   REAL-TIME UPDATE
============================================================ */

function updateRealTimeSystems(
    realDelta
) {
    ENGINE.tilt.update(
        realDelta,
        ENGINE.realTime
    );

    for (const portal of ENGINE.voidPortals) {
        portal.update(
            realDelta,
            ENGINE.realTime
        );
    }

    for (const rabbit of ENGINE.rabbits) {
        rabbit.updateAnimation(
            realDelta
        );
    }

    const simulationDelta =
        realDelta *
        CONFIG.gameSpeed;

    for (
        let index =
            ENGINE.voidResults.length - 1;
        index >= 0;
        index -= 1
    ) {
        const result =
            ENGINE.voidResults[index];

        result.update(
            realDelta,
            simulationDelta
        );

        if (result.expired) {
            ENGINE.voidResults.splice(
                index,
                1
            );
        }
    }

    updateRabbitOverlaps(
        realDelta
    );

    updateFps(
        realDelta
    );
}

function updateFps(realDelta) {
    ENGINE.fpsFrames += 1;
    ENGINE.fpsAccumulator +=
        realDelta;

    if (
        ENGINE.fpsAccumulator >= 0.5
    ) {
        ENGINE.fps =
            Math.round(
                ENGINE.fpsFrames /
                ENGINE.fpsAccumulator
            );

        ENGINE.fpsFrames = 0;
        ENGINE.fpsAccumulator = 0;
    }
}

/* ============================================================
   BACKGROUND
============================================================ */

function drawBackground(
    context,
    realTime
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
            ) * 0.75
        );

    background.addColorStop(
        0,
        "#15171d"
    );

    background.addColorStop(
        0.42,
        "#090a0e"
    );

    background.addColorStop(
        0.78,
        "#030305"
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
        realTime
    );

    drawColorFog(
        context,
        realTime
    );

    drawVignette(context);
}

function drawGrid(
    context,
    realTime
) {
    const gridSize = 44;

    const offset =
        (
            realTime *
            3
        ) %
        gridSize;

    context.save();

    context.strokeStyle =
        "rgba(120,180,210,0.038)";

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
            offset;
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

function drawColorFog(
    context,
    realTime
) {
    const points = [
        {
            x:
                ENGINE.width *
                0.28 +
                Math.sin(
                    realTime * 0.13
                ) *
                ENGINE.width *
                0.07,

            y:
                ENGINE.height *
                0.34,

            color:
                "rgba(255,48,79,0.035)"
        },

        {
            x:
                ENGINE.width *
                0.72 +
                Math.cos(
                    realTime * 0.15
                ) *
                ENGINE.width *
                0.06,

            y:
                ENGINE.height *
                0.38,

            color:
                "rgba(36,233,111,0.03)"
        },

        {
            x:
                ENGINE.width *
                0.5,

            y:
                ENGINE.height *
                0.68 +
                Math.sin(
                    realTime * 0.12
                ) *
                ENGINE.height *
                0.04,

            color:
                "rgba(25,118,255,0.04)"
        }
    ];

    context.save();

    context.globalCompositeOperation =
        "screen";

    for (const point of points) {
        const fog =
            context.createRadialGradient(
                point.x,
                point.y,
                0,
                point.x,
                point.y,
                ENGINE.width * 0.65
            );

        fog.addColorStop(
            0,
            point.color
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
            ) * 0.2,
            ENGINE.width * 0.5,
            ENGINE.height * 0.5,
            Math.max(
                ENGINE.width,
                ENGINE.height
            ) * 0.74
        );

    vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        0.75,
        "rgba(0,0,0,0.08)"
    );

    vignette.addColorStop(
        1,
        "rgba(0,0,0,0.72)"
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
   DEBUG OVERLAY
============================================================ */

function drawDebugOverlay(context) {
    if (!CONFIG.debug) {
        return;
    }

    const lines = [
        `FPS: ${ENGINE.fps}`,
        `GAME SPEED: ${Math.round(CONFIG.gameSpeed * 100)}%`,
        `PRIMARY: ${ENGINE.rabbits.length}`,
        `VOID RESULTS: ${ENGINE.voidResults.length}/${CONFIG.maxActiveVoidResults}`,
        `OVERLAPS: ${ENGINE.overlaps.size}`,
        `DPR: ${ENGINE.dpr.toFixed(2)}`,
        "D = DEBUG"
    ];

    context.save();

    context.fillStyle =
        "rgba(0,0,0,0.68)";

    context.fillRect(
        9,
        9,
        172,
        16 +
        lines.length * 15
    );

    context.strokeStyle =
        "rgba(0,242,255,0.46)";

    context.strokeRect(
        9,
        9,
        172,
        16 +
        lines.length * 15
    );

    context.fillStyle =
        "#ffffff";

    context.font =
        "11px monospace";

    context.textAlign =
        "left";

    for (
        let index = 0;
        index < lines.length;
        index += 1
    ) {
        context.fillText(
            lines[index],
            17,
            29 +
            index * 15
        );
    }

    context.restore();
}

/* ============================================================
   RENDER
============================================================ */

function renderWorld() {
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

    for (const portal of ENGINE.voidPortals) {
        portal.draw(
            ctx,
            ENGINE.realTime
        );
    }

    /*
     * Osnovni zečevi.
     */
    const sortedPrimary =
        [...ENGINE.rabbits]
            .sort(
                (first, second) =>
                    first.y -
                    second.y
            );

    for (const rabbit of sortedPrimary) {
        rabbit.draw(
            ctx,
            ENGINE.realTime
        );
    }

    /*
     * Kombinacija se crta iznad osnovnih zečeva,
     * samo dok se preklapaju.
     */
    drawRabbitOverlaps(
        ctx,
        ENGINE.realTime
    );

    /*
     * VOID rezultati imaju sopstvene rendere.
     */
    const sortedResults =
        [...ENGINE.voidResults]
            .sort(
                (first, second) =>
                    first.y -
                    second.y
            );

    for (const result of sortedResults) {
        result.draw(
            ctx,
            ENGINE.realTime
        );
    }

    /*
     * Beli TILT je centralni element.
     */
    ENGINE.tilt.draw(
        ctx,
        ENGINE.realTime
    );

    drawDebugOverlay(ctx);
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

function findPrimaryRabbitAt(
    x,
    y
) {
    let selected = null;
    let nearestDistance =
        Infinity;

    for (const rabbit of ENGINE.rabbits) {
        const distance =
            Math.hypot(
                x -
                rabbit.x,

                y -
                rabbit.y
            );

        const hitRadius =
            rabbit.radius +
            CONFIG.pointerHitPadding;

        if (
            distance <= hitRadius &&
            distance <
            nearestDistance
        ) {
            selected = rabbit;
            nearestDistance =
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
        40;

    rabbit.squashX = 1.2;
    rabbit.squashY = 0.8;

    rabbit.squashVelocityX =
        -0.08;

    rabbit.squashVelocityY =
        0.08;

    rabbit.registerImpact(
        -direction.x,
        -direction.y,
        CONFIG.pointerImpulse
    );

    limitVelocity(
        rabbit,
        CONFIG.rabbitMaxSpeed
    );
}

canvas.addEventListener(
    "pointerdown",
    event => {
        event.preventDefault();

        updatePointerFromEvent(
            event
        );

        if (
            ENGINE.tilt.containsPoint(
                POINTER.x,
                POINTER.y
            )
        ) {
            ENGINE.tilt.registerTouch();
            return;
        }

        const rabbit =
            findPrimaryRabbitAt(
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

        let realDelta =
            (
                timestamp -
                ENGINE.lastTimestamp
            ) / 1000;

        ENGINE.lastTimestamp =
            timestamp;

        realDelta = Math.min(
            realDelta,
            CONFIG.maxDelta
        );

        ENGINE.realTime +=
            realDelta;

        const scaledFrameDelta =
            realDelta *
            CONFIG.gameSpeed;

        ENGINE.simulationTime +=
            scaledFrameDelta;

        ENGINE.accumulator +=
            scaledFrameDelta;

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

        /*
         * Ovi sistemi koriste stvarno vreme:
         *
         * - trajanje rezultata od 3 sekunde
         * - fade-out
         * - TILT odziv
         * - VOID cooldown
         * - VOID memory timeout
         * - animacioni smoothing
         */
        updateRealTimeSystems(
            realDelta
        );

        renderWorld();

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
        "WHR COLOR ENGINE ERROR:",
        error
    );

    ctx.setTransform(
        ENGINE.dpr,
        0,
        0,
        ENGINE.dpr,
        0,
        0
    );

    ctx.fillStyle =
        "#050005";

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
        "WHR COLOR ENGINE ERROR",
        ENGINE.width * 0.5,
        ENGINE.height * 0.5 -
        14
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "12px monospace";

    ctx.fillText(
        String(
            error.message ||
            "Nepoznata greška"
        ).slice(0, 54),
        ENGINE.width * 0.5,
        ENGINE.height * 0.5 +
        18
    );
}

/* ============================================================
   INITIALIZATION
============================================================ */

function init() {
    validateColorRecipes();

    resizeCanvas();

    createVoidPortals();
    createTilt();
    createPrimaryRabbits();

    ENGINE.initialized = true;

    updateWorldLayout();

    console.info(
        "WHR COLOR ENGINE v1.0 ONLINE"
    );

    console.info(
        "RGB PARENTS:",
        Object.keys(PRIMARY_COLORS)
    );

    console.info(
        "COLOR RECIPES:",
        COLOR_RECIPES
    );

    window.requestAnimationFrame(
        animationLoop
    );
}

init();
