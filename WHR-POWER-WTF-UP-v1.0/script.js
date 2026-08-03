"use strict";

/* =========================================================
   WHR: POWER WTF UP v2.3.1
   PURE 4-CORNER TELEPORT (33% EQUAL CHANCE, NO DESTRUCTION)
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

/* AUDIO SYNTH ENGINE */
class AudioEngine {
    constructor() { this.ctx = null; }
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
    playBlackHoleSuck() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }
}

const audio = new AudioEngine();

const GAME_CONFIG = {
    playerWidth: 44,
    playerHeight: 22,
    aimSpeed: 1.8,
    cableSpeed: 1400,
    gravity: 580,
    shootDelay: 300
};

const ORB_TYPES = {
    large: { radius: 30, speedX: 160, bounce: 820 },
    medium: { radius: 20, speedX: 200, bounce: 720 },
    small: { radius: 13, speedX: 240, bounce: 620 }
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
    aimAngle: 0,
    keys: { left: false, right: false, shoot: false },
    touch: { left: false, right: false, shoot: false },
    player: null,
    cables: [],
    orbs: [],
    blackHoles: [],
    holeAngle: 0
};

/* JOYSTICK ENGINE */
const joystick = {
    zone: document.getElementById("joystickZone"),
    base: document.getElementById("joystickBase"),
    stick: document.getElementById("joystickStick"),
    active: false,
    touchId: null,
    startX: 0,
    maxRadius: 65
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

        const normalized = deltaX / joystick.maxRadius;
        state.aimAngle = normalized * (Math.PI / 2.6);
    }

    function handleEnd(e) {
        if (!joystick.active) return;
        joystick.active = false;
        joystick.touchId = null;
        joystick.stick.style.transform = `translateX(0px)`;
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

    const r = 30;
    const padding = 34;
    state.blackHoles = [
        { id: 0, x: padding, y: padding, radius: r, dirX: 1, dirY: 1 },
        { id: 1, x: state.width - padding, y: padding, radius: r, dirX: -1, dirY: 1 },
        { id: 2, x: padding, y: state.height - padding - 30, radius: r, dirX: 1, dirY: -1 },
        { id: 3, x: state.width - padding, y: state.height - padding - 30, radius: r, dirX: -1, dirY: -1 }
    ];

    state.player = {
        x: state.width / 2 - GAME_CONFIG.playerWidth / 2,
        y: state.height - GAME_CONFIG.playerHeight - 8,
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
        state.aimAngle = 0;
        state.cables = [];
        state.orbs = [];
        updateHUD();
        startLevel(1);
    });
}

