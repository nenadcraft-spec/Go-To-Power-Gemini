"use strict";

/* =========================================================
   WHR: POWER WTF UP v3.1.0
   DART BULLET VISUAL & PHYSICS ENGINE (2s Cooldown, +20% Speed)
========================================================= */

const DOM = {
    gameApp: document.getElementById("gameApp"),
    screens: {
        start: document.getElementById("startScreen"),
        game: document.getElementById("gameScreen")
    },
    buttons: {
        start: document.getElementById("startButton"),
        shoot: document.getElementById("shootButton")
    },
    canvas: document.getElementById("gameCanvas"),
    gameStage: document.getElementById("gameStage"),
    hud: {
        score: document.getElementById("scoreValue")
    }
};

const ctx = DOM.canvas.getContext("2d");

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
        osc.frequency.setValueAtTime(900, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
    }
    playBounce() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(350, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
    playPower() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.25);
    }
    playPortal() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
    }
}

const audio = new AudioEngine();

// NOVA PODEŠAVANJA ZA METAK (BRZINA 900, COOLDOWN 2s, KRAĆA DUŽINA PIKADO STRELICE 32px)
const GAME_CONFIG = {
    playerWidth: 40,
    playerHeight: 18,
    aimSpeed: 1.8,
    laserSpeed: 900,        // Povećano za 20% (sa 750 na 900)
    laserLength: 32,        // Smanjeno na veličinu pikado strelice!
    laserDuration: 5.0,     // Metak traje 5 sekundi
    shootCooldown: 2.0,     // Cooldown smanjen na 2 sekunde
    gravity: 580
};

const ORB_TYPES = { large: { radius: 26, bounce: 820 } };

const RABBIT_THEMES = [
    { id: "white", name: "White Hacker", main: "#00f5ff", eye: "#32ff9b" },
    { id: "black", name: "Black Hacker", main: "#ff2fcf", eye: "#ff315d" },
    { id: "blue", name: "Blue Freeze", main: "#00a2ff", eye: "#ffffff" },
    { id: "gold", name: "Golden Rabbit", main: "#ffe45c", eye: "#ff9100" },
    { id: "red", name: "Red Cyber", main: "#ff315d", eye: "#ffe45c" },
    { id: "green", name: "Green Guardian", main: "#32ff9b", eye: "#00f5ff" },
    { id: "void", name: "Void Shadow", main: "#9c4dff", eye: "#ff2fcf" }
];

const state = {
    running: false,
    paused: false,
    lastTimestamp: 0,
    width: 600,
    height: 800,
    score: 0,
    cooldownTimer: 0,
    aimAngle: 0,
    keys: { left: false, right: false, shoot: false },
    touch: { left: false, right: false, shoot: false },
    player: null,
    lasers: [],
    orbs: [],
    blackHoles: [],
    holeAngle: 0,
    globalFreezeTimer: 0,
    globalSpeedMultiplier: 1.0,
    pendingRespawns: []
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
        e.preventDefault(); audio.init();
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
                if (e.changedTouches[i].identifier === joystick.touchId) { touch = e.changedTouches[i]; break; }
            }
        } else touch = e;
        if (!touch) return;
        let deltaX = touch.clientX - joystick.startX;
        deltaX = Math.max(-joystick.maxRadius, Math.min(joystick.maxRadius, deltaX));
        joystick.stick.style.transform = `translateX(${deltaX}px)`;
        state.aimAngle = (deltaX / joystick.maxRadius) * (Math.PI / 2.6);
    }

    function handleEnd() {
        if (!joystick.active) return;
        joystick.active = false; joystick.touchId = null;
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
    DOM.canvas.width = Math.floor(rect.width);
    DOM.canvas.height = Math.floor(rect.height);
    state.width = DOM.canvas.width;
    state.height = DOM.canvas.height;

    const radius = Math.max(18, Math.min(state.width, state.height) * 0.055);
    const offset = radius + 4;

    state.blackHoles = [
        { id: 0, x: offset, y: offset, radius: radius, dirX: 1, dirY: 1 },
        { id: 1, x: state.width - offset, y: offset, radius: radius, dirX: -1, dirY: 1 },
        { id: 2, x: offset, y: state.height - offset, radius: radius, dirX: 1, dirY: -1 },
        { id: 3, x: state.width - offset, y: state.height - offset, radius: radius, dirX: -1, dirY: -1 }
    ];

    state.player = {
        x: state.width / 2 - GAME_CONFIG.playerWidth / 2,
        y: state.height - GAME_CONFIG.playerHeight - 2,
        width: GAME_CONFIG.playerWidth,
        height: GAME_CONFIG.playerHeight
    };
}

