"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.3.0
   ORIGINAL WHR GUARDIAN VS RABBIT ANOMALIES ENGINE
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
    },
    startRecords: {
        bestScore: document.getElementById("startBestScore"),
        maxLevel: document.getElementById("startMaxLevel")
    },
    results: {
        levelScore: document.getElementById("levelScoreValue"),
        levelMaxCombo: document.getElementById("levelMaxComboValue"),
        orbsDestroyed: document.getElementById("orbsDestroyedValue"),
        levelMessage: document.getElementById("levelCompleteMessage"),
        finalScore: document.getElementById("finalScoreValue"),
        finalLevel: document.getElementById("finalLevelValue"),
        finalCombo: document.getElementById("finalComboValue")
    }
};

const ctx = DOM.canvas.getContext("2d", { alpha: true });

const STORAGE_KEYS = {
    bestScore: "whrPowerWtfUpBestScore",
    maxLevel: "whrPowerWtfUpMaxLevel"
};

const GAME_CONFIG = {
    startingLives: 3,
    // WHR GUARDIAN COMPACT PLAYER SIZE
    playerWidth: 44,
    playerHeight: 32,
    playerSpeed: 520,
    ropeSpeed: 1250,
    gravity: 800,
    shootDelay: 320
};

/* RABBIT ANOMALY ARCHETYPES */
const RABBIT_TYPES = {
    large: { radius: 48, speedX: 150, bounce: 680, score: 100, next: "medium" },
    medium: { radius: 32, speedX: 190, bounce: 550, score: 180, next: "small" },
    small: { radius: 20, speedX: 240, bounce: 450, score: 300, next: null }
};

const RABBIT_COLORS = [
    { name: "red", hue: 350 },
    { name: "blue", hue: 200 },
    { name: "white", hue: 0, isWhite: true },
    { name: "green", hue: 130 },
    { name: "gold", hue: 45, isGold: true },
    { name: "purple", hue: 280 }
];

const state = {
    running: false,
    paused: false,
    gameOver: false,
    levelComplete: false,
    hitStopUntil: 0,
    animationFrameId: null,
    lastTimestamp: 0,
    width: 600,
    height: 800,
    score: 0,
    bestScore: Number(localStorage.getItem(STORAGE_KEYS.bestScore)) || 0,
    level: 1,
    maxLevel: Number(localStorage.getItem(STORAGE_KEYS.maxLevel)) || 1,
    lives: GAME_CONFIG.startingLives,
    combo: 1,
    maxCombo: 1,
    lastShotTime: 0,
    keys: { left: false, right: false, shoot: false },
    touch: { left: false, right: false, shoot: false },
    player: null,
    cables: [],
    rabbits: [],
    particles: []
};

/* TOUCH SLIDE JOYSTICK ENGINE */
const joystick = {
    zone: document.getElementById("joystickZone"),
    base: document.getElementById("joystickBase"),
    stick: document.getElementById("joystickStick"),
    active: false,
    touchId: null,
    startX: 0,
    maxRadius: 40
};

