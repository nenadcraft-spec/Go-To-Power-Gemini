"use strict";

/* =========================================================
   WHR: ARENA SURVIVAL v5.6.0
   NO MISS PENALTY + BALANCED SURVIVAL ENGINE
========================================================= */

const DOM = {
    gameApp: document.getElementById("gameApp"),
    screens: {
        start: document.getElementById("startScreen"),
        game: document.getElementById("gameScreen"),
        gameOver: document.getElementById("gameOverScreen")
    },
    buttons: {
        start: document.getElementById("startButton"),
        restart: document.getElementById("restartButton")
    },
    canvas: document.getElementById("gameCanvas"),
    gameStage: document.getElementById("gameStage"),
    hud: {
        score: document.getElementById("scoreValue"),
        lives: document.getElementById("livesValue"),
        timer: document.getElementById("timerValue"),
        level: document.getElementById("levelValue"),
        finalScore: document.getElementById("finalScoreValue")
    }
};

const ctx = DOM.canvas ? DOM.canvas.getContext("2d") : null;

class AudioEngine {
    constructor() { this.ctx = null; }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }
    playHit() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
    playVoidJackpot() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.35);
    }
    playMiss() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
    }
    playPortal() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    }
}

const audio = new AudioEngine();

const GAME_CONFIG = {
    laserSpeed: 800,
    baseGravity: 420,
    maxSpeedCap: 2.0
};

const ORB_TYPES = { large: { radius: 38, bounce: 650 } };

const RABBIT_THEMES = [
    { id: "white", name: "White Hacker", main: "#00f5ff", eye: "#32ff9b" },
    { id: "black", name: "Black Hacker", main: "#ff2fcf", eye: "#ff315d" },
    { id: "blue", name: "Blue Freeze", main: "#00a2ff", eye: "#ffffff" },
    { id: "gold", name: "Golden Rabbit", main: "#ffe45c", eye: "#ff9100" },
    { id: "red", name: "Red Cyber", main: "#ff315d", eye: "#ffe45c" },
    { id: "green", name: "Green Guardian", main: "#32ff9b", eye: "#00f5ff" },
    { id: "void", name: "Void Crown", main: "#9c4dff", eye: "#ff2fcf" }
];

const state = {
    running: false,
    rafId: null,
    lastTimestamp: 0,
    width: 600,
    height: 800,
    score: 0,
    lives: 3,
    timeLeft: 45.0,
    level: 1,
    mouse: { x: -100, y: -100, active: false },
    vfxLasers: [],
    orbs: [],
    blackHoles: [],
    holeAngle: 0,
    globalFreezeTimer: 0,
    baseSpeedMultiplier: 1.0,
    slowMotionTimer: 0,
    pendingRespawns: []
};

function resizeCanvas() {
    if (!DOM.canvas || !DOM.gameStage) return;
    const rect = DOM.gameStage.getBoundingClientRect();
    DOM.canvas.width = Math.floor(rect.width);
    DOM.canvas.height = Math.floor(rect.height);
    state.width = DOM.canvas.width;
    state.height = DOM.canvas.height;

    const radius = Math.max(22, Math.min(state.width, state.height) * 0.065);
    const offset = radius + 4;

    state.blackHoles = [
        { id: 0, x: offset, y: offset, radius: radius, dirX: 1, dirY: 1 },
        { id: 1, x: state.width - offset, y: offset, radius: radius, dirX: -1, dirY: 1 },
        { id: 2, x: offset, y: state.height - offset, radius: radius, dirX: 1, dirY: -1 },
        { id: 3, x: state.width - offset, y: state.height - offset, radius: radius, dirX: -1, dirY: -1 }
    ];
}

function startNewGame() {
    audio.init();
    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    showScreen("game");
    window.requestAnimationFrame(() => {
        resizeCanvas();
        state.score = 0;
        state.lives = 3;
        state.timeLeft = 45.0;
        state.level = 1;
        state.globalFreezeTimer = 0;
        state.baseSpeedMultiplier = 1.0;
        state.slowMotionTimer = 0;
        state.vfxLasers = []; state.orbs = []; state.pendingRespawns = [];

        for (let i = 0; i < 7; i++) {
            const theme = RABBIT_THEMES[i];
            state.orbs.push(createRabbitObject(theme, (state.width / 8) * (i + 1), 60 + Math.random() * (state.height * 0.3)));
        }

        updateHUD();
        state.running = true;
        state.lastTimestamp = performance.now();
        state.rafId = window.requestAnimationFrame(gameLoop);
    });
}

