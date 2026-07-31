"use strict";

/* =========================================================
   WHR: BEYOND THE RABBIT HOLE v1.0
   Pure JavaScript browser game
   ========================================================= */

/* -------------------------
   DOM ELEMENTS
------------------------- */

const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("bestScore");
const levelElement = document.getElementById("level");
const depthElement = document.getElementById("depth");
const energyElement = document.getElementById("energy");
const comboElement = document.getElementById("combo");

const portalGrid = document.getElementById("portalGrid");

const messageBox = document.getElementById("messageBox");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");

const memoryChallenge = document.getElementById("memoryChallenge");
const memoryStart = document.getElementById("memoryStart");

const logicChallenge = document.getElementById("logicChallenge");
const logicContent = document.getElementById("logicContent");

const floatingTextLayer = document.getElementById("floatingTextLayer");
const particleLayer = document.getElementById("particleLayer");

const startButton = document.getElementById("startButton");

/* -------------------------
   GAME CONFIGURATION
------------------------- */

const CONFIG = {
    numberOfHoles: 9,
    startingEnergy: 100,
    maximumEnergy: 100,
    startingSpawnDelay: 1150,
    minimumSpawnDelay: 360,
    entityLifetime: 1050,
    levelTarget: 10,
    maximumLevel: 12,
    challengeEvery: 7
};

const ZONES = [
    {
        name: "NEON MEADOW",
        message: "The first signal has awakened.",
        accent: "#00f7ff"
    },
    {
        name: "MEMORY TUNNEL",
        message: "The tunnel remembers what you forget.",
        accent: "#9d4dff"
    },
    {
        name: "LOGIC GRID",
        message: "Speed opens the door. Logic chooses the path.",
        accent: "#ff3cac"
    },
    {
        name: "QUANTUM WARREN",
        message: "Position is no longer permanent.",
        accent: "#ffd43b"
    },
    {
        name: "AI LABYRINTH",
        message: "The system is learning how you play.",
        accent: "#45ff8f"
    },
    {
        name: "THE WHITE CHAMBER",
        message: "Question everything. Especially the obvious.",
        accent: "#ffffff"
    }
];

const ENTITY_TYPES = {
    WHITE: {
        className: "whiteRabbit",
        icon: "🐇",
        points: 100,
        energy: 2,
        label: "+100"
    },

    GOLDEN: {
        className: "goldenRabbit",
        icon: "✨",
        points: 500,
        energy: 8,
        label: "GOLD +500"
    },

    SHADOW: {
        className: "shadowRabbit",
        icon: "☠",
        points: -200,
        energy: -22,
        label: "SHADOW"
    },

    SCHOLAR: {
        className: "scholarRabbit",
        icon: "◉",
        points: 150,
        energy: 3,
        label: "KNOWLEDGE"
    },

    CHRONO: {
        className: "chronoRabbit",
        icon: "⏳",
        points: 180,
        energy: 4,
        label: "TIME SLOW"
    },

    GLITCH: {
        className: "glitchRabbit",
        icon: "▓",
        points: 220,
        energy: 2,
        label: "GLITCH"
    },

    FALSE: {
        className: "falseSignal",
        icon: "◇",
        points: -100,
        energy: -12,
        label: "FALSE SIGNAL"
    }
};

/* -------------------------
   GAME STATE
------------------------- */

const gameState = {
    running: false,
    paused: false,

    score: 0,
    bestScore: Number(localStorage.getItem("whrRabbitHoleBest")) || 0,

    combo: 1,
    bestCombo: 1,

    level: 1,
    depth: 0,
    energy: CONFIG.startingEnergy,

    successfulHits: 0,
    totalAttempts: 0,
    levelProgress: 0,

    knowledge: 0,
    secrets: 0,

    currentPortal: null,
    currentEntity: null,

    spawnTimeout: null,
    hideTimeout: null,

    slowMotionUntil: 0,
    challengeActive: false
};

