"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.8.2
   CLEAN CANVAS RENDER & FLIPER BOUNCE PHYSICS
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
    hud: {
        score: document.getElementById("scoreValue"),
        bestScore: document.getElementById("bestScoreValue"),
        level: document.getElementById("levelValue"),
        combo: document.getElementById("comboValue")
    }
};

const ctx = DOM.canvas.getContext("2d");

/* PROCEDURAL AUDIO */
class AudioEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    playShoot() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
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
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}

const audio = new AudioEngine();

const GAME_CONFIG = {
    playerWidth: 50,
    playerHeight: 24,
    playerSpeed: 750,
    cableSpeed: 1300,
    gravity: 620,
    shootDelay: 300
};

const ORB_TYPES = {
    large: { radius: 36, speedX: 160, bounce: 850 },
    medium: { radius: 24, speedX: 200, bounce: 750 },
    small: { radius: 15, speedX: 240, bounce: 650 }
};

const RABBIT_THEMES = [
    { name: "White Hacker", main: "#00f5ff", eye: "#32ff9b" },
    { name: "Black Hacker", main: "#ff2fcf", eye: "#ff315d" },
    { name: "Blue Freeze", main: "#00a2ff", eye: "#ffffff" },
    { name: "Golden Rabbit", main: "#ffe45c", eye: "#ff9100" },
    { name: "Red Cyber", main: "#ff315d", eye: "#ffe45c" }
];

const state = {
    running: false,
    paused: false,
    lastTimestamp: 0,
    width: 600,
    height: 800,
    score: 0,
    level: 1,
    lastShotTime: 0,
    keys: { left: false, right: false, shoot: false },
    touch: { left: false, right: false, shoot: false },
    player: null,
    cables: [],
    orbs: [],
    particles: []
};

/* JOYSTICK ENGINE */
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
        deltaX = Math.max(-joystick.maxRadius, Math.min(joystick.maxRadius, deltaX));

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

function startNewGame() {
    audio.init();
    showScreen("game");
    window.requestAnimationFrame(() => {
        resizeCanvas();
        state.score = 0;
        state.level = 1;
        state.cables = [];
        state.orbs = [];
        state.particles = [];
        state.player = createPlayer();
        updateHUD();
        startLevel(1);
    });
}

function startLevel(levelNumber) {
    state.level = levelNumber;
    state.paused = false;
    state.orbs = [];
    state.cables = [];
    state.particles = [];

    const count = Math.min(2 + levelNumber, 5);
    for (let i = 0; i < count; i++) {
        const theme = RABBIT_THEMES[i % RABBIT_THEMES.length];
        state.orbs.push({
            x: (state.width / (count + 1)) * (i + 1),
            y: 70 + Math.random() * 60,
            radius: ORB_TYPES.large.radius,
            type: "large",
            velocityX: ORB_TYPES.large.speedX * (i % 2 === 0 ? 1 : -1),
            velocityY: -100,
            theme: theme
        });
    }

    state.running = true;
    state.lastTimestamp = performance.now();
    window.requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!state.running) return;

    const delta = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;

    if (!state.paused) {
        updateGame(delta, timestamp);
    }

    renderGame();
    window.requestAnimationFrame(gameLoop);
}

function updateGame(delta, timestamp) {
    const dir = (state.keys.left || state.touch.left ? -1 : 0) + (state.keys.right || state.touch.right ? 1 : 0);
    state.player.x += dir * GAME_CONFIG.playerSpeed * delta;
    state.player.x = Math.max(0, Math.min(state.width - state.player.width, state.player.x));

    if (state.keys.shoot || state.touch.shoot) {
        tryShoot(timestamp);
    }

    // Harpoon Cable Update
    for (let i = state.cables.length - 1; i >= 0; i--) {
        const cable = state.cables[i];
        cable.height += GAME_CONFIG.cableSpeed * delta;
        if (cable.height >= state.height) {
            state.cables.splice(i, 1);
        }
    }

    // Orbs Physics
    state.orbs.forEach(orb => {
        orb.velocityY += GAME_CONFIG.gravity * delta;
        orb.x += orb.velocityX * delta;
        orb.y += orb.velocityY * delta;

        // Bounce Walls
        if (orb.x - orb.radius < 0) {
            orb.x = orb.radius;
            orb.velocityX *= -1;
        } else if (orb.x + orb.radius > state.width) {
            orb.x = state.width - orb.radius;
            orb.velocityX *= -1;
        }

        // Bounce Ceiling
        if (orb.y - orb.radius < 0) {
            orb.y = orb.radius;
            orb.velocityY = Math.abs(orb.velocityY) * 0.85;
        }

        // Bounce Floor
        if (orb.y + orb.radius > state.height - 4) {
            orb.y = state.height - 4 - orb.radius;
            orb.velocityY = -ORB_TYPES[orb.type].bounce;
        }
    });

    // Fliper Bounce Colision against Harpoon
    state.cables.forEach(cable => {
        const cableX = cable.x;
        const cableTopY = state.height - cable.height;

        state.orbs.forEach(orb => {
            if (orb.y >= cableTopY - orb.radius && orb.y <= state.height) {
                if (Math.abs(orb.x - cableX) < orb.radius + 4) {
                    audio.playBounce();

                    if (orb.x < cableX) {
                        orb.velocityX = -Math.abs(orb.velocityX) - 50;
                        orb.x = cableX - orb.radius - 4;
                    } else {
                        orb.velocityX = Math.abs(orb.velocityX) + 50;
                        orb.x = cableX + orb.radius + 4;
                    }

                    orb.velocityY = -Math.abs(orb.velocityY) - 120;
                    state.score += 20;
                    updateHUD();
                }
            }
        });
    });
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
    // Potpuno brisanje ekrana bez tragova
    ctx.fillStyle = "#020205";
    ctx.fillRect(0, 0, state.width, state.height);

    // Render Harpoon Bouncer
    state.cables.forEach(cable => {
        const startY = state.height;
        const topY = state.height - cable.height;

        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cable.x, startY);
        ctx.lineTo(cable.x, topY);
        ctx.stroke();

        ctx.fillStyle = "#ff2fcf";
        ctx.beginPath();
        ctx.arc(cable.x, topY, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // Render Clean Rabbit Orbs
    state.orbs.forEach(o => {
        const theme = o.theme || RABBIT_THEMES[0];
        const r = o.radius;

        ctx.save();
        ctx.translate(o.x, o.y);

        // Orb Outline
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = theme.main;
        ctx.stroke();

        // Rabbit Ears
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.main;

        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.6, r * 0.18, r * 0.4, -0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.6, r * 0.18, r * 0.4, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        // VR Visor / Eyes
        ctx.fillStyle = theme.eye;
        ctx.fillRect(-r * 0.4, -r * 0.1, r * 0.8, r * 0.25);

        ctx.restore();
    });

    // Render Player
    if (state.player) {
        ctx.fillStyle = "#ff2fcf";
        ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
    }
}

function updateHUD() {
    if (DOM.hud.score) DOM.hud.score.textContent = String(state.score).padStart(6, "0");
    if (DOM.hud.level) DOM.hud.level.textContent = String(state.level).padStart(2, "0");
}

function showScreen(name) {
    Object.keys(DOM.screens).forEach(k => {
        if (DOM.screens[k]) {
            if (k === name) DOM.screens[k].classList.add("screen--active");
            else DOM.screens[k].classList.remove("screen--active");
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
