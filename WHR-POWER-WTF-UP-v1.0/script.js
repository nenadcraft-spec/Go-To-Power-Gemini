"use strict";

/* =========================================================
   WHR: ARENA SURVIVAL v6.0.0
   MOBILE-FIRST STABLE BETA
========================================================= */

/* =========================================================
   DOM
========================================================= */

const DOM = {
    app: document.getElementById("gameApp"),

    screens: {
        start: document.getElementById("startScreen"),
        game: document.getElementById("gameScreen"),
        pause: document.getElementById("pauseScreen"),
        gameOver: document.getElementById("gameOverScreen")
    },

    buttons: {
        start: document.getElementById("startButton"),
        restart: document.getElementById("restartButton"),
        pause: document.getElementById("pauseButton"),
        resume: document.getElementById("resumeButton"),
        quit: document.getElementById("quitButton"),
        menu: document.getElementById("menuButton"),
        sound: document.getElementById("soundButton")
    },

    canvas: document.getElementById("gameCanvas"),
    stage: document.getElementById("gameStage"),
    eventMessage: document.getElementById("eventMessage"),

    hud: {
        score: document.getElementById("scoreValue"),
        lives: document.getElementById("livesValue"),
        timer: document.getElementById("timerValue"),
        level: document.getElementById("levelValue"),

        finalScore: document.getElementById("finalScoreValue"),
        bestScore: document.getElementById("bestScoreValue"),
        finalLevel: document.getElementById("finalLevelValue")
    }
};

const ctx = DOM.canvas
    ? DOM.canvas.getContext("2d", { alpha: false })
    : null;

/* =========================================================
   CONFIGURATION
========================================================= */

const GAME_CONFIG = {
    version: "6.0.0",

    startingLives: 3,
    maximumLives: 5,
    startingTime: 45,

    pointsPerLevel: 1000,

    baseGravity: 165,
    gravityPerLevel: 10,
    maximumGravity: 650,

    baseSpeedMultiplier: 1,
    speedIncreasePerLevel: 0.035,
    maximumSpeedMultiplier: 1.75,

    maximumRabbitVelocity: 760,

    rabbitRadiusDesktop: 37,
    rabbitRadiusMobile: 31,
    minimumRabbitRadius: 27,

    touchHitPadding: 16,

    floorBounce: 385,
    wallBounceLoss: 0.96,
    ceilingBounceLoss: 0.84,

    portalTravelDuration: 0.8,
    portalExitSpeed: 190,

    blackHitCooldown: 0.65,
    bumperSoundCooldown: 0.09,

    maximumLasers: 8,
    laserSpeed: 900,

    freezeDuration: 0.9,
    slowMotionDuration: 1.6,

    respawnDelay: 1.65,

    score: {
        white: 50,
        black: 70,
        blue: 60,
        gold: 100,
        green: 60,
        void: 300,
        bumper: 75
    },

    timeBonus: {
        normal: 0.15,
        gold: 0.4,
        void: 2.2
    },

    redPenalty: {
        time: 2.5,
        score: 150
    }
};

const COLORS = {
    background: "#020205",
    cyan: "#00f5ff",
    green: "#32ff9b",
    red: "#ff315d",
    gold: "#ffe45c",
    blue: "#00a2ff",
    purple: "#9c4dff",
    pink: "#ff2fcf",
    white: "#ffffff"
};

const RABBIT_THEMES = [
    {
        id: "white",
        name: "Deflector White",
        main: COLORS.cyan,
        eye: COLORS.green
    },
    {
        id: "black",
        name: "Glitch Black",
        main: COLORS.pink,
        eye: COLORS.red
    },
    {
        id: "blue",
        name: "Cryo Blue",
        main: COLORS.blue,
        eye: COLORS.white
    },
    {
        id: "gold",
        name: "Overclock Gold",
        main: COLORS.gold,
        eye: "#ff9100"
    },
    {
        id: "red",
        name: "Kinetic Hazard",
        main: COLORS.red,
        eye: COLORS.gold
    },
    {
        id: "green",
        name: "Temporal Green",
        main: COLORS.green,
        eye: COLORS.cyan
    },
    {
        id: "void",
        name: "Void Crown",
        main: COLORS.purple,
        eye: COLORS.pink
    }
];

const BUMPER_THEME = {
    id: "bumper",
    name: "Energy Bumper",
    main: COLORS.white,
    eye: COLORS.cyan
};

/* =========================================================
   AUDIO ENGINE
========================================================= */

class AudioEngine {
    constructor() {
        this.context = null;
        this.enabled = true;
    }

    init() {
        if (!this.enabled) return;

        if (!this.context) {
            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContextClass) return;

            this.context = new AudioContextClass();
        }

        if (this.context.state === "suspended") {
            this.context.resume().catch(() => {});
        }
    }

    setEnabled(enabled) {
        this.enabled = Boolean(enabled);

        if (this.enabled) {
            this.init();
        }
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    playTone({
        type = "sine",
        startFrequency = 440,
        endFrequency = 220,
        duration = 0.1,
        volume = 0.15
    }) {
        if (!this.enabled || !this.context) return;

        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
            Math.max(1, startFrequency),
            now
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(1, endFrequency),
            now + duration
        );

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + duration
        );

        oscillator.connect(gain);
        gain.connect(this.context.destination);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    playHit() {
        this.playTone({
            type: "sawtooth",
            startFrequency: 780,
            endFrequency: 220,
            duration: 0.1,
            volume: 0.16
        });
    }

    playBumper() {
        this.playTone({
            type: "triangle",
            startFrequency: 380,
            endFrequency: 880,
            duration: 0.11,
            volume: 0.18
        });
    }

    playPortal() {
        this.playTone({
            type: "sine",
            startFrequency: 180,
            endFrequency: 720,
            duration: 0.16,
            volume: 0.14
        });
    }

    playBonus() {
        this.playTone({
            type: "sine",
            startFrequency: 330,
            endFrequency: 1250,
            duration: 0.28,
            volume: 0.17
        });
    }

    playDanger() {
        this.playTone({
            type: "square",
            startFrequency: 150,
            endFrequency: 55,
            duration: 0.22,
            volume: 0.17
        });
    }

    playFreeze() {
        this.playTone({
            type: "triangle",
            startFrequency: 900,
            endFrequency: 260,
            duration: 0.22,
            volume: 0.13
        });
    }
}

const audio = new AudioEngine();

/* =========================================================
   GAME STATE
========================================================= */