function startNewGame() {
    audio.init();
    showScreen("game");
    window.requestAnimationFrame(() => {
        resizeCanvas();
        state.score = 0; state.aimAngle = 0; state.cooldownTimer = 0;
        state.globalFreezeTimer = 0; state.globalSpeedMultiplier = 1.0;
        state.lasers = []; state.orbs = []; state.pendingRespawns = [];

        for (let i = 0; i < 7; i++) {
            const theme = RABBIT_THEMES[i];
            state.orbs.push(createRabbitObject(theme, (state.width / 8) * (i + 1), 50 + Math.random() * (state.height * 0.2)));
        }

        updateHUD();
        state.running = true;
        state.lastTimestamp = performance.now();
        window.requestAnimationFrame(gameLoop);
    });
}

function createRabbitObject(theme, x, y) {
    return {
        x: x, y: y,
        radius: ORB_TYPES.large.radius,
        velocityX: (Math.random() > 0.5 ? 1 : -1) * 150,
        velocityY: -50,
        theme: theme,
        inHole: false,
        holeTimer: 0,
        powerGlow: 0,
        goldCooldown: 0,
        voidStateTimer: 5.0,
        isVoidSlow: false,
        isVoidTurbo: false
    };
}

function gameLoop(timestamp) {
    if (!state.running) return;
    const delta = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;

    if (!state.paused) updateGame(delta);
    renderGame();
    window.requestAnimationFrame(gameLoop);
}

