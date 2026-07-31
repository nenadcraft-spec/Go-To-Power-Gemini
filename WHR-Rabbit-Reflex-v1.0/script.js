"use strict";

const CONFIG = {
  time: 60,
  lives: 3,
  hitsPerLevel: 10,
  maxLevel: 99,

  rabbitPoints: 250,
  goldenPoints: 1200,
  goldenBonus: 5.0,
  freezePoints: 500,

  redPenaltyPoints: 500,
  redPenaltyTime: 3.0,
  decoyPenalty: 300,

  baseLife: 1450,
  minLife: 350,
  lifeStep: 45,

  baseDelay: 760,
  minDelay: 180,
  delayStep: 25,

  comboReset: 1800,
  maxCombo: 25,

  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled"
};

const $ = id => {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing #${id}`);
  }

  return element;
};

const sleep = milliseconds => {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
};

const clamp = (value, minimum, maximum) => {
  return Math.max(minimum, Math.min(maximum, value));
};

const pad = number => {
  return String(
    Math.max(0, Math.floor(number))
  ).padStart(8, "0");
};

/* ==============================
   ZVUČNI EFEKTI
   ============================== */

class AudioFX {
  constructor() {
    this.context = null;

    this.enabled =
      localStorage.getItem(CONFIG.soundKey) !== "false";
  }

  init() {
    if (this.context) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioContextClass) {
      this.context = new AudioContextClass();
    }
  }

  tone(
    frequency = 440,
    duration = 0.08,
    type = "sine",
    endFrequency = frequency
  ) {
    if (!this.enabled) {
      return;
    }

    this.init();

    if (!this.context) {
      return;
    }

    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }

    const oscillator =
      this.context.createOscillator();

    const gain =
      this.context.createGain();

    const now =
      this.context.currentTime;

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      now + duration
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.16,
      now + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  hit(combo) {
    this.tone(
      480 + combo * 24,
      0.09,
      "sine",
      820 + combo * 24
    );
  }

  gold() {
    [660, 880, 1100].forEach((frequency, index) => {
      setTimeout(() => {
        this.tone(
          frequency,
          0.13,
          "triangle",
          frequency * 1.1
        );
      }, index * 45);
    });
  }

  freeze() {
    [900, 700, 500].forEach((frequency, index) => {
      setTimeout(() => {
        this.tone(
          frequency,
          0.15,
          "sine",
          frequency * 0.8
        );
      }, index * 50);
    });
  }

  red() {
    [200, 150, 100].forEach((frequency, index) => {
      setTimeout(() => {
        this.tone(
          frequency,
          0.18,
          "sawtooth",
          frequency * 0.6
        );
      }, index * 60);
    });
  }

  bad() {
    this.tone(
      190,
      0.24,
      "sawtooth",
      55
    );
  }

  level() {
    [440, 554, 659, 880].forEach(
      (frequency, index) => {
        setTimeout(() => {
          this.tone(
            frequency,
            0.16,
            "sine",
            frequency * 1.05
          );
        }, index * 65);
      }
    );
  }

  click() {
    this.tone(
      500,
      0.07,
      "sine",
      720
    );
  }

  over() {
    [420, 320, 230, 150].forEach(
      (frequency, index) => {
        setTimeout(() => {
          this.tone(
            frequency,
            0.2,
            "sawtooth",
            frequency * 0.7
          );
        }, index * 90);
      }
    );
  }

  toggle() {
    this.enabled = !this.enabled;

    localStorage.setItem(
      CONFIG.soundKey,
      String(this.enabled)
    );

    if (this.enabled) {
      this.click();
    }

    return this.enabled;
  }
}

/* ==============================
   ČESTICE
   ============================== */

