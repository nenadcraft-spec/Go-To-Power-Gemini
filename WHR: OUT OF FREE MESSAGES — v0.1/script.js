"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const formatMoney = (number) => {
  return Math.round(number).toLocaleString("sr-RS") + " €";
};

/* =========================================================
   EQUIPMENT
========================================================= */

const equipment = [
  {
    id: "pc",
    name: "DEV PC",
    price: 2600,
    description: "Otključava razvojne stanice."
  },
  {
    id: "monitor",
    name: "DRUGI MONITOR",
    price: 320,
    description: "+15% brzina rada."
  },
  {
    id: "nas",
    name: "NAS BACKUP",
    price: 1100,
    description: "Smanjuje štetu kritičnih bagova."
  },
  {
    id: "ups",
    name: "UPS ZAŠTITA",
    price: 260,
    description: "Štiti od nestanka struje."
  },
  {
    id: "audio",
    name: "AUDIO SET",
    price: 540,
    description: "+8 kvaliteta pri objavi."
  },
  {
    id: "test",
    name: "TEST UREĐAJI",
    price: 750,
    description: "Testiranje uklanja više bagova."
  },
  {
    id: "assets",
    name: "ASSET PAKET",
    price: 890,
    description: "+12 kvaliteta pri objavi."
  }
];

/* =========================================================
   AI MUSKETEERS
========================================================= */

const aiSeed = [
  {
    id: "gpt",
    name: "CHATGPT",
    role: "CODE MUSKETAR",
    messages: 8,
    maxMessages: 8
  },
  {
    id: "claude",
    name: "CLAUDE",
    role: "DESIGN MUSKETAR",
    messages: 7,
    maxMessages: 7
  },
  {
    id: "gemini",
    name: "GEMINI",
    role: "RESEARCH MUSKETAR",
    messages: 9,
    maxMessages: 9
  }
];

/* =========================================================
   GAME STATE
========================================================= */

const state = {
  money: 20000,
  time: 900,
  reputation: 0,

  ownedEquipment: new Set(),

  gameActive: false,
  projectActive: false,

  progress: 0,
  quality: 0,
  bugs: 0,

  ai: [],
  selectedAI: "gpt",

  timer: null
};

/* =========================================================
   BASIC HELPERS
========================================================= */

function resetGame() {
  state.money = 20000;
  state.time = 900;
  state.reputation = 0;

  state.ownedEquipment = new Set();

  state.gameActive = true;
  state.projectActive = false;

  state.progress = 0;
  state.quality = 0;
  state.bugs = 0;

  state.ai = aiSeed.map((ai) => ({
    ...ai
  }));

  state.selectedAI = "gpt";

  renderAll();
}

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast.hideTimer);

  toast.hideTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function updateTicker(message) {
  $("#ticker").textContent = message;
}

/* =========================================================
   SHOP
========================================================= */

function renderShop() {
  const shopList = $("#shopList");

  shopList.innerHTML = equipment
    .map((item) => {
      const owned = state.ownedEquipment.has(item.id);
      const cannotAfford = state.money < item.price;

      return `
        <div class="shop-item ${owned ? "owned" : ""}">
          <b>${item.name}</b>

          <small>${item.description}</small>

          <button
            data-buy="${item.id}"
            ${owned || cannotAfford ? "disabled" : ""}
          >
            ${owned ? "KUPLJENO" : formatMoney(item.price)}
          </button>
        </div>
      `;
    })
    .join("");

  $$("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => {
      buyEquipment(button.dataset.buy);
    });
  });
}

function buyEquipment(id) {
  const item = equipment.find((equipmentItem) => {
    return equipmentItem.id === id;
  });

  if (!item) {
    return;
  }

  if (state.ownedEquipment.has(item.id)) {
    return;
  }

  if (state.money < item.price) {
    showToast("Nemaš dovoljno novca.");
    return;
  }

  state.money -= item.price;
  state.ownedEquipment.add(item.id);

  showToast(`${item.name} instaliran.`);
  updateTicker(`STUDIO UPGRADE // ${item.name}`);

  renderAll();
}

/* =========================================================
   AI TERMINALS
========================================================= */

function renderAI() {
  const aiList = $("#aiList");

  aiList.innerHTML = state.ai
    .map((ai) => {
      const offline = ai.messages <= 0;
      const selected = state.selectedAI === ai.id;
      const charge = (ai.messages / ai.maxMessages) * 100;

      return `
        <div
          class="ai-card ${offline ? "offline" : ""}"
          data-ai="${ai.id}"
          style="outline: ${
            selected ? "1px solid var(--cyan)" : "none"
          };"
        >
          <b>${ai.name}</b>

          <small>
            ${ai.role}<br>
            PORUKE: ${ai.messages}/${ai.maxMessages}
          </small>

          <div class="charge">
            <i style="--charge: ${charge}%;"></i>
          </div>
        </div>
      `;
    })
    .join("");

  $$("[data-ai]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedAI = card.dataset.ai;

      renderAI();

      const selectedName = card.querySelector("b").textContent;

      showToast(`${selectedName} izabran.`);
    });
  });

  const hasOfflineAI = state.ai.some((ai) => {
    return ai.messages <= 0;
  });

  $("#subscribeBtn").disabled =
    !hasOfflineAI || state.money < 299;
}

