"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.8.0
   PINBALL HARPOON-BOUNCER PHYSICS & RABBIT ORB REFLECTION
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
        shoot: document.getElementById("shootButton"),
        whiteHatProtocol: document.getElementById("whiteHatProtocolButton"),
        closeWhiteHatProtocol: document.getElementById("closeWhiteHatProtocolButton"),
        copySecurityReport: document.getElementById("copySecurityReportButton")
    },
    canvas: document.getElementById("gameCanvas"),
    gameStage: document.getElementById("gameStage"),
    pauseOverlay: document.getElementById("pauseOverlay"),
    hud: {
        score: document.getElementById("scoreValue"),
        bestScore: document.getElementById("bestScoreValue"),
        level: document.getElementById("levelValue"),
        combo: document.getElementById("comboValue"),
        lives: document.getElementById("livesContainer")
    }
};

const ctx = DOM.canvas.getContext("2d", { alpha: true });

/* PROCEDURAL WEB AUDIO SYNTH ENGINE */
class AudioEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
    }

    playShoot() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playBounce() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}

const audio = new AudioEngine();

const GAME_CONFIG = {
    startingLives: 3,
    playerWidth: 50,
    playerHeight: 24,
    playerSpeed: 750,
    cableSpeed: 1300,
    gravity: 620,
    shootDelay: 300
};

const ORB_TYPES = {
    large: { radius: 42, speedX: 160, bounce: 880, score: 100 },
    medium: { radius: 26, speedX: 200, bounce: 760, score: 180 },
    small: { radius: 15, speedX: 250, bounce: 640, score: 300 }
};

const RABBIT_THEMES = [
    { name: "White Hacker", main: "#00f5ff", eye: "#32ff9b" },
    { name: "Black Hacker", main: "#ff2fcf", eye: "#ff315d" },
    { name: "Blue Freeze", main: "#00a2ff", eye: "#ffffff" },
    { name: "Golden Rabbit", main: "#ffe45c", eye: "#ff9100" },
    { name: "Red Cyber", main: "#ff315d", eye: "#ffe45c" },
    { name: "Green Guardian", main: "#32ff9b", eye: "#00f5ff" },
    { name: "Void Shadow", main: "#9c4dff", eye: "#ff2fcf" }
];

const state = {
    running: false,
    paused: false,
    gameOver: false,
    levelComplete: false,
    animationFrameId: null,
    lastTimestamp: 0,
    width: 600,
    height: 800,
    score: 0,
    level: 1,
    lives: GAME_CONFIG.startingLives,
    lastShotTime: 0,
    keys: { left: false, right: false, shoot: false },
    touch: { left: false, right: false, shoot: false },
    player: null,
    cables: [],
    orbs: [],
    particles: []
};

/* JOYSTICK ENGINE WITH MAX SENSITIVITY */
const joystick = {
    zone: document.getElementById("joystickZone"),
    base: document.getElementById("joystickBase"),
    stick: document.getElementById("joystickStick"),
    active: false,
    touchId: null,
    startX: 0,
    maxRadius: 75
};