/* -------------------------
   AUDIO SYSTEM
------------------------- */

let audioContext = null;

function initializeAudio() {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass) {
            audioContext = new AudioContextClass();
        }
    }

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playSound(
    frequency = 440,
    duration = 0.08,
    waveType = "sine",
    volume = 0.05
) {
    if (!audioContext) {
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

/* -------------------------
   INITIALIZATION
------------------------- */

function initializeGame() {
    bestScoreElement.textContent =
        gameState.bestScore.toLocaleString("sr-RS");

    createPortals();
    updateHUD();
    showWelcomeMessage();
}

function createPortals() {
    portalGrid.innerHTML = "";

    for (let index = 0; index < CONFIG.numberOfHoles; index++) {
        const portal = document.createElement("button");

        portal.type = "button";
        portal.className = "portal";
        portal.dataset.index = String(index);
        portal.setAttribute(
            "aria-label",
            `Rabbit portal ${index + 1}`
        );

        portal.innerHTML = `
            <span class="portalRing"></span>
            <span class="portalCore"></span>
            <span class="entity"></span>
        `;

        portal.addEventListener("pointerdown", function () {
            handlePortalClick(portal);
        });

        portalGrid.appendChild(portal);
    }
}

/* -------------------------
   START AND RESET
------------------------- */

function startGame() {
    initializeAudio();
    clearGameTimers();

    gameState.running = true;
    gameState.paused = false;
    gameState.challengeActive = false;

    gameState.score = 0;
    gameState.combo = 1;
    gameState.bestCombo = 1;

    gameState.level = 1;
    gameState.depth = 0;
    gameState.energy = CONFIG.startingEnergy;

    gameState.successfulHits = 0;
    gameState.totalAttempts = 0;
    gameState.levelProgress = 0;

    gameState.knowledge = 0;
    gameState.secrets = 0;

    gameState.currentPortal = null;
    gameState.currentEntity = null;
    gameState.slowMotionUntil = 0;

    document.body.classList.remove(
        "dangerMode",
        "glitchMode",
        "slowMotion"
    );

    memoryChallenge.classList.add("hidden");
    logicChallenge.classList.add("hidden");

    createPortals();
    updateHUD();

    startButton.textContent = "GAME ACTIVE";
    startButton.disabled = true;

    showSystemMessage(
        "DESCENT INITIALIZED",
        "Find the White Rabbit. Avoid false signals.",
        1800
    );

    setTimeout(scheduleNextEntity, 900);
}

function endGame() {
    if (!gameState.running) {
        return;
    }

    gameState.running = false;
    gameState.paused = true;

    clearGameTimers();
    removeCurrentEntity();

    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;

        localStorage.setItem(
            "whrRabbitHoleBest",
            String(gameState.bestScore)
        );
    }

    bestScoreElement.textContent =
        gameState.bestScore.toLocaleString("sr-RS");

    const accuracy =
        gameState.totalAttempts > 0
            ? Math.round(
                  (gameState.successfulHits /
                      gameState.totalAttempts) *
                      100
              )
            : 0;

    messageBox.classList.remove("hidden");

    messageTitle.textContent = "DESCENT TERMINATED";

    messageText.innerHTML = `
        SCORE: ${gameState.score.toLocaleString("sr-RS")}<br>
        DEPTH: ${gameState.depth}%<br>
        BEST COMBO: x${gameState.bestCombo}<br>
        ACCURACY: ${accuracy}%<br>
        KNOWLEDGE KEYS: ${gameState.knowledge}<br>
        SECRETS: ${gameState.secrets}
    `;

    startButton.disabled = false;
    startButton.textContent = "DESCEND AGAIN";

    playSound(95, 0.5, "sawtooth", 0.08);

    vibrate([100, 70, 150]);
}

/* -------------------------
   ENTITY GENERATION
------------------------- */

function scheduleNextEntity() {
    if (!gameState.running || gameState.paused) {
        return;
    }

    clearTimeout(gameState.spawnTimeout);

    const levelReduction = (gameState.level - 1) * 65;

    let delay = Math.max(
        CONFIG.minimumSpawnDelay,
        CONFIG.startingSpawnDelay - levelReduction
    );

    delay *= 0.78 + Math.random() * 0.38;

    if (Date.now() < gameState.slowMotionUntil) {
        delay *= 1.65;
    }

    gameState.spawnTimeout = setTimeout(
        spawnEntity,
        delay
    );
}

function spawnEntity() {
    if (!gameState.running || gameState.paused) {
        return;
    }

    removeCurrentEntity();

    const portals = Array.from(
        portalGrid.querySelectorAll(".portal")
    );

    if (portals.length === 0) {
        return;
    }

    const randomPortal =
        portals[Math.floor(Math.random() * portals.length)];

    const entityType = chooseEntityType();

    const entityElement =
        randomPortal.querySelector(".entity");

    entityElement.textContent = entityType.icon;
    entityElement.className =
        `entity ${entityType.className}`;

    randomPortal.dataset.entity =
        getEntityKey(entityType);

    randomPortal.classList.add("active");

    gameState.currentPortal = randomPortal;
    gameState.currentEntity = entityType;

    playSpawnSound(entityType);

    const speedReduction =
        Math.min(470, (gameState.level - 1) * 45);

    let lifetime = Math.max(
        450,
        CONFIG.entityLifetime - speedReduction
    );

    if (entityType === ENTITY_TYPES.GOLDEN) {
        lifetime *= 0.72;
    }

    if (Date.now() < gameState.slowMotionUntil) {
        lifetime *= 1.6;
    }

    clearTimeout(gameState.hideTimeout);

    gameState.hideTimeout = setTimeout(
        function () {
            handleMiss(randomPortal, entityType);
        },
        lifetime
    );
}

function chooseEntityType() {
    const roll = Math.random() * 100;
    const level = gameState.level;

    if (roll < 43) {
        return ENTITY_TYPES.WHITE;
    }

    if (roll < 49) {
        return ENTITY_TYPES.GOLDEN;
    }

    if (roll < 61 + level * 0.35) {
        return ENTITY_TYPES.SHADOW;
    }

    if (roll < 71) {
        return ENTITY_TYPES.SCHOLAR;
    }

    if (roll < 80) {
        return ENTITY_TYPES.CHRONO;
    }

    if (roll < 89) {
        return ENTITY_TYPES.GLITCH;
    }

    return ENTITY_TYPES.FALSE;
}

function getEntityKey(entityType) {
    return Object.keys(ENTITY_TYPES).find(
        function (key) {
            return ENTITY_TYPES[key] === entityType;
        }
    );
}

/* -------------------------
   PLAYER INPUT
------------------------- */

function handlePortalClick(portal) {
    if (
        !gameState.running ||
        gameState.paused ||
        !portal.classList.contains("active")
    ) {
        return;
    }

    clearTimeout(gameState.hideTimeout);

    const entityKey = portal.dataset.entity;
    const entityType = ENTITY_TYPES[entityKey];

    if (!entityType) {
        return;
    }

    gameState.totalAttempts += 1;

    portal.classList.add("hit");

    setTimeout(function () {
        portal.classList.remove("hit");
    }, 180);

    removeCurrentEntity();

    switch (entityKey) {
        case "WHITE":
            handlePositiveHit(entityType);
            break;

        case "GOLDEN":
            handleGoldenHit(entityType);
            break;

        case "SHADOW":
            handleNegativeHit(entityType, "SHADOW SIGNAL");
            break;

        case "SCHOLAR":
            handleScholarHit(entityType);
            return;

        case "CHRONO":
            handleChronoHit(entityType);
            break;

        case "GLITCH":
            handleGlitchHit(entityType);
            break;

        case "FALSE":
            handleNegativeHit(entityType, "FALSE SIGNAL");
            break;

        default:
            break;
    }

    updateHUD();

    if (gameState.energy <= 0) {
        endGame();
        return;
    }

    checkLevelProgress();
    scheduleNextEntity();
}

function handlePositiveHit(entityType) {
    gameState.successfulHits += 1;

    const earnedPoints =
        entityType.points * gameState.combo;

    gameState.score += earnedPoints;
    gameState.energy = Math.min(
        CONFIG.maximumEnergy,
        gameState.energy + entityType.energy
    );

    increaseCombo();
    advanceProgress();

    createFloatingText(
        `+${earnedPoints}`,
        "#00f7ff"
    );

    createParticles("#00f7ff", 12);

    playSound(
        520 + gameState.combo * 22,
        0.09,
        "triangle",
        0.06
    );

    vibrate(25);
}

function handleGoldenHit(entityType) {
    gameState.successfulHits += 1;

    const earnedPoints =
        entityType.points * gameState.combo;

    gameState.score += earnedPoints;
    gameState.energy = Math.min(
        CONFIG.maximumEnergy,
        gameState.energy + entityType.energy
    );

    gameState.secrets += 1;

    increaseCombo();
    advanceProgress(2);

    createFloatingText(
        `SECRET +${earnedPoints}`,
        "#ffd43b"
    );

    createParticles("#ffd43b", 28);

    showSystemMessage(
        "SECRET SIGNAL DISCOVERED",
        "The Rabbit Hole remembers this.",
        1300
    );

    playSound(980, 0.2, "triangle", 0.08);

    vibrate([35, 30, 35]);
}

function handleNegativeHit(entityType, label) {
    gameState.score = Math.max(
        0,
        gameState.score + entityType.points
    );

    gameState.energy = Math.max(
        0,
        gameState.energy + entityType.energy
    );

    gameState.combo = 1;

    createFloatingText(
        `${label} ${entityType.energy}`,
        "#ff355e"
    );

    createParticles("#ff355e", 18);

    flashDanger();

    playSound(105, 0.2, "sawtooth", 0.09);

    vibrate([60, 40, 90]);
}

function handleScholarHit(entityType) {
    gameState.successfulHits += 1;

    gameState.score +=
        entityType.points * gameState.combo;

    gameState.energy = Math.min(
        CONFIG.maximumEnergy,
        gameState.energy + entityType.energy
    );

    increaseCombo();
    advanceProgress();

    updateHUD();

    playSound(720, 0.14, "sine", 0.07);

    openRandomChallenge();
}

function handleChronoHit(entityType) {
    gameState.successfulHits += 1;

    gameState.score +=
        entityType.points * gameState.combo;

    gameState.energy = Math.min(
        CONFIG.maximumEnergy,
        gameState.energy + entityType.energy
    );

    gameState.slowMotionUntil =
        Date.now() + 5500;

    increaseCombo();
    advanceProgress();

    document.body.classList.add("slowMotion");

    setTimeout(function () {
        document.body.classList.remove("slowMotion");
    }, 5500);

    createFloatingText(
        "TIME FIELD ACTIVE",
        "#9d4dff"
    );

    createParticles("#9d4dff", 20);

    playSound(340, 0.35, "sine", 0.07);
}

function handleGlitchHit(entityType) {
    gameState.successfulHits += 1;

    gameState.score +=
        entityType.points * gameState.combo;

    gameState.energy = Math.min(
        CONFIG.maximumEnergy,
        gameState.energy + entityType.energy
    );

    increaseCombo();
    advanceProgress();

    activateGlitchEffect();

    createFloatingText(
        `GLITCH +${entityType.points}`,
        "#ff3cac"
    );

    createParticles("#ff3cac", 22);

    playSound(210, 0.18, "square", 0.065);
}

/* -------------------------
   MISSES AND DAMAGE
------------------------- */

function handleMiss(portal, entityType) {
    if (
        !portal ||
        !portal.classList.contains("active")
    ) {
        return;
    }

    removeCurrentEntity();

    const dangerousEntity =
        entityType === ENTITY_TYPES.SHADOW ||
        entityType === ENTITY_TYPES.FALSE;

    if (!dangerousEntity) {
        gameState.combo = 1;
        gameState.energy = Math.max(
            0,
            gameState.energy - 5
        );

        createFloatingText(
            "SIGNAL LOST -5",
            "#ff8a4c"
        );

        playSound(175, 0.1, "square", 0.04);
    }

    updateHUD();

    if (gameState.energy <= 0) {
        endGame();
        return;
    }

    scheduleNextEntity();
}

function removeCurrentEntity() {
    if (!gameState.currentPortal) {
        return;
    }

    const entityElement =
        gameState.currentPortal.querySelector(".entity");

    if (entityElement) {
        entityElement.textContent = "";
        entityElement.className = "entity";
    }

    gameState.currentPortal.classList.remove("active");
    delete gameState.currentPortal.dataset.entity;

    gameState.currentPortal = null;
    gameState.currentEntity = null;
}

/* -------------------------
   COMBO, LEVEL AND DEPTH
------------------------- */

function increaseCombo() {
    gameState.combo = Math.min(
        15,
        gameState.combo + 1
    );

    gameState.bestCombo = Math.max(
        gameState.bestCombo,
        gameState.combo
    );
}

function advanceProgress(amount = 1) {
    gameState.levelProgress += amount;
}

function checkLevelProgress() {
    const target =
        CONFIG.levelTarget +
        (gameState.level - 1) * 2;

    if (gameState.levelProgress < target) {
        return;
    }

    gameState.levelProgress = 0;
    gameState.level += 1;

    gameState.depth = Math.min(
        100,
        Math.round(
            ((gameState.level - 1) /
                (CONFIG.maximumLevel - 1)) *
                100
        )
    );

    gameState.energy = Math.min(
        CONFIG.maximumEnergy,
        gameState.energy + 15
    );

    const zone = getCurrentZone();

    showSystemMessage(
        `LEVEL ${gameState.level}: ${zone.name}`,
        zone.message,
        2200
    );

    createParticles(zone.accent, 35);

    playSound(840, 0.28, "triangle", 0.08);

    vibrate([40, 30, 40]);

    if (
        gameState.level % 3 === 0 &&
        !gameState.challengeActive
    ) {
        setTimeout(openRandomChallenge, 900);
    }

    if (gameState.level > CONFIG.maximumLevel) {
        gameState.score += 5000;

        showSystemMessage(
            "THE WHITE CHAMBER UNLOCKED",
            "You reached the edge of the known system.",
            2600
        );

        setTimeout(endGame, 2700);
    }
}

function getCurrentZone() {
    const zoneIndex = Math.min(
        ZONES.length - 1,
        Math.floor(
            ((gameState.level - 1) /
                CONFIG.maximumLevel) *
                ZONES.length
        )
    );

    return ZONES[zoneIndex];
}

/* -------------------------
   MEMORY CHALLENGE
------------------------- */

function openRandomChallenge() {
    if (
        !gameState.running ||
        gameState.challengeActive
    ) {
        return;
    }

    gameState.paused = true;
    gameState.challengeActive = true;

    clearGameTimers();
    removeCurrentEntity();

    if (Math.random() < 0.5) {
        prepareMemoryChallenge();
    } else {
        prepareLogicChallenge();
    }
}

function prepareMemoryChallenge() {
    logicChallenge.classList.add("hidden");
    memoryChallenge.classList.remove("hidden");

    const symbols = [
        "◈",
        "△",
        "○",
        "◇",
        "✦",
        "⌁"
    ];

    const sequenceLength = Math.min(
        6,
        3 + Math.floor(gameState.level / 3)
    );

    const sequence = [];

    for (
        let index = 0;
        index < sequenceLength;
        index++
    ) {
        sequence.push(
            symbols[
                Math.floor(
                    Math.random() * symbols.length
                )
            ]
        );
    }

    memoryChallenge.innerHTML = `
        <h2>MEMORY INTERRUPT</h2>

        <p id="memoryInstruction">
            Remember the signal sequence.
        </p>

        <div id="memorySequence" class="memorySequence">
            ${sequence
                .map(
                    function (symbol) {
                        return `<span>${symbol}</span>`;
                    }
                )
                .join("")}
        </div>

        <div
            id="memoryOptions"
            class="challengeOptions hidden"
        ></div>
    `;

    playSound(610, 0.2, "sine", 0.06);

    setTimeout(function () {
        const sequenceDisplay =
            document.getElementById(
                "memorySequence"
            );

        const instruction =
            document.getElementById(
                "memoryInstruction"
            );

        if (!sequenceDisplay || !instruction) {
            return;
        }

        sequenceDisplay.textContent = "?";
        instruction.textContent =
            "Choose the exact sequence.";

        createMemoryOptions(sequence);
    }, 1900);
}

function createMemoryOptions(correctSequence) {
    const optionsContainer =
        document.getElementById("memoryOptions");

    if (!optionsContainer) {
        return;
    }

    const correctAnswer =
        correctSequence.join(" ");

    const answers = [correctAnswer];

    while (answers.length < 4) {
        const modifiedSequence =
            [...correctSequence];

        const firstIndex =
            Math.floor(
                Math.random() *
                    modifiedSequence.length
            );

        let secondIndex =
            Math.floor(
                Math.random() *
                    modifiedSequence.length
            );

        if (secondIndex === firstIndex) {
            secondIndex =
                (secondIndex + 1) %
                modifiedSequence.length;
        }

        [
            modifiedSequence[firstIndex],
            modifiedSequence[secondIndex]
        ] = [
            modifiedSequence[secondIndex],
            modifiedSequence[firstIndex]
        ];

        const candidate =
            modifiedSequence.join(" ");

        if (!answers.includes(candidate)) {
            answers.push(candidate);
        }
    }

    shuffleArray(answers);

    optionsContainer.classList.remove("hidden");
    optionsContainer.innerHTML = "";

    answers.forEach(function (answer) {
        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = answer;

        button.addEventListener(
            "click",
            function () {
                resolveChallenge(
                    answer === correctAnswer
                );
            }
        );

        optionsContainer.appendChild(button);
    });
}

/* -------------------------
   LOGIC CHALLENGE
------------------------- */

function prepareLogicChallenge() {
    memoryChallenge.classList.add("hidden");
    logicChallenge.classList.remove("hidden");

    const puzzles = [
        {
            question: "2, 4, 8, 16, ?",
            correct: "32",
            options: ["24", "30", "32", "34"]
        },

        {
            question:
                "1, 1, 2, 3, 5, 8, ?",
            correct: "13",
            options: ["10", "11", "12", "13"]
        },

        {
            question:
                "△ ○ △ ○ △ ?",
            correct: "○",
            options: ["△", "○", "◇", "◈"]
        },

        {
            question:
                "If all rabbits are signals, and some signals are false, what is certainly possible?",
            correct:
                "Some rabbits may be false signals",
            options: [
                "All rabbits are false",
                "No signals are false",
                "Some rabbits may be false signals",
                "Every false signal is a rabbit"
            ]
        },

        {
            question:
                "Which number does not belong: 2, 4, 8, 9, 16?",
            correct: "9",
            options: ["2", "8", "9", "16"]
        },

        {
            question:
                "A portal rotates 90° three times. How far has it rotated?",
            correct: "270°",
            options: [
                "90°",
                "180°",
                "270°",
                "360°"
            ]
        }
    ];

    const puzzle =
        puzzles[
            Math.floor(
                Math.random() * puzzles.length
            )
        ];

    const shuffledOptions =
        [...puzzle.options];

    shuffleArray(shuffledOptions);

    logicContent.innerHTML = `
        <p class="logicQuestion">
            ${puzzle.question}
        </p>

        <div class="challengeOptions">
            ${shuffledOptions
                .map(
                    function (option) {
                        return `
                            <button
                                type="button"
                                class="logicOption"
                                data-answer="${escapeHTML(
                                    option
                                )}"
                            >
                                ${option}
                            </button>
                        `;
                    }
                )
                .join("")}
        </div>
    `;

    const optionButtons =
        logicContent.querySelectorAll(
            ".logicOption"
        );

    optionButtons.forEach(function (button) {
        button.addEventListener(
            "click",
            function () {
                resolveChallenge(
                    button.dataset.answer ===
                        puzzle.correct
                );
            }
        );
    });

    playSound(480, 0.2, "triangle", 0.06);
}

