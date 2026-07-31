"use strict";

const CONFIG = {
  time: 25.0,           // Početno vreme u sekundama (sada se gradi kroz igru!)
  lives: 3,             // Broj života
  hitsPerLevel: 10,     // Pogodaka potrebnih za sledeći nivo
  maxLevel: 100,        // Maksimalni nivo
  
  // Poeni i Vremenski Bonusi
  rabbitPoints: 100,
  rabbitBonus: 0.5,     // SVAKI beli zec dodaje +0.5s na tajmer!
  goldenPoints: 500,
  goldenBonus: 4.0,     // Zlatni zec dāje +4.0s na tajmer!
  
  // Kazne
  decoyPenalty: 300,    // Oduzimanje poena
  decoyTimePenalty: 3.0,// Crveni mamac skida -3.0s sa tajmera!

  // Brzina i Trajanje na ekranu (Life u ms)
  baseLife: 1550,       // Level 1: zec stoji 1.55 sekundi
  minLife: 360,         // Najbrži nivo: 0.36s reakcije!
  lifeStep: 12,         // Fina progresija skraćivanja trajanja

  // Pauza između spawnovanja (Delay u ms)
  baseDelay: 650,
  minDelay: 120,
  delayStep: 6,

  comboReset: 1600,     // Vreme za resetovanje comba
  maxCombo: 15,         // Maksimalni multiplikator (x15)

  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled"
};

const $ = id => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = n => String(Math.max(0, Math.floor(n))).padStart(6, "0");

class AudioFX {
  constructor() { this.ctx = null; this.enabled = localStorage.getItem(CONFIG.soundKey) !== "false"; }
  init() { if (this.ctx) return; const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); }
  tone(f = 440, d = .08, type = "sine", end = f) {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d + .02);
  }
  hit(c) { this.tone(480 + c * 24, .09, "sine", 820 + c * 24); }
  gold() { [660, 880, 1100].forEach((f, i) => setTimeout(() => this.tone(f, .13, "triangle", f * 1.1), i * 45)); }
  bad() { this.tone(190, .24, "sawtooth", 55); }
  level() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, .16, "sine", f * 1.05), i * 65)); }
  click() { this.tone(500, .07, "sine", 720); }
  over() { [420, 320, 230, 150].forEach((f, i) => setTimeout(() => this.tone(f, .2, "sawtooth", f * .7), i * 90)); }
  toggle() { this.enabled = !this.enabled; localStorage.setItem(CONFIG.soundKey, String(this.enabled)); if (this.enabled) this.click(); return this.enabled; }
}

class Particles {
  constructor(canvas) {
    this.c = canvas; this.x = canvas.getContext("2d"); this.p = []; this.last = 0;
    this.resize = () => {
      const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = r.width * d; canvas.height = r.height * d;
      this.x.resetTransform?.() || this.x.setTransform(1, 0, 0, 1, 0, 0);
      this.x.scale(d, d);
    };
    addEventListener("resize", this.resize); this.resize(); requestAnimationFrame(t => this.loop(t));
  }
  burst(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const a = Math.PI * 2 * i / count + Math.random() * .4, s = 2 + Math.random() * 4, l = 350 + Math.random() * 350;
      this.p.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l, m: l, color, size: 1 + Math.random() * 3 });
    }
  }
  loop(t) {
    const dt = Math.min(32, t - (this.last || t)); this.last = t;
    const r = this.c.getBoundingClientRect(); this.x.clearRect(0, 0, r.width, r.height);
    this.p = this.p.filter(p => {
      p.l -= dt; if (p.l <= 0) return false;
      p.x += p.vx * dt / 16.7; p.y += p.vy * dt / 16.7; p.vy += .06 * dt / 16.7;
      this.x.save(); this.x.globalAlpha = p.l / p.m; this.x.fillStyle = p.color;
      this.x.shadowColor = p.color; this.x.shadowBlur = 8; this.x.beginPath();
      this.x.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.x.fill(); this.x.restore();
      return true;
    });
    requestAnimationFrame(n => this.loop(n));
  }
}

