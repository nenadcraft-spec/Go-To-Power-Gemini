"use strict";

/* =========================================================
   WHR: POWER WTF UP v5.2.0 - KINETIC ENGINE & EFX SYSTEM
========================================================= */

const DOM = {
    screens: {
        start: document.getElementById("startScreen"),
        game: document.getElementById("gameScreen")
    },
    buttons: {
        start: document.getElementById("startButton"),
        shoot: document.getElementById("shootButton")
    },
    canvas: document.getElementById("gameCanvas"),
    stage: document.getElementById("gameStage"),
    scoreValue: document.getElementById("scoreValue"),
    joystick: {
        zone: document.getElementById("joystickZone"),
        base: document.getElementById("joystickBase"),
        stick: document.getElementById("joystickStick")
    }
};

const state = {
    mouse: { x: 0, y: 0, active: false },
    score: 0,
    rabbits: [],
    particles: [],
    floatingTexts: [],
    lastTime: performance.now()
};

// Teme i replike za svih 7 zečeva
const RABBIT_THEMES = [
    { id: "red", color: "#ff315d", name: "Red Cyber", quote: "OVERCLOCK!", efx: "flash" },
    { id: "void", color: "#b026ff", name: "Void Shadow", quote: "BACK TO VOID!", efx: "smoke" },
    { id: "freeze", color: "#00f5ff", name: "Blue Freeze", quote: "COOLING DOWN...", efx: "frost" },
    { id: "gold", color: "#ffd700", name: "Gold Rabbit", quote: "JACKPOT!", efx: "sparkle" },
    { id: "green", color: "#32ff9b", name: "Green Guardian", quote: "SHIELD UP!", efx: "ring" },
    { id: "white", color: "#ffffff", name: "White Hacker", quote: "RE-HACKED!", efx: "binary" },
    { id: "black", color: "#ff2fcf", name: "Black Hacker", quote: "SYSTEM CRASH!", efx: "glitch" }
];

const audio = { init() {} };

function resizeCanvas() {
    if (!DOM.canvas || !DOM.stage) return;
    const rect = DOM.stage.getBoundingClientRect();
    DOM.canvas.width = rect.width;
    DOM.canvas.height = rect.height;
}

// Spawnovanje lebdećih poruka na mestu pogotka
function spawnFloatingText(x, y, text, color) {
    state.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color || "#00f5ff",
        alpha: 1.0,
        life: 1.2
    });
}

// Spawnovanje kinetičkih čestica (Flash duhovi, binarne cifre, zlatne varnice)
function spawnParticle(x, y, theme) {
    let char = "";
    if (theme.efx === "binary") char = Math.random() > 0.5 ? "1" : "0";

    state.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        color: theme.color,
        size: Math.random() * 4 + 2,
        life: 0.6,
        maxLife: 0.6,
        efx: theme.efx,
        char: char
    });
}

// Inicijalizacija zečeva u igri
function initRabbits() {
    state.rabbits = RABBIT_THEMES.map((theme, i) => ({
        x: 100 + (i * 60) % 300,
        y: 150 + Math.floor(i / 3) * 80,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120,
        radius: 18,
        theme: theme,
        history: [] // Za afterimage "Flash" trake
    }));
}

