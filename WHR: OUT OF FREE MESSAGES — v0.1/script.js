"use strict";

const CONFIG = {
  startingBudget: 20000,
  maxAiMessages: 50,
  refillCost: 2500,
  refillAmount: 50,
  soundKey: "whr-sim-sound-enabled"
};

const PROJECTS = {
  indie: { name: "INDIE CYBER RUNNER", cost: 5000, requiredBuild: 100, basePrice: 15000 },
  rpg: { name: "CYBERPUNK ACTION RPG", cost: 12000, requiredBuild: 250, basePrice: 45000 },
  aaa: { name: "AAA UNREAL SCI-FI SIM", cost: 18000, requiredBuild: 500, basePrice: 90000 }
};

const $ = id => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
};

/* ==============================
   ZVUČNI EFEKTI (AudioFX)
   ============================== */
class AudioFX {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem(CONFIG.soundKey) !== "false";
  }
  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) this.ctx = new C();
  }
  tone(f = 440, d = .08, type = "sine", end = f) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.15, t + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + d + .02);
  }
  click() { this.tone(520, .06, "sine", 750); }
  work() { this.tone(300, .08, "triangle", 450); }
  warn() { this.tone(180, .2, "sawtooth", 80); }
  success() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, .12, "sine", f * 1.05), i * 50)); }
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(CONFIG.soundKey, String(this.enabled));
    if (this.enabled) this.click();
    return this.enabled;
  }
}

/* ==============================
   GLAVNA LOGIKA IGRE (StudioSim)
   ============================== */
class StudioSim {
  constructor() {
    this.elements = {
      budget: $("budgetDisplay"),
      messages: $("messagesDisplay"),
      build: $("buildDisplay"),
      bugs: $("bugsDisplay"),
      console: $("consoleLog"),
      soundBtn: $("soundBtn"),
      soundIcon: $("soundIcon"),
      aiSubscribeBtn: $("aiSubscribeBtn"),
      btnNewProject: $("btnNewProject"),
      btnCompileBuild: $("btnCompileBuild"),
      btnPublishGame: $("btnPublishGame"),
      modalLimit: $("modalLimit"),
      modalProject: $("modalProject"),
      btnBuyMessages: $("btnBuyMessages"),
      btnCloseProjectModal: $("btnCloseProjectModal"),
      workers: {
        gpt: $("workerChatGPT"),
        claude: $("workerClaude"),
        gemini: $("workerGemini")
      }
    };

    this.audio = new AudioFX();
    this.budget = CONFIG.startingBudget;
    this.aiMessages = CONFIG.maxAiMessages;
    this.buildProgress = 0;
    this.bugs = 0;
    this.currentProject = null;
    this.activeWorkers = 3;

    this.bindEvents();
    this.startWorkerAI();
    this.updateUI();
  }

  bindEvents() {
    // Sound Button
    this.elements.soundBtn.onclick = () => {
      this.audio.toggle();
      this.elements.soundIcon.textContent = this.audio.enabled ? "◉" : "○";
    };

    // Refill AI Messages Modal / Buy
    this.elements.aiSubscribeBtn.onclick = () => this.showModal("modalLimit", true);
    this.elements.btnBuyMessages.onclick = () => this.buyAiMessages();

    // New Project Modal
    this.elements.btnNewProject.onclick = () => this.showModal("modalProject", true);
    this.elements.btnCloseProjectModal.onclick = () => this.showModal("modalProject", false);

    document.querySelectorAll(".project-card").forEach(card => {
      card.onclick = () => {
        const genre = card.dataset.genre;
        this.selectProject(genre);
      };
    });

    // Radne stanice
    document.querySelectorAll(".station-node").forEach(station => {
      station.onclick = () => {
        const stationType = station.dataset.station;
        this.workOnStation(stationType, station);
      };
    });

    // Compile Build & Publish
    this.elements.btnCompileBuild.onclick = () => this.compileBuild();
    this.elements.btnPublishGame.onclick = () => this.publishGame();
  }

  log(msg, type = "system") {
    const p = document.createElement("p");
    p.className = `log-entry ${type}`;
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.elements.console.appendChild(p);
    this.elements.console.scrollTop = this.elements.console.scrollHeight;
  }

  showModal(id, visible) {
    $(id).classList.toggle("is-visible", visible);
    if (visible) this.audio.click();
  }

  buyAiMessages() {
    if (this.budget < CONFIG.refillCost) {
      this.log("Nemaš dovoljno novca za obnovu AI paketa!", "error");
      this.audio.warn();
      return;
    }
    this.budget -= CONFIG.refillCost;
    this.aiMessages += CONFIG.refillAmount;
    this.log(`Kupljen PRO AI Pack! Restorano +${CONFIG.refillAmount} AI poruka.`, "success");
    this.audio.success();
    this.showModal("modalLimit", false);
    this.updateUI();
  }

  selectProject(genre) {
    const proj = PROJECTS[genre];
    if (this.budget < proj.cost) {
      this.log(`Nemate dovoljno budžeta za ${proj.name}! Potrebno: ${proj.cost} €`, "error");
      this.audio.warn();
      return;
    }

    this.budget -= proj.cost;
    this.currentProject = proj;
    this.buildProgress = 0;
    this.bugs = 0;

    this.log(`Započet novi projekat: ${proj.name}. Budžet ulaže ${proj.cost} €!`, "success");
    this.audio.success();
    this.showModal("modalProject", false);
    this.updateUI();
  }

