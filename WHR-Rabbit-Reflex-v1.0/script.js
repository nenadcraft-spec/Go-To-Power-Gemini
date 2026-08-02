hit(id, type, button, x, y) {
    if (this.isTutorial) {
      const step = TUTORIAL_STEPS[this.tutorialCurrentIndex];
      if (step && step.action === "click") {
        button.remove();
        this.targets.delete(id);
        this.e.tutorialHud.classList.add("is-success");
        this.audio.hit(1);
        setTimeout(() => this.nextTutorialStep(), 300);
      } else {
        // POGREŠAN KLIK U TUTORIJALU - DEMONSTRACIJA PUNOG FX PAKLA!
        button.remove();
        this.targets.delete(id);
        this.e.tutorialHud.classList.add("is-error");
        this.audio.bad();

        // Demonstracija specifičnih vizuelnih posledica u zavisnosti od pretnje
        if (type === "redrabbit") {
          this.effect("is-damaged");
          this.flash("GRESKA!", "CRVENI IMPACT // COMBO RESET!", "#ff325f");
          this.particles.burst(x, y, "#ff0033", 30);
        } else if (type === "decoy") {
          this.applyMonochrome(1500);
          this.flash("GRESKA!", "BEZBOJNI VIRUS // COLOR LOST!", "#ffffff");
          this.particles.burst(x, y, "#ffffff", 25);
        } else if (type === "net") {
          this.applyCyberNetOverlay(1500);
          this.flash("GRESKA!", "CYBER NET // NETWORK BLOCKED!", "#a855f7");
          this.particles.burst(x, y, "#a855f7", 25);
        } else if (type === "hacker") {
          this.applyHackerVirus(1500);
          this.flash("GRESKA!", "VIRUS UPLOADED // SYSTEM PANIC!", "#ff38c7");
          this.particles.burst(x, y, "#ff38c7", 30);
        } else {
          this.flash("GRESKA!", "NE SMES KLIKNUTI OVU METU!", "#ff325f");
        }

        setTimeout(() => this.spawnTutorialStep(), 1200);
      }
      return;
    }

    if (this.state !== "playing" || !this.targets.has(id)) return;

    const target = this.targets.get(id);

    clearTimeout(target.timerId);
    clearTimeout(target.cloneTimerId);
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);
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
        this.flash("LIFE BANK FULL", `+${CONFIG.extraLifeFullPoints} PTS`, "#55ff88");
      }
      this.effect("is-hit");
      this.setStatus("LIFE RESTORED", "normal");
      this.particles.burst(x, y, "#55ff88", 36);
    } else if (type === "decoy") {
      this.lives--;
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.decoyPenaltyTime);
      this.breakCombo();
      this.applyMonochrome(CONFIG.decoyMonoDuration);
      this.flash("BEZBOJNI VIRUS", `LIFE -1 / -${CONFIG.decoyPenaltyTime}s`, "#ffffff");
      this.effect("is-damaged");
      this.setStatus("COLOR SIGNAL LOST", "danger");
      this.particles.burst(x, y, "#ffffff", 24);
      this.particles.burst(x, y, "#565b66", 18);

      if (this.lives <= 0 || this.timeLeft <= 0) {
        setTimeout(() => this.finish(), 180);
        return;
      }
    } else if (type === "redrabbit") {
      this.score = Math.max(0, this.score - CONFIG.redPenaltyPoints);
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.redPenaltyTime);
      this.breakCombo();
      this.flash("RED RABBIT HIT!", `-${CONFIG.redPenaltyPoints} PTS / -${CONFIG.redPenaltyTime}s`, "#ff0033");
      this.effect("is-damaged");
      this.setStatus("CRITICAL ERROR!", "danger");
      this.particles.burst(x, y, "#ff0033", 35);
    } else if (type === "net") {
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.netPenaltyTime);
      this.applyCyberNetOverlay(CONFIG.netOverlayDuration);
      this.flash("CYBER NET!", `-${CONFIG.netPenaltyTime}s`, "#a855f7");
      this.effect("is-damaged");
      this.setStatus("NETWORK BLOCKED!", "warning");
      this.particles.burst(x, y, "#a855f7", 20);
    } else if (type === "hacker") {
      this.score = Math.max(0, this.score - CONFIG.hackerPenaltyPoints);
      this.applyHackerVirus();
      this.flash("HACKER RABBIT HIT!", `-${CONFIG.hackerPenaltyPoints} PTS // VIRUS UPLOADED`, "#ff38c7");
      this.setStatus("SYSTEM INFECTED", "danger");
      this.particles.burst(x, y, "#00f5ff", 22);
      this.particles.burst(x, y, "#ff38c7", 22);
    } else if (type === "hero") {
      this.hits++;
      this.advanceComboAndLevel();
      this.applyAntiCheat(button, x, y);
      this.particles.burst(x, y, "#fff4dc", 24);
      this.particles.burst(x, y, "#ff7a00", 28);
    } else {
      this.hits++;
      this.advanceComboAndLevel();

      let points = CONFIG.rabbitPoints;
      if (type === "golden") points = CONFIG.goldenPoints;
      else if (type === "freeze") points = CONFIG.freezePoints;

      points *= this.mult;
      this.score += points;
      if (type === "golden") {
        this.timeLeft += CONFIG.goldenBonus;
        this.flash("GOLDEN RABBIT", `+${points} / +${CONFIG.goldenBonus.toFixed(1)}s`, "#ffd34d");
        this.particles.burst(x, y, "#ffd34d", 30);
      } else if (type === "freeze") {
        this.timeLeft = Math.max(0, this.timeLeft - CONFIG.freezeHitPenalty);
        this.applyTimeDistortion(CONFIG.freezeRushScale, CONFIG.freezeRushDuration, "is-time-rush");
        this.flash("PLAVI ANOMALY", `+${points} / -${CONFIG.freezeHitPenalty}s / TIME x1.2`, "#168bff");
        this.particles.burst(x, y, "#00f5ff", 30);
      } else {
        this.flash("DIRECT HIT", `+${points}`, "#00f5ff");
        this.particles.burst(x, y, "#00f5ff", 20);
      }

      this.effect("is-hit");
      this.setStatus("TARGET CONFIRMED", "normal");
    }

    setTimeout(() => button.remove(), 230);
    this.update();
  }
