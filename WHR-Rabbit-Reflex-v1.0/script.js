"use strict";

/**
 * WHR Rabbit Reflex v1.0
 * White Hat Rabbit Studios
 *
 * Vanilla JavaScript mini-game.
 * No external game engine or JavaScript library.
 */

const GAME_CONFIG = Object.freeze({
    version: "1.0",

    initialTime: 45,
    initialLives: 3,

    baseTargetPoints: 100,
    goldenTargetPoints: 500,
    goldenTimeBonus: 2.5,

    decoyPenalty: 250,
    emptyTapPenalty: 0,

    hitsPerLevel: 8,
    maximumLevel: 20,

    baseTargetLifetime: 1450,
    minimumTargetLifetime: 520,
    lifetimeDecreasePerLevel: 65,

    baseSpawnDelay: 760,
    minimumSpawnDelay: 260,
    spawnDelayDecreasePerLevel: 36,

    goldenChance: 0.08,
    maximumGoldenChance: 0.16,

    baseDecoyChance: 0.12,
    maximumDecoyChance: 0.34,

    comboResetDelay: 1700,
    maximumComboMultiplier: 12,

    targetSizeMobile: 82,
    targetSizeDesktop: 94,
    minimumTargetSize: 58,
    targetSizeDecreasePerLevel: 1.8,

    targetMargin: 52,

    bestScoreStorageKey: "whr-rabbit-reflex-best-score",
    soundStorageKey: "whr-rabbit-reflex-sound-enabled"
});

const TARGET_TYPES = Object.freeze({
    RABBIT: "rabbit",
    DECOY: "decoy",
    GOLDEN: "golden"
});

const GAME_STATES = Object.freeze({
    READY: "ready",
    COUNTDOWN: "countdown",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "game-over"
});

class SafeStorage {
    static getNumber(key, fallbackValue = 0) {
        try {
            const storedValue = window.localStorage.getItem(key);
            const parsedValue = Number(storedValue);

            return Number.isFinite(parsedValue)
                ? parsedValue
                : fallbackValue;
        } catch (error) {
            console.warn("Local storage is unavailable:", error);
            return fallbackValue;
        }
    }

    static getBoolean(key, fallbackValue = true) {
        try {
            const storedValue = window.localStorage.getItem(key);

            if (storedValue === null) {
                return fallbackValue;
            }

            return storedValue === "true";
        } catch (error) {
            console.warn("Local storage is unavailable:", error);
            return fallbackValue;
        }
    }

    static set(key, value) {
        try {
            window.localStorage.setItem(key, String(value));
        } catch (error) {
            console.warn("Unable to write to local storage:", error);
        }
    }
}

