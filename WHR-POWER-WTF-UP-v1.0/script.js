"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.0.1
   COMPLETE SCRIPT.JS
========================================================= */

/* =========================================================
   01. DOM ELEMENTS
========================================================= */

const DOM = {
    gameApp: document.getElementById("gameApp"),

    screens: {
        start: document.getElementById("startScreen"),
        howToPlay: document.getElementById("howToPlayScreen"),
        game: document.getElementById("gameScreen"),
        levelComplete: document.getElementById("levelCompleteScreen"),
        gameOver: document.getElementById("gameOverScreen")
    },

    buttons: {
        start: document.getElementById("startButton"),
        howToPlay: document.getElementById("howToPlayButton"),
        closeHowToPlay: document.getElementById("closeHowToPlayButton"),
        instructionsStart: document.getElementById("instructionsStartButton"),

        pause: document.getElementById("pauseButton"),
        resume: document.getElementById("resumeButton"),
        restartFromPause: document.getElementById("restartFromPauseButton"),
        quitFromPause: document.getElementById("quitFromPauseButton"),

        nextLevel: document.getElementById("nextLevelButton"),
        playAgain: document.getElementById("playAgainButton"),
        gameOverMenu: document.getElementById("gameOverMenuButton"),

        moveLeft: document.getElementById("moveLeftButton"),
        moveRight: document.getElementById("moveRightButton"),
        shoot: document.getElementById("shootButton"),

        whiteHatProtocol: document.getElementById(
            "whiteHatProtocolButton"
        ),
        closeWhiteHatProtocol: document.getElementById(
            "closeWhiteHatProtocolButton"
        ),
        copySecurityReport: document.getElementById(
            "copySecurityReportButton"
        )
    },

    canvas: document.getElementById("gameCanvas"),
    gameStage: document.getElementById("gameStage"),

    pauseOverlay: document.getElementById("pauseOverlay"),

    hud: {
        score: document.getElementById("scoreValue"),
        bestScore: document.getElementById("bestScoreValue"),
        level: document.getElementById("levelValue"),
        combo: document.getElementById("comboValue"),
        lives: document.getElementById("livesContainer"),
        dangerMeterFill: document.getElementById("dangerMeterFill")
    },

    startRecords: {
        bestScore: document.getElementById("startBestScore"),
        maxLevel: document.getElementById("startMaxLevel")
    },

    indicators: {
        shield: document.getElementById("shieldIndicator"),
        freeze: document.getElementById("freezeIndicator"),
        rapid: document.getElementById("rapidIndicator"),
        doubleBeam: document.getElementById("doubleBeamIndicator")
    },

    timers: {
        shield: document.getElementById("shieldTimer"),
        freeze: document.getElementById("freezeTimer"),
        rapid: document.getElementById("rapidTimer"),
        doubleBeam: document.getElementById("doubleBeamTimer")
    },

    announcements: {
        level: document.getElementById("levelAnnouncement"),
        levelValue: document.getElementById(
            "levelAnnouncementValue"
        ),
        levelMessage: document.getElementById(
            "levelAnnouncementMessage"
        ),

        wtf: document.getElementById("wtfAnnouncement"),
        wtfMessage: document.getElementById("wtfEffectMessage"),

        combo: document.getElementById("comboAnnouncement"),
        status: document.getElementById("statusMessage")
    },

    effects: {
        screenFlash: document.getElementById("screenFlash"),
        earthquake: document.getElementById("earthquakeOverlay")
    },

    results: {
        levelScore: document.getElementById("levelScoreValue"),
        levelMaxCombo: document.getElementById(
            "levelMaxComboValue"
        ),
        orbsDestroyed: document.getElementById(
            "orbsDestroyedValue"
        ),
        levelMessage: document.getElementById(
            "levelCompleteMessage"
        ),

        finalScore: document.getElementById("finalScoreValue"),
        finalLevel: document.getElementById("finalLevelValue"),
        finalCombo: document.getElementById("finalComboValue"),
        newRecordBadge: document.getElementById(
            "newRecordBadge"
        )
    },

    whiteHat: {
        modal: document.getElementById("whiteHatProtocolModal"),
        copyStatus: document.getElementById("whiteHatCopyStatus")
    },

    audioStatus: document.getElementById("audioStatus")
};

const ctx = DOM.canvas.getContext("2d", {
    alpha: true
});

/* =========================================================
   02. CONSTANTS
========================================================= */

const STORAGE_KEYS = {
    bestScore: "whrPowerWtfUpBestScore",
    maxLevel: "whrPowerWtfUpMaxLevel"
};

const GAME_CONFIG = {
    baseWidth: 1280,
    baseHeight: 720,

    startingLives: 3,

    playerWidth: 62,
    playerHeight: 28,
    playerSpeed: 560,

    normalShootDelay: 290,
    rapidShootDelay: 105,

    beamSpeed: 900,
    beamWidth: 5,

    gravity: 680,

    invulnerabilityDuration: 1700,
    comboResetTime: 1900,

    levelTransitionDelay: 850,

    powerUpChance: 0.13,
    powerUpFallSpeed: 125,
    powerUpSize: 23,

    effectDuration: {
        shield: 8500,
        freeze: 5200,
        rapid: 7200,
        doubleBeam: 7600
    }
};

const ORB_TYPES = {
    large: {
        radius: 52,
        speedX: 155,
        bounce: 580,
        score: 100,
        next: "medium"
    },

    medium: {
        radius: 34,
        speedX: 205,
        bounce: 500,
        score: 180,
        next: "small"
    },

    small: {
        radius: 19,
        speedX: 275,
        bounce: 410,
        score: 300,
        next: null
    }
};

const LEVEL_MESSAGES = [
    "CONTROL THE CHAOS",
    "MULTITASK OR FAIL",
    "THE ORBS ARE LEARNING",
    "REACTION SPEED REQUIRED",
    "WTF ENERGY DETECTED",
    "THE SYSTEM IS WATCHING",
    "NO SAFE PATTERN EXISTS",
    "ENTER THE RABBIT HOLE"
];

const WTF_EFFECTS = [
    "shield",
    "freeze",
    "rapid",
    "doubleBeam",
    "scoreBurst",
    "orbPanic",
    "earthquake"
];

/* =========================================================
   03. GAME STATE
========================================================= */

const state = {
    currentScreen: "start",

    running: false,
    paused: false,
    gameOver: false,
    levelComplete: false,

    animationFrameId: null,
    lastTimestamp: 0,

    width: GAME_CONFIG.baseWidth,
    height: GAME_CONFIG.baseHeight,
    pixelRatio: 1,

    score: 0,
    bestScore: readStoredNumber(STORAGE_KEYS.bestScore, 0),

    level: 1,
    maxLevel: readStoredNumber(STORAGE_KEYS.maxLevel, 1),

    lives: GAME_CONFIG.startingLives,

    combo: 1,
    maxCombo: 1,
    comboTimer: 0,

    levelStartScore: 0,
    levelDestroyedOrbs: 0,

    lastShotTime: 0,
    invulnerableUntil: 0,

    keys: {
        left: false,
        right: false,
        shoot: false
    },

    touch: {
        left: false,
        right: false,
        shoot: false
    },

    player: null,
    beams: [],
    orbs: [],
    particles: [],
    powerUps: [],
    floatingTexts: [],

    effects: {
        shield: 0,
        freeze: 0,
        rapid: 0,
        doubleBeam: 0
    },

    audioUnlocked: false
};

/* =========================================================
   04. AUDIO ENGINE
========================================================= */

