"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const money = (number) => {
  return Math.round(number).toLocaleString("sr-RS") + " €";
};

/* =========================================================
   OFFICE STATIONS
========================================================= */

const stations = {
  design: { x: 21, y: 35 },
  code: { x: 75, y: 33 },
  art: { x: 21, y: 77 },
  test: { x: 75, y: 77 },
  build: { x: 50, y: 49 },
  rest: { x: 50, y: 90 }
};

/* =========================================================
   WORKERS
========================================================= */

const workerSeed = [
  {
    id: "w1",
    name: "Nina",
    icon: "✎",
    role: "Designer",
    skill: "design",
    color: "#ff4fad",
    x: 44,
    y: 84,
    energy: 100,
    salary: 85
  },
  {
    id: "w2",
    name: "Miloš",
    icon: "⌨",
    role: "Programmer",
    skill: "code",
    color: "#28e9ff",
    x: 50,
    y: 84,
    energy: 100,
    salary: 110
  },
  {
    id: "w3",
    name: "Zoe",
    icon: "◆",
    role: "Artist",
    skill: "art",
    color: "#a970ff",
    x: 56,
    y: 84,
    energy: 100,
    salary: 90
  },
  {
    id: "w4",
    name: "Vuk",
    icon: "⚠",
    role: "QA Tester",
    skill: "test",
    color: "#45ff9b",
    x: 62,
    y: 84,
    energy: 100,
    salary: 80
  }
];

/* =========================================================
   AI MUSKETEERS
========================================================= */

const aiSeed = [
  {
    id: "gpt",
    name: "ChatGPT",
    role: "CODE",
    messages: 5,
    maxMessages: 5
  },
  {
    id: "claude",
    name: "Claude",
    role: "DESIGN",
    messages: 4,
    maxMessages: 4
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "RESEARCH",
    messages: 6,
    maxMessages: 6
  }
];

/* =========================================================
   PROJECT TEMPLATES
========================================================= */

const projectTemplates = {
  "Pucačina": [
    ["Gameplay pravila", "design", 7, []],
    ["Player Controller", "code", 9, [0]],
    ["Weapon System", "code", 11, [1]],
    ["Arena & UI", "art", 9, [0]],
    ["Enemy AI", "code", 12, [1]],
    ["Integracioni test", "test", 9, [2, 3, 4]],
    ["Final Build", "build", 8, [5]]
  ],

  "Vožnja": [
    ["Handling dizajn", "design", 7, []],
    ["Vehicle Physics", "code", 12, [0]],
    ["Staza i vozila", "art", 10, [0]],
    ["Lap System", "code", 9, [1]],
    ["Kontrola kvaliteta", "test", 10, [1, 2, 3]],
    ["Final Build", "build", 8, [4]]
  ],

  "Strategija": [
    ["Ekonomija i pravila", "design", 9, []],
    ["Jedinice i selekcija", "code", 11, [0]],
    ["Mapa i interfejs", "art", 10, [0]],
    ["Enemy AI", "code", 13, [1]],
    ["Balans test", "test", 11, [2, 3]],
    ["Final Build", "build", 8, [4]]
  ],

  "Avantura": [
    ["Priča i questovi", "design", 10, []],
    ["Movement & kamera", "code", 9, [0]],
    ["Svet i karakteri", "art", 12, [0]],
    ["Quest sistem", "code", 11, [1]],
    ["Playtest", "test", 10, [2, 3]],
    ["Final Build", "build", 8, [4]]
  ],

  "Logička": [
    ["Puzzle pravila", "design", 8, []],
    ["Puzzle sistem", "code", 10, [0]],
    ["UI i nivoi", "art", 9, [0]],
    ["Difficulty test", "test", 10, [1, 2]],
    ["Final Build", "build", 7, [3]]
  ],

  "Dečija": [
    ["Edukativni cilj", "design", 8, []],
    ["Jednostavne kontrole", "code", 8, [0]],
    ["Veseli svet", "art", 11, [0]],
    ["Safety test", "test", 11, [1, 2]],
    ["Final Build", "build", 7, [3]]
  ],

  "18+ zreo sadržaj": [
    ["Zrela tema i rejting", "design", 9, []],
    ["Core gameplay", "code", 10, [0]],
    ["Atmosfera", "art", 11, [0]],
    ["Content test", "test", 10, [1, 2]],
    ["Final Build", "build", 8, [3]]
  ]
};

/* =========================================================
   GAME STATE
========================================================= */