function initJoystick() {
    if (!joystick.zone || !joystick.base || !joystick.stick) return;

    function handleStart(e) {
        e.preventDefault();
        audio.init();
        if (joystick.active) return;

        const touch = e.changedTouches ? e.changedTouches[0] : e;
        joystick.active = true;
        joystick.touchId = touch.identifier ?? "mouse";

        const rect = joystick.base.getBoundingClientRect();
        joystick.startX = rect.left + rect.width / 2;

        handleMove(e);
    }

    function handleMove(e) {
        if (!joystick.active) return;

        let touch = null;
        if (e.changedTouches) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystick.touchId) {
                    touch = e.changedTouches[i];
                    break;
                }
            }
        } else {
            touch = e;
        }

        if (!touch) return;

        let deltaX = touch.clientX - joystick.startX;

        if (deltaX > joystick.maxRadius) deltaX = joystick.maxRadius;
        if (deltaX < -joystick.maxRadius) deltaX = -joystick.maxRadius;

        joystick.stick.style.transform = `translateX(${deltaX}px)`;

        if (deltaX < -2) {
            state.touch.left = true;
            state.touch.right = false;
        } else if (deltaX > 2) {
            state.touch.right = true;
            state.touch.left = false;
        } else {
            state.touch.left = false;
            state.touch.right = false;
        }
    }

    function handleEnd(e) {
        if (!joystick.active) return;

        if (e.changedTouches) {
            let touchFound = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystick.touchId) {
                    touchFound = true;
                    break;
                }
            }
            if (!touchFound) return;
        }

        joystick.active = false;
        joystick.touchId = null;
        joystick.stick.style.transform = `translateX(0px)`;

        state.touch.left = false;
        state.touch.right = false;
    }

    joystick.zone.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd, { passive: false });
    window.addEventListener("touchcancel", handleEnd, { passive: false });
}

function resizeCanvas() {
    if (!DOM.canvas || !DOM.gameStage) return;

    const rect = DOM.gameStage.getBoundingClientRect();
    state.width = rect.width;
    state.height = rect.height;

    DOM.canvas.width = rect.width;
    DOM.canvas.height = rect.height;

    if (state.player) {
        state.player.y = state.height - state.player.height - 10;
        state.player.x = Math.min(Math.max(0, state.player.x), state.width - state.player.width);
    }
}

function createPlayer() {
    return {
        x: state.width / 2 - GAME_CONFIG.playerWidth / 2,
        y: state.height - GAME_CONFIG.playerHeight - 10,
        width: GAME_CONFIG.playerWidth,
        height: GAME_CONFIG.playerHeight
    };
}

function resetGameState() {
    state.score = 0;
    state.level = 1;
    state.lives = GAME_CONFIG.startingLives;
    state.cables = [];
    state.orbs = [];
    state.particles = [];
    state.player = createPlayer();
    updateHUD();
}

function startNewGame() {
    audio.init();
    showScreen("game");
    window.requestAnimationFrame(() => {
        resizeCanvas();
        resetGameState();
        startLevel(1);
    });
}

function startLevel(levelNumber) {
    state.level = levelNumber;
    state.levelComplete = false;
    state.paused = false;
    state.orbs = [];
    state.cables = [];
    state.particles = [];
    createLevelOrbs(levelNumber);
    state.running = true;
    state.lastTimestamp = performance.now();
    if (!state.animationFrameId) {
        state.animationFrameId = window.requestAnimationFrame(gameLoop);
    }
}

function createLevelOrbs(levelNumber) {
    const count = Math.min(2 + Math.floor(levelNumber / 2), 6);
    for (let i = 0; i < count; i++) {
        const theme = RABBIT_THEMES[i % RABBIT_THEMES.length];
        const typeKeys = ["large", "medium", "small"];
        const orbType = typeKeys[i % 3];
        state.orbs.push({
            x: (state.width / (count + 1)) * (i + 1),
            y: 60 + Math.random() * 80,
            radius: ORB_TYPES[orbType].radius,
            type: orbType,
            velocityX: ORB_TYPES[orbType].speedX * (i % 2 === 0 ? 1 : -1),
            velocityY: -ORB_TYPES[orbType].bounce * 0.3,
            theme: theme
        });
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 180;
        state.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 3,
            color: color,
            alpha: 1.0,
            life: 0.35
        });
    }
}

function gameLoop(timestamp) {
    if (!state.running) return;

    const delta = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;

    if (!state.paused && !state.gameOver) {
        updateGame(delta, timestamp);
    }

    renderGame();
    state.animationFrameId = window.requestAnimationFrame(gameLoop);
}