class AudioEngine {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.enabled = SafeStorage.getBoolean(
            GAME_CONFIG.soundStorageKey,
            true
        );
    }

    initialize() {
        if (this.context) {
            return;
        }

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            this.enabled = false;
            return;
        }

        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.16;
        this.masterGain.connect(this.context.destination);
    }

    resume() {
        this.initialize();

        if (
            this.context &&
            this.context.state === "suspended"
        ) {
            this.context.resume().catch(() => {
                // Audio remains optional.
            });
        }
    }

    setEnabled(enabled) {
        this.enabled = Boolean(enabled);

        SafeStorage.set(
            GAME_CONFIG.soundStorageKey,
            this.enabled
        );

        if (this.enabled) {
            this.resume();
            this.playUiConfirm();
        }
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    createTone({
        frequency = 440,
        endFrequency = frequency,
        duration = 0.1,
        type = "sine",
        volume = 0.2,
        delay = 0
    }) {
        if (!this.enabled) {
            return;
        }

        this.resume();

        if (!this.context || !this.masterGain) {
            return;
        }

        const startTime = this.context.currentTime + delay;
        const endTime = startTime + duration;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            Math.max(20, frequency),
            startTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(20, endFrequency),
            endTime
        );

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, volume),
            startTime + Math.min(0.02, duration * 0.25)
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            endTime
        );

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(startTime);
        oscillator.stop(endTime + 0.02);
    }

    playStartSequence() {
        const tones = [220, 330, 440, 660];

        tones.forEach((frequency, index) => {
            this.createTone({
                frequency,
                endFrequency: frequency * 1.08,
                duration: 0.12,
                type: "sawtooth",
                volume: 0.16,
                delay: index * 0.09
            });
        });
    }

    playCountdown(value) {
        const frequencyMap = {
            3: 290,
            2: 360,
            1: 440,
            GO: 760
        };

        const frequency = frequencyMap[value] || 320;

        this.createTone({
            frequency,
            endFrequency:
                value === "GO"
                    ? 1180
                    : frequency * 1.15,
            duration:
                value === "GO"
                    ? 0.22
                    : 0.12,
            type: "square",
            volume: 0.2
        });
    }

    playRabbitHit(comboMultiplier) {
        const comboBoost = Math.min(comboMultiplier, 10) * 28;

        this.createTone({
            frequency: 480 + comboBoost,
            endFrequency: 820 + comboBoost,
            duration: 0.09,
            type: "sine",
            volume: 0.25
        });

        this.createTone({
            frequency: 980 + comboBoost,
            endFrequency: 1240 + comboBoost,
            duration: 0.06,
            type: "triangle",
            volume: 0.11,
            delay: 0.025
        });
    }

    playGoldenHit() {
        [660, 880, 1100, 1320].forEach((frequency, index) => {
            this.createTone({
                frequency,
                endFrequency: frequency * 1.12,
                duration: 0.16,
                type: "triangle",
                volume: 0.18,
                delay: index * 0.045
            });
        });
    }

    playDamage() {
        this.createTone({
            frequency: 190,
            endFrequency: 58,
            duration: 0.28,
            type: "sawtooth",
            volume: 0.3
        });

        this.createTone({
            frequency: 110,
            endFrequency: 45,
            duration: 0.34,
            type: "square",
            volume: 0.12,
            delay: 0.025
        });
    }

    playMiss() {
        this.createTone({
            frequency: 185,
            endFrequency: 130,
            duration: 0.12,
            type: "triangle",
            volume: 0.12
        });
    }

    playLevelUp() {
        [440, 554, 659, 880].forEach((frequency, index) => {
            this.createTone({
                frequency,
                endFrequency: frequency * 1.05,
                duration: 0.2,
                type: "sine",
                volume: 0.2,
                delay: index * 0.075
            });
        });
    }

    playGameOver() {
        [420, 320, 240, 150].forEach((frequency, index) => {
            this.createTone({
                frequency,
                endFrequency: frequency * 0.75,
                duration: 0.24,
                type: "sawtooth",
                volume: 0.17,
                delay: index * 0.12
            });
        });
    }

    playUiConfirm() {
        this.createTone({
            frequency: 500,
            endFrequency: 720,
            duration: 0.07,
            type: "sine",
            volume: 0.12
        });
    }

    playPause() {
        this.createTone({
            frequency: 520,
            endFrequency: 260,
            duration: 0.12,
            type: "triangle",
            volume: 0.12
        });
    }

    playResume() {
        this.createTone({
            frequency: 260,
            endFrequency: 540,
            duration: 0.12,
            type: "triangle",
            volume: 0.12
        });
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.particles = [];
        this.animationFrameId = null;
        this.lastTimestamp = 0;
        this.pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);

        window.addEventListener("resize", this.resize);
        this.resize();
        this.start();
    }

    resize() {
        const bounds = this.canvas.getBoundingClientRect();

        this.pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        this.canvas.width = Math.max(
            1,
            Math.floor(bounds.width * this.pixelRatio)
        );

        this.canvas.height = Math.max(
            1,
            Math.floor(bounds.height * this.pixelRatio)
        );

        this.context.setTransform(
            this.pixelRatio,
            0,
            0,
            this.pixelRatio,
            0,
            0
        );
    }

    start() {
        if (this.animationFrameId !== null) {
            return;
        }

        this.animationFrameId =
            window.requestAnimationFrame(this.animate);
    }

    animate(timestamp) {
        const deltaTime = Math.min(
            32,
            timestamp - (this.lastTimestamp || timestamp)
        );

        this.lastTimestamp = timestamp;

        const bounds = this.canvas.getBoundingClientRect();

        this.context.clearRect(
            0,
            0,
            bounds.width,
            bounds.height
        );

        this.particles = this.particles.filter((particle) => {
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                return false;
            }

            const progress = particle.life / particle.maxLife;

            particle.x += particle.velocityX * (deltaTime / 16.67);
            particle.y += particle.velocityY * (deltaTime / 16.67);
            particle.velocityY += particle.gravity * (deltaTime / 16.67);
            particle.velocityX *= 0.986;
            particle.velocityY *= 0.986;
            particle.rotation += particle.rotationSpeed * (deltaTime / 16.67);

            this.context.save();
            this.context.globalAlpha = Math.max(0, progress);
            this.context.translate(particle.x, particle.y);
            this.context.rotate(particle.rotation);

            this.context.shadowBlur = particle.glow;
            this.context.shadowColor = particle.color;
            this.context.fillStyle = particle.color;

            if (particle.shape === "line") {
                this.context.fillRect(
                    -particle.size,
                    -1,
                    particle.size * 2,
                    2
                );
            } else if (particle.shape === "diamond") {
                this.context.rotate(Math.PI / 4);
                this.context.fillRect(
                    -particle.size / 2,
                    -particle.size / 2,
                    particle.size,
                    particle.size
                );
            } else {
                this.context.beginPath();
                this.context.arc(
                    0,
                    0,
                    particle.size,
                    0,
                    Math.PI * 2
                );
                this.context.fill();
            }

            this.context.restore();

            return true;
        });

        this.animationFrameId =
            window.requestAnimationFrame(this.animate);
    }

    burst({
        x,
        y,
        color = "#00f5ff",
        count = 18,
        power = 5,
        gravity = 0.08,
        shapes = ["circle", "line", "diamond"]
    }) {
        for (let index = 0; index < count; index += 1) {
            const angle =
                (Math.PI * 2 * index) / count +
                Math.random() * 0.35;

            const speed =
                power * (0.45 + Math.random() * 0.75);

            const life =
                380 + Math.random() * 420;

            this.particles.push({
                x,
                y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                gravity,
                size: 1.2 + Math.random() * 3.4,
                color,
                glow: 5 + Math.random() * 9,
                life,
                maxLife: life,
                rotation: Math.random() * Math.PI,
                rotationSpeed: (Math.random() - 0.5) * 0.24,
                shape:
                    shapes[
                        Math.floor(Math.random() * shapes.length)
                    ]
            });
        }
    }

    ring({
        x,
        y,
        color = "#00f5ff",
        count = 16,
        radius = 28
    }) {
        for (let index = 0; index < count; index += 1) {
            const angle = (Math.PI * 2 * index) / count;

            this.particles.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                velocityX: Math.cos(angle) * 2.4,
                velocityY: Math.sin(angle) * 2.4,
                gravity: 0,
                size: 1.5 + Math.random() * 1.8,
                color,
                glow: 8,
                life: 430,
                maxLife: 430,
                rotation: angle,
                rotationSpeed: 0.05,
                shape: "line"
            });
        }
    }

    clear() {
        this.particles.length = 0;
    }
}