const audioEngine = {
    context: null,
    masterGain: null,

    unlock() {
        if (state.audioUnlocked) {
            return;
        }

        try {
            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContextClass) {
                return;
            }

            this.context = new AudioContextClass();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.18;
            this.masterGain.connect(this.context.destination);

            if (this.context.state === "suspended") {
                this.context.resume();
            }

            state.audioUnlocked = true;

            if (DOM.audioStatus) {
                DOM.audioStatus.textContent =
                    "WHR audio sistem aktiviran.";
            }
        } catch (error) {
            console.warn("Audio nije dostupan:", error);
        }
    },

    tone({
        frequency = 440,
        duration = 0.08,
        type = "sine",
        volume = 0.2,
        slideTo = null
    } = {}) {
        if (
            !state.audioUnlocked ||
            !this.context ||
            !this.masterGain
        ) {
            return;
        }

        const now = this.context.currentTime;

        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            frequency,
            now
        );

        if (slideTo !== null) {
            oscillator.frequency.exponentialRampToValueAtTime(
                Math.max(20, slideTo),
                now + duration
            );
        }

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, volume),
            now + 0.01
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + duration
        );

        oscillator.connect(gain);
        gain.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.03);
    },

    noise(duration = 0.1, volume = 0.12) {
        if (
            !state.audioUnlocked ||
            !this.context ||
            !this.masterGain
        ) {
            return;
        }

        const sampleRate = this.context.sampleRate;
        const frameCount = Math.floor(
            sampleRate * duration
        );

        const buffer = this.context.createBuffer(
            1,
            frameCount,
            sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let index = 0; index < frameCount; index += 1) {
            data[index] = Math.random() * 2 - 1;
        }

        const source = this.context.createBufferSource();
        const gain = this.context.createGain();

        source.buffer = buffer;
        gain.gain.value = volume;

        source.connect(gain);
        gain.connect(this.masterGain);

        source.start();
    },

    shoot() {
        this.tone({
            frequency: 620,
            slideTo: 280,
            duration: 0.07,
            type: "square",
            volume: 0.12
        });
    },

    orbHit() {
        this.tone({
            frequency: 150,
            slideTo: 85,
            duration: 0.11,
            type: "sawtooth",
            volume: 0.16
        });

        this.noise(0.05, 0.05);
    },

    playerHit() {
        this.tone({
            frequency: 105,
            slideTo: 42,
            duration: 0.3,
            type: "sawtooth",
            volume: 0.25
        });

        this.noise(0.16, 0.12);
    },

    powerUp() {
        this.tone({
            frequency: 390,
            slideTo: 880,
            duration: 0.24,
            type: "sine",
            volume: 0.18
        });
    },

    levelComplete() {
        const notes = [330, 440, 560, 740];

        notes.forEach((frequency, index) => {
            window.setTimeout(() => {
                this.tone({
                    frequency,
                    duration: 0.16,
                    type: "triangle",
                    volume: 0.16
                });
            }, index * 95);
        });
    },

    gameOver() {
        const notes = [260, 190, 130, 75];

        notes.forEach((frequency, index) => {
            window.setTimeout(() => {
                this.tone({
                    frequency,
                    slideTo: frequency * 0.65,
                    duration: 0.25,
                    type: "sawtooth",
                    volume: 0.18
                });
            }, index * 150);
        });
    },

    wtf() {
        this.tone({
            frequency: 90,
            slideTo: 520,
            duration: 0.42,
            type: "sawtooth",
            volume: 0.2
        });

        this.noise(0.22, 0.09);
    }
};

/* =========================================================
   05. STORAGE HELPERS
========================================================= */

function readStoredNumber(key, fallback) {
    try {
        const storedValue = Number(
            window.localStorage.getItem(key)
        );

        if (Number.isFinite(storedValue)) {
            return storedValue;
        }
    } catch (error) {
        console.warn("LocalStorage čitanje nije uspelo:", error);
    }

    return fallback;
}

function storeNumber(key, value) {
    try {
        window.localStorage.setItem(
            key,
            String(value)
        );
    } catch (error) {
        console.warn("LocalStorage upis nije uspeo:", error);
    }
}

/* =========================================================
   06. SCREEN MANAGEMENT
========================================================= */

function showScreen(screenName) {
    Object.entries(DOM.screens).forEach(
        ([name, screen]) => {
            if (!screen) {
                return;
            }

            const shouldShow = name === screenName;

            screen.classList.toggle(
                "screen--active",
                shouldShow
            );

            screen.setAttribute(
                "aria-hidden",
                String(!shouldShow)
            );
        }
    );

    state.currentScreen = screenName;

    if (screenName !== "game") {
        releaseAllControls();
    }
}

function openStartScreen() {
    stopGameLoop();

    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.levelComplete = false;

    hidePauseOverlay();
    hideAllAnnouncements();

    showScreen("start");
    updateStartRecords();
}

function openHowToPlay() {
    showScreen("howToPlay");
}

function hideAllAnnouncements() {
    DOM.announcements.level?.classList.remove("is-active");
    DOM.announcements.wtf?.classList.remove("is-active");
    DOM.announcements.combo?.classList.remove("is-active");
    DOM.announcements.status?.classList.remove("is-active");

    DOM.effects.screenFlash?.classList.remove("is-active");
    DOM.effects.earthquake?.classList.remove("is-active");
}

/* =========================================================
   07. CANVAS / RESIZE
========================================================= */

function resizeCanvas() {
    if (!DOM.canvas || !DOM.gameStage) {
        return;
    }

    const stageRect =
        DOM.gameStage.getBoundingClientRect();

    const cssWidth = Math.max(
        1,
        Math.floor(stageRect.width)
    );

    const cssHeight = Math.max(
        1,
        Math.floor(stageRect.height)
    );

    const ratio = Math.min(
        2,
        Math.max(1, window.devicePixelRatio || 1)
    );

    state.pixelRatio = ratio;
    state.width = cssWidth;
    state.height = cssHeight;

    DOM.canvas.width = Math.floor(cssWidth * ratio);
    DOM.canvas.height = Math.floor(cssHeight * ratio);

    DOM.canvas.style.width = `${cssWidth}px`;
    DOM.canvas.style.height = `${cssHeight}px`;

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    if (state.player) {
        state.player.y =
            state.height -
            state.player.height -
            22;

        state.player.x = clamp(
            state.player.x,
            0,
            state.width - state.player.width
        );
    }
}

/* =========================================================
   08. GAME INITIALIZATION
========================================================= */

function createPlayer() {
    return {
        x:
            state.width / 2 -
            GAME_CONFIG.playerWidth / 2,

        y:
            state.height -
            GAME_CONFIG.playerHeight -
            22,

        width: GAME_CONFIG.playerWidth,
        height: GAME_CONFIG.playerHeight,

        velocityX: 0,
        targetTilt: 0,
        tilt: 0
    };
}

function resetEffects() {
    state.effects.shield = 0;
    state.effects.freeze = 0;
    state.effects.rapid = 0;
    state.effects.doubleBeam = 0;

    updateEffectIndicators();
}

function resetGameState() {
    state.score = 0;
    state.level = 1;
    state.lives = GAME_CONFIG.startingLives;

    state.combo = 1;
    state.maxCombo = 1;
    state.comboTimer = 0;

    state.levelStartScore = 0;
    state.levelDestroyedOrbs = 0;

    state.lastShotTime = 0;
    state.invulnerableUntil = 0;

    state.beams = [];
    state.orbs = [];
    state.particles = [];
    state.powerUps = [];
    state.floatingTexts = [];

    state.player = createPlayer();

    resetEffects();
    releaseAllControls();

    updateHUD();
}

function startNewGame() {
    audioEngine.unlock();

    stopGameLoop();
    hidePauseOverlay();
    hideAllAnnouncements();

    state.running = true;
    state.paused = false;
    state.gameOver = false;
    state.levelComplete = false;

    showScreen("game");

    window.requestAnimationFrame(() => {
        resizeCanvas();
        resetGameState();
        startLevel(1);
        DOM.canvas?.focus({
            preventScroll: true
        });
    });
}

function restartCurrentGame() {
    startNewGame();
}

function startLevel(levelNumber) {
    state.level = levelNumber;
    state.levelComplete = false;
    state.paused = false;

    state.levelStartScore = state.score;
    state.levelDestroyedOrbs = 0;

    state.beams = [];
    state.orbs = [];
    state.powerUps = [];
    state.floatingTexts = [];

    state.combo = 1;
    state.comboTimer = 0;

    state.player.x =
        state.width / 2 -
        state.player.width / 2;

    state.player.y =
        state.height -
        state.player.height -
        22;

    createLevelOrbs(levelNumber);

    updateHUD();
    showLevelAnnouncement();

    state.lastTimestamp = performance.now();

    if (!state.animationFrameId) {
        state.animationFrameId =
            window.requestAnimationFrame(gameLoop);
    }
}

/* =========================================================
   09. LEVEL GENERATION
========================================================= */