class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.particles = [];
    this.lastTime = 0;

    this.resize = () => {
      const rectangle =
        canvas.getBoundingClientRect();

      const density =
        Math.min(window.devicePixelRatio || 1, 2);

      canvas.width =
        rectangle.width * density;

      canvas.height =
        rectangle.height * density;

      if (this.context.resetTransform) {
        this.context.resetTransform();
      } else {
        this.context.setTransform(
          1,
          0,
          0,
          1,
          0,
          0
        );
      }

      this.context.scale(
        density,
        density
      );
    };

    window.addEventListener(
      "resize",
      this.resize
    );

    this.resize();

    requestAnimationFrame(time => {
      this.loop(time);
    });
  }

  burst(
    x,
    y,
    color,
    count = 18
  ) {
    for (
      let index = 0;
      index < count;
      index++
    ) {
      const angle =
        Math.PI * 2 * index / count +
        Math.random() * 0.4;

      const speed =
        2 + Math.random() * 4;

      const lifetime =
        350 + Math.random() * 350;

      this.particles.push({
        x,
        y,

        velocityX:
          Math.cos(angle) * speed,

        velocityY:
          Math.sin(angle) * speed,

        lifetime,
        maximumLifetime: lifetime,
        color,

        size:
          1 + Math.random() * 3
      });
    }
  }

  loop(time) {
    const deltaTime = Math.min(
      32,
      time - (this.lastTime || time)
    );

    this.lastTime = time;

    const rectangle =
      this.canvas.getBoundingClientRect();

    this.context.clearRect(
      0,
      0,
      rectangle.width,
      rectangle.height
    );

    this.particles = this.particles.filter(
      particle => {
        particle.lifetime -= deltaTime;

        if (particle.lifetime <= 0) {
          return false;
        }

        particle.x +=
          particle.velocityX *
          deltaTime / 16.7;

        particle.y +=
          particle.velocityY *
          deltaTime / 16.7;

        particle.velocityY +=
          0.06 * deltaTime / 16.7;

        this.context.save();

        this.context.globalAlpha =
          particle.lifetime /
          particle.maximumLifetime;

        this.context.fillStyle =
          particle.color;

        this.context.shadowColor =
          particle.color;

        this.context.shadowBlur = 8;

        this.context.beginPath();

        this.context.arc(
          particle.x,
          particle.y,
          particle.size,
          0,
          Math.PI * 2
        );

        this.context.fill();
        this.context.restore();

        return true;
      }
    );

    requestAnimationFrame(nextTime => {
      this.loop(nextTime);
    });
  }
}

/* ==============================
   GLAVNA KLASA IGRE
   ============================== */

class Game {
  constructor() {
    this.elements = {
      stage: $("gameStage"),
      layer: $("targetLayer"),
      canvas: $("particleCanvas"),
      crosshair: $("crosshair"),

      startOverlay: $("startOverlay"),
      countdownOverlay: $("countdownOverlay"),
      pauseOverlay: $("pauseOverlay"),
      gameOverOverlay: $("gameOverOverlay"),

      startButton: $("startButton"),
      restartButton: $("restartButton"),
      pauseButton: $("pauseButton"),
      resumeButton: $("resumeButton"),

      soundButton: $("soundButton"),
      soundIcon: $("soundIcon"),

      countdownValue: $("countdownValue"),
      scoreValue: $("scoreValue"),
      bestScoreValue: $("bestScoreValue"),
      comboValue: $("comboValue"),
      comboCard: $("comboCard"),
      levelValue: $("levelValue"),
      timeValue: $("timeValue"),

      statusText: $("statusText"),
      livesContainer: $("livesContainer"),

      progressText: $("progressText"),
      progressFill: $("progressFill"),

      floatingMessage: $("floatingMessage"),

      floatingMain:
        document.querySelector(
          ".floating-message__main"
        ),

      floatingSub:
        document.querySelector(
          ".floating-message__sub"
        ),

      finalScoreValue: $("finalScoreValue"),
      finalBestValue: $("finalBestValue"),
      finalComboValue: $("finalComboValue"),
      finalAccuracyValue:
        $("finalAccuracyValue"),

      resultRank: $("resultRank"),
      newRecordMessage:
        $("newRecordMessage")
    };

    this.audio = new AudioFX();

    this.particleSystem =
      new Particles(this.elements.canvas);

    this.bestScore =
      Number(
        localStorage.getItem(CONFIG.bestKey)
      ) || 0;

    this.state = "ready";
    this.starting = false;

    this.targets = new Map();

    this.isFrozen = false;
    this.freezeTimer = null;

    this.bindEvents();
    this.reset();

    this.showOverlay(
      this.elements.startOverlay,
      true
    );

    this.updateSoundButton();
  }