const state = {
  money: 20000,
  minutes: 480,
  day: 1,
  reputation: 0,
  speed: 1,

  selectedWorker: null,

  workers: [],
  ai: [],
  tasks: [],

  projectActive: false,
  quality: 0,
  bugs: 0,

  timer: null,
  lastPayroll: 480
};

/* =========================================================
   HELPERS
========================================================= */

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast.hideTimer);

  toast.hideTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2300);
}

function updateLog(message) {
  $("#ticker").textContent = message;
}

function getTaskState(task) {
  if (task.done) {
    return "done";
  }

  if (task.workerId) {
    return "working";
  }

  const dependenciesFinished = task.dependencies.every(
    (taskIndex) => state.tasks[taskIndex]?.done
  );

  return dependenciesFinished
    ? "available"
    : "locked";
}

/* =========================================================
   START PROJECT
========================================================= */

function startProject() {
  if (state.projectActive) {
    return;
  }

  const genre = $("#genre").value;
  const projectName = $("#projectName").value.trim();

  if (!projectName) {
    showToast("Unesi naziv projekta.");
    return;
  }

  state.tasks = projectTemplates[genre].map(
    (taskData, index) => {
      return {
        id: index,
        name: taskData[0],
        station: taskData[1],
        duration: taskData[2] * 60,
        dependencies: taskData[3],
        progress: 0,
        workerId: null,
        done: false
      };
    }
  );

  state.projectActive = true;
  state.quality = 0;
  state.bugs = 0;

  $("#projectBtn").disabled = true;

  updateLog(
    `${projectName.toUpperCase()} // ${genre} // PRODUKCIJA POČELA`
  );

  render();
}

/* =========================================================
   WORKER SELECTION
========================================================= */

function selectWorker(workerId) {
  state.selectedWorker = workerId;
  render();
}

/* =========================================================
   ASSIGN TASK
========================================================= */

function assignTask(taskId) {
  const worker = state.workers.find(
    (item) => item.id === state.selectedWorker
  );

  const task = state.tasks[taskId];

  if (!worker) {
    showToast("Prvo izaberi radnika.");
    return;
  }

  if (
    worker.taskId !== null &&
    worker.taskId !== undefined
  ) {
    showToast(`${worker.name} već radi.`);
    return;
  }

  if (getTaskState(task) !== "available") {
    showToast("Zadatak još nije dostupan.");
    return;
  }

  const stationOccupied = state.workers.some(
    (otherWorker) => {
      if (
        otherWorker.taskId === null ||
        otherWorker.taskId === undefined
      ) {
        return false;
      }

      const otherTask =
        state.tasks[otherWorker.taskId];

      return otherTask?.station === task.station;
    }
  );

  if (stationOccupied) {
    showToast("Radna stanica je zauzeta.");
    return;
  }

  if (worker.energy < 15) {
    showToast(`${worker.name} je iscrpljen.`);
    return;
  }

  worker.taskId = task.id;
  worker.status = "moving";

  task.workerId = worker.id;

  moveWorker(worker, task.station);

  updateLog(
    `NAREĐENJE // ${worker.name} → ${task.name}`
  );

  setTimeout(() => {
    if (worker.taskId === task.id) {
      worker.status = "working";
    }

    render();
  }, 1250);

  render();
}

/* =========================================================
   WORKER MOVEMENT
========================================================= */

function moveWorker(worker, stationName) {
  worker.x = stations[stationName].x;
  worker.y = stations[stationName].y;

  renderUnits();
}

/* =========================================================
   REST
========================================================= */

function sendWorkerToRest() {
  const worker = state.workers.find(
    (item) => item.id === state.selectedWorker
  );

  if (!worker) {
    return;
  }

  if (
    worker.taskId !== null &&
    worker.taskId !== undefined
  ) {
    showToast("Radnik prvo mora završiti zadatak.");
    return;
  }

  worker.status = "resting";

  moveWorker(worker, "rest");

  updateLog(`${worker.name} ide na odmor.`);

  render();
}

/* =========================================================
   WORK SYSTEM
========================================================= */