function updateGame(delta, timestamp) {
    const dir = (state.keys.left || state.touch.left ? -1 : 0) + (state.keys.right || state.touch.right ? 1 : 0);
    state.player.x += dir * GAME_CONFIG.playerSpeed * delta;
    state.player.x = Math.max(0, Math.min(state.width - state.player.width, state.player.x));

    if (state.keys.shoot || state.touch.shoot) {
        tryShoot(timestamp);
    }

    // Cables / Harpoon Update
    for (let i = state.cables.length - 1; i >= 0; i--) {
        const cable = state.cables[i];
        cable.height += GAME_CONFIG.cableSpeed * delta;

        if (cable.height >= state.height) {
            state.cables.splice(i, 1);
        }
    }

    // Orbs Physics & Wall Bounces
    state.orbs.forEach(orb => {
        orb.velocityY += GAME_CONFIG.gravity * delta;
        orb.x += orb.velocityX * delta;
        orb.y += orb.velocityY * delta;

        // Odbijanje od zidova
        if (orb.x - orb.radius < 0) {
            orb.x = orb.radius;
            orb.velocityX *= -1;
        } else if (orb.x + orb.radius > state.width) {
            orb.x = state.width - orb.radius;
            orb.velocityX *= -1;
        }

        // Odbijanje od plafona
        if (orb.y - orb.radius < 0) {
            orb.y = orb.radius;
            orb.velocityY = Math.abs(orb.velocityY) * 0.85;
        }

        // Odbijanje od poda
        if (orb.y + orb.radius > state.height - 4) {
            orb.y = state.height - 4 - orb.radius;
            orb.velocityY = -ORB_TYPES[orb.type].bounce;
        }
    });

    // FLIPER FIZIKA ODBIJANJA OD ZRAKA (HARPUN NE UNISTAVA NEGO ODBIJA)
    state.cables.forEach(cable => {
        const cableX = cable.x;
        const cableTopY = state.height - cable.height;

        state.orbs.forEach(orb => {
            if (orb.y >= cableTopY - orb.radius && orb.y <= state.height) {
                const distX = Math.abs(orb.x - cableX);

                if (distX < orb.radius + 4) {
                    audio.playBounce();
                    createParticles(orb.x, orb.y, "#00f5ff");

                    // Smer odbijanja zavisno sa koje strane zraka udara
                    if (orb.x < cableX) {
                        orb.velocityX = -Math.abs(orb.velocityX) - 60;
                        orb.x = cableX - orb.radius - 5;
                    } else {
                        orb.velocityX = Math.abs(orb.velocityX) + 60;
                        orb.x = cableX + orb.radius + 5;
                    }

                    // Vertikalni odbojnik boost
                    orb.velocityY = -Math.abs(orb.velocityY) * 1.1 - 150;

                    state.score += 25;
                    updateHUD();
                }
            }
        });
    });

    // Particles Update
    for (let pIdx = state.particles.length - 1; pIdx >= 0; pIdx--) {
        const p = state.particles[pIdx];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.alpha -= delta / p.life;

        if (p.alpha <= 0) {
            state.particles.splice(pIdx, 1);
        }
    }
}

function tryShoot(timestamp) {
    if (state.cables.length >= 1) return;
    if (timestamp - state.lastShotTime < GAME_CONFIG.shootDelay) return;

    audio.playShoot();
    state.lastShotTime = timestamp;
    state.cables.push({
        x: state.player.x + state.player.width / 2,
        height: 0
    });
}