class RabbitReflexGame {
    constructor() {
        this.elements = this.collectElements();

        this.audio = new AudioEngine();
        this.particles = new ParticleSystem(
            this.elements.particleCanvas
        );

        this.state = GAME_STATES.READY;
        this.score = 0;
        this.bestScore = SafeStorage.getNumber(
            GAME_CONFIG.bestScoreStorageKey,
            0
        );

        this.level = 1;
        this.levelHits = 0;
        this.totalSuccessfulHits = 0;
        this.totalTargetAttempts = 0;
        this.totalPlayerTaps = 0;

        this.comboCount = 0;
        this.comboMultiplier = 1;
        this.maximumCombo = 1;

        this.lives = GAME_CONFIG.initialLives;
        this.timeRemaining = GAME_CONFIG.initialTime;

        this.currentTarget = null;
        this.targetTimeoutId = null;
        this.spawnTimeoutId = null;
        this.comboTimeoutId = null;
        this.floatingMessageTimeoutId = null;

        this.gameLoopFrameId = null;
        this.lastFrameTimestamp = 0;
        this.targetSpawnTimestamp = 0;
        this.targetLifetime = GAME_CONFIG.baseTargetLifetime;

        this.isStarting = false;
        this.wasNewRecord = false;
        this.visibilityPausedGame = false;

        this.boundGameLoop = this.gameLoop.bind(this);

        this.attachEventListeners();
        this.updateAllUI();
        this.updateSoundButton();
        this.setStatus("SYSTEM READY", "normal");
        this.resizeParticlesAfterLayout();
    }