function processWorkers(deltaTime) {
  state.workers.forEach((worker) => {
    if (worker.status === "resting") {
      worker.energy = Math.min(
        100,
        worker.energy + deltaTime * 0.018
      );

      if (worker.energy >= 99) {
        worker.status = "idle";

        showToast(
          `${worker.name} je odmoran.`
        );
      }
    }

    if (worker.status !== "working") {
      return;
    }

    const task = state.tasks[worker.taskId];

    if (!task) {
      return;
    }

    let skillMultiplier = 0.72;

    if (worker.skill === task.station) {
      skillMultiplier = 1.35;
    }

    if (task.station === "build") {
      skillMultiplier = 1;
    }

    const energyMultiplier = Math.max(
      0.45,
      worker.energy / 100
    );

    const aiMultiplier =
      getAIAssistance(worker, task);

    task.progress +=
      deltaTime *
      skillMultiplier *
      energyMultiplier *
      aiMultiplier;

    worker.energy = Math.max(
      0,
      worker.energy - deltaTime * 0.007
    );

    const bugChance =
      0.002 * deltaTime / 10;

    if (
      Math.random() < bugChance &&
      task.station !== "test"
    ) {
      const newBugs =
        worker.skill === task.station
          ? 1
          : 3;

      state.bugs = Math.min(
        99,
        state.bugs + newBugs
      );
    }

    if (task.progress >= task.duration) {
      finishTask(worker, task);
    }
  });
}

/* =========================================================
   FINISH TASK
========================================================= */

function finishTask(worker, task) {
  task.progress = task.duration;
  task.done = true;
  task.workerId = null;

  worker.taskId = null;
  worker.status = "idle";

  if (worker.skill === task.station) {
    state.quality += 10;
  } else {
    state.quality += 6;
  }

  if (task.station === "test") {
    state.bugs = Math.max(
      0,
      state.bugs -
      8 -
      Math.floor(Math.random() * 6)
    );
  }

  moveWorker(worker, "rest");

  updateLog(
    `ZAVRŠENO // ${task.name} // ${worker.name}`
  );

  showToast(`${task.name} završen.`);
}

/* =========================================================
   AI ASSISTANCE
========================================================= */

function getAIAssistance(worker, task) {
  const aiForStation = {
    code: "gpt",
    design: "claude",
    art: "gemini",
    test: "gpt",
    build: "gpt"
  };

  const aiId =
    aiForStation[task.station] || "gpt";

  const ai = state.ai.find(
    (item) => item.id === aiId
  );

  if (!ai || ai.messages <= 0) {
    return 1;
  }

  if (Math.random() < 0.015) {
    ai.messages -= 1;

    showToast(
      `${ai.name}: poruka iskorišćena za ${task.name}.`
    );

    if (ai.messages === 0) {
      setTimeout(() => {
        showPaywall(ai);
      }, 300);
    }
  }

  return 1.18;
}

/* =========================================================
   PAYWALL
========================================================= */

function showPaywall(ai) {
  $("#eventCard").innerHTML = `
    <p class="tag">
      AI TERMINAL
    </p>

    <h2>
      YOU ARE OUT OF FREE MESSAGES
    </h2>

    <p>
      ${ai.name} je zaključan.<br>
      Radnici nastavljaju sporije.
    </p>

    <div class="actions">
      <button id="closePaywall">
        NASTAVI BEZ AI
      </button>

      <button
        id="buySubscription"
        class="danger"
      >
        MORATE DA PLATITE<br>
        299 €
      </button>
    </div>
  `;

  $("#eventModal").classList.add("active");

  $("#closePaywall").addEventListener(
    "click",
    () => {
      $("#eventModal").classList.remove("active");
    }
  );

  $("#buySubscription").addEventListener(
    "click",
    () => {
      buySubscription(ai);
    }
  );
}

function buySubscription(ai) {
  if (state.money < 299) {
    showToast("Nemaš dovoljno novca.");
    return;
  }

  state.money -= 299;
  ai.messages = ai.maxMessages;

  $("#eventModal").classList.remove("active");

  showToast(`${ai.name} ponovo online.`);

  render();
}

/* =========================================================
   PAYROLL AND GAME TIME
========================================================= */

function processPayroll() {
  if (
    state.minutes - state.lastPayroll < 720
  ) {
    return;
  }

  state.lastPayroll = state.minutes;

  const payroll = state.workers.reduce(
    (total, worker) => {
      return total + worker.salary;
    },
    0
  );

  state.money -= payroll;

  showToast(
    `Plate i troškovi: -${money(payroll)}`
  );
}

function gameTick() {
  if (state.speed === 0) {
    return;
  }

  const deltaTime = 8 * state.speed;

  state.minutes += deltaTime;

  processWorkers(deltaTime);
  processPayroll();

  if (state.minutes >= 1440) {
    state.day += 1;
    state.minutes -= 1440;
    state.lastPayroll -= 1440;
  }

  render();

  if (state.money <= 0) {
    gameOver();
  }
}