/* =========================================================
   MAIN RENDER
========================================================= */

function renderAll() {
  $("#money").textContent = formatMoney(state.money);

  const minutes = String(
    Math.floor(state.time / 60)
  ).padStart(2, "0");

  const seconds = String(
    state.time % 60
  ).padStart(2, "0");

  $("#time").textContent = `${minutes}:${seconds}`;

  $("#rep").textContent = state.reputation;
  $("#progress").textContent =
    Math.floor(state.progress) + "%";

  $("#quality").textContent =
    Math.floor(state.quality);

  $("#qualityBar").value =
    state.quality;

  $("#bugs").textContent =
    Math.floor(state.bugs);

  $("#bugBar").value =
    state.bugs;

  $("#publishBtn").disabled =
    !state.projectActive || state.progress < 100;

  renderShop();
  renderAI();

  $$(".station").forEach((station) => {
    const locked =
      !state.ownedEquipment.has("pc") ||
      !state.projectActive;

    station.classList.toggle("locked", locked);
  });

  if (!state.projectActive) {
    $("#buildStatus").textContent = "OFFLINE";
    $("#buildStatus").style.color = "var(--red)";
  } else if (state.progress >= 100) {
    $("#buildStatus").textContent = "READY";
    $("#buildStatus").style.color = "var(--lime)";
  } else {
    $("#buildStatus").textContent = "PROJECT LIVE";
    $("#buildStatus").style.color = "var(--lime)";
  }
}

/* =========================================================
   PROJECT CREATION
========================================================= */

function startProject() {
  if (!state.ownedEquipment.has("pc")) {
    showToast("Prvo kupi DEV PC.");
    return;
  }

  if (state.projectActive) {
    showToast("Projekat je već aktivan.");
    return;
  }

  const gameName = $("#gameName").value.trim();
  const genre = $("#genre").value;

  if (!gameName) {
    showToast("Unesi naziv igre.");
    return;
  }

  state.projectActive = true;
  state.progress = 0;
  state.quality = 5;
  state.bugs = 4;

  updateTicker(
    `${gameName.toUpperCase()} // ${genre} // RAZVOJ POČINJE`
  );

  renderAll();
}

/* =========================================================
   WORK STATIONS
========================================================= */

function useStation(type, stationElement) {
  if (!state.projectActive) {
    return;
  }

  if (stationElement.classList.contains("locked")) {
    return;
  }

  const selectedAI = state.ai.find((ai) => {
    return ai.id === state.selectedAI;
  });

  if (!selectedAI || selectedAI.messages <= 0) {
    showPaywall(selectedAI);
    return;
  }

  selectedAI.messages -= 1;

  stationElement.classList.add("working");

  setTimeout(() => {
    stationElement.classList.remove("working");
  }, 500);

  const speedBonus =
    state.ownedEquipment.has("monitor")
      ? 1.15
      : 1;

  const correctAI =
    (type === "code" && selectedAI.id === "gpt") ||
    (type === "design" && selectedAI.id === "claude") ||
    (type === "art" && selectedAI.id === "gemini");

  if (type === "test") {
    const testPower =
      state.ownedEquipment.has("test")
        ? 14
        : 8;

    const removedBugs =
      testPower + Math.random() * 5;

    state.bugs = Math.max(
      0,
      state.bugs - removedBugs
    );

    state.progress = Math.min(
      100,
      state.progress + 5 * speedBonus
    );

    showToast("TEST: uklonjeni bagovi.");
  } else {
    const progressGain =
      correctAI ? 14 : 9;

    const qualityGain =
      correctAI ? 6 : 3;

    state.progress = Math.min(
      100,
      state.progress + progressGain * speedBonus
    );

    state.quality = Math.min(
      100,
      state.quality + qualityGain
    );

    if (Math.random() < 0.28) {
      const bugRisk =
        state.ownedEquipment.has("nas")
          ? 3
          : 7;

      state.bugs = Math.min(
        100,
        state.bugs + bugRisk
      );

      showToast(
        "CONSOLE: pojavio se novi bag!"
      );
    }
  }

  if (selectedAI.messages === 0) {
    setTimeout(() => {
      showPaywall(selectedAI);
    }, 450);
  }

  renderAll();
}

/* =========================================================
   PAYWALL
========================================================= */