const state = {
    running: false,
    paused: false,
    gameStarted: false,

    rafId: null,
    lastTimestamp: 0,

    width: 360,
    height: 640,
    dpr: 1,

    score: 0,
    bestScore: loadBestScore(),
    lives: GAME_CONFIG.startingLives,
    timeLeft: GAME_CONFIG.startingTime,
    level: 1,

    speedMultiplier: GAME_CONFIG.baseSpeedMultiplier,

    rabbits: [],
    portals: [],
    bumper: null,
    lasers: [],
    particles: [],
    respawns: [],

    freezeTimer: 0,
    slowMotionTimer: 0,

    portalRotation: 0,

    pointer: {
        x: -100,
        y: -100,
        active: false
    },

    messageTimeout: null
};

/* =========================================================
   STORAGE
========================================================= */

function loadBestScore() {
    try {
        const value = Number(
            localStorage.getItem("whrArenaBestScore")
        );

        return Number.isFinite(value) && value > 0
            ? value
            : 0;
    } catch {
        return 0;
    }
}

function saveBestScore() {
    try {
        localStorage.setItem(
            "whrArenaBestScore",
            String(state.bestScore)
        );
    } catch {
        // Local storage nije obavezan za rad igre.
    }
}

/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function normalizeVector(x, y) {
    const length = Math.hypot(x, y);

    if (length < 0.0001) {
        return { x: 1, y: 0 };
    }

    return {
        x: x / length,
        y: y / length
    };
}

function clampRabbitVelocity(rabbit) {
    const speed = Math.hypot(
        rabbit.velocityX,
        rabbit.velocityY
    );

    if (speed <= GAME_CONFIG.maximumRabbitVelocity) return;

    const scale =
        GAME_CONFIG.maximumRabbitVelocity / speed;

    rabbit.velocityX *= scale;
    rabbit.velocityY *= scale;
}

function isMobileArena() {
    return state.width < 560;
}

function getRabbitRadius() {
    const base = isMobileArena()
        ? GAME_CONFIG.rabbitRadiusMobile
        : GAME_CONFIG.rabbitRadiusDesktop;

    const responsiveLimit =
        Math.min(state.width, state.height) * 0.075;

    return Math.max(
        GAME_CONFIG.minimumRabbitRadius,
        Math.min(base, responsiveLimit)
    );
}

/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function showScreen(screenName) {
    Object.entries(DOM.screens).forEach(([name, screen]) => {
        if (!screen) return;

        screen.classList.toggle(
            "screen--active",
            name === screenName
        );
    });
}

function openPauseOverlay() {
    if (!state.gameStarted || !state.running) return;

    state.paused = true;
    state.running = false;

    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    if (DOM.screens.pause) {
        DOM.screens.pause.classList.add("screen--active");
    }
}

function closePauseOverlay() {
    if (!state.gameStarted || !state.paused) return;

    state.paused = false;
    state.running = true;
    state.lastTimestamp = performance.now();

    if (DOM.screens.pause) {
        DOM.screens.pause.classList.remove("screen--active");
    }

    state.rafId = requestAnimationFrame(gameLoop);
}

function returnToMenu() {
    state.running = false;
    state.paused = false;
    state.gameStarted = false;

    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    if (DOM.screens.pause) {
        DOM.screens.pause.classList.remove("screen--active");
    }

    showScreen("start");
}

/* =========================================================
   CANVAS RESIZE
========================================================= */