  workOnStation(type, element) {
    if (!this.currentProject) {
      this.log("Morate najpre izabrati Novi Projekat!", "warning");
      this.audio.warn();
      return;
    }

    if (this.aiMessages <= 0) {
      this.log("YOU ARE OUT OF FREE MESSAGES! Obnovite limit u AI Terminalu ili preko REFILL dugmeta.", "error");
      this.audio.warn();
      this.showModal("modalLimit", true);
      return;
    }

    // Oduzimamo 1 AI poruku
    this.aiMessages--;
    this.audio.work();

    element.classList.add("is-working");
    setTimeout(() => element.classList.remove("is-working"), 600);

    let progressGain = 0;
    let newBugs = 0;

    switch (type) {
      case "dev":
        progressGain = Math.floor(Math.random() * 8) + 5;
        newBugs = Math.floor(Math.random() * 3);
        this.log(`[DEVELOPMENT] Kodiranje u toku... Build +${progressGain}%, nastalo bagova: ${newBugs}`, "system");
        break;

      case "design":
        progressGain = Math.floor(Math.random() * 5) + 3;
        this.log(`[GAME DESIGN] Balans mehanika i dizajn nivoa spreman. Build +${progressGain}%`, "system");
        break;

      case "art":
        progressGain = Math.floor(Math.random() * 6) + 4;
        this.log(`[ART] Cyberpunk 3D asseti izrenderovani! Build +${progressGain}%`, "system");
        break;

      case "audio":
        progressGain = Math.floor(Math.random() * 4) + 2;
        this.log(`[AUDIO] Neonski sintetizatori i FX zvuka compozovani. Build +${progressGain}%`, "system");
        break;

      case "qa":
        if (this.bugs > 0) {
          const fixed = Math.min(this.bugs, Math.floor(Math.random() * 4) + 2);
          this.bugs -= fixed;
          this.log(`[QA TESTING] Očišćeno ${fixed} bagova iz koda!`, "success");
        } else {
          this.log("[QA TESTING] Kod je čist! Nema bagova za popravku.", "system");
        }
        break;

      case "unreal":
        progressGain = Math.floor(Math.random() * 10) + 8;
        newBugs = Math.floor(Math.random() * 4);
        this.log(`[UNREAL ENGINE] Pokrenuto kompajliranje Shadera... Build +${progressGain}%, bagova: ${newBugs}`, "warning");
        break;

      case "ai":
        this.log("[AI TERMINAL] ChatGPT, Claude i Gemini generišu optiku i optimizuju projekat.", "system");
        progressGain = 4;
        break;

      case "server":
        this.log("[SERVER] Backup projekta uspešan. Podaci osigurani.", "system");
        break;
    }

    this.buildProgress = Math.min(100, this.buildProgress + progressGain);
    this.bugs += newBugs;
    this.updateUI();
  }

  compileBuild() {
    if (this.buildProgress < 100) {
      this.log("Build mora dostignuti 100% pre nego što se sočini završni paket!", "warning");
      this.audio.warn();
      return;
    }

    if (this.bugs > 5) {
      this.log(`Igra ima previše bagova (${this.bugs})! Očistite ih u Testing (QA) stanici pre objavljivanja!`, "error");
      this.audio.warn();
      return;
    }

    this.log("[UNREAL ENGINE BUILD] Završna verzija je uspešno kompajlirana i spremljena za izdavanje!", "success");
    this.audio.success();
    this.elements.btnPublishGame.disabled = false;
  }

  publishGame() {
    if (!this.currentProject) return;

    let totalEarned = this.currentProject.basePrice;
    
    // Malus ako ima preostalih bagova
    if (this.bugs > 0) {
      const penalty = this.bugs * 800;
      totalEarned = Math.max(2000, totalEarned - penalty);
      this.log(`Igra objavljena sa ${this.bugs} bagova! Ocene su smanjene. Zarada: ${totalEarned} €`, "warning");
    } else {
      totalEarned += 5000; // Bonus za perfektan kod bez bagova!
      this.log(`SAVRŠENO IZDANJE! Igra pobrala ocene 10/10! Zarada: ${totalEarned} €`, "success");
    }

    this.budget += totalEarned;
    this.currentProject = null;
    this.buildProgress = 0;
    this.bugs = 0;
    this.elements.btnPublishGame.disabled = true;

    this.audio.success();
    this.updateUI();
  }

  startWorkerAI() {
    // Nasumično pomeranje AI radnika po kancelariji (RTS animacija radnika)
    setInterval(() => {
      Object.values(this.elements.workers).forEach(worker => {
        const top = Math.floor(Math.random() * 60) + 20;
        const left = Math.floor(Math.random() * 70) + 15;
        worker.style.top = `${top}%`;
        worker.style.left = `${left}%`;
      });
    }, 4000);
  }

  updateUI() {
    this.elements.budget.textContent = `${this.budget.toLocaleString()} €`;
    this.elements.messages.textContent = `${this.aiMessages} / 50`;
    this.elements.build.textContent = `${this.buildProgress}%`;
    this.elements.bugs.textContent = `${this.bugs}`;

    // Status dugmića za build
    this.elements.btnCompileBuild.disabled = this.buildProgress < 100;
  }
}

/* ==============================
   POKRETANJE SIMULACIJE
   ============================== */
window.addEventListener("DOMContentLoaded", () => {
  try {
    new StudioSim();
  } catch (err) {
    console.error(err);
    alert("Greška pri pokretanju simulacije. Proveri da li su HTML/CSS/JS fajlovi u istom folderu.");
  }
});
