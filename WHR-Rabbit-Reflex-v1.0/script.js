"use strict";

/* WHR Rabbit Reflex v1.1 — independent rabbit/hazard spawning */
const CONFIG = {
  time: 60,
  lives: 3,
  maxLives: 5,
  hitsPerLevel: 10,
  maxLevel: 99,

  rabbitPoints: 250,
  goldenPoints: 1200,
  goldenBonus: 5,
  freezePoints: 500,
  redPenaltyPoints: 500,
  redPenaltyTime: 3,
  decoyPenalty: 300,
  extraLifeChance: 0.045,
  extraLifeStartLevel: 5,
  extraLifeFullPoints: 1500,

  targetLife: 1450,
  hazardLife: 1800,
  netLife: 2300,

  goodBaseDelay: 780,
  goodMinDelay: 260,
  goodDelayStep: 28,
  hazardBaseDelay: 2400,
  hazardMinDelay: 900,
  hazardDelayStep: 55,
  hazardStartLevel: 2,

  maxCombo: 25,
  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled",
};

const $ = (id) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pad = (value) =>
  String(Math.max(0, Math.floor(value))).padStart(8, "0");

class AudioFX {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem(CONFIG.soundKey) !== "false";
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) this.ctx = new AudioContextClass();
  }

  tone(frequency = 440, duration = 0.08, type = "sine", end = frequency) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, end),
      now + duration
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  hit(combo) {
    this.tone(480 + combo * 24, 0.09, "sine", 820 + combo * 24);
  }
  gold() {
    [660, 880, 1100].forEach((frequency, index) =>
      setTimeout(
        () => this.tone(frequency, 0.13, "triangle", frequency * 1.1),
        index * 45
      )
    );
  }
  freeze() {
    [900, 700, 500].forEach((frequency, index) =>
      setTimeout(
        () => this.tone(frequency, 0.15, "sine", frequency * 0.8),
        index * 50
      )
    );
  }
  red() {
    [200, 150, 100].forEach((frequency, index) =>
      setTimeout(
        () => this.tone(frequency, 0.18, "sawtooth", frequency * 0.6),
        index * 60
      )
    );
  }
  life() {
    [520, 660, 880, 1040].forEach((frequency, index) =>
      setTimeout(
        () => this.tone(frequency, 0.14, "triangle", frequency * 1.12),
        index * 45
      )
    );
  }
  bad() {
    this.tone(190, 0.24, "sawtooth", 55);
  }
  level() {
    [440, 554, 659, 880].forEach((frequency, index) =>
      setTimeout(
        () => this.tone(frequency, 0.16, "sine", frequency * 1.05),
        index * 65
      )
    );
  }
  click() {
    this.tone(500, 0.07, "sine", 720);
  }
  over() {
    [420, 320, 230, 150].forEach((frequency, index) =>
      setTimeout(
        () => this.tone(frequency, 0.2, "sawtooth", frequency * 0.7),
        index * 90
      )
    );
  }
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(CONFIG.soundKey, String(this.enabled));
    if (this.enabled) this.click();
    return this.enabled;
  }
}

class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.items = [];
    this.last = 0;
    this.resize = () => {
      const rect = canvas.getBoundingClientRect();
      const density = Math.min(devicePixelRatio || 1, 2);
      canvas.width = rect.width * density;
      canvas.height = rect.height * density;
      if (this.context.resetTransform) this.context.resetTransform();
      else this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.scale(density, density);
    };
    addEventListener("resize", this.resize);
    this.resize();
    requestAnimationFrame((time) => this.loop(time));
  }

  burst(x, y, color, count = 18) {
    for (let index = 0; index < count; index++) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.4;
      const speed = 2 + Math.random() * 4;
      const life = 350 + Math.random() * 350;
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color,
        size: 1 + Math.random() * 3,
      });
    }
  }

  loop(time) {
    const delta = Math.min(32, time - (this.last || time));
    this.last = time;
    const rect = this.canvas.getBoundingClientRect();
    this.context.clearRect(0, 0, rect.width, rect.height);
    this.items = this.items.filter((particle) => {
      particle.life -= delta;
      if (particle.life <= 0) return false;
      particle.x += (particle.vx * delta) / 16.7;
      particle.y += (particle.vy * delta) / 16.7;
      particle.vy += (0.06 * delta) / 16.7;
      this.context.save();
      this.context.globalAlpha = particle.life / particle.maxLife;
      this.context.fillStyle = particle.color;
      this.context.shadowColor = particle.color;
      this.context.shadowBlur = 8;
      this.context.beginPath();
      this.context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.context.fill();
      this.context.restore();
      return true;
    });
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }
}