class Game {
  constructor() {
    this.e = {
      stage: $("gameStage"), layer: $("targetLayer"), canvas: $("particleCanvas"), cross: $("crosshair"),
      startO: $("startOverlay"), countO: $("countdownOverlay"), pauseO: $("pauseOverlay"), overO: $("gameOverOverlay"),
      start: $("startButton"), restart: $("restartButton"), pause: $("pauseButton"), resume: $("resumeButton"), sound: $("soundButton"), soundIcon: $("soundIcon"),
      count: $("countdownValue"), score: $("scoreValue"), best: $("bestScoreValue"), combo: $("comboValue"), comboCard: $("comboCard"), level: $("levelValue"), time: $("timeValue"),
      status: $("statusText"), lives: $("livesContainer"), progressText: $("progressText"), progressFill: $("progressFill"),
      float: $("floatingMessage"), floatMain: document.querySelector(".floating-message__main"), floatSub: document.querySelector(".floating-message__sub"),
      finalScore: $("finalScoreValue"), finalBest: $("finalBestValue"), finalCombo: $("finalComboValue"), finalAcc: $("finalAccuracyValue"), rank: $("resultRank"), record: $("newRecordMessage")
    };
    this.audio = new AudioFX(); this.particles = new Particles(this.e.canvas);
    this.best = Number(localStorage.getItem(CONFIG.bestKey)) || 0;
    this.state = "ready"; this.starting = false;
    this.targets = new Map(); // Mapa za podršku više zečeva odjednom na ekranu
    this.nextTargetId = 0;
    this.bind(); this.reset(); this.show(this.e.startO, true); this.updateSound();
  }

