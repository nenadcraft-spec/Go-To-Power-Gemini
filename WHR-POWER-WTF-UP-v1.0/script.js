"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.1.3 (Dynamic Arena Engine)
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
    playerWidth: 60,
    playerHeight: 26,
    playerSpeed: 520,
    normalShootDelay: 250,
    beamSpeed: 1100,
    gravity: 800,
};

const ORB_TYPES = {
    large: { radius: 46, speedX: 160, bounce: 680, score: 100, next: "medium" },
    medium: { radius: 30, speedX: 200, bounce: 560, score: 180, next: "small" },
    small: { radius: 18, speedX: 250, bounce: 460, score: 300, next: null }
};

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
    beams: [],
    orbs: []
};

function resizeCanvas() {
    if (!DOM.canvas || !DOM.gameStage) return;

    const rect = DOM.gameStage.getBoundingClientRect();
    state.width = rect.width;
    state.height = rect.height;

    DOM.canvas.width = rect.width;
    DOM.canvas.height = rect.height;

    if (state.player) {
        state.player.y = state.height - state.player.height - 18;
        state.player.x = Math.min(Math.max(0, state.player.x), state.width - state.player.width);
    }
}

function createPlayer() {
    return {
        x: state.width / 2 - GAME_CONFIG.playerWidth / 2,
        y: state.height - GAME_CONFIG.playerHeight - 18,
        width: GAME_CONFIG.playerWidth,
        height: GAME_CONFIG.playerHeight
    };
}

function resetGameState() {
    state.score = 0;
    state.level = 1;
    state.lives = GAME_CONFIG.startingLives;
    state.combo = 1;
    state.maxCombo = 1;
    state.beams = [];
    state.orbs = [];
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
    state.orbs = [];
    state.beams = [];
    createLevelOrbs(levelNumber);
    state.running = true;
    state.lastTimestamp = performance.now();
    if (!state.animationFrameId) {
        state.animationFrameId = window.requestAnimationFrame(gameLoop);
    }
}

function createLevelOrbs(levelNumber) {
    const count = Math.min(1 + Math.floor(levelNumber / 2), 5);
    for (let i = 0; i < count; i++) {
        state.orbs.push({
            x: (state.width / (count + 1)) * (i + 1),
            y: 80 + Math.random() * 100,
            radius: ORB_TYPES.large.radius,
            type: "large",
            velocityX: ORB_TYPES.large.speedX * (i % 2 === 0 ? 1 : -1),
            velocityY: -ORB_TYPES.large.bounce * 0.4,
            hue: 180 + Math.random() * 50
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

    for (let i = state.beams.length - 1; i >= 0; i--) {
        const b = state.beams[i];
        b.y -= GAME_CONFIG.beamSpeed * delta;
        if (b.y < 0) state.beams.splice(i, 1);
    }

    state.orbs.forEach(orb => {
        orb.velocityY += GAME_CONFIG.gravity * delta;
        orb.x += orb.velocityX * delta;
        orb.y += orb.velocityY * delta;

        if (orb.x - orb.radius < 0 || orb.x + orb.radius > state.width) {
            orb.velocityX *= -1;
        }
        if (orb.y + orb.radius > state.height - 10) {
            orb.y = state.height - 10 - orb.radius;
            orb.velocityY = -ORB_TYPES[orb.type].bounce;
        }
    });

    for (let bIdx = state.beams.length - 1; bIdx >= 0; bIdx--) {
        const b = state.beams[bIdx];
        for (let oIdx = state.orbs.length - 1; oIdx >= 0; oIdx--) {
            const o = state.orbs[oIdx];
            const dist = Math.hypot(b.x - o.x, b.y - o.y);
            if (dist < o.radius + b.width) {
                state.beams.splice(bIdx, 1);
                destroyOrb(oIdx, o);
                break;
            }
        }
    }

    if (state.orbs.length === 0 && !state.levelComplete) {
        state.levelComplete = true;
        setTimeout(() => {
            showScreen("levelComplete");
        }, 500);
    }
}

function destroyOrb(idx, orb) {
    state.orbs.splice(idx, 1);
    state.score += ORB_TYPES[orb.type].score;
    updateHUD();

    const next = ORB_TYPES[orb.type].next;
    if (next) {
        const cfg = ORB_TYPES[next];
        state.orbs.push({
            x: orb.x - 12, y: orb.y, radius: cfg.radius, type: next,
            velocityX: -cfg.speedX, velocityY: -cfg.bounce * 0.6, hue: orb.hue + 15
        });
        state.orbs.push({
            x: orb.x + 12, y: orb.y, radius: cfg.radius, type: next,
            velocityX: cfg.speedX, velocityY: -cfg.bounce * 0.6, hue: orb.hue + 15
        });
    }
}

function tryShoot(timestamp) {
    if (timestamp - state.lastShotTime < GAME_CONFIG.normalShootDelay) return;
    state.lastShotTime = timestamp;
    state.beams.push({ x: state.player.x + state.player.width / 2, y: state.player.y, width: 5, height: 20 });
}

function renderGame() {
    ctx.clearRect(0, 0, state.width, state.height);

    ctx.fillStyle = "#00f5ff";
    state.beams.forEach(b => ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height));

    state.orbs.forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${o.hue}, 90%, 60%)`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
    });

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
        if (DOM.screens[k]) DOM.screens[k].classList.toggle("screen--active", k === name);
    });
}

function bindHoldControl(btn, key) {
    if (!btn) return;
    btn.addEventListener("pointerdown", e => { e.preventDefault(); state.touch[key] = true; });
    btn.addEventListener("pointerup", e => { e.preventDefault(); state.touch[key] = false; });
    btn.addEventListener("pointercancel", e => { e.preventDefault(); state.touch[key] = false; });
}

function init() {
    bindHoldControl(DOM.buttons.moveLeft, "left");
    bindHoldControl(DOM.buttons.moveRight, "right");
    bindHoldControl(DOM.buttons.shoot, "shoot");

    DOM.buttons.start?.addEventListener("click", startNewGame);
    DOM.buttons.nextLevel?.addEventListener("click", () => {
        showScreen("game");
        startLevel(state.level + 1);
    });
    DOM.buttons.playAgain?.addEventListener("click", startNewGame);

    window.addEventListener("resize", resizeCanvas);
    showScreen("start");
    resizeCanvas();
}

window.addEventListener("DOMContentLoaded", init);
