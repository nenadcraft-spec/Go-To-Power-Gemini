"use strict";

/* =========================================================
   WHR: POWER WTF UP v2.7.0
   RABBIT SPECIAL ABILITIES & FAST LASER BULLET (2s COOLDOWN)
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
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
    playBounce() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(350, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
    playAbility() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }
    playPortal() {
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
    playerWidth: 40,
    playerHeight: 18,
    aimSpeed: 1.8,
    laserSpeed: 1100,      // MALI BRZI METAK
    laserLength: 35,        // KRATAK KAO METAK
    laserDuration: 5.0,    // TRAJE 5 SEKUNDI
    shootCooldown: 2.0,    // COOLDOWN SADA 2 SEKUNDE!
    gravity: 580
};

const ORB_TYPES = {
    large: { radius: 26, bounce: 820 }
};

/* SVIH 7 ZEČEVA SA POSEBNIM MOĆIMA */
const RABBIT_THEMES = [
    { id: "white", name: "White Hacker", main: "#00f5ff", eye: "#32ff9b" },
    { id: "black", name: "Black Hacker", main: "#ff2fcf", eye: "#ff315d" },
    { id: "blue", name: "Blue Freeze", main: "#00a2ff", eye: "#ffffff" },
    { id: "gold", name: "Golden Rabbit", main: "#ffe45c", eye: "#ff9100" },
    { id: "red", name: "Red Cyber", main: "#ff315d", eye: "#ffe45c" },
    { id: "green", name: "Green Guardian", main: "#32ff9b", eye: "#00f5ff" },
    { id: "purple", name: "Void Shadow", main: "#9c4dff", eye: "#ff2fcf" }
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
    freezeTimer: 0,
    shieldTimer: 0,
    keys: { left: false, right: false, shoot: false },
    touch: { left: false, right: false, shoot: false },
    player: null,
    lasers: [],
    orbs: [],
    blackHoles: [],
    effects: [],
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
        state.score = 0;
        state.aimAngle = 0;
        state.cooldownTimer = 0;
        state.freezeTimer = 0;
        state.shieldTimer = 0;
        state.lasers = [];
        state.orbs = [];
        state.effects = [];

        for (let i = 0; i < 7; i++) {
            const theme = RABBIT_THEMES[i];
            state.orbs.push({
                x: (state.width / 8) * (i + 1),
                y: 50 + Math.random() * (state.height * 0.2),
                radius: ORB_TYPES.large.radius,
                type: "large",
                velocityX: (i % 2 === 0 ? 1 : -1) * (140 + i * 15),
                velocityY: -50,
                theme: theme,
                inHole: false,
                holeTimer: 0,
                abilityTimer: 0
            });
        }

        updateHUD();
        state.running = true;
        state.lastTimestamp = performance.now();
        window.requestAnimationFrame(gameLoop);
    });
}

function gameLoop(timestamp) {
    if (!state.running) return;

    const delta = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;

    if (!state.paused) {
        updateGame(delta);
    }

    renderGame();
    window.requestAnimationFrame(gameLoop);
}

function triggerRabbitAbility(orb) {
    audio.playAbility();
    orb.abilityTimer = 0.6; // Efekat sijanja

    switch (orb.theme.id) {
        case "white": // Extra poeni
            state.score += 150;
            break;
        case "black": // Instant reset cooldown-a
            state.cooldownTimer = 0;
            break;
        case "blue": // Zamrzava sve ostale zečeve na 2.5s
            state.freezeTimer = 2.5;
            break;
        case "gold": // Lansira zeca brzo + bonus poeni
            orb.velocityX *= 1.8;
            orb.velocityY = -900;
            state.score += 300;
            break;
        case "red": // Shockwave - Odbacuje sve zečeve u okolini
            state.orbs.forEach(other => {
                if (other !== orb) {
                    const dx = other.x - orb.x;
                    const dy = other.y - orb.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 180 && d > 0) {
                        other.velocityX += (dx / d) * 400;
                        other.velocityY += (dy / d) * 400;
                    }
                }
            });
            break;
        case "green": // Stvara privremeni štit na dnu 4 sekunde
            state.shieldTimer = 4.0;
            break;
        case "purple": // Teleportuje zeca u nasumičnu rupu
            const randomHole = state.blackHoles[Math.floor(Math.random() * state.blackHoles.length)];
            orb.x = randomHole.x;
            orb.y = randomHole.y;
            orb.inHole = true;
            orb.holeTimer = 0.3;
            break;
    }
    updateHUD();
}