  bind() {
    this.e.start.onclick = () => this.start();
    this.e.restart.onclick = () => this.start();
    this.e.pause.onclick = () => this.togglePause();
    this.e.resume.onclick = () => this.resume();
    this.e.sound.onclick = () => { this.audio.toggle(); this.updateSound(); };

    this.e.stage.addEventListener("pointermove", ev => {
      const r = this.e.stage.getBoundingClientRect();
      this.e.cross.style.left = `${ev.clientX - r.left}px`;
      this.e.cross.style.top = `${ev.clientY - r.top}px`;
      this.e.cross.style.opacity = "1";
    });

    this.e.stage.addEventListener("pointerleave", () => this.e.cross.style.opacity = "0");

    this.e.stage.addEventListener("pointerdown", ev => {
      if (this.state !== "playing") return;
      if (!ev.target.closest(".target")) this.emptyTap();
    });

    document.addEventListener("keydown", ev => {
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
    clearTimeout(this.spawnTimer); clearTimeout(this.comboTimer);
    this.removeAllTargets();
    this.score = 0; this.level = 1; this.levelHits = 0; this.comboCount = 0;
    this.mult = 1; this.maxCombo = 1; this.lives = CONFIG.lives;
    this.timeLeft = CONFIG.time; this.hits = 0; this.attempts = 0; this.taps = 0; this.last = 0;
    this.update();
  }

  show(el, on) { el.classList.toggle("stage-overlay--visible", on); }

  async start() {
    if (this.starting) return;
    this.starting = true;
    this.reset();
    this.state = "countdown";
    this.show(this.e.startO, false); this.show(this.e.overO, false); this.show(this.e.pauseO, false); this.show(this.e.countO, true);
    this.audio.click();

    for (const v of ["3", "2", "1", "GO"]) {
      if (this.state !== "countdown") { this.starting = false; return; }
      this.e.count.textContent = v;
      this.audio.tone(v === "GO" ? 760 : 300 + Number(v) * 60, .12, "square", v === "GO" ? 1100 : 500);
      await sleep(v === "GO" ? 500 : 700);
    }

    this.show(this.e.countO, false);
    this.state = "playing";
    this.e.pause.disabled = false;
    this.setStatus("TARGET ACQUISITION", "normal");
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.loop(t));
    this.schedule(200);
    this.starting = false;
  }

  loop(t) {
    if (this.state !== "playing") return;
    
    const dt = Math.min(0.1, (t - (this.last || t)) / 1000);
    this.last = t;
    
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.e.time.textContent = this.timeLeft.toFixed(1);

    document.querySelector(".timer-display")?.classList.toggle("is-critical", this.timeLeft <= 8);

    // Azuriranje napretka tajmera po meti za nivo trajanja
    for (const [id, targetData] of this.targets) {
      const p = clamp(1 - (t - targetData.spawnAt) / targetData.life, 0, 1);
      targetData.el.style.setProperty("--life-progress", p);
    }

    if (this.timeLeft <= 0) {
      this.finish();
      return;
    }
    this.raf = requestAnimationFrame(n => this.loop(n));
  }

  // Određuje koliko zečeva treba da stoji na ekranu na osnovu nivoa
  maxTargetsForLevel() {
    if (this.level >= 30) return 4;
    if (this.level >= 20) return 3;
    if (this.level >= 10) return 2;
    return 1;
  }

  schedule(delay = this.spawnDelay()) {
    clearTimeout(this.spawnTimer);
    this.spawnTimer = setTimeout(() => {
      if (this.state === "playing") {
        if (this.targets.size < this.maxTargetsForLevel()) {
          this.spawn();
        }
        this.schedule();
      }
    }, delay);
  }

  spawnDelay() { return Math.max(CONFIG.minDelay, CONFIG.baseDelay - (this.level - 1) * CONFIG.delayStep); }
  lifetime() { return Math.max(CONFIG.minLife, CONFIG.baseLife - (this.level - 1) * CONFIG.lifeStep); }

  spawn() {
    if (this.state !== "playing") return;
    
    const roll = Math.random();
    const decoyProb = Math.min(.12 + (this.level - 1) * .008, .35);
    const goldProb = Math.min(.08 + (this.level - 1) * .003, .18);
    const type = roll < goldProb ? "golden" : roll < goldProb + decoyProb ? "decoy" : "rabbit";
    
    const size = Math.max(54, (innerWidth < 700 ? 80 : 92) - (this.level - 1) * 0.8);
    const r = this.e.stage.getBoundingClientRect();
    const m = size / 2 + 18;

    // Pronalaženje pozicije koja se ne preklapa sa postojećim metama
    let x = 0, y = 0, overlaps = false, attempts = 0;
    do {
      x = m + Math.random() * Math.max(1, r.width - m * 2);
      y = m + Math.random() * Math.max(1, r.height - m * 2);
      overlaps = false;
      for (const [_, tData] of this.targets) {
        const dist = Math.hypot(tData.x - x, tData.y - y);
        if (dist < size + 20) { overlaps = true; break; }
      }
      attempts++;
    } while (overlaps && attempts < 12);

    const targetId = ++this.nextTargetId;
    const b = document.createElement("button");
    b.className = `target target--${type}`;
    b.type = "button";
    b.setAttribute("aria-label", type === "decoy" ? "Crveni mamac" : type === "golden" ? "Golden Rabbit" : "Beli Zec");
    b.style.setProperty("--target-size", `${size}px`);
    b.style.left = `${x}px`; b.style.top = `${y}px`;

    b.innerHTML = '<span class="target__timer"></span><span class="target__ring"></span><span class="target__core"></span><span class="target__rabbit"><span class="target__rabbit-ear target__rabbit-ear--left"></span><span class="target__rabbit-ear target__rabbit-ear--right"></span><span class="target__rabbit-head"></span><span class="target__rabbit-eye"></span></span>';

    const life = this.lifetime();
    const timer = setTimeout(() => this.miss(targetId), life);

    const targetData = { id: targetId, el: b, type, x, y, life, spawnAt: performance.now(), timer };
    this.targets.set(targetId, targetData);

    b.addEventListener("pointerdown", ev => {
      ev.stopPropagation();
      this.hit(targetId, x, y);
    });

    this.e.layer.appendChild(b);
    requestAnimationFrame(() => b.classList.add("is-spawned"));
  }

  hit(targetId, x, y) {
    if (this.state !== "playing") return;
    const targetData = this.targets.get(targetId);
    if (!targetData) return;

    const { el, type, timer } = targetData;
    clearTimeout(timer);
    this.targets.delete(targetId);

    this.taps++; this.attempts++;
    el.classList.add("is-hit");

    if (type === "decoy") {
      this.score = Math.max(0, this.score - CONFIG.decoyPenalty);
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.decoyTimePenalty); // Skida vreme!
      this.lives--;
      this.breakCombo();
      this.audio.bad();
      this.flash("DECOY HIT", `-${CONFIG.decoyPenalty} / -${CONFIG.decoyTimePenalty.toFixed(1)}s`, "#ff325f");
      this.effect("is-damaged");
      this.setStatus("SYSTEM DAMAGE", "danger");
      this.particles.burst(x, y, "#ff325f", 24);
      if (this.lives <= 0) { setTimeout(() => this.finish(), 180); return; }
    } else {
      this.hits++; this.comboCount++;
      this.mult = Math.min(CONFIG.maxCombo, 1 + Math.floor(this.comboCount / 3));
      this.maxCombo = Math.max(this.maxCombo, this.mult);
      const pts = (type === "golden" ? CONFIG.goldenPoints : CONFIG.rabbitPoints) * this.mult;
      this.score += pts; this.levelHits++;

      if (type === "golden") {
        this.timeLeft += CONFIG.goldenBonus; // Ogroman bonus na vreme!
        this.audio.gold();
        this.flash("GOLDEN RABBIT", `+${pts} / +${CONFIG.goldenBonus.toFixed(1)}s`, "#ffd34d");
      } else {
        this.timeLeft += CONFIG.rabbitBonus; // GRADIMO VREME za svakog belog zeca (+0.5s)!
        this.audio.hit(this.mult);
        this.flash("DIRECT HIT", `+${pts} / +${CONFIG.rabbitBonus.toFixed(1)}s`, "#00f5ff");
      }

      this.effect("is-hit");
      this.setStatus("TARGET CONFIRMED", "normal");
      this.particles.burst(x, y, type === "golden" ? "#ffd34d" : "#00f5ff", type === "golden" ? 30 : 20);

      clearTimeout(this.comboTimer);
      this.comboTimer = setTimeout(() => this.breakCombo(), CONFIG.comboReset);

      if (this.levelHits >= CONFIG.hitsPerLevel) this.levelUp();
    }

    setTimeout(() => el.remove(), 220);
    this.update();
    this.schedule(100);
  }