function createRabbitObject(theme, x, y) {
    return {
        x: x, y: y,
        radius: ORB_TYPES.large.radius,
        velocityX: (Math.random() > 0.5 ? 1 : -1) * 110,
        velocityY: -40,
        theme: theme,
        inHole: false,
        holeTimer: 0,
        powerGlow: 0,
        voidStateTimer: 3.5,
        isPhantom: false
    };
}

function gameLoop(timestamp) {
    if (!state.running) return;
    const delta = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;

    updateGame(delta);
    renderGame();

    if (state.running) {
        state.rafId = window.requestAnimationFrame(gameLoop);
    }
}

function updateGame(delta) {
    state.holeAngle += delta * 4;

    state.timeLeft -= delta;
    if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        triggerGameOver();
        return;
    }

    if (state.globalFreezeTimer > 0) {
        state.globalFreezeTimer -= delta;
        if (state.globalFreezeTimer < 0) state.globalFreezeTimer = 0;
    }

    if (state.slowMotionTimer > 0) {
        state.slowMotionTimer -= delta;
        if (state.slowMotionTimer < 0) state.slowMotionTimer = 0;
    }

    for (let rIdx = state.pendingRespawns.length - 1; rIdx >= 0; rIdx--) {
        const item = state.pendingRespawns[rIdx];
        item.delay -= delta;
        if (item.delay <= 0) {
            const exitHole = state.blackHoles[Math.floor(Math.random() * state.blackHoles.length)];
            const newOrb = createRabbitObject(item.theme, exitHole.x, exitHole.y);
            const speed = 480;
            const rad39 = 39 * (Math.PI / 180);

            newOrb.velocityX = exitHole.dirX * speed * Math.cos(rad39);
            newOrb.velocityY = exitHole.dirY * speed * Math.sin(rad39);

            state.orbs.push(newOrb);
            state.pendingRespawns.splice(rIdx, 1);
            audio.playPortal();
        }
    }

    // VFX LASERI
    for (let i = state.vfxLasers.length - 1; i >= 0; i--) {
        const laser = state.vfxLasers[i];
        laser.life -= delta;
        laser.headX += laser.vx * delta;
        laser.headY += laser.vy * delta;

        laser.tailX = laser.headX - (laser.vx / GAME_CONFIG.laserSpeed) * 35;
        laser.tailY = laser.headY - (laser.vy / GAME_CONFIG.laserSpeed) * 35;

        if (laser.life <= 0) state.vfxLasers.splice(i, 1);
    }

    // FIZIKA SUDARA ZEČEVA
    for (let i = 0; i < state.orbs.length; i++) {
        for (let j = i + 1; j < state.orbs.length; j++) {
            const o1 = state.orbs[i];
            const o2 = state.orbs[j];
            if (o1.inHole || o2.inHole) continue;

            const dist = Math.hypot(o2.x - o1.x, o2.y - o1.y);
            const minDist = o1.radius + o2.radius;

            if (dist < minDist) {
                if (o1.theme.id === "void" || o2.theme.id === "void") {
                    const other = o1.theme.id === "void" ? o2 : o1;
                    if (other.theme.id !== "black" && other.theme.id !== "white") {
                        continue;
                    }
                }

                const angle = Math.atan2(o2.y - o1.y, o2.x - o1.x);
                const overlap = minDist - dist;

                if (o1.theme.id === "white") {
                    o2.x += Math.cos(angle) * overlap;
                    o2.y += Math.sin(angle) * overlap;
                    o2.velocityX = Math.cos(angle) * 350;
                    o2.velocityY = Math.sin(angle) * 350;
                } else if (o2.theme.id === "white") {
                    o1.x -= Math.cos(angle) * overlap;
                    o1.y -= Math.sin(angle) * overlap;
                    o1.velocityX = -Math.cos(angle) * 350;
                    o1.velocityY = -Math.sin(angle) * 350;
                } else {
                    o1.x -= Math.cos(angle) * (overlap / 2);
                    o1.y -= Math.sin(angle) * (overlap / 2);
                    o2.x += Math.cos(angle) * (overlap / 2);
                    o2.y += Math.sin(angle) * (overlap / 2);

                    const tempVx = o1.velocityX;
                    const tempVy = o1.velocityY;
                    o1.velocityX = o2.velocityX;
                    o1.velocityY = o2.velocityY;
                    o2.velocityX = tempVx;
                    o2.velocityY = tempVy;
                }
            }
        }
    }

    for (let oIdx = state.orbs.length - 1; oIdx >= 0; oIdx--) {
        const orb = state.orbs[oIdx];

        if (orb.powerGlow > 0) {
            orb.powerGlow -= delta * 2;
            if (orb.powerGlow < 0) orb.powerGlow = 0;
        }

        if (orb.theme.id === "void") {
            orb.voidStateTimer -= delta;
            if (orb.voidStateTimer <= 0) {
                orb.isPhantom = !orb.isPhantom;
                orb.voidStateTimer = orb.isPhantom ? 2.5 : 3.5;
            }

            if (!orb.inHole) {
                state.orbs.forEach(other => {
                    if (other !== orb && !other.inHole) {
                        const d = Math.hypot(orb.x - other.x, orb.y - other.y);
                        if (d > 10 && d < 220) {
                            const pullForce = (220 - d) * 1.5;
                            const angle = Math.atan2(orb.y - other.y, orb.x - other.x);
                            other.velocityX += Math.cos(angle) * pullForce * delta;
                            other.velocityY += Math.sin(angle) * pullForce * delta;
                        }
                    }
                });
            }
        }

        if (orb.inHole) {
            orb.holeTimer -= delta;
            if (orb.holeTimer <= 0) {
                orb.inHole = false;
                const otherHoles = state.blackHoles.filter(h => h.id !== orb.entryHoleId);
                const exitHole = otherHoles[Math.floor(Math.random() * otherHoles.length)];
                const speed = 380;
                const rad39 = 39 * (Math.PI / 180);

                orb.x = exitHole.x + exitHole.dirX * (orb.radius + 6);
                orb.y = exitHole.y + exitHole.dirY * (orb.radius + 6);
                orb.velocityX = exitHole.dirX * speed * Math.cos(rad39);
                orb.velocityY = exitHole.dirY * speed * Math.sin(rad39);
                audio.playPortal();
            }
            continue;
        }

        if (state.globalFreezeTimer > 0) continue;

        let currentGravity = Math.min(1000, GAME_CONFIG.baseGravity + (state.level - 1) * 25);
        let effectiveSpeedMult = state.baseSpeedMultiplier * (state.slowMotionTimer > 0 ? 0.5 : 1.0);

        orb.velocityY += currentGravity * delta;
        orb.x += orb.velocityX * effectiveSpeedMult * delta;
        orb.y += orb.velocityY * effectiveSpeedMult * delta;

        state.blackHoles.forEach(bh => {
            if (orb.theme.id === "void") return;

            const dist = Math.hypot(orb.x - bh.x, orb.y - bh.y);
            if (dist < bh.radius) {
                orb.inHole = true;
                orb.entryHoleId = bh.id;
                orb.holeTimer = 1.0;
                orb.x = bh.x;
                orb.y = bh.y;
                audio.playPortal();
            }
        });

        if (orb.x - orb.radius < 0) { orb.x = orb.radius; orb.velocityX *= -1; }
        else if (orb.x + orb.radius > state.width) { orb.x = state.width - orb.radius; orb.velocityX *= -1; }

        if (orb.y - orb.radius < 0) { orb.y = orb.radius; orb.velocityY = Math.abs(orb.velocityY) * 0.85; }
        if (orb.y + orb.radius > state.height - 2) {
            orb.y = state.height - 2 - orb.radius;
            orb.velocityY = -ORB_TYPES.large.bounce;
        }
    }

    updateHUD();
}