function initJoystick() {
    if (!joystick.zone || !joystick.base || !joystick.stick) return;

    function handleStart(e) {
        e.preventDefault();
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

        const intensity = deltaX / joystick.maxRadius;

        if (intensity < -0.15) {
            state.touch.left = true;
            state.touch.right = false;
        } else if (intensity > 0.15) {
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
        state.player.y = state.height - state.player.height - 8;
        state.player.x = Math.min(Math.max(0, state.player.x), state.width - state.player.width);
    }
}

function createPlayer() {
    return {
        x: state.width / 2 - GAME_CONFIG.playerWidth / 2,
        y: state.height - GAME_CONFIG.playerHeight - 8,
        width: GAME_CONFIG.playerWidth,
        height: GAME_CONFIG.playerHeight,
        facing: 1
    };
}

function resetGameState() {
    state.score = 0;
    state.level = 1;
    state.lives = GAME_CONFIG.startingLives;
    state.combo = 1;
    state.maxCombo = 1;
    state.cables = [];
    state.rabbits = [];
    state.particles = [];
    state.player = createPlayer();
    updateHUD();
}

function startNewGame() {
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
    state.rabbits = [];
    state.cables = [];
    createLevelRabbits(levelNumber);
    state.running = true;
    state.lastTimestamp = performance.now();
    if (!state.animationFrameId) {
        state.animationFrameId = window.requestAnimationFrame(gameLoop);
    }
}

function createLevelRabbits(levelNumber) {
    const count = Math.min(1 + Math.floor(levelNumber / 2), 5);
    for (let i = 0; i < count; i++) {
        const colorObj = RABBIT_COLORS[i % RABBIT_COLORS.length];
        state.rabbits.push({
            x: (state.width / (count + 1)) * (i + 1),
            y: 80 + Math.random() * 80,
            radius: RABBIT_TYPES.large.radius,
            type: "large",
            velocityX: RABBIT_TYPES.large.speedX * (i % 2 === 0 ? 1 : -1),
            velocityY: -RABBIT_TYPES.large.bounce * 0.3,
            colorInfo: colorObj
        });
    }
}

function gameLoop(timestamp) {
    if (!state.running) return;

    const delta = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;

    if (timestamp > state.hitStopUntil) {
        if (!state.paused && !state.gameOver) {
            updateGame(delta, timestamp);
        }
    }

    renderGame();
    state.animationFrameId = window.requestAnimationFrame(gameLoop);
}

function updateGame(delta, timestamp) {
    const dir = (state.keys.left || state.touch.left ? -1 : 0) + (state.keys.right || state.touch.right ? 1 : 0);
    if (dir !== 0) state.player.facing = dir;
    state.player.x += dir * GAME_CONFIG.playerSpeed * delta;
    state.player.x = Math.max(0, Math.min(state.width - state.player.width, state.player.x));

    if (state.keys.shoot || state.touch.shoot) {
        tryShoot(timestamp);
    }

    for (let i = state.cables.length - 1; i >= 0; i--) {
        const cable = state.cables[i];
        cable.height += GAME_CONFIG.ropeSpeed * delta;
        if (cable.height >= state.height) {
            state.cables.splice(i, 1);
        }
    }

    state.rabbits.forEach(rabbit => {
        rabbit.velocityY += GAME_CONFIG.gravity * delta;
        rabbit.x += rabbit.velocityX * delta;
        rabbit.y += rabbit.velocityY * delta;

        if (rabbit.x - rabbit.radius < 0 || rabbit.x + rabbit.radius > state.width) {
            rabbit.velocityX *= -1;
        }
        if (rabbit.y + rabbit.radius > state.height - 4) {
            rabbit.y = state.height - 4 - rabbit.radius;
            rabbit.velocityY = -RABBIT_TYPES[rabbit.type].bounce;
        }
    });

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    for (let cIdx = state.cables.length - 1; cIdx >= 0; cIdx--) {
        const cable = state.cables[cIdx];
        const cableX = cable.x;
        const cableTopY = state.height - cable.height;

        for (let rIdx = state.rabbits.length - 1; rIdx >= 0; rIdx--) {
            const rabbit = state.rabbits[rIdx];

            const closestY = Math.max(cableTopY, Math.min(state.height, rabbit.y));
            const distX = rabbit.x - cableX;
            const distY = rabbit.y - closestY;
            const distance = Math.hypot(distX, distY);

            if (distance < rabbit.radius + 3) {
                state.cables.splice(cIdx, 1);
                state.hitStopUntil = timestamp + 40;
                
                spawnSparks(rabbit.x, rabbit.y, rabbit.colorInfo.hue);
                destroyRabbit(rIdx, rabbit);
                break;
            }
        }
    }

    if (state.rabbits.length === 0 && !state.levelComplete) {
        state.levelComplete = true;
        setTimeout(() => {
            showScreen("levelComplete");
        }, 500);
    }
}

function spawnSparks(x, y, hue) {
    for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 200;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.25 + Math.random() * 0.2,
            hue: hue ?? 190
        });
    }
}