/* -------------------------
   CHALLENGE RESULT
------------------------- */

function resolveChallenge(correct) {
    if (!gameState.challengeActive) {
        return;
    }

    memoryChallenge.classList.add("hidden");
    logicChallenge.classList.add("hidden");

    if (correct) {
        gameState.knowledge += 1;
        gameState.score +=
            700 + gameState.level * 100;

        gameState.energy = Math.min(
            CONFIG.maximumEnergy,
            gameState.energy + 15
        );

        gameState.combo = Math.min(
            15,
            gameState.combo + 2
        );

        createFloatingText(
            "KNOWLEDGE KEY +1",
            "#45ff8f"
        );

        createParticles("#45ff8f", 30);

        showSystemMessage(
            "CORRECT",
            "Knowledge changes the path.",
            1300
        );

        playSound(
            840,
            0.22,
            "triangle",
            0.08
        );
    } else {
        gameState.energy = Math.max(
            0,
            gameState.energy - 15
        );

        gameState.combo = 1;

        createFloatingText(
            "COGNITIVE ERROR -15",
            "#ff355e"
        );

        flashDanger();

        showSystemMessage(
            "INCORRECT",
            "The Rabbit Hole records every decision.",
            1300
        );

        playSound(
            110,
            0.25,
            "sawtooth",
            0.09
        );
    }

    gameState.challengeActive = false;
    gameState.paused = false;

    updateHUD();

    if (gameState.energy <= 0) {
        setTimeout(endGame, 600);
        return;
    }

    setTimeout(scheduleNextEntity, 700);
}