function updateGame(delta) {
    state.holeAngle += delta * 4;

    if (state.cooldownTimer > 0) {
        state.cooldownTimer -= delta;
        if (state.cooldownTimer < 0) state.cooldownTimer = 0;
    }

    if (state.globalFreezeTimer > 0) {
        state.globalFreezeTimer -= delta;
        if (state.globalFreezeTimer < 0) state.globalFreezeTimer = 0;
    }

    for (let rIdx = state.pendingRespawns.length - 1; rIdx >= 0; rIdx--) {
        const item = state.pendingRespawns[rIdx];
        item.delay -= delta;
        if (item.delay <= 0) {
            const exitHole = state.blackHoles[Math.floor(Math.random() * state.blackHoles.length)];
            const newOrb = createRabbitObject(item.theme, exitHole.x, exitHole.y);
            const speed = 520;
            const rad39 = 39 * (Math.PI / 180);

            newOrb.velocityX = exitHole.dirX * speed * Math.cos(rad39);
            newOrb.velocityY = exitHole.dirY * speed * Math.sin(rad39);

            state.orbs.push(newOrb);
            state.pendingRespawns.splice(rIdx, 1);
            audio.playBounce();
        }
    }

    if (state.keys.left) state.aimAngle = Math.max(-Math.PI / 2.6, state.aimAngle - GAME_CONFIG.aimSpeed * delta);
    if (state.keys.right) state.aimAngle = Math.min(Math.PI / 2.6, state.aimAngle + GAME_CONFIG.aimSpeed * delta);

    if ((state.keys.shoot || state.touch.shoot) && state.cooldownTimer === 0) tryShoot();

    // UPDATE METAKA / PIKADO STRELICA
    for (let i = state.lasers.length - 1; i >= 0; i--) {
        const laser = state.lasers[i];
        laser.life -= delta;
        laser.headX += laser.vx * delta;
        laser.headY += laser.vy * delta;

        // Održavanje dužine tela strelice na tačno GAME_CONFIG.laserLength (32px)
        laser.tailX = laser.headX - (laser.vx / GAME_CONFIG.laserSpeed) * GAME_CONFIG.laserLength;
        laser.tailY = laser.headY - (laser.vy / GAME_CONFIG.laserSpeed) * GAME_CONFIG.laserLength;

        if (laser.headX <= 0) { laser.headX = 0; laser.vx = Math.abs(laser.vx); }
        else if (laser.headX >= state.width) { laser.headX = state.width; laser.vx = -Math.abs(laser.vx); }

        if (laser.headY <= 0) { laser.headY = 0; laser.vy = Math.abs(laser.vy); }
        else if (laser.headY >= state.height) { laser.headY = state.height; laser.vy = -Math.abs(laser.vy); }

        if (laser.life <= 0) state.lasers.splice(i, 1);
    }

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
                    o2.velocityX = Math.cos(angle) * 400;
                    o2.velocityY = Math.sin(angle) * 400;
                } else if (o2.theme.id === "white") {
                    o1.x -= Math.cos(angle) * overlap;
                    o1.y -= Math.sin(angle) * overlap;
                    o1.velocityX = -Math.cos(angle) * 400;
                    o1.velocityY = -Math.sin(angle) * 400;
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

        if (orb.goldCooldown > 0) {
            orb.goldCooldown -= delta;
            if (orb.goldCooldown < 0) orb.goldCooldown = 0;
        }

        if (orb.theme.id === "void") {
            orb.voidStateTimer -= delta;
            if (orb.voidStateTimer <= 0) {
                if (!orb.isVoidSlow && !orb.isVoidTurbo) {
                    orb.isVoidSlow = true;
                    orb.voidStateTimer = 3.0;
                } else if (orb.isVoidSlow) {
                    orb.isVoidSlow = false;
                    orb.isVoidTurbo = true;
                    orb.voidStateTimer = 2.5;
                    orb.velocityX *= 1.9;
                    orb.velocityY *= 1.9;
                } else {
                    orb.isVoidTurbo = false;
                    orb.voidStateTimer = 5.0;
                }
            }
        }

        if (orb.inHole) {
            orb.holeTimer -= delta;
            if (orb.holeTimer <= 0) {
                orb.inHole = false;
                const otherHoles = state.blackHoles.filter(h => h.id !== orb.entryHoleId);
                const exitHole = otherHoles[Math.floor(Math.random() * otherHoles.length)];
                const speed = 480;
                const rad39 = 39 * (Math.PI / 180);

                orb.x = exitHole.x + exitHole.dirX * (orb.radius + 6);
                orb.y = exitHole.y + exitHole.dirY * (orb.radius + 6);
                orb.velocityX = exitHole.dirX * speed * Math.cos(rad39);
                orb.velocityY = exitHole.dirY * speed * Math.sin(rad39);
                audio.playBounce();
            }
            continue;
        }

        if (state.globalFreezeTimer > 0) continue;

        let currentGravity = GAME_CONFIG.gravity;
        let speedMult = state.globalSpeedMultiplier;

        if (orb.theme.id === "void" && orb.isVoidSlow) speedMult *= 0.3;

        orb.velocityY += currentGravity * delta;
        orb.x += orb.velocityX * speedMult * delta;
        orb.y += orb.velocityY * speedMult * delta;

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

    state.lasers.forEach(laser => {
        state.orbs.forEach((orb, oIdx) => {
            if (orb.inHole) return;
            const dist = pointToSegmentDistance(orb.x, orb.y, laser.tailX, laser.tailY, laser.headX, laser.headY);

            if (dist < orb.radius + 4) {
                audio.playBounce();
                audio.playPower();

                const lSpeed = Math.hypot(laser.vx, laser.vy);
                const dirX = laser.vx / lSpeed;
                const dirY = laser.vy / lSpeed;
                orb.velocityX = dirX * 680;
                orb.velocityY = dirY * 680;

                triggerRabbitPower(orb, oIdx);

                orb.powerGlow = 1.0;
                state.score += 50;
                updateHUD();
            }
        });
    });
}

function triggerRabbitPower(orb, orbIndex) {
    switch (orb.theme.id) {
        case "white":
            state.orbs.forEach(other => {
                if (other !== orb && !other.inHole) {
                    const d = Math.hypot(other.x - orb.x, other.y - orb.y);
                    if (d < 220) {
                        other.velocityX += (other.x - orb.x) * 4.0;
                        other.velocityY += (other.y - orb.y) * 4.0;
                    }
                }
            });
            break;

        case "black":
            orb.x = 40 + Math.random() * (state.width - 80);
            orb.y = 40 + Math.random() * (state.height * 0.4);
            orb.velocityX = (Math.random() > 0.5 ? 1 : -1) * 350;
            orb.velocityY = -150;
            break;

        case "blue":
            state.globalFreezeTimer = 3.0;
            break;

        case "gold":
            if (!orb.goldCooldown || orb.goldCooldown <= 0) {
                orb.goldCooldown = 2.0;
                spawnSplitLasers(orb.x, orb.y, orb.radius);
            }
            break;

        case "red":
            state.orbs.forEach(other => {
                if (other !== orb && !other.inHole) {
                    const d = Math.hypot(other.x - orb.x, other.y - orb.y);
                    if (d < 250) {
                        other.velocityX = (other.x - orb.x) * 5.0;
                        other.velocityY = (other.y - orb.y) * 5.0;
                    }
                }
            });
            state.orbs.splice(orbIndex, 1);
            state.pendingRespawns.push({ theme: orb.theme, delay: 3.0 });
            break;

        case "green":
            state.globalSpeedMultiplier = 0.2;
            state.orbs.splice(orbIndex, 1);
            state.pendingRespawns.push({ theme: orb.theme, delay: 2.5 });
            setTimeout(() => { state.globalSpeedMultiplier = 1.1; }, 2500);
            break;

        case "void":
            orb.isVoidTurbo = true;
            orb.velocityX *= 1.8;
            orb.velocityY *= 1.8;
            break;
    }
}