  /* ==============================
     KONTROLE
     ============================== */

  bindEvents() {
    this.elements.startButton.onclick = () => {
      this.start();
    };

    this.elements.restartButton.onclick = () => {
      this.start();
    };

    this.elements.pauseButton.onclick = () => {
      this.togglePause();
    };

    this.elements.resumeButton.onclick = () => {
      this.resume();
    };

    this.elements.soundButton.onclick = () => {
      this.audio.toggle();
      this.updateSoundButton();
    };

    this.elements.stage.addEventListener(
      "pointermove",
      event => {
        const rectangle =
          this.elements.stage.getBoundingClientRect();

        this.elements.crosshair.style.left =
          `${event.clientX - rectangle.left}px`;

        this.elements.crosshair.style.top =
          `${event.clientY - rectangle.top}px`;

        this.elements.crosshair.style.opacity =
          "1";
      }
    );

    this.elements.stage.addEventListener(
      "pointerleave",
      () => {
        this.elements.crosshair.style.opacity =
          "0";
      }
    );

    this.elements.stage.addEventListener(
      "pointerdown",
      event => {
        if (this.state !== "playing") {
          return;
        }

        if (!event.target.closest(".target")) {
          this.emptyTap();
        }
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (event.code === "Space") {
          event.preventDefault();

          if (
            this.state === "ready" ||
            this.state === "gameover"
          ) {
            this.start();
          } else if (
            this.state === "playing"
          ) {
            this.pause();
          } else if (
            this.state === "paused"
          ) {
            this.resume();
          }
        }

        if (
          event.code === "Escape" &&
          this.state === "playing"
        ) {
          this.pause();
        }
      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          document.hidden &&
          this.state === "playing"
        ) {
          this.pause();
        }
      }
    );
  }

  /* ==============================
     RESETOVANJE
     ============================== */

  reset() {
    if (this.animationFrame) {
      cancelAnimationFrame(
        this.animationFrame
      );
    }

    clearTimeout(this.spawnTimer);
    clearTimeout(this.comboTimer);
    clearTimeout(this.freezeTimer);

    this.removeAllTargets();

    this.isFrozen = false;

    this.elements.stage.classList.remove(
      "is-frozen"
    );

    this.score = 0;
    this.level = 1;
    this.levelHits = 0;

    this.comboCount = 0;
    this.multiplier = 1;
    this.maximumCombo = 1;

    this.lives = CONFIG.lives;
    this.timeLeft = CONFIG.time;

    this.hits = 0;
    this.attempts = 0;
    this.taps = 0;

    this.lastFrameTime = 0;

    this.updateInterface();
  }

  showOverlay(element, visible) {
    element.classList.toggle(
      "stage-overlay--visible",
      visible
    );
  }

  /* ==============================
     POKRETANJE IGRE
     ============================== */

  async start() {
    if (this.starting) {
      return;
    }

    this.starting = true;

    this.reset();

    this.state = "countdown";

    this.showOverlay(
      this.elements.startOverlay,
      false
    );

    this.showOverlay(
      this.elements.gameOverOverlay,
      false
    );

    this.showOverlay(
      this.elements.pauseOverlay,
      false
    );

    this.showOverlay(
      this.elements.countdownOverlay,
      true
    );

    this.audio.click();

    for (
      const value of ["3", "2", "1", "GO"]
    ) {
      if (this.state !== "countdown") {
        this.starting = false;
        return;
      }

      this.elements.countdownValue.textContent =
        value;

      this.audio.tone(
        value === "GO"
          ? 760
          : 300 + Number(value) * 60,

        0.12,
        "square",

        value === "GO"
          ? 1100
          : 500
      );

      await sleep(
        value === "GO"
          ? 500
          : 700
      );
    }

    this.showOverlay(
      this.elements.countdownOverlay,
      false
    );

    this.state = "playing";

    this.elements.pauseButton.disabled =
      false;

    this.setStatus(
      "TARGET ACQUISITION",
      "normal"
    );

    this.lastFrameTime =
      performance.now();

    this.animationFrame =
      requestAnimationFrame(time => {
        this.gameLoop(time);
      });

    this.scheduleSpawn(250);

    this.starting = false;
  }

  /* ==============================
     GLAVNA PETLJA
     ============================== */

  gameLoop(time) {
    if (this.state !== "playing") {
      return;
    }

    let deltaTime = Math.min(
      0.1,
      (
        time -
        (this.lastFrameTime || time)
      ) / 1000
    );

    this.lastFrameTime = time;

    if (this.isFrozen) {
      deltaTime *= 0.5;
    }

    if (!Number.isFinite(this.timeLeft)) {
      this.timeLeft = CONFIG.time;
    }

    this.timeLeft = Math.max(
      0,
      this.timeLeft - deltaTime
    );

    this.elements.timeValue.textContent =
      this.timeLeft.toFixed(1);

    const timerDisplay =
      document.querySelector(
        ".timer-display"
      );

    if (timerDisplay) {
      timerDisplay.classList.toggle(
        "is-critical",
        this.timeLeft <= 8
      );
    }

    const now = performance.now();

    for (
      const targetData
      of this.targets.values()
    ) {
      const progress = clamp(
        1 -
          (
            now -
            targetData.spawnTime
          ) /
          targetData.lifetime,

        0,
        1
      );

      targetData.element.style.setProperty(
        "--life-progress",
        progress
      );
    }

    if (this.timeLeft <= 0) {
      this.finish();
      return;
    }

    this.animationFrame =
      requestAnimationFrame(nextTime => {
        this.gameLoop(nextTime);
      });
  }

  /* ==============================
     BRZINA I TEŽINA
     ============================== */

  getMaximumTargets() {
    return Math.min(
      6,
      1 + Math.floor(this.level / 5)
    );
  }

  scheduleSpawn(
    delay = this.getSpawnDelay()
  ) {
    clearTimeout(this.spawnTimer);

    this.spawnTimer = setTimeout(() => {
      const maximumTargets =
        this.getMaximumTargets();

      if (
        this.targets.size <
        maximumTargets
      ) {
        this.spawnTarget();
      }

      this.scheduleSpawn();
    }, delay);
  }

  getSpawnDelay() {
    const delay = Math.max(
      CONFIG.minDelay,

      CONFIG.baseDelay -
        (this.level - 1) *
        CONFIG.delayStep
    );

    return this.isFrozen
      ? delay * 1.8
      : delay;
  }

  getTargetLifetime() {
    const lifetime = Math.max(
      CONFIG.minLife,

      CONFIG.baseLife -
        (this.level - 1) *
        CONFIG.lifeStep
    );

    return this.isFrozen
      ? lifetime * 1.8
      : lifetime;
  }

  /* ==============================
     STVARANJE META
     ============================== */

  spawnTarget() {
    if (this.state !== "playing") {
      return;
    }

    const randomValue = Math.random();

    const decoyProbability = Math.min(
      0.12 +
        (this.level - 1) * 0.012,
      0.28
    );

    const goldenProbability = Math.min(
      0.08 +
        (this.level - 1) * 0.004,
      0.15
    );

    const freezeProbability = Math.min(
      0.08,
      0.04 +
        (this.level - 1) * 0.005
    );

    const redRabbitProbability = Math.min(
      0.18,
      0.06 +
        (this.level - 1) * 0.012
    );

    const netProbability =
      this.level >= 3
        ? Math.min(
            0.12,
            0.03 +
              (this.level - 3) * 0.01
          )
        : 0;

    let type = "rabbit";

    if (
      randomValue <
      goldenProbability
    ) {
      type = "golden";
    } else if (
      randomValue <
      goldenProbability +
      freezeProbability
    ) {
      type = "freeze";
    } else if (
      randomValue <
      goldenProbability +
      freezeProbability +
      redRabbitProbability
    ) {
      type = "redrabbit";
    } else if (
      randomValue <
      goldenProbability +
      freezeProbability +
      redRabbitProbability +
      netProbability
    ) {
      type = "net";
    } else if (
      randomValue <
      goldenProbability +
      freezeProbability +
      redRabbitProbability +
      netProbability +
      decoyProbability
    ) {
      type = "decoy";
    }

    const targetSize = Math.max(
      58,

      (
        window.innerWidth < 700
          ? 82
          : 94
      ) -
        (this.level - 1) * 1.8
    );

    const stageRectangle =
      this.elements.stage.getBoundingClientRect();

    const margin =
      targetSize / 2 + 18;

    const availableWidth = Math.max(
      1,
      stageRectangle.width -
        margin * 2
    );

    const availableHeight = Math.max(
      1,
      stageRectangle.height -
        margin * 2
    );

    const x =
      margin +
      Math.random() * availableWidth;

    const y =
      margin +
      Math.random() * availableHeight;

    const button =
      document.createElement("button");

    button.className =
      `target target--${type}`;

    button.type = "button";

    button.setAttribute(
      "aria-label",
      this.getTargetLabel(type)
    );

    button.style.setProperty(
      "--target-size",
      `${targetSize}px`
    );

    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    if (type === "net") {
      button.innerHTML = `
        <span class="target__timer"></span>
        <div class="target__net-grid"></div>
        <span class="target__net-warning">
          CYBER NET
        </span>
      `;
    } else {
      button.innerHTML = `
        <span class="target__timer"></span>
        <span class="target__ring"></span>
        <span class="target__core"></span>

        <span class="target__rabbit">
          <span
            class="target__rabbit-ear target__rabbit-ear--left"
          ></span>

          <span
            class="target__rabbit-ear target__rabbit-ear--right"
          ></span>

          <span class="target__rabbit-head"></span>
          <span class="target__rabbit-eye"></span>
        </span>
      `;
    }

    const id = Symbol();

    const lifetime =
      this.getTargetLifetime();

    const spawnTime =
      performance.now();

    const timerId = setTimeout(() => {
      this.missTarget(id);
    }, lifetime);

    button.addEventListener(
      "pointerdown",
      event => {
        event.preventDefault();
        event.stopPropagation();

        this.hitTarget(
          id,
          type,
          button,
          x,
          y
        );
      }
    );

    this.elements.layer.appendChild(
      button
    );

    this.targets.set(id, {
      element: button,
      type,
      lifetime,
      spawnTime,
      timerId
    });

    requestAnimationFrame(() => {
      button.classList.add(
        "is-spawned"
      );
    });
  }

  getTargetLabel(type) {
    const labels = {
      rabbit: "Beli zec",
      golden: "Zlatni zec",
      freeze: "Ledeni zec",
      redrabbit: "Crveni opasni zec",
      net: "Cyber mreža",
      decoy: "Crveni mamac"
    };

    return labels[type] || "Meta";
  }

  /* ==============================
     POGODAK METE
     ============================== */

  hitTarget(
    id,
    type,
    button,
    x,
    y
  ) {
    if (
      this.state !== "playing" ||
      !this.targets.has(id)
    ) {
      return;
    }

    const targetData =
      this.targets.get(id);

    clearTimeout(
      targetData.timerId
    );

    this.targets.delete(id);

    this.taps++;
    this.attempts++;

    button.classList.add("is-hit");

    if (type === "decoy") {
      this.hitDecoy(x, y);
    } else if (
      type === "redrabbit"
    ) {
      this.hitRedRabbit(x, y);
    } else if (
      type === "net"
    ) {
      this.hitNet(x, y);
    } else {
      this.hitGoodTarget(
        type,
        x,
        y
      );
    }

    setTimeout(() => {
      button.remove();
    }, 230);

    this.updateInterface();
  }

  hitDecoy(x, y) {
    this.score = Math.max(
      0,
      this.score -
        CONFIG.decoyPenalty
    );

    this.lives--;

    this.breakCombo();
    this.audio.bad();

    this.showMessage(
      "DECOY HIT",
      `-${CONFIG.decoyPenalty}`,
      "#ff325f"
    );

    this.stageEffect("is-damaged");

    this.setStatus(
      "SYSTEM DAMAGE",
      "danger"
    );

    this.particleSystem.burst(
      x,
      y,
      "#ff325f",
      24
    );

    if (this.lives <= 0) {
      setTimeout(() => {
        this.finish();
      }, 180);
    }
  }

  hitRedRabbit(x, y) {
    this.score = Math.max(
      0,
      this.score -
        CONFIG.redPenaltyPoints
    );

    this.timeLeft = Math.max(
      0,
      this.timeLeft -
        CONFIG.redPenaltyTime
    );

    this.breakCombo();
    this.audio.red();

    this.showMessage(
      "RED RABBIT HIT!",
      `-${CONFIG.redPenaltyPoints} PTS / -${CONFIG.redPenaltyTime.toFixed(1)}s`,
      "#ff0033"
    );

    this.stageEffect("is-damaged");

    this.setStatus(
      "CRITICAL ERROR!",
      "danger"
    );

    this.particleSystem.burst(
      x,
      y,
      "#ff0033",
      35
    );

    if (this.timeLeft <= 0) {
      this.finish();
    }
  }

  hitNet(x, y) {
    this.timeLeft = Math.max(
      0,
      this.timeLeft - 1.5
    );

    this.breakCombo();
    this.audio.bad();

    this.showMessage(
      "NET TRAP!",
      "COMBO RESET / -1.5s",
      "#a855f7"
    );

    this.stageEffect("is-damaged");

    this.setStatus(
      "NETWORK BLOCKED!",
      "warning"
    );

    this.particleSystem.burst(
      x,
      y,
      "#a855f7",
      20
    );

    if (this.timeLeft <= 0) {
      this.finish();
    }
  }

  hitGoodTarget(type, x, y) {
    this.hits++;
    this.comboCount++;

    this.multiplier = Math.min(
      CONFIG.maxCombo,

      1 +
        Math.floor(
          this.comboCount / 3
        )
    );

    this.maximumCombo = Math.max(
      this.maximumCombo,
      this.multiplier
    );

    let points =
      CONFIG.rabbitPoints;

    if (type === "golden") {
      points =
        CONFIG.goldenPoints;
    } else if (
      type === "freeze"
    ) {
      points =
        CONFIG.freezePoints;
    }

    points *= this.multiplier;

    this.score += points;
    this.levelHits++;

    if (type === "golden") {
      this.timeLeft +=
        CONFIG.goldenBonus;

      this.audio.gold();

      this.showMessage(
        "GOLDEN RABBIT",
        `+${points} / +${CONFIG.goldenBonus.toFixed(1)}s`,
        "#ffd34d"
      );

      this.particleSystem.burst(
        x,
        y,
        "#ffd34d",
        30
      );
    } else if (
      type === "freeze"
    ) {
      this.applyFreeze();
      this.audio.freeze();

      this.showMessage(
        "FREEZE RABBIT",
        `TIME SLOWED! +${points}`,
        "#00f5ff"
      );

      this.particleSystem.burst(
        x,
        y,
        "#00f5ff",
        30
      );
    } else {
      this.audio.hit(
        this.multiplier
      );

      this.showMessage(
        "DIRECT HIT",
        `+${points}`,
        "#00f5ff"
      );

      this.particleSystem.burst(
        x,
        y,
        "#00f5ff",
        20
      );
    }

    this.stageEffect("is-hit");

    this.setStatus(
      "TARGET CONFIRMED",
      "normal"
    );

    clearTimeout(this.comboTimer);

    this.comboTimer = setTimeout(() => {
      this.breakCombo();
      this.updateInterface();
    }, CONFIG.comboReset);

    if (
      this.levelHits >=
      CONFIG.hitsPerLevel
    ) {
      this.levelUp();
    }
  }

  /* ==============================
     FREEZE BONUS
     ============================== */

  applyFreeze() {
    this.isFrozen = true;

    this.elements.stage.classList.add(
      "is-frozen"
    );

    clearTimeout(this.freezeTimer);

    this.freezeTimer = setTimeout(() => {
      this.isFrozen = false;

      this.elements.stage.classList.remove(
        "is-frozen"
      );
    }, 4000);
  }

  /* ==============================
     META JE NESTALA
     ============================== */

  missTarget(id) {
    if (
      !this.targets.has(id) ||
      this.state !== "playing"
    ) {
      return;
    }

    const targetData =
      this.targets.get(id);

    const badTarget =
      targetData.type === "decoy" ||
      targetData.type === "redrabbit" ||
      targetData.type === "net";

    const button =
      targetData.element;

    this.targets.delete(id);

    button.classList.add(
      "is-expiring"
    );

    setTimeout(() => {
      button.remove();
    }, 180);

    /*
     * Igrač nije kažnjen ako propusti:
     * crvenog zeca, mamac ili mrežu.
     */
    if (!badTarget) {
      this.attempts++;
      this.breakCombo();
      this.lives--;
      this.audio.bad();

      this.showMessage(
        "TARGET ESCAPED",
        "LIFE -1",
        "#ff325f"
      );

      this.stageEffect(
        "is-damaged"
      );

      this.setStatus(
        "TARGET ESCAPED",
        "warning"
      );

      if (this.lives <= 0) {
        this.finish();
        return;
      }
    }

    this.updateInterface();
  }

  emptyTap() {
    this.taps++;

    this.breakCombo();

    this.audio.tone(
      180,
      0.08,
      "triangle",
      130
    );

    this.showMessage(
      "MISS",
      "COMBO RESET",
      "#8fa3b8"
    );

    this.updateInterface();
  }

  /* ==============================
     NOVI NIVO
     ============================== */

  levelUp() {
    this.levelHits = 0;

    if (
      this.level <
      CONFIG.maxLevel
    ) {
      this.level++;
    }

    this.audio.level();

    this.stageEffect(
      "is-level-up"
    );

    this.showMessage(
      `LEVEL ${String(this.level).padStart(2, "0")}`,
      "SYSTEM SPEED & TARGETS UP!",
      "#ffd34d"
    );

    this.setStatus(
      "LEVEL ADVANCED",
      "normal"
    );
  }

  breakCombo() {
    this.comboCount = 0;
    this.multiplier = 1;

    clearTimeout(this.comboTimer);
  }

  removeAllTargets() {
    for (
      const targetData
      of this.targets.values()
    ) {
      clearTimeout(
        targetData.timerId
      );

      targetData.element.remove();
    }

    this.targets.clear();
  }

  /* ==============================
     PAUZA
     ============================== */

  pause() {
    if (this.state !== "playing") {
      return;
    }

    this.state = "paused";

    if (this.animationFrame) {
      cancelAnimationFrame(
        this.animationFrame
      );
    }

    clearTimeout(this.spawnTimer);

    this.removeAllTargets();

    this.showOverlay(
      this.elements.pauseOverlay,
      true
    );

    this.elements.pauseButton.disabled =
      true;

    this.setStatus(
      "SYSTEM SUSPENDED",
      "warning"
    );
  }

  resume() {
    if (this.state !== "paused") {
      return;
    }

    this.showOverlay(
      this.elements.pauseOverlay,
      false
    );

    this.state = "playing";

    this.elements.pauseButton.disabled =
      false;

    this.lastFrameTime =
      performance.now();

    this.animationFrame =
      requestAnimationFrame(time => {
        this.gameLoop(time);
      });

    this.scheduleSpawn(300);

    this.setStatus(
      "TARGET ACQUISITION",
      "normal"
    );

    this.audio.click();
  }

  togglePause() {
    if (this.state === "playing") {
      this.pause();
    } else if (
      this.state === "paused"
    ) {
      this.resume();
    }
  }

  /* ==============================
     KRAJ IGRE
     ============================== */

  finish() {
    if (this.state === "gameover") {
      return;
    }

    this.state = "gameover";

    if (this.animationFrame) {
      cancelAnimationFrame(
        this.animationFrame
      );
    }

    clearTimeout(this.spawnTimer);
    clearTimeout(this.comboTimer);
    clearTimeout(this.freezeTimer);

    this.removeAllTargets();

    this.elements.pauseButton.disabled =
      true;

    const newRecord =
      this.score > this.bestScore;

    if (newRecord) {
      this.bestScore = this.score;

      localStorage.setItem(
        CONFIG.bestKey,
        String(this.bestScore)
      );
    }

    const accuracy =
      this.attempts
        ? Math.round(
            this.hits /
            this.attempts *
            100
          )
        : 0;

    this.elements.finalScoreValue.textContent =
      pad(this.score);

    this.elements.finalBestValue.textContent =
      pad(this.bestScore);

    this.elements.finalComboValue.textContent =
      `×${this.maximumCombo}`;

    this.elements.finalAccuracyValue.textContent =
      `${accuracy}%`;

    this.elements.resultRank.textContent =
      this.getRank();

    this.elements.newRecordMessage.classList.toggle(
      "is-visible",
      newRecord
    );

    this.updateInterface();

    this.showOverlay(
      this.elements.gameOverOverlay,
      true
    );

    this.setStatus(
      "SESSION COMPLETE",
      "danger"
    );

    this.audio.over();
  }

  getRank() {
    if (this.score >= 500000) {
      return "WHITE HAT GODLIKE";
    }

    if (this.score >= 150000) {
      return "CYBER HUNTER";
    }

    if (this.score >= 50000) {
      return "REFLEX OPERATIVE";
    }

    if (this.score >= 10000) {
      return "RABBIT TRACKER";
    }

    return "REFLEX ROOKIE";
  }

  /* ==============================
     INTERFEJS
     ============================== */

  setStatus(text, type) {
    this.elements.statusText.textContent =
      text;

    const statusChip =
      document.querySelector(
        ".status-chip"
      );

    if (!statusChip) {
      return;
    }

    statusChip.classList.toggle(
      "is-danger",
      type === "danger"
    );

    statusChip.classList.toggle(
      "is-warning",
      type === "warning"
    );
  }

  showMessage(
    mainText,
    subText,
    color
  ) {
    this.elements.floatingMain.textContent =
      mainText;

    this.elements.floatingSub.textContent =
      subText;

    this.elements.floatingMessage.style.color =
      color;

    this.elements.floatingMessage.classList.remove(
      "is-visible"
    );

    requestAnimationFrame(() => {
      this.elements.floatingMessage.classList.add(
        "is-visible"
      );
    });
  }

  stageEffect(className) {
    this.elements.stage.classList.remove(
      className
    );

    requestAnimationFrame(() => {
      this.elements.stage.classList.add(
        className
      );
    });

    setTimeout(() => {
      this.elements.stage.classList.remove(
        className
      );
    }, 700);
  }

  updateSoundButton() {
    this.elements.soundButton.setAttribute(
      "aria-pressed",
      String(this.audio.enabled)
    );

    this.elements.soundIcon.textContent =
      this.audio.enabled
        ? "◉"
        : "○";
  }

  updateInterface() {
    this.elements.scoreValue.textContent =
      pad(this.score);

    this.elements.bestScoreValue.textContent =
      pad(this.bestScore);

    this.elements.comboValue.textContent =
      String(this.multiplier);

    this.elements.levelValue.textContent =
      String(this.level).padStart(2, "0");

    const safeTime =
      Number.isFinite(this.timeLeft)
        ? this.timeLeft
        : CONFIG.time;

    this.elements.timeValue.textContent =
      safeTime.toFixed(1);

    this.elements.comboCard.classList.toggle(
      "is-hot",
      this.multiplier >= 3
    );

    this.elements.progressText.textContent =
      `${this.levelHits} / ${CONFIG.hitsPerLevel}`;

    this.elements.progressFill.style.width =
      `${this.levelHits / CONFIG.hitsPerLevel * 100}%`;

    [
      ...this.elements
        .livesContainer
        .children
    ].forEach((element, index) => {
      element.classList.toggle(
        "life--active",
        index < this.lives
      );

      element.classList.toggle(
        "life--lost",
        index >= this.lives
      );
    });
  }
}

/* ==============================
   POKRETANJE APLIKACIJE
   ============================== */

window.addEventListener(
  "DOMContentLoaded",
  () => {
    try {
      new Game();
    } catch (error) {
      console.error(error);

      alert(
        "Igra nije mogla da se pokrene. " +
        "Proveri da li su index.html, " +
        "style.css i script.js " +
        "u istom folderu."
      );
    }
  }
);
