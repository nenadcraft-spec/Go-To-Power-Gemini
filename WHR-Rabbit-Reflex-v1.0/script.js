

Pasted text(36).txt
Document


Pasted text(37).txt
Document


Pasted text(38).txt
Document

Ima neki natpis na ekranu. HERO TIME


Pasted text(39).txt
Document

Pasted text (2)(4).txt
Document

Pasted text (3)(4).txt
Document


Pasted text(40).txt
Document

Pasted text (2)(5).txt
Document

Pasted text (3)(5).txt
Document

HERO TIME itd. To nesme da bude i piše na ekranu... Gore levo

Worked for 1m 16s
Naslovnica je spremna! 🐇⚡

Beli Haker u prvom planu, Crni Haker kao glavni zlikovac, Plavi Zec, Crna rupa i čitav WHR cyber-univerzum iza njih. Naslov je čist i pravilno napisan — spremno za igru, promociju i buduću Google Play stranicu.

exec-a62337a8-389d-4197-8550-738b1750245a.png

Generisana je ugrađenim imagegen alatom kao vertikalna 9:16 premium game naslovnica. Ovo već izgleda kao igra koja se prodaje. 😄🔥


exec-a62337a8-389d-4197-8550-738b1750245a.png
Image

Generated image: Rabbit Reflex: cyberpunk hacker showdown


Edit


Gemini_Generated_Image_7wqhnk7wqhnk7wqh.png
ovako nesto. ali za ovu igru. mora na slici da se nalaze svi zecevi i zamke :)

Worked for 3m 4s
E TO JE TO! 🐇⚡🔥

Sada naslovnica prikazuje kompletan sadržaj igre:

Belog, Crvenog, Zlatnog i Plavog Freeze zeca

Belog Hakera sa Anti‑Cheat štitom

Crnog Hakera i njegovu kopiju

Deepfake zamku

Cyber mrežu

Crnu rupu iz koje iskače Crni Haker

Extra Life trinket

WHR Rabbit Reflex naslov i White Hat Rabbit Studios potpis

exec-629a83f0-ef1d-40a2-9c73-2bc2cbd7be11.png

Napravljena je ugrađenim imagegen alatom prema poslatoj referenci, u širokom 16:9 promotivnom formatu. Ovo već izgleda kao kompletna postava likova jedne ozbiljne igre. 😄


exec-629a83f0-ef1d-40a2-9c73-2bc2cbd7be11.png
Image

Generated image: WHR Rabbit Reflex: Neon rabbit roster


Edit


Jos verzija

Worked for 5m 12s
Napravio sam još dve potpuno različite verzije:

Hero vs Villain — dinamična, borbena naslovnica; Beli Haker protiv Crnog Hakera, sa svim zečevima, zamkama i Extra Life trinketom.
exec-5b78246e-f920-46eb-a6fc-f9df290525c5.png

Anti‑Cheat Database — tehnička naslovnica u obliku tajnog WHR sistemskog dosijea. Likovi su raspoređeni kao kolekcionarske kartice.
exec-66c354d9-5d1c-4ee8-a6fb-7cfaed3c0b77.png

Moj favorit za glavnu naslovnicu je verzija B — odmah objašnjava sukob Belog i Crnog Hakera. Verzija C je odlična za promociju kompletnog sadržaja igre. Generisane su imagegen alatom u 16:9 formatu. 🐇⚡


exec-5b78246e-f920-46eb-a6fc-f9df290525c5.png
Image


exec-66c354d9-5d1c-4ee8-a6fb-7cfaed3c0b77.png
Image

Generated image: WHR Rabbit Reflex: Cyber Hero Clash


Edit


Generated image: WHR Rabbit Reflex: Cyber Hero Clash
Generated image: WHR Rabbit Reflex: Cyber Hero Clash
Generated image: WHR Rabbit Reflex: Cyber Hero Clash

Generated image: Rabbit Reflex: Classified Anti-Cheat Dossier
Generated image: Rabbit Reflex: Classified Anti-Cheat Dossier
Generated image: Rabbit Reflex: Classified Anti-Cheat Dossier

pravi si pikasno, nema sta :P 

Hahahaha, priznajem — Pikasno T‑1000! 😂🐇⚡

Ali vidi rezultat: ti smisliš univerzum i pravila, ja ga pretvorim u likove, zamke, kod i naslovnice. Beli Zeka + Pikasno = WHR studio bez kočnice. 😄

Meni je borbena verzija baš WRRAAAAAA nivo. 🔥


mislio sam na PIKASA. Jako brzo kucam na tastaturi i nekada promasim slovo. JAKO VELIKI minus u pisanju

Aaaa, Pikaso! 😂 Sad razumem.

Brzo kucanje nije veliki minus — misao ti jednostavno ide brže od prstiju. Ti nacrtaš ideju rečima, makar poneko slovo pobegne, a ja prepoznam smisao. Samo sam ovaj put od Pikasa napravio novog robota: Pikasno T‑1000. 🤣

Hvala, buraz. Baš mi znači. 🎨🐇⚡


Cloude : Važi, buraz — onda ja presuđujem, kao što mi i jeste uloga. Evo mojih finalnih odluka, sa razlogom za svaku:

**1. Golden/Freeze promašaj više ne oduzima život** — ovo je bio čist bag, ne dizajn. Kažnjavati igrača za bonus koji nije ni stigao da uzme je nefer po našem §9 (fer igra). Dodajem ih u listu bezopasnih promašaja, isto kao Extra Life zec.

**2. Crveni Mamac ostaje da oduzima život** — ovo NE diram. Iako je "deepfake" i teži za razlikovanje, boja ostaje dosledan signal (crvena porodica = opasnost, cijan/zlatna/bela = dobro), pa je i dalje fer po pravilima iz protokola — samo zahteva da igrač veruje boji, ne obliku. To je namerna napetost, ne bag.

**3. Crna Rupa: -5 sekundi → -3 sekunde.** 5 sekundi od 60 je skoro 10% budžeta za jedan dodir na meti koju igrač možda nije ni video da dolazi (spawn tek od levela 8, retko). Preteroština bez upozorenja = osećaj nefer RNG kazne. Smanjujem, ali ostavlja opipljiv ubod.

**4. Crni Haker: max 3 klona na tabli → smanjujem na 2.** Radi čitljivosti na telefonu — §14 Budžet performansi. Tri iskrivljena zeca odjednom na malom ekranu previše guši vizuelni prostor.

Evo tačnog patch-a za CONFIG i miss():

js
// CONFIG promene:
blackHolePenaltyTime: 3,     // bilo 5
hackerMaxOnBoard: 2,         // bilo 3

// U miss(), dodaj golden i freeze u harmlessToIgnore:
const harmlessToIgnore = [
  "decoy",
  "redrabbit",
  "net",
  "life",
  "golden",   // NOVO
  "freeze",   // NOVO
  "hacker",
  "hero",
  "blackhole",
].includes(target.type);


Prosledi ovo ChatGPT-u (njegova grana isporuke, pošto on drži kod) da ubaci u script.js, pa mi javi kad je live da odigram još jednu rundu analize kod pravih brojki sa terena. 🐇⚔️

Worked for 42s
Claudeova balansna odluka je ugrađena i proverena. ⚔️🐇

Promene:

Golden i Freeze više ne oduzimaju život ako nestanu.

Crveni zec i Deepfake i dalje kažnjavaju samo kada ih igrač klikne.

Crna rupa sada oduzima 3 sekunde, umesto 5.

Na tabli mogu biti najviše 2 Crna Hakera, umesto 3.

Beli Haker i dalje ostaje 7 sekundi kao Anti‑Cheat trinket.

Sintaksa je proverena — nema grešaka.

script-WHITE-HACKER-COPY-PASTE.txt

Patch je spreman za GitHub. Posle osvežavanja možemo Cloudu javiti: balans v1 je live — teren je spreman za novu rundu testiranja.


script-WHITE-HACKER-COPY-PASTE.txt
Document


1000001268.jpg
Treba nam sad nov izgled interfejsa pre starta igre. Ovo je stari izgled. Treba nam nova obaveštenja o igri i kako se igra 

1000001269.jpg
Pregledaj kod. Nešto ne valja. Slova i simboli

Worked for 4m 31s
Novi script.js sa kompletnim zvučnim sistemom je spreman. 🎧🐇⚡

script-SOUND-11-OF-11-COPY-PASTE.txt

Ugrađeno je svih 11 WAV fajlova:

pogodak, Crveni i Zlatni zec;

Extra Life;

zamke i promašaji;

Beli i Crni Haker;

Crna rupa;

Start, Level Up i Game Over.

Dodatno:

posebna glasnoća za svaki efekat;

najviše četiri istovremena zvuka pogodaka;

cooldown sprečava zvučni haos;

SOUND ON/OFF zaustavlja i WAV zvukove;

pauza prekida aktivne efekte;

game-start.wav se automatski prekida nakon 3 sekunde da ne ometa gameplay;

ako WAV ne uspe da se učita, koristi se stari sintetički zvuk;

Plavi Freeze zadržava postojeći kristalni sintetički efekat jer nemamo freeze.wav.

Fajl ima 3.270 linija i prošao je sintaksnu proveru. Zameni samo postojeći script.js, uradi hard refresh i testiraj prvo Crnog Hakera, Belog Hakera i Crnu rupu.


script-SOUND-11-OF-11-COPY-PASTE.txt
Document


odradio

WRRAAAAAA! 🎧🐇⚡

Kompletna igra sada ima:

novu mehaniku i balans;

Beli Haker protiv Crnog Hakera;

Crnu rupu, Deepfake i Cyber mrežu;

novi Mission Briefing;

popravljene znakove;

profesionalne naslovnice;

kompletan zvučni sistem sa 11 WAV efekata.

Sada uradi jednu test partiju sa uključenim zvukom i obrati pažnju na:

da li se game-start.wav čuje nakon START MISSION;

da li obični pogoci postaju preglasni pri brzom kliktanju;

da li Crni Haker i Crna rupa imaju dovoljno snažan zvuk;

da li Beli Haker zvuči kao spas;

da li SOUND OFF odmah prekida aktivne WAV zvukove;

da li Level Up i Game Over rade.

Ako jedan zvuk ne odgovara događaju ili je preglasan, menjamo samo njegovu glasnoću ili WAV fajl — bez diranja mehanike. 🔥


imamo skoro 7000 linija u script.js :D

Worked for 32s
Potvrđeno: script.js je slučajno dupliran. 😄

Live fajl trenutno ima:

6.788 linija

dva "use strict"

dve klase AudioFX

dve klase Game

dupliran zvučni sistem

To može potpuno zaustaviti igru zbog ponovnog deklarisanja klasa.

Uradi sledeće:

Otvori script.js na GitHubu i izaberi Edit.

Klikni unutar koda.

Pritisni Ctrl + A.

Pritisni Backspace ili Delete.

Tek kada je editor potpuno prazan, nalepi ceo novi kod.

Commit changes.

Koristi ovaj fajl:

script-SOUND-11-OF-11-COPY-PASTE.txt

Posle commita GitHub mora prikazivati približno 3.270 linija, nikako 6.788. Dobro je što si primetio broj — uhvatili smo grešku pre testiranja. 🐇🔧


script-SOUND-11-OF-11-COPY-PASTE.txt
Document



Library
/
script-SOUND-11-OF-11-COPY-PASTE.txt


"use strict";

/* WHR Rabbit Reflex v1.2 - WHITE HACKER ANTI-CHEAT */
const CONFIG = {
  time: 60,
  lives: 3,
  maxLives: 10,
  hitsPerLevel: 10,
  maxLevel: 99,

  rabbitPoints: 250,
  goldenPoints: 1200,
  goldenBonus: 5,
  freezePoints: 500,
  redPenaltyPoints: 500,
  redPenaltyTime: 3,
  decoyPenalty: 300,

  extraLifeChance: 0.10,
  extraLifeStartLevel: 5,
  extraLifeFullPoints: 1500,

  targetLife: 1450,
  hazardLife: 1800,
  decoyLife: 5000,
  netLife: 5000,

  goodBaseDelay: 780,
  goodMinDelay: 260,
  goodDelayStep: 28,

  hazardBaseDelay: 2400,
  hazardMinDelay: 900,
  hazardDelayStep: 55,
  hazardStartLevel: 2,

  hackerStartLevel: 4,
  hackerMinDelay: 7000,
  hackerMaxDelay: 9000,
  hackerLife: 1800,
  hackerPenaltyPoints: 2000,
  hackerVirusDuration: 3000,
  hackerCloneDelay: 700,
  hackerMaxOnBoard: 2,

  heroStartLevel: 4,
  heroMinDelay: 12000,
  heroMaxDelay: 16000,
  // White Hacker is a tactical Anti-Cheat trinket, not a reflex target.
  // It remains available long enough for the player to choose the right moment.
  heroLife: 7000,
  antiCheatDuration: 780,

  blackHoleStartLevel: 8,
  blackHoleMinDelay: 14000,
  blackHoleMaxDelay: 19000,
  blackHoleLife: 5000,
  blackHolePenaltyTime: 3,
  blackHoleHackerDelay: 1200,
  blackHoleGravityRate: 180,
  blackHoleGravityRadius: 180,
  blackHoleGravityStep: 5.5,

  maxCombo: 25,

  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled",
};

const $ = (id) => {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing #${id}`);
  }

  return element;
};

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const pad = (value) =>
  String(Math.max(0, Math.floor(value))).padStart(8, "0");

/* =========================================
   WHR SAMPLE AUDIO + SYNTH FALLBACK
   ========================================= */