function createLevelOrbs(levelNumber) {
    const largeCount = Math.min(
        1 + Math.floor((levelNumber - 1) / 2),
        5
    );

    const extraMediumCount =
        levelNumber >= 3
            ? Math.min(
                Math.floor((levelNumber - 1) / 3),
                3
            )
            : 0;

    for (
        let index = 0;
        index < largeCount;
        index += 1
    ) {
        const sectionWidth =
            state.width / (largeCount + 1);

        const x =
            sectionWidth * (index + 1);

        const direction =
            index % 2 === 0
                ? 1
                : -1;

        createOrb({
            x,
            y:
                120 +
                Math.random() *
                    Math.max(70, state.height * 0.18),

            type: "large",
            direction,
            speedMultiplier:
                1 +
                Math.min(
                    levelNumber * 0.035,
                    0.42
                )
        });
    }

    for (
        let index = 0;
        index < extraMediumCount;
        index += 1
    ) {
        createOrb({
            x:
                90 +
                Math.random() *
                    Math.max(100, state.width - 180),

            y:
                130 +
                Math.random() *
                    Math.max(70, state.height * 0.2),

            type: "medium",
            direction:
                Math.random() > 0.5
                    ? 1
                    : -1,

            speedMultiplier:
                1 +
                Math.min(
                    levelNumber * 0.035,
                    0.42
                )
        });
    }
}

function createOrb({
    x,
    y,
    type,
    direction = 1,
    speedMultiplier = 1
}) {
    const config = ORB_TYPES[type];

    const hueBase =
        type === "large"
            ? 190
            : type === "medium"
                ? 285
                : 335;

    state.orbs.push({
        x,
        y,

        radius: config.radius,
        type,

        velocityX:
            config.speedX *
            speedMultiplier *
            direction,

        velocityY:
            -config.bounce *
            (0.76 + Math.random() * 0.18),

        rotation: Math.random() * Math.PI * 2,
        rotationSpeed:
            (Math.random() - 0.5) * 2.4,

        hue:
            hueBase +
            Math.random() * 28,

        wobbleOffset:
            Math.random() * Math.PI * 2
    });
}

/* =========================================================
   10. MAIN GAME LOOP
========================================================= */

function gameLoop(timestamp) {
    if (!state.running) {
        state.animationFrameId = null;
        return;
    }

    const rawDelta =
        (timestamp - state.lastTimestamp) / 1000;

    const delta = Math.min(
        0.033,
        Math.max(0, rawDelta || 0)
    );

    state.lastTimestamp = timestamp;

    if (!state.paused && !state.gameOver) {
        updateGame(delta, timestamp);
    }

    renderGame(timestamp);

    state.animationFrameId =
        window.requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
    state.running = false;

    if (state.animationFrameId) {
        window.cancelAnimationFrame(
            state.animationFrameId
        );

        state.animationFrameId = null;
    }
}

/* =========================================================
   11. GAME UPDATE
========================================================= */

function updateGame(delta, timestamp) {
    updateEffects(delta);
    updatePlayer(delta);

    if (
        state.keys.shoot ||
        state.touch.shoot
    ) {
        tryShoot(timestamp);
    }

    updateBeams(delta);
    updateOrbs(delta);
    updatePowerUps(delta);
    updateParticles(delta);
    updateFloatingTexts(delta);
    updateCombo(delta);

    handleBeamOrbCollisions();
    handlePlayerOrbCollisions(timestamp);
    handlePlayerPowerUpCollisions();

    if (
        state.orbs.length === 0 &&
        !state.levelComplete &&
        !state.gameOver
    ) {
        completeLevel();
    }
}

/* =========================================================
   12. PLAYER UPDATE
========================================================= */

function updatePlayer(delta) {
    if (!state.player) {
        return;
    }

    const moveLeft =
        state.keys.left ||
        state.touch.left;

    const moveRight =
        state.keys.right ||
        state.touch.right;

    let direction = 0;

    if (moveLeft && !moveRight) {
        direction = -1;
    }

    if (moveRight && !moveLeft) {
        direction = 1;
    }

    state.player.velocityX =
        direction *
        GAME_CONFIG.playerSpeed;

    state.player.x +=
        state.player.velocityX * delta;

    state.player.x = clamp(
        state.player.x,
        0,
        state.width - state.player.width
    );

    state.player.targetTilt =
        direction * 0.12;

    state.player.tilt = lerp(
        state.player.tilt,
        state.player.targetTilt,
        Math.min(1, delta * 12)
    );
}

/* =========================================================
   13. SHOOTING
========================================================= */

function tryShoot(timestamp) {
    if (
        !state.running ||
        state.paused ||
        state.gameOver ||
        state.levelComplete
    ) {
        return;
    }

    const shootDelay =
        state.effects.rapid > 0
            ? GAME_CONFIG.rapidShootDelay
            : GAME_CONFIG.normalShootDelay;

    if (
        timestamp - state.lastShotTime <
        shootDelay
    ) {
        return;
    }

    state.lastShotTime = timestamp;

    const playerCenterX =
        state.player.x +
        state.player.width / 2;

    if (state.effects.doubleBeam > 0) {
        createBeam(playerCenterX - 13);
        createBeam(playerCenterX + 13);
    } else {
        createBeam(playerCenterX);
    }

    createMuzzleParticles(
        playerCenterX,
        state.player.y
    );

    audioEngine.shoot();
}

function createBeam(x) {
    state.beams.push({
        x,
        y: state.player.y - 4,

        width: GAME_CONFIG.beamWidth,
        height: 24,

        speed: GAME_CONFIG.beamSpeed,

        trail: []
    });
}

function updateBeams(delta) {
    for (
        let index = state.beams.length - 1;
        index >= 0;
        index -= 1
    ) {
        const beam = state.beams[index];

        beam.trail.push({
            x: beam.x,
            y: beam.y,
            life: 0.16
        });

        if (beam.trail.length > 6) {
            beam.trail.shift();
        }

        beam.trail.forEach(trailPoint => {
            trailPoint.life -= delta;
        });

        beam.trail = beam.trail.filter(
            trailPoint => trailPoint.life > 0
        );

        beam.y -= beam.speed * delta;

        if (beam.y + beam.height < 0) {
            state.beams.splice(index, 1);
        }
    }
}

/* =========================================================
   14. ORB UPDATE
========================================================= */

function updateOrbs(delta) {
    const freezeMultiplier =
        state.effects.freeze > 0
            ? 0.28
            : 1;

    state.orbs.forEach(orb => {
        orb.rotation +=
            orb.rotationSpeed *
            delta *
            freezeMultiplier;

        orb.velocityY +=
            GAME_CONFIG.gravity *
            delta *
            freezeMultiplier;

        orb.x +=
            orb.velocityX *
            delta *
            freezeMultiplier;

        orb.y +=
            orb.velocityY *
            delta *
            freezeMultiplier;

        if (orb.x - orb.radius < 0) {
            orb.x = orb.radius;
            orb.velocityX =
                Math.abs(orb.velocityX);
        }

        if (
            orb.x + orb.radius >
            state.width
        ) {
            orb.x =
                state.width -
                orb.radius;

            orb.velocityX =
                -Math.abs(orb.velocityX);
        }

        const floorY =
            state.height -
            orb.radius -
            10;

        if (orb.y > floorY) {
            orb.y = floorY;

            const bounce =
                ORB_TYPES[orb.type].bounce;

            orb.velocityY =
                -bounce *
                (0.93 + Math.random() * 0.1);
        }

        if (orb.y - orb.radius < 0) {
            orb.y = orb.radius;
            orb.velocityY =
                Math.abs(orb.velocityY);
        }
    });
}

/* =========================================================
   15. COLLISIONS
========================================================= */

function handleBeamOrbCollisions() {
    for (
        let beamIndex =
            state.beams.length - 1;

        beamIndex >= 0;
        beamIndex -= 1
    ) {
        const beam = state.beams[beamIndex];
        let beamDestroyed = false;

        for (
            let orbIndex =
                state.orbs.length - 1;

            orbIndex >= 0;
            orbIndex -= 1
        ) {
            const orb = state.orbs[orbIndex];

            if (
                rectangleCircleCollision(
                    beam.x - beam.width / 2,
                    beam.y,
                    beam.width,
                    beam.height,
                    orb.x,
                    orb.y,
                    orb.radius
                )
            ) {
                state.beams.splice(
                    beamIndex,
                    1
                );

                destroyOrb(
                    orbIndex,
                    orb
                );

                beamDestroyed = true;
                break;
            }
        }

        if (beamDestroyed) {
            continue;
        }
    }
}