/* -------------------------
   VISUAL EFFECTS
------------------------- */

function createFloatingText(text, color) {
    const floatingText =
        document.createElement("div");

    floatingText.className = "floatingText";
    floatingText.textContent = text;
    floatingText.style.color = color;

    floatingText.style.left =
        `${35 + Math.random() * 30}%`;

    floatingText.style.top =
        `${34 + Math.random() * 25}%`;

    floatingTextLayer.appendChild(
        floatingText
    );

    setTimeout(function () {
        floatingText.remove();
    }, 1100);
}

function createParticles(color, amount = 12) {
    for (
        let index = 0;
        index < amount;
        index++
    ) {
        const particle =
            document.createElement("span");

        particle.className = "particle";
        particle.style.background = color;

        particle.style.left =
            `${45 + Math.random() * 10}%`;

        particle.style.top =
            `${43 + Math.random() * 10}%`;

        particle.style.setProperty(
            "--particle-x",
            `${(Math.random() - 0.5) * 260}px`
        );

        particle.style.setProperty(
            "--particle-y",
            `${(Math.random() - 0.5) * 260}px`
        );

        particleLayer.appendChild(particle);

        setTimeout(function () {
            particle.remove();
        }, 900);
    }
}

function activateGlitchEffect() {
    document.body.classList.add("glitchMode");

    const portals = Array.from(
        portalGrid.children
    );

    shuffleArray(portals);

    portals.forEach(function (portal) {
        portalGrid.appendChild(portal);
    });

    setTimeout(function () {
        document.body.classList.remove(
            "glitchMode"
        );
    }, 2600);
}