function spawnSplitLasers(x, y, radius) {
    const angles = [Math.PI / 3, -Math.PI / 3];
    const offset = radius + 15;

    angles.forEach(ang => {
        const vx = Math.sin(ang) * GAME_CONFIG.laserSpeed;
        const vy = -Math.cos(ang) * GAME_CONFIG.laserSpeed;

        const startX = x + Math.sin(ang) * offset;
        const startY = y - Math.cos(ang) * offset;

        state.lasers.push({
            headX: startX, headY: startY, tailX: startX, tailY: startY,
            vx: vx, vy: vy, life: 2.0
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

function tryShoot() {
    if (state.cooldownTimer > 0) return;
    audio.playShoot();
    state.cooldownTimer = GAME_CONFIG.shootCooldown;
    const startX = state.player.x + state.player.width / 2;
    const startY = state.player.y;
    const vx = Math.sin(state.aimAngle) * GAME_CONFIG.laserSpeed;
    const vy = -Math.cos(state.aimAngle) * GAME_CONFIG.laserSpeed;

    state.lasers.push({
        headX: startX, headY: startY, tailX: startX, tailY: startY,
        vx: vx, vy: vy, life: GAME_CONFIG.laserDuration
    });
}

function renderGame() {
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

    if (state.player && state.cooldownTimer === 0) {
        const startX = state.player.x + state.player.width / 2;
        const startY = state.player.y;
        const aimLength = 180;
        const targetX = startX + Math.sin(state.aimAngle) * aimLength;
        const targetY = startY - Math.cos(state.aimAngle) * aimLength;

        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "rgba(0, 245, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.restore();
    }

    // ISCRTAVANJE PIKADO STRELICA METAKA
    state.lasers.forEach(laser => {
        ctx.save();

        const angle = Math.atan2(laser.vy, laser.vx);

        // Telo strelice
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(laser.tailX, laser.tailY);
        ctx.lineTo(laser.headX, laser.headY);
        ctx.stroke();

        // Spicasti vrh pikado strelice (Glava)
        ctx.save();
        ctx.translate(laser.headX, laser.headY);
        ctx.rotate(angle);
        ctx.fillStyle = "#ff2fcf";
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-6, -4);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Perca na zadnjem delu pikado strelice (Rep)
        ctx.save();
        ctx.translate(laser.tailX, laser.tailY);
        ctx.rotate(angle);
        ctx.strokeStyle = "#ff2fcf";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -5);
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, 5);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    });

    state.orbs.forEach(o => {
        if (o.inHole) return;
        const theme = o.theme || RABBIT_THEMES[0];
        const r = o.radius;

        ctx.save();
        ctx.translate(o.x, o.y);

        if (o.powerGlow > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
            ctx.fillStyle = theme.main;
            ctx.globalAlpha = o.powerGlow * 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

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

    if (state.player) {
        ctx.save();
        ctx.translate(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);
        ctx.fillStyle = state.cooldownTimer > 0 ? "rgba(255, 47, 207, 0.4)" : "#ff2fcf";
        ctx.fillRect(-state.player.width / 2, -state.player.height / 2, state.player.width, state.player.height);
        ctx.rotate(state.aimAngle);
        ctx.fillStyle = state.cooldownTimer > 0 ? "#8993ad" : "#00f5ff";
        ctx.fillRect(-3, -16, 6, 16);
        ctx.restore();
    }
}

function updateHUD() {
    if (DOM.hud.score) DOM.hud.score.textContent = String(state.score).padStart(6, "0");
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", resizeCanvas);

    showScreen("start");
    resizeCanvas();
}

window.addEventListener("DOMContentLoaded", init);
