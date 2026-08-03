/* AKTIVACIJA SREĆKO ZECA — ROCKET GUNNER */
  triggerSreckoGunner(x, y) {
    this.audio.emp(); // Fanfara sound
    this.flash("SREĆKO HAS ENTERED THE ARENA", "ROCKET GUNNER ONLINE! WRRAAAAA!", "#ffd34d");

    // Srećko puca u sve loše mete u roku od 3 sekunde
    const targetsToDestroy = [...this.targets.entries()].filter(([_, t]) => 
      ["hacker", "redrabbit", "decoy", "net"].includes(t.type)
    );

    targetsToDestroy.forEach(([id, t], index) => {
      setTimeout(() => {
        if (this.state !== "playing") return;

        // Vizuelni laserski metak od Srećka do mete
        const bullet = document.createElement("div");
        bullet.className = "laser-bullet";
        bullet.style.left = `${x}px`;
        bullet.style.top = `${y}px`;
        this.e.stage.appendChild(bullet);

        requestAnimationFrame(() => {
          bullet.style.left = `${t.x}px`;
          bullet.style.top = `${t.y}px`;
        });

        // Kada metak stigne -> uništi metu
        setTimeout(() => {
          bullet.remove();
          if (this.targets.has(id)) {
            clearTimeout(t.timerId);
            this.targets.delete(id);
            t.element.classList.add("is-expiring");
            this.particles.burst(t.x, t.y, "#ffd34d", 15);
            this.audio.hit();
            setTimeout(() => t.element.remove(), 150);
          }
        }, 220);

      }, index * 250); // Rafal na svakih 250ms
    });

    // Dodatni bonus +1000 poena za igračev tim!
    this.score += 1000;
    this.update();
  }