function updateGame(delta) {
    state.holeAngle += delta * 4;

    if (state.cooldownTimer > 0) {
        state.cooldownTimer -= delta;
        if (state.cooldownTimer < 0) state.cooldownTimer = 0;
    }

    if (state.freezeTimer > 0) {
        state.freezeTimer -= delta;
        if (state.freezeTimer < 0) state.freezeTimer = 0;
    }

    if (state.shieldTimer > 0) {
        state.shieldTimer -= delta;
        if (state.shieldTimer < 0) state.shieldTimer = 0;
    }

    if (state.keys.left) state.aimAngle = Math.max(-Math.PI / 2.6, state.aimAngle - GAME_CONFIG.aimSpeed * delta);
    if (state.keys.right) state.aimAngle = Math.min(Math.PI / 2.6, state.aimAngle + GAME_CONFIG.aimSpeed * delta);

    if ((state.keys.shoot || state.touch.shoot) && state.cooldownTimer === 0) {
        tryShoot();
    }

    // MALI BRZI METAK (LASER BULLET) FIZIKA
    for (let i = state.lasers.length - 1; i >= 0; i--) {
        const laser = state.lasers[i];
        laser.life -= delta;

        laser.headX += laser.vx * delta;
        laser.headY += laser.vy * delta;

        // Rep prati glavu na kratkom rastojanju metka
        laser.tailX = laser.headX - (laser.vx / GAME_CONFIG.laserSpeed) * GAME_CONFIG.laserLength;
        laser.tailY = laser.headY - (laser.vy / GAME_CONFIG.laserSpeed) * GAME_CONFIG.laserLength;

        // ODBIJANJE OD ZIDOVA
        if (laser.headX <= 0) { laser.headX = 0; laser.vx = Math.abs(laser.vx); }
        else if (laser.headX >= state.width) { laser.headX = state.width; laser.vx = -Math.abs(laser.vx); }

        if (laser.headY <= 0) { laser.headY = 0; laser.vy = Math.abs(laser.vy); }
        else if (laser.headY >= state.height) { laser.headY = state.height; laser.vy = -Math.abs(laser.vy); }

        if (laser.life <= 0) {
            state.lasers.splice(i, 1);
        }
    }

    // FIZIKA ZEČEVA
    for (let oIdx = state.orbs.length - 1; oIdx >= 0; oIdx--) {
        const orb = state.orbs[oIdx];

        if (orb.abilityTimer > 0) orb.abilityTimer -= delta;

        if (orb.inHole) {
            orb.holeTimer -= delta;
            if (orb.holeTimer <= 0) {
                orb.inHole = false;

                const otherHoles = state.blackHoles.filter(h => h.id !== orb.entryHoleId);
                const exitHole = otherHoles[Math.floor(Math.random() * otherHoles.length)];

                const speed = 480;
                orb.x = exitHole.x + exitHole.dirX * (orb.radius + 6);
                orb.y = exitHole.y + exitHole.dirY * (orb.radius + 6);

                orb.velocityX = exitHole.dirX * speed * 0.7071;
                orb.velocityY = exitHole.dirY * speed * 0.7071;

                audio.playBounce();
            }
            continue;
        }

        // Ako je zaleđen od Blue Freeze-a, stoji u mestu
        if (state.freezeTimer > 0) continue;

        orb.velocityY += GAME_CONFIG.gravity * delta;
        orb.x += orb.velocityX * delta;
        orb.y += orb.velocityY * delta;

        state.blackHoles.forEach(bh => {
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
        
        // Zaštitni štit na dnu ako je aktiviran Green Guardian
        const floorY = state.shieldTimer > 0 ? state.height - 24 : state.height - 2;
        if (orb.y + orb.radius > floorY) {
            orb.y = floorY - orb.radius;
            orb.velocityY = -ORB_TYPES.large.bounce;
        }
    }

    // HIT DETEKCIJA LASERA SA ZEČEVIMA -> TRIGGER MOĆI!
    state.lasers.forEach(laser => {
        state.orbs.forEach(orb => {
            if (orb.inHole) return;
            const dist = pointToSegmentDistance(orb.x, orb.y, laser.tailX, laser.tailY, laser.headX, laser.headY);
            if (dist < orb.radius + 4) {
                audio.playBounce();
                
                // ODMAH TRIPUJEMO NJEGOVU MOĆ!
                triggerRabbitAbility(orb);

                const bounceAngle = Math.atan2(laser.vy, laser.vx) + Math.PI / 2;
                const speed = Math.hypot(orb.velocityX, orb.velocityY) + 110;
                orb.velocityX = Math.cos(bounceAngle) * speed;
                orb.velocityY = Math.sin(bounceAngle) * speed;
                
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

function tryShoot() {
    if (state.cooldownTimer > 0) return;
    audio.playShoot();
    state.cooldownTimer = GAME_CONFIG.shootCooldown; // 2 SEKUNDE COOLDOWN
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

    // 1. RUPE U ĆOŠKOVIMA
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

    // 2. ŠTIT NA DNU (AKO JE ZELENI ZEC AKTIVAN)
    if (state.shieldTimer > 0) {
        ctx.save();
        ctx.strokeStyle = "#32ff9b";
        ctx.shadowColor = "#32ff9b";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, state.height - 20);
        ctx.lineTo(state.width, state.height - 20);
        ctx.stroke();
        ctx.restore();
    }

    // 3. LASERSKI NIŠAN (KAD NEMA COOLDOWN-A)
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

    // 4. MALI BRZI METAK (LASER BULLET)
    state.lasers.forEach(laser => {
        ctx.save();
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(laser.tailX, laser.tailY);
        ctx.lineTo(laser.headX, laser.headY);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ff2fcf";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(laser.headX, laser.headY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 5. CRTANJE ZEČEVA + GLOW AKO SU AKTIVIRALI MOĆ
    state.orbs.forEach(o => {
        if (o.inHole) return;
        const theme = o.theme || RABBIT_THEMES[0];
        const r = o.radius;

        ctx.save();
        ctx.translate(o.x, o.y);

        // Pulsirajući Glow ako je aktivirana moć
        if (o.abilityTimer > 0) {
            ctx.shadowColor = theme.main;
            ctx.shadowBlur = 25;
        } else if (state.freezeTimer > 0) {
            ctx.shadowColor = "#00a2ff";
            ctx.shadowBlur = 15;
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

    // 6. TOP SA COOLDOWN INDIKATOROM
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
