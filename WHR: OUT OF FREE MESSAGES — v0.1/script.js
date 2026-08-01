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

class StudioSim {
  constructor() {
    this.elements = {
      budget: $("budgetDisplay"),
      messages: $("messagesDisplay"),
      build: $("buildDisplay"),
      bugs: $("bugsDisplay"),
      staff: $("staffDisplay"),
      console: $("consoleLog"),
      soundBtn: $("soundBtn"),
      soundIcon: $("soundIcon"),
      hireModalBtn: $("hireModalBtn"),
      upgradeModalBtn: $("upgradeModalBtn"),
      aiSubscribeBtn: $("aiSubscribeBtn"),
      btnNewProject: $("btnNewProject"),
      btnCompileBuild: $("btnCompileBuild"),
      btnPublishGame: $("btnPublishGame"),
      modalLimit: $("modalLimit"),
      modalProject: $("modalProject"),
      modalHire: $("modalHire"),
      modalUpgrade: $("modalUpgrade"),
      btnBuyMessages: $("btnBuyMessages"),
      btnCloseProjectModal: $("btnCloseProjectModal"),
      btnCloseHireModal: $("btnCloseHireModal"),
      btnCloseUpgradeModal: $("btnCloseUpgradeModal"),
      workersContainer: $("workersContainer")
    };

    this.audio = new AudioFX();
    this.budget = CONFIG.startingBudget;
    this.maxAiMessages = CONFIG.maxAiMessages;
    this.aiMessages = this.maxAiMessages;
    this.buildProgress = 0;
    this.bugs = 0;
    this.staffCount = 3;
    this.currentProject = null;

    // Upgrades & Perks
    this.perks = {
      seniorDev: false,
      promptEng: false,
      qaTester: false,
      gpuCluster: false,
      quantumServer: false,
      cyberDesks: false
    };

    this.bindEvents();
    this.startWorkerAI();
    this.startAutoQaTimer();
    this.updateUI();
  }

