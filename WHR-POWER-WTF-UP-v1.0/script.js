"use strict";

/* =========================================================
   WHR: POWER WTF UP v1.3.1
   CONTROL DECK & PANG CANVAS OFFSET ENGINE
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
    playerWidth: 50,
    playerHeight: 24,
    playerSpeed: 500,
    cableSpeed: 1200,
    gravity: 780,
    shootDelay: 350
};

const ORB_TYPES = {
    large: { radius: 42, speedX: 150, bounce: 650, score: 100, next: "medium" },
    medium: { radius: 26, speedX: 190, bounce: 530, score: 180, next: "small" },
    small: { radius: 15, speedX: 240, bounce: 430, score: 300, next: null }
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
    cables: [],
    orbs: []
};

/* JOYSTICK ENGINE WITH EXTENDED RANGE */
const joystick = {
    zone: document.getElementById("joystickZone"),
    base: document.getElementById("joystickBase"),
    stick: document.getElementById("joystickStick"),
    active: false,
    touchId: null,
    startX: 0,
    maxRadius: 50 // Povećan opseg za lakše i preciznije klizanje
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

        if (intensity < -0.12) {
            state.touch.left = true;
            state.touch.right = false;
        } else if (intensity > 0.12) {
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
    state.combo = 1;
    state.maxCombo = 1;
    state.cables = [];
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
    state.cables = [];
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
            y: 60 + Math.random() * 80,
            radius: ORB_TYPES.large.radius,
            type: "large",
            velocityX: ORB_TYPES.large.speedX * (i % 2 === 0 ? 1 : -1),
            velocityY: -ORB_TYPES.large.bounce * 0.3,
            hue: 180 + Math.random() * 60
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

    for (let i = state.cables.length - 1; i >= 0; i--) {
        const cable = state.cables[i];
        cable.height += GAME_CONFIG.cableSpeed * delta;

        if (cable.height >= state.height) {
            state.cables.splice(i, 1);
        }
    }

    state.orbs.forEach(orb => {
        orb.velocityY += GAME_CONFIG.gravity * delta;
        orb.x += orb.velocityX * delta;
        orb.y += orb.velocityY * delta;

        if (orb.x - orb.radius < 0 || orb.x + orb.radius > state.width) {
            orb.velocityX *= -1;
        }
        if (orb.y + orb.radius > state.height - 4) {
            orb.y = state.height - 4 - orb.radius;
            orb.velocityY = -ORB_TYPES[orb.type].bounce;
        }
    });

    for (let cIdx = state.cables.length - 1; cIdx >= 0; cIdx--) {
        const cable = state.cables[cIdx];
        const cableX = cable.x;
        const cableTopY = state.height - cable.height;

        for (let oIdx = state.orbs.length - 1; oIdx >= 0; oIdx--) {
            const orb = state.orbs[oIdx];

            const closestY = Math.max(cableTopY, Math.min(state.height, orb.y));
            const distX = orb.x - cableX;
            const distY = orb.y - closestY;
            const distance = Math.hypot(distX, distY);

            if (distance < orb.radius + 3) {
                state.cables.splice(cIdx, 1);
                destroyOrb(oIdx, orb);
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
            x: orb.x - 10, y: orb.y, radius: cfg.radius, type: next,
            velocityX: -cfg.speedX, velocityY: -cfg.bounce * 0.6, hue: orb.hue + 20
        });
        state.orbs.push({
            x: orb.x + 10, y: orb.y, radius: cfg.radius, type: next,
            velocityX: cfg.speedX, velocityY: -cfg.bounce * 0.6, hue: orb.hue + 20
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

function renderGame() {
    ctx.clearRect(0, 0, state.width, state.height);

    // Render Pang Cables
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
        ctx.moveTo(cable.x - 6, topY + 8);
        ctx.lineTo(cable.x + 6, topY + 8);
        ctx.lineTo(cable.x, topY - 4);
        ctx.closePath();
        ctx.fill();
    });

    // Render Orbs
    state.orbs.forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${o.hue}, 90%, 60%)`;
        ctx.shadowColor = `hsl(${o.hue}, 90%, 60%)`;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
    });

    // Render Player
    if (state.player) {
        ctx.shadowColor = "#ff2fcf";
        ctx.shadowBlur = 10;
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