    collectElements() {
        const getRequiredElement = (id) => {
            const element = document.getElementById(id);

            if (!element) {
                throw new Error(`Missing required element: #${id}`);
            }

            return element;
        };

        return {
            appShell: getRequiredElement("appShell"),
            gameStage: getRequiredElement("gameStage"),
            targetLayer: getRequiredElement("targetLayer"),
            particleCanvas: getRequiredElement("particleCanvas"),
            crosshair: getRequiredElement("crosshair"),

            startOverlay: getRequiredElement("startOverlay"),
            countdownOverlay: getRequiredElement("countdownOverlay"),
            pauseOverlay: getRequiredElement("pauseOverlay"),
            gameOverOverlay: getRequiredElement("gameOverOverlay"),

            startButton: getRequiredElement("startButton"),
            pauseButton: getRequiredElement("pauseButton"),
            resumeButton: getRequiredElement("resumeButton"),
            restartButton: getRequiredElement("restartButton"),
            soundButton: getRequiredElement("soundButton"),
            soundIcon: getRequiredElement("soundIcon"),

            countdownValue: getRequiredElement("countdownValue"),

            scoreValue: getRequiredElement("scoreValue"),
            bestScoreValue: getRequiredElement("bestScoreValue"),
            comboValue: getRequiredElement("comboValue"),
            comboCard: getRequiredElement("comboCard"),
            levelValue: getRequiredElement("levelValue"),
            timeValue: getRequiredElement("timeValue"),
            timerDisplay: document.querySelector(".timer-display"),

            statusText: getRequiredElement("statusText"),
            statusChip: document.querySelector(".status-chip"),
            livesContainer: getRequiredElement("livesContainer"),

            progressText: getRequiredElement("progressText"),
            progressFill: getRequiredElement("progressFill"),

            floatingMessage: getRequiredElement("floatingMessage"),
            floatingMessageMain:
                document.querySelector(".floating-message__main"),
            floatingMessageSub:
                document.querySelector(".floating-message__sub"),

            finalScoreValue: getRequiredElement("finalScoreValue"),
            finalBestValue: getRequiredElement("finalBestValue"),
            finalComboValue: getRequiredElement("finalComboValue"),
            finalAccuracyValue: getRequiredElement("finalAccuracyValue"),
            resultRank: getRequiredElement("resultRank"),
            newRecordMessage: getRequiredElement("newRecordMessage"),

            scoreCard: document.querySelector(".hud-card--score")
        };
    }

    attachEventListeners() {
        this.elements.startButton.addEventListener(
            "click",
            () => this.beginStartSequence()
        );

        this.elements.restartButton.addEventListener(
            "click",
            () => this.beginStartSequence()
        );

        this.elements.pauseButton.addEventListener(
            "click",
            () => this.togglePause()
        );

        this.elements.resumeButton.addEventListener(
            "click",
            () => this.resumeGame()
        );

        this.elements.soundButton.addEventListener(
            "click",
            () => {
                this.audio.toggle();
                this.updateSoundButton();
            }
        );

        this.elements.gameStage.addEventListener(
            "pointermove",
            (event) => this.updateCrosshair(event)
        );

        this.elements.gameStage.addEventListener(
            "pointerleave",
            () => {
                this.elements.crosshair.style.opacity = "0";
            }
        );

        this.elements.gameStage.addEventListener(
            "pointerenter",
            () => {
                this.elem