  bindEvents() {
    this.elements.soundBtn.onclick = () => {
      this.audio.toggle();
      this.elements.soundIcon.textContent = this.audio.enabled ? "◉" : "○";
    };

    this.elements.aiSubscribeBtn.onclick = () => this.showModal("modalLimit", true);
    this.elements.btnBuyMessages.onclick = () => this.buyAiMessages();

    this.elements.btnNewProject.onclick = () => this.showModal("modalProject", true);
    this.elements.btnCloseProjectModal.onclick = () => this.showModal("modalProject", false);

    // Modali za Hire i Upgrade
    this.elements.hireModalBtn.onclick = () => this.showModal("modalHire", true);
    this.elements.btnCloseHireModal.onclick = () => this.showModal("modalHire", false);

    this.elements.upgradeModalBtn.onclick = () => this.showModal("modalUpgrade", true);
    this.elements.btnCloseUpgradeModal.onclick = () => this.showModal("modalUpgrade", false);

    // Zaposljavanje Radnika
    $("hireSeniorDev").onclick = () => this.hireWorker("seniorDev", 3500, "SENIOR DEV");
    $("hirePromptEng").onclick = () => this.hireWorker("promptEng", 2800, "PROMPT ENGINEER");
    $("hireQaTester").onclick = () => this.hireWorker("qaTester", 2000, "QA TESTER");

    // Upgrade Opreme
    $("upgGpu").onclick = () => this.buyUpgrade("gpuCluster", 5000, "RTX 5090 GPU CLUSTER");
    $("upgServer").onclick = () => this.buyUpgrade("quantumServer", 7500, "QUANTUM AI SERVER");
    $("upgDesks").onclick = () => this.buyUpgrade("cyberDesks", 3000, "ERGONOMIC CYBER DESKS");

    document.querySelectorAll(".project-card[data-genre]").forEach(card => {
      card.onclick = () => {
        const genre = card.dataset.genre;
        this.selectProject(genre);
      };
    });

    document.querySelectorAll(".station-node").forEach(station => {
      station.onclick = () => {
        const stationType = station.dataset.station;
        this.workOnStation(stationType, station);
      };
    });

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

  hireWorker(perkKey, cost, name) {
    if (this.perks[perkKey]) {
      this.log(`${name} je već zaposlen u tvom timu!`, "warning");
      return;
    }
    if (this.budget < cost) {
      this.log(`Nemate dovoljno budžeta za zapošljavanje: ${name} (${cost} €)!`, "error");
      this.audio.warn();
      return;
    }

    this.budget -= cost;
    this.perks[perkKey] = true;
    this.staffCount++;

    // Dodaj novog radnika vizuelno na mapu
    const w = document.createElement("div");
    w.className = "worker-avatar worker--hired";
    w.textContent = name.split(" ")[0];
    w.style.top = "50%";
    w.style.left = "50%";
    this.elements.workersContainer.appendChild(w);

    this.log(`USPEŠNO ZAPOŠLJAVANJE! ${name} je stigao u kancelariju.`, "success");
    this.audio.success();
    this.updateUI();
  }

  buyUpgrade(perkKey, cost, name) {
    if (this.perks[perkKey]) {
      this.log(`${name} je već instaliran u kancelariji!`, "warning");
      return;
    }
    if (this.budget < cost) {
      this.log(`Nemate dovoljno novca za upgrade: ${name} (${cost} €)!`, "error");
      this.audio.warn();
      return;
    }

    this.budget -= cost;
    this.perks[perkKey] = true;

    if (perkKey === "quantumServer") {
      this.maxAiMessages = 100;
      this.aiMessages = 100;
      this.log("QUANTUM AI SERVER instaliran! Maksimalan AI limit je povećan na 100 poruka!", "success");
    } else {
      this.log(`UPGRADE INSTALIRAN: ${name}! Ova oprema permanentno ubrazava studio.`, "success");
    }

    this.audio.success();
    this.updateUI();
  }

  buyAiMessages() {
    if (this.budget < CONFIG.refillCost) {
      this.log("Nemaš dovoljno novca za obnovu AI paketa!", "error");
      this.audio.warn();
      return;
    }
    this.budget -= CONFIG.refillCost;
    this.aiMessages = this.maxAiMessages;
    this.log(`Kupljen PRO AI Pack! Restorano na ${this.maxAiMessages} AI poruka.`, "success");
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
      this.log("YOU ARE OUT OF FREE MESSAGES! Obnovite limit preko REFILL dugmeta.", "error");
      this.audio.warn();
      this.showModal("modalLimit", true);
      return;
    }

    // Prompt Engineer Perk: 30% šanse da ne potroši poruku
    if (!this.perks.promptEng || Math.random() > 0.3) {
      this.aiMessages--;
    } else {
      this.log("[PERK: PROMPT ENGINEER] Sačuvana besplatna AI poruka pri radu!", "success");
    }

    this.audio.work();
    element.classList.add("is-working");
    setTimeout(() => element.classList.remove("is-working"), 600);

    let mult = this.perks.cyberDesks ? 1.25 : 1.0;
    let progressGain = 0;
    let newBugs = 0;

    switch (type) {
      case "dev":
        progressGain = (Math.floor(Math.random() * 8) + 5) * mult;
        if (this.perks.seniorDev) progressGain *= 1.5;
        newBugs = this.perks.seniorDev ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3);
        this.log(`[DEVELOPMENT] Kodiranje u toku... Build +${Math.round(progressGain)}%, nastalo bagova: ${newBugs}`, "system");
        break;

      case "design":
        progressGain = (Math.floor(Math.random() * 5) + 3) * mult;
        this.log(`[GAME DESIGN] Balans mehanika spreman. Build +${Math.round(progressGain)}%`, "system");
        break;

      case "art":
        progressGain = (Math.floor(Math.random() * 6) + 4) * mult;
        this.log(`[ART] Cyberpunk 3D asseti izrenderovani! Build +${Math.round(progressGain)}%`, "system");
        break;

      case "audio":
        progressGain = (Math.floor(Math.random() * 4) + 2) * mult;
        this.log(`[AUDIO] Neonski sintetizatori compozovani. Build +${Math.round(progressGain)}%`, "system");
        break;

      case "qa":
        if (this.bugs > 0) {
          const fixed = Math.min(this.bugs, Math.floor(Math.random() * 4) + 2);
          this.bugs -= fixed;
          this.log(`[QA TESTING] Očišćeno ${fixed} bagova iz koda!`, "success");
        } else {
          this.log("[QA TESTING] Kod je čist! Nema bagova.", "system");
        }
        break;

      case "unreal":
        progressGain = (Math.floor(Math.random() * 10) + 8) * mult;
        if (this.perks.gpuCluster) progressGain += 10;
        newBugs = Math.floor(Math.random() * 3);
        this.log(`[UNREAL ENGINE] Pokrenuto kompajliranje Shadera... Build +${Math.round(progressGain)}%, bagova: ${newBugs}`, "warning");
        break;

      case "ai":
        progressGain = 5 * mult;
        this.log("[AI TERMINAL] AI Agenti optimizuju kod i strukturu projekta.", "system");
        break;

      case "server":
        this.log("[SERVER] Backup uspešan. Podaci osigurani na cloud-u.", "system");
        break;
    }

    this.buildProgress = Math.min(100, Math.round(this.buildProgress + progressGain));
    this.bugs += newBugs;
    this.updateUI();
  }

  startAutoQaTimer() {
    // Automatsko čišćenje bagova ako je zaposlen QA Tester
    setInterval(() => {
      if (this.perks.qaTester && this.bugs > 0) {
        this.bugs--;
        this.log("[AUTO QA] QA Tester je u pozadini očistio 1 bag!", "success");
        this.updateUI();
      }
    }, 5000);
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
    
    if (this.bugs > 0) {
      const penalty = this.bugs * 800;
      totalEarned = Math.max(2000, totalEarned - penalty);
      this.log(`Igra objavljena sa ${this.bugs} bagova! Ocene su smanjene. Zarada: ${totalEarned} €`, "warning");
    } else {
      totalEarned += 5000;
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
    setInterval(() => {
      document.querySelectorAll(".worker-avatar").forEach(worker => {
        const top = Math.floor(Math.random() * 60) + 20;
        const left = Math.floor(Math.random() * 70) + 15;
        worker.style.top = `${top}%`;
        worker.style.left = `${left}%`;
      });
    }, 4000);
  }

  updateUI() {
    this.elements.budget.textContent = `${this.budget.toLocaleString()} €`;
    this.elements.messages.textContent = `${this.aiMessages} / ${this.maxAiMessages}`;
    this.elements.build.textContent = `${this.buildProgress}%`;
    this.elements.bugs.textContent = `${this.bugs}`;
    this.elements.staff.textContent = `${this.staffCount}`;

    this.elements.btnCompileBuild.disabled = this.buildProgress < 100;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    new StudioSim();
  } catch (err) {
    console.error(err);
    alert("Greška pri pokretanju simulacije v0.2.");
  }
});