function handleTargetInteraction(clientX, clientY) {
    if (!state.running || !DOM.canvas) return;
    const rect = DOM.canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    for (let oIdx = state.orbs.length - 1; oIdx >= 0; oIdx--) {
        const orb = state.orbs[oIdx];
        if (orb.inHole) continue;

        const dist = Math.hypot(orb.x - clickX, orb.y - clickY);

        if (dist <= orb.radius + 14) {
            
            // 💜 PHANTOM VOID: KAZNA!
            if (orb.theme.id === "void" && orb.isPhantom) {
                audio.playMiss();
                state.lives--;
                state.timeLeft = Math.max(0, state.timeLeft - 1.5);
                if (state.lives <= 0) {
                    state.lives = 0;
                    triggerGameOver();
                }
                break;
            }

            // 👑 VIDLJIVI VOID: NAGRADA!
            if (orb.theme.id === "void") {
                audio.playVoidJackpot();
                const angle = Math.atan2(orb.y - clickY, orb.x - clickX);
                orb.velocityX = Math.cos(angle) * 550;
                orb.velocityY = Math.sin(angle) * 550;
                orb.powerGlow = 1.0;

                state.score += 300;
                state.timeLeft += 2.5; // Balansirana nagrada
                if (state.lives < 3) state.lives++;
                state.slowMotionTimer = 1.2;
            } 
            // 🐰 SUPPORT ZEČEVI
            else {
                audio.playHit();
                state.score += 50;
                state.timeLeft += 0.2; // Strožiji survival balans (+0.2s umesto +0.5s)

                triggerRabbitPower(orb, oIdx);

                state.orbs.splice(oIdx, 1);
                state.pendingRespawns.push({ theme: orb.theme, delay: 2.0 });
            }

            const nextLevel = Math.floor(state.score / 1000) + 1;
            if (nextLevel > state.level) {
                state.level = nextLevel;
                state.baseSpeedMultiplier = Math.min(GAME_CONFIG.maxSpeedCap, state.baseSpeedMultiplier + 0.04);
            }

            break;
        }
    }

    updateHUD();
}