class Game {
  constructor() {
    this.e = {
      stage: $("gameStage"),
      layer: $("targetLayer"),
      canvas: $("particleCanvas"),
      cross: $("crosshair"),
      startO: $("startOverlay"),
      countO: $("countdownOverlay"),
      pauseO: $("pauseOverlay"),
      overO: $("gameOverOverlay"),
      start: $("startButton"),
      restart: $("restartButton"),
      pause: $("pauseButton"),
      resume: $("resumeButton"),
      sound: $("soundButton"),
      soundIcon: $("soundIcon"),
      count: $("countdownValue"),
      score: $("scoreValue"),
      best: $("bestScoreValue"),
      combo: $("comboValue"),
      comboCard: $("comboCard"),
      level: $("levelValue"),
      time: $("timeValue"),
      status: $("statusText"),
      lives: $("livesContainer"),
      progressText: $("progressText"),
      progressFill: $("progressFill"),
      float: $("floatingMessage"),
      floatMain: document.querySelector(".floating-message__main"),
      floatSub: document.querySelector(".floating-message__sub"),
      finalScore: $("finalScoreValue"),
      finalBest: $("finalBestValue"),
      finalCombo: $("finalComboValue"),
      finalAcc: $("finalAccuracyValue"),
      rank: $("resultRank"),
      record: $("newRecordMessage"),
    };

    this.audio = new AudioFX();
    this.particles = new Particles(this.e.canvas);
    this.best = Number(localStorage.getItem(CONFIG.bestKey)) || 0;
    this.targets = new Map();
    this.state = "ready";
    this.starting = false;
    this.isFrozen = false;
    this.goodSpawnTimer = null;
    this.hazardSpawnTimer = null;
    this.freezeTimer = null;
    this.goodDueAt = 0;
    this.hazardDueAt = 0;
    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.freezeExpiresAt = 0;
    this.freezeRemaining = 0;
    this.bind();
    this.ensureLifeSlots();
    this.reset();
    this.show(this.e.startO, true);
    this.updateSound();
  }

