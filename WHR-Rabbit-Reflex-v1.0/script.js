"use strict";

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
    score: 0
};

const audio = {
    init() {}
};

function resizeCanvas() {
    if (!DOM.canvas || !DOM.stage) return;
    const rect = DOM.stage.getBoundingClientRect();
    DOM.canvas.width = rect.width;
    DOM.canvas.height = rect.height;
}

function handleTargetInteraction(x, y) {
    // Kinetička logika zvezda i zečeva
}

function startNewGame() {
    showScreen("game");
    resizeCanvas();
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

    // TOUCH EVENTI (TELEFON)
    DOM.canvas.addEventListener("touchstart", e => {
        e.preventDefault();
        audio.init();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            handleTargetInteraction(touch.clientX, touch.clientY);
        }
    }, { passive: false });

    // MOUSE EVENTI (PC)
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
    window.addEventListener("resize", resizeCanvas);
}

function init() {
    initEvents();
    showScreen("start");
    resizeCanvas();
}

window.addEventListener("DOMContentLoaded", init);