function startLevel(levelNumber) {
    state.level = levelNumber;
    state.paused = false;
    state.orbs = [];
    state.cables = [];

    const count = Math.min(2 + levelNumber, 6);
    for (let i = 0; i < count; i++) {
        const theme = RABBIT_THEMES[i % RABBIT_THEMES.length];
        state.orbs.push({
            x: (state.width / (count + 1)) * (i + 1),
            y: 70 + Math.random() * 40,
            radius: ORB_TYPES.large.radius,
            type: "large",
            velocityX: ORB_TYPES.large.speedX * (i % 2 === 0 ? 1 : -1),
            velocityY: -60,
            theme: theme,
            inHole: false,
            holeTimer: 0
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
    state.holeAngle += delta * 4;

    if (state.keys.left) state.aimAngle = Math.max(-Math.PI / 2.6, state.aimAngle - GAME_CONFIG.aimSpeed * delta);
    if (state.keys.right) state.aimAngle = Math.min(Math.PI / 2.6, state.aimAngle + GAME_CONFIG.aimSpeed * delta);

    if (state.keys.shoot || state.touch.shoot) {
        tryShoot(timestamp);
    }

    // Ažuriranje Zraka
    for (let i = state.cables.length - 1; i >= 0; i--) {
        const cable = state.cables[i];
        cable.length += GAME_CONFIG.cableSpeed * delta;
        cable.endX = cable.startX + Math.sin(cable.angle) * cable.length;
        cable.endY = cable.startY - Math.cos(cable.angle) * cable.length;

        if (cable.endY <= 0 || cable.endX <= 0 || cable.endX >= state.width) {
            state.cables.splice(i, 1);
        }
    }

    // Fizika Kugli & 33.3% Portal Teleport
    for (let oIdx = state.orbs.length - 1; oIdx >= 0; oIdx--) {
        const orb = state.orbs[oIdx];

        // Ako je u rupi (1 sekunda zadržavanja)
        if (orb.inHole) {
            orb.holeTimer -= delta;
            if (orb.holeTimer <= 0) {
                orb.inHole = false;

                // Odabir jedne od ostale 3 rupe (33.3% šanse za svaku)
                const otherHoles = state.blackHoles.filter(h => h.id !== orb.entryHoleId);
                const exitHole = otherHoles[Math.floor(Math.random() * otherHoles.length)];

                const speed = 520;
                orb.x = exitHole.x + exitHole.dirX * (orb.radius + 10);
                orb.y = exitHole.y + exitHole.dirY * (orb.radius + 10);

                // Lansiranje pod uglom od 45 stepeni
                orb.velocityX = exitHole.dirX * speed * 0.7071;
                orb.velocityY = exitHole.dirY * speed * 0.7071;

                audio.playBounce();
            }
            continue;
        }

        orb.velocityY += GAME_CONFIG.gravity * delta;
        orb.x += orb.velocityX * delta;
        orb.y += orb.velocityY * delta;

        // Provera ulaska u rupu
        state.blackHoles.forEach(bh => {
            const dist = Math.hypot(orb.x - bh.x, orb.y - bh.y);
            if (dist < bh.radius) {
                orb.inHole = true;
                orb.entryHoleId = bh.id;
                orb.holeTimer = 1.0; // TAČNO 1 SEKUNDA
                orb.x = bh.x;
                orb.y = bh.y;
                audio.playBlackHoleSuck();
            }
        });

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
    }

    // Fliper Bounce od Dijagonalnog Zraka
    state.cables.forEach(cable => {
        state.orbs.forEach(orb => {
            if (orb.inHole) return;

            const dist = pointToSegmentDistance(orb.x, orb.y, cable.startX, cable.startY, cable.endX, cable.endY);

            if (dist < orb.radius + 4) {
                audio.playBounce();

                const bounceAngle = cable.angle + (orb.x < state.width / 2 ? -Math.PI / 4 : Math.PI / 4);
                const speed = Math.hypot(orb.velocityX, orb.velocityY) + 90;

                orb.velocityX = Math.sin(bounceAngle) * speed;
                orb.velocityY = -Math.abs(Math.cos(bounceAngle) * speed);

                state.score += 25;
                updateHUD();
            }
        });
    });
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function tryShoot(timestamp) {
    if (state.cables.length >= 1) return;
    if (timestamp - state.lastShotTime < GAME_CONFIG.shootDelay) return;

    audio.playShoot();
    state.lastShotTime = timestamp;

    const startX = state.player.x + state.player.width / 2;
    const startY = state.player.y;

    state.cables.push({
        startX: startX,
        startY: startY,
        angle: state.aimAngle,
        length: 0,
        endX: startX,
        endY: startY
    });
}

function renderGame() {
    ctx.fillStyle = "#020205";
    ctx.fillRect(0, 0, state.width, state.height);

    // 1. RENDER 4 CORNER BLACK HOLES
    state.blackHoles.forEach(bh => {
        ctx.save();
        ctx.translate(bh.x, bh.y);

        ctx.rotate(state.holeAngle);
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#9c4dff";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, bh.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 245, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, bh.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "#000000";
        ctx.fill();

        ctx.restore();
    });

    // 2. BILIJARSKI LASERSKI NIŠAN
    if (state.player && state.cables.length === 0) {
        const startX = state.player.x + state.player.width / 2;
        const startY = state.player.y;
        const aimLength = 220;
        const targetX = startX + Math.sin(state.aimAngle) * aimLength;
        const targetY = startY - Math.cos(state.aimAngle) * aimLength;

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = "rgba(0, 245, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#00f5ff";
        ctx.fill();
        ctx.restore();
    }

    // 3. DIJAGONALNI ZRAK
    state.cables.forEach(cable => {
        ctx.save();
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cable.startX, cable.startY);
        ctx.lineTo(cable.endX, cable.endY);
        ctx.stroke();

        ctx.fillStyle = "#ff2fcf";
        ctx.beginPath();
        ctx.arc(cable.endX, cable.endY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 4. RABBIT ORBS
    state.orbs.forEach(o => {
        if (o.inHole) return;

        const theme = o.theme || RABBIT_THEMES[0];
        const r = o.radius;

        ctx.save();
        ctx.translate(o.x, o.y);

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = theme.main;
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.main;

        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.6, r * 0.18, r * 0.4, -0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.6, r * 0.18, r * 0.4, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = theme.eye;
        ctx.fillRect(-r * 0.4, -r * 0.1, r * 0.8, r * 0.25);

        ctx.restore();
    });

    // 5. FIKSIRANI TOP / IGRAČ U CENTRU
    if (state.player) {
        ctx.save();
        ctx.translate(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);

        ctx.fillStyle = "#ff2fcf";
        ctx.fillRect(-state.player.width / 2, -state.player.height / 2, state.player.width, state.player.height);

        ctx.rotate(state.aimAngle);
        ctx.fillStyle = "#00f5ff";
        ctx.fillRect(-4, -18, 8, 18);

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