  bind() {
    this.e.start.onclick = () => this.start();
    this.e.restart.onclick = () => this.start();
    this.e.pause.onclick = () => this.togglePause();
    this.e.resume.onclick = () => this.resume();
    this.e.sound.onclick = () => {
      this.audio.toggle();
      this.updateSound();
    };

    this.e.stage.addEventListener("pointermove", (event) => {
      const rect = this.e.stage.getBoundingClientRect();
      this.e.cross.style.left = `${event.clientX - rect.left}px`;
      this.e.cross.style.top = `${event.clientY - rect.top}px`;
      this.e.cross.style.opacity = "1";
    });
    this.e.stage.addEventListener("pointerleave", () => {
      this.e.cross.style.opacity = "0";
    });
    this.e.stage.addEventListener("pointerdown", (event) => {
      if (this.state === "playing" && !event.target.closest(".target")) {
        this.emptyTap();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (this.state === "ready" || this.state === "gameover") this.start();
        else if (this.state === "playing") this.pause();
        else if (this.state === "paused") this.resume();
      }
      if (event.code === "Escape" && this.state === "playing") this.pause();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "playing") this.pause();
    });
  }

  reset() {
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.freezeTimer);
    this.removeAllTargets();
    this.isFrozen = false;
    this.e.stage.classList.remove("is-frozen");
    this.score = 0;
    this.level = 1;
    this.levelHits = 0;
    this.comboCount = 0;
    this.mult = 1;
    this.maxCombo = 1;
    this.lives = CONFIG.lives;
    this.timeLeft = CONFIG.time;
    this.hits = 0;
    this.attempts = 0;
    this.taps = 0;
    this.last = 0;
    this.goodDueAt = 0;
    this.hazardDueAt = 0;
    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.freezeExpiresAt = 0;
    this.freezeRemaining = 0;
    this.update();
  }

  show(element, visible) {
    element.classList.toggle("stage-overlay--visible", visible);
  }

  ensureLifeSlots() {
    while (this.e.lives.children.length < CONFIG.maxLives) {
      const life = document.createElement("span");
      life.className = "life life--lost";
      life.textContent = "◆";
      this.e.lives.appendChild(life);
    }
  }

  async start() {
    if (this.starting) return;
    this.starting = true;
    this.reset();
    this.state = "countdown";
    this.show(this.e.startO, false);
    this.show(this.e.overO, false);
    this.show(this.e.pauseO, false);
    this.show(this.e.countO, true);
    this.audio.click();

    for (const value of ["3", "2", "1", "GO"]) {
      if (this.state !== "countdown") {
        this.starting = false;
        return;
      }
      this.e.count.textContent = value;
      this.audio.tone(
        value === "GO" ? 760 : 300 + Number(value) * 60,
        0.12,
        "square",
        value === "GO" ? 1100 : 500
      );
      await sleep(value === "GO" ? 500 : 700);
    }

    this.show(this.e.countO, false);
    this.state = "playing";
    this.e.pause.disabled = false;
    this.setStatus("TARGET ACQUISITION", "normal");
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.loop(time));
    this.scheduleGood(250);
    this.scheduleHazard(1500);
    this.starting = false;
  }

  loop(time) {
    if (this.state !== "playing") return;
    let delta = Math.min(0.1, (time - (this.last || time)) / 1000);
    this.last = time;
    if (this.isFrozen) delta *= 0.5;
    this.timeLeft = Math.max(0, this.timeLeft - delta);
    this.e.time.textContent = this.timeLeft.toFixed(1);
    document
      .querySelector(".timer-display")
      ?.classList.toggle("is-critical", this.timeLeft <= 8);

    const now = performance.now();
    for (const target of this.targets.values()) {
      const progress = clamp(1 - (now - target.spawnAt) / target.life, 0, 1);
      target.element.style.setProperty("--life-progress", progress);
    }

    if (this.timeLeft <= 0) return this.finish();
    this.raf = requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  goodDelay() {
    const delay = Math.max(
      CONFIG.goodMinDelay,
      CONFIG.goodBaseDelay - (this.level - 1) * CONFIG.goodDelayStep
    );
    return this.isFrozen ? delay * 1.8 : delay;
  }

  hazardDelay() {
    const delay = Math.max(
      CONFIG.hazardMinDelay,
      CONFIG.hazardBaseDelay -
        (this.level - CONFIG.hazardStartLevel) * CONFIG.hazardDelayStep
    );
    const variation = 0.8 + Math.random() * 0.45;
    return (this.isFrozen ? delay * 1.8 : delay) * variation;
  }

  maxGoodTargets() {
    if (this.level >= 12) return 3;
    if (this.level >= 5) return 2;
    return 1;
  }

  maxHazards() {
    return this.level >= 10 ? 2 : 1;
  }

  countGroup(group) {
    return [...this.targets.values()].filter((target) => target.group === group)
      .length;
  }

  scheduleGood(delay = this.goodDelay()) {
    clearTimeout(this.goodSpawnTimer);
    this.goodDueAt = performance.now() + delay;
    this.goodSpawnTimer = setTimeout(() => {
      this.goodDueAt = 0;
      if (
        this.state === "playing" &&
        this.countGroup("good") < this.maxGoodTargets()
      ) {
        this.spawn(this.pickGoodType(), "good");
      }
      if (this.state === "playing") this.scheduleGood();
    }, delay);
  }

  scheduleHazard(delay = this.hazardDelay()) {
    clearTimeout(this.hazardSpawnTimer);
    this.hazardDueAt = performance.now() + delay;
    this.hazardSpawnTimer = setTimeout(() => {
      this.hazardDueAt = 0;
      if (
        this.state === "playing" &&
        this.level >= CONFIG.hazardStartLevel &&
        this.countGroup("hazard") < this.maxHazards()
      ) {
        this.spawn(this.pickHazardType(), "hazard");
      }
      if (this.state === "playing") this.scheduleHazard();
    }, delay);
  }

  pickGoodType() {
    const roll = Math.random();
    const lifeChance =
      this.level >= CONFIG.extraLifeStartLevel ? CONFIG.extraLifeChance : 0;
    const goldenChance = Math.min(0.07 + (this.level - 1) * 0.003, 0.13);
    const freezeChance = Math.min(0.035 + (this.level - 1) * 0.003, 0.075);
    if (roll < lifeChance) return "life";
    if (roll < lifeChance + goldenChance) return "golden";
    if (roll < lifeChance + goldenChance + freezeChance) return "freeze";
    return "rabbit";
  }

  pickHazardType() {
    const roll = Math.random();
    const netChance = this.level >= 3 ? Math.min(0.22 + this.level * 0.01, 0.36) : 0;
    const decoyChance = Math.min(0.28 + this.level * 0.006, 0.38);
    if (roll < netChance) return "net";
    if (roll < netChance + decoyChance) return "decoy";
    return "redrabbit";
  }

  targetLife(type) {
    let life = CONFIG.targetLife;
    if (type === "net") life = CONFIG.netLife;
    else if (["redrabbit", "decoy"].includes(type)) life = CONFIG.hazardLife;
    return this.isFrozen ? life * 1.8 : life;
  }

  findSpawnPosition(size, rect) {
    const margin = size / 2 + 18;
    let fallback = { x: rect.width / 2, y: rect.height / 2 };
    for (let attempt = 0; attempt < 50; attempt++) {
      const point = {
        x: margin + Math.random() * Math.max(1, rect.width - margin * 2),
        y: margin + Math.random() * Math.max(1, rect.height - margin * 2),
      };
      fallback = point;
      const overlaps = [...this.targets.values()].some((target) => {
        const otherSize =
          parseFloat(target.element.style.getPropertyValue("--target-size")) ||
          size;
        return (
          Math.hypot(
            point.x - parseFloat(target.element.style.left),
            point.y - parseFloat(target.element.style.top)
          ) <
          (size + otherSize) / 2 + 14
        );
      });
      if (!overlaps) return point;
    }
    return fallback;
  }

  spawn(type, group) {
    if (this.state !== "playing") return;
    const size = Math.max(
      58,
      (innerWidth < 700 ? 82 : 94) - (this.level - 1) * 1.4
    );
    const rect = this.e.stage.getBoundingClientRect();
    const { x, y } = this.findSpawnPosition(size, rect);
    const button = document.createElement("button");
    button.className = `target target--${type}`;
    button.type = "button";
    button.setAttribute("aria-label", type);
    button.style.setProperty("--target-size", `${size}px`);
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    if (type === "net") {
      button.innerHTML =
        '<span class="target__timer"></span><div class="target__net-grid"></div><span class="target__net-warning">CYBER NET</span>';
    } else {
      button.innerHTML =
        '<span class="target__timer"></span><span class="target__ring"></span><span class="target__core"></span><span class="target__rabbit"><span class="target__rabbit-ear target__rabbit-ear--left"></span><span class="target__rabbit-ear target__rabbit-ear--right"></span><span class="target__rabbit-head"></span><span class="target__rabbit-eye"></span></span>';
      if (type === "life") {
        button.insertAdjacentHTML(
          "beforeend",
          '<span class="target__life-plus">+1</span>'
        );
      }
    }

    const id = Symbol();
    const life = this.targetLife(type);
    const spawnAt = performance.now();
    const timerId = setTimeout(() => this.miss(id), life);
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      this.hit(id, type, button, x, y);
    });
    this.e.layer.appendChild(button);
    requestAnimationFrame(() => button.classList.add("is-spawned"));
    this.targets.set(id, { element: button, type, group, life, spawnAt, timerId });
  }

  hit(id, type, button, x, y) {
    if (this.state !== "playing" || !this.targets.has(id)) return;
    const target = this.targets.get(id);
    clearTimeout(target.timerId);
    this.targets.delete(id);
    this.taps++;
    this.attempts++;
    button.classList.add("is-hit");

    if (type === "life") {
      this.hits++;
      if (this.lives < CONFIG.maxLives) {
        this.lives++;
        this.flash("EXTRA LIFE!", "LIFE +1", "#55ff88");
      } else {
        this.score += CONFIG.extraLifeFullPoints;
        this.flash(
          "LIFE BANK FULL",
          `+${CONFIG.extraLifeFullPoints} PTS`,
          "#55ff88"
        );
      }
      this.audio.life();
      this.effect("is-hit");
      this.setStatus("LIFE RESTORED", "normal");
      this.particles.burst(x, y, "#55ff88", 36);
    } else if (type === "decoy") {
      this.score = Math.max(0, this.score - CONFIG.decoyPenalty);
      this.lives--;
      this.breakCombo();
      this.audio.bad();
      this.flash("DECOY HIT", `-${CONFIG.decoyPenalty}`, "#ff325f");
      this.effect("is-damaged");
      this.setStatus("SYSTEM DAMAGE", "danger");
      this.particles.burst(x, y, "#ff325f", 24);
      if (this.lives <= 0) {
        setTimeout(() => this.finish(), 180);
        return;
      }
    } else if (type === "redrabbit") {
      this.score = Math.max(0, this.score - CONFIG.redPenaltyPoints);
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.redPenaltyTime);
      this.breakCombo();
      this.audio.red();
      this.flash(
        "RED RABBIT HIT!",
        `-${CONFIG.redPenaltyPoints} PTS / -${CONFIG.redPenaltyTime}s`,
        "#ff0033"
      );
      this.effect("is-damaged");
      this.setStatus("CRITICAL ERROR!", "danger");
      this.particles.burst(x, y, "#ff0033", 35);
    } else if (type === "net") {
      this.timeLeft = Math.max(0, this.timeLeft - 1.5);
      this.breakCombo();
      this.audio.bad();
      this.flash("NET TRAP!", "COMBO RESET / -1.5s", "#a855f7");
      this.effect("is-damaged");
      this.setStatus("NETWORK BLOCKED!", "warning");
      this.particles.burst(x, y, "#a855f7", 20);
    } else {
      this.hits++;
      this.comboCount++;
      this.mult = Math.min(CONFIG.maxCombo, 1 + Math.floor(this.comboCount / 3));
      this.maxCombo = Math.max(this.maxCombo, this.mult);

      let points = CONFIG.rabbitPoints;
      if (type === "golden") points = CONFIG.goldenPoints;
      else if (type === "freeze") points = CONFIG.freezePoints;
      points *= this.mult;
      this.score += points;
      this.levelHits++;

      if (type === "golden") {
        this.timeLeft += CONFIG.goldenBonus;
        this.audio.gold();
        this.flash(
          "GOLDEN RABBIT",
          `+${points} / +${CONFIG.goldenBonus.toFixed(1)}s`,
          "#ffd34d"
        );
        this.particles.burst(x, y, "#ffd34d", 30);
      } else if (type === "freeze") {
        this.applyFreeze();
        this.audio.freeze();
        this.flash("FREEZE RABBIT", `TIME SLOWED! +${points}`, "#00f5ff");
        this.particles.burst(x, y, "#00f5ff", 30);
      } else {
        this.audio.hit(this.mult);
        this.flash("DIRECT HIT", `+${points}`, "#00f5ff");
        this.particles.burst(x, y, "#00f5ff", 20);
      }
      this.effect("is-hit");
      this.setStatus("TARGET CONFIRMED", "normal");
      if (this.levelHits >= CONFIG.hitsPerLevel) this.levelUp();
    }

    setTimeout(() => button.remove(), 230);
    this.update();
  }

  applyFreeze() {
    this.isFrozen = true;
    this.e.stage.classList.add("is-frozen");
    clearTimeout(this.freezeTimer);
    this.freezeExpiresAt = performance.now() + 4000;
    this.freezeTimer = setTimeout(() => {
      this.isFrozen = false;
      this.freezeExpiresAt = 0;
      this.e.stage.classList.remove("is-frozen");
    }, 4000);
  }

  miss(id) {
    if (!this.targets.has(id) || this.state !== "playing") return;
    const target = this.targets.get(id);
    this.targets.delete(id);
    target.element.classList.add("is-expiring");
    setTimeout(() => target.element.remove(), 180);

    const harmlessToIgnore = ["decoy", "redrabbit", "net", "life"].includes(
      target.type
    );
    if (!harmlessToIgnore) {
      this.attempts++;
      this.breakCombo();
      this.lives--;
      this.audio.bad();
      this.flash("TARGET ESCAPED", "LIFE -1", "#ff325f");
      this.effect("is-damaged");
      this.setStatus("TARGET ESCAPED", "warning");
      if (this.lives <= 0) return this.finish();
    }
    this.update();
  }

  emptyTap() {
    this.taps++;
    this.breakCombo();
    this.audio.tone(180, 0.08, "triangle", 130);
    this.flash("MISS", "COMBO RESET", "#8fa3b8");
    this.update();
  }

  levelUp() {
    this.levelHits = 0;
    if (this.level < CONFIG.maxLevel) this.level++;
    this.audio.level();
    this.effect("is-level-up");
    this.flash(
      `LEVEL ${String(this.level).padStart(2, "0")}`,
      "RABBIT FLOW INCREASED!",
      "#ffd34d"
    );
    this.setStatus("LEVEL ADVANCED", "normal");
  }

  breakCombo() {
    this.comboCount = 0;
    this.mult = 1;
  }

  removeAllTargets() {
    for (const target of this.targets.values()) {
      clearTimeout(target.timerId);
      target.element.remove();
    }
    this.targets.clear();
  }

  pause() {
    if (this.state !== "playing") return;
    const now = performance.now();
    this.state = "paused";
    if (this.raf) cancelAnimationFrame(this.raf);
    this.goodRemaining = this.goodDueAt
      ? Math.max(1, this.goodDueAt - now)
      : this.goodDelay();
    this.hazardRemaining = this.hazardDueAt
      ? Math.max(1, this.hazardDueAt - now)
      : this.hazardDelay();
    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    this.goodDueAt = 0;
    this.hazardDueAt = 0;

    for (const target of this.targets.values()) {
      clearTimeout(target.timerId);
      target.remaining = Math.max(1, target.life - (now - target.spawnAt));
    }
    if (this.isFrozen && this.freezeExpiresAt) {
      this.freezeRemaining = Math.max(1, this.freezeExpiresAt - now);
      clearTimeout(this.freezeTimer);
      this.freezeExpiresAt = 0;
    }
    this.e.layer
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.pause());
    this.show(this.e.pauseO, true);
    this.e.pause.disabled = true;
    this.setStatus("SYSTEM SUSPENDED", "warning");
  }

  resume() {
    if (this.state !== "paused") return;
    const now = performance.now();
    this.show(this.e.pauseO, false);
    this.state = "playing";
    this.e.pause.disabled = false;
    this.last = now;

    for (const [id, target] of this.targets.entries()) {
      const remaining = Math.max(1, target.remaining ?? target.life);
      target.spawnAt = now - (target.life - remaining);
      target.timerId = setTimeout(() => this.miss(id), remaining);
      delete target.remaining;
    }
    this.e.layer
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.play());
    if (this.isFrozen && this.freezeRemaining > 0) {
      const remaining = this.freezeRemaining;
      this.freezeRemaining = 0;
      this.freezeExpiresAt = now + remaining;
      this.freezeTimer = setTimeout(() => {
        this.isFrozen = false;
        this.freezeExpiresAt = 0;
        this.e.stage.classList.remove("is-frozen");
      }, remaining);
    }
    this.raf = requestAnimationFrame((time) => this.loop(time));
    this.scheduleGood(Math.max(1, this.goodRemaining || this.goodDelay()));
    this.scheduleHazard(
      Math.max(1, this.hazardRemaining || this.hazardDelay())
    );
    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.setStatus("TARGET ACQUISITION", "normal");
    this.audio.click();
  }

  togglePause() {
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  }

  finish() {
    if (this.state === "gameover") return;
    this.state = "gameover";
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.freezeTimer);
    this.removeAllTargets();
    this.e.pause.disabled = true;

    const record = this.score > this.best;
    if (record) {
      this.best = this.score;
      localStorage.setItem(CONFIG.bestKey, String(this.best));
    }
    const accuracy = this.attempts
      ? Math.round((this.hits / this.attempts) * 100)
      : 0;
    this.e.finalScore.textContent = pad(this.score);
    this.e.finalBest.textContent = pad(this.best);
    this.e.finalCombo.textContent = `x${this.maxCombo}`;
    this.e.finalAcc.textContent = `${accuracy}%`;
    this.e.rank.textContent = this.rank();
    this.e.record.classList.toggle("is-visible", record);
    this.update();
    this.show(this.e.overO, true);
    this.setStatus("SESSION COMPLETE", "danger");
    this.audio.over();
  }

  rank() {
    if (this.score >= 500000) return "WHITE HAT GODLIKE";
    if (this.score >= 150000) return "CYBER HUNTER";
    if (this.score >= 50000) return "REFLEX OPERATIVE";
    if (this.score >= 10000) return "RABBIT TRACKER";
    return "REFLEX ROOKIE";
  }

  setStatus(text, type) {
    this.e.status.textContent = text;
    const chip = document.querySelector(".status-chip");
    chip?.classList.toggle("is-danger", type === "danger");
    chip?.classList.toggle("is-warning", type === "warning");
  }

  flash(main, sub, color) {
    this.e.floatMain.textContent = main;
    this.e.floatSub.textContent = sub;
    this.e.float.style.color = color;
    this.e.float.classList.remove("is-visible");
    requestAnimationFrame(() => this.e.float.classList.add("is-visible"));
  }

  effect(className) {
    this.e.stage.classList.remove(className);
    requestAnimationFrame(() => this.e.stage.classList.add(className));
    setTimeout(() => this.e.stage.classList.remove(className), 700);
  }

  updateSound() {
    this.e.sound.setAttribute("aria-pressed", String(this.audio.enabled));
    this.e.soundIcon.textContent = this.audio.enabled ? "ON" : "OFF";
  }

  update() {
    this.e.score.textContent = pad(this.score);
    this.e.best.textContent = pad(this.best);
    this.e.combo.textContent = String(this.mult);
    this.e.level.textContent = String(this.level).padStart(2, "0");
    this.e.time.textContent = this.timeLeft.toFixed(1);
    this.e.comboCard.classList.toggle("is-hot", this.mult >= 3);
    this.e.progressText.textContent = `${this.levelHits} / ${CONFIG.hitsPerLevel}`;
    this.e.progressFill.style.width = `${
      (this.levelHits / CONFIG.hitsPerLevel) * 100
    }%`;
    [...this.e.lives.children].forEach((element, index) => {
      element.classList.toggle("life--active", index < this.lives);
      element.classList.toggle("life--lost", index >= this.lives);
    });
  }
}

addEventListener("DOMContentLoaded", () => {
  try {
    new Game();
  } catch (error) {
    console.error(error);
    alert(
      "Igra nije mogla da se pokrene. Proveri da li su index.html, style.css i script.js u istom folderu."
    );
  }
});
