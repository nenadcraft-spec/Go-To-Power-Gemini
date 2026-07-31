"use strict";

const CONFIG = {
  time: 60,
  lives: 3,
  maxLives: 5,
  hitsPerLevel: 10,
  maxLevel: 99,
  rabbitPoints: 250,
  goldenPoints: 1200,
  goldenBonus: 5.0,
  freezePoints: 500,
  redPenaltyPoints: 500,
  redPenaltyTime: 3.0,
  decoyPenalty: 300,
  extraLifeChance: 0.10,
  extraLifeStartLevel: 5,
  extraLifeFullPoints: 1500,
  baseLife: 1450,
  minLife: 350,
  lifeStep: 45,
  baseDelay: 760,
  minDelay: 180,
  delayStep: 25,
  comboReset: 1800,
  maxCombo: 25,
  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled",
};

const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(8, "0");

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
  tone(f = 440, d = 0.08, type = "sine", end = f) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain(),
      t = this.ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  }
  hit(c) {
    this.tone(480 + c * 24, 0.09, "sine", 820 + c * 24);
  }
  gold() {
    [660, 880, 1100].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.13, "triangle", f * 1.1), i * 45)
    );
  }
  freeze() {
    [900, 700, 500].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.15, "sine", f * 0.8), i * 50)
    );
  }
  red() {
    [200, 150, 100].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.18, "sawtooth", f * 0.6), i * 60)
    );
  }
  life() {
    [520, 660, 880, 1040].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.14, "triangle", f * 1.12), i * 45)
    );
  }
  bad() {
    this.tone(190, 0.24, "sawtooth", 55);
  }
  level() {
    [440, 554, 659, 880].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.16, "sine", f * 1.05), i * 65)
    );
  }
  click() {
    this.tone(500, 0.07, "sine", 720);
  }
  over() {
    [420, 320, 230, 150].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.2, "sawtooth", f * 0.7), i * 90)
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
    this.c = canvas;
    this.x = canvas.getContext("2d");
    this.p = [];
    this.last = 0;
    this.resize = () => {
      const r = canvas.getBoundingClientRect(),
        d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      this.x.resetTransform?.() || this.x.setTransform(1, 0, 0, 1, 0, 0);
      this.x.scale(d, d);
    };
    addEventListener("resize", this.resize);
    this.resize();
    requestAnimationFrame((t) => this.loop(t));
  }
  burst(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4,
        s = 2 + Math.random() * 4,
        l = 350 + Math.random() * 350;
      this.p.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        l,
        m: l,
        color,
        size: 1 + Math.random() * 3,
      });
    }
  }
  loop(t) {
    const dt = Math.min(32, t - (this.last || t));
    this.last = t;
    const r = this.c.getBoundingClientRect();
    this.x.clearRect(0, 0, r.width, r.height);
    this.p = this.p.filter((p) => {
      p.l -= dt;
      if (p.l <= 0) return false;
      p.x += (p.vx * dt) / 16.7;
      p.y += (p.vy * dt) / 16.7;
      p.vy += (0.06 * dt) / 16.7;
      this.x.save();
      this.x.globalAlpha = p.l / p.m;
      this.x.fillStyle = p.color;
      this.x.shadowColor = p.color;
      this.x.shadowBlur = 8;
      this.x.beginPath();
      this.x.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.x.fill();
      this.x.restore();
      return true;
    });
    requestAnimationFrame((n) => this.loop(n));
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
    this.state = "ready";
    this.starting = false;
    this.targets = new Map();
    this.isFrozen = false;
    this.freezeTimer = null;
    this.spawnDueAt = 0;
    this.spawnRemaining = 0;
    this.comboExpiresAt = 0;
    this.comboRemaining = 0;
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

    this.e.stage.addEventListener("pointermove", (ev) => {
      const r = this.e.stage.getBoundingClientRect();
      this.e.cross.style.left = `${ev.clientX - r.left}px`;
      this.e.cross.style.top = `${ev.clientY - r.top}px`;
      this.e.cross.style.opacity = "1";
    });

    this.e.stage.addEventListener(
      "pointerleave",
      () => (this.e.cross.style.opacity = "0")
    );

    this.e.stage.addEventListener("pointerdown", (ev) => {
      if (this.state !== "playing") return;
      if (!ev.target.closest(".target")) this.emptyTap();
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        if (this.state === "ready" || this.state === "gameover") this.start();
        else if (this.state === "playing") this.pause();
        else if (this.state === "paused") this.resume();
      }
      if (ev.code === "Escape" && this.state === "playing") this.pause();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "playing") this.pause();
    });
  }

  reset() {
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.spawnTimer);
    clearTimeout(this.comboTimer);
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
    this.spawnDueAt = 0;
    this.spawnRemaining = 0;
    this.comboExpiresAt = 0;
    this.comboRemaining = 0;
    this.freezeExpiresAt = 0;
    this.freezeRemaining = 0;
    this.update();
  }

  show(el, on) {
    el.classList.toggle("stage-overlay--visible", on);
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

    for (const v of ["3", "2", "1", "GO"]) {
      if (this.state !== "countdown") {
        this.starting = false;
        return;
      }
      this.e.count.textContent = v;
      this.audio.tone(
        v === "GO" ? 760 : 300 + Number(v) * 60,
        0.12,
        "square",
        v === "GO" ? 1100 : 500
      );
      await sleep(v === "GO" ? 500 : 700);
    }

    this.show(this.e.countO, false);
    this.state = "playing";
    this.e.pause.disabled = false;
    this.setStatus("TARGET ACQUISITION", "normal");
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
    this.schedule(250);
    this.starting = false;
  }

  loop(t) {
    if (this.state !== "playing") return;
    let dt = Math.min(0.1, (t - (this.last || t)) / 1000);
    this.last = t;

    if (this.isFrozen) dt *= 0.5;

    if (!Number.isFinite(this.timeLeft)) this.timeLeft = CONFIG.time;

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.e.time.textContent = this.timeLeft.toFixed(1);

    document
      .querySelector(".timer-display")
      ?.classList.toggle("is-critical", this.timeLeft <= 8);

    const now = performance.now();
    for (const [id, targetData] of this.targets.entries()) {
      const p = clamp(1 - (now - targetData.spawnAt) / targetData.life, 0, 1);
      targetData.element.style.setProperty("--life-progress", p);
    }

    if (this.timeLeft <= 0) {
      this.finish();
      return;
    }
    this.raf = requestAnimationFrame((n) => this.loop(n));
  }

  getMaxSimultaneousTargets() {
    const cap = innerWidth < 700 ? 6 : 8;
    if (this.level < 5) return 1;
    if (this.level < 10) return Math.min(cap, 2 + Math.floor((this.level - 5) / 2));
    return Math.min(cap, 4 + Math.floor((this.level - 10) / 2));
  }

  schedule(delay = this.spawnDelay()) {
    clearTimeout(this.spawnTimer);
    this.spawnDueAt = performance.now() + delay;
    this.spawnTimer = setTimeout(() => {
      this.spawnDueAt = 0;
      const maxTargets = this.getMaxSimultaneousTargets();
      if (this.targets.size < maxTargets) {
        this.spawn();
      }
      this.schedule();
    }, delay);
  }

  spawnDelay() {
    let delay = Math.max(
      CONFIG.minDelay,
      CONFIG.baseDelay - (this.level - 1) * CONFIG.delayStep
    );
    return this.isFrozen ? delay * 1.8 : delay;
  }

  lifetime() {
    let life = Math.max(
      CONFIG.minLife,
      CONFIG.baseLife - (this.level - 1) * CONFIG.lifeStep
    );
    return this.isFrozen ? life * 1.8 : life;
  }

  findSpawnPosition(size, rect) {
    const margin = size / 2 + 18;
    let fallback = { x: rect.width / 2, y: rect.height / 2 };

    for (let attempt = 0; attempt < 40; attempt++) {
      const point = {
        x: margin + Math.random() * Math.max(1, rect.width - margin * 2),
        y: margin + Math.random() * Math.max(1, rect.height - margin * 2),
      };
      fallback = point;

      const overlaps = [...this.targets.values()].some((targetData) => {
        const other = targetData.element;
        const otherSize = parseFloat(other.style.getPropertyValue("--target-size")) || size;
        const dx = point.x - parseFloat(other.style.left);
        const dy = point.y - parseFloat(other.style.top);
        const safeDistance = (size + otherSize) / 2 + 10;
        return Math.hypot(dx, dy) < safeDistance;
      });

      if (!overlaps) return point;
    }

    return fallback;
  }

  spawn() {
    if (this.state !== "playing") return;

    const roll = Math.random();
    const decoyProb = Math.min(0.12 + (this.level - 1) * 0.012, 0.28);
    const goldProb = Math.min(0.08 + (this.level - 1) * 0.004, 0.15);
    const freezeProb = Math.min(0.08, 0.04 + (this.level - 1) * 0.005);
    const redProb = Math.min(0.18, 0.06 + (this.level - 1) * 0.012); // CRVENI ZEC
    const netProb =
      this.level >= 3 ? Math.min(0.12, 0.03 + (this.level - 3) * 0.01) : 0;
    const lifeProb =
      this.level >= CONFIG.extraLifeStartLevel ? CONFIG.extraLifeChance : 0;

    let type = "rabbit";
    if (roll < lifeProb) type = "life";
    else if (roll < lifeProb + goldProb) type = "golden";
    else if (roll < lifeProb + goldProb + freezeProb) type = "freeze";
    else if (roll < lifeProb + goldProb + freezeProb + redProb)
      type = "redrabbit"; // CRVENI ZEC (OPASAN)
    else if (roll < lifeProb + goldProb + freezeProb + redProb + netProb) type = "net";
    else if (roll < lifeProb + goldProb + freezeProb + redProb + netProb + decoyProb)
      type = "decoy";

    const size = Math.max(
      58,
      (innerWidth < 700 ? 82 : 94) - (this.level - 1) * 1.8
    );

    const r = this.e.stage.getBoundingClientRect();
    const position = this.findSpawnPosition(size, r);
    const { x, y } = position;

    const b = document.createElement("button");
    b.className = `target target--${type}`;
    b.type = "button";
    b.setAttribute("aria-label", type);
    b.style.setProperty("--target-size", `${size}px`);
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;

    if (type === "net") {
      b.innerHTML =
        '<span class="target__timer"></span><div class="target__net-grid"></div><span class="target__net-warning">CYBER NET</span>';
    } else {
      b.innerHTML =
        '<span class="target__timer"></span><span class="target__ring"></span><span class="target__core"></span><span class="target__rabbit"><span class="target__rabbit-ear target__rabbit-ear--left"></span><span class="target__rabbit-ear target__rabbit-ear--right"></span><span class="target__rabbit-head"></span><span class="target__rabbit-eye"></span></span>';
      if (type === "life") {
        b.insertAdjacentHTML("beforeend", '<span class="target__life-plus">+1</span>');
      }
    }

    const id = Symbol();
    const life = this.lifetime();
    const spawnAt = performance.now();

    const timerId = setTimeout(() => this.miss(id), life);

    b.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      this.hit(id, type, b, x, y);
    });

    this.e.layer.appendChild(b);
    requestAnimationFrame(() => b.classList.add("is-spawned"));

    this.targets.set(id, { element: b, type, life, spawnAt, timerId });
  }

  hit(id, type, b, x, y) {
    if (this.state !== "playing" || !this.targets.has(id)) return;
    const targetData = this.targets.get(id);
    clearTimeout(targetData.timerId);
    this.targets.delete(id);

    this.taps++;
    this.attempts++;
    b.classList.add("is-hit");

    if (type === "life") {
      this.hits++;
      if (this.lives < CONFIG.maxLives) {
        this.lives++;
        this.flash("EXTRA LIFE!", "LIFE +1", "#55ff88");
      } else {
        this.score += CONFIG.extraLifeFullPoints;
        this.flash("LIFE BANK FULL", `+${CONFIG.extraLifeFullPoints} PTS`, "#55ff88");
      }
      this.audio.life();
      this.effect("is-hit");
      this.setStatus("LIFE RESTORED", "normal");
      this.particles.burst(x, y, "#55ff88", 36);
    } else if (type === "decoy") {
      this.score = Math.max(0, this.score - (CONFIG.decoyPenalty || 300));
      this.lives--;
      this.breakCombo();
      this.audio.bad();
      this.flash("DECOY HIT", `-${CONFIG.decoyPenalty || 300}`, "#ff325f");
      this.effect("is-damaged");
      this.setStatus("SYSTEM DAMAGE", "danger");
      this.particles.burst(x, y, "#ff325f", 24);
      if (this.lives <= 0) {
        setTimeout(() => this.finish(), 180);
        return;
      }
    } else if (type === "redrabbit") {
      // ðŸ”´ CRVENI ZEC: SKIDA POENE I VREME!
      const penaltyPts = CONFIG.redPenaltyPoints || 500;
      const penaltyTime = CONFIG.redPenaltyTime || 3.0;

      this.score = Math.max(0, this.score - penaltyPts);
      this.timeLeft = Math.max(0, this.timeLeft - penaltyTime);
      this.breakCombo();
      this.audio.red();
      this.flash(
        "RED RABBIT HIT!",
        `-${penaltyPts} PTS / -${penaltyTime}s`,
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
      this.mult = Math.min(
        CONFIG.maxCombo,
        1 + Math.floor(this.comboCount / 3)
      );
      this.maxCombo = Math.max(this.maxCombo, this.mult);

      let pts = CONFIG.rabbitPoints;
      if (type === "golden") pts = CONFIG.goldenPoints;
      else if (type === "freeze") pts = CONFIG.freezePoints;

      pts *= this.mult;
      this.score += pts;
      this.levelHits++;

      if (type === "golden") {
        this.timeLeft += CONFIG.goldenBonus;
        this.audio.gold();
        this.flash(
          "GOLDEN RABBIT",
          `+${pts} / +${CONFIG.goldenBonus.toFixed(1)}s`,
          "#ffd34d"
        );
        this.particles.burst(x, y, "#ffd34d", 30);
      } else if (type === "freeze") {
        this.applyFreeze();
        this.audio.freeze();
        this.flash("FREEZE RABBIT", `TIME SLOWED! +${pts}`, "#00f5ff");
        this.particles.burst(x, y, "#00f5ff", 30);
      } else {
        this.audio.hit(this.mult);
        this.flash("DIRECT HIT", `+${pts}`, "#00f5ff");
        this.particles.burst(x, y, "#00f5ff", 20);
      }

      this.effect("is-hit");
      this.setStatus("TARGET CONFIRMED", "normal");

      clearTimeout(this.comboTimer);
      this.comboExpiresAt = performance.now() + CONFIG.comboReset;
      this.comboTimer = setTimeout(() => {
        this.breakCombo();
        this.update();
      }, CONFIG.comboReset);

      if (this.levelHits >= CONFIG.hitsPerLevel) this.levelUp();
    }

    setTimeout(() => b.remove(), 230);
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
    const targetData = this.targets.get(id);
    const isBadType =
      targetData.type === "decoy" ||
      targetData.type === "redrabbit" ||
      targetData.type === "net" ||
      targetData.type === "life";
    const b = targetData.element;

    this.targets.delete(id);
    b.classList.add("is-expiring");
    setTimeout(() => b.remove(), 180);

    if (!isBadType) {
      this.attempts++;
      this.breakCombo();
      this.lives--;
      this.audio.bad();
      this.flash("TARGET ESCAPED", "LIFE -1", "#ff325f");
      this.effect("is-damaged");
      this.setStatus("TARGET ESCAPED", "warning");
      if (this.lives <= 0) {
        this.finish();
        return;
      }
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
      "SYSTEM SPEED & TARGETS UP!",
      "#ffd34d"
    );
    this.setStatus("LEVEL ADVANCED", "normal");
  }

  breakCombo() {
    this.comboCount = 0;
    this.mult = 1;
    clearTimeout(this.comboTimer);
    this.comboExpiresAt = 0;
    this.comboRemaining = 0;
  }

  removeAllTargets() {
    for (const [id, targetData] of this.targets.entries()) {
      clearTimeout(targetData.timerId);
      targetData.element.remove();
    }
    this.targets.clear();
  }

  pause() {
    if (this.state !== "playing") return;
    const now = performance.now();
    this.state = "paused";
    if (this.raf) cancelAnimationFrame(this.raf);

    this.spawnRemaining = this.spawnDueAt
      ? Math.max(0, this.spawnDueAt - now)
      : this.spawnDelay();
    clearTimeout(this.spawnTimer);
    this.spawnDueAt = 0;

    for (const targetData of this.targets.values()) {
      clearTimeout(targetData.timerId);
      targetData.remaining = Math.max(
        0,
        targetData.life - (now - targetData.spawnAt)
      );
    }

    if (this.comboExpiresAt) {
      this.comboRemaining = Math.max(0, this.comboExpiresAt - now);
      clearTimeout(this.comboTimer);
      this.comboExpiresAt = 0;
    }

    if (this.isFrozen && this.freezeExpiresAt) {
      this.freezeRemaining = Math.max(0, this.freezeExpiresAt - now);
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

    for (const [id, targetData] of this.targets.entries()) {
      const remaining = Math.max(1, targetData.remaining ?? targetData.life);
      targetData.spawnAt = now - (targetData.life - remaining);
      targetData.timerId = setTimeout(() => this.miss(id), remaining);
      delete targetData.remaining;
    }

    this.e.layer
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.play());

    if (this.comboRemaining > 0) {
      const remaining = this.comboRemaining;
      this.comboRemaining = 0;
      this.comboExpiresAt = now + remaining;
      this.comboTimer = setTimeout(() => {
        this.breakCombo();
        this.update();
      }, remaining);
    }

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

    this.raf = requestAnimationFrame((t) => this.loop(t));
    this.schedule(Math.max(1, this.spawnRemaining || this.spawnDelay()));
    this.spawnRemaining = 0;
    this.setStatus("TARGET ACQUISITION", "normal");
    this.audio.click();
  }

  togglePause() {
    this.state === "playing"
      ? this.pause()
      : this.state === "paused" && this.resume();
  }

  finish() {
    if (this.state === "gameover") return;
    this.state = "gameover";
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.spawnTimer);
    clearTimeout(this.comboTimer);
    clearTimeout(this.freezeTimer);
    this.removeAllTargets();
    this.e.pause.disabled = true;

    const record = this.score > this.best;
    if (record) {
      this.best = this.score;
      localStorage.setItem(CONFIG.bestKey, String(this.best));
    }

    const acc = this.attempts
      ? Math.round((this.hits / this.attempts) * 100)
      : 0;
    this.e.finalScore.textContent = pad(this.score);
    this.e.finalBest.textContent = pad(this.best);
    this.e.finalCombo.textContent = `Ã—${this.maxCombo}`;
    this.e.finalAcc.textContent = `${acc}%`;
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
    const c = document.querySelector(".status-chip");
    c?.classList.toggle("is-danger", type === "danger");
    c?.classList.toggle("is-warning", type === "warning");
  }

  flash(main, sub, color) {
    this.e.floatMain.textContent = main;
    this.e.floatSub.textContent = sub;
    this.e.float.style.color = color;
    this.e.float.classList.remove("is-visible");
    requestAnimationFrame(() => this.e.float.classList.add("is-visible"));
  }

  effect(cls) {
    this.e.stage.classList.remove(cls);
    requestAnimationFrame(() => this.e.stage.classList.add(cls));
    setTimeout(() => this.e.stage.classList.remove(cls), 700);
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
    this.e.time.textContent = (
      Number.isFinite(this.timeLeft) ? this.timeLeft : CONFIG.time
    ).toFixed(1);

    this.e.comboCard.classList.toggle("is-hot", this.mult >= 3);
    this.e.progressText.textContent = `${this.levelHits} / ${CONFIG.hitsPerLevel}`;
    this.e.progressFill.style.width = `${
      (this.levelHits / CONFIG.hitsPerLevel) * 100
    }%`;

    [...this.e.lives.children].forEach((el, i) => {
      el.classList.toggle("life--active", i < this.lives);
      el.classList.toggle("life--lost", i >= this.lives);
    });
  }
}

addEventListener("DOMContentLoaded", () => {
  try {
    new Game();
  } catch (err) {
    console.error(err);
    alert(
      "Igra nije mogla da se pokrene. Proveri da li su index.html, style.css i script.js u istom folderu."
    );
  }
});
