"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.0
   GAME ENGINE
========================================================= */

(() => {
    /* CONFIGURATION */
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
        3: { radius: 42, bounceVelocity: 625, score: 100, colorA: "#ff3cac", colorB: "#7b2cff" },
        2: { radius: 30, bounceVelocity: 560, score: 180, colorA: "#9d4dff", colorB: "#38f5ff" },
        1: { radius: 20, bounceVelocity: 500, score: 280, colorA: "#38f5ff", colorB: "#2470ff" },
        0: { radius: 12, bounceVelocity: 430, score: 420, colorA: "#ffe45c", colorB: "#ff8a38" }
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

    /* DOM */
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

    const ctx = dom.canvas.getContext("2d", { alpha: true });

    /* UTILITIES */
    const Utils = {
        clamp(value, min, max) { return Math.max(min, Math.min(max, value)); },
        random(min, max) { return Math.random() * (max - min) + min; },
        randomInt(min, max) { return Math.floor(Utils.random(min, max + 1)); },
        choose(array) { return array[Math.floor(Math.random() * array.length)]; },
        formatScore(value) { return Math.max(0, Math.floor(value)).toString().padStart(6, "0"); },
        circleRectCollision(circle, rect) {
            const closestX = Utils.clamp(circle.x, rect.x, rect.x + rect.width);
            const closestY = Utils.clamp(circle.y, rect.y, rect.y + rect.height);
            const dx = circle.x - closestX;
            const dy = circle.y - closestY;
            return dx * dx + dy * dy <= circle.radius * circle.radius;
        },
        rectCollision(a, b) {
            return (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y);
        },
        now() { return performance.now(); }
    };

    /* AUDIO ENGINE */
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
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) { this.enabled = false; return; }
            try {
                this.context = new AudioContextClass();
                this.masterGain = this.context.createGain();
                this.masterGain.gain.value = 0.24;
                this.masterGain.connect(this.context.destination);
                this.initialized = true;
            } catch (error) {
                this.enabled = false;
            }
        }

        tone({ frequency = 440, duration = 0.1, type = "sine", volume = 0.16, frequencyEnd = null, delay = 0 } = {}) {
            if (!this.enabled) return;
            this.initialize();
            if (!this.context || !this.masterGain) return;

            const startTime = this.context.currentTime + delay;
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, startTime);
            if (frequencyEnd !== null) {
                oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequencyEnd), startTime + duration);
            }

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startTime + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            oscillator.connect(gain);
            gain.connect(this.masterGain);
            oscillator.start(startTime);
            oscillator.stop(startTime + duration + 0.02);
        }

        noise(duration = 0.18, volume = 0.08) {
            if (!this.enabled) return;
            this.initialize();
            if (!this.context || !this.masterGain) return;

            const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
            const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < length; i += 1) { data[i] = Math.random() * 2 - 1; }

            const source = this.context.createBufferSource();
            const filter = this.context.createBiquadFilter();
            const gain = this.context.createGain();

            filter.type = "lowpass";
            filter.frequency.value = 900;
            gain.gain.setValueAtTime(volume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);

            source.buffer = buffer;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            source.start();
        }

        shoot() { this.tone({ frequency: 760, frequencyEnd: 1250, duration: 0.075, type: "square", volume: 0.07 }); }
        orbBounce(size = 1) {
            const frequencies = [410, 320, 235, 165];
            this.tone({ frequency: frequencies[size] || 250, frequencyEnd: (frequencies[size] || 250) * 0.76, duration: 0.055, type: "triangle", volume: 0.025 });
        }
        orbDestroy(size = 1) {
            const frequency = 420 + size * 105;
            this.tone({ frequency, frequencyEnd: 90, duration: 0.13 + size * 0.035, type: "sawtooth", volume: 0.075 });
            if (size >= 2) { this.noise(0.1, 0.035); }
        }
        collect() {
            this.tone({ frequency: 660, frequencyEnd: 1320, duration: 0.18, type: "sine", volume: 0.13 });
            this.tone({ frequency: 990, duration: 0.14, type: "triangle", volume: 0.08, delay: 0.07 });
        }
        life() {
            [523, 659, 784, 1047].forEach((frequency, index) => {
                this.tone({ frequency, duration: 0.16, type: "sine", volume: 0.1, delay: index * 0.065 });
            });
        }
        shieldHit() { this.tone({ frequency: 180, frequencyEnd: 920, duration: 0.28, type: "sawtooth", volume: 0.11 }); }
        damage() {
            this.noise(0.28, 0.13);
            this.tone({ frequency: 130, frequencyEnd: 44, duration: 0.38, type: "square", volume: 0.12 });
        }
        combo(combo) {
            this.tone({ frequency: 480 + combo * 42, frequencyEnd: 760 + combo * 55, duration: 0.12, type: "triangle", volume: 0.08 });
        }
        earthquake() {
            this.noise(0.8, 0.11);
            this.tone({ frequency: 55, frequencyEnd: 30, duration: 1.1, type: "sawtooth", volume: 0.14 });
        }
        wtf() {
            const notes = [180, 720, 290, 1100];
            notes.forEach((frequency, index) => {
                this.tone({ frequency, frequencyEnd: frequency * 1.4, duration: 0.16, type: index % 2 === 0 ? "square" : "sawtooth", volume: 0.09, delay: index * 0.055 });
            });
            this.noise(0.22, 0.07);
        }
        levelComplete() {
            [392, 523, 659, 784, 1047].forEach((frequency, index) => {
                this.tone({ frequency, duration: 0.22, type: "triangle", volume: 0.1, delay: index * 0.08 });
            });
        }
        gameOver() {
            [330, 247, 196, 98].forEach((frequency, index) => {
                this.tone({ frequency, frequencyEnd: frequency * 0.76, duration: 0.3, type: "sawtooth", volume: 0.09, delay: index * 0.13 });
            });
        }
    }

    const audio = new AudioEngine();

    /* PARTICLES */
    class Particle {
        constructor(x, y, options = {}) {
            this.x = x; this.y = y;
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

        get dead() { return this.life <= 0; }
    }

    /* PLAYER */
    class Player {
        constructor(game) {
            this.game = game;
            this.width = CONFIG.player.width;
            this.height = CONFIG.player.height;
            this.x = 0; this.y = 0;
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
            this.x = Utils.clamp(this.x, 8, this.game.width - this.width - 8);
            if (this.flash > 0) { this.flash -= delta; }
        }

        canShoot(now) {
            const cooldown = this.game.effects.rapid.active ? CONFIG.player.rapidFireCooldown : CONFIG.player.fireCooldown;
            const activeLimit = this.game.effects.double.active ? CONFIG.beam.doubleBeamMaxActive : CONFIG.beam.maxActive;
            return (now - this.lastShotAt >= cooldown && this.game.beams.length < activeLimit);
        }

        shoot(now) {
            if (!this.canShoot(now)) return;
            this.lastShotAt = now;
            if (this.game.effects.double.active) {
                const offset = this.width * 0.22;
                this.game.beams.push(new Beam(this.game, this.x + this.width / 2 - offset, this.y));
                this.game.beams.push(new Beam(this.game, this.x + this.width / 2 + offset, this.y));
            } else {
                this.game.beams.push(new Beam(this.game, this.x + this.width / 2, this.y));
            }
            audio.shoot();
        }

        hit() {
            const now = Utils.now();
            if (now < this.invulnerableUntil) return false;
            if (this.game.effects.shield.active) {
                this.game.deactivateEffect("shield");
                this.invulnerableUntil = now + 650;
                audio.shieldHit();
                this.game.flashScreen("power");
                this.game.showStatus("SHIELD ABSORBED THE HIT", "success");
                this.game.createExplosion(this.x + this.width / 2, this.y + this.height / 2, "#38f5ff", 24);
                return false;
            }
            this.invulnerableUntil = now + CONFIG.player.invulnerabilityDuration;
            this.flash = CONFIG.player.invulnerabilityDuration;
            return true;
        }

        draw(context) {
            const now = Utils.now();
            if (now < this.invulnerableUntil && Math.floor(now / 90) % 2 === 0) return;

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
                context.arc(centerX, centerY, 34 * pulse, 0, Math.PI * 2);
                context.stroke();
            }

            context.translate(centerX, centerY);
            context.shadowColor = "#38f5ff";
            context.shadowBlur = 18;

            const gradient = context.createLinearGradient(-this.width / 2, 0, this.width / 2, 0);
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
            return { x: this.x, y: this.y, width: this.width, height: this.height };
        }
    }

    /* BEAM */
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
            if (this.y - this.height <= 0) { this.dead = true; }
        }

        draw(context) {
            const beamTop = Math.max(0, this.y - this.height);
            const beamHeight = this.y - beamTop;
            const gradient = context.createLinearGradient(this.x, beamTop, this.x, this.y);
            gradient.addColorStop(0, "rgba(255,255,255,0)"