  miss(targetId) {
    if (this.state !== "playing") return;
    const targetData = this.targets.get(targetId);
    if (!targetData) return;

    const { el, type } = targetData;
    this.targets.delete(targetId);

    el.classList.add("is-expiring");
    setTimeout(() => el.remove(), 180);

    if (type !== "decoy") {
      this.attempts++;
      this.breakCombo();
      this.lives--;
      this.audio.bad();
      this.flash("TARGET ESCAPED", "LIFE -1", "#ff325f");
      this.effect("is-damaged");
      this.setStatus("TARGET ESCAPED", "warning");
      if (this.lives <= 0) { this.finish(); return; }
    }

    this.update();
    this.schedule(150);
  }

  emptyTap() {
    this.taps++;
    this.breakCombo();
    this.audio.tone(180, .08, "triangle", 130);
    this.flash("MISS", "COMBO RESET", "#8fa3b8");
    this.update();
  }

  levelUp() {
    this.levelHits = 0;
    if (this.level < CONFIG.maxLevel) this.level++;
    this.audio.level();
    this.effect("is-level-up");
    this.flash(`LEVEL ${String(this.level).padStart(2, "0")}`, `MULTIPLE TARGETS (${this.maxTargetsForLevel()})`, "#ffd34d");
    this.setStatus("LEVEL ADVANCED", "normal");
  }