function destroyOrb(orbIndex, orb) {
    state.orbs.splice(orbIndex, 1);

    const config = ORB_TYPES[orb.type];

    state.levelDestroyedOrbs += 1;

    state.combo += 1;
    state.comboTimer =
        GAME_CONFIG.comboResetTime / 1000;

    state.maxCombo = Math.max(
        state.maxCombo,
        state.combo
    );

    const comboMultiplier =
        1 +
        Math.min(
            (state.combo - 1) * 0.12,
            3
        );

    const scoreGain = Math.round(
        config.score *
        comboMultiplier *
        (1 + (state.level - 1) * 0.05)
    );

    addScore(scoreGain);

    createExplosionParticles(
        orb.x,
        orb.y,
        orb.hue,
        orb.radius
    );

    createFloatingText(
        orb.x,
        orb.y,
        `+${scoreGain}`,
        `hsl(${orb.hue}, 100%, 70%)`
    );

    if (state.combo > 2) {
        showComboAnnouncement(
            state.combo
        );
    }

    if (config.next) {
        const childConfig =
            ORB_TYPES[config.next];

        const childSpeedMultiplier =
            1 +
            Math.min(
                state.level * 0.035,
                0.42
            );

        createOrb({
            x:
                orb.x -
                childConfig.radius * 0.35,

            y:
                orb.y -
                childConfig.radius * 0.25,

            type: config.next,
            direction: -1,
            speedMultiplier:
                childSpeedMultiplier
        });

        createOrb({
            x:
                orb.x +
                childConfig.radius * 0.35,

            y:
                orb.y -
                childConfig.radius * 0.25,

            type: config.next,
            direction: 1,
            speedMultiplier:
                childSpeedMultiplier
        });

        const firstChild =
            state.orbs[
                state.orbs.length - 2
            ];

        const secondChild =
            state.orbs[
                state.orbs.length - 1
            ];

        firstChild.velocityY =
            -childConfig.bounce * 0.82;

        secondChild.velocityY =
            -childConfig.bounce * 0.82;
    }

    if (
        Math.random() <
        GAME_CONFIG.powerUpChance
    ) {
        createPowerUp(
            orb.x,
            orb.y
        );
    }

    audioEngine.orbHit();
    flashScreen();
    updateHUD();
}

function handlePlayerOrbCollisions(timestamp) {
    if (
        timestamp <
        state.invulnerableUntil
    ) {
        return;
    }

    const playerHitbox = {
        x: state.player.x + 6,
        y: state.player.y + 4,
        width: state.player.width - 12,
        height: state.player.height - 5
    };

    for (
        let index = 0;
        index < state.orbs.length;
        index += 1
    ) {
        const orb = state.orbs[index];

        if (
            rectangleCircleCollision(
                playerHitbox.x,
                playerHitbox.y,
                playerHitbox.width,
                playerHitbox.height,
                orb.x,
                orb.y,
                orb.radius * 0.82
            )
        ) {
            if (state.effects.shield > 0) {
                state.effects.shield = Math.max(
                    0,
                    state.effects.shield - 2300
                );

                state.invulnerableUntil =
                    timestamp + 650;

                orb.velocityY =
                    -Math.abs(orb.velocityY) -
                    180;

                orb.velocityX *= -1;

                createExplosionParticles(
                    orb.x,
                    orb.y,
                    185,
                    22
                );

                showStatusMessage(
                    "SHIELD ABSORBED IMPACT"
                );

                updateEffectIndicators();
                audioEngine.powerUp();
                return;
            }

            loseLife(timestamp);
            return;
        }
    }
}

function loseLife(timestamp) {
    state.lives -= 1;

    state.invulnerableUntil =
        timestamp +
        GAME_CONFIG.invulnerabilityDuration;

    state.combo = 1;
    state.comboTimer = 0;

    createExplosionParticles(
        state.player.x +
            state.player.width / 2,

        state.player.y +
            state.player.height / 2,

        350,
        44
    );

    triggerEarthquake(480);
    flashScreen();

    audioEngine.playerHit();

    if (state.lives <= 0) {
        endGame();
        return;
    }

    state.player.x =
        state.width / 2 -
        state.player.width / 2;

    showStatusMessage(
        `LIFE LOST // ${state.lives} REMAINING`
    );

    updateHUD();
}

/* =========================================================
   16. POWER UPS / WTF SYSTEM
========================================================= */

function createPowerUp(x, y) {
    const effect =
        WTF_EFFECTS[
            Math.floor(
                Math.random() *
                WTF_EFFECTS.length
            )
        ];

    state.powerUps.push({
        x,
        y,

        size: GAME_CONFIG.powerUpSize,
        speedY:
            GAME_CONFIG.powerUpFallSpeed,

        rotation: 0,
        effect,

        pulse: Math.random() * Math.PI * 2
    });
}

function updatePowerUps(delta) {
    for (
        let index =
            state.powerUps.length - 1;

        index >= 0;
        index -= 1
    ) {
        const powerUp =
            state.powerUps[index];

        powerUp.y +=
            powerUp.speedY * delta;

        powerUp.rotation += delta * 2.7;
        powerUp.pulse += delta * 5;

        if (
            powerUp.y -
                powerUp.size >
            state.height
        ) {
            state.powerUps.splice(
                index,
                1
            );
        }
    }
}

function handlePlayerPowerUpCollisions() {
    const playerCenterX =
        state.player.x +
        state.player.width / 2;

    const playerCenterY =
        state.player.y +
        state.player.height / 2;

    for (
        let index =
            state.powerUps.length - 1;

        index >= 0;
        index -= 1
    ) {
        const powerUp =
            state.powerUps[index];

        const distance = Math.hypot(
            powerUp.x - playerCenterX,
            powerUp.y - playerCenterY
        );

        if (
            distance <
            powerUp.size +
                state.player.width * 0.36
        ) {
            state.powerUps.splice(
                index,
                1
            );

            activateWtfEffect(
                powerUp.effect
            );
        }
    }
}

function activateWtfEffect(effectName) {
    audioEngine.wtf();
    showWtfAnnouncement(
        getEffectDisplayName(effectName)
    );

    switch (effectName) {
        case "shield":
            state.effects.shield =
                GAME_CONFIG.effectDuration.shield;

            showStatusMessage(
                "ENERGY SHIELD ONLINE"
            );
            break;

        case "freeze":
            state.effects.freeze =
                GAME_CONFIG.effectDuration.freeze;

            showStatusMessage(
                "TIME FIELD DISTORTED"
            );
            break;

        case "rapid":
            state.effects.rapid =
                GAME_CONFIG.effectDuration.rapid;

            showStatusMessage(
                "RAPID FIRE ENABLED"
            );
            break;

        case "doubleBeam":
            state.effects.doubleBeam =
                GAME_CONFIG.effectDuration.doubleBeam;

            showStatusMessage(
                "DOUBLE BEAM ENABLED"
            );
            break;

        case "scoreBurst": {
            const bonus =
                1000 +
                state.level * 250;

            addScore(bonus);

            createFloatingText(
                state.player.x +
                    state.player.width / 2,

                state.player.y - 30,

                `BONUS +${bonus}`,
                "#ffe45c"
            );

            showStatusMessage(
                `CHAOS BONUS +${bonus}`
            );
            break;
        }

        case "orbPanic":
            state.orbs.forEach(orb => {
                orb.velocityX *= -1.35;
                orb.velocityY =
                    -Math.abs(orb.velocityY) -
                    120;
            });

            triggerEarthquake(650);

            showStatusMessage(
                "ORB PANIC PROTOCOL"
            );
            break;

        case "earthquake":
            triggerEarthquake(1200);

            state.orbs.forEach(orb => {
                orb.velocityX +=
                    (Math.random() - 0.5) *
                    280;

                orb.velocityY =
                    -Math.abs(orb.velocityY) -
                    Math.random() * 180;
            });

            showStatusMessage(
                "SEISMIC CHAOS RELEASED"
            );
            break;

        default:
            break;
    }

    updateEffectIndicators();
}

function getEffectDisplayName(effectName) {
    const names = {
        shield: "SHIELD ONLINE",
        freeze: "FREEZE FIELD",
        rapid: "RAPID FIRE",
        doubleBeam: "DOUBLE BEAM",
        scoreBurst: "SCORE BURST",
        orbPanic: "ORB PANIC",
        earthquake: "EARTHQUAKE"
    };

    return (
        names[effectName] ||
        "UNKNOWN EFFECT"
    );
}