function handleTargetInteraction(clientX, clientY) {
    if (!DOM.canvas) return;
    const rect = DOM.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Provera da li je zec pogođen
    for (let i = 0; i < state.rabbits.length; i++) {
        const r = state.rabbits[i];
        const dist = Math.hypot(r.x - x, r.y - y);
        if (dist < r.radius + 15) {
            // Reakcija na pogodak
            state.score += 100;
            if (DOM.scoreValue) {
                DOM.scoreValue.textContent = String(state.score).padStart(6, '0');
            }
            
            // 1. Sitan floating text
            spawnFloatingText(r.x, r.y, r.theme.quote, r.theme.color);
            
            // 2. Eksplozija čestica
            for (let p = 0; p < 12; p++) {
                spawnParticle(r.x, r.y, r.theme);
            }

            // 3. Relokacija zeca iz jednog od 4 ugla
            const corners = [
                { x: 20, y: 20 },
                { x: DOM.canvas.width - 20, y: 20 },
                { x: 20, y: DOM.canvas.height - 20 },
                { x: DOM.canvas.width - 20, y: DOM.canvas.height - 20 }
            ];
            const corner = corners[Math.floor(Math.random() * corners.length)];
            r.x = corner.x;
            r.y = corner.y;
            r.vx = (Math.random() - 0.5) * 180;
            r.vy = (Math.random() - 0.5) * 180;
            break;
        }
    }
}

function updateGame(now) {
    const delta = Math.min((now - state.lastTime) / 1000, 0.1);
    state.lastTime = now;

    const w = DOM.canvas.width;
    const h = DOM.canvas.height;

    // Update kretanja zečeva i generisanje vizuelnih tragova
    state.rabbits.forEach(r => {
        r.x += r.vx * delta;
        r.y += r.vy * delta;

        // Odbijanje od zidova
        if (r.x - r.radius < 0) { r.x = r.radius; r.vx *= -1; }
        if (r.x + r.radius > w) { r.x = w - r.radius; r.vx *= -1; }
        if (r.y - r.radius < 0) { r.y = r.radius; r.vy *= -1; }
        if (r.y + r.radius > h) { r.y = h - r.radius; r.vy *= -1; }

        // Red Cyber "Flash" tragovi - pamćenje pozicija
        if (r.theme.efx === "flash") {
            r.history.push({ x: r.x, y: r.y });
            if (r.history.length > 5) r.history.shift();
        }

        // Generisanje pasivnih tragova u pokretu
        if (Math.random() < 0.3) {
            spawnParticle(r.x, r.y, r.theme);
        }
    });

    // Update floating text-a
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.life -= delta;
        ft.y -= 20 * delta;
        ft.alpha = Math.max(0, ft.life / 1.2);
        if (ft.life <= 0) state.floatingTexts.splice(i, 1);
    }

    // Update kinetičkih čestica
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    renderGame();
    requestAnimationFrame(updateGame);
}

function renderGame() {
    const ctx = DOM.canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);

    // 1. Renderovanje tragova / "Flash" duhova
    state.rabbits.forEach(r => {
        if (r.theme.efx === "flash" && r.history.length > 0) {
            r.history.forEach((pos, idx) => {
                ctx.save();
                ctx.globalAlpha = (idx + 1) / 10;
                ctx.fillStyle = r.theme.color;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, r.radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
    });

    // 2. Renderovanje zečeva sa neonskim sjajem
    state.rabbits.forEach(r => {
        ctx.save();
        ctx.shadowColor = r.theme.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = r.theme.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dodatni unutrašnji prsten
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    });

    // 3. Renderovanje kinetičkih čestica
    state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;

        if (p.char) {
            ctx.font = "10px monospace";
            ctx.fillText(p.char, p.x, p.y);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // 4. Renderovanje sitnog floating text-a
    state.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = "bold 11px 'Courier New', monospace";
        ctx.fillStyle = ft.color;
        ctx.textAlign = "center";
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });
}

function startNewGame() {
    showScreen("game");
    resizeCanvas();
    initRabbits();
    state.lastTime = performance.now();
    requestAnimationFrame(updateGame);
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

    DOM.canvas.addEventListener("mousedown", e => {
        if (e.button === 0) {
            audio.init();
            handleTargetInteraction(e.clientX, e.clientY);
        }
    });

    DOM.buttons.start?.addEventListener("click", startNewGame);
    window.addEventListener("resize", resizeCanvas);
}

function init() {
    initEvents();
    showScreen("start");
    resizeCanvas();
}

window.addEventListener("DOMContentLoaded", init);