/* =========================================================
   PUBLISH GAME
========================================================= */

function publishGame() {
  if (
    !state.tasks.length ||
    !state.tasks.every((task) => task.done)
  ) {
    return;
  }

  const projectName =
    $("#projectName").value.trim();

  const score = Math.max(
    5,
    Math.min(
      100,
      state.quality -
      state.bugs * 2 +
      20
    )
  );

  const sales = Math.floor(
    (250 + Math.random() * 800) *
    (0.5 + score / 100)
  );

  const revenue = Math.floor(
    sales * 4.99 * 0.7
  );

  state.money += revenue;

  state.reputation += Math.floor(
    score / 10
  );

  state.projectActive = false;

  $("#eventCard").innerHTML = `
    <p class="tag">
      BUILD SUCCESSFUL
    </p>

    <h2>${projectName}</h2>

    <p>
      Ocena:
      <b>${score}%</b><br>

      Prodato:
      <b>${sales}</b><br>

      Prihod:
      <b>${money(revenue)}</b>
    </p>

    <button
      id="nextProject"
      class="cyan"
    >
      SLEDEĆI PROJEKAT
    </button>
  `;

  $("#eventModal").classList.add("active");

  $("#nextProject").addEventListener(
    "click",
    () => {
      state.tasks = [];

      $("#projectBtn").disabled = false;
      $("#eventModal").classList.remove("active");

      render();
    }
  );
}

/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {
  clearInterval(state.timer);

  $("#eventCard").innerHTML = `
    <h2>
      STUDIO BANKROTIRAO
    </h2>

    <p>
      DELETE FAIL: OFF
    </p>

    <button id="restartGame">
      NOVA PARTIJA
    </button>
  `;

  $("#eventModal").classList.add("active");

  $("#restartGame").addEventListener(
    "click",
    () => {
      window.location.reload();
    }
  );
}

/* =========================================================
   RENDER WORKER UNITS
========================================================= */

function renderUnits() {
  $("#workersLayer").innerHTML =
    state.workers
      .map((worker) => {
        const selected =
          state.selectedWorker === worker.id;

        const working =
          worker.status === "working";

        return `
          <div
            class="
              unit
              ${selected ? "selected" : ""}
              ${working ? "working" : ""}
            "
            data-unit="${worker.id}"
            data-name="${worker.name}"
            style="
              --x: ${worker.x};
              --y: ${worker.y};
              --unit: ${worker.color};
            "
          >
            ${worker.icon}
          </div>
        `;
      })
      .join("");

  $$("[data-unit]").forEach((unit) => {
    unit.addEventListener("click", () => {
      selectWorker(unit.dataset.unit);
    });
  });
}

/* =========================================================
   MAIN RENDER
========================================================= */