  breakCombo() { this.comboCount = 0; this.mult = 1; clearTimeout(this.comboTimer); }

  removeAllTargets() {
    for (const [_, tData] of this.targets) {
      clearTimeout(tData.timer);
      tData.el.remove();
    }
    this.targets.clear();
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.spawnTimer);
    this.removeAllTargets();
    this.show(this.e.pauseO, true);
    this.e.pause.disabled = true;
    this.setStatus("SYSTEM SUSPENDED", "warning");
  }

  resume() {
    if (this.state !== "paused") return;
    this.show(this.e.pauseO, false);
    this.state = "playing";
    this.e.pause.disabled = false;
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.loop(t));
    this.schedule(300);
    this.setStatus("TARGET ACQUISITION", "normal");
    this.audio.click();
  }

  togglePause() { this.state === "playing" ? this.pause() : this.state === "paused" && this.resume(); }

  finish() {
    if (this.state === "gameover") return;
    this.state = "gameover";
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.spawnTimer); clearTimeout(this.comboTimer);
    this.removeAllTargets();
    this.e.pause.disabled = true;

    const record = this.score > this.best;
    if (record) { this.best = this.score; localStorage.setItem(CONFIG.bestKey, String(this.best)); }

    const acc = this.attempts ? Math.round(this.hits / this.attempts * 100) : 0;
    this.e.finalScore.textContent = pad(this.score);
    this.e.finalBest.textContent = pad(this.best);
    this.e.finalCombo.textContent = `×${this.maxCombo}`;
    this.e.finalAcc.textContent = `${acc}%`;
    this.e.rank.textContent = this.rank();
    this.e.record.classList.toggle("is-visible", record);

    this.update();
    this.show(this.e.overO, true);
    this.setStatus("SESSION COMPLETE", "danger");
    this.audio.over();
  }

  rank() {
    if (this.score >= 50000) return "WHITE HAT GODLIKE";
    if (this.score >= 30000) return "CYBER LEGEND";
    if (this.score >= 15000) return "REFLEX MASTER";
    if (this.score >= 7000) return "RABBIT TRACKER";
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
    requestAnimationFrame(() => this.e.stage.classList.add("is-visible"));
    setTimeout(() => this.e.stage.classList.remove(cls), 700);
  }

  updateSound() {
    this.e.sound.setAttribute("aria-pressed", String(this.audio.enabled));
    this.e.soundIcon.textContent = this.audio.enabled ? "◉" : "○";
  }

  update() {
    this.e.score.textContent = pad(this.score);
    this.e.best.textContent = pad(this.best);
    this.e.combo.textContent = String(this.mult);
    this.e.level.textContent = String(this.level).padStart(2, "0");
    this.e.time.textContent = this.timeLeft.toFixed(1);

    this.e.comboCard.classList.toggle("is-hot", this.mult >= 3);
    this.e.progressText.textContent = `${this.levelHits} / ${CONFIG.hitsPerLevel}`;
    this.e.progressFill.style.width = `${this.levelHits / CONFIG.hitsPerLevel * 100}%`;

    [...this.e.lives.children].forEach((el, i) => {
      el.classList.toggle("life--active", i < this.lives);
      el.classList.toggle("life--lost", i >= this.lives);
    });
  }
}

addEventListener("DOMContentLoaded", () => {
  try { new Game(); } catch (err) {
    console.error(err);
    alert("Igra nije mogla da se pokrene. Proveri da li su index.html, style.css i script.js u istom folderu.");
  }
});