function destroyRabbit(idx, rabbit) {
    state.rabbits.splice(idx, 1);
    state.score += RABBIT_TYPES[rabbit.type].score;
    updateHUD();

    const next = RABBIT_TYPES[rabbit.type].next;
    if (next) {
        const cfg = RABBIT_TYPES[next];
        state.rabbits.push({
            x: rabbit.x - 12, y: rabbit.y, radius: cfg.radius, type: next,
            velocityX: -cfg.speedX, velocityY: -cfg.bounce * 0.6, colorInfo: rabbit.colorInfo
        });
        state.rabbits.push({
            x: rabbit.x + 12, y: rabbit.y, radius: cfg.radius, type: next,
            velocityX: cfg.speedX, velocityY: -cfg.bounce * 0.6, colorInfo: rabbit.colorInfo
        });
    }
}

function tryShoot(timestamp) {
    if (state.cables.length >= 1) return;
    if (timestamp - state.lastShotTime < GAME_CONFIG.shootDelay) return;

    state.lastShotTime = timestamp;
    state.cables.push({
        x: state.player.x + state.player.width / 2,
        height: 0
    });
}

/* VECTOR RENDERER FOR WHR GUARDIAN & RABBIT ANOMALIES */
function renderGame() {
    ctx.clearRect(0, 0, state.width, state.height);

    // Neo-Rope Cable
    state.cables.forEach(cable => {
        const startY = state.height;
        const topY = state.height - cable.height;

        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(cable.x, startY);

        for (let y = startY; y > topY; y -= 12) {
            const offsetX = Math.sin(y * 0.1) * 3;
            ctx.lineTo(cable.x + offsetX, y);
        }
        ctx.lineTo(cable.x, topY);
        ctx.stroke();

        ctx.fillStyle = "#ff2fcf";
        ctx.beginPath();
        ctx.moveTo(cable.x - 7, topY + 10);
        ctx.lineTo(cable.x + 7, topY + 10);
        ctx.lineTo(cable.x, topY - 6);
        ctx.closePath();
        ctx.fill();
    });

    // Spark Particles
    state.particles.forEach(p => {
        ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
        ctx.fillRect(p.x, p.y, 3, 3);
    });

    // Vector Rabbit Anomalies
    state.rabbits.forEach(r => {
        ctx.save();
        ctx.translate(r.x, r.y);

        const fillStyle = r.colorInfo.isWhite ? "#ffffff" : `hsl(${r.colorInfo.hue}, 90%, 60%)`;
        ctx.fillStyle = fillStyle;
        ctx.shadowColor = fillStyle;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
        ctx.fill();

        const earW = r.radius * 0.35;
        const earH = r.radius * 0.9;
        
        ctx.beginPath();
        ctx.ellipse(-r.radius * 0.35, -r.radius * 0.8, earW / 2, earH / 2, -0.15, 0, Math.PI * 2);
        ctx.ellipse(r.radius * 0.35, -r.radius * 0.8, earW / 2, earH / 2, 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ff315d";
        ctx.fillRect(-r.radius * 0.3, -r.radius * 0.1, r.radius * 0.2, r.radius * 0.2);
        ctx.fillRect(r.radius * 0.1, -r.radius * 0.1, r.radius * 0.2, r.radius * 0.2);

        ctx.restore();
    });

    // WHR Guardian Character
    if (state.player) {
        const p = state.player;
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.ellipse(0, 4, p.width / 2, p.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#00f5ff";
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-18, -20);
        ctx.lineTo(-6, -8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(18, -20);
        ctx.lineTo(6, -8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ff2fcf";
        ctx.fillRect(-10, -2, 20, 5);

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
    btn.addEventListener("pointerdown", e => { e.preventDefault(); state.touch.shoot = true; });
    btn.addEventListener("pointerup", e => { e.preventDefault(); state.touch.shoot = false; });
    btn.addEventListener("pointercancel", e => { e.preventDefault(); state.touch.shoot = false; });
}

function handleKeyDown(e) {
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
