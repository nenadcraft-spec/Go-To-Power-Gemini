"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.0
   GAME ENGINE
========================================================= */

(() => {
    /* =====================================================
       CONFIGURATION
    ====================================================== */

    const CONFIG = {
        player: {
            width: 46,
            height: 26,
            speed: 420,
            fireCooldown: 340,
            rapidFireCooldown: 150,
            invulnerabilityDuration: 1700
        },

        beam: {
            width: 5,
            speed: 820,
            maxActive: 1,
            doubleBeamMaxActive: 2
        },

        orb: {
            gravity: 980,
            minHorizontalSpeed: 90,
            maxHorizontalSpeed: 240,
            speedGrowthPerLevel: 0.035,
            maxSpeedMultiplier: 1.85
        },

        powerUp: {
            fallSpeed: 145,
            lifetime: 9000,
            normalDropChance: 0.14,
            lifeDropChance: 0.025,
            wtfDropChance: 0.055
        },

        effects: {
            shieldDuration: 10000,
            freezeDuration: 3000,
            slowDuration: 7000,
            rapidDuration: 8000,
            doubleBeamDuration: 9000,
            earthquakeDuration: 3200,
            turboDuration: 6500
        },

        combo: {
            timeout: 2200,
            maxMultiplier: 12
        },

        score: {
            orbBase: 100,
            levelClear: 1000
        }
    };

    const STORAGE_KEYS = {
        bestScore: "whrPowerWtfUpBestScore",
        maxLevel: "whrPowerWtfUpMaxLevel"
    };

    const ORB_SIZES = {
        3: {
            radius: 42,
            bounceVelocity: 625,
            score: 100,
            colorA: "#ff3cac",
            colorB: "#7b2cff"
        },

        2: {
            radius: 30,
            bounceVelocity: 560,
            score: 180,
            colorA: "#9d4dff",
            colorB: "#38f5ff"
        },

        1: {
            radius: 20,
            bounceVelocity: 500,
            score: 280,
            colorA: "#38f5ff",
            colorB: "#2470ff"
        },

        0: {
            radius: 12,
            bounceVelocity: 430,
            score: 420,
            colorA: "#ffe45c",
            colorB: "#ff8a38"
        }
    };

    const POWER_UP_TYPES = {
        SHIELD: "shield",
        FREEZE: "freeze",
        SLOW: "slow",
        RAPID: "rapid",
        DOUBLE: "double",
        LIFE: "life",
        WTF: "wtf"
    };

    /* =====================================================
       DOM
    ====================================================== */

    const dom = {
        body: document.body,

        screens: {
            start: document.getElementById("startScreen"),
            howTo: document.getElementById("howToPlayScreen"),
            game: document.getElementById("gameScreen"),
            levelComplete: document.getElementById("levelCompleteScreen"),
            gameOver: document.getElementById("gameOverScreen")
        },

        startButton: document.getElementById("startButton"),
        howToPlayButton: document.getElementById("howToPlayButton"),
        closeHowToPlayButton: document.getElementById("closeHowToPlayButton"),
        instructionsStartButton: document.getElementById("instructionsStartButton"),

        nextLevelButton: document.getElementById("nextLevelButton"),
        playAgainButton: document.getElementById("playAgainButton"),
        gameOverMenuButton: document.getElementById("gameOverMenuButton"),

        pauseButton: document.getElementById("pauseButton"),
        resumeButton: document.getElementById("resumeButton"),
        restartFromPauseButton: document.getElementById("restartFromPauseButton"),
        quitFromPauseButton: document.getElementById("quitFromPauseButton"),
        pauseOverlay: document.getElementById("pauseOverlay"),

        scoreValue: document.getElementById("scoreValue"),
        bestScoreValue: document.getElementById("bestScoreValue"),
        levelValue: document.getElementById("levelValue"),
        comboValue: document.getElementById("comboValue"),
        livesContainer: document.getElementById("livesContainer"),

        startBestScore: document.getElementById("startBestScore"),
        startMaxLevel: document.getElementById("startMaxLevel"),

        dangerMeter: document.getElementById("dangerMeter"),
        dangerMeterFill: document.getElementById("dangerMeterFill"),

        levelScoreValue: document.getElementById("levelScoreValue"),
        levelMaxComboValue: document.getElementById("levelMaxComboValue"),
        orbsDestroyedValue: document.getElementById("orbsDestroyedValue"),
        levelCompleteMessage: document.getElementById("levelCompleteMessage"),

        finalScoreValue: document.getElementById("finalScoreValue"),
        finalLevelValue: document.getElementById("finalLevelValue"),
        finalComboValue: document.getElementById("finalComboValue"),
        newRecordBadge: document.getElementById("newRecordBadge"),

        gameStage: document.getElementById("gameStage"),
        canvas: document.getElementById("gameCanvas"),
        screenFlash: document.getElementById("screenFlash"),
        earthquakeOverlay: document.getElementById("earthquakeOverlay"),

        levelAnnouncement: document.getElementById("levelAnnouncement"),
        levelAnnouncementValue: document.getElementById("levelAnnouncementValue"),
        levelAnnouncementMessage: document.getElementById("levelAnnouncementMessage"),

        wtfAnnouncement: document.getElementById("wtfAnnouncement"),
        wtfEffectMessage: document.getElementById("wtfEffectMessage"),
        comboAnnouncement: document.getElementById("comboAnnouncement"),
        statusMessage: document.getElementById("statusMessage"),

        shieldIndicator: document.getElementById("shieldIndicator"),
        shieldTimer: document.getElementById("shieldTimer"),
        freezeIndicator: document.getElementById("freezeIndicator"),
        freezeTimer: document.getElementById("freezeTimer"),
        rapidIndicator: document.getElementById("rapidIndicator"),
        rapidTimer: document.getElementById("rapidTimer"),
        doubleBeamIndicator: document.getElementById("doubleBeamIndicator"),
        doubleBeamTimer: document.getElementById("doubleBeamTimer"),

        moveLeftButton: document.getElementById("moveLeftButton"),
        moveRightButton: document.getElementById("moveRightButton"),
        shootButton: document.getElementById("shootButton"),

        audioStatus: document.getElementById("audioStatus")
    };

    const ctx = dom.canvas.getContext("2d", {
        alpha: true
    });

    /* =====================================================
       UTILITIES
    ====================================================== */

    const Utils = {
        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        random(min, max) {
            return Math.random() * (max - min) + min;
        },

        randomInt(min, max) {
            return Math.floor(Utils.random(min, max + 1));
        },

        choose(array) {
            return array[Math.floor(Math.random() * array.length)];
        },

        formatScore(value) {
            return Math.max(0, Math.floor(value))
                .toString()
                .padStart(6, "0");
        },

        circleRectCollision(circle, rect) {
            const closestX = Utils.clamp(
                circle.x,
                rect.x,
                rect.x + rect.width
            );

            const closestY = Utils.clamp(
                circle.y,
                rect.y,
                rect.y + rect.height
            );

            const dx = circle.x - closestX;
            const dy = circle.y - closestY;

            return dx * dx + dy * dy <= circle.radius * circle.radius;
        },

        rectCollision(a, b) {
            return (
                a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y
            );
        },

        now() {
            return performance.now();
        }
    };

    /* =====================================================
       AUDIO ENGINE
    ====================================================== */

    class AudioEngine {
        constructor() {
            this.context = null;
            this.masterGain = null;
            this.enabled = true;
            this.initialized = false;
        }

        initialize() {
            if (this.initialized) {
                if (this.context?.state === "suspended") {
                    this.context.resume().catch(() => {});
                }

                return;
            }

            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) {
                this.enabled = false;
                return;
            }

            try {
                this.context = new AudioContextClass();
                this.masterGain = this.context.createGain();
                this.masterGain.gain.value = 0.24;
                this.masterGain.connect(this.context.destination);
                this.initialized = true;
            } catch (error) {
                console.warn("Audio initialization failed:", error);
                this.enabled = false;
            }
        }

        tone({
            frequency = 440,
            duration = 0.1,
            type = "sine",
            volume = 0.16,
            frequencyEnd = null,
            delay = 0
        } = {}) {
            if (!this.enabled) {
                return;
            }

            this.initialize();

            if (!this.context || !this.masterGain) {
                return;
            }

            const startTime = this.context.currentTime + delay;
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, startTime);

            if (frequencyEnd !== null) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    Math.max(20, frequencyEnd),
                    startTime + duration
                );
            }

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(
                Math.max(0.0001, volume),
                startTime + 0.008
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                startTime + duration
            );

            oscillator.connect(gain);
            gain.connect(this.masterGain);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration + 0.02);
        }

        noise(duration = 0.18, volume = 0.08) {
            if (!this.enabled) {
                return;
            }

            this.initialize();

            if (!this.context || !this.masterGain) {
                return;
            }

            const length = Math.max(
                1,
                Math.floor(this.context.sampleRate * duration)
            );

            const buffer = this.context.createBuffer(
                1,
                length,
                this.context.sampleRate
            );

            const data = buffer.getChannelData(0);

            for (let i = 0; i < length; i += 1) {
                data[i] = Math.random() * 2 - 1;
            }

            const source = this.context.createBufferSource();
            const filter = this.context.createBiquadFilter();
            const gain = this.context.createGain();

            filter.type = "lowpass";
            filter.frequency.value = 900;

            gain.gain.setValueAtTime(
                volume,
                this.context.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                this.context.currentTime + duration
            );

            source.buffer = buffer;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            source.start();
        }

        shoot() {
            this.tone({
                frequency: 760,
                frequencyEnd: 1250,
                duration: 0.075,
                type: "square",
                volume: 0.07
            });
        }

        orbBounce(size = 1) {
            const frequencies = [410, 320, 235, 165];

            this.tone({
                frequency: frequencies[size] || 250,
                frequencyEnd: (frequencies[size] || 250) * 0.76,
                duration: 0.055,
                type: "triangle",
                volume: 0.025
            });
        }

        orbDestroy(size = 1) {
            const frequency = 420 + size * 105;

            this.tone({
                frequency,
                frequencyEnd: 90,
                duration: 0.13 + size * 0.035,
                type: "sawtooth",
                volume: 0.075
            });

            if (size >= 2) {
                this.noise(0.1, 0.035);
            }
        }

        collect() {
            this.tone({
                frequency: 660,
                frequencyEnd: 1320,
                duration: 0.18,
                type: "sine",
                volume: 0.13
            });

            this.tone({
                frequency: 990,
                duration: 0.14,
                type: "triangle",
                volume: 0.08,
                delay: 0.07
            });
        }

        life() {
            [523, 659, 784, 1047].forEach((frequency, index) => {
                this.tone({
                    frequency,
                    duration: 0.16,
                    type: "sine",
                    volume: 0.1,
                    delay: index * 0.065
                });
            });
        }

        shieldHit() {
            this.tone({
                frequency: 180,
                frequencyEnd: 920,
                duration: 0.28,
                type: "sawtooth",
                volume: 0.11
            });
        }

        damage() {
            this.noise(0.28, 0.13);

            this.tone({
                frequency: 130,
                frequencyEnd: 44,
                duration: 0.38,
                type: "square",
                volume: 0.12
            });
        }

        combo(combo) {
            this.tone({
                frequency: 480 + combo * 42,
                frequencyEnd: 760 + combo * 55,
                duration: 0.12,
                type: "triangle",
                volume: 0.08
            });
        }

        earthquake() {
            this.noise(0.8, 0.11);

            this.tone({
                frequency: 55,
                frequencyEnd: 30,
                duration: 1.1,
                type: "sawtooth",
                volume: 0.14
            });
        }

        wtf() {
            const notes = [180, 720, 290, 1100];

            notes.forEach((frequency, index) => {
                this.tone({
                    frequency,
                    frequencyEnd: frequency * 1.4,
                    duration: 0.16,
                    type: index % 2 === 0 ? "square" : "sawtooth",
                    volume: 0.09,
                    delay: index * 0.055
                });
            });

            this.noise(0.22, 0.07);
        }

        levelComplete() {
            [392, 523, 659, 784, 1047].forEach((frequency, index) => {
                this.tone({
                    frequency,
                    duration: 0.22,
                    type: "triangle",
                    volume: 0.1,
                    delay: index * 0.08
                });
            });
        }

        gameOver() {
            [330, 247, 196, 98].forEach((frequency, index) => {
                this.tone({
                    frequency,
                    frequencyEnd: frequency * 0.76,
                    duration: 0.3,
                    type: "sawtooth",
                    volume: 0.09,
                    delay: index * 0.13
                });
            });
        }
    }

    const audio = new AudioEngine();

    /* =====================================================
       PARTICLES
    ====================================================== */

    class Particle {
        constructor(x, y, options = {}) {
            this.x = x;
            this.y = y;

            this.vx = options.vx ?? Utils.random(-220, 220);
            this.vy = options.vy ?? Utils.random(-260, 90);

            this.size = options.size ?? Utils.random(2, 6);
            this.color = options.color ?? "#38f5ff";
            this.life = options.life ?? Utils.random(350, 720);
            this.maxLife = this.life;
            this.gravity = options.gravity ?? 420;
            this.drag = options.drag ?? 0.985;
            this.glow = options.glow ?? 12;
        }

        update(delta) {
            const dt = delta / 1000;

            this.life -= delta;
            this.vy += this.gravity * dt;
            this.vx *= this.drag;
            this.vy *= this.drag;

            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        draw(context) {
            const alpha = Utils.clamp(this.life / this.maxLife, 0, 1);

            context.save();
            context.globalAlpha = alpha;
            context.fillStyle = this.color;
            context.shadowColor = this.color;
            context.shadowBlur = this.glow;

            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fill();

            context.restore();
        }

        get dead() {
            return this.life <= 0;
        }
    }

    /* =====================================================
       PLAYER
    ====================================================== */

    class Player {
        constructor(game) {
            this.game = game;

            this.width = CONFIG.player.width;
            this.height = CONFIG.player.height;

            this.x = 0;
            this.y = 0;

            this.speed = CONFIG.player.speed;
            this.direction = 0;

            this.lastShotAt = -Infinity;
            this.invulnerableUntil = 0;
            this.flash = 0;
        }

        resetPosition() {
            this.x = this.game.width / 2 - this.width / 2;
            this.y = this.game.height - this.height - 16;
            this.direction = 0;
        }

        update(delta) {
            const dt = delta / 1000;

            this.x += this.direction * this.speed * dt;

            this.x = Utils.clamp(
                this.x,
                8,
                this.game.width - this.width - 8
            );

            if (this.flash > 0) {
                this.flash -= delta;
            }
        }

        canShoot(now) {
            const cooldown = this.game.effects.rapid.active
                ? CONFIG.player.rapidFireCooldown
                : CONFIG.player.fireCooldown;

            const activeLimit = this.game.effects.double.active
                ? CONFIG.beam.doubleBeamMaxActive
                : CONFIG.beam.maxActive;

            return (
                now - this.lastShotAt >= cooldown &&
                this.game.beams.length < activeLimit
            );
        }

        shoot(now) {
            if (!this.canShoot(now)) {
                return;
            }

            this.lastShotAt = now;

            if (this.game.effects.double.active) {
                const offset = this.width * 0.22;

                this.game.beams.push(
                    new Beam(
                        this.game,
                        this.x + this.width / 2 - offset,
                        this.y
                    )
                );

                this.game.beams.push(
                    new Beam(
                        this.game,
                        this.x + this.width / 2 + offset,
                        this.y
                    )
                );
            } else {
                this.game.beams.push(
                    new Beam(
                        this.game,
                        this.x + this.width / 2,
                        this.y
                    )
                );
            }

            audio.shoot();
        }

        hit() {
            const now = Utils.now();

            if (now < this.invulnerableUntil) {
                return false;
            }

            if (this.game.effects.shield.active) {
                this.game.deactivateEffect("shield");
                this.invulnerableUntil = now + 650;

                audio.shieldHit();

                this.game.flashScreen("power");
                this.game.showStatus("SHIELD ABSORBED THE HIT", "success");
                this.game.createExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    "#38f5ff",
                    24
                );

                return false;
            }

            this.invulnerableUntil =
                now + CONFIG.player.invulnerabilityDuration;

            this.flash = CONFIG.player.invulnerabilityDuration;

            return true;
        }

        draw(context) {
            const now = Utils.now();

            if (
                now < this.invulnerableUntil &&
                Math.floor(now / 90) % 2 === 0
            ) {
                return;
            }

            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            context.save();

            if (this.game.effects.shield.active) {
                const pulse = 1 + Math.sin(now * 0.009) * 0.06;

                context.strokeStyle = "#38f5ff";
                context.lineWidth = 2;
                context.shadowColor = "#38f5ff";
                context.shadowBlur = 18;

                context.beginPath();
                context.arc(
                    centerX,
                    centerY,
                    34 * pulse,
                    0,
                    Math.PI * 2
                );
                context.stroke();
            }

            context.translate(centerX, centerY);

            context.shadowColor = "#38f5ff";
            context.shadowBlur = 18;

            const gradient = context.createLinearGradient(
                -this.width / 2,
                0,
                this.width / 2,
                0
            );

            gradient.addColorStop(0, "#6f3cff");
            gradient.addColorStop(0.5, "#ffffff");
            gradient.addColorStop(1, "#38f5ff");

            context.fillStyle = gradient;

            context.beginPath();
            context.moveTo(0, -this.height / 2);
            context.lineTo(this.width / 2, this.height / 2);
            context.lineTo(9, this.height / 2 - 4);
            context.lineTo(0, this.height / 2);
            context.lineTo(-9, this.height / 2 - 4);
            context.lineTo(-this.width / 2, this.height / 2);
            context.closePath();
            context.fill();

            context.fillStyle = "#ff3cac";
            context.shadowColor = "#ff3cac";
            context.shadowBlur = 14;

            context.fillRect(-3, -this.height / 2 - 8, 6, 14);

            context.fillStyle = "#0b061c";
            context.shadowBlur = 0;

            context.beginPath();
            context.arc(0, 3, 5, 0, Math.PI * 2);
            context.fill();

            context.restore();
        }

        get rect() {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
        }
    }

    /* =====================================================
       BEAM
    ====================================================== */

    class Beam {
        constructor(game, x, y) {
            this.game = game;

            this.width = CONFIG.beam.width;
            this.height = y;

            this.x = x - this.width / 2;
            this.y = y;

            this.speed = CONFIG.beam.speed;
            this.dead = false;
        }

        update(delta) {
            this.height += this.speed * (delta / 1000);

            if (this.y - this.height <= 0) {
                this.dead = true;
            }
        }

        draw(context) {
            const beamTop = Math.max(0, this.y - this.height);
            const beamHeight = this.y - beamTop;

            const gradient = context.createLinearGradient(
                this.x,
                beamTop,
                this.x,
                this.y
            );

            gradient.addColorStop(0, "rgba(255,255,255,0)");
            gradient.addColorStop(0.08, "#ffffff");
            gradient.addColorStop(0.4, "#38f5ff");
            gradient.addColorStop(1, "#ff3cac");

            context.save();

            context.fillStyle = gradient;
            context.shadowColor = "#38f5ff";
            context.shadowBlur = 18;

            context.fillRect(
                this.x,
                beamTop,
                this.width,
                beamHeight
            );

            context.restore();
        }

        get rect() {
            const top = Math.max(0, this.y - this.height);

            return {
                x: this.x,
                y: top,
                width: this.width,
                height: this.y - top
            };
        }
    }

    /* =====================================================
       ORB
    ====================================================== */

    class Orb {
        constructor(game, {
            x,
            y,
            size = 3,
            vx = null,
            vy = null,
            elite = false
        }) {
            this.game = game;
            this.size = size;
            this.elite = elite;

            const settings = ORB_SIZES[size];

            this.radius = settings.radius * (elite ? 1.13 : 1);

            this.x = x;
            this.y = y;

            const levelMultiplier = Math.min(
                CONFIG.orb.maxSpeedMultiplier,
                1 +
                    (game.level - 1) *
                        CONFIG.orb.speedGrowthPerLevel
            );

            this.vx =
                vx ??
                Utils.random(
                    CONFIG.orb.minHorizontalSpeed,
                    CONFIG.orb.maxHorizontalSpeed
                ) *
                    levelMultiplier *
                    (Math.random() < 0.5 ? -1 : 1);

            this.vy =
                vy ??
                -settings.bounceVelocity *
                    Utils.random(0.82, 1.08);

            this.rotation = Utils.random(0, Math.PI * 2);
            this.rotationSpeed = Utils.random(-2.5, 2.5);

            this.dead = false;
            this.floorBounceLock = 0;
        }

        update(delta) {
            const dt = delta / 1000;

            if (this.game.effects.freeze.active) {
                return;
            }

            let timeScale = 1;

            if (this.game.effects.slow.active) {
                timeScale *= 0.58;
            }

            if (this.game.effects.turbo.active) {
                timeScale *= 1.38;
            }

            const scaledDt = dt * timeScale;

            this.floorBounceLock -= delta;

            this.vy += CONFIG.orb.gravity * scaledDt;

            this.x += this.vx * scaledDt;
            this.y += this.vy * scaledDt;

            this.rotation += this.rotationSpeed * scaledDt;

            if (this.x - this.radius <= 0) {
                this.x = this.radius;
                this.vx = Math.abs(this.vx);
                audio.orbBounce(this.size);
            }

            if (this.x + this.radius >= this.game.width) {
                this.x = this.game.width - this.radius;
                this.vx = -Math.abs(this.vx);
                audio.orbBounce(this.size);
            }

            const floor = this.game.height - 5;

            if (
                this.y + this.radius >= floor &&
                this.floorBounceLock <= 0
            ) {
                this.y = floor - this.radius;
                this.vy = -ORB_SIZES[this.size].bounceVelocity;

                if (this.elite) {
                    this.vy *= 1.08;
                }

                this.floorBounceLock = 60;
                audio.orbBounce(this.size);
            }
        }

        split() {
            if (this.size <= 0) {
                return [];
            }

            const childSize = this.size - 1;
            const speed = Math.max(
                130,
                Math.abs(this.vx) * 1.05
            );

            const verticalVelocity =
                -ORB_SIZES[childSize].bounceVelocity;

            return [
                new Orb(this.game, {
                    x: this.x - 4,
                    y: this.y,
                    size: childSize,
                    vx: -speed,
                    vy: verticalVelocity,
                    elite: false
                }),

                new Orb(this.game, {
                    x: this.x + 4,
                    y: this.y,
                    size: childSize,
                    vx: speed,
                    vy: verticalVelocity,
                    elite: false
                })
            ];
        }

        draw(context) {
            const settings = ORB_SIZES[this.size];
            const now = Utils.now();

            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.rotation);

            const gradient = context.createRadialGradient(
                -this.radius * 0.35,
                -this.radius * 0.35,
                this.radius * 0.1,
                0,
                0,
                this.radius
            );

            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(0.2, settings.colorA);
            gradient.addColorStop(0.72, settings.colorB);
            gradient.addColorStop(1, "#080412");

            context.fillStyle = gradient;
            context.shadowColor = this.elite
                ? "#ffe45c"
                : settings.colorA;

            context.shadowBlur = this.elite ? 30 : 18;

            context.beginPath();
            context.arc(0, 0, this.radius, 0, Math.PI * 2);
            context.fill();

            context.lineWidth = this.elite ? 4 : 2;
            context.strokeStyle = this.elite
                ? "#ffe45c"
                : "rgba(255,255,255,0.45)";

            context.stroke();

            context.globalAlpha = 0.52;
            context.strokeStyle = "#ffffff";
            context.lineWidth = 1;

            for (let i = 0; i < 3; i += 1) {
                context.beginPath();
                context.arc(
                    0,
                    0,
                    this.radius * (0.35 + i * 0.18),
                    now * 0.001 * (i % 2 === 0 ? 1 : -1),
                    now * 0.001 + Math.PI * 1.2
                );
                context.stroke();
            }

            if (this.elite) {
                context.globalAlpha =
                    0.3 + Math.sin(now * 0.01) * 0.15;

                context.fillStyle = "#ffe45c";

                context.beginPath();

                for (let i = 0; i < 8; i += 1) {
                    const angle = (Math.PI * 2 * i) / 8;
                    const inner = this.radius * 1.1;
                    const outer = this.radius * 1.28;

                    const x1 = Math.cos(angle) * inner;
                    const y1 = Math.sin(angle) * inner;
                    const x2 = Math.cos(angle) * outer;
                    const y2 = Math.sin(angle) * outer;

                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                }

                context.strokeStyle = "#ffe45c";
                context.stroke();
            }

            context.restore();
        }
    }

    /* =====================================================
       POWER-UP
    ====================================================== */

    class PowerUp {
        constructor(game, x, y, type) {
            this.game = game;

            this.x = x;
            this.y = y;

            this.width = 30;
            this.height = 30;

            this.type = type;
            this.vy = CONFIG.powerUp.fallSpeed;

            this.createdAt = Utils.now();
            this.rotation = 0;
            this.dead = false;
        }

        update(delta) {
            const dt = delta / 1000;

            this.y += this.vy * dt;
            this.rotation += delta * 0.0026;

            if (
                this.y > this.game.height + 50 ||
                Utils.now() - this.createdAt >
                    CONFIG.powerUp.lifetime
            ) {
                this.dead = true;
            }
        }

        draw(context) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            const visual = this.getVisual();

            context.save();
            context.translate(centerX, centerY);
            context.rotate(this.rotation);

            context.fillStyle = visual.background;
            context.strokeStyle = visual.color;
            context.lineWidth = 2;

            context.shadowColor = visual.color;
            context.shadowBlur = 20;

            context.beginPath();
            context.rect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
            context.fill();
            context.stroke();

            context.rotate(-this.rotation);

            context.fillStyle = visual.color;
            context.font = "900 16px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(visual.symbol, 0, 1);

            context.restore();
        }

        getVisual() {
            const visuals = {
                [POWER_UP_TYPES.SHIELD]: {
                    symbol: "S",
                    color: "#38f5ff",
                    background: "rgba(56,245,255,0.18)"
                },

                [POWER_UP_TYPES.FREEZE]: {
                    symbol: "❄",
                    color: "#bffcff",
                    background: "rgba(191,252,255,0.18)"
                },

                [POWER_UP_TYPES.SLOW]: {
                    symbol: "⌛",
                    color: "#9d4dff",
                    background: "rgba(157,77,255,0.18)"
                },

                [POWER_UP_TYPES.RAPID]: {
                    symbol: "⚡",
                    color: "#ffe45c",
                    background: "rgba(255,228,92,0.18)"
                },

                [POWER_UP_TYPES.DOUBLE]: {
                    symbol: "Ⅱ",
                    color: "#4dff9c",
                    background: "rgba(77,255,156,0.18)"
                },

                [POWER_UP_TYPES.LIFE]: {
                    symbol: "♥",
                    color: "#ff3158",
                    background: "rgba(255,49,88,0.18)"
                },

                [POWER_UP_TYPES.WTF]: {
                    symbol: "?",
                    color: "#ff3cac",
                    background: "rgba(255,60,172,0.2)"
                }
            };

            return visuals[this.type];
        }

        get rect() {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
        }
    }

    /* =====================================================
       LEVEL FACTORY
    ====================================================== */

    const LevelFactory = {
        getDefinition(level) {
            const cappedLevel = Math.min(level, 30);

            if (cappedLevel === 1) {
                return {
                    message: "CONTROL THE CHAOS",
                    orbs: [
                        {
                            xFactor: 0.5,
                            yFactor: 0.3,
                            size: 2
                        }
                    ]
                };
            }

            if (cappedLevel === 2) {
                return {
                    message: "MULTITASKING ONLINE",
                    orbs: [
                        {
                            xFactor: 0.3,
                            yFactor: 0.28,
                            size: 2
                        },
                        {
                            xFactor: 0.7,
                            yFactor: 0.22,
                            size: 1
                        }
                    ]
                };
            }

            if (cappedLevel === 3) {
                return {
                    message: "MORE OBJECTS. LESS PEACE.",
                    orbs: [
                        {
                            xFactor: 0.27,
                            yFactor: 0.26,
                            size: 2
                        },
                        {
                            xFactor: 0.73,
                            yFactor: 0.26,
                            size: 2
                        }
                    ]
                };
            }

            if (cappedLevel === 4) {
                return {
                    message: "THE FLOOR IS NOT YOUR FRIEND",
                    orbs: [
                        {
                            xFactor: 0.2,
                            yFactor: 0.2,
                            size: 3
                        },
                        {
                            xFactor: 0.78,
                            yFactor: 0.33,
                            size: 1
                        }
                    ]
                };
            }

            if (cappedLevel === 5) {
                return {
                    message: "WTF PROTOCOL ARMED",
                    orbs: [
                        {
                            xFactor: 0.3,
                            yFactor: 0.2,
                            size: 3
                        },
                        {
                            xFactor: 0.72,
                            yFactor: 0.22,
                            size: 2
                        }
                    ],
                    guaranteedWtf: true
                };
            }

            const largeCount = Math.min(
                4,
                1 + Math.floor(level / 4)
            );

            const mediumCount = Math.min(
                5,
                Math.floor(level / 3)
            );

            const smallCount = Math.min(
                4,
                Math.floor(level / 5)
            );

            const orbs = [];

            for (let i = 0; i < largeCount; i += 1) {
                orbs.push({
                    xFactor:
                        (i + 1) / (largeCount + 1),
                    yFactor: Utils.random(0.17, 0.33),
                    size: 3,
                    elite:
                        level >= 9 &&
                        i === 0 &&
                        level % 3 === 0
                });
            }

            for (let i = 0; i < mediumCount; i += 1) {
                orbs.push({
                    xFactor: Utils.random(0.12, 0.88),
                    yFactor: Utils.random(0.16, 0.4),
                    size: 2
                });
            }

            for (let i = 0; i < smallCount; i += 1) {
                orbs.push({
                    xFactor: Utils.random(0.12, 0.88),
                    yFactor: Utils.random(0.16, 0.42),
                    size: 1
                });
            }

            return {
                message: Utils.choose([
                    "THE CHAOS REMEMBERS YOU",
                    "MORE POWER. MORE DANGER.",
                    "NO TIMER. NO MERCY.",
                    "STAY FOCUSED",
                    "EXPECT THE UNEXPECTED",
                    "POWER WTF UP"
                ]),

                orbs,

                guaranteedWtf:
                    level >= 5 && level % 5 === 0
            };
        }
    };

    /* =====================================================
       GAME
    ====================================================== */

    class Game {
        constructor() {
            this.width = 0;
            this.height = 0;
            this.pixelRatio = 1;

            this.running = false;
            this.paused = false;
            this.inTransition = false;
            this.gameOver = false;

            this.score = 0;
            this.level = 1;
            this.lives = 3;

            this.combo = 1;
            this.maxCombo = 1;
            this.comboExpiresAt = 0;

            this.levelStartScore = 0;
            this.levelOrbsDestroyed = 0;
            this.levelMaxCombo = 1;

            this.bestScore = this.loadNumber(
                STORAGE_KEYS.bestScore,
                0
            );

            this.maxLevel = this.loadNumber(
                STORAGE_KEYS.maxLevel,
                1
            );

            this.keys = {
                left: false,
                right: false,
                shoot: false
            };

            this.player = new Player(this);

            this.orbs = [];
            this.beams = [];
            this.powerUps = [];
            this.particles = [];

            this.effects = {
                shield: {
                    active: false,
                    expiresAt: 0
                },

                freeze: {
                    active: false,
                    expiresAt: 0
                },

                slow: {
                    active: false,
                    expiresAt: 0
                },

                rapid: {
                    active: false,
                    expiresAt: 0
                },

                double: {
                    active: false,
                    expiresAt: 0
                },

                turbo: {
                    active: false,
                    expiresAt: 0
                },

                earthquake: {
                    active: false,
                    expiresAt: 0
                }
            };

            this.lastFrameAt = 0;
            this.animationFrame = null;

            this.bindEvents();
            this.resize();
            this.updatePersistentUI();
            this.showScreen("start");
        }

        loadNumber(key, fallback) {
            try {
                const value = Number.parseInt(
                    localStorage.getItem(key),
                    10
                );

                return Number.isFinite(value)
                    ? value
                    : fallback;
            } catch {
                return fallback;
            }
        }

        saveNumber(key, value) {
            try {
                localStorage.setItem(
                    key,
                    String(Math.floor(value))
                );
            } catch {
                // Local storage can be blocked.
            }
        }

        bindEvents() {
            window.addEventListener("resize", () => {
                this.resize();
            });

            document.addEventListener("visibilitychange", () => {
                if (
                    document.hidden &&
                    this.running &&
                    !this.paused
                ) {
                    this.pause();
                }
            });

            window.addEventListener("keydown", event => {
                this.handleKeyDown(event);
            });

            window.addEventListener("keyup", event => {
                this.handleKeyUp(event);
            });

            dom.startButton.addEventListener("click", () => {
                audio.initialize();
                this.startNewGame();
            });

            dom.howToPlayButton.addEventListener("click", () => {
                this.showScreen("howTo");
            });

            dom.closeHowToPlayButton.addEventListener(
                "click",
                () => {
                    this.showScreen("start");
                }
            );

            dom.instructionsStartButton.addEventListener(
                "click",
                () => {
                    audio.initialize();
                    this.startNewGame();
                }
            );

            dom.nextLevelButton.addEventListener("click", () => {
                this.level += 1;

                if (this.level > this.maxLevel) {
                    this.maxLevel = this.level;
                    this.saveNumber(
                        STORAGE_KEYS.maxLevel,
                        this.maxLevel
                    );
                }

                this.startLevel();
            });

            dom.playAgainButton.addEventListener("click", () => {
                this.startNewGame();
            });

            dom.gameOverMenuButton.addEventListener("click", () => {
                this.returnToMenu();
            });

            dom.pauseButton.addEventListener("click", () => {
                this.pause();
            });

            dom.resumeButton.addEventListener("click", () => {
                this.resume();
            });

            dom.restartFromPauseButton.addEventListener(
                "click",
                () => {
                    this.startNewGame();
                }
            );

            dom.quitFromPauseButton.addEventListener("click", () => {
                this.returnToMenu();
            });

            this.bindHoldButton(
                dom.moveLeftButton,
                () => {
                    this.keys.left = true;
                },
                () => {
                    this.keys.left = false;
                }
            );

            this.bindHoldButton(
                dom.moveRightButton,
                () => {
                    this.keys.right = true;
                },
                () => {
                    this.keys.right = false;
                }
            );

            this.bindHoldButton(
                dom.shootButton,
                () => {
                    this.keys.shoot = true;
                    this.player.shoot(Utils.now());
                },
                () => {
                    this.keys.shoot = false;
                }
            );
        }

        bindHoldButton(button, onStart, onEnd) {
            const start = event => {
                event.preventDefault();
                audio.initialize();
                button.classList.add("control-button--active");
                onStart();
            };

            const end = event => {
                event.preventDefault();
                button.classList.remove("control-button--active");
                onEnd();
            };

            button.addEventListener("pointerdown", start);
            button.addEventListener("pointerup", end);
            button.addEventListener("pointercancel", end);
            button.addEventListener("pointerleave", end);
        }

        handleKeyDown(event) {
            const key = event.key.toLowerCase();

            if (
                ["arrowleft", "arrowright", " ", "spacebar"].includes(
                    key
                )
            ) {
                event.preventDefault();
            }

            audio.initialize();

            if (key === "arrowleft" || key === "a") {
                this.keys.left = true;
            }

            if (key === "arrowright" || key === "d") {
                this.keys.right = true;
            }

            if (key === " " || key === "spacebar") {
                this.keys.shoot = true;
                this.player.shoot(Utils.now());
            }

            if (key === "p" || key === "escape") {
                if (this.running) {
                    this.paused ? this.resume() : this.pause();
                }
            }
        }

        handleKeyUp(event) {
            const key = event.key.toLowerCase();

            if (key === "arrowleft" || key === "a") {
                this.keys.left = false;
            }

            if (key === "arrowright" || key === "d") {
                this.keys.right = false;
            }

            if (key === " " || key === "spacebar") {
                this.keys.shoot = false;
            }
        }

        resize() {
            const rect = dom.gameStage.getBoundingClientRect();

            const fallbackWidth = window.innerWidth;
            const fallbackHeight = window.innerHeight;

            this.width = Math.max(
                320,
                rect.width || fallbackWidth
            );

            this.height = Math.max(
                280,
                rect.height || fallbackHeight
            );

            this.pixelRatio = Math.min(
                window.devicePixelRatio || 1,
                2
            );

            dom.canvas.width = Math.floor(
                this.width * this.pixelRatio
            );

            dom.canvas.height = Math.floor(
                this.height * this.pixelRatio
            );

            ctx.setTransform(
                this.pixelRatio,
                0,
                0,
                this.pixelRatio,
                0,
                0
            );

            if (this.player) {
                this.player.x = Utils.clamp(
                    this.player.x,
                    0,
                    this.width - this.player.width
                );

                this.player.y =
                    this.height -
                    this.player.height -
                    16;
            }
        }

        showScreen(name) {
            Object.values(dom.screens).forEach(screen => {
                screen.classList.remove("screen--active");
            });

            const selected = dom.screens[name];

            if (selected) {
                selected.classList.add("screen--active");
            }
        }

        startNewGame() {
            this.score = 0;
            this.level = 1;
            this.lives = 3;

            this.combo = 1;
            this.maxCombo = 1;

            this.gameOver = false;
            this.inTransition = false;

            dom.newRecordBadge.hidden = true;

            this.startLevel();
        }

        startLevel() {
            this.stopLoop();

            this.running = true;
            this.paused = false;
            this.inTransition = true;
            this.gameOver = false;

            dom.body.classList.add("game-running");
            dom.body.classList.remove(
                "is-paused",
                "critical-mode",
                "damage-mode",
                "wtf-mode",
                "freeze-mode"
            );

            dom.pauseOverlay.hidden = true;

            this.clearEffects();

            this.orbs = [];
            this.beams = [];
            this.powerUps = [];
            this.particles = [];

            this.combo = 1;
            this.comboExpiresAt = 0;

            this.levelStartScore = this.score;
            this.levelOrbsDestroyed = 0;
            this.levelMaxCombo = 1;

            this.resize();
            this.player.resetPosition();

            const definition =
                LevelFactory.getDefinition(this.level);

            definition.orbs.forEach((orbData, index) => {
                const x = Utils.clamp(
                    this.width * orbData.xFactor,
                    ORB_SIZES[orbData.size].radius + 8,
                    this.width -
                        ORB_SIZES[orbData.size].radius -
                        8
                );

                const y = Utils.clamp(
                    this.height * orbData.yFactor,
                    ORB_SIZES[orbData.size].radius + 8,
                    this.height * 0.55
                );

                this.orbs.push(
                    new Orb(this, {
                        x,
                        y,
                        size: orbData.size,
                        elite: Boolean(orbData.elite),
                        vx:
                            (index % 2 === 0 ? 1 : -1) *
                            Utils.random(110, 190)
                    })
                );
            });

            if (definition.guaranteedWtf) {
                this.powerUps.push(
                    new PowerUp(
                        this,
                        this.width / 2 - 15,
                        this.height * 0.17,
                        POWER_UP_TYPES.WTF
                    )
                );
            }

            this.showScreen("game");
            this.updateHUD();

            this.showLevelAnnouncement(
                definition.message
            );

            this.lastFrameAt = Utils.now();
            this.animationFrame = requestAnimationFrame(
                time => this.loop(time)
            );

            window.setTimeout(() => {
                if (this.running && !this.gameOver) {
                    this.inTransition = false;
                }
            }, 1250);
        }

        returnToMenu() {
            this.stopLoop();

            this.running = false;
            this.paused = false;
            this.gameOver = false;

            dom.body.classList.remove(
                "game-running",
                "is-paused",
                "critical-mode",
                "damage-mode",
                "wtf-mode",
                "freeze-mode"
            );

            dom.pauseOverlay.hidden = true;

            this.clearEffects();
            this.updatePersistentUI();
            this.showScreen("start");
        }

        stopLoop() {
            if (this.animationFrame !== null) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        }

        loop(timestamp) {
            if (!this.running) {
                return;
            }

            const delta = Math.min(
                34,
                timestamp - this.lastFrameAt || 16.67
            );

            this.lastFrameAt = timestamp;

            if (!this.paused) {
                this.update(delta);
                this.draw();
            }

            this.animationFrame = requestAnimationFrame(
                time => this.loop(time)
            );
        }

        update(delta) {
            this.updateInput();
            this.updateEffects();

            if (this.keys.shoot && !this.inTransition) {
                this.player.shoot(Utils.now());
            }

            this.player.update(delta);

            this.beams.forEach(beam => beam.update(delta));
            this.orbs.forEach(orb => orb.update(delta));
            this.powerUps.forEach(powerUp =>
                powerUp.update(delta)
            );

            this.particles.forEach(particle =>
                particle.update(delta)
            );

            this.handleCollisions();
            this.updateCombo();
            this.cleanupEntities();
            this.updateDangerMeter();
            this.updateHUD();

            if (
                this.orbs.length === 0 &&
                !this.inTransition &&
                !this.gameOver
            ) {
                this.completeLevel();
            }
        }

        updateInput() {
            const left = this.keys.left ? 1 : 0;
            const right = this.keys.right ? 1 : 0;

            this.player.direction = right - left;
        }

        updateEffects() {
            const now = Utils.now();

            Object.entries(this.effects).forEach(
                ([name, effect]) => {
                    if (
                        effect.active &&
                        effect.expiresAt > 0 &&
                        now >= effect.expiresAt
                    ) {
                        this.deactivateEffect(name);
                    }
                }
            );

            this.updateEffectIndicators(now);
        }

        updateEffectIndicators(now) {
            this.updateIndicator(
                dom.shieldIndicator,
                dom.shieldTimer,
                this.effects.shield,
                now
            );

            this.updateIndicator(
                dom.freezeIndicator,
                dom.freezeTimer,
                this.effects.freeze,
                now
            );

            this.updateIndicator(
                dom.rapidIndicator,
                dom.rapidTimer,
                this.effects.rapid,
                now
            );

            this.updateIndicator(
                dom.doubleBeamIndicator,
                dom.doubleBeamTimer,
                this.effects.double,
                now
            );
        }

        updateIndicator(indicator, timer, effect, now) {
            if (!indicator || !timer) {
                return;
            }

            indicator.hidden = !effect.active;

            if (!effect.active) {
                timer.textContent = "";
                return;
            }

            const remaining = Math.max(
                0,
                effect.expiresAt - now
            );

            timer.textContent =
                `${(remaining / 1000).toFixed(1)}s`;
        }

        handleCollisions() {
            this.handleBeamOrbCollisions();
            this.handlePlayerOrbCollisions();
            this.handlePlayerPowerUpCollisions();
        }

        handleBeamOrbCollisions() {
            for (const beam of this.beams) {
                if (beam.dead) {
                    continue;
                }

                for (const orb of this.orbs) {
                    if (orb.dead) {
                        continue;
                    }

                    if (
                        Utils.circleRectCollision(
                            orb,
                            beam.rect
                        )
                    ) {
                        beam.dead = true;
                        orb.dead = true;

                        this.destroyOrb(orb);
                        break;
                    }
                }
            }
        }

        handlePlayerOrbCollisions() {
            if (this.inTransition || this.gameOver) {
                return;
            }

            for (const orb of this.orbs) {
                if (orb.dead) {
                    continue;
                }

                if (
                    Utils.circleRectCollision(
                        orb,
                        this.player.rect
                    )
                ) {
                    if (this.player.hit()) {
                        this.loseLife();
                    }

                    const direction =
                        orb.x <
                        this.player.x +
                            this.player.width / 2
                            ? -1
                            : 1;

                    orb.vx =
                        direction *
                        Math.max(160, Math.abs(orb.vx));

                    orb.vy =
                        -ORB_SIZES[orb.size]
                            .bounceVelocity *
                        0.85;

                    break;
                }
            }
        }

        handlePlayerPowerUpCollisions() {
            for (const powerUp of this.powerUps) {
                if (powerUp.dead) {
                    continue;
                }

                if (
                    Utils.rectCollision(
                        this.player.rect,
                        powerUp.rect
                    )
                ) {
                    powerUp.dead = true;
                    this.collectPowerUp(powerUp);
                }
            }
        }

        destroyOrb(orb) {
            const children = orb.split();

            this.orbs.push(...children);

            this.levelOrbsDestroyed += 1;

            this.increaseCombo();

            const orbScore =
                ORB_SIZES[orb.size].score *
                this.combo *
                (orb.elite ? 2 : 1);

            this.score += orbScore;

            audio.orbDestroy(orb.size);

            this.createExplosion(
                orb.x,
                orb.y,
                orb.elite
                    ? "#ffe45c"
                    : ORB_SIZES[orb.size].colorA,
                12 + orb.size * 8
            );

            this.trySpawnPowerUp(orb);

            if (orb.elite) {
                this.powerUps.push(
                    new PowerUp(
                        this,
                        orb.x - 15,
                        orb.y - 15,
                        POWER_UP_TYPES.WTF
                    )
                );
            }
        }

        trySpawnPowerUp(orb) {
            const roll = Math.random();

            if (roll < CONFIG.powerUp.lifeDropChance) {
                this.powerUps.push(
                    new PowerUp(
                        this,
                        orb.x - 15,
                        orb.y - 15,
                        POWER_UP_TYPES.LIFE
                    )
                );

                return;
            }

            if (
                roll <
                CONFIG.powerUp.lifeDropChance +
                    CONFIG.powerUp.wtfDropChance
            ) {
                this.powerUps.push(
                    new PowerUp(
                        this,
                        orb.x - 15,
                        orb.y - 15,
                        POWER_UP_TYPES.WTF
                    )
                );

                return;
            }

            if (
                roll <
                CONFIG.powerUp.lifeDropChance +
                    CONFIG.powerUp.wtfDropChance +
                    CONFIG.powerUp.normalDropChance
            ) {
                const type = Utils.choose([
                    POWER_UP_TYPES.SHIELD,
                    POWER_UP_TYPES.FREEZE,
                    POWER_UP_TYPES.SLOW,
                    POWER_UP_TYPES.RAPID,
                    POWER_UP_TYPES.DOUBLE
                ]);

                this.powerUps.push(
                    new PowerUp(
                        this,
                        orb.x - 15,
                        orb.y - 15,
                        type
                    )
                );
            }
        }

        collectPowerUp(powerUp) {
            audio.collect();

            this.createExplosion(
                powerUp.x + powerUp.width / 2,
                powerUp.y + powerUp.height / 2,
                powerUp.getVisual().color,
                18
            );

            switch (powerUp.type) {
                case POWER_UP_TYPES.SHIELD:
                    this.activateEffect(
                        "shield",
                        CONFIG.effects.shieldDuration
                    );

                    this.showStatus(
                        "SHIELD ONLINE",
                        "success"
                    );
                    break;

                case POWER_UP_TYPES.FREEZE:
                    this.activateEffect(
                        "freeze",
                        CONFIG.effects.freezeDuration
                    );

                    dom.body.classList.add("freeze-mode");

                    this.showStatus(
                        "TIME FREEZE: 3 SECONDS",
                        "success"
                    );
                    break;

                case POWER_UP_TYPES.SLOW:
                    this.activateEffect(
                        "slow",
                        CONFIG.effects.slowDuration
                    );

                    this.showStatus(
                        "ORB SPEED REDUCED",
                        "success"
                    );
                    break;

                case POWER_UP_TYPES.RAPID:
                    this.activateEffect(
                        "rapid",
                        CONFIG.effects.rapidDuration
                    );

                    this.showStatus(
                        "RAPID BEAM ONLINE",
                        "success"
                    );
                    break;

                case POWER_UP_TYPES.DOUBLE:
                    this.activateEffect(
                        "double",
                        CONFIG.effects.doubleBeamDuration
                    );

                    this.showStatus(
                        "DOUBLE BEAM ONLINE",
                        "success"
                    );
                    break;

                case POWER_UP_TYPES.LIFE:
                    this.lives = Math.min(5, this.lives + 1);
                    audio.life();

                    this.showStatus(
                        "+1 LIFE",
                        "success"
                    );

                    this.flashScreen("power");
                    break;

                case POWER_UP_TYPES.WTF:
                    this.triggerWtfPowerUp();
                    break;

                default:
                    break;
            }
        }

        activateEffect(name, duration) {
            const effect = this.effects[name];

            if (!effect) {
                return;
            }

            effect.active = true;
            effect.expiresAt = Utils.now() + duration;
        }

        deactivateEffect(name) {
            const effect = this.effects[name];

            if (!effect) {
                return;
            }

            effect.active = false;
            effect.expiresAt = 0;

            if (name === "freeze") {
                dom.body.classList.remove("freeze-mode");
            }

            if (name === "earthquake") {
                dom.gameStage.classList.remove(
                    "game-stage--earthquake"
                );
            }

            if (name === "turbo") {
                dom.body.classList.remove("wtf-mode");
            }
        }

        clearEffects() {
            Object.keys(this.effects).forEach(name => {
                this.deactivateEffect(name);
            });
        }

        triggerWtfPowerUp() {
            const events = [
                {
                    name: "TURBO CHAOS",
                    action: () => {
                        this.activateEffect(
                            "rapid",
                            CONFIG.effects.turboDuration
                        );

                        this.activateEffect(
                            "double",
                            CONFIG.effects.turboDuration
                        );

                        this.activateEffect(
                            "turbo",
                            CONFIG.effects.turboDuration
                        );

                        dom.body.classList.add("wtf-mode");

                        this.showStatus(
                            "YOU ARE FASTER. SO ARE THEY.",
                            "danger"
                        );
                    }
                },

                {
                    name: "SEISMIC MODE",
                    action: () => {
                        this.triggerEarthquake();
                    }
                },

                {
                    name: "FROZEN MAYHEM",
                    action: () => {
                        this.activateEffect(
                            "freeze",
                            CONFIG.effects.freezeDuration
                        );

                        this.activateEffect(
                            "double",
                            CONFIG.effects.doubleBeamDuration
                        );

                        dom.body.classList.add("freeze-mode");

                        this.showStatus(
                            "TIME STOPPED. DOUBLE BEAM ACTIVE.",
                            "success"
                        );
                    }
                },

                {
                    name: "ORB MULTIPLICATION",
                    action: () => {
                        const candidates = this.orbs.filter(
                            orb =>
                                !orb.dead &&
                                orb.size >= 1
                        );

                        if (candidates.length === 0) {
                            this.score += 5000;
                            return;
                        }

                        const target =
                            Utils.choose(candidates);

                        const clone = new Orb(this, {
                            x: Utils.clamp(
                                target.x + 40,
                                target.radius,
                                this.width -
                                    target.radius
                            ),
                            y: Math.max(
                                target.radius,
                                target.y - 20
                            ),
                            size: target.size,
                            vx: -target.vx,
                            vy: -Math.abs(target.vy),
                            elite: false
                        });

                        this.orbs.push(clone);

                        this.activateEffect(
                            "rapid",
                            CONFIG.effects.rapidDuration
                        );

                        this.showStatus(
                            "ONE MORE ORB. RAPID FIRE GRANTED.",
                            "danger"
                        );
                    }
                },

                {
                    name: "JACKPOT WTF",
                    action: () => {
                        this.score += 50000;

                        this.activateEffect(
                            "shield",
                            CONFIG.effects.shieldDuration
                        );

                        audio.life();

                        this.showStatus(
                            "+50000 SCORE AND SHIELD",
                            "success"
                        );
                    }
                },

                {
                    name: "ELITE ARRIVAL",
                    action: () => {
                        this.orbs.push(
                            new Orb(this, {
                                x: this.width / 2,
                                y: Math.max(
                                    80,
                                    this.height * 0.2
                                ),
                                size: Math.min(
                                    3,
                                    1 +
                                        Math.floor(
                                            this.level / 4
                                        )
                                ),
                                vx: Utils.random(160, 230),
                                vy: -520,
                                elite: true
                            })
                        );

                        this.activateEffect(
                            "shield",
                            CONFIG.effects.shieldDuration
                        );

                        this.showStatus(
                            "ELITE ORB DETECTED. SHIELD GRANTED.",
                            "danger"
                        );
                    }
                },

                {
                    name: "FULL POWER",
                    action: () => {
                        this.activateEffect(
                            "shield",
                            CONFIG.effects.shieldDuration
                        );

                        this.activateEffect(
                            "rapid",
                            CONFIG.effects.rapidDuration
                        );

                        this.activateEffect(
                            "double",
                            CONFIG.effects.doubleBeamDuration
                        );

                        this.showStatus(
                            "ALL SYSTEMS OVERCHARGED",
                            "success"
                        );
                    }
                }
            ];

            const selected = Utils.choose(events);

            audio.wtf();
            this.flashScreen("wtf");
            this.showWtfAnnouncement(selected.name);

            selected.action();
        }

        triggerEarthquake() {
            if (this.effects.earthquake.active) {
                return;
            }

            this.activateEffect(
                "earthquake",
                CONFIG.effects.earthquakeDuration
            );

            dom.gameStage.classList.add(
                "game-stage--earthquake"
            );

            audio.earthquake();

            window.setTimeout(() => {
                if (!this.effects.earthquake.active) {
                    return;
                }

                this.orbs.forEach(orb => {
                    if (orb.dead) {
                        return;
                    }

                    orb.vx *= Utils.random(0.82, 1.22);
                    orb.vx *= Math.random() < 0.35 ? -1 : 1;

                    orb.vy -= Utils.random(40, 150);
                });
            }, 700);
        }

        loseLife() {
            if (this.gameOver) {
                return;
            }

            this.lives -= 1;
            this.combo = 1;
            this.comboExpiresAt = 0;

            audio.damage();

            dom.body.classList.add(
                "damage-mode",
                "critical-mode"
            );

            this.flashScreen("danger");
            this.showStatus("LIFE LOST", "danger");

            this.createExplosion(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                "#ff3158",
                34
            );

            window.setTimeout(() => {
                dom.body.classList.remove("damage-mode");
            }, 260);

            if (this.lives <= 0) {
                this.endGame();
                return;
            }

            window.setTimeout(() => {
                if (this.running && !this.gameOver) {
                    this.player.resetPosition();
                }
            }, 260);
        }

        increaseCombo() {
            const now = Utils.now();

            if (now <= this.comboExpiresAt) {
                this.combo = Math.min(
                    CONFIG.combo.maxMultiplier,
                    this.combo + 1
                );
            } else {
                this.combo = 1;
            }

            this.comboExpiresAt =
                now + CONFIG.combo.timeout;

            this.maxCombo = Math.max(
                this.maxCombo,
                this.combo
            );

            this.levelMaxCombo = Math.max(
                this.levelMaxCombo,
                this.combo
            );

            if (this.combo >= 2) {
                audio.combo(this.combo);
                this.showCombo(this.combo);
            }
        }

        updateCombo() {
            if (
                this.combo > 1 &&
                Utils.now() > this.comboExpiresAt
            ) {
                this.combo = 1;
                this.comboExpiresAt = 0;
            }
        }

        cleanupEntities() {
            this.beams = this.beams.filter(
                beam => !beam.dead
            );

            this.orbs = this.orbs.filter(
                orb => !orb.dead
            );

            this.powerUps = this.powerUps.filter(
                powerUp => !powerUp.dead
            );

            this.particles = this.particles.filter(
                particle => !particle.dead
            );
        }

        updateDangerMeter() {
            const fragmentWeight = this.orbs.reduce(
                (total, orb) =>
                    total +
                    (4 - orb.size) * 1.1 +
                    (orb.elite ? 4 : 0),
                0
            );

            const speedWeight =
                this.effects.turbo.active ? 18 : 0;

            const earthquakeWeight =
                this.effects.earthquake.active ? 22 : 0;

            const levelWeight = Math.min(
                26,
                this.level * 1.6
            );

            const danger = Utils.clamp(
                fragmentWeight * 2.1 +
                    speedWeight +
                    earthquakeWeight +
                    levelWeight,
                4,
                100
            );

            dom.dangerMeterFill.style.width =
                `${danger}%`;

            const critical = danger >= 72;

            dom.dangerMeter.classList.toggle(
                "danger-meter--critical",
                critical
            );

            dom.body.classList.toggle(
                "critical-mode",
                critical || this.lives === 1
            );
        }

        completeLevel() {
            if (this.inTransition || this.gameOver) {
                return;
            }

            this.inTransition = true;
            this.running = false;

            this.stopLoop();

            const levelBonus =
                CONFIG.score.levelClear * this.level;

            this.score += levelBonus;

            if (this.score > this.bestScore) {
                this.bestScore = this.score;

                this.saveNumber(
                    STORAGE_KEYS.bestScore,
                    this.bestScore
                );
            }

            audio.levelComplete();

            dom.levelScoreValue.textContent =
                Utils.formatScore(
                    this.score - this.levelStartScore
                );

            dom.levelMaxComboValue.textContent =
                `x${this.levelMaxCombo}`;

            dom.orbsDestroyedValue.textContent =
                String(this.levelOrbsDestroyed);

            dom.levelCompleteMessage.textContent =
                this.getLevelCompleteMessage();

            this.updatePersistentUI();

            window.setTimeout(() => {
                this.showScreen("levelComplete");
            }, 350);
        }

        getLevelCompleteMessage() {
            if (this.level === 1) {
                return "Prvi haos je zaustavljen. Sledeći neće biti tako ljubazan.";
            }

            if (this.level % 5 === 0) {
                return "Preživeo si POWER WTF UP zonu. Sistem sada povećava opasnost.";
            }

            if (this.levelMaxCombo >= 8) {
                return "Kontrola odlična. Sistem je primetio. Sistem sada uzvraća.";
            }

            return "Dobijaš više mogućnosti. Igra dobija više načina da te uništi.";
        }

        endGame() {
            if (this.gameOver) {
                return;
            }

            this.gameOver = true;
            this.running = false;
            this.inTransition = true;

            this.stopLoop();
            this.clearEffects();

            dom.body.classList.remove(
                "game-running",
                "is-paused",
                "wtf-mode",
                "freeze-mode"
            );

            const previousBest = this.bestScore;
            const isNewRecord = this.score > previousBest;

            if (isNewRecord) {
                this.bestScore = this.score;

                this.saveNumber(
                    STORAGE_KEYS.bestScore,
                    this.bestScore
                );
            }

            if (this.level > this.maxLevel) {
                this.maxLevel = this.level;

                this.saveNumber(
                    STORAGE_KEYS.maxLevel,
                    this.maxLevel
                );
            }

            dom.finalScoreValue.textContent =
                Utils.formatScore(this.score);

            dom.finalLevelValue.textContent =
                String(this.level).padStart(2, "0");

            dom.finalComboValue.textContent =
                `x${this.maxCombo}`;

            dom.newRecordBadge.hidden = !isNewRecord;

            this.updatePersistentUI();

            audio.gameOver();

            window.setTimeout(() => {
                this.showScreen("gameOver");
            }, 850);
        }

        pause() {
            if (
                !this.running ||
                this.paused ||
                this.gameOver
            ) {
                return;
            }

            this.paused = true;

            dom.pauseOverlay.hidden = false;
            dom.body.classList.add("is-paused");
        }

        resume() {
            if (!this.running || !this.paused) {
                return;
            }

            this.paused = false;

            dom.pauseOverlay.hidden = true;
            dom.body.classList.remove("is-paused");

            this.lastFrameAt = Utils.now();
        }

        draw() {
            ctx.clearRect(0, 0, this.width, this.height);

            this.drawArena();

            this.particles.forEach(particle =>
                particle.draw(ctx)
            );

            this.powerUps.forEach(powerUp =>
                powerUp.draw(ctx)
            );

            this.beams.forEach(beam =>
                beam.draw(ctx)
            );

            this.orbs.forEach(orb =>
                orb.draw(ctx)
            );

            this.player.draw(ctx);
        }

        drawArena() {
            const now = Utils.now();

            ctx.save();

            const glow = ctx.createRadialGradient(
                this.width / 2,
                this.height * 0.25,
                10,
                this.width / 2,
                this.height * 0.35,
                this.width * 0.7
            );

            glow.addColorStop(
                0,
                "rgba(157,77,255,0.08)"
            );

            glow.addColorStop(
                1,
                "rgba(3,2,8,0)"
            );

            ctx.fillStyle = glow;
            ctx.fillRect(
                0,
                0,
                this.width,
                this.height
            );

            ctx.strokeStyle = "rgba(56,245,255,0.055)";
            ctx.lineWidth = 1;

            const spacing = 42;
            const offset = (now * 0.012) % spacing;

            for (
                let y = -spacing + offset;
                y < this.height;
                y += spacing
            ) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }

            ctx.restore();
        }

        createExplosion(x, y, color, count = 18) {
            for (let i = 0; i < count; i += 1) {
                this.particles.push(
                    new Particle(x, y, {
                        color,
                        vx: Utils.random(-260, 260),
                        vy: Utils.random(-300, 180),
                        size: Utils.random(2, 7),
                        life: Utils.random(320, 760),
                        gravity: Utils.random(260, 620)
                    })
                );
            }
        }

        flashScreen(type = "power") {
            dom.screenFlash.className =
                `screen-flash screen-flash--${type}`;

            void dom.screenFlash.offsetWidth;

            dom.screenFlash.classList.add(
                "screen-flash--active"
            );
        }

        showLevelAnnouncement(message) {
            dom.levelAnnouncementValue.textContent =
                `LEVEL ${String(this.level).padStart(2, "0")}`;

            dom.levelAnnouncementMessage.textContent =
                message;

            dom.levelAnnouncement.classList.remove(
                "level-announcement--active"
            );

            void dom.levelAnnouncement.offsetWidth;

            dom.levelAnnouncement.classList.add(
                "level-announcement--active"
            );
        }

        showWtfAnnouncement(effectName) {
            dom.wtfEffectMessage.textContent = effectName;

            dom.wtfAnnouncement.classList.remove(
                "wtf-announcement--active"
            );

            void dom.wtfAnnouncement.offsetWidth;

            dom.wtfAnnouncement.classList.add(
                "wtf-announcement--active"
            );
        }

        showCombo(combo) {
            dom.comboAnnouncement.textContent =
                `COMBO x${combo}`;

            dom.comboAnnouncement.classList.remove(
                "combo-announcement--active"
            );

            void dom.comboAnnouncement.offsetWidth;

            dom.comboAnnouncement.classList.add(
                "combo-announcement--active"
            );
        }

        showStatus(message, type = "") {
            dom.statusMessage.textContent = message;

            dom.statusMessage.className =
                "status-message";

            if (type) {
                dom.statusMessage.classList.add(
                    `status-message--${type}`
                );
            }

            void dom.statusMessage.offsetWidth;

            dom.statusMessage.classList.add(
                "status-message--active"
            );
        }

        updateHUD() {
            dom.scoreValue.textContent =
                Utils.formatScore(this.score);

            dom.bestScoreValue.textContent =
                Utils.formatScore(
                    Math.max(this.bestScore, this.score)
                );

            dom.levelValue.textContent =
                String(this.level).padStart(2, "0");

            dom.comboValue.textContent =
                `x${this.combo}`;

            this.updateLives();
        }

        updateLives() {
            dom.livesContainer.innerHTML = "";

            const visibleSlots = Math.max(3, this.lives);

            for (let i = 0; i < visibleSlots; i += 1) {
                const icon = document.createElement("span");

                icon.className = "life-icon";
                icon.textContent = "♥";

                if (i >= this.lives) {
                    icon.classList.add("life-icon--lost");
                }

                dom.livesContainer.appendChild(icon);
            }
        }

        updatePersistentUI() {
            dom.startBestScore.textContent =
                Utils.formatScore(this.bestScore);

            dom.startMaxLevel.textContent =
                String(this.maxLevel).padStart(2, "0");

            dom.bestScoreValue.textContent =
                Utils.formatScore(this.bestScore);
        }
    }

    /* =====================================================
       START SYSTEM
    ====================================================== */

    const game = new Game();

    window.WHRPowerWtfUp = {
        game,

        version: "1.0.0",

        triggerWtf() {
            if (game.running && !game.paused) {
                game.triggerWtfPowerUp();
            }
        },

        addLife() {
            if (game.running) {
                game.lives += 1;
                game.updateHUD();
            }
        },

        nextLevel() {
            if (game.running) {
                game.orbs.forEach(orb => {
                    orb.dead = true;
                });
            }
        }
    };

    console.log(
        "%c WHR: POWER WTF UP v1.0 ",
        "background:#ff3cac;color:#ffffff;font-size:16px;font-weight:900;padding:8px 12px;"
    );

    console.log(
        "%c Što si bolji, dobijaš više mogućnosti... ali igra postaje još opasnija. ",
        "color:#38f5ff;font-size:12px;"
    );
})();
