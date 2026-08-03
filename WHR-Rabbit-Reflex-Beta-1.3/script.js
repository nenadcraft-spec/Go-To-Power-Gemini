js_content = """"use strict";

/* =========================================================
   WHITE HAT RABBIT STUDIOS — RABBIT REFLEX BETA 1.2
   SREĆKO ZEC ROCKET GUNNER INTEGRATION
   ========================================================= */

const CONFIG = {
  time: 60,
  lives: 3,
  maxLives: 10,
  hitsPerLevel: 10,
  rabbitPoints: 250,
  goldenPoints: 1200,
  freezePoints: 500,
  targetLife: 1450,
  hazardLife: 1800,
  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled",
};

const TUTORIAL_STEPS = [
  { type: "rabbit", group: "good", action: "click", title: "OBIČAN ZEC", text: "KLIKNI METU! Pogodi ga pre nego što nestane." },
  { type: "golden", group: "good", action: "click", title: "ZLATNI ZEC", text: "KLIKNI METU! Donosi +1200 poena i x5 bonus!" },
  { type: "sreckogunner", group: "good", action: "click", title: "SREĆKO GUNNER", text: "KLIKNI ZA REVOLVER/RAFAL! Čisti loše mete sa ekrana!" },
  { type: "hacker", group: "hacker", action: "avoid", title: "CRNI HAKER", text: "NE DIRAJ! Izdrži 3 sekunde bez klika!" },
];

const $ = (id) => document.getElementById(id);
const pad = (value) => String(Math.max(0, Math.floor(value))).padStart(8, "0");

/* AUDIO ENGINE */
class AudioFX {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem(CONFIG.soundKey) !== "false";
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
  }

  tone(frequency = 440, duration = 0.08, type = "sine", end = frequency) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  hit() { this.tone(580, 0.08, "sine", 880); }
  bad() { this.tone(210, 0.22, "sawtooth", 50); }
  sreckoFanfare() {
    [523, 659, 783, 1046].forEach((freq, idx) => {
      setTimeout(() => this.tone(freq, 0.12, "sawtooth"), idx * 70);
    });
  }
}

/* PARTICLES ENGINE */
class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.items = [];
    this.last = 0;

    this.resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    window.addEventListener("resize", this.resize);
    this.resize();
    requestAnimationFrame((time) => this.loop(time));
  }

  burst(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 2 + Math.random() * 4;
      this.items.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 350, maxLife: 350, color });
    }
  }

  loop(time) {
    const delta = Math.min(32, time - (this.last || time));
    this.last = time;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.items = this.items.filter((p) => {
      p.life -= delta;
      if (p.life <= 0) return false;
      p.x += p.vx; p.y += p.vy;
      this.context.save();
      this.context.globalAlpha = p.life / p.maxLife;
      this.context.fillStyle = p.color;
      this.context.beginPath();
      this.context.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      this.context.fill();
      this.context.restore();
      return true;
    });

    requestAnimationFrame((next) => this.loop(next));
  }
}

/* GAME ENGINE BETA 1.2 */
class Game {
  constructor() {
    this.e = {
      stage: $("gameStage"), shell: $("appShell"), layer: $("targetLayer"),
      canvas: $("particleCanvas"), cross: $("crosshair"),
      startO: $("startOverlay"), countO: $("countdownOverlay"),
      pauseO: $("pauseOverlay"), overO: $("gameOverOverlay"),
      start: $("startButton"), restart: $("restartButton"),
      pause: $("pauseButton"), resume: $("resumeButton"),
      pauseLobby: $("pauseLobbyButton"), overLobby: $("overLobbyButton"),
      sound: $("soundButton"), soundIcon: $("soundIcon"),
      tutorialBtn: $("tutorialButton"), tutorialHud: $("tutorialHud"), tutorialExitBtn: $("tutorialExitButton"),
      tutorialStep: $("tutorialStep"), tutorialTitle: $("tutorialTitle"), tutorialText: $("tutorialText"),
      count: $("countdownValue"), score: $("scoreValue"), best: $("bestScoreValue"),
      level: $("levelValue"), time: $("timeValue"), timeCard: $("timeCard"),
      status: $("statusText"), lives: $("livesValue"),
      progressText: $("progressText"), progressFill: $("progressFill"),
      floatMain: document.querySelector(".floating-message__main"), floatSub: document.querySelector(".floating-message__sub"),
      finalScore: $("finalScoreValue"), finalBest: $("finalBestValue"),
      finalLevel: $("finalLevelValue"), finalAcc: $("finalAccuracyValue"),
      rank: $("resultRank"), record: $("newRecordMessage"),
    };

    this.audio = new AudioFX();
    this.particles = new Particles(this.e.canvas);

    this.best = Number(localStorage.getItem(CONFIG.bestKey)) || 0;
    this.targets = new Map();
    this.state = "ready";

    this.bind();
    this.reset();
  }

  bind() {
    this.e.start.onclick = () => this.start();
    this.e.restart.onclick = () => this.start();
    this.e.pause.onclick = () => this.togglePause();
    this.e.resume.onclick = () => this.resume();
    if (this.e.pauseLobby) this.e.pauseLobby.onclick = () => this.backToLobby();
    if (this.e.overLobby) this.e.overLobby.onclick = () => this.backToLobby();

    this.e.sound.onclick = () => {
      this.audio.enabled = !this.audio.enabled;
      localStorage.setItem(CONFIG.soundKey, String(this.audio.enabled));
      this.e.soundIcon.textContent = this.audio.enabled ? "ON" : "OFF";
    };

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (this.state === "ready" || this.state === "gameover") this.start();
        else if (this.state === "playing") this.pause();
        else if (this.state === "paused") this.resume();
      }
    });
  }

  backToLobby() {
    this.reset();
    this.show(this.e.pauseO, false);
    this.show(this.e.overO, false);
    this.show(this.e.startO, true);
    this.state = "ready";
    this.e.pause.disabled = true;
  }

  reset() {
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.goodSpawnTimer);
    this.removeAllTargets();

    this.score = 0; this.level = 1; this.levelHits = 0;
    this.lives = CONFIG.lives; this.timeLeft = CONFIG.time;
    this.hits = 0; this.attempts = 0;

    this.update();
  }

  show(element, visible) { element.classList.toggle("stage-overlay--visible", visible); }

  async start() {
    this.reset();
    this.state = "countdown";
    this.show(this.e.startO, false); this.show(this.e.overO, false); this.show(this.e.countO, true);

    for (const val of ["3", "2", "1", "GO"]) {
      this.e.count.textContent = val;
      this.audio.tone(val === "GO" ? 760 : 360, 0.1, "square");
      await new Promise(r => setTimeout(r, 600));
    }

    this.show(this.e.countO, false);
    this.state = "playing";
    this.e.pause.disabled = false;

    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.loop(time));
    this.scheduleSpawns();
  }

  loop(time) {
    if (this.state !== "playing") return;
    const delta = Math.min(0.1, (time - (this.last || time)) / 1000);
    this.last = time;

    this.timeLeft = Math.max(0, this.timeLeft - delta);
    this.e.time.textContent = this.timeLeft.toFixed(1);

    if (this.timeLeft <= 0) { this.finish(); return; }
    this.raf = requestAnimationFrame((next) => this.loop(next));
  }

  scheduleSpawns() {
    clearTimeout(this.goodSpawnTimer);
    this.goodSpawnTimer = setTimeout(() => {
      if (this.state === "playing") {
        const rand = Math.random();
        let type = "rabbit";

        if (rand < 0.12) type = "golden";
        else if (rand < 0.22) type = "sreckogunner"; // SREĆKO ROCKET GUNNER!
        else if (rand < 0.35) type = "hacker";

        this.spawn(type, type === "hacker" ? "hacker" : "good");
        this.scheduleSpawns();
      }
    }, Math.max(300, 800 - this.level * 30));
  }

  spawn(type, group, options = {}) {
    if (this.state !== "playing") return;
    const size = 86;
    const rect = this.e.stage.getBoundingClientRect();
    const x = options.spawnAt ? options.spawnAt.x : Math.random() * (rect.width - 100) + 50;
    const y = options.spawnAt ? options.spawnAt.y : Math.random() * (rect.height - 100) + 50;

    const button = document.createElement("button");
    button.className = `target target--${type}`;
    button.style.setProperty("--target-size", `${size}px`);
    button.style.left = `${x}px`; button.style.top = `${y}px`;

    button.innerHTML = `
      <span class="target__timer"></span><span class="target__ring"></span>
      <span class="target__rabbit">
        <span class="target__rabbit-ear target__rabbit-ear--left"></span>
        <span class="target__rabbit-ear target__rabbit-ear--right"></span>
        <span class="target__rabbit-head"></span><span class="target__rabbit-eye"></span>
      </span>
    `;

    if (type === "hacker") {
      button.insertAdjacentHTML("beforeend", `<span class="target__hacker-code">#ERR_0x01</span><span class="target__hacker-mask"></span><span class="target__hacker-glitch target__hacker-glitch--one"></span><span class="target__hacker-glitch target__hacker-glitch--two"></span>`);
    }

    const id = Symbol();
    const timerId = setTimeout(() => this.miss(id), CONFIG.targetLife);

    button.onpointerdown = (e) => { e.stopPropagation(); this.hit(id, type, button, x, y); };
    this.e.layer.appendChild(button);
    requestAnimationFrame(() => button.classList.add("is-spawned"));

    this.targets.set(id, { element: button, type, group, timerId, x, y });
  }

  hit(id, type, button, x, y) {
    if (!this.targets.has(id)) return;
    const target = this.targets.get(id);
    clearTimeout(target.timerId);
    this.targets.delete(id);

    this.audio.hit();
    this.hits++;
    this.score += type === "golden" ? CONFIG.goldenPoints : CONFIG.rabbitPoints;

    this.particles.burst(x, y, type === "sreckogunner" ? "#ffd34d" : "#00f5ff", 20);
    button.classList.add("is-hit");
    setTimeout(() => button.remove(), 200);

    // POZIV MOĆI SREĆKO ZECA!
    if (type === "sreckogunner") {
      this.triggerSreckoGunner(x, y);
    }

    this.levelHits++;
    if (this.levelHits >= CONFIG.hitsPerLevel) {
      this.levelHits = 0; this.level++;
    }
    this.update();
  }

  /* SREĆKO ZEC ROCKET GUNNER LOGIKA */
  triggerSreckoGunner(startX, startY) {
    this.audio.sreckoFanfare();

    const validTargets = [...this.targets.entries()].filter(([_, t]) => 
      ["hacker", "redrabbit", "decoy", "net"].includes(t.type)
    );

    if (validTargets.length === 0) {
      this.score += 1000;
      this.update();
      return;
    }

    validTargets.forEach(([id, target], index) => {
      setTimeout(() => {
        if (this.state !== "playing") return;

        const dx = target.x - startX;
        const dy = target.y - startY;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        const bullet = document.createElement("div");
        bullet.className = "laser-bullet";
        bullet.style.left = `${startX}px`;
        bullet.style.top = `${startY}px`;
        bullet.style.width = `0px`;
        bullet.style.transform = `rotate(${angle}deg)`;
        this.e.stage.appendChild(bullet);

        this.audio.tone(900 - index * 50, 0.05, "square", 120);

        requestAnimationFrame(() => {
          bullet.style.transition = "width 0.15s cubic-bezier(0,0,0.2,1)";
          bullet.style.width = `${distance}px`;
        });

        setTimeout(() => {
          bullet.style.opacity = "0";
          setTimeout(() => bullet.remove(), 100);

          if (this.targets.has(id)) {
            clearTimeout(target.timerId);
            this.targets.delete(id);
            target.element.classList.add("is-expiring");
            this.particles.burst(target.x, target.y, "#ffd34d", 16);
            this.audio.hit();
            setTimeout(() => target.element.remove(), 150);
          }
        }, 150);

      }, index * 180);
    });

    this.score += 500 + validTargets.length * 200;
    this.update();
  }

  miss(id) {
    if (!this.targets.has(id)) return;
    const target = this.targets.get(id);
    this.targets.delete(id);

    if (target.type === "rabbit") {
      this.lives--;
      this.audio.bad();
      if (this.lives <= 0) { this.finish(); return; }
    }
    target.element.classList.add("is-expiring");
    setTimeout(() => target.element.remove(), 180);
    this.update();
  }

  removeAllTargets() {
    for (const target of this.targets.values()) { clearTimeout(target.timerId); target.element.remove(); }
    this.targets.clear();
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.show(this.e.pauseO, true);
    this.e.pause.disabled = true;
  }

  resume() {
    if (this.state !== "paused") return;
    this.show(this.e.pauseO, false);
    this.state = "playing";
    this.e.pause.disabled = false;
    this.scheduleSpawns();
  }

  togglePause() { if (this.state === "playing") this.pause(); else if (this.state === "paused") this.resume(); }

  finish() {
    this.state = "gameover";
    this.removeAllTargets();

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem(CONFIG.bestKey, String(this.best));
    }

    this.e.finalScore.textContent = pad(this.score);
    this.e.finalBest.textContent = pad(this.best);
    this.e.finalLevel.textContent = String(this.level).padStart(2, "0");
    this.e.finalAcc.textContent = `${this.attempts ? Math.round((this.hits / this.attempts) * 100) : 0}%`;

    this.show(this.e.overO, true);
    this.update();
  }

  update() {
    this.e.score.textContent = pad(this.score);
    this.e.best.textContent = pad(this.best);
    this.e.level.textContent = String(this.level).padStart(2, "0");
    this.e.lives.textContent = `${String(this.lives).padStart(2, "0")}/${String(CONFIG.maxLives).padStart(2, "0")}`;
    this.e.progressText.textContent = `${this.levelHits} / ${CONFIG.hitsPerLevel}`;
    this.e.progressFill.style.width = `${(this.levelHits / CONFIG.hitsPerLevel) * 100}%`;
  }
}

window.addEventListener("DOMContentLoaded", () => { new Game(); });
"""

with open("script.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("script.js saved successfully")