function renderGame() {
    ctx.clearRect(0, 0, state.width, state.height);

    // 1. NEON FLIPER HARPOON BOUNCER
    state.cables.forEach(cable => {
        const startY = state.height;
        const topY = state.height - cable.height;

        ctx.save();
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.moveTo(cable.x, startY);

        for (let y = startY; y > topY; y -= 10) {
            const offsetX = Math.sin(y * 0.2) * 5;
            ctx.lineTo(cable.x + offsetX, y);
        }
        ctx.lineTo(cable.x, topY);
        ctx.stroke();

        // High Voltage Energy Tip
        ctx.fillStyle = "#ff2fcf";
        ctx.shadowColor = "#ff2fcf";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cable.x, topY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 2. ADVANCED RABBIT ORBS
    state.orbs.forEach(o => {
        const theme = o.theme || RABBIT_THEMES[0];
        const r = o.radius;

        ctx.save();
        ctx.translate(o.x, o.y);

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(5, 4, 10, 0.88)";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = theme.main;
        ctx.shadowColor = theme.main;
        ctx.shadowBlur = 18;
        ctx.stroke();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = theme.main;
        ctx.fillStyle = theme.main;

        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.65, r * 0.18, r * 0.45, -0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.65, r * 0.18, r * 0.45, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        if (theme.name === "Black Hacker" || theme.name === "White Hacker") {
            ctx.fillStyle = theme.eye;
            ctx.shadowColor = theme.eye;
            ctx.shadowBlur = 12;
            ctx.fillRect(-r * 0.5, -r * 0.15, r * 1.0, r * 0.32);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(r * 0.1, -r * 0.1, r * 0.25, r * 0.2);
        } else if (theme.name === "Red Cyber") {
            ctx.strokeStyle = "#ff315d";
            ctx.shadowColor = "#ff315d";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
            ctx.moveTo(-r * 0.55, 0); ctx.lineTo(r * 0.55, 0);
            ctx.moveTo(0, -r * 0.55); ctx.lineTo(0, r * 0.55);
            ctx.stroke();
        } else if (theme.name === "Golden Rabbit") {
            ctx.fillStyle = "#ffe45c";
            ctx.shadowColor = "#ffe45c";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(-r * 0.3, 0, r * 0.12, 0, Math.PI * 2);
            ctx.arc(r * 0.3, 0, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = theme.eye;
            ctx.shadowColor = theme.eye;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(-r * 0.3, 0, r * 0.14, 0, Math.PI * 2);
            ctx.arc(r * 0.3, 0, r * 0.14, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    // 3. PARTICLES
    state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
    });

    // 4. PLAYER GUARDIAN
    if (state.player) {
        ctx.save();
        ctx.shadowColor = "#ff2fcf";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#ff2fcf";
        ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(state.player.x + state.player.width / 2 - 4, state.player.y + 4, 8, state.player.height - 8);
        ctx.restore();
    }
}

function updateHUD() {
    if (DOM.hud.score) DOM.hud.score.textContent = String(state.score).padStart(6, "0");
    if (DOM.hud.level) DOM.hud.level.textContent = String(state.level).padStart(2, "0");
}

function showScreen(name) {
    Object.keys(DOM.screens).forEach(k => {
        if (DOM.screens[k]) {
            if (k === name) {
                DOM.screens[k].classList.add("screen--active");
            } else {
                DOM.screens[k].classList.remove("screen--active");
            }
        }
    });
}

function bindShootControl(btn) {
    if (!btn) return;
    btn.addEventListener("pointerdown", e => { e.preventDefault(); audio.init(); state.touch.shoot = true; });
    btn.addEventListener("pointerup", e => { e.preventDefault(); state.touch.shoot = false; });
    btn.addEventListener("pointercancel", e => { e.preventDefault(); state.touch.shoot = false; });
}

function handleKeyDown(e) {
    audio.init();
    if (e.code === "ArrowLeft" || e.code === "KeyA") state.keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") state.keys.right = true;
    if (e.code === "Space") state.keys.shoot = true;
}

function handleKeyUp(e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") state.keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") state.keys.right = false;
    if (e.code === "Space") state.keys.shoot = false;
}

function init() {
    initJoystick();
    bindShootControl(DOM.buttons.shoot);

    DOM.buttons.start?.addEventListener("click", startNewGame);
    DOM.buttons.instructionsStart?.addEventListener("click", startNewGame);
    DOM.buttons.nextLevel?.addEventListener("click", () => {
        showScreen("game");
        startLevel(state.level + 1);
    });
    DOM.buttons.playAgain?.addEventListener("click", startNewGame);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", resizeCanvas);

    showScreen("start");
    resizeCanvas();
}

window.addEventListener("DOMContentLoaded", init);