function updateEffects(delta) {
    const deltaMilliseconds =
        delta * 1000;

    Object.keys(state.effects).forEach(
        effectName => {
            if (
                state.effects[effectName] >
                0
            ) {
                state.effects[effectName] =
                    Math.max(
                        0,
                        state.effects[effectName] -
                            deltaMilliseconds
                    );
            }
        }
    );

    updateEffectIndicators();
}

function updateEffectIndicators() {
    updateSingleIndicator(
        "shield",
        DOM.indicators.shield,
        DOM.timers.shield
    );

    updateSingleIndicator(
        "freeze",
        DOM.indicators.freeze,
        DOM.timers.freeze
    );

    updateSingleIndicator(
        "rapid",
        DOM.indicators.rapid,
        DOM.timers.rapid
    );

    updateSingleIndicator(
        "doubleBeam",
        DOM.indicators.doubleBeam,
        DOM.timers.doubleBeam
    );
}

function updateSingleIndicator(
    effectName,
    indicatorElement,
    timerElement
) {
    if (
        !indicatorElement ||
        !timerElement
    ) {
        return;
    }

    const remaining =
        state.effects[effectName];

    const active =
        remaining > 0;

    indicatorElement.hidden = !active;

    if (active) {
        timerElement.textContent =
            `${Math.ceil(remaining / 1000)}s`;
    } else {
        timerElement.textContent = "";
    }
}

/* =========================================================
   17. COMBO / SCORE / HUD
========================================================= */

function updateCombo(delta) {
    if (state.combo <= 1) {
        return;
    }

    state.comboTimer -= delta;

    if (state.comboTimer <= 0) {
        state.combo = 1;
        state.comboTimer = 0;
        updateHUD();
    }
}

function addScore(amount) {
    state.score += Math.max(
        0,
        Math.round(amount)
    );

    if (state.score > state.bestScore) {
        state.bestScore = state.score;
    }

    updateHUD();
}

function updateHUD() {
    setText(
        DOM.hud.score,
        formatScore(state.score)
    );

    setText(
        DOM.hud.bestScore,
        formatScore(
            Math.max(
                state.bestScore,
                state.score
            )
        )
    );

    setText(
        DOM.hud.level,
        String(state.level).padStart(2, "0")
    );

    setText(
        DOM.hud.combo,
        `x${state.combo}`
    );

    renderLives();

    const levelThreat =
        Math.min(
            100,
            18 +
                state.level * 7 +
                state.orbs.length * 2.7
        );

    if (DOM.hud.dangerMeterFill) {
        DOM.hud.dangerMeterFill.style.width =
            `${levelThreat}%`;
    }
}

function renderLives() {
    if (!DOM.hud.lives) {
        return;
    }

    DOM.hud.lives.innerHTML = "";

    for (
        let index = 0;
        index < state.lives;
        index += 1
    ) {
        const life = document.createElement("span");

        life.className = "life-icon";
        life.textContent = "♥";

        DOM.hud.lives.appendChild(life);
    }

    DOM.hud.lives.setAttribute(
        "aria-label",
        `${state.lives} preostala života`
    );
}

function updateStartRecords() {
    setText(
        DOM.startRecords.bestScore,
        formatScore(state.bestScore)
    );

    setText(
        DOM.startRecords.maxLevel,
        String(state.maxLevel).padStart(2, "0")
    );
}

/* =========================================================
   18. LEVEL COMPLETE / GAME OVER
========================================================= */

function completeLevel() {
    if (state.levelComplete) {
        return;
    }

    state.levelComplete = true;
    releaseAllControls();

    const levelScore =
        state.score -
        state.levelStartScore;

    const completionBonus =
        state.level * 500 +
        state.lives * 250;

    addScore(completionBonus);

    audioEngine.levelComplete();

    window.setTimeout(() => {
        if (
            state.gameOver ||
            !state.levelComplete
        ) {
            return;
        }

        setText(
            DOM.results.levelScore,
            formatScore(
                levelScore +
                completionBonus
            )
        );

        setText(
            DOM.results.levelMaxCombo,
            `x${state.maxCombo}`
        );

        setText(
            DOM.results.orbsDestroyed,
            String(state.levelDestroyedOrbs)
        );

        setText(
            DOM.results.levelMessage,
            `BONUS +${completionBonus} // ${
                state.lives
            } LIVES REMAINING`
        );

        showScreen("levelComplete");
    }, GAME_CONFIG.levelTransitionDelay);
}

function continueToNextLevel() {
    audioEngine.unlock();

    const nextLevel =
        state.level + 1;

    showScreen("game");

    window.requestAnimationFrame(() => {
        resizeCanvas();
        startLevel(nextLevel);
        DOM.canvas?.focus({
            preventScroll: true
        });
    });
}

function endGame() {
    if (state.gameOver) {
        return;
    }

    state.gameOver = true;
    state.running = false;
    state.paused = false;

    releaseAllControls();
    hidePauseOverlay();

    const previousBest =
        readStoredNumber(
            STORAGE_KEYS.bestScore,
            0
        );

    const isNewRecord =
        state.score > previousBest;

    if (state.score > state.bestScore) {
        state.bestScore = state.score;
    }

    if (state.level > state.maxLevel) {
        state.maxLevel = state.level;
    }

    storeNumber(
        STORAGE_KEYS.bestScore,
        state.bestScore
    );

    storeNumber(
        STORAGE_KEYS.maxLevel,
        state.maxLevel
    );

    setText(
        DOM.results.finalScore,
        formatScore(state.score)
    );

    setText(
        DOM.results.finalLevel,
        String(state.level).padStart(2, "0")
    );

    setText(
        DOM.results.finalCombo,
        `x${state.maxCombo}`
    );

    if (DOM.results.newRecordBadge) {
        DOM.results.newRecordBadge.hidden =
            !isNewRecord;
    }

    audioEngine.gameOver();

    window.setTimeout(() => {
        stopGameLoop();
        showScreen("gameOver");
        updateStartRecords();
    }, 650);
}

/* =========================================================
   19. PAUSE SYSTEM
========================================================= */

function pauseGame() {
    if (
        !state.running ||
        state.paused ||
        state.gameOver ||
        state.levelComplete ||
        state.currentScreen !== "game"
    ) {
        return;
    }

    state.paused = true;
    releaseAllControls();
    showPauseOverlay();

    showStatusMessage(
        "SYSTEM PAUSED"
    );
}

function resumeGame() {
    if (
        !state.running ||
        !state.paused
    ) {
        return;
    }

    state.paused = false;
    state.lastTimestamp = performance.now();

    hidePauseOverlay();

    DOM.canvas?.focus({
        preventScroll: true
    });
}