function render() {
  $("#money").textContent =
    money(state.money);

  $("#day").textContent =
    state.day;

  const hours =
    Math.floor(state.minutes / 60) % 24;

  const minutes =
    Math.floor(state.minutes % 60);

  $("#clock").textContent =
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}`;

  $("#reputation").textContent =
    state.reputation;

  renderWorkerCards();
  renderAICards();
  renderTasks();
  renderStations();
  renderSelectedWorker();
  renderUnits();
}

function renderWorkerCards() {
  $("#workerList").innerHTML =
    state.workers
      .map((worker) => {
        const selected =
          state.selectedWorker === worker.id;

        return `
          <div
            class="
              worker-card
              ${selected ? "selected" : ""}
            "
            data-worker="${worker.id}"
          >
            <b>
              ${worker.icon} ${worker.name}
            </b>

            <small>
              ${worker.role}
              //
              ${worker.status.toUpperCase()}
            </small>

            <div class="bar">
              <i
                style="
                  --value: ${worker.energy}%;
                "
              ></i>
            </div>
          </div>
        `;
      })
      .join("");

  $$("[data-worker]").forEach((card) => {
    card.addEventListener("click", () => {
      selectWorker(card.dataset.worker);
    });
  });
}

function renderAICards() {
  $("#aiList").innerHTML =
    state.ai
      .map((ai) => {
        const offline =
          ai.messages <= 0;

        const percentage =
          (ai.messages / ai.maxMessages) * 100;

        return `
          <div
            class="
              ai-card
              ${offline ? "off" : ""}
            "
          >
            <b>${ai.name}</b>

            <small>
              ${ai.role}
              //
              ${ai.messages}/${ai.maxMessages}
              poruka
            </small>

            <div class="bar">
              <i
                style="
                  --value: ${percentage}%;
                "
              ></i>
            </div>
          </div>
        `;
      })
      .join("");
}

function renderTasks() {
  if (!state.tasks.length) {
    $("#taskList").innerHTML = `
      <p class="empty">
        Pokreni projekat.
      </p>
    `;

    $("#doneCount").textContent = "0/0";
    $("#quality").textContent = "0";
    $("#bugs").textContent = "0";
    $("#publishBtn").disabled = true;

    return;
  }

  $("#taskList").innerHTML =
    state.tasks
      .map((task) => {
        const taskStatus =
          getTaskState(task);

        const worker =
          state.workers.find(
            (item) =>
              item.id === task.workerId
          );

        const progressPercentage =
          Math.min(
            100,
            task.progress /
            task.duration *
            100
          );

        return `
          <div
            class="task ${taskStatus}"
            data-task="${task.id}"
          >
            <b>
              ${task.done ? "✓ " : ""}
              ${task.name}
            </b>

            <small>
              ${task.station.toUpperCase()}

              ${
                worker
                  ? ` // ${worker.name}`
                  : ""
              }
            </small>

            <div class="progress">
              <i
                style="
                  --p:
                  ${progressPercentage}%;
                "
              ></i>
            </div>
          </div>
        `;
      })
      .join("");

  $$(".task.available").forEach(
    (taskElement) => {
      taskElement.addEventListener(
        "click",
        () => {
          assignTask(
            Number(taskElement.dataset.task)
          );
        }
      );
    }
  );

  const finishedTasks =
    state.tasks.filter(
      (task) => task.done
    ).length;

  $("#doneCount").textContent =
    `${finishedTasks}/${state.tasks.length}`;

  $("#quality").textContent =
    state.quality;

  $("#bugs").textContent =
    state.bugs;

  $("#publishBtn").disabled =
    finishedTasks !== state.tasks.length;
}

function renderStations() {
  $$(".station").forEach(
    (stationElement) => {
      const stationType =
        stationElement.dataset.station;

      const worker =
        state.workers.find(
          (item) => {
            if (
              item.taskId === null ||
              item.taskId === undefined
            ) {
              return false;
            }

            return (
              state.tasks[item.taskId]
                ?.station === stationType
            );
          }
        );

      stationElement.classList.toggle(
        "busy",
        Boolean(worker)
      );

      const statusElement =
        stationElement.querySelector("em");

      if (!worker) {
        statusElement.textContent = "";
        return;
      }

      const task =
        state.tasks[worker.taskId];

      const progress =
        Math.floor(
          task.progress /
          task.duration *
          100
        );

      statusElement.textContent =
        `${worker.name}: ${progress}%`;
    }
  );
}

function renderSelectedWorker() {
  const worker =
    state.workers.find(
      (item) =>
        item.id === state.selectedWorker
    );

  $("#selectedName").textContent =
    worker
      ? worker.name
      : "NIKO";

  $("#selectedStatus").textContent =
    worker
      ? worker.status.toUpperCase()
      : "—";

  $("#selectedEnergy").textContent =
    worker
      ? Math.floor(worker.energy) + "%"
      : "—";

  $("#restBtn").disabled =
    !worker ||
    (
      worker.taskId !== null &&
      worker.taskId !== undefined
    );
}

/* =========================================================
   START GAME
========================================================= */

function startGame() {
  $("#startScreen").classList.remove(
    "active"
  );

  state.workers = clone(workerSeed).map(
    (worker) => {
      return {
        ...worker,
        status: "idle",
        taskId: null
      };
    }
  );

  state.ai = clone(aiSeed);

  render();

  state.timer = setInterval(
    gameTick,
    500
  );
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

$("#startBtn").addEventListener(
  "click",
  startGame
);

$("#projectBtn").addEventListener(
  "click",
  startProject
);

$("#publishBtn").addEventListener(
  "click",
  publishGame
);

$("#restBtn").addEventListener(
  "click",
  sendWorkerToRest
);

$$("[data-speed]").forEach(
  (speedButton) => {
    speedButton.addEventListener(
      "click",
      () => {
        state.speed = Number(
          speedButton.dataset.speed
        );

        $$("[data-speed]").forEach(
          (button) => {
            button.classList.toggle(
              "on",
              button === speedButton
            );
          }
        );
      }
    );
  }
);