function triggerRabbitPower(orb, orbIndex) {
    switch (orb.theme.id) {
        case "white":
            state.orbs.forEach(other => {
                if (!other.inHole) {
                    const d = Math.hypot(other.x - orb.x, other.y - orb.y);
                    if (d < 220) {
                        other.velocityX += (other.x - orb.x) * 3.8;
                        other.velocityY += (other.y - orb.y) * 3.8;
                    }
                }
            });
            break;

        case "black":
            // ⬛ CRNI HAKER: TELEPORT & SHOCKWAVE (NEMA VIŠE BRKNOUT POWER)
            orb.x = 40 + Math.random() * (state.width - 80);
            orb.y = 40 + Math.random() * (state.height * 0.4);
            orb.velocityX = (Math.random() > 0.5 ? 1 : -1) * 300;
            orb.velocityY = -100;
            state.orbs.forEach(other => {
                if (other !== orb && !other.inHole) {
                    other.velocityX *= 1.3;
                    other.velocityY *= 1.3;
                }
            });
            break;

        case "blue":
            state.globalFreezeTimer = 0.8;
            break;

        case "gold":
            spawnGoldenRazorVfx(orb.x, orb.y, orb.radius);
            break;

        case "red":
            state.orbs.forEach(other => {
                if (!other.inHole) {
                    const d = Math.hypot(other.x - orb.x, other.y - orb.y);
                    if (d < 250) {
                        other.velocityX = (other.x - orb.x) * 7.0;
                        other.velocityY = (other.y - orb.y) * 7.0;
                    }
                }
            });
            break;

        case "green":
            state.slowMotionTimer = 1.5;
            break;
    }
}

function spawnGoldenRazorVfx(x, y, radius) {
    const angles = [Math.PI / 2.5, -Math.PI / 2.5];
    const offset = radius + 15;

    angles.forEach(ang => {
        const vx = Math.sin(ang) * (GAME_CONFIG.laserSpeed * 1.2);
        const vy = -Math.cos(ang) * (GAME_CONFIG.laserSpeed * 1.2);

        const startX = x + Math.sin(ang) * offset;
        const startY = y - Math.cos(ang) * offset;

        state.vfxLasers.push({
            headX: startX, headY: startY, tailX: startX, tailY: startY,
            vx: vx, vy: vy, life: 0.6
        });
    });
}