function togglePause() {
    if (
        state.currentScreen !== "game" ||
        !state.running ||
        state.gameOver ||
        state.levelComplete
    ) {
        return;
    }

    if (state.paused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

function showPauseOverlay() {
    if (!DOM.pauseOverlay) {
        return;
    }

    DOM.pauseOverlay.hidden = false;
    DOM.pauseOverlay.setAttribute(
        "aria-hidden",
        "false"
    );
}

function hidePauseOverlay() {
    if (!DOM.pauseOverlay) {
        return;
    }

    DOM.pauseOverlay.hidden = true;
    DOM.pauseOverlay.setAttribute(
        "aria-hidden",
        "true"
    );
}

/* =========================================================
   20. PARTICLES / FLOATING TEXT
========================================================= */

function createExplosionParticles(
    x,
    y,
    hue,
    size
) {
    const count = Math.round(
        clamp(size * 0.45, 10, 32)
    );

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            80 +
            Math.random() *
                (170 + size * 2);

        state.particles.push({
            x,
            y,

            velocityX:
                Math.cos(angle) * speed,

            velocityY:
                Math.sin(angle) * speed,

            life:
                0.35 +
                Math.random() * 0.45,

            maxLife:
                0.35 +
                Math.random() * 0.45,

            size:
                1.5 +
                Math.random() *
                    Math.max(2, size * 0.1),

            hue:
                hue +
                (Math.random() - 0.5) * 35,

            gravity:
                110 +
                Math.random() * 130
        });
    }
}

function createMuzzleParticles(x, y) {
    for (
        let index = 0;
        index < 7;
        index += 1
    ) {
        state.particles.push({
            x:
                x +
                (Math.random() - 0.5) * 10,

            y,

            velocityX:
                (Math.random() - 0.5) * 80,

            velocityY:
                -80 -
                Math.random() * 160,

            life:
                0.16 +
                Math.random() * 0.18,

            maxLife:
                0.16 +
                Math.random() * 0.18,

            size:
                1.5 +
                Math.random() * 3,

            hue:
                180 +
                Math.random() * 30,

            gravity: 0
        });
    }
}

function updateParticles(delta) {
    for (
        let index =
            state.particles.length - 1;

        index >= 0;
        index -= 1
    ) {
        const particle =
            state.particles[index];

        particle.life -= delta;

        if (particle.life <= 0) {
            state.particles.splice(
                index,
                1
            );
            continue;
        }

        particle.velocityY +=
            particle.gravity * delta;

        particle.x +=
            particle.velocityX * delta;

        particle.y +=
            particle.velocityY * delta;

        particle.velocityX *=
            Math.pow(0.96, delta * 60);
    }
}

function createFloatingText(
    x,
    y,
    text,
    color
) {
    state.floatingTexts.push({
        x,
        y,
        text,
        color,
        life: 0.8,
        maxLife: 0.8
    });
}

function updateFloatingTexts(delta) {
    for (
        let index =
            state.floatingTexts.length - 1;

        index >= 0;
        index -= 1
    ) {
        const floatingText =
            state.floatingTexts[index];

        floatingText.life -= delta;
        floatingText.y -= 42 * delta;

        if (floatingText.life <= 0) {
            state.floatingTexts.splice(
                index,
                1
            );
        }
    }
}

/* =========================================================
   21. RENDERING
========================================================= */

function renderGame(timestamp) {
    ctx.clearRect(
        0,
        0,
        state.width,
        state.height
    );

    drawArenaBackground(timestamp);
    drawBeams();
    drawPowerUps(timestamp);
    drawOrbs(timestamp);
    drawParticles();
    drawPlayer(timestamp);
    drawFloatingTexts();
}

function drawArenaBackground(timestamp) {
    const time =
        timestamp * 0.001;

    const gradient =
        ctx.createRadialGradient(
            state.width * 0.5,
            state.height * 0.5,
            20,
            state.width * 0.5,
            state.height * 0.5,
            Math.max(
                state.width,
                state.height
            ) * 0.7
        );

    gradient.addColorStop(
        0,
        "rgba(32, 14, 66, 0.14)"
    );

    gradient.addColorStop(
        0.55,
        "rgba(5, 8, 18, 0.06)"
    );

    gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0.22)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        state.width,
        state.height
    );

    ctx.save();

    ctx.globalAlpha = 0.11;
    ctx.strokeStyle =
        "rgba(0, 245, 255, 0.35)";
    ctx.lineWidth = 1;

    const spacing = 54;
    const offset =
        (time * 22) % spacing;

    for (
        let y = -spacing + offset;
        y < state.height;
        y += spacing
    ) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(state.width, y);
        ctx.stroke();
    }

    for (
        let x = 0;
        x < state.width;
        x += spacing
    ) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, state.height);
        ctx.stroke();
    }

    ctx.restore();

    ctx.save();

    const floorGradient =
        ctx.createLinearGradient(
            0,
            state.height - 90,
            0,
            state.height
        );

    floorGradient.addColorStop(
        0,
        "rgba(0, 245, 255, 0)"
    );

    floorGradient.addColorStop(
        1,
        "rgba(0, 245, 255, 0.10)"
    );

    ctx.fillStyle = floorGradient;

    ctx.fillRect(
        0,
        state.height - 100,
        state.width,
        100
    );

    ctx.restore();
}