function flashDanger() {
    document.body.classList.remove(
        "dangerMode"
    );

    void document.body.offsetWidth;

    document.body.classList.add(
        "dangerMode"
    );

    setTimeout(function () {
        document.body.classList.remove(
            "dangerMode"
        );
    }, 500);
}

/* -------------------------
   MESSAGES
------------------------- */

function showWelcomeMessage() {
    messageBox.classList.remove("hidden");

    messageTitle.textContent =
        "WELCOME EXPLORER";

    messageText.textContent =
        "Find the White Rabbit. Avoid the shadow. Question every signal.";
}

function showSystemMessage(
    title,
    text,
    duration = 1500
) {
    messageBox.classList.remove("hidden");

    messageTitle.textContent = title;
    messageText.textContent = text;

    clearTimeout(
        showSystemMessage.timeout
    );

    showSystemMessage.timeout =
        setTimeout(function () {
            if (gameState.running) {
                messageBox.classList.add(
                    "hidden"
                );
            }
        }, duration);
}

/* -------------------------
   HUD
------------------------- */

function updateHUD() {
    scoreElement.textContent =
        gameState.score.toLocaleString("sr-RS");

    bestScoreElement.textContent =
        Math.max(
            gameState.bestScore,
            gameState.score
        ).toLocaleString("sr-RS");

    levelElement.textContent =
        String(gameState.level);

    depthElement.textContent =
        `${gameState.depth}%`;

    energyElement.textContent =
        `${gameState.energy}%`;

    comboElement.textContent =
        `x${gameState.combo}`;

    energyElement.classList.toggle(
        "critical",
        gameState.energy <= 25
    );

    comboElement.classList.toggle(
        "highCombo",
        gameState.combo >= 6
    );
}