function resizeCanvas() {
    if (!DOM.canvas || !DOM.stage || !ctx) return;

    const rect = DOM.stage.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) return;

    const oldWidth = state.width;
    const oldHeight = state.height;

    const newWidth = rect.width;
    const newHeight = rect.height;

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    DOM.canvas.width = Math.round(newWidth * dpr);
    DOM.canvas.height = Math.round(newHeight * dpr);

    DOM.canvas.style.width = `${newWidth}px`;
    DOM.canvas.style.height = `${newHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.width = newWidth;
    state.height = newHeight;
    state.dpr = dpr;

    if (
        state.gameStarted &&
        oldWidth > 0 &&
        oldHeight > 0 &&
        state.rabbits.length > 0
    ) {
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;

        state.rabbits.forEach(rabbit => {
            rabbit.x *= scaleX;
            rabbit.y *= scaleY;

            keepRabbitInsideArena(rabbit);
        });
    }

    createPortals();
    createCenterBumper();
}

/* =========================================================
   PORTALS & BUMPER
========================================================= */

function createPortals() {
    const minimumDimension =
        Math.min(state.width, state.height);

    const radius = clamp(
        minimumDimension * 0.052,
        20,
        34
    );

    const edgeOffset = radius + 4;

    state.portals = [
        {
            id: 0,
            x: edgeOffset,
            y: edgeOffset,
            radius,
            directionX: 1,
            directionY: 1
        },
        {
            id: 1,
            x: state.width - edgeOffset,
            y: edgeOffset,
            radius,
            directionX: -1,
            directionY: 1
        },
        {
            id: 2,
            x: edgeOffset,
            y: state.height - edgeOffset,
            radius,
            directionX: 1,
            directionY: -1
        },
        {
            id: 3,
            x: state.width - edgeOffset,
            y: state.height - edgeOffset,
            radius,
            directionX: -1,
            directionY: -1
        }
    ];
}

function createCenterBumper() {
    const radius = getRabbitRadius() + 4;

    state.bumper = {
        x: state.width / 2,
        y: state.height / 2,
        radius,
        theme: BUMPER_THEME,
        powerGlow: 0,
        pulseAngle: 0,
        soundCooldown: 0,
        rotationAngle: 0
    };
}

/* =========================================================
   RABBIT CREATION & SAFE SPAWN
========================================================= */

function createRabbit(theme, x, y) {
    const direction = Math.random() < 0.5 ? -1 : 1;

    return {
        x,
        y,

        radius: getRabbitRadius(),

        velocityX: direction * randomBetween(38, 65),
        velocityY: randomBetween(-40, -12),

        theme,

        inPortal: false,
        portalTimer: 0,
        entryPortalId: null,

        powerGlow: 0,

        voidStateTimer: randomBetween(2.8, 3.8),
        isPhantom: false,

        rotationAngle: Math.random() * Math.PI * 2,

        hitCooldown: 0
    };
}

function findSafeSpawnPosition(existingRabbits, index) {
    const radius = getRabbitRadius();
    const margin = radius + 18;

    const centerSafeRadius =
        state.bumper.radius + radius + 35;

    for (let attempt = 0; attempt < 100; attempt++) {
        const x = randomBetween(
            margin,
            state.width - margin
        );

        const y = randomBetween(
            margin + 20,
            Math.max(
                margin + 30,
                state.height * 0.42
            )
        );

        const tooCloseToBumper =
            distance(
                x,
                y,
                state.width / 2,
                state.height / 2
            ) < centerSafeRadius;

        if (tooCloseToBumper) continue;

        const tooCloseToPortal =
            state.portals.some(portal => {
                return distance(
                    x,
                    y,
                    portal.x,
                    portal.y
                ) < portal.radius + radius + 15;
            });

        if (tooCloseToPortal) continue;

        const overlapsRabbit =
            existingRabbits.some(rabbit => {
                return distance(
                    x,
                    y,
                    rabbit.x,
                    rabbit.y
                ) < radius + rabbit.radius + 12;
            });

        if (!overlapsRabbit) {
            return { x, y };
        }
    }

    const columns = isMobileArena() ? 3 : 4;
    const row = Math.floor(index / columns);
    const column = index % columns;

    return {
        x:
            ((column + 1) / (columns + 1)) *
            state.width,
        y:
            radius +
            35 +
            row * (radius * 2.3)
    };
}

function createInitialRabbits() {
    state.rabbits = [];

    RABBIT_THEMES.forEach((theme, index) => {
        const position = findSafeSpawnPosition(
            state.rabbits,
            index
        );

        state.rabbits.push(
            createRabbit(
                theme,
                position.x,
                position.y
            )
        );
    });
}

/* =========================================================
   GAME START & END
========================================================= */

function startNewGame() {
    audio.init();

    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    showScreen("game");

    requestAnimationFrame(() => {
        resizeCanvas();

        state.score = 0;
        state.lives = GAME_CONFIG.startingLives;
        state.timeLeft = GAME_CONFIG.startingTime;
        state.level = 1;

        state.speedMultiplier =
            GAME_CONFIG.baseSpeedMultiplier;

        state.freezeTimer = 0;
        state.slowMotionTimer = 0;

        state.lasers = [];
        state.particles = [];
        state.respawns = [];

        state.portalRotation = 0;

        createPortals();
        createCenterBumper();
        createInitialRabbits();

        state.gameStarted = true;
        state.paused = false;
        state.running = true;
        state.lastTimestamp = performance.now();

        updateHUD();

        state.rafId = requestAnimationFrame(gameLoop);
    });
}

function triggerGameOver() {
    if (!state.gameStarted) return;

    state.running = false;
    state.paused = false;
    state.gameStarted = false;

    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    if (state.score > state.bestScore) {
        state.bestScore = state.score;
        saveBestScore();
    }

    if (DOM.hud.finalScore) {
        DOM.hud.finalScore.textContent =
            String(state.score);
    }

    if (DOM.hud.bestScore) {
        DOM.hud.bestScore.textContent =
            String(state.bestScore);
    }

    if (DOM.hud.finalLevel) {
        DOM.hud.finalLevel.textContent =
            String(state.level);
    }

    showScreen("gameOver");
}

/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {
    if (!state.running || state.paused) return;

    const rawDelta =
        (timestamp - state.lastTimestamp) / 1000;

    const delta = clamp(rawDelta, 0, 0.033);

    state.lastTimestamp = timestamp;

    updateGame(delta);
    renderGame();

    if (state.running && !state.paused) {
        state.rafId = requestAnimationFrame(gameLoop);
    }
}

function updateGame(delta) {
    state.timeLeft -= delta;

    if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        updateHUD();
        triggerGameOver();
        return;
    }

    state.portalRotation += delta * 3.8;

    updateTimers(delta);
    updateRespawns(delta);
    updateLasers(delta);
    updateParticles(delta);
    updateBumper(delta);

    resolveBumperCollisions();
    resolveRabbitCollisions();

    updateRabbits(delta);
    updateLevel();
    updateHUD();
}

/* =========================================================
   TIMER UPDATES
========================================================= */

function updateTimers(delta) {
    state.freezeTimer = Math.max(
        0,
        state.freezeTimer - delta
    );

    state.slowMotionTimer = Math.max(
        0,
        state.slowMotionTimer - delta
    );

    state.rabbits.forEach(rabbit => {
        rabbit.powerGlow = Math.max(
            0,
            rabbit.powerGlow - delta * 2.5
        );

        rabbit.hitCooldown = Math.max(
            0,
            rabbit.hitCooldown - delta
        );
    });
}

function updateBumper(delta) {
    if (!state.bumper) return;

    state.bumper.pulseAngle += delta * 3.5;
    state.bumper.rotationAngle += delta * 0.5;

    state.bumper.powerGlow = Math.max(
        0,
        state.bumper.powerGlow - delta * 3
    );

    state.bumper.soundCooldown = Math.max(
        0,
        state.bumper.soundCooldown - delta
    );
}

/* =========================================================
   RESPAWNS
========================================================= */

function updateRespawns(delta) {
    for (
        let index = state.respawns.length - 1;
        index >= 0;
        index--
    ) {
        const respawn = state.respawns[index];

        respawn.delay -= delta;

        if (respawn.delay > 0) continue;

        const portal =
            state.portals[
                Math.floor(
                    Math.random() *
                    state.portals.length
                )
            ];

        const rabbit = createRabbit(
            respawn.theme,
            portal.x,
            portal.y
        );

        const direction = normalizeVector(
            portal.directionX,
            portal.directionY
        );

        const exitDistance =
            portal.radius + rabbit.radius + 10;

        rabbit.x =
            portal.x +
            direction.x * exitDistance;

        rabbit.y =
            portal.y +
            direction.y * exitDistance;

        rabbit.velocityX =
            direction.x *
            GAME_CONFIG.portalExitSpeed;

        rabbit.velocityY =
            direction.y *
            GAME_CONFIG.portalExitSpeed;

        keepRabbitInsideArena(rabbit);

        state.rabbits.push(rabbit);
        state.respawns.splice(index, 1);

        audio.playPortal();
    }
}

/* =========================================================
   LASERS & PARTICLES
========================================================= */

function updateLasers(delta) {
    for (
        let index = state.lasers.length - 1;
        index >= 0;
        index--
    ) {
        const laser = state.lasers[index];

        laser.life -= delta;

        laser.headX += laser.velocityX * delta;
        laser.headY += laser.velocityY * delta;

        const normalized = normalizeVector(
            laser.velocityX,
            laser.velocityY
        );

        laser.tailX =
            laser.headX - normalized.x * 38;

        laser.tailY =
            laser.headY - normalized.y * 38;

        if (
            laser.life <= 0 ||
            laser.headX < -60 ||
            laser.headX > state.width + 60 ||
            laser.headY < -60 ||
            laser.headY > state.height + 60
        ) {
            state.lasers.splice(index, 1);
        }
    }
}

function createParticles(
    x,
    y,
    color,
    amount = 8,
    speed = 130
) {
    for (let index = 0; index < amount; index++) {
        const angle =
            Math.random() * Math.PI * 2;

        const particleSpeed =
            randomBetween(speed * 0.45, speed);

        state.particles.push({
            x,
            y,

            velocityX:
                Math.cos(angle) * particleSpeed,

            velocityY:
                Math.sin(angle) * particleSpeed,

            life: randomBetween(0.25, 0.55),
            maximumLife: 0.55,

            radius: randomBetween(1.5, 3.5),

            color
        });
    }

    if (state.particles.length > 140) {
        state.particles.splice(
            0,
            state.particles.length - 140
        );
    }
}

function updateParticles(delta) {
    for (
        let index = state.particles.length - 1;
        index >= 0;
        index--
    ) {
        const particle = state.particles[index];

        particle.life -= delta;

        particle.x += particle.velocityX * delta;
        particle.y += particle.velocityY * delta;

        particle.velocityX *= 0.98;
        particle.velocityY *= 0.98;

        if (particle.life <= 0) {
            state.particles.splice(index, 1);
        }
    }
}

/* =========================================================
   BUMPER COLLISIONS
========================================================= */

function resolveBumperCollisions() {
    if (!state.bumper) return;

    const bumper = state.bumper;

    state.rabbits.forEach(rabbit => {
        if (rabbit.inPortal) return;

        const dx = rabbit.x - bumper.x;
        const dy = rabbit.y - bumper.y;

        const currentDistance = Math.hypot(dx, dy);
        const minimumDistance =
            rabbit.radius + bumper.radius;

        if (currentDistance >= minimumDistance) return;

        const normal = normalizeVector(dx, dy);

        const overlap =
            minimumDistance - currentDistance;

        rabbit.x += normal.x * overlap;
        rabbit.y += normal.y * overlap;

        const incomingSpeed = Math.hypot(
            rabbit.velocityX,
            rabbit.velocityY
        );

        const bounceSpeed = clamp(
            Math.max(250, incomingSpeed * 1.28),
            250,
            GAME_CONFIG.maximumRabbitVelocity
        );

        rabbit.velocityX =
            normal.x * bounceSpeed;

        rabbit.velocityY =
            normal.y * bounceSpeed;

        clampRabbitVelocity(rabbit);

        bumper.powerGlow = 1;

        createParticles(
            rabbit.x,
            rabbit.y,
            rabbit.theme.main,
            5,
            90
        );

        if (bumper.soundCooldown <= 0) {
            audio.playBumper();

            bumper.soundCooldown =
                GAME_CONFIG.bumperSoundCooldown;
        }
    });
}

/* =========================================================
   RABBIT COLLISIONS
========================================================= */

function resolveRabbitCollisions() {
    for (
        let firstIndex = 0;
        firstIndex < state.rabbits.length;
        firstIndex++
    ) {
        for (
            let secondIndex = firstIndex + 1;
            secondIndex < state.rabbits.length;
            secondIndex++
        ) {
            const first = state.rabbits[firstIndex];
            const second = state.rabbits[secondIndex];

            if (first.inPortal || second.inPortal) {
                continue;
            }

            resolveSingleRabbitCollision(
                first,
                second
            );
        }
    }
}

function resolveSingleRabbitCollision(first, second) {
    const dx = second.x - first.x;
    const dy = second.y - first.y;

    const currentDistance = Math.hypot(dx, dy);
    const minimumDistance =
        first.radius + second.radius;

    if (
        currentDistance <= 0 ||
        currentDistance >= minimumDistance
    ) {
        return;
    }

    const normalX = dx / currentDistance;
    const normalY = dy / currentDistance;

    const overlap =
        minimumDistance - currentDistance;

    first.x -= normalX * overlap * 0.5;
    first.y -= normalY * overlap * 0.5;

    second.x += normalX * overlap * 0.5;
    second.y += normalY * overlap * 0.5;

    const relativeVelocityX =
        second.velocityX - first.velocityX;

    const relativeVelocityY =
        second.velocityY - first.velocityY;

    const velocityAlongNormal =
        relativeVelocityX * normalX +
        relativeVelocityY * normalY;

    if (velocityAlongNormal > 0) return;

    const restitution = 0.92;

    const impulse =
        -((1 + restitution) *
        velocityAlongNormal) / 2;

    const impulseX = impulse * normalX;
    const impulseY = impulse * normalY;

    first.velocityX -= impulseX;
    first.velocityY -= impulseY;

    second.velocityX += impulseX;
    second.velocityY += impulseY;

    clampRabbitVelocity(first);
    clampRabbitVelocity(second);
}

/* =========================================================
   RABBIT PHYSICS
========================================================= */

function updateRabbits(delta) {
    const gravity = Math.min(
        GAME_CONFIG.maximumGravity,
        GAME_CONFIG.baseGravity +
        (state.level - 1) *
        GAME_CONFIG.gravityPerLevel
    );

    const slowMultiplier =
        state.slowMotionTimer > 0
            ? 0.52
            : 1;

    const movementMultiplier =
        state.speedMultiplier * slowMultiplier;

    for (
        let index = state.rabbits.length - 1;
        index >= 0;
        index--
    ) {
        const rabbit = state.rabbits[index];

        updateVoidRabbit(rabbit, delta);

        if (rabbit.inPortal) {
            updateRabbitInsidePortal(rabbit, delta);
            continue;
        }

        const speed = Math.hypot(
            rabbit.velocityX,
            rabbit.velocityY
        );

        rabbit.rotationAngle +=
            delta * (0.5 + speed * 0.0025);

        if (state.freezeTimer <= 0) {
            rabbit.velocityY += gravity * delta;

            rabbit.x +=
                rabbit.velocityX *
                movementMultiplier *
                delta;

            rabbit.y +=
                rabbit.velocityY *
                movementMultiplier *
                delta;
        }

        checkPortalEntry(rabbit);

        if (!rabbit.inPortal) {
            resolveArenaBoundaries(rabbit);
        }

        clampRabbitVelocity(rabbit);
    }
}

function updateVoidRabbit(rabbit, delta) {
    if (rabbit.theme.id !== "void") return;

    rabbit.voidStateTimer -= delta;

    if (rabbit.voidStateTimer <= 0) {
        rabbit.isPhantom = !rabbit.isPhantom;

        rabbit.voidStateTimer =
            rabbit.isPhantom
                ? randomBetween(1.8, 2.6)
                : randomBetween(2.7, 3.7);
    }

    if (rabbit.inPortal || state.freezeTimer > 0) {
        return;
    }

    state.rabbits.forEach(other => {
        if (
            other === rabbit ||
            other.inPortal
        ) {
            return;
        }

        const dx = rabbit.x - other.x;
        const dy = rabbit.y - other.y;

        const currentDistance =
            Math.hypot(dx, dy);

        if (
            currentDistance < 20 ||
            currentDistance > 200
        ) {
            return;
        }

        const normal = normalizeVector(dx, dy);

        const pullStrength =
            (200 - currentDistance) * 0.8;

        other.velocityX +=
            normal.x *
            pullStrength *
            delta;

        other.velocityY +=
            normal.y *
            pullStrength *
            delta;

        clampRabbitVelocity(other);
    });
}

function checkPortalEntry(rabbit) {
    if (
        rabbit.theme.id === "void" ||
        rabbit.inPortal
    ) {
        return;
    }

    for (const portal of state.portals) {
        const triggerRadius =
            portal.radius +
            rabbit.radius * 0.35;

        if (
            distance(
                rabbit.x,
                rabbit.y,
                portal.x,
                portal.y
            ) < triggerRadius
        ) {
            rabbit.inPortal = true;
            rabbit.portalTimer =
                GAME_CONFIG.portalTravelDuration;

            rabbit.entryPortalId = portal.id;

            rabbit.x = portal.x;
            rabbit.y = portal.y;

            audio.playPortal();

            return;
        }
    }
}

function updateRabbitInsidePortal(rabbit, delta) {
    rabbit.portalTimer -= delta;

    if (rabbit.portalTimer > 0) return;

    const availablePortals =
        state.portals.filter(
            portal =>
                portal.id !== rabbit.entryPortalId
        );

    const exitPortal =
        availablePortals[
            Math.floor(
                Math.random() *
                availablePortals.length
            )
        ];

    const direction = normalizeVector(
        exitPortal.directionX,
        exitPortal.directionY
    );

    const exitDistance =
        exitPortal.radius +
        rabbit.radius +
        10;

    rabbit.x =
        exitPortal.x +
        direction.x * exitDistance;

    rabbit.y =
        exitPortal.y +
        direction.y * exitDistance;

    rabbit.velocityX =
        direction.x *
        GAME_CONFIG.portalExitSpeed;

    rabbit.velocityY =
        direction.y *
        GAME_CONFIG.portalExitSpeed;

    rabbit.inPortal = false;
    rabbit.entryPortalId = null;

    keepRabbitInsideArena(rabbit);

    audio.playPortal();
}

function resolveArenaBoundaries(rabbit) {
    if (rabbit.x - rabbit.radius < 0) {
        rabbit.x = rabbit.radius;

        rabbit.velocityX =
            Math.abs(rabbit.velocityX) *
            GAME_CONFIG.wallBounceLoss;
    }

    if (rabbit.x + rabbit.radius > state.width) {
        rabbit.x =
            state.width - rabbit.radius;

        rabbit.velocityX =
            -Math.abs(rabbit.velocityX) *
            GAME_CONFIG.wallBounceLoss;
    }

    if (rabbit.y - rabbit.radius < 0) {
        rabbit.y = rabbit.radius;

        rabbit.velocityY =
            Math.abs(rabbit.velocityY) *
            GAME_CONFIG.ceilingBounceLoss;
    }

    if (
        rabbit.y + rabbit.radius >
        state.height
    ) {
        rabbit.y =
            state.height - rabbit.radius;

        rabbit.velocityY =
            -GAME_CONFIG.floorBounce;
    }
}

function keepRabbitInsideArena(rabbit) {
    rabbit.x = clamp(
        rabbit.x,
        rabbit.radius,
        state.width - rabbit.radius
    );

    rabbit.y = clamp(
        rabbit.y,
        rabbit.radius,
        state.height - rabbit.radius
    );
}

/* =========================================================
   LEVEL SYSTEM
========================================================= */

function updateLevel() {
    const newLevel =
        Math.floor(
            state.score /
            GAME_CONFIG.pointsPerLevel
        ) + 1;

    if (newLevel <= state.level) return;

    state.level = newLevel;

    state.speedMultiplier = Math.min(
        GAME_CONFIG.maximumSpeedMultiplier,
        GAME_CONFIG.baseSpeedMultiplier +
        (state.level - 1) *
        GAME_CONFIG.speedIncreasePerLevel
    );

    showEventMessage(
        `LEVEL ${state.level}`,
        "bonus"
    );

    createParticles(
        state.width / 2,
        state.height * 0.25,
        COLORS.green,
        20,
        180
    );
}

/* =========================================================
   INPUT
========================================================= */

function handleTargetInteraction(clientX, clientY) {
    if (
        !state.running ||
        state.paused ||
        !DOM.canvas
    ) {
        return;
    }

    const rect =
        DOM.canvas.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (tryHitBumper(x, y)) {
        updateLevel();
        updateHUD();
        return;
    }

    for (
        let index = state.rabbits.length - 1;
        index >= 0;
        index--
    ) {
        const rabbit = state.rabbits[index];

        if (rabbit.inPortal) continue;

        const hitRadius =
            rabbit.radius +
            GAME_CONFIG.touchHitPadding;

        if (
            distance(
                x,
                y,
                rabbit.x,
                rabbit.y
            ) > hitRadius
        ) {
            continue;
        }

        handleRabbitHit(rabbit, index, x, y);

        updateLevel();
        updateHUD();

        return;
    }
}

function tryHitBumper(x, y) {
    if (!state.bumper) return false;

    const hitRadius =
        state.bumper.radius +
        GAME_CONFIG.touchHitPadding;

    if (
        distance(
            x,
            y,
            state.bumper.x,
            state.bumper.y
        ) > hitRadius
    ) {
        return false;
    }

    state.score += GAME_CONFIG.score.bumper;
    state.bumper.powerGlow = 1;

    audio.playBumper();

    createParticles(
        state.bumper.x,
        state.bumper.y,
        COLORS.white,
        14,
        180
    );

    state.rabbits.forEach(rabbit => {
        if (rabbit.inPortal) return;

        const dx =
            rabbit.x - state.bumper.x;

        const dy =
            rabbit.y - state.bumper.y;

        const currentDistance =
            Math.hypot(dx, dy);

        if (
            currentDistance <= 0 ||
            currentDistance > 220
        ) {
            return;
        }

        const normal = normalizeVector(dx, dy);

        const impulse =
            250 +
            (220 - currentDistance) * 0.9;

        rabbit.velocityX +=
            normal.x * impulse;

        rabbit.velocityY +=
            normal.y * impulse;

        clampRabbitVelocity(rabbit);
    });

    showEventMessage(
        `BUMPER +${GAME_CONFIG.score.bumper}`,
        "bonus"
    );

    return true;
}

/* =========================================================
   RABBIT HIT RULES
========================================================= */

function handleRabbitHit(
    rabbit,
    rabbitIndex,
    clickX,
    clickY
) {
    if (rabbit.hitCooldown > 0) return;

    if (
        rabbit.theme.id === "void" &&
        rabbit.isPhantom
    ) {
        handlePhantomVoidMiss(rabbit);
        return;
    }

    switch (rabbit.theme.id) {
        case "red":
            handleRedHazard(rabbit);
            break;

        case "black":
            handleBlackRabbit(rabbit);
            break;

        case "void":
            handleVoidRabbit(
                rabbit,
                clickX,
                clickY
            );
            break;

        default:
            handleStandardRabbit(
                rabbit,
                rabbitIndex
            );
            break;
    }
}

function handleStandardRabbit(rabbit, index) {
    const scoreValue =
        GAME_CONFIG.score[rabbit.theme.id] ||
        GAME_CONFIG.score.white;

    state.score += scoreValue;

    if (rabbit.theme.id === "gold") {
        state.timeLeft +=
            GAME_CONFIG.timeBonus.gold;
    } else {
        state.timeLeft +=
            GAME_CONFIG.timeBonus.normal;
    }

    audio.playHit();

    triggerRabbitPower(rabbit);

    createParticles(
        rabbit.x,
        rabbit.y,
        rabbit.theme.main,
        rabbit.theme.id === "gold" ? 14 : 9,
        rabbit.theme.id === "gold" ? 190 : 130
    );

    showEventMessage(
        `${rabbit.theme.name} +${scoreValue}`,
        "bonus"
    );

    state.rabbits.splice(index, 1);

    state.respawns.push({
        theme: rabbit.theme,
        delay: GAME_CONFIG.respawnDelay
    });
}

function handleBlackRabbit(rabbit) {
    rabbit.hitCooldown =
        GAME_CONFIG.blackHitCooldown;

    state.score += GAME_CONFIG.score.black;
    state.timeLeft += GAME_CONFIG.timeBonus.normal;

    rabbit.powerGlow = 1;

    audio.playHit();

    triggerBlackGlitchPower(rabbit);

    createParticles(
        rabbit.x,
        rabbit.y,
        rabbit.theme.main,
        10,
        150
    );

    showEventMessage(
        `GLITCH +${GAME_CONFIG.score.black}`,
        "bonus"
    );
}

function handleRedHazard(rabbit) {
    state.lives -= 1;

    state.score = Math.max(
        0,
        state.score -
        GAME_CONFIG.redPenalty.score
    );

    state.timeLeft = Math.max(
        0,
        state.timeLeft -
        GAME_CONFIG.redPenalty.time
    );

    rabbit.powerGlow = 1;
    rabbit.hitCooldown = 0.8;

    audio.playDanger();

    triggerRedHazardBlast(rabbit);

    createParticles(
        rabbit.x,
        rabbit.y,
        COLORS.red,
        18,
        220
    );

    showEventMessage(
        `DANGER! -1 LIFE`,
        "danger"
    );

    if (
        state.lives <= 0 ||
        state.timeLeft <= 0
    ) {
        state.lives = Math.max(0, state.lives);
        triggerGameOver();
    }
}

function handleVoidRabbit(
    rabbit,
    clickX,
    clickY
) {
    state.score += GAME_CONFIG.score.void;

    state.timeLeft +=
        GAME_CONFIG.timeBonus.void;

    if (
        state.lives <
        GAME_CONFIG.maximumLives
    ) {
        state.lives += 1;
    }

    state.slowMotionTimer = 1.2;

    rabbit.powerGlow = 1;
    rabbit.hitCooldown = 0.55;

    const awayFromCenter = normalizeVector(
        rabbit.x - state.width / 2,
        rabbit.y - state.height / 2
    );

    const clickDirection = normalizeVector(
        rabbit.x - clickX,
        rabbit.y - clickY
    );

    const directionX =
        awayFromCenter.x * 0.75 +
        clickDirection.x * 0.25;

    const directionY =
        awayFromCenter.y * 0.75 +
        clickDirection.y * 0.25;

    const finalDirection =
        normalizeVector(directionX, directionY);

    rabbit.velocityX =
        finalDirection.x * 360;

    rabbit.velocityY =
        finalDirection.y * 360;

    clampRabbitVelocity(rabbit);

    audio.playBonus();

    createParticles(
        rabbit.x,
        rabbit.y,
        rabbit.theme.main,
        22,
        230
    );

    showEventMessage(
        `VOID JACKPOT +${GAME_CONFIG.score.void}`,
        "bonus"
    );
}

function handlePhantomVoidMiss(rabbit) {
    state.lives -= 1;

    state.timeLeft = Math.max(
        0,
        state.timeLeft - 1.5
    );

    rabbit.hitCooldown = 0.6;

    audio.playDanger();

    createParticles(
        rabbit.x,
        rabbit.y,
        COLORS.purple,
        10,
        120
    );

    showEventMessage(
        "PHANTOM VOID! -1 LIFE",
        "danger"
    );

    if (
        state.lives <= 0 ||
        state.timeLeft <= 0
    ) {
        state.lives = Math.max(0, state.lives);
        triggerGameOver();
    }
}

/* =========================================================
   RABBIT POWERS
========================================================= */

function triggerRabbitPower(rabbit) {
    switch (rabbit.theme.id) {
        case "white":
            triggerWhiteDeflector(rabbit);
            break;

        case "blue":
            state.freezeTimer =
                GAME_CONFIG.freezeDuration;

            audio.playFreeze();

            showEventMessage(
                "CRYO FREEZE",
                "bonus"
            );
            break;

        case "gold":
            triggerGoldLasers(rabbit);
            break;

        case "green":
            state.slowMotionTimer =
                GAME_CONFIG.slowMotionDuration;

            showEventMessage(
                "TEMPORAL SLOW",
                "bonus"
            );
            break;
    }
}

function triggerWhiteDeflector(sourceRabbit) {
    const radius = 220;

    state.rabbits.forEach(other => {
        if (
            other === sourceRabbit ||
            other.inPortal
        ) {
            return;
        }

        const dx = other.x - sourceRabbit.x;
        const dy = other.y - sourceRabbit.y;

        const currentDistance =
            Math.hypot(dx, dy);

        if (
            currentDistance <= 0 ||
            currentDistance > radius
        ) {
            return;
        }

        const normal = normalizeVector(dx, dy);

        const impulse =
            180 +
            (radius - currentDistance) * 1.3;

        other.velocityX +=
            normal.x * impulse;

        other.velocityY +=
            normal.y * impulse;

        clampRabbitVelocity(other);
    });
}

function triggerBlackGlitchPower(sourceRabbit) {
    const margin =
        sourceRabbit.radius + 28;

    sourceRabbit.x = randomBetween(
        margin,
        state.width - margin
    );

    sourceRabbit.y = randomBetween(
        margin,
        Math.max(
            margin + 10,
            state.height * 0.42
        )
    );

    sourceRabbit.velocityX =
        (Math.random() < 0.5 ? -1 : 1) *
        randomBetween(150, 210);

    sourceRabbit.velocityY =
        randomBetween(-110, -55);

    state.rabbits.forEach(other => {
        if (
            other === sourceRabbit ||
            other.inPortal
        ) {
            return;
        }

        other.velocityX *= 1.12;
        other.velocityY *= 1.12;

        clampRabbitVelocity(other);
    });
}

function triggerRedHazardBlast(sourceRabbit) {
    const radius = 250;

    state.rabbits.forEach(other => {
        if (
            other === sourceRabbit ||
            other.inPortal
        ) {
            return;
        }

        const dx = other.x - sourceRabbit.x;
        const dy = other.y - sourceRabbit.y;

        const currentDistance =
            Math.hypot(dx, dy);

        if (
            currentDistance <= 0 ||
            currentDistance > radius
        ) {
            return;
        }

        const normal = normalizeVector(dx, dy);

        const impulse =
            220 +
            (radius - currentDistance) * 1.1;

        other.velocityX +=
            normal.x * impulse;

        other.velocityY +=
            normal.y * impulse;

        clampRabbitVelocity(other);
    });
}

function triggerGoldLasers(sourceRabbit) {
    if (
        state.lasers.length + 4 >
        GAME_CONFIG.maximumLasers
    ) {
        return;
    }

    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    directions.forEach(direction => {
        const startDistance =
            sourceRabbit.radius + 10;

        const startX =
            sourceRabbit.x +
            direction.x * startDistance;

        const startY =
            sourceRabbit.y +
            direction.y * startDistance;

        state.lasers.push({
            headX: startX,
            headY: startY,

            tailX: startX,
            tailY: startY,

            velocityX:
                direction.x *
                GAME_CONFIG.laserSpeed,

            velocityY:
                direction.y *
                GAME_CONFIG.laserSpeed,

            life: 0.55
        });
    });

    audio.playBonus();
}

/* =========================================================
   EVENT MESSAGE
========================================================= */

function showEventMessage(text, type = "normal") {
    if (!DOM.eventMessage) return;

    clearTimeout(state.messageTimeout);

    DOM.eventMessage.textContent = text;

    DOM.eventMessage.classList.remove(
        "event-message--danger",
        "event-message--bonus"
    );

    if (type === "danger") {
        DOM.eventMessage.classList.add(
            "event-message--danger"
        );
    }

    if (type === "bonus") {
        DOM.eventMessage.classList.add(
            "event-message--bonus"
        );
    }

    DOM.eventMessage.classList.add(
        "event-message--active"
    );

    state.messageTimeout = setTimeout(() => {
        DOM.eventMessage.classList.remove(
            "event-message--active"
        );
    }, 750);
}

/* =========================================================
   HUD
========================================================= */

function updateHUD() {
    if (DOM.hud.score) {
        DOM.hud.score.textContent =
            String(state.score).padStart(6, "0");
    }

    if (DOM.hud.lives) {
        DOM.hud.lives.textContent =
            state.lives > 0
                ? "❤️".repeat(state.lives)
                : "—";
    }

    if (DOM.hud.timer) {
        DOM.hud.timer.textContent =
            state.timeLeft.toFixed(1);
    }

    if (DOM.hud.level) {
        DOM.hud.level.textContent =
            String(state.level);
    }
}

/* =========================================================
   RENDERING
========================================================= */

function renderGame() {
    if (!ctx) return;

    ctx.save();

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(
        0,
        0,
        state.width,
        state.height
    );

    drawArenaGlow();
    drawPortals();
    drawLasers();
    drawParticles();

    if (state.bumper) {
        drawBumper(state.bumper);
    }

    state.rabbits.forEach(rabbit => {
        if (!rabbit.inPortal) {
            drawRabbit(rabbit);
        }
    });

    if (state.pointer.active) {
        drawPointer();
    }

    if (state.freezeTimer > 0) {
        drawFreezeOverlay();
    }

    ctx.restore();
}

function drawArenaGlow() {
    const gradient = ctx.createRadialGradient(
        state.width / 2,
        state.height / 2,
        10,
        state.width / 2,
        state.height / 2,
        Math.max(state.width, state.height) * 0.65
    );

    gradient.addColorStop(
        0,
        "rgba(0,245,255,0.035)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        state.width,
        state.height
    );
}

function drawPortals() {
    state.portals.forEach(portal => {
        ctx.save();

        ctx.translate(portal.x, portal.y);
        ctx.rotate(state.portalRotation);

        const glow = ctx.createRadialGradient(
            0,
            0,
            1,
            0,
            0,
            portal.radius * 1.5
        );

        glow.addColorStop(
            0,
            "rgba(0,0,0,1)"
        );

        glow.addColorStop(
            0.55,
            "rgba(58,0,100,0.7)"
        );

        glow.addColorStop(
            1,
            "rgba(156,77,255,0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            portal.radius * 1.5,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = COLORS.purple;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            portal.radius,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        ctx.strokeStyle =
            "rgba(255,47,207,0.75)";

        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            portal.radius * 0.68,
            0,
            Math.PI * 1.45
        );
        ctx.stroke();

        ctx.fillStyle = "#000000";

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            portal.radius * 0.48,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    });
}

function drawBumper(bumper) {
    ctx.save();

    ctx.translate(bumper.x, bumper.y);
    ctx.rotate(bumper.rotationAngle);

    const pulse =
        bumper.radius +
        9 +
        Math.sin(bumper.pulseAngle) * 4;

    ctx.strokeStyle =
        "rgba(255,255,255,0.72)";

    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(
        0,
        0,
        pulse,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    ctx.strokeStyle =
        "rgba(0,245,255,0.36)";

    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(
        0,
        0,
        pulse + 8,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    ctx.restore();

    drawRabbit(bumper);
}

function drawRabbit(rabbit) {
    const theme =
        rabbit.theme || RABBIT_THEMES[0];

    const radius = rabbit.radius;

    ctx.save();

    ctx.translate(rabbit.x, rabbit.y);
    ctx.rotate(rabbit.rotationAngle || 0);

    if (
        theme.id === "void" &&
        rabbit.isPhantom
    ) {
        ctx.globalAlpha = 0.28;
    }

    if (theme.id === "void") {
        ctx.strokeStyle =
            "rgba(156,77,255,0.45)";

        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            radius + 16,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }

    if (theme.id === "red") {
        ctx.strokeStyle =
            "rgba(255,49,93,0.65)";

        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            radius + 11,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-radius - 6, -radius - 6);
        ctx.lineTo(radius + 6, radius + 6);

        ctx.moveTo(radius + 6, -radius - 6);
        ctx.lineTo(-radius - 6, radius + 6);

        ctx.stroke();
    }

    if (rabbit.powerGlow > 0) {
        ctx.globalAlpha =
            Math.max(
                ctx.globalAlpha,
                rabbit.powerGlow * 0.6
            );

        ctx.fillStyle = theme.main;

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            radius + 11,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.globalAlpha =
            theme.id === "void" &&
            rabbit.isPhantom
                ? 0.28
                : 1;
    }

    ctx.shadowColor = theme.main;
    ctx.shadowBlur = 9;

    ctx.strokeStyle = theme.main;
    ctx.lineWidth = 3.2;

    ctx.beginPath();
    ctx.arc(
        0,
        0,
        radius,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    ctx.shadowBlur = 5;

    ctx.lineWidth = 2.4;

    ctx.beginPath();
    ctx.ellipse(
        -radius * 0.35,
        -radius * 0.62,
        radius * 0.17,
        radius * 0.4,
        -0.2,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(
        radius * 0.35,
        -radius * 0.62,
        radius * 0.17,
        radius * 0.4,
        0.2,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    ctx.shadowBlur = 8;
    ctx.fillStyle = theme.eye;

    ctx.fillRect(
        -radius * 0.4,
        -radius * 0.1,
        radius * 0.8,
        radius * 0.22
    );

    if (theme.id === "black") {
        ctx.fillStyle =
            "rgba(255,255,255,0.8)";

        ctx.fillRect(
            -radius * 0.48,
            radius * 0.3,
            radius * 0.25,
            2
        );

        ctx.fillRect(
            radius * 0.15,
            radius * 0.38,
            radius * 0.36,
            2
        );
    }

    if (theme.id === "gold") {
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-radius * 0.55, 0);
        ctx.lineTo(-radius * 0.78, 0);

        ctx.moveTo(radius * 0.55, 0);
        ctx.lineTo(radius * 0.78, 0);

        ctx.stroke();
    }

    ctx.restore();
}

function drawLasers() {
    state.lasers.forEach(laser => {
        ctx.save();

        ctx.strokeStyle = COLORS.gold;
        ctx.shadowColor = COLORS.gold;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(
            laser.tailX,
            laser.tailY
        );

        ctx.lineTo(
            laser.headX,
            laser.headY
        );

        ctx.stroke();

        ctx.restore();
    });
}

function drawParticles() {
    state.particles.forEach(particle => {
        const alpha = clamp(
            particle.life /
            particle.maximumLife,
            0,
            1
        );

        ctx.save();

        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 7;

        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    });
}

function drawPointer() {
    ctx.save();

    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.75;

    ctx.beginPath();

    ctx.arc(
        state.pointer.x,
        state.pointer.y,
        14,
        0,
        Math.PI * 2
    );

    ctx.moveTo(
        state.pointer.x - 20,
        state.pointer.y
    );

    ctx.lineTo(
        state.pointer.x + 20,
        state.pointer.y
    );

    ctx.moveTo(
        state.pointer.x,
        state.pointer.y - 20
    );

    ctx.lineTo(
        state.pointer.x,
        state.pointer.y + 20
    );

    ctx.stroke();

    ctx.restore();
}

function drawFreezeOverlay() {
    ctx.save();

    ctx.fillStyle =
        "rgba(0,162,255,0.055)";

    ctx.fillRect(
        0,
        0,
        state.width,
        state.height
    );

    ctx.strokeStyle =
        "rgba(255,255,255,0.2)";

    ctx.lineWidth = 1;

    for (
        let index = 0;
        index < 12;
        index++
    ) {
        const x =
            (index * 83) % state.width;

        const y =
            (index * 137) % state.height;

        ctx.beginPath();

        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);

        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);

        ctx.stroke();
    }

    ctx.restore();
}

/* =========================================================
   EVENTS
========================================================= */

function initEvents() {
    if (!DOM.canvas) return;

    DOM.buttons.start?.addEventListener(
        "click",
        startNewGame
    );

    DOM.buttons.restart?.addEventListener(
        "click",
        startNewGame
    );

    DOM.buttons.pause?.addEventListener(
        "click",
        openPauseOverlay
    );

    DOM.buttons.resume?.addEventListener(
        "click",
        closePauseOverlay
    );

    DOM.buttons.quit?.addEventListener(
        "click",
        returnToMenu
    );

    DOM.buttons.menu?.addEventListener(
        "click",
        returnToMenu
    );

    DOM.buttons.sound?.addEventListener(
        "click",
        () => {
            const enabled = audio.toggle();

            DOM.buttons.sound.textContent =
                enabled ? "🔊" : "🔇";

            DOM.buttons.sound.setAttribute(
                "aria-label",
                enabled
                    ? "Isključi zvuk"
                    : "Uključi zvuk"
            );
        }
    );

    DOM.canvas.addEventListener(
        "pointerdown",
        event => {
            event.preventDefault();

            audio.init();

            handleTargetInteraction(
                event.clientX,
                event.clientY
            );
        },
        { passive: false }
    );

    DOM.canvas.addEventListener(
        "pointermove",
        event => {
            if (
                event.pointerType !== "mouse"
            ) {
                return;
            }

            const rect =
                DOM.canvas.getBoundingClientRect();

            state.pointer.x =
                event.clientX - rect.left;

            state.pointer.y =
                event.clientY - rect.top;

            state.pointer.active = true;
        }
    );

    DOM.canvas.addEventListener(
        "pointerleave",
        () => {
            state.pointer.active = false;
        }
    );

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    window.addEventListener(
        "orientationchange",
        () => {
            setTimeout(resizeCanvas, 100);
        }
    );

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.hidden &&
                state.running &&
                state.gameStarted
            ) {
                openPauseOverlay();
            }
        }
    );

    window.addEventListener(
        "blur",
        () => {
            if (
                state.running &&
                state.gameStarted
            ) {
                openPauseOverlay();
            }
        }
    );

    document.addEventListener(
        "contextmenu",
        event => {
            if (
                event.target === DOM.canvas
            ) {
                event.preventDefault();
            }
        }
    );
}

/* =========================================================
   INITIALIZATION
========================================================= */

function init() {
    initEvents();

    if (DOM.hud.bestScore) {
        DOM.hud.bestScore.textContent =
            String(state.bestScore);
    }

    showScreen("start");

    requestAnimationFrame(resizeCanvas);
}

window.addEventListener(
    "DOMContentLoaded",
    init
);