function drawPlayer(timestamp) {
    if (!state.player) {
        return;
    }

    const isInvulnerable =
        timestamp <
        state.invulnerableUntil;

    if (
        isInvulnerable &&
        Math.floor(timestamp / 90) % 2 === 0
    ) {
        return;
    }

    const player = state.player;

    ctx.save();

    ctx.translate(
        player.x + player.width / 2,
        player.y + player.height / 2
    );

    ctx.rotate(player.tilt);

    if (state.effects.shield > 0) {
        const shieldPulse =
            1 +
            Math.sin(timestamp * 0.008) *
                0.05;

        ctx.save();

        ctx.scale(
            shieldPulse,
            shieldPulse
        );

        ctx.beginPath();

        ctx.ellipse(
            0,
            0,
            player.width * 0.72,
            player.height * 1.5,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0, 245, 255, 0.08)";

        ctx.strokeStyle =
            "rgba(0, 245, 255, 0.85)";

        ctx.lineWidth = 2;

        ctx.shadowColor =
            "rgba(0, 245, 255, 0.8)";

        ctx.shadowBlur = 18;

        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    const bodyGradient =
        ctx.createLinearGradient(
            -player.width / 2,
            0,
            player.width / 2,
            0
        );

    bodyGradient.addColorStop(
        0,
        "#6a35ff"
    );

    bodyGradient.addColorStop(
        0.5,
        "#f4fbff"
    );

    bodyGradient.addColorStop(
        1,
        "#00eaff"
    );

    ctx.shadowColor =
        "rgba(0, 245, 255, 0.75)";

    ctx.shadowBlur = 16;

    ctx.fillStyle = bodyGradient;

    ctx.beginPath();

    ctx.moveTo(
        -player.width / 2,
        player.height / 2
    );

    ctx.lineTo(
        -player.width * 0.3,
        -player.height * 0.25
    );

    ctx.lineTo(
        -player.width * 0.1,
        -player.height / 2
    );

    ctx.lineTo(
        player.width * 0.1,
        -player.height / 2
    );

    ctx.lineTo(
        player.width * 0.3,
        -player.height * 0.25
    );

    ctx.lineTo(
        player.width / 2,
        player.height / 2
    );

    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff315d";

    ctx.fillRect(
        -player.width * 0.24,
        player.height * 0.15,
        player.width * 0.14,
        player.height * 0.18
    );

    ctx.fillRect(
        player.width * 0.1,
        player.height * 0.15,
        player.width * 0.14,
        player.height * 0.18
    );

    ctx.restore();
}

function drawBeams() {
    state.beams.forEach(beam => {
        beam.trail.forEach(
            (trailPoint, index) => {
                const alpha =
                    Math.max(
                        0,
                        trailPoint.life / 0.16
                    ) *
                    ((index + 1) /
                        beam.trail.length);

                ctx.save();

                ctx.globalAlpha =
                    alpha * 0.35;

                ctx.fillStyle =
                    "#00f5ff";

                ctx.fillRect(
                    trailPoint.x -
                        beam.width / 2,

                    trailPoint.y,
                    beam.width,
                    beam.height
                );

                ctx.restore();
            }
        );

        ctx.save();

        ctx.shadowColor =
            "rgba(0, 245, 255, 0.95)";

        ctx.shadowBlur = 18;

        const beamGradient =
            ctx.createLinearGradient(
                0,
                beam.y,
                0,
                beam.y + beam.height
            );

        beamGradient.addColorStop(
            0,
            "rgba(255,255,255,1)"
        );

        beamGradient.addColorStop(
            0.25,
            "rgba(0,245,255,1)"
        );

        beamGradient.addColorStop(
            1,
            "rgba(0,245,255,0)"
        );

        ctx.fillStyle = beamGradient;

        ctx.fillRect(
            beam.x - beam.width / 2,
            beam.y,
            beam.width,
            beam.height
        );

        ctx.restore();
    });
}

function drawOrbs(timestamp) {
    const time =
        timestamp * 0.001;

    state.orbs.forEach(orb => {
        ctx.save();

        ctx.translate(
            orb.x,
            orb.y
        );

        ctx.rotate(orb.rotation);

        const pulse =
            1 +
            Math.sin(
                time * 4 +
                    orb.wobbleOffset
            ) *
                0.035;

        ctx.scale(pulse, pulse);

        ctx.shadowColor =
            `hsla(${orb.hue}, 100%, 60%, 0.85)`;

        ctx.shadowBlur =
            orb.radius * 0.42;

        const gradient =
            ctx.createRadialGradient(
                -orb.radius * 0.28,
                -orb.radius * 0.3,
                orb.radius * 0.05,
                0,
                0,
                orb.radius
            );

        gradient.addColorStop(
            0,
            `hsla(${orb.hue}, 100%, 96%, 1)`
        );

        gradient.addColorStop(
            0.24,
            `hsla(${orb.hue}, 100%, 70%, 1)`
        );

        gradient.addColorStop(
            0.68,
            `hsla(${orb.hue + 25}, 90%, 38%, 1)`
        );

        gradient.addColorStop(
            1,
            `hsla(${orb.hue + 50}, 100%, 9%, 1)`
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            orb.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.lineWidth =
            Math.max(
                1.5,
                orb.radius * 0.06
            );

        ctx.strokeStyle =
            `hsla(${orb.hue}, 100%, 82%, 0.8)`;

        ctx.stroke();

        ctx.globalAlpha = 0.4;
        ctx.strokeStyle =
            `hsla(${orb.hue + 80}, 100%, 80%, 0.8)`;

        ctx.lineWidth = 1.2;

        for (
            let index = 0;
            index < 3;
            index += 1
        ) {
            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                orb.radius *
                    (0.45 + index * 0.12),

                orb.radius *
                    (0.16 + index * 0.06),

                index * 0.72,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }

        ctx.restore();
    });
}

function drawPowerUps(timestamp) {
    state.powerUps.forEach(powerUp => {
        ctx.save();

        ctx.translate(
            powerUp.x,
            powerUp.y
        );

        ctx.rotate(powerUp.rotation);

        const pulse =
            1 +
            Math.sin(powerUp.pulse) *
                0.1;

        ctx.scale(pulse, pulse);

        const color =
            getPowerUpColor(
                powerUp.effect
            );

        ctx.shadowColor = color;
        ctx.shadowBlur = 22;

        ctx.fillStyle =
            "rgba(5, 4, 12, 0.9)";

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();

        for (
            let index = 0;
            index < 6;
            index += 1
        ) {
            const angle =
                -Math.PI / 2 +
                index *
                    (Math.PI / 3);

            const x =
                Math.cos(angle) *
                powerUp.size;

            const y =
                Math.sin(angle) *
                powerUp.size;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.rotate(-powerUp.rotation);

        ctx.fillStyle = color;
        ctx.font =
            `900 ${Math.max(
                10,
                powerUp.size * 0.7
            )}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            getPowerUpSymbol(
                powerUp.effect
            ),
            0,
            1
        );

        ctx.restore();
    });
}

function getPowerUpColor(effectName) {
    const colors = {
        shield: "#00f5ff",
        freeze: "#7fdcff",
        rapid: "#ffe45c",
        doubleBeam: "#ff2fcf",
        scoreBurst: "#32ff9b",
        orbPanic: "#ff8a2a",
        earthquake: "#ff315d"
    };

    return (
        colors[effectName] ||
        "#ffffff"
    );
}

function getPowerUpSymbol(effectName) {
    const symbols = {
        shield: "S",
        freeze: "❄",
        rapid: "⚡",
        doubleBeam: "Ⅱ",
        scoreBurst: "+",
        orbPanic: "!",
        earthquake: "≋"
    };

    return (
        symbols[effectName] ||
        "?"
    );
}

function drawParticles() {
    state.particles.forEach(particle => {
        const alpha =
            Math.max(
                0,
                particle.life /
                    particle.maxLife
            );

        ctx.save();

        ctx.globalAlpha = alpha;

        ctx.fillStyle =
            `hsl(${particle.hue}, 100%, 68%)`;

        ctx.shadowColor =
            `hsl(${particle.hue}, 100%, 55%)`;

        ctx.shadowBlur =
            particle.size * 3;

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size * alpha,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    });
}

function drawFloatingTexts() {
    state.floatingTexts.forEach(
        floatingText => {
            const alpha =
                Math.max(
                    0,
                    floatingText.life /
                        floatingText.maxLife
                );

            ctx.save();

            ctx.globalAlpha = alpha;
            ctx.fillStyle =
                floatingText.color;

            ctx.shadowColor =
                floatingText.color;

            ctx.shadowBlur = 10;

            ctx.font =
                "900 16px Arial";

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(
                floatingText.text,
                floatingText.x,
                floatingText.y
            );

            ctx.restore();
        }
    );
}

/* =========================================================
   22. ANNOUNCEMENTS
========================================================= */

function showLevelAnnouncement() {
    if (
        !DOM.announcements.level ||
        !DOM.announcements.levelValue ||
        !DOM.announcements.levelMessage
    ) {
        return;
    }

    setText(
        DOM.announcements.levelValue,
        `LEVEL ${String(
            state.level
        ).padStart(2, "0")}`
    );

    setText(
        DOM.announcements.levelMessage,
        LEVEL_MESSAGES[
            (state.level - 1) %
                LEVEL_MESSAGES.length
        ]
    );

    restartCssAnimation(
        DOM.announcements.level,
        "is-active"
    );
}

function showWtfAnnouncement(message) {
    if (!DOM.announcements.wtf) {
        return;
    }

    setText(
        DOM.announcements.wtfMessage,
        message
    );

    restartCssAnimation(
        DOM.announcements.wtf,
        "is-active"
    );
}

function showComboAnnouncement(combo) {
    if (!DOM.announcements.combo) {
        return;
    }

    setText(
        DOM.announcements.combo,
        `COMBO x${combo}`
    );

    restartCssAnimation(
        DOM.announcements.combo,
        "is-active"
    );
}

function showStatusMessage(message) {
    if (!DOM.announcements.status) {
        return;
    }

    setText(
        DOM.announcements.status,
        message
    );

    restartCssAnimation(
        DOM.announcements.status,
        "is-active"
    );
}

function flashScreen() {
    if (!DOM.effects.screenFlash) {
        return;
    }

    restartCssAnimation(
        DOM.effects.screenFlash,
        "is-active"
    );
}

function triggerEarthquake(duration) {
    if (!DOM.effects.earthquake) {
        return;
    }

    DOM.effects.earthquake.classList.add(
        "is-active"
    );

    window.setTimeout(() => {
        DOM.effects.earthquake?.classList.remove(
            "is-active"
        );
    }, duration);
}

function restartCssAnimation(
    element,
    className
) {
    element.classList.remove(className);

    void element.offsetWidth;

    element.classList.add(className);
}

/* =========================================================
   23. KEYBOARD CONTROLS
========================================================= */

function handleKeyDown(event) {
    const targetTag =
        event.target?.tagName?.toLowerCase();

    const typingElement =
        targetTag === "input" ||
        targetTag === "textarea" ||
        targetTag === "select";

    if (typingElement) {
        return;
    }

    switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
            event.preventDefault();
            state.keys.left = true;
            break;

        case "ArrowRight":
        case "KeyD":
            event.preventDefault();
            state.keys.right = true;
            break;

        case "Space":
            if (
                state.currentScreen === "game"
            ) {
                event.preventDefault();

                state.keys.shoot = true;

                audioEngine.unlock();

                if (
                    state.running &&
                    !state.paused
                ) {
                    tryShoot(
                        performance.now()
                    );
                }
            }
            break;

        case "KeyP":
            if (
                state.currentScreen === "game"
            ) {
                event.preventDefault();
                togglePause();
            }
            break;

        case "Escape":
            if (
                DOM.whiteHat.modal?.getAttribute(
                    "aria-hidden"
                ) === "false"
            ) {
                closeWhiteHatProtocol();
                return;
            }

            if (
                state.currentScreen === "game" &&
                state.running
            ) {
                event.preventDefault();
                togglePause();
            }
            break;

        default:
            break;
    }
}

function handleKeyUp(event) {
    switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
            state.keys.left = false;
            break;

        case "ArrowRight":
        case "KeyD":
            state.keys.right = false;
            break;

        case "Space":
            state.keys.shoot = false;
            break;

        default:
            break;
    }
}

/* =========================================================
   24. MOBILE CONTROLS
========================================================= */

function bindHoldControl(
    button,
    controlName
) {
    if (!button) {
        return;
    }

    const activate = event => {
        event.preventDefault();

        audioEngine.unlock();

        state.touch[controlName] = true;

        button.classList.add(
            "is-active"
        );

        if (
            controlName === "shoot" &&
            state.running &&
            !state.paused
        ) {
            tryShoot(
                performance.now()
            );
        }

        try {
            button.setPointerCapture?.(
                event.pointerId
            );
        } catch (error) {
            /* Pointer capture nije obavezan. */
        }
    };

    const deactivate = event => {
        if (event) {
            event.preventDefault();
        }

        state.touch[controlName] = false;

        button.classList.remove(
            "is-active"
        );
    };

    button.addEventListener(
        "pointerdown",
        activate
    );

    button.addEventListener(
        "pointerup",
        deactivate
    );

    button.addEventListener(
        "pointercancel",
        deactivate
    );

    button.addEventListener(
        "pointerleave",
        event => {
            if (
                event.buttons === 0
            ) {
                deactivate(event);
            }
        }
    );

    button.addEventListener(
        "contextmenu",
        event => {
            event.preventDefault();
        }
    );
}

function releaseAllControls() {
    state.keys.left = false;
    state.keys.right = false;
    state.keys.shoot = false;

    state.touch.left = false;
    state.touch.right = false;
    state.touch.shoot = false;

    DOM.buttons.moveLeft?.classList.remove(
        "is-active"
    );

    DOM.buttons.moveRight?.classList.remove(
        "is-active"
    );

    DOM.buttons.shoot?.classList.remove(
        "is-active"
    );
}

/* =========================================================
   25. WHITE HAT PROTOCOL
========================================================= */

function openWhiteHatProtocol() {
    if (!DOM.whiteHat.modal) {
        return;
    }

    DOM.whiteHat.modal.classList.add(
        "is-open"
    );

    DOM.whiteHat.modal.setAttribute(
        "aria-hidden",
        "false"
    );

    DOM.buttons.closeWhiteHatProtocol?.focus();
}

function closeWhiteHatProtocol() {
    if (!DOM.whiteHat.modal) {
        return;
    }

    DOM.whiteHat.modal.classList.remove(
        "is-open"
    );

    DOM.whiteHat.modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (DOM.whiteHat.copyStatus) {
        DOM.whiteHat.copyStatus.textContent = "";
    }

    DOM.buttons.whiteHatProtocol?.focus();
}

async function copySecurityReportTemplate() {
    const reportTemplate = [
        "WHR SECURITY REPORT",
        "===================",
        "",
        "Verzija igre: v1.0.1",
        `Datum: ${new Date().toLocaleDateString("sr-RS")}`,
        "",
        "Uređaj:",
        "",
        "Operativni sistem:",
        "",
        "Pregledač i verzija:",
        "",
        "Opis problema:",
        "",
        "Koraci za ponavljanje:",
        "1.",
        "2.",
        "3.",
        "",
        "Očekivano ponašanje:",
        "",
        "Stvarno ponašanje:",
        "",
        "Bezbednosni uticaj:",
        "",
        "Dodatne napomene:",
        "",
        "Molim vas da ne šaljete lozinke, tokene ili privatne podatke."
    ].join("\n");

    try {
        await navigator.clipboard.writeText(
            reportTemplate
        );

        setText(
            DOM.whiteHat.copyStatus,
            "REPORT TEMPLATE COPIED"
        );
    } catch (error) {
        console.warn(
            "Clipboard nije dostupan:",
            error
        );

        const temporaryTextarea =
            document.createElement(
                "textarea"
            );

        temporaryTextarea.value =
            reportTemplate;

        temporaryTextarea.setAttribute(
            "readonly",
            ""
        );

        temporaryTextarea.style.position =
            "fixed";

        temporaryTextarea.style.opacity =
            "0";

        document.body.appendChild(
            temporaryTextarea
        );

        temporaryTextarea.select();

        try {
            document.execCommand("copy");

            setText(
                DOM.whiteHat.copyStatus,
                "REPORT TEMPLATE COPIED"
            );
        } catch (fallbackError) {
            setText(
                DOM.whiteHat.copyStatus,
                "COPY FAILED — SELECT TEXT MANUALLY"
            );
        }

        temporaryTextarea.remove();
    }
}

/* =========================================================
   26. EVENT BINDING
========================================================= */

function bindEvents() {
    DOM.buttons.start?.addEventListener(
        "click",
        startNewGame
    );

    DOM.buttons.howToPlay?.addEventListener(
        "click",
        openHowToPlay
    );

    DOM.buttons.closeHowToPlay?.addEventListener(
        "click",
        openStartScreen
    );

    DOM.buttons.instructionsStart?.addEventListener(
        "click",
        startNewGame
    );

    DOM.buttons.pause?.addEventListener(
        "click",
        togglePause
    );

    DOM.buttons.resume?.addEventListener(
        "click",
        resumeGame
    );

    DOM.buttons.restartFromPause?.addEventListener(
        "click",
        restartCurrentGame
    );

    DOM.buttons.quitFromPause?.addEventListener(
        "click",
        openStartScreen
    );

    DOM.buttons.nextLevel?.addEventListener(
        "click",
        continueToNextLevel
    );

    DOM.buttons.playAgain?.addEventListener(
        "click",
        startNewGame
    );

    DOM.buttons.gameOverMenu?.addEventListener(
        "click",
        openStartScreen
    );

    DOM.buttons.whiteHatProtocol?.addEventListener(
        "click",
        openWhiteHatProtocol
    );

    DOM.buttons.closeWhiteHatProtocol?.addEventListener(
        "click",
        closeWhiteHatProtocol
    );

    DOM.buttons.copySecurityReport?.addEventListener(
        "click",
        copySecurityReportTemplate
    );

    DOM.whiteHat.modal
        ?.querySelectorAll(
            "[data-close-white-hat]"
        )
        .forEach(element => {
            element.addEventListener(
                "click",
                closeWhiteHatProtocol
            );
        });

    bindHoldControl(
        DOM.buttons.moveLeft,
        "left"
    );

    bindHoldControl(
        DOM.buttons.moveRight,
        "right"
    );

    bindHoldControl(
        DOM.buttons.shoot,
        "shoot"
    );

    window.addEventListener(
        "keydown",
        handleKeyDown,
        {
            passive: false
        }
    );

    window.addEventListener(
        "keyup",
        handleKeyUp
    );

    window.addEventListener(
        "blur",
        () => {
            releaseAllControls();

            if (
                state.running &&
                !state.paused &&
                !state.gameOver &&
                state.currentScreen === "game"
            ) {
                pauseGame();
            }
        }
    );

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.hidden &&
                state.running &&
                !state.paused &&
                !state.gameOver &&
                state.currentScreen === "game"
            ) {
                pauseGame();
            }
        }
    );

    window.addEventListener(
        "resize",
        debounce(() => {
            resizeCanvas();
        }, 100)
    );

    window.addEventListener(
        "orientationchange",
        () => {
            window.setTimeout(
                resizeCanvas,
                250
            );
        }
    );

    DOM.canvas?.addEventListener(
        "pointerdown",
        () => {
            audioEngine.unlock();
            DOM.canvas.focus({
                preventScroll: true
            });
        }
    );

    document.addEventListener(
        "pointerdown",
        () => {
            audioEngine.unlock();
        },
        {
            once: true
        }
    );
}

/* =========================================================
   27. UTILITY FUNCTIONS
========================================================= */

function rectangleCircleCollision(
    rectangleX,
    rectangleY,
    rectangleWidth,
    rectangleHeight,
    circleX,
    circleY,
    circleRadius
) {
    const closestX = clamp(
        circleX,
        rectangleX,
        rectangleX + rectangleWidth
    );

    const closestY = clamp(
        circleY,
        rectangleY,
        rectangleY + rectangleHeight
    );

    const distanceX =
        circleX - closestX;

    const distanceY =
        circleY - closestY;

    return (
        distanceX * distanceX +
            distanceY * distanceY <=
        circleRadius * circleRadius
    );
}

function clamp(value, minimum, maximum) {
    return Math.min(
        maximum,
        Math.max(minimum, value)
    );
}

function lerp(start, end, amount) {
    return (
        start +
        (end - start) * amount
    );
}

function formatScore(score) {
    return String(
        Math.max(
            0,
            Math.round(score)
        )
    ).padStart(6, "0");
}

function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}

function debounce(callback, delay) {
    let timeoutId = null;

    return (...args) => {
        window.clearTimeout(timeoutId);

        timeoutId = window.setTimeout(
            () => {
                callback(...args);
            },
            delay
        );
    };
}

/* =========================================================
   28. INITIALIZATION
========================================================= */

function initializeGame() {
    if (!DOM.canvas || !ctx) {
        console.error(
            "WHR ERROR: Canvas nije pronađen."
        );
        return;
    }

    bindEvents();

    hidePauseOverlay();
    hideAllAnnouncements();

    updateStartRecords();
    updateHUD();

    showScreen("start");

    window.requestAnimationFrame(() => {
        resizeCanvas();
        renderGame(performance.now());
    });

    console.log(
        "%cWHR: POWER WTF UP v1.0.1",
        "color:#00f5ff;font-size:20px;font-weight:bold;"
    );

    console.log(
        "%cCHAOS ENGINE READY",
        "color:#32ff9b;font-size:13px;font-weight:bold;"
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeGame
    );
} else {
    initializeGame();
}