/* -------------------------
   UTILITIES
------------------------- */

function clearGameTimers() {
    clearTimeout(gameState.spawnTimeout);
    clearTimeout(gameState.hideTimeout);
}

function shuffleArray(array) {
    for (
        let index = array.length - 1;
        index > 0;
        index--
    ) {
        const randomIndex =
            Math.floor(
                Math.random() * (index + 1)
            );

        [
            array[index],
            array[randomIndex]
        ] = [
            array[randomIndex],
            array[index]
        ];
    }

    return array;
}

function vibrate(pattern) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

/* -------------------------
   EVENTS
------------------------- */

startButton.addEventListener(
    "click",
    startGame
);

window.addEventListener(
    "keydown",
    function (event) {
        if (
            event.code === "Space" &&
            !gameState.running
        ) {
            event.preventDefault();
            startGame();
        }

        if (
            event.code === "Escape" &&
            gameState.running
        ) {
            endGame();
        }
    }
);

document.addEventListener(
    "visibilitychange",
    function () {
        if (
            document.hidden &&
            gameState.running &&
            !gameState.challengeActive
        ) {
            gameState.paused = true;
            clearGameTimers();

            showSystemMessage(
                "SYSTEM PAUSED",
                "Return to continue the descent.",
                100000
            );
        } else if (
            !document.hidden &&
            gameState.running &&
            !gameState.challengeActive
        ) {
            gameState.paused = false;

            showSystemMessage(
                "SYSTEM RESTORED",
                "The Rabbit Hole is waiting.",
                1000
            );

            setTimeout(
                scheduleNextEntity,
                1100
            );
        }
    }
);

/* -------------------------
   STARTUP
------------------------- */

initializeGame();