function showPaywall(ai) {
  const aiName = ai ? ai.name : "AI ALAT";

  $("#eventCard").innerHTML = `
    <p class="eyebrow">
      AI TERMINAL INTERRUPT
    </p>

    <h2>
      YOU ARE OUT OF FREE MESSAGES
    </h2>

    <p>
      ${aiName} je zaključan.<br>
      Sačekaj obnovu ili plati da nastaviš.
    </p>

    <div class="choice-grid">
      <button id="waitChoice">
        SAČEKAJ +20s
      </button>

      <button
        id="payChoice"
        class="danger"
        ${state.money < 299 ? "disabled" : ""}
      >
        MORATE DA PLATITE<br>
        299 €
      </button>
    </div>
  `;

  $("#eventModal").classList.add("active");

  $("#waitChoice").addEventListener("click", () => {
    $("#eventModal").classList.remove("active");

    state.time = Math.max(
      0,
      state.time - 20
    );

    showToast(
      "Vreme prolazi… drugi AI još rade."
    );

    renderAll();
  });

  $("#payChoice").addEventListener("click", () => {
    subscribe(ai ? ai.id : null);

    $("#eventModal").classList.remove("active");
  });
}

function subscribe(aiId = null) {
  if (state.money < 299) {
    showToast("Nemaš dovoljno novca.");
    return;
  }

  const targets = aiId
    ? state.ai.filter((ai) => ai.id === aiId)
    : state.ai.filter((ai) => ai.messages <= 0);

  if (targets.length === 0) {
    return;
  }

  state.money -= 299;

  targets.forEach((ai) => {
    ai.messages = ai.maxMessages;
  });

  showToast(
    "TURBO SUBSCRIPTION AKTIVAN."
  );

  renderAll();
}

/* =========================================================
   BUILD AND PUBLISH
========================================================= */

function publishGame() {
  const gameName =
    $("#gameName").value.trim();

  const genre =
    $("#genre").value;

  const audioBonus =
    state.ownedEquipment.has("audio")
      ? 8
      : 0;

  const assetBonus =
    state.ownedEquipment.has("assets")
      ? 12
      : 0;

  const finalScore = Math.max(
    5,
    Math.min(
      100,
      state.quality +
      audioBonus +
      assetBonus -
      state.bugs * 1.2
    )
  );

  const genreDemand = {
    "Pucačina": 1.2,
    "Vožnja": 1.12,
    "Sport": 1,
    "Strategija": 1.08,
    "Avantura": 1.05,
    "Logička": 0.95,
    "Slagalica": 0.9,
    "Dečija": 1.1,
    "18+ zreo sadržaj": 0.82
  };

  const demand =
    genreDemand[genre] || 1;

  const sales = Math.floor(
    (180 + Math.random() * 620) *
    demand *
    (0.45 + finalScore / 100)
  );

  const price = 4.99;

  const revenue = Math.floor(
    sales * price * 0.7
  );

  state.money += revenue;

  state.reputation += Math.floor(
    finalScore / 10
  );

  state.projectActive = false;

  $("#eventCard").innerHTML = `
    <p class="eyebrow">
      BUILD SUCCESSFUL
    </p>

    <h2>${gameName}</h2>

    <p>
      Žanr: <b>${genre}</b><br>
      Ocena korisnika:
      <b>${Math.floor(finalScore)}%</b><br>
      Prodato:
      <b>${sales}</b><br>
      Neto prihod:
      <b>${formatMoney(revenue)}</b>
    </p>

    <button
      id="continueBtn"
      class="primary"
    >
      SLEDEĆA IGRA
    </button>
  `;

  $("#eventModal").classList.add("active");

  $("#continueBtn").addEventListener("click", () => {
    $("#eventModal").classList.remove("active");
    renderAll();
  });

  renderAll();
}

/* =========================================================
   END GAME
========================================================= */

function endGame() {
  clearInterval(state.timer);

  state.gameActive = false;

  const studioResult =
    state.money > 20000
      ? "STUDIO PREŽIVEO"
      : "BUDŽET U OPASNOSTI";

  $("#eventCard").innerHTML = `
    <p class="eyebrow">
      SHIFT COMPLETE
    </p>

    <h2>${studioResult}</h2>

    <p>
      Budžet:
      <b>${formatMoney(state.money)}</b><br>

      Reputacija:
      <b>${state.reputation}</b>
    </p>

    <button
      id="restartBtn"
      class="primary"
    >
      NOVA PARTIJA
    </button>
  `;

  $("#eventModal").classList.add("active");

  $("#restartBtn").addEventListener("click", () => {
    window.location.reload();
  });
}

/* =========================================================
   GAME TIMER
========================================================= */

function gameTick() {
  if (!state.gameActive) {
    return;
  }

  state.time -= 1;

  if (
    state.projectActive &&
    Math.random() < 0.025
  ) {
    state.bugs = Math.min(
      100,
      state.bugs + 1
    );
  }

  if (state.time <= 0) {
    state.time = 0;
    renderAll();
    endGame();
    return;
  }

  renderAll();
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

$("#startBtn").addEventListener("click", () => {
  $("#boot").classList.remove("active");

  resetGame();

  state.timer = setInterval(
    gameTick,
    1000
  );
});

$("#newProjectBtn").addEventListener(
  "click",
  startProject
);

$("#publishBtn").addEventListener(
  "click",
  publishGame
);

$("#subscribeBtn").addEventListener(
  "click",
  () => subscribe()
);

$$(".station").forEach((station) => {
  station.addEventListener("click", () => {
    useStation(
      station.dataset.station,
      station
    );
  });
});