class AudioFX {
  constructor() {
    this.ctx = null;
    this.enabled =
      localStorage.getItem(CONFIG.soundKey) !== "false";

    this.sampleConfig = {
      normalHit: {
        src: "./sound/normal-hit.wav",
        volume: 0.28,
        cooldown: 35,
        voices: 4,
      },
      redRabbit: {
        src: "./sound/red-rabbit.wav",
        volume: 0.5,
        cooldown: 120,
        voices: 2,
      },
      trap: {
        src: "./sound/trap.wav",
        volume: 0.38,
        cooldown: 110,
        voices: 2,
      },
      extraLife: {
        src: "./sound/extra-life.wav",
        volume: 0.5,
        cooldown: 200,
        voices: 1,
      },
      goldenRabbit: {
        src: "./sound/golden-rabbit.wav",
        volume: 0.46,
        cooldown: 160,
        voices: 2,
      },
      blackHacker: {
        src: "./sound/black-hacker.wav",
        volume: 0.56,
        cooldown: 250,
        voices: 1,
      },
      blackHole: {
        src: "./sound/black-hole.wav",
        volume: 0.5,
        cooldown: 350,
        voices: 1,
      },
      whiteHacker: {
        src: "./sound/white-hacker.wav",
        volume: 0.52,
        cooldown: 300,
        voices: 1,
      },
      gameStart: {
        src: "./sound/game-start.wav",
        volume: 0.36,
        cooldown: 1000,
        voices: 1,
        maxDuration: 3000,
      },
      levelUp: {
        src: "./sound/level-up.wav",
        volume: 0.42,
        cooldown: 500,
        voices: 1,
      },
      gameOver: {
        src: "./sound/game-over.wav",
        volume: 0.5,
        cooldown: 1000,
        voices: 1,
      },
    };

    this.samplePools = new Map();
    this.sampleCursor = new Map();
    this.lastSampleAt = new Map();

    this.prepareSamples();
  }

  prepareSamples() {
    if (typeof Audio === "undefined") return;

    Object.entries(this.sampleConfig).forEach(
      ([name, config]) => {
        const pool = [];

        for (
          let index = 0;
          index < config.voices;
          index++
        ) {
          const sample = new Audio(config.src);

          sample.preload = "auto";
          sample.volume = config.volume;
          sample.setAttribute("playsinline", "");
          pool.push(sample);
        }

        this.samplePools.set(name, pool);
        this.sampleCursor.set(name, 0);
      }
    );
  }

  playSample(name, fallback) {
    if (!this.enabled) return false;

    const config = this.sampleConfig[name];
    const pool = this.samplePools.get(name);

    if (!config || !pool?.length) {
      fallback?.();
      return false;
    }

    const now = performance.now();
    const last = this.lastSampleAt.get(name) || 0;

    if (now - last < config.cooldown) {
      return true;
    }

    this.lastSampleAt.set(name, now);

    const cursor =
      this.sampleCursor.get(name) || 0;
    const sample = pool[cursor];

    this.sampleCursor.set(
      name,
      (cursor + 1) % pool.length
    );

    sample.pause();
    sample.currentTime = 0;
    sample.volume = config.volume;

    sample._whrPlayId =
      (sample._whrPlayId || 0) + 1;

    const playId = sample._whrPlayId;
    let result;

    try {
      result = sample.play();
    } catch {
      fallback?.();
      return false;
    }

    if (result?.catch) {
      result.catch(() => {
        if (
          this.enabled &&
          sample._whrPlayId === playId
        ) {
          fallback?.();
        }
      });
    }

    if (config.maxDuration) {
      setTimeout(() => {
        if (sample._whrPlayId !== playId) return;

        sample.pause();
        sample.currentTime = 0;
      }, config.maxDuration);
    }

    return true;
  }

  stopSamples() {
    for (const pool of this.samplePools.values()) {
      for (const sample of pool) {
        sample._whrPlayId =
          (sample._whrPlayId || 0) + 1;
        sample.pause();
        sample.currentTime = 0;
      }
    }
  }