function triggerGameOver() {
    state.running = false;
    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }
    if (DOM.hud.finalScore) DOM.hud.finalScore.textContent = String(state.score);
    showScreen("gameOver");
}

function renderGame() {
    if (!ctx) return;
    ctx.fillStyle = "#020205";
    ctx.fillRect(0, 0, state.width, state.height);

    state.blackHoles.forEach(bh => {
        ctx.save();
        ctx.translate(bh.x, bh.y);
        ctx.rotate(state.holeAngle);
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#9c4dff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.restore();
    });

    // RENDER VFX LASERA
    state.vfxLasers.forEach(laser => {
        ctx.save();
        ctx.strokeStyle = "#ffe45c";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(laser.tailX, laser.tailY);
        ctx.lineTo(laser.headX, laser.headY);
        ctx.stroke();
        ctx.restore();
    });

    state.orbs.forEach(o => {
        if (o.inHole) return;
        const theme = o.theme || RABBIT_THEMES[0];
        const r = o.radius;

        ctx.save();
        ctx.translate(o.x, o.y);

        if (o.theme.id === "void") {
            ctx.beginPath();
            ctx.arc(0, 0, r + 20, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(156, 77, 255, 0.4)";
            ctx.lineWidth = 3;
            ctx.stroke();

            if (o.isPhantom) {
                ctx.globalAlpha = 0.25;
            }
        }

        if (o.powerGlow > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
            ctx.fillStyle = theme.main;
            ctx.globalAlpha = o.powerGlow * 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = theme.main;
        ctx.stroke();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = theme.main;
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.6, r * 0.18, r * 0.4, -0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.6, r * 0.18, r * 0.4, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = theme.eye;
        ctx.fillRect(-r * 0.4, -r * 0.1, r * 0.8, r * 0.22);
        ctx.restore();
    });

    if (state.mouse.active) {
        ctx.save();
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.mouse.x, state.mouse.y, 16, 0, Math.PI * 2);
        ctx.moveTo(state.mouse.x - 22, state.mouse.y);
        ctx.lineTo(state.mouse.x + 22, state.mouse.y);
        ctx.moveTo(state.mouse.x, state.mouse.y - 22);
        ctx.lineTo(state.mouse.x, state.mouse.y + 22);
        ctx.stroke();
        ctx.restore();
    }
}

function updateHUD() {
    if (DOM.hud.score) DOM.hud.score.textContent = String(state.score).padStart(6, "0");
    if (DOM.hud.lives) DOM.hud.lives.textContent = "❤️".repeat(state.lives);
    if (DOM.hud.timer) DOM.hud.timer.textContent = state.timeLeft.toFixed(1) + "s";
    if (DOM.hud.level) DOM.hud.level.textContent = "LVL " + state.level;
}

function showScreen(name) {
    Object.keys(DOM.screens).forEach(k => {
        if (DOM.screens[k]) {
            if (k === name) DOM.screens[k].classList.add("screen--active");
            else DOM.screens[k].classList.remove("screen--active");
        }
    });
}

function initEvents() {
    if (!DOM.canvas) return;

    DOM.canvas.addEventListener("touchstart", e => {
        e.preventDefault();
        audio.init();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            handleTargetInteraction(touch.clientX, touch.clientY);
        }
    }, { passive: false });

    DOM.canvas.addEventListener("mousemove", e => {
        const rect = DOM.canvas.getBoundingClientRect();
        state.mouse.x = e.clientX - rect.left;
        state.mouse.y = e.clientY - rect.top;
        state.mouse.active = true;
    });

    DOM.canvas.addEventListener("mouseleave", () => {
        state.mouse.active = false;
    });

    DOM.canvas.addEventListener("mousedown", e => {
        if (e.button === 0) {
            audio.init();
            handleTargetInteraction(e.clientX, e.clientY);
        }
    });

    DOM.buttons.start?.addEventListener("click", startNewGame);
    DOM.buttons.restart?.addEventListener("click", startNewGame);
    window.addEventListener("resize", resizeCanvas);
}

function init() {
    initEvents();
    showScreen("start");
    resizeCanvas();
}

window.addEventListener("DOMContentLoaded", init);