  init() {
    if (this.ctx) return;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  tone(
    frequency = 440,
    duration = 0.08,
    type = "sine",
    end = frequency
  ) {
    if (!this.enabled) return;

    this.init();

    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

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
    gain.gain.exponentialRampToValueAtTime(
      0.16,
      now + 0.015
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  hit(combo) {
    this.playSample("normalHit", () => {
      this.tone(
        480 + combo * 24,
        0.09,
        "sine",
        820 + combo * 24
      );
    });
  }

  gold() {
    this.playSample("goldenRabbit", () => {
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
    this.playSample("redRabbit", () => {
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
    });
  }

  life() {
    this.playSample("extraLife", () => {
      [520, 660, 880, 1040].forEach(
        (frequency, index) => {
          setTimeout(() => {
            this.tone(
              frequency,
              0.14,
              "triangle",
              frequency * 1.12
            );
          }, index * 45);
        }
      );
    });
  }

  bad() {
    this.playSample("trap", () => {
      this.tone(190, 0.24, "sawtooth", 55);
    });
  }

  level() {
    this.playSample("levelUp", () => {
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
    });
  }

  click() {
    this.tone(500, 0.07, "sine", 720);
  }

  over() {
    this.playSample("gameOver", () => {
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
    });
  }

  blackHacker() {
    this.playSample("blackHacker", () => {
      this.tone(150, 0.3, "sawtooth", 45);
    });
  }

  blackHole() {
    this.playSample("blackHole", () => {
      this.tone(90, 0.45, "sine", 28);
    });
  }

  whiteHacker() {
    this.playSample("whiteHacker", () => {
      this.tone(620, 0.3, "triangle", 1250);
    });
  }

  start() {
    this.playSample("gameStart", () => {
      this.tone(360, 0.28, "triangle", 900);
    });
  }

  toggle() {
    this.enabled = !this.enabled;

    localStorage.setItem(
      CONFIG.soundKey,
      String(this.enabled)
    );

    if (this.enabled) {
      this.click();
    } else {
      this.stopSamples();
    }

    return this.enabled;
  }
}

/* =========================================
   PARTICLES
   ========================================= */

class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.items = [];
    this.last = 0;

    this.resize = () => {
      const rect = canvas.getBoundingClientRect();
      const density = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = rect.width * density;
      canvas.height = rect.height * density;

      if (this.context.resetTransform) {
        this.context.resetTransform();
      } else {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
      }

      this.context.scale(density, density);
    };

    window.addEventListener("resize", this.resize);

    this.resize();

    requestAnimationFrame((time) => {
      this.loop(time);
    });
  }

  burst(x, y, color, count = 18) {
    for (let index = 0; index < count; index++) {
      const angle =
        (Math.PI * 2 * index) / count +
        Math.random() * 0.4;

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
    const delta = Math.min(
      32,
      time - (this.last || time)
    );

    this.last = time;

    const rect = this.canvas.getBoundingClientRect();

    this.context.clearRect(
      0,
      0,
      rect.width,
      rect.height
    );

    this.items = this.items.filter((particle) => {
      particle.life -= delta;

      if (particle.life <= 0) {
        return false;
      }

      particle.x +=
        (particle.vx * delta) / 16.7;

      particle.y +=
        (particle.vy * delta) / 16.7;

      particle.vy +=
        (0.06 * delta) / 16.7;

      this.context.save();

      this.context.globalAlpha =
        particle.life / particle.maxLife;

      this.context.fillStyle = particle.color;
      this.context.shadowColor = particle.color;
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
    });

    requestAnimationFrame((nextTime) => {
      this.loop(nextTime);
    });
  }
}

/* =========================================
   GAME
   ========================================= */

class Game {
  constructor() {
    this.e = {
      stage: $("gameStage"),
      shell: $("appShell"),
      layer: $("targetLayer"),
      virus: $("virusLayer"),
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

      floatMain: document.querySelector(
        ".floating-message__main"
      ),

      floatSub: document.querySelector(
        ".floating-message__sub"
      ),

      finalScore: $("finalScoreValue"),
      finalBest: $("finalBestValue"),
      finalCombo: $("finalComboValue"),
      finalAcc: $("finalAccuracyValue"),
      rank: $("resultRank"),
      record: $("newRecordMessage"),
    };

    this.audio = new AudioFX();
    this.particles = new Particles(this.e.canvas);

    this.best =
      Number(localStorage.getItem(CONFIG.bestKey)) || 0;

    this.targets = new Map();

    this.state = "ready";
    this.starting = false;

    this.isFrozen = false;
    this.isVirusActive = false;

    this.goodSpawnTimer = null;
    this.hazardSpawnTimer = null;
    this.hackerSpawnTimer = null;
    this.heroSpawnTimer = null;
    this.blackHoleSpawnTimer = null;

    this.freezeTimer = null;
    this.virusTimer = null;

    this.goodDueAt = 0;
    this.hazardDueAt = 0;
    this.hackerDueAt = 0;
    this.heroDueAt = 0;
    this.blackHoleDueAt = 0;

    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.hackerRemaining = 0;
    this.heroRemaining = 0;
    this.blackHoleRemaining = 0;

    this.freezeExpiresAt = 0;
    this.freezeRemaining = 0;

    this.virusExpiresAt = 0;
    this.virusRemaining = 0;

    this.bind();
    this.ensureLifeSlots();
    this.reset();
    this.show(this.e.startO, true);
    this.updateSound();
  }

  bind() {
    this.e.start.onclick = () => this.start();
    this.e.restart.onclick = () => this.start();

    this.e.pause.onclick = () => {
      this.togglePause();
    };

    this.e.resume.onclick = () => {
      this.resume();
    };

    this.e.sound.onclick = () => {
      this.audio.toggle();
      this.updateSound();
    };

    this.e.stage.addEventListener(
      "pointermove",
      (event) => {
        const rect =
          this.e.stage.getBoundingClientRect();

        this.e.cross.style.left =
          `${event.clientX - rect.left}px`;

        this.e.cross.style.top =
          `${event.clientY - rect.top}px`;

        this.e.cross.style.opacity = "1";
      }
    );

    this.e.stage.addEventListener(
      "pointerleave",
      () => {
        this.e.cross.style.opacity = "0";
      }
    );

    this.e.stage.addEventListener(
      "pointerdown",
      (event) => {
        if (
          this.state === "playing" &&
          !event.target.closest(".target")
        ) {
          this.emptyTap();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.code === "Space") {
          event.preventDefault();

          if (
            this.state === "ready" ||
            this.state === "gameover"
          ) {
            this.start();
          } else if (this.state === "playing") {
            this.pause();
          } else if (this.state === "paused") {
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

  reset() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    clearTimeout(this.freezeTimer);
    clearTimeout(this.virusTimer);

    this.removeAllTargets();

    this.isFrozen = false;
    this.isVirusActive = false;

    this.e.stage.classList.remove(
      "is-frozen",
      "is-virus",
      "is-anti-cheat"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

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
    this.hackerDueAt = 0;
    this.heroDueAt = 0;
    this.blackHoleDueAt = 0;

    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.hackerRemaining = 0;
    this.heroRemaining = 0;
    this.blackHoleRemaining = 0;

    this.freezeExpiresAt = 0;
    this.freezeRemaining = 0;

    this.virusExpiresAt = 0;
    this.virusRemaining = 0;

    this.update();
  }

  show(element, visible) {
    element.classList.toggle(
      "stage-overlay--visible",
      visible
    );
  }

  ensureLifeSlots() {
    while (
      this.e.lives.children.length <
      CONFIG.maxLives
    ) {
      const life =
        document.createElement("span");

      life.className = "life life--lost";
      life.textContent = "\u25c6";

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

    this.audio.stopSamples();
    this.audio.start();

    for (const value of ["3", "2", "1", "GO"]) {
      if (this.state !== "countdown") {
        this.starting = false;
        return;
      }

      this.e.count.textContent = value;

      this.audio.tone(
        value === "GO"
          ? 760
          : 300 + Number(value) * 60,
        0.12,
        "square",
        value === "GO" ? 1100 : 500
      );

      await sleep(
        value === "GO" ? 500 : 700
      );
    }

    this.show(this.e.countO, false);

    this.state = "playing";
    this.e.pause.disabled = false;

    this.setStatus(
      "TARGET ACQUISITION",
      "normal"
    );

    this.last = performance.now();

    this.raf = requestAnimationFrame(
      (time) => this.loop(time)
    );

    this.scheduleGood(250);
    this.scheduleHazard(1500);

    this.scheduleHacker(
      CONFIG.hackerMaxDelay
    );

    this.scheduleHero(
      CONFIG.heroMaxDelay
    );

    this.scheduleBlackHole(
      CONFIG.blackHoleMaxDelay
    );

    this.starting = false;
  }

  loop(time) {
    if (this.state !== "playing") return;

    let delta = Math.min(
      0.1,
      (time - (this.last || time)) / 1000
    );

    this.last = time;

    if (this.isFrozen) {
      delta *= 0.5;
    }

    this.timeLeft = Math.max(
      0,
      this.timeLeft - delta
    );

    this.e.time.textContent =
      this.timeLeft.toFixed(1);

    document
      .querySelector(".timer-display")
      ?.classList.toggle(
        "is-critical",
        this.timeLeft <= 8
      );

    const now = performance.now();

    for (const target of this.targets.values()) {
      const progress = clamp(
        this.targetRemaining(target, now) /
          target.maxLife,
        0,
        1
      );

      target.element.style.setProperty(
        "--life-progress",
        progress
      );
    }

    if (this.timeLeft <= 0) {
      this.finish();
      return;
    }

    this.raf = requestAnimationFrame(
      (nextTime) => this.loop(nextTime)
    );
  }

  goodDelay() {
    const delay = Math.max(
      CONFIG.goodMinDelay,
      CONFIG.goodBaseDelay -
        (this.level - 1) *
          CONFIG.goodDelayStep
    );

    return this.isFrozen
      ? delay * 1.8
      : delay;
  }

  hazardDelay() {
    const delay = Math.max(
      CONFIG.hazardMinDelay,
      CONFIG.hazardBaseDelay -
        (
          this.level -
          CONFIG.hazardStartLevel
        ) *
          CONFIG.hazardDelayStep
    );

    const variation =
      0.8 + Math.random() * 0.45;

    return (
      (this.isFrozen
        ? delay * 1.8
        : delay) * variation
    );
  }

  hackerDelay() {
    return (
      CONFIG.hackerMinDelay +
      Math.random() *
        (
          CONFIG.hackerMaxDelay -
          CONFIG.hackerMinDelay
        )
    );
  }

  heroDelay() {
    return (
      CONFIG.heroMinDelay +
      Math.random() *
        (
          CONFIG.heroMaxDelay -
          CONFIG.heroMinDelay
        )
    );
  }

  blackHoleDelay() {
    return (
      CONFIG.blackHoleMinDelay +
      Math.random() *
        (
          CONFIG.blackHoleMaxDelay -
          CONFIG.blackHoleMinDelay
        )
    );
  }

  targetRemaining(
    target,
    now = performance.now()
  ) {
    return Math.max(
      0,
      target.life -
        (now - target.spawnAt)
    );
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
    return [...this.targets.values()]
      .filter(
        (target) =>
          target.group === group
      )
      .length;
  }

  countType(type) {
    return [...this.targets.values()]
      .filter(
        (target) =>
          target.type === type
      )
      .length;
  }

  scheduleGood(
    delay = this.goodDelay()
  ) {
    clearTimeout(this.goodSpawnTimer);

    this.goodDueAt =
      performance.now() + delay;

    this.goodSpawnTimer =
      setTimeout(() => {
        this.goodDueAt = 0;

        if (
          this.state === "playing" &&
          this.countGroup("good") <
            this.maxGoodTargets()
        ) {
          this.spawn(
            this.pickGoodType(),
            "good"
          );
        }

        if (this.state === "playing") {
          this.scheduleGood();
        }
      }, delay);
  }

  scheduleHazard(
    delay = this.hazardDelay()
  ) {
    clearTimeout(this.hazardSpawnTimer);

    this.hazardDueAt =
      performance.now() + delay;

    this.hazardSpawnTimer =
      setTimeout(() => {
        this.hazardDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.hazardStartLevel &&
          this.countGroup("hazard") <
            this.maxHazards()
        ) {
          const type =
            this.pickHazardType();

          const persistentTrap =
            ["decoy", "net"]
              .includes(type);

          if (
            !persistentTrap ||
            this.countType(type) === 0
          ) {
            this.spawn(
              type,
              "hazard"
            );
          }
        }

        if (this.state === "playing") {
          this.scheduleHazard();
        }
      }, delay);
  }

  scheduleHacker(
    delay = this.hackerDelay()
  ) {
    clearTimeout(this.hackerSpawnTimer);

    this.hackerDueAt =
      performance.now() + delay;

    this.hackerSpawnTimer =
      setTimeout(() => {
        this.hackerDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.hackerStartLevel &&
          !this.isVirusActive &&
          this.countGroup("hacker") === 0
        ) {
          this.spawn(
            "hacker",
            "hacker"
          );
        }

        if (this.state === "playing") {
          this.scheduleHacker();
        }
      }, delay);
  }

  scheduleHero(
    delay = this.heroDelay()
  ) {
    clearTimeout(this.heroSpawnTimer);

    this.heroDueAt =
      performance.now() + delay;

    this.heroSpawnTimer =
      setTimeout(() => {
        this.heroDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.heroStartLevel &&
          this.countGroup("hero") === 0
        ) {
          this.spawn(
            "hero",
            "hero"
          );
        }

        if (this.state === "playing") {
          this.scheduleHero();
        }
      }, delay);
  }

  scheduleBlackHole(
    delay = this.blackHoleDelay()
  ) {
    clearTimeout(
      this.blackHoleSpawnTimer
    );

    this.blackHoleDueAt =
      performance.now() + delay;

    this.blackHoleSpawnTimer =
      setTimeout(() => {
        this.blackHoleDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.blackHoleStartLevel &&
          this.countGroup("blackhole") === 0
        ) {
          this.spawn(
            "blackhole",
            "blackhole"
          );
        }

        if (this.state === "playing") {
          this.scheduleBlackHole();
        }
      }, delay);
  }

  pickGoodType() {
    const roll = Math.random();

    const lifeChance =
      this.level >=
      CONFIG.extraLifeStartLevel
        ? CONFIG.extraLifeChance
        : 0;

    const goldenChance = Math.min(
      0.07 +
        (this.level - 1) * 0.003,
      0.13
    );

    const freezeChance = Math.min(
      0.035 +
        (this.level - 1) * 0.003,
      0.075
    );

    if (roll < lifeChance) {
      return "life";
    }

    if (
      roll <
      lifeChance + goldenChance
    ) {
      return "golden";
    }

    if (
      roll <
      lifeChance +
        goldenChance +
        freezeChance
    ) {
      return "freeze";
    }

    return "rabbit";
  }

  pickHazardType() {
    const roll = Math.random();

    const netChance =
      this.level >= 3
        ? Math.min(
            0.22 +
              this.level * 0.01,
            0.36
          )
        : 0;

    const decoyChance = Math.min(
      0.28 +
        this.level * 0.006,
      0.38
    );

    if (roll < netChance) {
      return "net";
    }

    if (
      roll <
      netChance + decoyChance
    ) {
      return "decoy";
    }

    return "redrabbit";
  }

  targetLife(type) {
    if (type === "hacker") {
      return CONFIG.hackerLife;
    }

    if (type === "hero") {
      return CONFIG.heroLife;
    }

    if (type === "blackhole") {
      return CONFIG.blackHoleLife;
    }

    let life = CONFIG.targetLife;

    if (type === "net") {
      life = CONFIG.netLife;
    } else if (type === "decoy") {
      life = CONFIG.decoyLife;
    } else if (
      type === "redrabbit"
    ) {
      life = CONFIG.hazardLife;
    }

    return this.isFrozen
      ? life * 1.8
      : life;
  }

  findSpawnPosition(size, rect) {
    const margin = size / 2 + 18;

    let fallback = {
      x: rect.width / 2,
      y: rect.height / 2,
    };

    for (
      let attempt = 0;
      attempt < 50;
      attempt++
    ) {
      const point = {
        x:
          margin +
          Math.random() *
            Math.max(
              1,
              rect.width - margin * 2
            ),

        y:
          margin +
          Math.random() *
            Math.max(
              1,
              rect.height - margin * 2
            ),
      };

      fallback = point;

      const overlaps = [
        ...this.targets.values(),
      ].some((target) => {
        const otherSize =
          parseFloat(
            target.element.style.getPropertyValue(
              "--target-size"
            )
          ) || size;

        const distance = Math.hypot(
          point.x -
            parseFloat(
              target.element.style.left
            ),

          point.y -
            parseFloat(
              target.element.style.top
            )
        );

        return (
          distance <
          (size + otherSize) / 2 + 14
        );
      });

      if (!overlaps) {
        return point;
      }
    }

    return fallback;
  }

  spawn(
    type,
    group,
    options = {}
  ) {
    if (this.state !== "playing") {
      return;
    }

    let size = Math.max(
      58,
      (
        window.innerWidth < 700
          ? 82
          : 94
      ) -
        (this.level - 1) * 1.4
    );

    if (type === "hacker") {
      size = Math.max(
        76,
        size * 1.18
      );
    }

    if (type === "hero") {
      size = Math.max(
        74,
        size * 1.14
      );
    }

    if (type === "blackhole") {
      size = Math.max(
        82,
        size * 1.26
      );
    }

    const rect =
      this.e.stage.getBoundingClientRect();

    let { x, y } =
      this.findSpawnPosition(
        size,
        rect
      );

    if (options.spawnAt) {
      const margin =
        size / 2 + 12;

      x = clamp(
        options.spawnAt.x,
        margin,
        rect.width - margin
      );

      y = clamp(
        options.spawnAt.y,
        margin,
        rect.height - margin
      );
    }

    const button =
      document.createElement("button");

    button.className =
      `target target--${type}`;

    if (
      type === "hacker" &&
      options.isClone
    ) {
      button.classList.add(
        "is-hacker-clone"
      );
    }

    button.type = "button";

    button.setAttribute(
      "aria-label",
      type
    );

    button.style.setProperty(
      "--target-size",
      `${size}px`
    );

    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    if (type === "blackhole") {
      button.innerHTML = `
        <span class="target__timer"></span>
        <span class="target__blackhole-lens"></span>
        <span class="target__blackhole-disc"></span>
        <span class="target__blackhole-shadow"></span>
        <span class="target__blackhole-eyes"></span>
      `;
    } else if (type === "net") {
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

          <span
            class="target__rabbit-head"
          ></span>

          <span
            class="target__rabbit-eye"
          ></span>
        </span>
      `;

      if (type === "life") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__life-plus">
              +1
            </span>
          `
        );
      } else if (type === "decoy") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__decoy-ghost">
              <span class="target__decoy-ghost-ear target__decoy-ghost-ear--left"></span>
              <span class="target__decoy-ghost-ear target__decoy-ghost-ear--right"></span>
              <span class="target__decoy-ghost-head"></span>
            </span>

            <span class="target__decoy-split target__decoy-split--one"></span>
            <span class="target__decoy-split target__decoy-split--two"></span>
          `
        );
      } else if (type === "hacker") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__hacker-code">
              0xBAD
            </span>

            <span
              class="target__hacker-mask"
            ></span>

            <span
              class="target__hacker-glitch target__hacker-glitch--one"
            ></span>

            <span
              class="target__hacker-glitch target__hacker-glitch--two"
            ></span>
          `
        );
      } else if (type === "hero") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__whitehat-hat"></span>
            <span class="target__whitehat-visor"></span>
            <span class="target__whitehat-circuit"></span>
            <span class="target__whitehat-shield"></span>
          `
        );
      }
    }

    const id = Symbol();
    const life = this.targetLife(type);
    const spawnAt = performance.now();

    const timerId = setTimeout(
      () => this.miss(id),
      life
    );

    button.addEventListener(
      "pointerdown",
      (event) => {
        event.stopPropagation();

        this.hit(
          id,
          type,
          button,
          x,
          y
        );
      }
    );

    this.e.layer.appendChild(button);

    requestAnimationFrame(() => {
      button.classList.add(
        "is-spawned"
      );
    });

    const target = {
      element: button,
      type,
      group,
      life,
      maxLife: life,
      spawnAt,
      timerId,
      x,
      y,
      isClone: Boolean(
        options.isClone
      ),
      cloneTimerId: null,
      cloneDueAt: 0,
      cloneRemaining: 0,
      cloneSpent: Boolean(
        options.isClone
      ),
      portalTimerId: null,
      portalDueAt: 0,
      portalRemaining: 0,
      portalSpent: false,
      gravityTimerId: null,
    };

    this.targets.set(id, target);

    if (
      type === "hacker" &&
      !target.isClone
    ) {
      this.startHackerCloneTimer(
        id,
        target,
        CONFIG.hackerCloneDelay
      );
    }

    if (type === "blackhole") {
      this.startBlackHoleSystems(
        id,
        target,
        CONFIG.blackHoleHackerDelay
      );
    }
  }

  startHackerCloneTimer(
    id,
    target,
    delay
  ) {
    clearTimeout(target.cloneTimerId);

    target.cloneDueAt =
      performance.now() + delay;

    target.cloneTimerId =
      setTimeout(() => {
        target.cloneTimerId = null;
        target.cloneDueAt = 0;
        target.cloneSpent = true;

        if (
          this.state === "playing" &&
          this.targets.has(id) &&
          this.countGroup("hacker") <
            CONFIG.hackerMaxOnBoard
        ) {
          this.spawn(
            "hacker",
            "hacker",
            { isClone: true }
          );
        }
      }, delay);
  }

  startBlackHoleSystems(
    id,
    target,
    hackerDelay
  ) {
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);

    target.portalDueAt =
      performance.now() + hackerDelay;

    target.portalTimerId =
      setTimeout(() => {
        target.portalTimerId = null;
        target.portalDueAt = 0;

        if (
          this.state !== "playing" ||
          !this.targets.has(id)
        ) {
          return;
        }

        target.element.classList.add(
          "is-portal-spent"
        );

        target.portalSpent = true;

        if (
          this.countGroup("hacker") <
            CONFIG.hackerMaxOnBoard
        ) {
          this.spawn(
            "hacker",
            "hacker",
            {
              isClone: true,
              spawnAt: {
                x: target.x + 24,
                y: target.y - 10,
              },
            }
          );
        }
      }, hackerDelay);

    target.gravityTimerId =
      setInterval(() => {
        this.applyBlackHoleGravity(
          id,
          target
        );
      }, CONFIG.blackHoleGravityRate);
  }

  applyBlackHoleGravity(
    blackHoleId,
    blackHole
  ) {
    if (
      this.state !== "playing" ||
      !this.targets.has(blackHoleId)
    ) {
      return;
    }

    for (
      const [id, target]
      of this.targets.entries()
    ) {
      if (
        id === blackHoleId ||
        target.type === "blackhole"
      ) {
        continue;
      }

      const dx =
        blackHole.x - target.x;

      const dy =
        blackHole.y - target.y;

      const distance =
        Math.hypot(dx, dy);

      if (
        distance <= 1 ||
        distance >
          CONFIG.blackHoleGravityRadius
      ) {
        target.element.classList.remove(
          "is-gravity-pulled"
        );

        continue;
      }

      if (distance < 30) {
        clearTimeout(target.timerId);
        clearTimeout(target.cloneTimerId);
        clearTimeout(target.portalTimerId);
        clearInterval(target.gravityTimerId);

        this.targets.delete(id);

        target.element.classList.add(
          "is-expiring"
        );

        this.particles.burst(
          blackHole.x,
          blackHole.y,
          "#a855f7",
          12
        );

        setTimeout(() => {
          target.element.remove();
        }, 180);

        continue;
      }

      const strength =
        CONFIG.blackHoleGravityStep *
        (1 -
          distance /
            CONFIG.blackHoleGravityRadius +
          0.25);

      target.x +=
        (dx / distance) * strength;

      target.y +=
        (dy / distance) * strength;

      target.element.style.left =
        `${target.x}px`;

      target.element.style.top =
        `${target.y}px`;

      target.element.classList.add(
        "is-gravity-pulled"
      );
    }
  }

  clearGravityMarks() {
    for (
      const target
      of this.targets.values()
    ) {
      target.element.classList.remove(
        "is-gravity-pulled"
      );
    }
  }

  hit(id, type, button, x, y) {
    if (
      this.state !== "playing" ||
      !this.targets.has(id)
    ) {
      return;
    }

    const target =
      this.targets.get(id);

    clearTimeout(target.timerId);
    clearTimeout(target.cloneTimerId);
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);
    this.targets.delete(id);

    if (type === "blackhole") {
      this.clearGravityMarks();
    }

    this.taps++;
    this.attempts++;

    button.classList.add("is-hit");

    if (type === "life") {
      this.hits++;

      if (
        this.lives <
        CONFIG.maxLives
      ) {
        this.lives++;

        this.flash(
          "EXTRA LIFE!",
          "LIFE +1",
          "#55ff88"
        );
      } else {
        this.score +=
          CONFIG.extraLifeFullPoints;

        this.flash(
          "LIFE BANK FULL",
          `+${CONFIG.extraLifeFullPoints} PTS`,
          "#55ff88"
        );
      }

      this.audio.life();
      this.effect("is-hit");

      this.setStatus(
        "LIFE RESTORED",
        "normal"
      );

      this.particles.burst(
        x,
        y,
        "#55ff88",
        36
      );
    } else if (type === "decoy") {
      this.score = Math.max(
        0,
        this.score -
          CONFIG.decoyPenalty
      );

      this.lives--;
      this.breakCombo();
      this.audio.bad();

      this.flash(
        "DECOY HIT",
        `-${CONFIG.decoyPenalty}`,
        "#ff325f"
      );

      this.effect("is-damaged");

      this.setStatus(
        "SYSTEM DAMAGE",
        "danger"
      );

      this.particles.burst(
        x,
        y,
        "#ff325f",
        24
      );

      if (this.lives <= 0) {
        setTimeout(
          () => this.finish(),
          180
        );

        return;
      }
    } else if (
      type === "redrabbit"
    ) {
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

      this.flash(
        "RED RABBIT HIT!",
        `-${CONFIG.redPenaltyPoints} PTS / -${CONFIG.redPenaltyTime}s`,
        "#ff0033"
      );

      this.effect("is-damaged");

      this.setStatus(
        "CRITICAL ERROR!",
        "danger"
      );

      this.particles.burst(
        x,
        y,
        "#ff0033",
        35
      );
    } else if (type === "net") {
      this.timeLeft = Math.max(
        0,
        this.timeLeft - 1.5
      );

      this.breakCombo();
      this.audio.bad();

      this.flash(
        "NET TRAP!",
        "COMBO RESET / -1.5s",
        "#a855f7"
      );

      this.effect("is-damaged");

      this.setStatus(
        "NETWORK BLOCKED!",
        "warning"
      );

      this.particles.burst(
        x,
        y,
        "#a855f7",
        20
      );
    } else if (
      type === "blackhole"
    ) {
      this.timeLeft = Math.max(
        0,
        this.timeLeft -
          CONFIG.blackHolePenaltyTime
      );

      this.breakCombo();
      this.audio.blackHole();
      this.effect("is-damaged");

      this.setStatus(
        "GRAVITY BREACH",
        "danger"
      );

      this.particles.burst(
        target.x,
        target.y,
        "#a855f7",
        34
      );

      this.particles.burst(
        target.x,
        target.y,
        "#ffffff",
        18
      );
    } else if (
      type === "hacker"
    ) {
      this.score = Math.max(
        0,
        this.score -
          CONFIG.hackerPenaltyPoints
      );

      this.breakCombo();
      this.audio.blackHacker();
      this.applyHackerVirus();

      this.flash(
        "HACKER RABBIT HIT!",
        `-${CONFIG.hackerPenaltyPoints} PTS // VIRUS UPLOADED`,
        "#ff38c7"
      );

      this.setStatus(
        "SYSTEM INFECTED",
        "danger"
      );

      this.particles.burst(
        x,
        y,
        "#00f5ff",
        22
      );

      this.particles.burst(
        x,
        y,
        "#ff38c7",
        22
      );

      this.particles.burst(
        x,
        y,
        "#a855f7",
        18
      );
    } else if (type === "hero") {
      this.hits++;
      this.audio.whiteHacker();
      this.applyAntiCheat(
        button,
        x,
        y
      );

      this.particles.burst(
        x,
        y,
        "#fff4dc",
        24
      );

      this.particles.burst(
        x,
        y,
        "#ff7a00",
        28
      );

      this.particles.burst(
        x,
        y,
        "#246bff",
        20
      );
    } else {
      this.hits++;
      this.comboCount++;

      this.mult = Math.min(
        CONFIG.maxCombo,
        1 +
          Math.floor(
            this.comboCount / 3
          )
      );

      this.maxCombo = Math.max(
        this.maxCombo,
        this.mult
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

      points *= this.mult;
      this.score += points;
      this.levelHits++;

      if (type === "golden") {
        this.timeLeft +=
          CONFIG.goldenBonus;

        this.audio.gold();

        this.flash(
          "GOLDEN RABBIT",
          `+${points} / +${CONFIG.goldenBonus.toFixed(1)}s`,
          "#ffd34d"
        );

        this.particles.burst(
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

        this.flash(
          "FREEZE RABBIT",
          `TIME SLOWED! +${points}`,
          "#00f5ff"
        );

        this.particles.burst(
          x,
          y,
          "#00f5ff",
          30
        );
      } else {
        this.audio.hit(this.mult);

        this.flash(
          "DIRECT HIT",
          `+${points}`,
          "#00f5ff"
        );

        this.particles.burst(
          x,
          y,
          "#00f5ff",
          20
        );
      }

      this.effect("is-hit");

      this.setStatus(
        "TARGET CONFIRMED",
        "normal"
      );

      if (
        this.levelHits >=
        CONFIG.hitsPerLevel
      ) {
        this.levelUp();
      }
    }

    setTimeout(() => {
      button.remove();
    }, 230);

    this.update();
  }

  applyFreeze() {
    this.isFrozen = true;

    this.e.stage.classList.add(
      "is-frozen"
    );

    clearTimeout(this.freezeTimer);

    this.freezeExpiresAt =
      performance.now() + 4000;

    this.freezeTimer =
      setTimeout(() => {
        this.isFrozen = false;
        this.freezeExpiresAt = 0;

        this.e.stage.classList.remove(
          "is-frozen"
        );
      }, 4000);
  }

  applyHackerVirus(
    duration =
      CONFIG.hackerVirusDuration
  ) {
    this.isVirusActive = true;

    this.e.stage.classList.add(
      "is-virus"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

    requestAnimationFrame(() => {
      this.e.shell.classList.add(
        "is-panic-impact"
      );
    });

    setTimeout(() => {
      this.e.shell.classList.remove(
        "is-panic-impact"
      );
    }, 650);

    clearTimeout(this.virusTimer);

    this.virusExpiresAt =
      performance.now() + duration;

    this.virusTimer =
      setTimeout(() => {
        this.isVirusActive = false;
        this.virusExpiresAt = 0;

        this.e.stage.classList.remove(
          "is-virus"
        );

        if (
          this.state === "playing"
        ) {
          this.setStatus(
            "VIRUS PURGED",
            "normal"
          );
        }
      }, duration);
  }

  applyAntiCheat(
    heroButton,
    fallbackX,
    fallbackY
  ) {
    const stageRect =
      this.e.stage.getBoundingClientRect();

    const heroRect =
      heroButton.getBoundingClientRect();

    const originX =
      heroRect.width
        ? heroRect.left -
          stageRect.left +
          heroRect.width / 2
        : fallbackX;

    const originY =
      heroRect.height
        ? heroRect.top -
          stageRect.top +
          heroRect.height / 2
        : fallbackY;

    const wave =
      document.createElement("span");

    wave.className =
      "anti-cheat-wave";

    wave.style.left = `${originX}px`;
    wave.style.top = `${originY}px`;

    this.e.stage.appendChild(wave);

    this.e.stage.classList.remove(
      "is-anti-cheat"
    );

    requestAnimationFrame(() => {
      this.e.stage.classList.add(
        "is-anti-cheat"
      );
    });

    clearTimeout(this.virusTimer);
    this.isVirusActive = false;
    this.virusExpiresAt = 0;
    this.virusRemaining = 0;

    this.e.stage.classList.remove(
      "is-virus"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

    const dangerousTypes =
      new Set([
        "decoy",
        "redrabbit",
        "net",
        "hacker",
        "blackhole",
      ]);

    for (
      const [id, target]
      of [...this.targets.entries()]
    ) {
      if (
        !dangerousTypes.has(
          target.type
        )
      ) {
        continue;
      }

      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);
      this.targets.delete(id);

      target.element.classList.add(
        "is-anti-cheat-deleted"
      );

      const targetRect =
        target.element
          .getBoundingClientRect();

      const particleX =
        targetRect.left -
        stageRect.left +
        targetRect.width / 2;

      const particleY =
        targetRect.top -
        stageRect.top +
        targetRect.height / 2;

      const color =
        target.type === "hacker"
          ? "#ff38c7"
          : target.type === "blackhole"
            ? "#ffffff"
          : target.type === "redrabbit"
            ? "#ff0033"
            : target.type === "net"
              ? "#a855f7"
              : "#ff325f";

      this.particles.burst(
        particleX,
        particleY,
        color,
        ["hacker", "blackhole"]
          .includes(target.type)
          ? 32
          : 22
      );

      setTimeout(() => {
        target.element.remove();
      }, 580);
    }

    this.clearGravityMarks();

    setTimeout(() => {
      wave.remove();

      this.e.stage.classList.remove(
        "is-anti-cheat"
      );
    }, CONFIG.antiCheatDuration);
  }

  miss(id) {
    if (
      !this.targets.has(id) ||
      this.state !== "playing"
    ) {
      return;
    }

    const target =
      this.targets.get(id);

    this.targets.delete(id);
    clearTimeout(target.cloneTimerId);
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);

    if (target.type === "blackhole") {
      this.clearGravityMarks();
    }

    target.element.classList.add(
      "is-expiring"
    );

    setTimeout(() => {
      target.element.remove();
    }, 180);

    const harmlessToIgnore = [
      "decoy",
      "redrabbit",
      "net",
      "life",
      "golden",
      "freeze",
      "hacker",
      "hero",
      "blackhole",
    ].includes(target.type);

    if (!harmlessToIgnore) {
      this.attempts++;
      this.breakCombo();
      this.lives--;
      this.audio.bad();

      this.flash(
        "TARGET ESCAPED",
        "LIFE -1",
        "#ff325f"
      );

      this.effect("is-damaged");

      this.setStatus(
        "TARGET ESCAPED",
        "warning"
      );

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

    this.audio.bad();

    this.flash(
      "MISS",
      "COMBO RESET",
      "#8fa3b8"
    );

    this.update();
  }

  levelUp() {
    this.levelHits = 0;

    if (
      this.level <
      CONFIG.maxLevel
    ) {
      this.level++;
    }

    this.audio.level();
    this.effect("is-level-up");

    this.flash(
      `LEVEL ${String(
        this.level
      ).padStart(2, "0")}`,
      "RABBIT FLOW INCREASED!",
      "#ffd34d"
    );

    this.setStatus(
      "LEVEL ADVANCED",
      "normal"
    );
  }

  breakCombo() {
    this.comboCount = 0;
    this.mult = 1;
  }

  removeAllTargets() {
    for (
      const target
      of this.targets.values()
    ) {
      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);
      target.element.remove();
    }

    this.targets.clear();
  }

  pause() {
    if (
      this.state !== "playing"
    ) {
      return;
    }

    const now = performance.now();

    this.state = "paused";

    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }

    this.goodRemaining =
      this.goodDueAt
        ? Math.max(
            1,
            this.goodDueAt - now
          )
        : this.goodDelay();

    this.hazardRemaining =
      this.hazardDueAt
        ? Math.max(
            1,
            this.hazardDueAt - now
          )
        : this.hazardDelay();

    this.hackerRemaining =
      this.hackerDueAt
        ? Math.max(
            1,
            this.hackerDueAt - now
          )
        : this.hackerDelay();

    this.heroRemaining =
      this.heroDueAt
        ? Math.max(
            1,
            this.heroDueAt - now
          )
        : this.heroDelay();

    this.blackHoleRemaining =
      this.blackHoleDueAt
        ? Math.max(
            1,
            this.blackHoleDueAt - now
          )
        : this.blackHoleDelay();

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    this.goodDueAt = 0;
    this.hazardDueAt = 0;
    this.hackerDueAt = 0;
    this.heroDueAt = 0;
    this.blackHoleDueAt = 0;

    for (
      const target
      of this.targets.values()
    ) {
      if (
        target.type === "hacker" &&
        !target.cloneSpent &&
        target.cloneDueAt
      ) {
        target.cloneRemaining =
          Math.max(
            1,
            target.cloneDueAt - now
          );

        target.cloneDueAt = 0;
      }

      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);

      if (
        target.type === "blackhole" &&
        target.portalDueAt
      ) {
        target.portalRemaining =
          Math.max(
            1,
            target.portalDueAt - now
          );

        target.portalDueAt = 0;
      }

      target.remaining = Math.max(
        1,
        this.targetRemaining(
          target,
          now
        )
      );
    }

    if (
      this.isFrozen &&
      this.freezeExpiresAt
    ) {
      this.freezeRemaining =
        Math.max(
          1,
          this.freezeExpiresAt - now
        );

      clearTimeout(this.freezeTimer);
      this.freezeExpiresAt = 0;
    }

    if (
      this.isVirusActive &&
      this.virusExpiresAt
    ) {
      this.virusRemaining =
        Math.max(
          1,
          this.virusExpiresAt - now
        );

      clearTimeout(this.virusTimer);
      this.virusExpiresAt = 0;
    }

    this.e.layer
      .getAnimations({
        subtree: true,
      })
      .forEach((animation) => {
        animation.pause();
      });

    this.show(this.e.pauseO, true);

    this.e.pause.disabled = true;
    this.audio.stopSamples();

    this.setStatus(
      "SYSTEM SUSPENDED",
      "warning"
    );
  }

  resume() {
    if (
      this.state !== "paused"
    ) {
      return;
    }

    const now = performance.now();

    this.show(
      this.e.pauseO,
      false
    );

    this.state = "playing";
    this.e.pause.disabled = false;
    this.last = now;

    for (
      const [id, target]
      of this.targets.entries()
    ) {
      const remaining = Math.max(
        1,
        target.remaining ??
          target.life
      );

      target.life = remaining;
      target.spawnAt = now;

      target.timerId =
        setTimeout(
          () => this.miss(id),
          remaining
        );

      if (
        target.type === "hacker" &&
        !target.cloneSpent
      ) {
        this.startHackerCloneTimer(
          id,
          target,
          Math.max(
            1,
            target.cloneRemaining ||
              CONFIG.hackerCloneDelay
          )
        );

        target.cloneRemaining = 0;
      }

      if (target.type === "blackhole") {
        if (!target.portalSpent) {
          this.startBlackHoleSystems(
            id,
            target,
            Math.max(
              1,
              target.portalRemaining ||
                CONFIG.blackHoleHackerDelay
            )
          );
        } else {
          target.gravityTimerId =
            setInterval(() => {
              this.applyBlackHoleGravity(
                id,
                target
              );
            }, CONFIG.blackHoleGravityRate);
        }

        target.portalRemaining = 0;
      }

      delete target.remaining;
    }

    this.e.layer
      .getAnimations({
        subtree: true,
      })
      .forEach((animation) => {
        animation.play();
      });

    if (
      this.isFrozen &&
      this.freezeRemaining > 0
    ) {
      const remaining =
        this.freezeRemaining;

      this.freezeRemaining = 0;

      this.freezeExpiresAt =
        now + remaining;

      this.freezeTimer =
        setTimeout(() => {
          this.isFrozen = false;
          this.freezeExpiresAt = 0;

          this.e.stage.classList.remove(
            "is-frozen"
          );
        }, remaining);
    }

    if (
      this.isVirusActive &&
      this.virusRemaining > 0
    ) {
      const remaining =
        this.virusRemaining;

      this.virusRemaining = 0;

      this.applyHackerVirus(
        remaining
      );
    }

    this.raf =
      requestAnimationFrame(
        (time) => this.loop(time)
      );

    this.scheduleGood(
      Math.max(
        1,
        this.goodRemaining ||
          this.goodDelay()
      )
    );

    this.scheduleHazard(
      Math.max(
        1,
        this.hazardRemaining ||
          this.hazardDelay()
      )
    );

    this.scheduleHacker(
      Math.max(
        1,
        this.hackerRemaining ||
          this.hackerDelay()
      )
    );

    this.scheduleHero(
      Math.max(
        1,
        this.heroRemaining ||
          this.heroDelay()
      )
    );

    this.scheduleBlackHole(
      Math.max(
        1,
        this.blackHoleRemaining ||
          this.blackHoleDelay()
      )
    );

    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.hackerRemaining = 0;
    this.heroRemaining = 0;
    this.blackHoleRemaining = 0;

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

  finish() {
    if (
      this.state === "gameover"
    ) {
      return;
    }

    this.state = "gameover";

    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    clearTimeout(this.freezeTimer);
    clearTimeout(this.virusTimer);

    this.isVirusActive = false;

    this.e.stage.classList.remove(
      "is-virus",
      "is-anti-cheat"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

    this.removeAllTargets();

    this.e.pause.disabled = true;

    const record =
      this.score > this.best;

    if (record) {
      this.best = this.score;

      localStorage.setItem(
        CONFIG.bestKey,
        String(this.best)
      );
    }

    const accuracy =
      this.attempts
        ? Math.round(
            (
              this.hits /
              this.attempts
            ) * 100
          )
        : 0;

    this.e.finalScore.textContent =
      pad(this.score);

    this.e.finalBest.textContent =
      pad(this.best);

    this.e.finalCombo.textContent =
      `x${this.maxCombo}`;

    this.e.finalAcc.textContent =
      `${accuracy}%`;

    this.e.rank.textContent =
      this.rank();

    this.e.record.classList.toggle(
      "is-visible",
      record
    );

    this.update();

    this.show(this.e.overO, true);

    this.setStatus(
      "SESSION COMPLETE",
      "danger"
    );

    this.audio.stopSamples();
    this.audio.over();
  }

  rank() {
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

  setStatus(text, type) {
    this.e.status.textContent = text;

    const chip =
      document.querySelector(
        ".status-chip"
      );

    chip?.classList.toggle(
      "is-danger",
      type === "danger"
    );

    chip?.classList.toggle(
      "is-warning",
      type === "warning"
    );
  }

  flash(main, sub, color) {
    this.e.floatMain.textContent = main;
    this.e.floatSub.textContent = sub;
    this.e.float.style.color = color;

    this.e.float.classList.remove(
      "is-visible"
    );

    requestAnimationFrame(() => {
      this.e.float.classList.add(
        "is-visible"
      );
    });
  }

  effect(className) {
    this.e.stage.classList.remove(
      className
    );

    requestAnimationFrame(() => {
      this.e.stage.classList.add(
        className
      );
    });

    setTimeout(() => {
      this.e.stage.classList.remove(
        className
      );
    }, 700);
  }

  updateSound() {
    this.e.sound.setAttribute(
      "aria-pressed",
      String(this.audio.enabled)
    );

    this.e.soundIcon.textContent =
      this.audio.enabled
        ? "ON"
        : "OFF";
  }

  update() {
    this.e.score.textContent =
      pad(this.score);

    this.e.best.textContent =
      pad(this.best);

    this.e.combo.textContent =
      String(this.mult);

    this.e.level.textContent =
      String(this.level).padStart(
        2,
        "0"
      );

    this.e.time.textContent =
      this.timeLeft.toFixed(1);

    this.e.comboCard.classList.toggle(
      "is-hot",
      this.mult >= 3
    );

    this.e.progressText.textContent =
      `${this.levelHits} / ${CONFIG.hitsPerLevel}`;

    this.e.progressFill.style.width =
      `${
        (
          this.levelHits /
          CONFIG.hitsPerLevel
        ) * 100
      }%`;

    [
      ...this.e.lives.children,
    ].forEach(
      (element, index) => {
        element.classList.toggle(
          "life--active",
          index < this.lives
        );

        element.classList.toggle(
          "life--lost",
          index >= this.lives
        );
      }
    );
  }
}

window.addEventListener(
  "DOMContentLoaded",
  () => {
    try {
      new Game();
    } catch (error) {
      console.error(error);

      alert(
        "Igra nije mogla da se pokrene. Proveri da li su index.html, style.css i script.js u istom folderu."
      );
    }
  }
);
Library
/
script-SOUND-11-OF-11-COPY-PASTE.txt


"use strict";

/* WHR Rabbit Reflex v1.2 - WHITE HACKER ANTI-CHEAT */
const CONFIG = {
  time: 60,
  lives: 3,
  maxLives: 10,
  hitsPerLevel: 10,
  maxLevel: 99,

  rabbitPoints: 250,
  goldenPoints: 1200,
  goldenBonus: 5,
  freezePoints: 500,
  redPenaltyPoints: 500,
  redPenaltyTime: 3,
  decoyPenalty: 300,

  extraLifeChance: 0.10,
  extraLifeStartLevel: 5,
  extraLifeFullPoints: 1500,

  targetLife: 1450,
  hazardLife: 1800,
  decoyLife: 5000,
  netLife: 5000,

  goodBaseDelay: 780,
  goodMinDelay: 260,
  goodDelayStep: 28,

  hazardBaseDelay: 2400,
  hazardMinDelay: 900,
  hazardDelayStep: 55,
  hazardStartLevel: 2,

  hackerStartLevel: 4,
  hackerMinDelay: 7000,
  hackerMaxDelay: 9000,
  hackerLife: 1800,
  hackerPenaltyPoints: 2000,
  hackerVirusDuration: 3000,
  hackerCloneDelay: 700,
  hackerMaxOnBoard: 2,

  heroStartLevel: 4,
  heroMinDelay: 12000,
  heroMaxDelay: 16000,
  // White Hacker is a tactical Anti-Cheat trinket, not a reflex target.
  // It remains available long enough for the player to choose the right moment.
  heroLife: 7000,
  antiCheatDuration: 780,

  blackHoleStartLevel: 8,
  blackHoleMinDelay: 14000,
  blackHoleMaxDelay: 19000,
  blackHoleLife: 5000,
  blackHolePenaltyTime: 3,
  blackHoleHackerDelay: 1200,
  blackHoleGravityRate: 180,
  blackHoleGravityRadius: 180,
  blackHoleGravityStep: 5.5,

  maxCombo: 25,

  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled",
};

const $ = (id) => {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing #${id}`);
  }

  return element;
};

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const pad = (value) =>
  String(Math.max(0, Math.floor(value))).padStart(8, "0");

/* =========================================
   WHR SAMPLE AUDIO + SYNTH FALLBACK
   ========================================= */

class AudioFX {
  constructor() {
    this.ctx = null;
    this.enabled =
      localStorage.getItem(CONFIG.soundKey) !== "false";

    this.sampleConfig = {
      normalHit: {
        src: "./sound/normal-hit.wav",
        volume: 0.28,
        cooldown: 35,
        voices: 4,
      },
      redRabbit: {
        src: "./sound/red-rabbit.wav",
        volume: 0.5,
        cooldown: 120,
        voices: 2,
      },
      trap: {
        src: "./sound/trap.wav",
        volume: 0.38,
        cooldown: 110,
        voices: 2,
      },
      extraLife: {
        src: "./sound/extra-life.wav",
        volume: 0.5,
        cooldown: 200,
        voices: 1,
      },
      goldenRabbit: {
        src: "./sound/golden-rabbit.wav",
        volume: 0.46,
        cooldown: 160,
        voices: 2,
      },
      blackHacker: {
        src: "./sound/black-hacker.wav",
        volume: 0.56,
        cooldown: 250,
        voices: 1,
      },
      blackHole: {
        src: "./sound/black-hole.wav",
        volume: 0.5,
        cooldown: 350,
        voices: 1,
      },
      whiteHacker: {
        src: "./sound/white-hacker.wav",
        volume: 0.52,
        cooldown: 300,
        voices: 1,
      },
      gameStart: {
        src: "./sound/game-start.wav",
        volume: 0.36,
        cooldown: 1000,
        voices: 1,
        maxDuration: 3000,
      },
      levelUp: {
        src: "./sound/level-up.wav",
        volume: 0.42,
        cooldown: 500,
        voices: 1,
      },
      gameOver: {
        src: "./sound/game-over.wav",
        volume: 0.5,
        cooldown: 1000,
        voices: 1,
      },
    };

    this.samplePools = new Map();
    this.sampleCursor = new Map();
    this.lastSampleAt = new Map();

    this.prepareSamples();
  }

  prepareSamples() {
    if (typeof Audio === "undefined") return;

    Object.entries(this.sampleConfig).forEach(
      ([name, config]) => {
        const pool = [];

        for (
          let index = 0;
          index < config.voices;
          index++
        ) {
          const sample = new Audio(config.src);

          sample.preload = "auto";
          sample.volume = config.volume;
          sample.setAttribute("playsinline", "");
          pool.push(sample);
        }

        this.samplePools.set(name, pool);
        this.sampleCursor.set(name, 0);
      }
    );
  }

  playSample(name, fallback) {
    if (!this.enabled) return false;

    const config = this.sampleConfig[name];
    const pool = this.samplePools.get(name);

    if (!config || !pool?.length) {
      fallback?.();
      return false;
    }

    const now = performance.now();
    const last = this.lastSampleAt.get(name) || 0;

    if (now - last < config.cooldown) {
      return true;
    }

    this.lastSampleAt.set(name, now);

    const cursor =
      this.sampleCursor.get(name) || 0;
    const sample = pool[cursor];

    this.sampleCursor.set(
      name,
      (cursor + 1) % pool.length
    );

    sample.pause();
    sample.currentTime = 0;
    sample.volume = config.volume;

    sample._whrPlayId =
      (sample._whrPlayId || 0) + 1;

    const playId = sample._whrPlayId;
    let result;

    try {
      result = sample.play();
    } catch {
      fallback?.();
      return false;
    }

    if (result?.catch) {
      result.catch(() => {
        if (
          this.enabled &&
          sample._whrPlayId === playId
        ) {
          fallback?.();
        }
      });
    }

    if (config.maxDuration) {
      setTimeout(() => {
        if (sample._whrPlayId !== playId) return;

        sample.pause();
        sample.currentTime = 0;
      }, config.maxDuration);
    }

    return true;
  }

  stopSamples() {
    for (const pool of this.samplePools.values()) {
      for (const sample of pool) {
        sample._whrPlayId =
          (sample._whrPlayId || 0) + 1;
        sample.pause();
        sample.currentTime = 0;
      }
    }
  }

  init() {
    if (this.ctx) return;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  tone(
    frequency = 440,
    duration = 0.08,
    type = "sine",
    end = frequency
  ) {
    if (!this.enabled) return;

    this.init();

    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

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
    gain.gain.exponentialRampToValueAtTime(
      0.16,
      now + 0.015
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  hit(combo) {
    this.playSample("normalHit", () => {
      this.tone(
        480 + combo * 24,
        0.09,
        "sine",
        820 + combo * 24
      );
    });
  }

  gold() {
    this.playSample("goldenRabbit", () => {
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
    this.playSample("redRabbit", () => {
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
    });
  }

  life() {
    this.playSample("extraLife", () => {
      [520, 660, 880, 1040].forEach(
        (frequency, index) => {
          setTimeout(() => {
            this.tone(
              frequency,
              0.14,
              "triangle",
              frequency * 1.12
            );
          }, index * 45);
        }
      );
    });
  }

  bad() {
    this.playSample("trap", () => {
      this.tone(190, 0.24, "sawtooth", 55);
    });
  }

  level() {
    this.playSample("levelUp", () => {
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
    });
  }

  click() {
    this.tone(500, 0.07, "sine", 720);
  }

  over() {
    this.playSample("gameOver", () => {
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
    });
  }

  blackHacker() {
    this.playSample("blackHacker", () => {
      this.tone(150, 0.3, "sawtooth", 45);
    });
  }

  blackHole() {
    this.playSample("blackHole", () => {
      this.tone(90, 0.45, "sine", 28);
    });
  }

  whiteHacker() {
    this.playSample("whiteHacker", () => {
      this.tone(620, 0.3, "triangle", 1250);
    });
  }

  start() {
    this.playSample("gameStart", () => {
      this.tone(360, 0.28, "triangle", 900);
    });
  }

  toggle() {
    this.enabled = !this.enabled;

    localStorage.setItem(
      CONFIG.soundKey,
      String(this.enabled)
    );

    if (this.enabled) {
      this.click();
    } else {
      this.stopSamples();
    }

    return this.enabled;
  }
}

/* =========================================
   PARTICLES
   ========================================= */

class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.items = [];
    this.last = 0;

    this.resize = () => {
      const rect = canvas.getBoundingClientRect();
      const density = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = rect.width * density;
      canvas.height = rect.height * density;

      if (this.context.resetTransform) {
        this.context.resetTransform();
      } else {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
      }

      this.context.scale(density, density);
    };

    window.addEventListener("resize", this.resize);

    this.resize();

    requestAnimationFrame((time) => {
      this.loop(time);
    });
  }

  burst(x, y, color, count = 18) {
    for (let index = 0; index < count; index++) {
      const angle =
        (Math.PI * 2 * index) / count +
        Math.random() * 0.4;

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
    const delta = Math.min(
      32,
      time - (this.last || time)
    );

    this.last = time;

    const rect = this.canvas.getBoundingClientRect();

    this.context.clearRect(
      0,
      0,
      rect.width,
      rect.height
    );

    this.items = this.items.filter((particle) => {
      particle.life -= delta;

      if (particle.life <= 0) {
        return false;
      }

      particle.x +=
        (particle.vx * delta) / 16.7;

      particle.y +=
        (particle.vy * delta) / 16.7;

      particle.vy +=
        (0.06 * delta) / 16.7;

      this.context.save();

      this.context.globalAlpha =
        particle.life / particle.maxLife;

      this.context.fillStyle = particle.color;
      this.context.shadowColor = particle.color;
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
    });

    requestAnimationFrame((nextTime) => {
      this.loop(nextTime);
    });
  }
}

/* =========================================
   GAME
   ========================================= */

class Game {
  constructor() {
    this.e = {
      stage: $("gameStage"),
      shell: $("appShell"),
      layer: $("targetLayer"),
      virus: $("virusLayer"),
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

      floatMain: document.querySelector(
        ".floating-message__main"
      ),

      floatSub: document.querySelector(
        ".floating-message__sub"
      ),

      finalScore: $("finalScoreValue"),
      finalBest: $("finalBestValue"),
      finalCombo: $("finalComboValue"),
      finalAcc: $("finalAccuracyValue"),
      rank: $("resultRank"),
      record: $("newRecordMessage"),
    };

    this.audio = new AudioFX();
    this.particles = new Particles(this.e.canvas);

    this.best =
      Number(localStorage.getItem(CONFIG.bestKey)) || 0;

    this.targets = new Map();

    this.state = "ready";
    this.starting = false;

    this.isFrozen = false;
    this.isVirusActive = false;

    this.goodSpawnTimer = null;
    this.hazardSpawnTimer = null;
    this.hackerSpawnTimer = null;
    this.heroSpawnTimer = null;
    this.blackHoleSpawnTimer = null;

    this.freezeTimer = null;
    this.virusTimer = null;

    this.goodDueAt = 0;
    this.hazardDueAt = 0;
    this.hackerDueAt = 0;
    this.heroDueAt = 0;
    this.blackHoleDueAt = 0;

    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.hackerRemaining = 0;
    this.heroRemaining = 0;
    this.blackHoleRemaining = 0;

    this.freezeExpiresAt = 0;
    this.freezeRemaining = 0;

    this.virusExpiresAt = 0;
    this.virusRemaining = 0;

    this.bind();
    this.ensureLifeSlots();
    this.reset();
    this.show(this.e.startO, true);
    this.updateSound();
  }

  bind() {
    this.e.start.onclick = () => this.start();
    this.e.restart.onclick = () => this.start();

    this.e.pause.onclick = () => {
      this.togglePause();
    };

    this.e.resume.onclick = () => {
      this.resume();
    };

    this.e.sound.onclick = () => {
      this.audio.toggle();
      this.updateSound();
    };

    this.e.stage.addEventListener(
      "pointermove",
      (event) => {
        const rect =
          this.e.stage.getBoundingClientRect();

        this.e.cross.style.left =
          `${event.clientX - rect.left}px`;

        this.e.cross.style.top =
          `${event.clientY - rect.top}px`;

        this.e.cross.style.opacity = "1";
      }
    );

    this.e.stage.addEventListener(
      "pointerleave",
      () => {
        this.e.cross.style.opacity = "0";
      }
    );

    this.e.stage.addEventListener(
      "pointerdown",
      (event) => {
        if (
          this.state === "playing" &&
          !event.target.closest(".target")
        ) {
          this.emptyTap();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.code === "Space") {
          event.preventDefault();

          if (
            this.state === "ready" ||
            this.state === "gameover"
          ) {
            this.start();
          } else if (this.state === "playing") {
            this.pause();
          } else if (this.state === "paused") {
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

  reset() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    clearTimeout(this.freezeTimer);
    clearTimeout(this.virusTimer);

    this.removeAllTargets();

    this.isFrozen = false;
    this.isVirusActive = false;

    this.e.stage.classList.remove(
      "is-frozen",
      "is-virus",
      "is-anti-cheat"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

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
    this.hackerDueAt = 0;
    this.heroDueAt = 0;
    this.blackHoleDueAt = 0;

    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.hackerRemaining = 0;
    this.heroRemaining = 0;
    this.blackHoleRemaining = 0;

    this.freezeExpiresAt = 0;
    this.freezeRemaining = 0;

    this.virusExpiresAt = 0;
    this.virusRemaining = 0;

    this.update();
  }

  show(element, visible) {
    element.classList.toggle(
      "stage-overlay--visible",
      visible
    );
  }

  ensureLifeSlots() {
    while (
      this.e.lives.children.length <
      CONFIG.maxLives
    ) {
      const life =
        document.createElement("span");

      life.className = "life life--lost";
      life.textContent = "\u25c6";

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

    this.audio.stopSamples();
    this.audio.start();

    for (const value of ["3", "2", "1", "GO"]) {
      if (this.state !== "countdown") {
        this.starting = false;
        return;
      }

      this.e.count.textContent = value;

      this.audio.tone(
        value === "GO"
          ? 760
          : 300 + Number(value) * 60,
        0.12,
        "square",
        value === "GO" ? 1100 : 500
      );

      await sleep(
        value === "GO" ? 500 : 700
      );
    }

    this.show(this.e.countO, false);

    this.state = "playing";
    this.e.pause.disabled = false;

    this.setStatus(
      "TARGET ACQUISITION",
      "normal"
    );

    this.last = performance.now();

    this.raf = requestAnimationFrame(
      (time) => this.loop(time)
    );

    this.scheduleGood(250);
    this.scheduleHazard(1500);

    this.scheduleHacker(
      CONFIG.hackerMaxDelay
    );

    this.scheduleHero(
      CONFIG.heroMaxDelay
    );

    this.scheduleBlackHole(
      CONFIG.blackHoleMaxDelay
    );

    this.starting = false;
  }

  loop(time) {
    if (this.state !== "playing") return;

    let delta = Math.min(
      0.1,
      (time - (this.last || time)) / 1000
    );

    this.last = time;

    if (this.isFrozen) {
      delta *= 0.5;
    }

    this.timeLeft = Math.max(
      0,
      this.timeLeft - delta
    );

    this.e.time.textContent =
      this.timeLeft.toFixed(1);

    document
      .querySelector(".timer-display")
      ?.classList.toggle(
        "is-critical",
        this.timeLeft <= 8
      );

    const now = performance.now();

    for (const target of this.targets.values()) {
      const progress = clamp(
        this.targetRemaining(target, now) /
          target.maxLife,
        0,
        1
      );

      target.element.style.setProperty(
        "--life-progress",
        progress
      );
    }

    if (this.timeLeft <= 0) {
      this.finish();
      return;
    }

    this.raf = requestAnimationFrame(
      (nextTime) => this.loop(nextTime)
    );
  }

  goodDelay() {
    const delay = Math.max(
      CONFIG.goodMinDelay,
      CONFIG.goodBaseDelay -
        (this.level - 1) *
          CONFIG.goodDelayStep
    );

    return this.isFrozen
      ? delay * 1.8
      : delay;
  }

  hazardDelay() {
    const delay = Math.max(
      CONFIG.hazardMinDelay,
      CONFIG.hazardBaseDelay -
        (
          this.level -
          CONFIG.hazardStartLevel
        ) *
          CONFIG.hazardDelayStep
    );

    const variation =
      0.8 + Math.random() * 0.45;

    return (
      (this.isFrozen
        ? delay * 1.8
        : delay) * variation
    );
  }

  hackerDelay() {
    return (
      CONFIG.hackerMinDelay +
      Math.random() *
        (
          CONFIG.hackerMaxDelay -
          CONFIG.hackerMinDelay
        )
    );
  }

  heroDelay() {
    return (
      CONFIG.heroMinDelay +
      Math.random() *
        (
          CONFIG.heroMaxDelay -
          CONFIG.heroMinDelay
        )
    );
  }

  blackHoleDelay() {
    return (
      CONFIG.blackHoleMinDelay +
      Math.random() *
        (
          CONFIG.blackHoleMaxDelay -
          CONFIG.blackHoleMinDelay
        )
    );
  }

  targetRemaining(
    target,
    now = performance.now()
  ) {
    return Math.max(
      0,
      target.life -
        (now - target.spawnAt)
    );
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
    return [...this.targets.values()]
      .filter(
        (target) =>
          target.group === group
      )
      .length;
  }

  countType(type) {
    return [...this.targets.values()]
      .filter(
        (target) =>
          target.type === type
      )
      .length;
  }

  scheduleGood(
    delay = this.goodDelay()
  ) {
    clearTimeout(this.goodSpawnTimer);

    this.goodDueAt =
      performance.now() + delay;

    this.goodSpawnTimer =
      setTimeout(() => {
        this.goodDueAt = 0;

        if (
          this.state === "playing" &&
          this.countGroup("good") <
            this.maxGoodTargets()
        ) {
          this.spawn(
            this.pickGoodType(),
            "good"
          );
        }

        if (this.state === "playing") {
          this.scheduleGood();
        }
      }, delay);
  }

  scheduleHazard(
    delay = this.hazardDelay()
  ) {
    clearTimeout(this.hazardSpawnTimer);

    this.hazardDueAt =
      performance.now() + delay;

    this.hazardSpawnTimer =
      setTimeout(() => {
        this.hazardDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.hazardStartLevel &&
          this.countGroup("hazard") <
            this.maxHazards()
        ) {
          const type =
            this.pickHazardType();

          const persistentTrap =
            ["decoy", "net"]
              .includes(type);

          if (
            !persistentTrap ||
            this.countType(type) === 0
          ) {
            this.spawn(
              type,
              "hazard"
            );
          }
        }

        if (this.state === "playing") {
          this.scheduleHazard();
        }
      }, delay);
  }

  scheduleHacker(
    delay = this.hackerDelay()
  ) {
    clearTimeout(this.hackerSpawnTimer);

    this.hackerDueAt =
      performance.now() + delay;

    this.hackerSpawnTimer =
      setTimeout(() => {
        this.hackerDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.hackerStartLevel &&
          !this.isVirusActive &&
          this.countGroup("hacker") === 0
        ) {
          this.spawn(
            "hacker",
            "hacker"
          );
        }

        if (this.state === "playing") {
          this.scheduleHacker();
        }
      }, delay);
  }

  scheduleHero(
    delay = this.heroDelay()
  ) {
    clearTimeout(this.heroSpawnTimer);

    this.heroDueAt =
      performance.now() + delay;

    this.heroSpawnTimer =
      setTimeout(() => {
        this.heroDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.heroStartLevel &&
          this.countGroup("hero") === 0
        ) {
          this.spawn(
            "hero",
            "hero"
          );
        }

        if (this.state === "playing") {
          this.scheduleHero();
        }
      }, delay);
  }

  scheduleBlackHole(
    delay = this.blackHoleDelay()
  ) {
    clearTimeout(
      this.blackHoleSpawnTimer
    );

    this.blackHoleDueAt =
      performance.now() + delay;

    this.blackHoleSpawnTimer =
      setTimeout(() => {
        this.blackHoleDueAt = 0;

        if (
          this.state === "playing" &&
          this.level >=
            CONFIG.blackHoleStartLevel &&
          this.countGroup("blackhole") === 0
        ) {
          this.spawn(
            "blackhole",
            "blackhole"
          );
        }

        if (this.state === "playing") {
          this.scheduleBlackHole();
        }
      }, delay);
  }

  pickGoodType() {
    const roll = Math.random();

    const lifeChance =
      this.level >=
      CONFIG.extraLifeStartLevel
        ? CONFIG.extraLifeChance
        : 0;

    const goldenChance = Math.min(
      0.07 +
        (this.level - 1) * 0.003,
      0.13
    );

    const freezeChance = Math.min(
      0.035 +
        (this.level - 1) * 0.003,
      0.075
    );

    if (roll < lifeChance) {
      return "life";
    }

    if (
      roll <
      lifeChance + goldenChance
    ) {
      return "golden";
    }

    if (
      roll <
      lifeChance +
        goldenChance +
        freezeChance
    ) {
      return "freeze";
    }

    return "rabbit";
  }

  pickHazardType() {
    const roll = Math.random();

    const netChance =
      this.level >= 3
        ? Math.min(
            0.22 +
              this.level * 0.01,
            0.36
          )
        : 0;

    const decoyChance = Math.min(
      0.28 +
        this.level * 0.006,
      0.38
    );

    if (roll < netChance) {
      return "net";
    }

    if (
      roll <
      netChance + decoyChance
    ) {
      return "decoy";
    }

    return "redrabbit";
  }

  targetLife(type) {
    if (type === "hacker") {
      return CONFIG.hackerLife;
    }

    if (type === "hero") {
      return CONFIG.heroLife;
    }

    if (type === "blackhole") {
      return CONFIG.blackHoleLife;
    }

    let life = CONFIG.targetLife;

    if (type === "net") {
      life = CONFIG.netLife;
    } else if (type === "decoy") {
      life = CONFIG.decoyLife;
    } else if (
      type === "redrabbit"
    ) {
      life = CONFIG.hazardLife;
    }

    return this.isFrozen
      ? life * 1.8
      : life;
  }

  findSpawnPosition(size, rect) {
    const margin = size / 2 + 18;

    let fallback = {
      x: rect.width / 2,
      y: rect.height / 2,
    };

    for (
      let attempt = 0;
      attempt < 50;
      attempt++
    ) {
      const point = {
        x:
          margin +
          Math.random() *
            Math.max(
              1,
              rect.width - margin * 2
            ),

        y:
          margin +
          Math.random() *
            Math.max(
              1,
              rect.height - margin * 2
            ),
      };

      fallback = point;

      const overlaps = [
        ...this.targets.values(),
      ].some((target) => {
        const otherSize =
          parseFloat(
            target.element.style.getPropertyValue(
              "--target-size"
            )
          ) || size;

        const distance = Math.hypot(
          point.x -
            parseFloat(
              target.element.style.left
            ),

          point.y -
            parseFloat(
              target.element.style.top
            )
        );

        return (
          distance <
          (size + otherSize) / 2 + 14
        );
      });

      if (!overlaps) {
        return point;
      }
    }

    return fallback;
  }

  spawn(
    type,
    group,
    options = {}
  ) {
    if (this.state !== "playing") {
      return;
    }

    let size = Math.max(
      58,
      (
        window.innerWidth < 700
          ? 82
          : 94
      ) -
        (this.level - 1) * 1.4
    );

    if (type === "hacker") {
      size = Math.max(
        76,
        size * 1.18
      );
    }

    if (type === "hero") {
      size = Math.max(
        74,
        size * 1.14
      );
    }

    if (type === "blackhole") {
      size = Math.max(
        82,
        size * 1.26
      );
    }

    const rect =
      this.e.stage.getBoundingClientRect();

    let { x, y } =
      this.findSpawnPosition(
        size,
        rect
      );

    if (options.spawnAt) {
      const margin =
        size / 2 + 12;

      x = clamp(
        options.spawnAt.x,
        margin,
        rect.width - margin
      );

      y = clamp(
        options.spawnAt.y,
        margin,
        rect.height - margin
      );
    }

    const button =
      document.createElement("button");

    button.className =
      `target target--${type}`;

    if (
      type === "hacker" &&
      options.isClone
    ) {
      button.classList.add(
        "is-hacker-clone"
      );
    }

    button.type = "button";

    button.setAttribute(
      "aria-label",
      type
    );

    button.style.setProperty(
      "--target-size",
      `${size}px`
    );

    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    if (type === "blackhole") {
      button.innerHTML = `
        <span class="target__timer"></span>
        <span class="target__blackhole-lens"></span>
        <span class="target__blackhole-disc"></span>
        <span class="target__blackhole-shadow"></span>
        <span class="target__blackhole-eyes"></span>
      `;
    } else if (type === "net") {
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

          <span
            class="target__rabbit-head"
          ></span>

          <span
            class="target__rabbit-eye"
          ></span>
        </span>
      `;

      if (type === "life") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__life-plus">
              +1
            </span>
          `
        );
      } else if (type === "decoy") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__decoy-ghost">
              <span class="target__decoy-ghost-ear target__decoy-ghost-ear--left"></span>
              <span class="target__decoy-ghost-ear target__decoy-ghost-ear--right"></span>
              <span class="target__decoy-ghost-head"></span>
            </span>

            <span class="target__decoy-split target__decoy-split--one"></span>
            <span class="target__decoy-split target__decoy-split--two"></span>
          `
        );
      } else if (type === "hacker") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__hacker-code">
              0xBAD
            </span>

            <span
              class="target__hacker-mask"
            ></span>

            <span
              class="target__hacker-glitch target__hacker-glitch--one"
            ></span>

            <span
              class="target__hacker-glitch target__hacker-glitch--two"
            ></span>
          `
        );
      } else if (type === "hero") {
        button.insertAdjacentHTML(
          "beforeend",
          `
            <span class="target__whitehat-hat"></span>
            <span class="target__whitehat-visor"></span>
            <span class="target__whitehat-circuit"></span>
            <span class="target__whitehat-shield"></span>
          `
        );
      }
    }

    const id = Symbol();
    const life = this.targetLife(type);
    const spawnAt = performance.now();

    const timerId = setTimeout(
      () => this.miss(id),
      life
    );

    button.addEventListener(
      "pointerdown",
      (event) => {
        event.stopPropagation();

        this.hit(
          id,
          type,
          button,
          x,
          y
        );
      }
    );

    this.e.layer.appendChild(button);

    requestAnimationFrame(() => {
      button.classList.add(
        "is-spawned"
      );
    });

    const target = {
      element: button,
      type,
      group,
      life,
      maxLife: life,
      spawnAt,
      timerId,
      x,
      y,
      isClone: Boolean(
        options.isClone
      ),
      cloneTimerId: null,
      cloneDueAt: 0,
      cloneRemaining: 0,
      cloneSpent: Boolean(
        options.isClone
      ),
      portalTimerId: null,
      portalDueAt: 0,
      portalRemaining: 0,
      portalSpent: false,
      gravityTimerId: null,
    };

    this.targets.set(id, target);

    if (
      type === "hacker" &&
      !target.isClone
    ) {
      this.startHackerCloneTimer(
        id,
        target,
        CONFIG.hackerCloneDelay
      );
    }

    if (type === "blackhole") {
      this.startBlackHoleSystems(
        id,
        target,
        CONFIG.blackHoleHackerDelay
      );
    }
  }

  startHackerCloneTimer(
    id,
    target,
    delay
  ) {
    clearTimeout(target.cloneTimerId);

    target.cloneDueAt =
      performance.now() + delay;

    target.cloneTimerId =
      setTimeout(() => {
        target.cloneTimerId = null;
        target.cloneDueAt = 0;
        target.cloneSpent = true;

        if (
          this.state === "playing" &&
          this.targets.has(id) &&
          this.countGroup("hacker") <
            CONFIG.hackerMaxOnBoard
        ) {
          this.spawn(
            "hacker",
            "hacker",
            { isClone: true }
          );
        }
      }, delay);
  }

  startBlackHoleSystems(
    id,
    target,
    hackerDelay
  ) {
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);

    target.portalDueAt =
      performance.now() + hackerDelay;

    target.portalTimerId =
      setTimeout(() => {
        target.portalTimerId = null;
        target.portalDueAt = 0;

        if (
          this.state !== "playing" ||
          !this.targets.has(id)
        ) {
          return;
        }

        target.element.classList.add(
          "is-portal-spent"
        );

        target.portalSpent = true;

        if (
          this.countGroup("hacker") <
            CONFIG.hackerMaxOnBoard
        ) {
          this.spawn(
            "hacker",
            "hacker",
            {
              isClone: true,
              spawnAt: {
                x: target.x + 24,
                y: target.y - 10,
              },
            }
          );
        }
      }, hackerDelay);

    target.gravityTimerId =
      setInterval(() => {
        this.applyBlackHoleGravity(
          id,
          target
        );
      }, CONFIG.blackHoleGravityRate);
  }

  applyBlackHoleGravity(
    blackHoleId,
    blackHole
  ) {
    if (
      this.state !== "playing" ||
      !this.targets.has(blackHoleId)
    ) {
      return;
    }

    for (
      const [id, target]
      of this.targets.entries()
    ) {
      if (
        id === blackHoleId ||
        target.type === "blackhole"
      ) {
        continue;
      }

      const dx =
        blackHole.x - target.x;

      const dy =
        blackHole.y - target.y;

      const distance =
        Math.hypot(dx, dy);

      if (
        distance <= 1 ||
        distance >
          CONFIG.blackHoleGravityRadius
      ) {
        target.element.classList.remove(
          "is-gravity-pulled"
        );

        continue;
      }

      if (distance < 30) {
        clearTimeout(target.timerId);
        clearTimeout(target.cloneTimerId);
        clearTimeout(target.portalTimerId);
        clearInterval(target.gravityTimerId);

        this.targets.delete(id);

        target.element.classList.add(
          "is-expiring"
        );

        this.particles.burst(
          blackHole.x,
          blackHole.y,
          "#a855f7",
          12
        );

        setTimeout(() => {
          target.element.remove();
        }, 180);

        continue;
      }

      const strength =
        CONFIG.blackHoleGravityStep *
        (1 -
          distance /
            CONFIG.blackHoleGravityRadius +
          0.25);

      target.x +=
        (dx / distance) * strength;

      target.y +=
        (dy / distance) * strength;

      target.element.style.left =
        `${target.x}px`;

      target.element.style.top =
        `${target.y}px`;

      target.element.classList.add(
        "is-gravity-pulled"
      );
    }
  }

  clearGravityMarks() {
    for (
      const target
      of this.targets.values()
    ) {
      target.element.classList.remove(
        "is-gravity-pulled"
      );
    }
  }

  hit(id, type, button, x, y) {
    if (
      this.state !== "playing" ||
      !this.targets.has(id)
    ) {
      return;
    }

    const target =
      this.targets.get(id);

    clearTimeout(target.timerId);
    clearTimeout(target.cloneTimerId);
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);
    this.targets.delete(id);

    if (type === "blackhole") {
      this.clearGravityMarks();
    }

    this.taps++;
    this.attempts++;

    button.classList.add("is-hit");

    if (type === "life") {
      this.hits++;

      if (
        this.lives <
        CONFIG.maxLives
      ) {
        this.lives++;

        this.flash(
          "EXTRA LIFE!",
          "LIFE +1",
          "#55ff88"
        );
      } else {
        this.score +=
          CONFIG.extraLifeFullPoints;

        this.flash(
          "LIFE BANK FULL",
          `+${CONFIG.extraLifeFullPoints} PTS`,
          "#55ff88"
        );
      }

      this.audio.life();
      this.effect("is-hit");

      this.setStatus(
        "LIFE RESTORED",
        "normal"
      );

      this.particles.burst(
        x,
        y,
        "#55ff88",
        36
      );
    } else if (type === "decoy") {
      this.score = Math.max(
        0,
        this.score -
          CONFIG.decoyPenalty
      );

      this.lives--;
      this.breakCombo();
      this.audio.bad();

      this.flash(
        "DECOY HIT",
        `-${CONFIG.decoyPenalty}`,
        "#ff325f"
      );

      this.effect("is-damaged");

      this.setStatus(
        "SYSTEM DAMAGE",
        "danger"
      );

      this.particles.burst(
        x,
        y,
        "#ff325f",
        24
      );

      if (this.lives <= 0) {
        setTimeout(
          () => this.finish(),
          180
        );

        return;
      }
    } else if (
      type === "redrabbit"
    ) {
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

      this.flash(
        "RED RABBIT HIT!",
        `-${CONFIG.redPenaltyPoints} PTS / -${CONFIG.redPenaltyTime}s`,
        "#ff0033"
      );

      this.effect("is-damaged");

      this.setStatus(
        "CRITICAL ERROR!",
        "danger"
      );

      this.particles.burst(
        x,
        y,
        "#ff0033",
        35
      );
    } else if (type === "net") {
      this.timeLeft = Math.max(
        0,
        this.timeLeft - 1.5
      );

      this.breakCombo();
      this.audio.bad();

      this.flash(
        "NET TRAP!",
        "COMBO RESET / -1.5s",
        "#a855f7"
      );

      this.effect("is-damaged");

      this.setStatus(
        "NETWORK BLOCKED!",
        "warning"
      );

      this.particles.burst(
        x,
        y,
        "#a855f7",
        20
      );
    } else if (
      type === "blackhole"
    ) {
      this.timeLeft = Math.max(
        0,
        this.timeLeft -
          CONFIG.blackHolePenaltyTime
      );

      this.breakCombo();
      this.audio.blackHole();
      this.effect("is-damaged");

      this.setStatus(
        "GRAVITY BREACH",
        "danger"
      );

      this.particles.burst(
        target.x,
        target.y,
        "#a855f7",
        34
      );

      this.particles.burst(
        target.x,
        target.y,
        "#ffffff",
        18
      );
    } else if (
      type === "hacker"
    ) {
      this.score = Math.max(
        0,
        this.score -
          CONFIG.hackerPenaltyPoints
      );

      this.breakCombo();
      this.audio.blackHacker();
      this.applyHackerVirus();

      this.flash(
        "HACKER RABBIT HIT!",
        `-${CONFIG.hackerPenaltyPoints} PTS // VIRUS UPLOADED`,
        "#ff38c7"
      );

      this.setStatus(
        "SYSTEM INFECTED",
        "danger"
      );

      this.particles.burst(
        x,
        y,
        "#00f5ff",
        22
      );

      this.particles.burst(
        x,
        y,
        "#ff38c7",
        22
      );

      this.particles.burst(
        x,
        y,
        "#a855f7",
        18
      );
    } else if (type === "hero") {
      this.hits++;
      this.audio.whiteHacker();
      this.applyAntiCheat(
        button,
        x,
        y
      );

      this.particles.burst(
        x,
        y,
        "#fff4dc",
        24
      );

      this.particles.burst(
        x,
        y,
        "#ff7a00",
        28
      );

      this.particles.burst(
        x,
        y,
        "#246bff",
        20
      );
    } else {
      this.hits++;
      this.comboCount++;

      this.mult = Math.min(
        CONFIG.maxCombo,
        1 +
          Math.floor(
            this.comboCount / 3
          )
      );

      this.maxCombo = Math.max(
        this.maxCombo,
        this.mult
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

      points *= this.mult;
      this.score += points;
      this.levelHits++;

      if (type === "golden") {
        this.timeLeft +=
          CONFIG.goldenBonus;

        this.audio.gold();

        this.flash(
          "GOLDEN RABBIT",
          `+${points} / +${CONFIG.goldenBonus.toFixed(1)}s`,
          "#ffd34d"
        );

        this.particles.burst(
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

        this.flash(
          "FREEZE RABBIT",
          `TIME SLOWED! +${points}`,
          "#00f5ff"
        );

        this.particles.burst(
          x,
          y,
          "#00f5ff",
          30
        );
      } else {
        this.audio.hit(this.mult);

        this.flash(
          "DIRECT HIT",
          `+${points}`,
          "#00f5ff"
        );

        this.particles.burst(
          x,
          y,
          "#00f5ff",
          20
        );
      }

      this.effect("is-hit");

      this.setStatus(
        "TARGET CONFIRMED",
        "normal"
      );

      if (
        this.levelHits >=
        CONFIG.hitsPerLevel
      ) {
        this.levelUp();
      }
    }

    setTimeout(() => {
      button.remove();
    }, 230);

    this.update();
  }

  applyFreeze() {
    this.isFrozen = true;

    this.e.stage.classList.add(
      "is-frozen"
    );

    clearTimeout(this.freezeTimer);

    this.freezeExpiresAt =
      performance.now() + 4000;

    this.freezeTimer =
      setTimeout(() => {
        this.isFrozen = false;
        this.freezeExpiresAt = 0;

        this.e.stage.classList.remove(
          "is-frozen"
        );
      }, 4000);
  }

  applyHackerVirus(
    duration =
      CONFIG.hackerVirusDuration
  ) {
    this.isVirusActive = true;

    this.e.stage.classList.add(
      "is-virus"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

    requestAnimationFrame(() => {
      this.e.shell.classList.add(
        "is-panic-impact"
      );
    });

    setTimeout(() => {
      this.e.shell.classList.remove(
        "is-panic-impact"
      );
    }, 650);

    clearTimeout(this.virusTimer);

    this.virusExpiresAt =
      performance.now() + duration;

    this.virusTimer =
      setTimeout(() => {
        this.isVirusActive = false;
        this.virusExpiresAt = 0;

        this.e.stage.classList.remove(
          "is-virus"
        );

        if (
          this.state === "playing"
        ) {
          this.setStatus(
            "VIRUS PURGED",
            "normal"
          );
        }
      }, duration);
  }

  applyAntiCheat(
    heroButton,
    fallbackX,
    fallbackY
  ) {
    const stageRect =
      this.e.stage.getBoundingClientRect();

    const heroRect =
      heroButton.getBoundingClientRect();

    const originX =
      heroRect.width
        ? heroRect.left -
          stageRect.left +
          heroRect.width / 2
        : fallbackX;

    const originY =
      heroRect.height
        ? heroRect.top -
          stageRect.top +
          heroRect.height / 2
        : fallbackY;

    const wave =
      document.createElement("span");

    wave.className =
      "anti-cheat-wave";

    wave.style.left = `${originX}px`;
    wave.style.top = `${originY}px`;

    this.e.stage.appendChild(wave);

    this.e.stage.classList.remove(
      "is-anti-cheat"
    );

    requestAnimationFrame(() => {
      this.e.stage.classList.add(
        "is-anti-cheat"
      );
    });

    clearTimeout(this.virusTimer);
    this.isVirusActive = false;
    this.virusExpiresAt = 0;
    this.virusRemaining = 0;

    this.e.stage.classList.remove(
      "is-virus"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

    const dangerousTypes =
      new Set([
        "decoy",
        "redrabbit",
        "net",
        "hacker",
        "blackhole",
      ]);

    for (
      const [id, target]
      of [...this.targets.entries()]
    ) {
      if (
        !dangerousTypes.has(
          target.type
        )
      ) {
        continue;
      }

      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);
      this.targets.delete(id);

      target.element.classList.add(
        "is-anti-cheat-deleted"
      );

      const targetRect =
        target.element
          .getBoundingClientRect();

      const particleX =
        targetRect.left -
        stageRect.left +
        targetRect.width / 2;

      const particleY =
        targetRect.top -
        stageRect.top +
        targetRect.height / 2;

      const color =
        target.type === "hacker"
          ? "#ff38c7"
          : target.type === "blackhole"
            ? "#ffffff"
          : target.type === "redrabbit"
            ? "#ff0033"
            : target.type === "net"
              ? "#a855f7"
              : "#ff325f";

      this.particles.burst(
        particleX,
        particleY,
        color,
        ["hacker", "blackhole"]
          .includes(target.type)
          ? 32
          : 22
      );

      setTimeout(() => {
        target.element.remove();
      }, 580);
    }

    this.clearGravityMarks();

    setTimeout(() => {
      wave.remove();

      this.e.stage.classList.remove(
        "is-anti-cheat"
      );
    }, CONFIG.antiCheatDuration);
  }

  miss(id) {
    if (
      !this.targets.has(id) ||
      this.state !== "playing"
    ) {
      return;
    }

    const target =
      this.targets.get(id);

    this.targets.delete(id);
    clearTimeout(target.cloneTimerId);
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);

    if (target.type === "blackhole") {
      this.clearGravityMarks();
    }

    target.element.classList.add(
      "is-expiring"
    );

    setTimeout(() => {
      target.element.remove();
    }, 180);

    const harmlessToIgnore = [
      "decoy",
      "redrabbit",
      "net",
      "life",
      "golden",
      "freeze",
      "hacker",
      "hero",
      "blackhole",
    ].includes(target.type);

    if (!harmlessToIgnore) {
      this.attempts++;
      this.breakCombo();
      this.lives--;
      this.audio.bad();

      this.flash(
        "TARGET ESCAPED",
        "LIFE -1",
        "#ff325f"
      );

      this.effect("is-damaged");

      this.setStatus(
        "TARGET ESCAPED",
        "warning"
      );

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

    this.audio.bad();

    this.flash(
      "MISS",
      "COMBO RESET",
      "#8fa3b8"
    );

    this.update();
  }

  levelUp() {
    this.levelHits = 0;

    if (
      this.level <
      CONFIG.maxLevel
    ) {
      this.level++;
    }

    this.audio.level();
    this.effect("is-level-up");

    this.flash(
      `LEVEL ${String(
        this.level
      ).padStart(2, "0")}`,
      "RABBIT FLOW INCREASED!",
      "#ffd34d"
    );

    this.setStatus(
      "LEVEL ADVANCED",
      "normal"
    );
  }

  breakCombo() {
    this.comboCount = 0;
    this.mult = 1;
  }

  removeAllTargets() {
    for (
      const target
      of this.targets.values()
    ) {
      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);
      target.element.remove();
    }

    this.targets.clear();
  }

  pause() {
    if (
      this.state !== "playing"
    ) {
      return;
    }

    const now = performance.now();

    this.state = "paused";

    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }

    this.goodRemaining =
      this.goodDueAt
        ? Math.max(
            1,
            this.goodDueAt - now
          )
        : this.goodDelay();

    this.hazardRemaining =
      this.hazardDueAt
        ? Math.max(
            1,
            this.hazardDueAt - now
          )
        : this.hazardDelay();

    this.hackerRemaining =
      this.hackerDueAt
        ? Math.max(
            1,
            this.hackerDueAt - now
          )
        : this.hackerDelay();

    this.heroRemaining =
      this.heroDueAt
        ? Math.max(
            1,
            this.heroDueAt - now
          )
        : this.heroDelay();

    this.blackHoleRemaining =
      this.blackHoleDueAt
        ? Math.max(
            1,
            this.blackHoleDueAt - now
          )
        : this.blackHoleDelay();

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    this.goodDueAt = 0;
    this.hazardDueAt = 0;
    this.hackerDueAt = 0;
    this.heroDueAt = 0;
    this.blackHoleDueAt = 0;

    for (
      const target
      of this.targets.values()
    ) {
      if (
        target.type === "hacker" &&
        !target.cloneSpent &&
        target.cloneDueAt
      ) {
        target.cloneRemaining =
          Math.max(
            1,
            target.cloneDueAt - now
          );

        target.cloneDueAt = 0;
      }

      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);

      if (
        target.type === "blackhole" &&
        target.portalDueAt
      ) {
        target.portalRemaining =
          Math.max(
            1,
            target.portalDueAt - now
          );

        target.portalDueAt = 0;
      }

      target.remaining = Math.max(
        1,
        this.targetRemaining(
          target,
          now
        )
      );
    }

    if (
      this.isFrozen &&
      this.freezeExpiresAt
    ) {
      this.freezeRemaining =
        Math.max(
          1,
          this.freezeExpiresAt - now
        );

      clearTimeout(this.freezeTimer);
      this.freezeExpiresAt = 0;
    }

    if (
      this.isVirusActive &&
      this.virusExpiresAt
    ) {
      this.virusRemaining =
        Math.max(
          1,
          this.virusExpiresAt - now
        );

      clearTimeout(this.virusTimer);
      this.virusExpiresAt = 0;
    }

    this.e.layer
      .getAnimations({
        subtree: true,
      })
      .forEach((animation) => {
        animation.pause();
      });

    this.show(this.e.pauseO, true);

    this.e.pause.disabled = true;
    this.audio.stopSamples();

    this.setStatus(
      "SYSTEM SUSPENDED",
      "warning"
    );
  }

  resume() {
    if (
      this.state !== "paused"
    ) {
      return;
    }

    const now = performance.now();

    this.show(
      this.e.pauseO,
      false
    );

    this.state = "playing";
    this.e.pause.disabled = false;
    this.last = now;

    for (
      const [id, target]
      of this.targets.entries()
    ) {
      const remaining = Math.max(
        1,
        target.remaining ??
          target.life
      );

      target.life = remaining;
      target.spawnAt = now;

      target.timerId =
        setTimeout(
          () => this.miss(id),
          remaining
        );

      if (
        target.type === "hacker" &&
        !target.cloneSpent
      ) {
        this.startHackerCloneTimer(
          id,
          target,
          Math.max(
            1,
            target.cloneRemaining ||
              CONFIG.hackerCloneDelay
          )
        );

        target.cloneRemaining = 0;
      }

      if (target.type === "blackhole") {
        if (!target.portalSpent) {
          this.startBlackHoleSystems(
            id,
            target,
            Math.max(
              1,
              target.portalRemaining ||
                CONFIG.blackHoleHackerDelay
            )
          );
        } else {
          target.gravityTimerId =
            setInterval(() => {
              this.applyBlackHoleGravity(
                id,
                target
              );
            }, CONFIG.blackHoleGravityRate);
        }

        target.portalRemaining = 0;
      }

      delete target.remaining;
    }

    this.e.layer
      .getAnimations({
        subtree: true,
      })
      .forEach((animation) => {
        animation.play();
      });

    if (
      this.isFrozen &&
      this.freezeRemaining > 0
    ) {
      const remaining =
        this.freezeRemaining;

      this.freezeRemaining = 0;

      this.freezeExpiresAt =
        now + remaining;

      this.freezeTimer =
        setTimeout(() => {
          this.isFrozen = false;
          this.freezeExpiresAt = 0;

          this.e.stage.classList.remove(
            "is-frozen"
          );
        }, remaining);
    }

    if (
      this.isVirusActive &&
      this.virusRemaining > 0
    ) {
      const remaining =
        this.virusRemaining;

      this.virusRemaining = 0;

      this.applyHackerVirus(
        remaining
      );
    }

    this.raf =
      requestAnimationFrame(
        (time) => this.loop(time)
      );

    this.scheduleGood(
      Math.max(
        1,
        this.goodRemaining ||
          this.goodDelay()
      )
    );

    this.scheduleHazard(
      Math.max(
        1,
        this.hazardRemaining ||
          this.hazardDelay()
      )
    );

    this.scheduleHacker(
      Math.max(
        1,
        this.hackerRemaining ||
          this.hackerDelay()
      )
    );

    this.scheduleHero(
      Math.max(
        1,
        this.heroRemaining ||
          this.heroDelay()
      )
    );

    this.scheduleBlackHole(
      Math.max(
        1,
        this.blackHoleRemaining ||
          this.blackHoleDelay()
      )
    );

    this.goodRemaining = 0;
    this.hazardRemaining = 0;
    this.hackerRemaining = 0;
    this.heroRemaining = 0;
    this.blackHoleRemaining = 0;

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

  finish() {
    if (
      this.state === "gameover"
    ) {
      return;
    }

    this.state = "gameover";

    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    clearTimeout(this.freezeTimer);
    clearTimeout(this.virusTimer);

    this.isVirusActive = false;

    this.e.stage.classList.remove(
      "is-virus",
      "is-anti-cheat"
    );

    this.e.shell.classList.remove(
      "is-panic-impact"
    );

    this.removeAllTargets();

    this.e.pause.disabled = true;

    const record =
      this.score > this.best;

    if (record) {
      this.best = this.score;

      localStorage.setItem(
        CONFIG.bestKey,
        String(this.best)
      );
    }

    const accuracy =
      this.attempts
        ? Math.round(
            (
              this.hits /
              this.attempts
            ) * 100
          )
        : 0;

    this.e.finalScore.textContent =
      pad(this.score);

    this.e.finalBest.textContent =
      pad(this.best);

    this.e.finalCombo.textContent =
      `x${this.maxCombo}`;

    this.e.finalAcc.textContent =
      `${accuracy}%`;

    this.e.rank.textContent =
      this.rank();

    this.e.record.classList.toggle(
      "is-visible",
      record
    );

    this.update();

    this.show(this.e.overO, true);

    this.setStatus(
      "SESSION COMPLETE",
      "danger"
    );

    this.audio.stopSamples();
    this.audio.over();
  }

  rank() {
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

  setStatus(text, type) {
    this.e.status.textContent = text;

    const chip =
      document.querySelector(
        ".status-chip"
      );

    chip?.classList.toggle(
      "is-danger",
      type === "danger"
    );

    chip?.classList.toggle(
      "is-warning",
      type === "warning"
    );
  }

  flash(main, sub, color) {
    this.e.floatMain.textContent = main;
    this.e.floatSub.textContent = sub;
    this.e.float.style.color = color;

    this.e.float.classList.remove(
      "is-visible"
    );

    requestAnimationFrame(() => {
      this.e.float.classList.add(
        "is-visible"
      );
    });
  }

  effect(className) {
    this.e.stage.classList.remove(
      className
    );

    requestAnimationFrame(() => {
      this.e.stage.classList.add(
        className
      );
    });

    setTimeout(() => {
      this.e.stage.classList.remove(
        className
      );
    }, 700);
  }

  updateSound() {
    this.e.sound.setAttribute(
      "aria-pressed",
      String(this.audio.enabled)
    );

    this.e.soundIcon.textContent =
      this.audio.enabled
        ? "ON"
        : "OFF";
  }

  update() {
    this.e.score.textContent =
      pad(this.score);

    this.e.best.textContent =
      pad(this.best);

    this.e.combo.textContent =
      String(this.mult);

    this.e.level.textContent =
      String(this.level).padStart(
        2,
        "0"
      );

    this.e.time.textContent =
      this.timeLeft.toFixed(1);

    this.e.comboCard.classList.toggle(
      "is-hot",
      this.mult >= 3
    );

    this.e.progressText.textContent =
      `${this.levelHits} / ${CONFIG.hitsPerLevel}`;

    this.e.progressFill.style.width =
      `${
        (
          this.levelHits /
          CONFIG.hitsPerLevel
        ) * 100
      }%`;

    [
      ...this.e.lives.children,
    ].forEach(
      (element, index) => {
        element.classList.toggle(
          "life--active",
          index < this.lives
        );

        element.classList.toggle(
          "life--lost",
          index >= this.lives
        );
      }
    );
  }
}

window.addEventListener(
  "DOMContentLoaded",
  () => {
    try {
      new Game();
    } catch (error) {
      console.error(error);

      alert(
        "Igra nije mogla da se pokrene. Proveri da li su index.html, style.css i script.js u istom folderu."
      );
    }
  }
);
