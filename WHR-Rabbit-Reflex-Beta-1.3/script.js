"use strict";

/* =========================================================
   WHR MUSIC ENGINE - "NEON STATIC" (by Claude & WHR Crew)
   Originalna WHR univerzum tema, 100% proceduralna.
   ========================================================= */

const NOTE_INDEX = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

function noteFreq(note) {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 0;
  const [, name, octaveStr] = match;
  const octave = Number(octaveStr);
  const semitoneFromA4 = NOTE_INDEX[name] + (octave - 4) * 12 - 9;
  return 440 * Math.pow(2, semitoneFromA4 / 12);
}

class MusicEngine {
  constructor(audioFX) {
    this.audioFX = audioFX || null;
    this.ctx = (audioFX && audioFX.ctx) || null;
    this.enabled = audioFX
      ? audioFX.enabled
      : localStorage.getItem(MusicEngine.KEY) !== "false";
    this.playing = false;

    this.tempo = 132;
    this.stepSeconds = 60 / this.tempo / 4;
    this.stepsPerBar = 16;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.lookaheadMs = 25;
    this.scheduleAheadSec = 0.12;
    this.timerId = null;
    this.introTimerId = null;
    this.introSources = new Set();

    this.intensity = 1;
    this.master = null;
    this.compressor = null;
    this.duckTimerId = null;

    this.bass = [
      "A2", null, null, null, "E2", null, null, null,
      "F2", null, null, null, "G2", null, null, null,
      "A2", null, null, null, "E2", null, null, null,
      "D2", null, null, null, "G2", null, null, null,
      "A2", null, "A2", null, "E2", null, "A2", null,
      "F2", null, "F2", null, "G2", null, "E2", null,
      "A2", null, "A2", null, "E2", null, "A2", null,
      "D2", null, "F2", null, "G2", null, "G2", null,
      "D2", null, "D2", null, "A2", null, "D2", null,
      "F2", null, "G2", null, "A2", null, "A2", null,
      "D2", null, "D2", null, "A2", null, "D2", null,
      "C2", null, "E2", null, "F2", null, "G2", null,
      "A2", null, "A2", "A2", "E2", null, "E2", "E2",
      "F2", null, "F2", "F2", "G2", "G2", "A2", "A2",
      "G2", null, "F2", null, "E2", null, "D2", null,
      "C2", null, "D2", null, "E2", null, "A2", null,
    ];

    this.arp = [
      null, "C5", null, "E4", null, "C5", null, "A4",
      null, "A4", null, "F4", null, "A4", null, "C5",
      null, "E5", null, "C5", null, "A4", null, "C5",
      null, "F4", null, "A4", null, "D5", null, "B4",
      "A4", "C5", "E4", "C5", "A4", "C5", "E4", "G4",
      "F4", "A4", "C5", "A4", "G4", "B4", "D5", "E4",
      "A4", "E5", "C5", "E5", "A4", "C5", "E4", "A4",
      "D4", "F4", "A4", "F4", "G4", "D5", "B4", "G4",
      "D4", "F4", "A4", "F4", "D4", "F4", "A4", "C5",
      "F4", "A4", "C5", "A4", "A4", "C5", "E5", "D5",
      "D4", "A4", "F4", "A4", "D4", "F4", "A4", "D5",
      "C4", "E4", "G4", "E4", "F4", "A4", "C5", "D5",
      "A4", "C5", "E5", "C5", "A4", "E4", "C5", "A4",
      "F4", "A4", "D5", "C5", "G4", "B4", "D5", "E5",
      "C4", "E4", "G4", "C5", "E5", "G5", "A5", "G5",
      "E5", "C5", "A4", "G4", "E4", "C4", "E4", "A4",
    ];

    this.lead = [
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      "E5", null, null, "C5", null, "A4", null, null,
      "D5", null, "C5", null, "A4", null, "G4", null,
      "E5", null, null, "G5", null, "E5", null, null,
      "D5", null, "B4", null, "D5", null, "A4", null,
      "A5", null, null, "F5", null, "D5", null, null,
      "G5", null, "F5", null, "D5", null, "C5", null,
      "A5", null, null, "C6", null, "A5", null, null,
      "G5", null, "E5", null, "G5", null, "D5", null,
      "C6", "B5", "A5", "G5", "F5", "E5", "D5", "C5",
      "B4", "A4", null, null, "E5", null, "A4", null,
      "G4", null, "A4", null, "C5", null, "D5", null,
      "E5", null, null, null, null, null, null, null,
    ];

    this.hi = [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 1, 1, 0, 1, 1,
      1, 1, 1, 0, 1, 1, 1, 0,
      1, 1, 1, 0, 1, 1, 1, 0,
      1, 1, 1, 0, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
    ];
  }

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx) {
      if (!AudioContextClass) return;
      this.ctx = (this.audioFX && this.audioFX.ctx) || new AudioContextClass();
      if (this.audioFX && !this.audioFX.ctx) {
        this.audioFX.ctx = this.ctx;
      }
    }
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -16;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 5;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.22;
      this.master.gain.value = this.intensityVolume();
      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
  }

  start({ restart = false } = {}) {
    if (this.playing || !this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    this.playing = true;
    if (restart) {
      this.currentStep = 0;
    }
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  playIntro(onComplete) {
    if (!this.enabled) {
      if (onComplete) onComplete();
      return;
    }

    this.init();
    if (!this.ctx) {
      if (onComplete) onComplete();
      return;
    }

    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    this.stopIntro();

    const ctx = this.ctx;
    const now = ctx.currentTime + 0.03;
    const introGain = ctx.createGain();
    introGain.gain.value = 0.16;
    introGain.connect(this.master || ctx.destination);

    const beepFreqs = [620, 980, 1400];
    let t = now;
    beepFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(g);
      g.connect(introGain);
      this.introSources.add(osc);
      osc.start(t);
      osc.stop(t + 0.18);
      t += 0.19;
    });

    const sweepStart = t + 0.05;
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = "sawtooth";
    sweep.frequency.setValueAtTime(300, sweepStart);
    sweep.frequency.exponentialRampToValueAtTime(2400, sweepStart + 0.55);
    sweepGain.gain.setValueAtTime(0.0001, sweepStart);
    sweepGain.gain.exponentialRampToValueAtTime(0.1, sweepStart + 0.05);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, sweepStart + 0.6);
    sweep.connect(sweepGain);
    sweepGain.connect(introGain);
    this.introSources.add(sweep);
    sweep.start(sweepStart);
    sweep.stop(sweepStart + 0.62);

    const chordStart = sweepStart + 0.66;
    ["A3", "E4", "A4"].forEach((note) => {
      const freq = noteFreq(note);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, chordStart);
      g.gain.setValueAtTime(0.0001, chordStart);
      g.gain.exponentialRampToValueAtTime(0.1, chordStart + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.5);
      osc.connect(g);
      g.connect(introGain);
      this.introSources.add(osc);
      osc.start(chordStart);
      osc.stop(chordStart + 0.52);
    });

    const totalDurationMs = (chordStart + 0.55 - now) * 1000;
    this.introTimerId = setTimeout(() => {
      this.introTimerId = null;
      this.introSources.clear();
      if (onComplete) onComplete();
    }, Math.max(0, totalDurationMs));
  }

  stopIntro() {
    clearTimeout(this.introTimerId);
    this.introTimerId = null;

    for (const source of this.introSources) {
      try {
        source.stop();
      } catch {
        // Izvor je vec zavrsen
      }
    }
    this.introSources.clear();
  }

  stop() {
    this.playing = false;
    clearTimeout(this.timerId);
    clearTimeout(this.duckTimerId);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    localStorage.setItem(MusicEngine.KEY, String(this.enabled));

    if (!this.enabled) {
      this.stopIntro();
      this.stop();
    }
    return this.enabled;
  }

  toggle() {
    return this.setEnabled(!this.enabled);
  }

  setIntensity(level) {
    if (level >= 10) this.intensity = 4;
    else if (level >= 6) this.intensity = 3;
    else if (level >= 3) this.intensity = 2;
    else this.intensity = 1;

    this.updateMasterVolume();
  }

  intensityVolume() {
    return {
      1: 0.16,
      2: 0.145,
      3: 0.13,
      4: 0.118,
    }[this.intensity] || 0.145;
  }

  duck(duration = 260, strength = 0.5) {
    if (!this.master || !this.ctx || !this.playing) return;
    clearTimeout(this.duckTimerId);
    const now = this.ctx.currentTime;
    const normal = this.intensityVolume();
    const reduced = Math.max(0.035, normal * strength);
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(reduced, now + 0.025);
    this.master.gain.linearRampToValueAtTime(normal, now + duration / 1000);
    this.duckTimerId = setTimeout(() => this.updateMasterVolume(), duration + 30);
  }

  updateMasterVolume(immediate = false) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    const volume = this.intensityVolume();

    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);

    if (immediate) {
      this.master.gain.setValueAtTime(volume, now);
    } else {
      this.master.gain.linearRampToValueAtTime(volume, now + 0.25);
    }
  }

  scheduler() {
    if (!this.playing) return;
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.stepSeconds;
      this.currentStep = (this.currentStep + 1) % this.bass.length;
    }
    this.timerId = setTimeout(() => this.scheduler(), this.lookaheadMs);
  }

  scheduleStep(step, time) {
    const barStep = step % this.stepsPerBar;

    if (barStep % 4 === 0) {
      this.kick(time, barStep === 0 ? 0.13 : 0.095);
    }

    if (this.intensity >= 2 && (barStep === 4 || barStep === 12)) {
      this.snare(time);
    }

    if (barStep === 0) {
      const padRoots = ["A3", "F3", "D3", "G3"];
      const bar = Math.floor(step / this.stepsPerBar) % padRoots.length;
      this.pad(padRoots[bar], time);
    }

    const bassNote = this.bass[step];
    if (bassNote) {
      this.pluck(bassNote, time, 0.34, "sawtooth", 0.22, 420);
    }

    if (this.intensity >= 2) {
      const arpNote = this.arp[step];
      if (arpNote) {
        this.pluck(arpNote, time, 0.16, "square", 0.09, 1800);
      }
    }

    if (this.intensity >= 3) {
      const leadNote = this.lead[step];
      if (leadNote) {
        this.pluck(leadNote, time, 0.42, "triangle", 0.13, 2600);
      }
    }

    if (this.intensity >= 4 && this.hi[step]) {
      this.hihat(time);
    }
  }

  kick(time, peak = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.11);
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  snare(time) {
    if (!this.ctx) return;
    const length = Math.floor(this.ctx.sampleRate * 0.09);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index++) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 1650;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.055, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(time);
    noise.stop(time + 0.1);
  }

  pad(root, time) {
    if (!this.ctx) return;
    const chordMap = {
      A3: ["A3", "C4", "E4"],
      F3: ["F3", "A3", "C4"],
      D3: ["D3", "F3", "A3"],
      G3: ["G3", "B3", "D4"],
    };
    const duration = this.stepSeconds * this.stepsPerBar * 0.92;
    for (const note of chordMap[root] || [root]) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(noteFreq(note), time);
      filter.type = "lowpass";
      filter.frequency.value = 720 + this.intensity * 130;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.022, time + 0.16);
      gain.gain.linearRampToValueAtTime(0.0001, time + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      osc.start(time);
      osc.stop(time + duration + 0.03);
    }
  }

  pluck(note, time, duration, type, gainPeak, filterFreq) {
    const freq = noteFreq(note);
    if (!freq || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainPeak, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  hihat(time) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    noise.start(time);
    noise.stop(time + 0.06);
  }
}

MusicEngine.KEY = "whr-rabbit-reflex-music-enabled";

/* CONFIG & UTILS */

const CONFIG = {
  time: 60,
  lives: 3,
  maxLives: 10,
  hitsPerLevel: 10,

  rabbitPoints: 250,
  goldenPoints: 1200,
  goldenBonus: 5,
  goldenEscapePenalty: 5,
  goldenPitySpawns: 10,
  freezePoints: 500,
  freezeHitPenalty: 2,
  freezeRushDuration: 4000,
  freezeRushScale: 1.2,
  freezeTargetLifeScale: 0.7,
  freezeEscapeDuration: 3000,
  freezeEscapeScale: 0.5,
  redPenaltyPoints: 10000,
  redPenaltyTime: 10,
  redEscapeBonus: 1,
  decoyPenaltyTime: 20,
  decoyMonoDuration: 3000,

  extraLifeChance: 0.10,
  extraLifeStartLevel: 1,
  extraLifeFullPoints: 1500,

  targetLife: 1450,
  hazardLife: 1800,
  lifeRabbitLife: 5000,
  decoyLife: 3000,
  netLife: 10000,
  netPenaltyTime: 5,
  netOverlayDuration: 3000,

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
  hackerVirusDuration: 2000,
  hackerCloneDelay: 1500,
  hackerMaxOnBoard: 2,

  heroStartLevel: 4,
  heroMinDelay: 12000,
  heroMaxDelay: 16000,
  heroLife: 7000,
  heroEscapePoints: 20000,
  heroEscapeTime: 5,
  antiCheatDuration: 780,

  blackHoleStartLevel: 5,
  blackHoleMinDelay: 10000,
  blackHoleMaxDelay: 15000,
  blackHoleLife: 5000,
  blackHoleChainDelay: 4800,
  blackHoleMoveStartLevel: 10,
  blackHoleBaseSpeed: 18,
  blackHoleMaxSpeed: 40,
  blackHoleGravityRate: 70,
  blackHoleBaseGravityRadius: 230,
  blackHoleGravityRadiusStep: 15,

  bestKey: "whr-rabbit-reflex-best-score",
  soundKey: "whr-rabbit-reflex-sound-enabled",
};

const TUTORIAL_STEPS = [
  { type: "rabbit", group: "good", action: "click", title: "OBICAN ZEC", text: "KLIKNI METU! Pogodi ga pre nego sto nestane s ekrana." },
  { type: "golden", group: "good", action: "click", title: "ZLATNI ZEC", text: "KLIKNI METU! Donosi velika pojacanja i dodatne sekunde." },
  { type: "freeze", group: "good", action: "click", title: "PLAVI ZEC", text: "KLIKNI METU! Ubrzava sistem na kratko uz bonus poene." },
  { type: "life", group: "good", action: "click", title: "EXTRA LIFE", text: "KLIKNI METU! Dodaje +1 zivot u vasem sistemu (max 10)." },
  { type: "hero", group: "hero", action: "click", title: "BELI HAKER", text: "KLIKNI METU! Aktivira Anti-Cheat talas koji cisti sve pretnje!" },
  { type: "redrabbit", group: "hazard", action: "avoid", title: "CRVENI ZEC", text: "NE DIRAJ! Izbegavaj klik i sacekaj 3 sekunde da sam nestane." },
  { type: "decoy", group: "hazard", action: "avoid", title: "BEZBOJNI ZEC", text: "NE DIRAJ! Virus zamka — pusti ga 3s bez klika." },
  { type: "net", group: "hazard", action: "avoid", title: "CYBER MREŽA", text: "NE DIRAJ! Prepreka mreže — sačekaj da sama istekne." },
  { type: "hacker", group: "hacker", action: "avoid", title: "CRNI HAKER", text: "NE DIRAJ! Opasna pretnja — izdrži 3 sekunde bez klika!" },
  { type: "blackhole", group: "blackhole", action: "observe", title: "CRNA RUPA", text: "POSMATRAJ! Ultra Boss — ne klikće se; gravitacija guta mete bez nagrade ili kazne." },
];

const $ = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing #${id}`);
  }
  return element;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pad = (value) => String(Math.max(0, Math.floor(value))).padStart(8, "0");

/* AUDIO ENGINE */

class AudioFX {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem(CONFIG.soundKey) !== "false";
    this.lobbyMusic = null;

    this.prepareLobbyMusic();
  }

  prepareLobbyMusic() {
    if (typeof Audio === "undefined") return;

    this.lobbyMusic = new Audio("./sound/lobby-music.wav");
    this.lobbyMusic.preload = "auto";
    this.lobbyMusic.loop = true;
    this.lobbyMusic.volume = 0.14;
    this.lobbyMusic.setAttribute("playsinline", "");
  }

  playLobby(volume = 0.14) {
    if (!this.enabled || !this.lobbyMusic) return false;

    this.lobbyMusic.volume = clamp(volume, 0, 1);
    let result;
    try {
      result = this.lobbyMusic.play();
    } catch {
      return false;
    }
    result?.catch?.(() => {});
    return true;
  }

  stopLobby() {
    if (!this.lobbyMusic) return;
    this.lobbyMusic.pause();
    try {
      this.lobbyMusic.currentTime = 0;
    } catch {}
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
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  /* PROCEDURALNI SINTETIZATOR */
  hit() { this.tone(580, 0.08, "sine", 880); }
  gold() { [880, 1100, 1320].forEach((f, i) => setTimeout(() => this.tone(f, 0.1, "triangle", f * 1.15), i * 35)); }
  freeze() { [1000, 800, 600].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, "sine", f * 0.75), i * 40)); }
  red() { [240, 160, 80].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, "sawtooth", f * 0.5), i * 50)); }
  life() { [580, 720, 960, 1200].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, "triangle", f * 1.1), i * 40)); }
  bad() { this.tone(210, 0.22, "sawtooth", 50); }
  level() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, "sine", f * 1.05), i * 65)); }
  click() { this.tone(500, 0.07, "sine", 720); }
  over() { [420, 320, 230, 150].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, "sawtooth", f * 0.7), i * 90)); }
  
  /* POSEBAN BREACH AKORD ZA CRNOG HAKERA */
  blackHacker() {
    [130, 110, 85].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.35, "sawtooth", f * 0.4), i * 40);
    });
  }
  
  blackHole() { this.tone(85, 0.5, "sine", 25); }
  whiteHacker() { [523, 659, 783].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, "triangle", f * 1.2), i * 45)); }
  start() { this.tone(360, 0.28, "triangle", 900); }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(CONFIG.soundKey, String(this.enabled));
    if (this.enabled) this.click();
    else { this.stopLobby(); }
    return this.enabled;
  }
}

/* PARTICLES */

class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.items = [];
    this.last = 0;

    this.resize = () => {
      const rect = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * density;
      canvas.height = rect.height * density;
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.scale(density, density);
    };

    window.addEventListener("resize", this.resize);
    this.resize();
    requestAnimationFrame((time) => this.loop(time));
  }

  burst(x, y, color, count = 18) {
    for (let index = 0; index < count; index++) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.4;
      const speed = 2 + Math.random() * 4;
      const life = 350 + Math.random() * 350;

      this.items.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life, maxLife: life, color, size: 1 + Math.random() * 3,
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

/* GAME ENGINE */

class Game {
  constructor() {
    this.e = {
      stage: $("gameStage"),
      shell: $("appShell"),
      layer: $("targetLayer"),
      virus: $("virusLayer"),
      canvas: $("particleCanvas"),
      cross: $("crosshair"),
      stars: $("spaceStars"),

      startO: $("startOverlay"),
      countO: $("countdownOverlay"),
      pauseO: $("pauseOverlay"),
      overO: $("gameOverOverlay"),

      start: $("startButton"),
      restart: $("restartButton"),
      pause: $("pauseButton"),
      resume: $("resumeButton"),
      pauseLobby: $("pauseLobbyButton"),
      overLobby: $("overLobbyButton"),
      sound: $("soundButton"),
      soundIcon: $("soundIcon"),

      tutorialBtn: $("tutorialButton"),
      tutorialHud: $("tutorialHud"),
      tutorialExitBtn: $("tutorialExitButton"),
      tutorialStep: $("tutorialStep"),
      tutorialTitle: $("tutorialTitle"),
      tutorialText: $("tutorialText"),

      count: $("countdownValue"),
      score: $("scoreValue"),
      best: $("bestScoreValue"),
      level: $("levelValue"),
      time: $("timeValue"),
      timeCard: $("timeCard"),
      status: $("statusText"),
      lives: $("livesValue"),
      progressText: $("progressText"),
      progressFill: $("progressFill"),

      float: $("floatingMessage"),
      floatMain: document.querySelector(".floating-message__main"),
      floatSub: document.querySelector(".floating-message__sub"),

      finalScore: $("finalScoreValue"),
      finalBest: $("finalBestValue"),
      finalLevel: $("finalLevelValue"),
      finalAcc: $("finalAccuracyValue"),
      rank: $("resultRank"),
      record: $("newRecordMessage"),
    };

    this.audio = new AudioFX();
    this.music = new MusicEngine(this.audio);
    this.particles = new Particles(this.e.canvas);

    this.best = Number(localStorage.getItem(CONFIG.bestKey)) || 0;
    this.targets = new Map();

    this.state = "ready";
    this.starting = false;
    this.isTutorial = false;
    this.tutorialCurrentIndex = 0;

    this.isFrozen = false;
    this.freezeScale = 1;
    this.freezeClass = "";
    this.isVirusActive = false;
    this.isMonochrome = false;
    this.isNetOverlayActive = false;

    this.goodSpawnTimer = null;
    this.hazardSpawnTimer = null;
    this.hackerSpawnTimer = null;
    this.heroSpawnTimer = null;
    this.blackHoleSpawnTimer = null;

    this.freezeTimer = null;
    this.virusTimer = null;
    this.monoTimer = null;
    this.netOverlayTimer = null;
    this.lobbyTimer = null;
    this.hudCorruptInterval = null;

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
    this.goodSinceGolden = 0;
    this.lastBlackHoleSpawnIndex = -1;

    this.bind();
    this.reset();
    this.show(this.e.startO, true);
    this.updateSound();
    this.audio.playLobby(0.14);
  }

  bind() {
    this.e.start.onclick = () => this.start();
    this.e.restart.onclick = () => this.start();

    this.e.pause.onclick = () => this.togglePause();
    this.e.resume.onclick = () => this.resume();

    if (this.e.pauseLobby) this.e.pauseLobby.onclick = () => this.backToLobby();
    if (this.e.overLobby) this.e.overLobby.onclick = () => this.backToLobby();

    this.e.tutorialBtn.onclick = () => this.startTutorial();
    this.e.tutorialExitBtn.onclick = () => this.endTutorial();

    this.e.sound.onclick = () => {
      this.audio.toggle();
      if (this.music) {
        this.music.setEnabled(this.audio.enabled);
        if (this.audio.enabled && this.state === "playing") {
          this.music.start();
        }
      }
      if (this.audio.enabled && ["ready", "gameover"].includes(this.state)) {
        this.audio.playLobby(this.state === "gameover" ? 0.1 : 0.14);
      }
      this.updateSound();
    };

    document.addEventListener("pointerdown", () => {
      if (["ready", "gameover"].includes(this.state)) {
        this.audio.playLobby(this.state === "gameover" ? 0.1 : 0.14);
      }
    }, { once: true });

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
        if (this.state === "ready" || this.state === "gameover") {
          this.start();
        } else if (this.state === "playing") {
          this.pause();
        } else if (this.state === "paused") {
          this.resume();
        }
      }
      if (event.code === "Escape" && this.state === "playing") {
        this.pause();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "playing") {
        this.pause();
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
    this.setStatus("SYSTEM READY", "normal");
    this.audio.playLobby(0.14);
  }

  /* TUTORIJAL MOD */

  startTutorial() {
    this.reset();
    this.isTutorial = true;
    this.tutorialCurrentIndex = 0;
    this.show(this.e.startO, false);
    this.e.tutorialHud.classList.add("is-visible");
    this.e.tutorialHud.setAttribute("aria-hidden", "false");
    this.state = "tutorial";
    this.audio.click();
    this.spawnTutorialStep();
  }

  spawnTutorialStep() {
    this.removeAllTargets();
    if (this.tutorialCurrentIndex >= TUTORIAL_STEPS.length) {
      this.endTutorial();
      return;
    }

    const step = TUTORIAL_STEPS[this.tutorialCurrentIndex];
    this.e.tutorialStep.textContent = `TRAINING ${String(this.tutorialCurrentIndex + 1).padStart(2, "0")}/${TUTORIAL_STEPS.length}`;
    this.e.tutorialTitle.textContent = step.title;
    this.e.tutorialText.textContent = step.text;

    this.e.tutorialHud.classList.remove("is-error", "is-success");

    this.spawn(step.type, step.group, {
      spawnAt: {
        x: this.e.stage.getBoundingClientRect().width / 2,
        y: this.e.stage.getBoundingClientRect().height / 2,
      }
    });
  }

  nextTutorialStep() {
    this.tutorialCurrentIndex++;
    if (this.tutorialCurrentIndex >= TUTORIAL_STEPS.length) {
      this.flash("TRAINING COMPLETE", "ALL SYSTEMS VERIFIED!", "#55ffb8");
      this.endTutorial();
    } else {
      this.spawnTutorialStep();
    }
  }

  endTutorial() {
    this.isTutorial = false;
    this.e.tutorialHud.classList.remove("is-visible", "is-error", "is-success");
    this.e.tutorialHud.setAttribute("aria-hidden", "true");
    this.removeAllTargets();
    this.reset();
    this.show(this.e.startO, true);
    this.state = "ready";
    this.setStatus("SYSTEM READY", "normal");
  }

  reset() {
    if (this.raf) cancelAnimationFrame(this.raf);

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    clearTimeout(this.freezeTimer);
    clearTimeout(this.virusTimer);
    clearTimeout(this.monoTimer);
    clearTimeout(this.netOverlayTimer);
    clearTimeout(this.lobbyTimer);
    clearInterval(this.hudCorruptInterval);
    this.lobbyTimer = null;
    this.hudCorruptInterval = null;
    this.audio.stopLobby();

    if (this.music) {
      this.music.stopIntro();
      this.music.stop();
      this.music.currentStep = 0;
      this.music.setIntensity(1);
    }

    this.removeAllTargets();

    this.isFrozen = false;
    this.freezeScale = 1;
    this.freezeClass = "";
    this.isVirusActive = false;
    this.isMonochrome = false;
    this.isNetOverlayActive = false;
    this.lastBlackHoleSpawnIndex = -1;

    this.e.stage.classList.remove("is-frozen", "is-time-rush", "is-time-slow", "is-virus", "is-anti-cheat", "is-cyber-netted", "is-void-collapsing", "is-panic-impact");
    this.e.shell.classList.remove("is-monochrome");
    this.e.stars.classList.remove("is-reverse");

    this.score = 0;
    this.level = 1;
    this.levelHits = 0;

    this.lives = CONFIG.lives;
    this.timeLeft = CONFIG.time;

    this.hits = 0;
    this.attempts = 0;
    this.taps = 0;

    this.last = 0;
    this.update();
  }

  show(element, visible) {
    element.classList.toggle("stage-overlay--visible", visible);
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

    this.audio.stopLobby();
    this.audio.start();

    if (this.music) {
      this.music.playIntro();
    }

    for (const value of ["3", "2", "1", "GO"]) {
      if (this.state !== "countdown") {
        this.starting = false;
        return;
      }

      this.e.count.textContent = value;
      this.audio.tone(value === "GO" ? 760 : 300 + Number(value) * 60, 0.12, "square", value === "GO" ? 1100 : 500);
      await sleep(value === "GO" ? 500 : 700);
    }

    this.show(this.e.countO, false);

    this.state = "playing";
    this.e.pause.disabled = false;

    if (this.music) {
      this.music.start({ restart: true });
    }

    this.setStatus("TARGET ACQUISITION", "normal");

    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.loop(time));

    this.scheduleGood(250);
    this.scheduleHazard(1500);
    this.scheduleHacker(CONFIG.hackerMaxDelay);
    this.scheduleHero(CONFIG.heroMaxDelay);
    this.scheduleBlackHole(CONFIG.blackHoleMaxDelay);

    this.starting = false;
  }

  loop(time) {
    if (this.state !== "playing") return;

    const movementDelta = Math.min(0.1, (time - (this.last || time)) / 1000);
    let delta = movementDelta;
    this.last = time;

    if (this.isFrozen) delta *= this.freezeScale;

    this.timeLeft = Math.max(0, this.timeLeft - delta);
    if (!this.hudCorruptInterval) {
      this.e.time.textContent = this.timeLeft.toFixed(1);
    }

    this.e.timeCard.classList.toggle("is-critical", this.timeLeft <= 8);

    const now = performance.now();

    this.updateBlackHoleMovement(movementDelta);

    for (const target of this.targets.values()) {
      const progress = clamp(this.targetRemaining(target, now) / target.maxLife, 0, 1);
      target.element.style.setProperty("--life-progress", progress);
    }

    if (this.timeLeft <= 0) {
      this.finish();
      return;
    }

    this.raf = requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  goodDelay() {
    return Math.max(CONFIG.goodMinDelay, CONFIG.goodBaseDelay - (this.level - 1) * CONFIG.goodDelayStep);
  }

  hazardDelay() {
    return Math.max(CONFIG.hazardMinDelay, CONFIG.hazardBaseDelay - (this.level - CONFIG.hazardStartLevel) * CONFIG.hazardDelayStep) * (0.8 + Math.random() * 0.45);
  }

  hackerDelay() { return CONFIG.hackerMinDelay + Math.random() * (CONFIG.hackerMaxDelay - CONFIG.hackerMinDelay); }
  heroDelay() { return CONFIG.heroMinDelay + Math.random() * (CONFIG.heroMaxDelay - CONFIG.heroMinDelay); }
  blackHoleDelay() { return CONFIG.blackHoleMinDelay + Math.random() * (CONFIG.blackHoleMaxDelay - CONFIG.blackHoleMinDelay); }

  targetRemaining(target, now = performance.now()) { return Math.max(0, target.life - (now - target.spawnAt)); }
  maxGoodTargets() { return this.level >= 12 ? 3 : (this.level >= 5 ? 2 : 1); }
  maxHazards() { return this.level >= 10 ? 2 : 1; }

  countGroup(group) { return [...this.targets.values()].filter((t) => t.group === group).length; }
  countType(type) { return [...this.targets.values()].filter((t) => t.type === type).length; }

  scheduleGood(delay = this.goodDelay()) {
    clearTimeout(this.goodSpawnTimer);
    this.goodDueAt = performance.now() + delay;
    this.goodSpawnTimer = setTimeout(() => {
      this.goodDueAt = 0;
      if (this.state === "playing" && this.countGroup("good") < this.maxGoodTargets()) {
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
      if (this.state === "playing" && this.level >= CONFIG.hazardStartLevel && this.countGroup("hazard") < this.maxHazards()) {
        const type = this.pickHazardType();
        if (!["decoy", "net"].includes(type) || this.countType(type) === 0) {
          this.spawn(type, "hazard");
        }
      }
      if (this.state === "playing") this.scheduleHazard();
    }, delay);
  }

  scheduleHacker(delay = this.hackerDelay()) {
    clearTimeout(this.hackerSpawnTimer);
    this.hackerDueAt = performance.now() + delay;
    this.hackerSpawnTimer = setTimeout(() => {
      this.hackerDueAt = 0;
      if (this.state === "playing" && this.level >= CONFIG.hackerStartLevel && !this.isVirusActive && this.countGroup("hacker") === 0) {
        this.spawn("hacker", "hacker");
      }
      if (this.state === "playing") this.scheduleHacker();
    }, delay);
  }

  scheduleHero(delay = this.heroDelay()) {
    clearTimeout(this.heroSpawnTimer);
    this.heroDueAt = performance.now() + delay;
    this.heroSpawnTimer = setTimeout(() => {
      this.heroDueAt = 0;
      if (this.state === "playing" && this.level >= CONFIG.heroStartLevel && this.countGroup("hero") === 0) {
        this.spawn("hero", "hero");
      }
      if (this.state === "playing") this.scheduleHero();
    }, delay);
  }

  scheduleBlackHole(delay = this.blackHoleDelay()) {
    clearTimeout(this.blackHoleSpawnTimer);
    this.blackHoleDueAt = performance.now() + delay;
    this.blackHoleSpawnTimer = setTimeout(() => {
      this.blackHoleDueAt = 0;
      if (this.state === "playing" && this.level >= CONFIG.blackHoleStartLevel && this.countGroup("blackhole") < 2) {
        this.spawn("blackhole", "blackhole");
      }
      if (this.state === "playing") {
        const nextDelay = this.level >= CONFIG.blackHoleStartLevel
          ? CONFIG.blackHoleChainDelay
          : this.blackHoleDelay();
        this.scheduleBlackHole(nextDelay);
      }
    }, delay);
  }

  pickGoodType() {
    this.goodSinceGolden++;
    if (this.goodSinceGolden >= CONFIG.goldenPitySpawns) {
      this.goodSinceGolden = 0;
      return "golden";
    }
    const roll = Math.random();
    const lifeChance = this.level >= CONFIG.extraLifeStartLevel ? CONFIG.extraLifeChance : 0;
    const goldenChance = Math.min(0.09 + (this.level - 1) * 0.003, 0.14);
    const freezeChance = Math.min(0.035 + (this.level - 1) * 0.003, 0.075);

    if (roll < lifeChance) return "life";
    if (roll < lifeChance + goldenChance) {
      this.goodSinceGolden = 0;
      return "golden";
    }
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
    if (this.isTutorial) {
      const step = TUTORIAL_STEPS[this.tutorialCurrentIndex];
      if (!step) return 3000;
      if (step.action === "click") return 999999;
      if (step.action === "avoid") return 3000;
      if (step.action === "observe") return CONFIG.blackHoleLife;
    }

    if (type === "hacker") return CONFIG.hackerLife;
    if (type === "hero") return CONFIG.heroLife;
    if (type === "blackhole") return CONFIG.blackHoleLife;

    let life = CONFIG.targetLife;
    if (type === "net") life = CONFIG.netLife;
    else if (type === "decoy") life = CONFIG.decoyLife;
    else if (type === "life") life = CONFIG.lifeRabbitLife;
    else if (type === "redrabbit") life = CONFIG.hazardLife;

    return this.isFrozen && this.freezeScale > 1 ? life * CONFIG.freezeTargetLifeScale : life;
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
        const otherSize = parseFloat(target.element.style.getPropertyValue("--target-size")) || size;
        const distance = Math.hypot(
          point.x - parseFloat(target.element.style.left),
          point.y - parseFloat(target.element.style.top)
        );
        return distance < (size + otherSize) / 2 + 14;
      });

      if (!overlaps) return point;
    }
    return fallback;
  }

  findBlackHoleSpawnPosition(size, rect) {
    const margin = size / 2 + 18;
    const left = margin;
    const right = Math.max(margin, rect.width - margin);
    const top = margin;
    const bottom = Math.max(margin, rect.height - margin);

    const spawnPoints = [
      { x: left, y: top, cornerIndex: 0 },
      { x: right, y: top, cornerIndex: 1 },
      { x: right, y: bottom, cornerIndex: 2 },
      { x: left, y: bottom, cornerIndex: 3 },
    ];

    const availableIndexes = spawnPoints
      .map((_, index) => index)
      .filter((index) => index !== this.lastBlackHoleSpawnIndex);

    const nextIndex = availableIndexes[
      Math.floor(Math.random() * availableIndexes.length)
    ];

    this.lastBlackHoleSpawnIndex = nextIndex;
    return spawnPoints[nextIndex];
  }

  blackHoleSpeed() {
    if (this.level < CONFIG.blackHoleMoveStartLevel) return 0;
    return Math.min(
      CONFIG.blackHoleMaxSpeed,
      CONFIG.blackHoleBaseSpeed + (this.level - CONFIG.blackHoleMoveStartLevel) * 0.55
    );
  }

  updateBlackHoleMovement(delta) {
    const speed = this.blackHoleSpeed();
    if (!speed || delta <= 0) return;

    const rect = this.e.stage.getBoundingClientRect();
    for (const target of this.targets.values()) {
      if (target.type !== "blackhole") continue;

      const margin = target.size / 2 + 18;
      const width = Math.max(1, rect.width - margin * 2);
      const height = Math.max(1, rect.height - margin * 2);
      const perimeter = 2 * (width + height);
      target.edgePosition = (target.edgePosition + target.edgeDirection * speed * delta + perimeter) % perimeter;

      let position = target.edgePosition;
      if (position <= width) {
        target.x = margin + position;
        target.y = margin;
      } else if ((position -= width) <= height) {
        target.x = rect.width - margin;
        target.y = margin + position;
      } else if ((position -= height) <= width) {
        target.x = rect.width - margin - position;
        target.y = rect.height - margin;
      } else {
        position -= width;
        target.x = margin;
        target.y = rect.height - margin - position;
      }

      target.element.style.left = `${target.x}px`;
      target.element.style.top = `${target.y}px`;
    }
  }

  playSpawnSound(type) {
    if (type === "blackhole") {
      this.audio.blackHole();
    }
  }

  spawn(type, group, options = {}) {
    if (this.state !== "playing" && this.state !== "tutorial") return;

    let size = Math.max(58, (window.innerWidth < 700 ? 82 : 94) - (this.level - 1) * 1.4);

    if (type === "hacker") size = Math.max(76, size * 1.18);
    if (type === "hero") size = Math.max(74, size * 1.14);
    
    if (type === "blackhole") {
      const scaleFactor = 1 + (this.level - 1) * 0.04;
      size = Math.min(135, Math.max(82, size * 1.26 * scaleFactor));
    }

    const rect = this.e.stage.getBoundingClientRect();
    let { x, y } = this.findSpawnPosition(size, rect);
    let cornerIndex = 0;

    if (type === "blackhole" && !options.spawnAt) {
      ({ x, y, cornerIndex } = this.findBlackHoleSpawnPosition(size, rect));
    }

    if (options.spawnAt) {
      const margin = size / 2 + 12;
      x = clamp(options.spawnAt.x, margin, rect.width - margin);
      y = clamp(options.spawnAt.y, margin, rect.height - margin);
    }

    const button = document.createElement("button");
    button.className = `target target--${type}`;
    if (type === "hacker" && options.isClone) {
      button.classList.add("is-hacker-clone");
    }

    button.type = "button";
    button.setAttribute("aria-label", type);
    button.style.setProperty("--target-size", `${size}px`);
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    if (type === "blackhole") {
      button.disabled = true;
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
        <span class="target__net-warning">CYBER NET</span>
      `;
    } else {
      button.innerHTML = `
        <span class="target__timer"></span>
        <span class="target__ring"></span>
        <span class="target__core"></span>
        <span class="target__rabbit">
          <span class="target__rabbit-ear target__rabbit-ear--left"></span>
          <span class="target__rabbit-ear target__rabbit-ear--right"></span>
          <span class="target__rabbit-head"></span>
          <span class="target__rabbit-eye"></span>
        </span>
      `;

      if (type === "life") button.insertAdjacentHTML("beforeend", `<span class="target__life-aura"></span><span class="target__life-plus">+1</span>`);
      else if (type === "decoy") button.insertAdjacentHTML("beforeend", `<span class="target__decoy-facets"></span><span class="target__decoy-ghost"><span class="target__decoy-ghost-ear target__decoy-ghost-ear--left"></span><span class="target__decoy-ghost-ear target__decoy-ghost-ear--right"></span><span class="target__decoy-ghost-head"></span></span><span class="target__decoy-split target__decoy-split--one"></span><span class="target__decoy-split target__decoy-split--two"></span>`);
      else if (type === "hacker") button.insertAdjacentHTML("beforeend", `<span class="target__hacker-code">#ERR_0x01</span><span class="target__hacker-mask"></span><span class="target__hacker-glitch target__hacker-glitch--one"></span><span class="target__hacker-glitch target__hacker-glitch--two"></span>`);
      else if (type === "hero") button.insertAdjacentHTML("beforeend", `<span class="target__whitehat-hat"></span><span class="target__whitehat-visor"></span><span class="target__whitehat-circuit"></span><span class="target__whitehat-shield"></span>`);
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
    this.playSpawnSound(type);

    requestAnimationFrame(() => button.classList.add("is-spawned"));

    const target = {
      element: button, type, group, life, maxLife: life, spawnAt, timerId, x, y, size,
      isClone: Boolean(options.isClone), cloneTimerId: null, cloneDueAt: 0, cloneRemaining: 0, cloneSpent: Boolean(options.isClone),
      portalTimerId: null, portalDueAt: 0, portalRemaining: 0, portalSpent: false, gravityTimerId: null,
      edgePosition: cornerIndex === 0 ? 0 : cornerIndex === 1 ? Math.max(1, rect.width - size - 36) : cornerIndex === 2 ? Math.max(1, rect.width - size - 36) + Math.max(1, rect.height - size - 36) : 2 * Math.max(1, rect.width - size - 36) + Math.max(1, rect.height - size - 36),
      edgeDirection: Math.random() < 0.5 ? -1 : 1,
    };

    this.targets.set(id, target);

    if (!this.isTutorial) {
      if (type === "hacker" && !target.isClone) this.startHackerCloneTimer(id, target, CONFIG.hackerCloneDelay);
      if (type === "blackhole") this.startBlackHoleSystems(id, target);
    }
  }

  startHackerCloneTimer(id, target, delay) {
    clearTimeout(target.cloneTimerId);
    target.cloneDueAt = performance.now() + delay;
    target.cloneTimerId = setTimeout(() => {
      target.cloneTimerId = null;
      target.cloneDueAt = 0;
      target.cloneSpent = true;
      if (this.state === "playing" && this.targets.has(id) && this.countGroup("hacker") < CONFIG.hackerMaxOnBoard) {
        this.spawn("hacker", "hacker", { isClone: true });
      }
    }, delay);
  }

  startBlackHoleSystems(id, target) {
    clearInterval(target.gravityTimerId);
    target.gravityTimerId = setInterval(() => this.applyBlackHoleGravity(id, target), CONFIG.blackHoleGravityRate);
  }

  applyBlackHoleGravity(blackHoleId, blackHole) {
    if (this.state !== "playing" || !this.targets.has(blackHoleId)) return;

    const dynamicRadius = Math.min(
      300,
      CONFIG.blackHoleBaseGravityRadius + (this.level - 1) * CONFIG.blackHoleGravityRadiusStep
    );

    for (const [id, target] of this.targets.entries()) {
      if (id === blackHoleId || target.type === "blackhole") continue;

      const dx = blackHole.x - target.x;
      const dy = blackHole.y - target.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= 1 || distance > dynamicRadius) {
        target.element.classList.remove("is-gravity-pulled");
        continue;
      }

      if (distance < 30) {
        clearTimeout(target.timerId);
        clearTimeout(target.cloneTimerId);
        clearTimeout(target.portalTimerId);
        clearInterval(target.gravityTimerId);

        this.targets.delete(id);
        target.element.classList.add("is-expiring");
        this.particles.burst(blackHole.x, blackHole.y, "#a855f7", 12);
        setTimeout(() => target.element.remove(), 180);
        continue;
      }

      const strength = CONFIG.blackHoleGravityStep * (1 - distance / dynamicRadius + 0.25);
      target.x += (dx / distance) * strength;
      target.y += (dy / distance) * strength;

      target.element.style.left = `${target.x}px`;
      target.element.style.top = `${target.y}px`;
      target.element.classList.add("is-gravity-pulled");
    }
  }

  clearGravityMarks() {
    for (const target of this.targets.values()) {
      target.element.classList.remove("is-gravity-pulled");
    }
  }

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
  
  /* BLACK HACKER — SYSTEM BREACH MOĆ IMPLEMENTACIJA */
  applySystemBreach() {
    this.audio.blackHacker();
    this.isVirusActive = true;
    this.e.stage.classList.add("is-virus");
    this.e.stars.classList.add("is-reverse");
    
    // Potres samo arene: HUD i kontrole ostaju mirni na mobilnom 9:16.
    this.e.stage.classList.remove("is-panic-impact");
    requestAnimationFrame(() => this.e.stage.classList.add("is-panic-impact"));
    setTimeout(() => this.e.stage.classList.remove("is-panic-impact"), 580);

    // Koruptovani HUD brojevi na 2 sekunde
    const symbols = ["#", "&", "$", "%", "@", "!", "*", "?", "X", "0"];
    clearInterval(this.hudCorruptInterval);
    this.hudCorruptInterval = setInterval(() => {
      this.e.score.textContent = Array.from({length: 8}, () => symbols[Math.floor(Math.random()*symbols.length)]).join("");
      this.e.time.textContent = Array.from({length: 4}, () => symbols[Math.floor(Math.random()*symbols.length)]).join("");
      this.e.lives.textContent = `${symbols[Math.floor(Math.random()*symbols.length)]}${symbols[Math.floor(Math.random()*symbols.length)]}/10`;
    }, 80);

    // Stvaranje dodatne Bezbojne zamke na terenu
    this.spawn("decoy", "hazard");

    clearTimeout(this.virusTimer);
    this.virusTimer = setTimeout(() => {
      clearInterval(this.hudCorruptInterval);
      this.hudCorruptInterval = null;
      this.isVirusActive = false;
      this.e.stage.classList.remove("is-virus");
      this.e.stars.classList.remove("is-reverse");
      this.update();
      if (this.state === "playing") this.setStatus("SYSTEM RECOVERED", "normal");
    }, CONFIG.hackerVirusDuration);
  }

  hit(id, type, button, x, y) {
    if (this.isTutorial) {
      const target = this.targets.get(id);
      clearTimeout(target?.timerId);
      clearTimeout(target?.cloneTimerId);
      clearTimeout(target?.portalTimerId);
      clearInterval(target?.gravityTimerId);

      const step = TUTORIAL_STEPS[this.tutorialCurrentIndex];
      if (step && step.action === "click") {
        button.remove();
        this.targets.delete(id);
        this.e.tutorialHud.classList.add("is-success");
        this.audio.hit();
        setTimeout(() => this.nextTutorialStep(), 300);
      } else {
        button.remove();
        this.targets.delete(id);
        this.e.tutorialHud.classList.add("is-error");
        this.audio.bad();

        if (type === "redrabbit") {
          this.effect("is-damaged");
          this.flash("GREŠKA!", "CRVENI IMPACT!", "#ff325f");
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
          this.applySystemBreach();
          this.flash("GRESKA!", "SYSTEM BREACH // CONTROL LOST!", "#ff38c7");
          this.particles.burst(x, y, "#ff38c7", 30);
        } else {
          this.flash("GRESKA!", "NE SMES KLIKNUTI OVU METU!", "#ff325f");
        }

        setTimeout(() => this.spawnTutorialStep(), 1650);
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
      this.audio.life();
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
      this.audio.bad();
      this.lives--;
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.decoyPenaltyTime);
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
      this.audio.red();
      this.score = Math.max(0, this.score - CONFIG.redPenaltyPoints);
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.redPenaltyTime);
      this.flash("RED RABBIT HIT!", `-${CONFIG.redPenaltyPoints} PTS / -${CONFIG.redPenaltyTime}s`, "#ff0033");
      this.effect("is-damaged");
      this.setStatus("CRITICAL ERROR!", "danger");
      this.particles.burst(x, y, "#ff0033", 35);
    } else if (type === "net") {
      this.audio.bad();
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.netPenaltyTime);
      this.applyCyberNetOverlay(CONFIG.netOverlayDuration);
      this.flash("CYBER NET!", `-${CONFIG.netPenaltyTime}s`, "#a855f7");
      this.effect("is-damaged");
      this.setStatus("NETWORK BLOCKED!", "warning");
      this.particles.burst(x, y, "#a855f7", 20);
    } else if (type === "hacker") {
      this.score = Math.max(0, this.score - CONFIG.hackerPenaltyPoints);
      this.applySystemBreach();
      this.flash("SYSTEM BREACH!", `-${CONFIG.hackerPenaltyPoints} PTS // CONTROL LOST`, "#ff38c7");
      this.setStatus("SYSTEM INFECTED", "danger");
      this.particles.burst(x, y, "#00f5ff", 22);
      this.particles.burst(x, y, "#ff38c7", 22);
    } else if (type === "hero") {
      this.audio.whiteHacker();
      this.hits++;
      this.advanceLevelProgress();
      this.applyAntiCheat(button, x, y);
      this.particles.burst(x, y, "#fff4dc", 24);
      this.particles.burst(x, y, "#ff7a00", 28);
    } else {
      this.hits++;
      this.advanceLevelProgress();

      let points = CONFIG.rabbitPoints;
      if (type === "golden") {
        this.audio.gold();
        points = CONFIG.goldenPoints;
      } else if (type === "freeze") {
        this.audio.freeze();
        points = CONFIG.freezePoints;
      } else {
        this.audio.hit();
      }

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

  advanceLevelProgress() {
    this.levelHits++;
    if (this.levelHits >= CONFIG.hitsPerLevel) this.levelUp();
  }

  applyTimeDistortion(scale, duration, className) {
    this.isFrozen = true;
    this.freezeScale = scale;
    this.freezeClass = className;
    this.e.stage.classList.remove("is-time-rush", "is-time-slow");
    this.e.stage.classList.add("is-frozen", className);
    clearTimeout(this.freezeTimer);

    this.freezeTimer = setTimeout(() => {
      this.isFrozen = false;
      this.freezeScale = 1;
      this.e.stage.classList.remove("is-frozen", "is-time-rush", "is-time-slow");
      this.freezeClass = "";
    }, duration);
  }

  applyMonochrome(duration) {
    this.isMonochrome = true;
    this.e.shell.classList.add("is-monochrome");
    clearTimeout(this.monoTimer);
    this.monoTimer = setTimeout(() => {
      this.isMonochrome = false;
      this.e.shell.classList.remove("is-monochrome");
    }, duration);
  }

  applyCyberNetOverlay(duration) {
    this.isNetOverlayActive = true;
    this.e.stage.classList.add("is-cyber-netted");
    clearTimeout(this.netOverlayTimer);
    this.netOverlayTimer = setTimeout(() => {
      this.isNetOverlayActive = false;
      this.e.stage.classList.remove("is-cyber-netted");
    }, duration);
  }

  purgeTargets(types, origin = null) {
    const allowed = new Set(types);
    for (const [id, target] of [...this.targets.entries()]) {
      if (!allowed.has(target.type)) continue;
      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);
      this.targets.delete(id);
      target.element.classList.add("is-anti-cheat-deleted");
      const rect = target.element.getBoundingClientRect();
      const stageRect = this.e.stage.getBoundingClientRect();
      const px = origin?.x ?? rect.left - stageRect.left + rect.width / 2;
      const py = origin?.y ?? rect.top - stageRect.top + rect.height / 2;
      const colors = { redrabbit: "#ff174f", decoy: "#ffffff", net: "#a855f7", hacker: "#ff38c7" };
      this.particles.burst(px, py, colors[target.type] || "#ffffff", 24);
      setTimeout(() => target.element.remove(), 580);
    }
  }

  applyAntiCheat(heroButton, fallbackX, fallbackY) {
    const stageRect = this.e.stage.getBoundingClientRect();
    const heroRect = heroButton.getBoundingClientRect();

    const originX = heroRect.width ? heroRect.left - stageRect.left + heroRect.width / 2 : fallbackX;
    const originY = heroRect.height ? heroRect.top - stageRect.top + heroRect.height / 2 : fallbackY;

    const wave = document.createElement("span");
    wave.className = "anti-cheat-wave";
    wave.style.left = `${originX}px`;
    wave.style.top = `${originY}px`;

    this.e.stage.appendChild(wave);
    this.e.stage.classList.remove("is-anti-cheat");

    requestAnimationFrame(() => this.e.stage.classList.add("is-anti-cheat"));

    clearTimeout(this.virusTimer);
    clearInterval(this.hudCorruptInterval);
    this.hudCorruptInterval = null;
    this.isVirusActive = false;

    this.e.stage.classList.remove("is-virus");
    this.e.stage.classList.remove("is-panic-impact");
    this.e.stars.classList.remove("is-reverse");

    this.purgeTargets(["decoy", "redrabbit", "net", "hacker"]);

    setTimeout(() => {
      wave.remove();
      this.e.stage.classList.remove("is-anti-cheat");
      this.update();
    }, CONFIG.antiCheatDuration);
  }

  miss(id) {
    if (!this.targets.has(id)) return;

    if (this.isTutorial) {
      const target = this.targets.get(id);
      this.targets.delete(id);
      target.element.remove();

      const step = TUTORIAL_STEPS[this.tutorialCurrentIndex];
      if (step && (step.action === "avoid" || step.action === "observe")) {
        this.e.tutorialHud.classList.add("is-success");
        this.audio.gold();
        this.nextTutorialStep();
      } else {
        this.spawnTutorialStep();
      }
      return;
    }

    if (this.state !== "playing") return;

    const target = this.targets.get(id);
    this.targets.delete(id);
    clearTimeout(target.cloneTimerId);
    clearTimeout(target.portalTimerId);
    clearInterval(target.gravityTimerId);

    if (target.type === "blackhole" && this.countGroup("blackhole") === 0) {
      this.clearGravityMarks();
    }

    target.element.classList.add("is-expiring");
    setTimeout(() => target.element.remove(), 180);

    if (target.type === "rabbit") {
      this.attempts++;
      this.lives--;
      this.audio.bad();
      this.flash("TARGET ESCAPED", "LIFE -1", "#ff325f");
      this.effect("is-damaged");
      this.setStatus("TARGET ESCAPED", "warning");

      if (this.lives <= 0) {
        this.finish();
        return;
      }
    } else if (target.type === "golden") {
      this.timeLeft = Math.max(0, this.timeLeft - CONFIG.goldenEscapePenalty);
      this.flash("GOLDEN SIGNAL LOST", `-${CONFIG.goldenEscapePenalty}s`, "#ffd34d");
    } else if (target.type === "freeze") {
      this.applyTimeDistortion(CONFIG.freezeEscapeScale, CONFIG.freezeEscapeDuration, "is-time-slow");
      this.flash("PLAVI SIGNAL ESCAPED", "TIME x0.5 / 3s", "#168bff");
    } else if (target.type === "life") {
      this.lives--;
      this.flash("LIFE SIGNAL LOST", "LIFE -1", "#55ff88");
      if (this.lives <= 0) {
        this.finish();
        return;
      }
    } else if (target.type === "redrabbit") {
      this.timeLeft += CONFIG.redEscapeBonus;
      this.flash("THREAT AVOIDED", `+${CONFIG.redEscapeBonus}s`, "#ff325f");
    } else if (target.type === "hero") {
      this.lives = Math.min(CONFIG.maxLives, this.lives + 1);
      this.timeLeft += CONFIG.heroEscapeTime;
      this.score += CONFIG.heroEscapePoints;
      this.flash("WHITE HACKER GIFT", `+1 LIFE / +${CONFIG.heroEscapeTime}s / +${CONFIG.heroEscapePoints}`, "#55ffbb");
    } else if (target.type === "net") {
      this.purgeTargets(["redrabbit", "hacker"]);
      this.flash("CYBER NET CLOSED", "THREATS CAPTURED", "#b166ff");
    }

    this.update();
  }

  emptyTap() {
    this.taps++;
    this.audio.bad();
    this.flash("MISS", "TARGET NOT FOUND", "#8fa3b8");
    this.update();
  }

  levelUp() {
    this.levelHits = 0;
    this.level++;

    if (this.music) this.music.setIntensity(this.level);

    this.audio.level();
    this.effect("is-level-up");
    this.flash(`LEVEL ${String(this.level).padStart(2, "0")}`, "RABBIT FLOW INCREASED!", "#ffd34d");
    this.setStatus("LEVEL ADVANCED", "normal");
  }

  removeAllTargets() {
    for (const target of this.targets.values()) {
      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);
      target.element.remove();
    }
    this.targets.clear();
  }

  pause() {
    if (this.state !== "playing") return;

    const now = performance.now();
    this.state = "paused";

    if (this.raf) cancelAnimationFrame(this.raf);

    if (this.music) {
      this.music.stopIntro();
      this.music.stop();
    }

    this.goodRemaining = this.goodDueAt ? Math.max(1, this.goodDueAt - now) : this.goodDelay();
    this.hazardRemaining = this.hazardDueAt ? Math.max(1, this.hazardDueAt - now) : this.hazardDelay();
    this.hackerRemaining = this.hackerDueAt ? Math.max(1, this.hackerDueAt - now) : this.hackerDelay();
    this.heroRemaining = this.heroDueAt ? Math.max(1, this.heroDueAt - now) : this.heroDelay();
    this.blackHoleRemaining = this.blackHoleDueAt ? Math.max(1, this.blackHoleDueAt - now) : this.blackHoleDelay();

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    for (const target of this.targets.values()) {
      clearTimeout(target.timerId);
      clearTimeout(target.cloneTimerId);
      clearTimeout(target.portalTimerId);
      clearInterval(target.gravityTimerId);
      target.remaining = Math.max(1, this.targetRemaining(target, now));
    }

    this.e.layer.getAnimations({ subtree: true }).forEach((anim) => anim.pause());
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

    if (this.music) this.music.start();

    for (const [id, target] of this.targets.entries()) {
      const remaining = Math.max(1, target.remaining ?? target.life);
      target.life = remaining;
      target.spawnAt = now;
      target.timerId = setTimeout(() => this.miss(id), remaining);
      if (target.type === "blackhole") this.startBlackHoleSystems(id, target);
    }

    this.e.layer.getAnimations({ subtree: true }).forEach((anim) => anim.play());
    this.raf = requestAnimationFrame((time) => this.loop(time));

    this.scheduleGood(Math.max(1, this.goodRemaining || this.goodDelay()));
    this.scheduleHazard(Math.max(1, this.hazardRemaining || this.hazardDelay()));
    this.scheduleHacker(Math.max(1, this.hackerRemaining || this.hackerDelay()));
    this.scheduleHero(Math.max(1, this.heroRemaining || this.heroDelay()));
    this.scheduleBlackHole(Math.max(1, this.blackHoleRemaining || this.blackHoleDelay()));

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

    if (this.music) {
      this.music.stopIntro();
      this.music.stop();
    }

    clearTimeout(this.goodSpawnTimer);
    clearTimeout(this.hazardSpawnTimer);
    clearTimeout(this.hackerSpawnTimer);
    clearTimeout(this.heroSpawnTimer);
    clearTimeout(this.blackHoleSpawnTimer);

    for (const target of this.targets.values()) {
      target.element.classList.add("is-void-pulled");
    }
    this.e.stage.classList.add("is-void-collapsing");

    setTimeout(() => {
      this.removeAllTargets();
      this.e.pause.disabled = true;

      const record = this.score > this.best;
      if (record) {
        this.best = this.score;
        localStorage.setItem(CONFIG.bestKey, String(this.best));
      }

      const accuracy = this.attempts ? Math.round((this.hits / this.attempts) * 100) : 0;

      this.e.finalScore.textContent = pad(this.score);
      this.e.finalBest.textContent = pad(this.best);
      this.e.finalLevel.textContent = String(this.level).padStart(2, "0");
      this.e.finalAcc.textContent = `${accuracy}%`;
      this.e.rank.textContent = this.rank();

      this.e.record.classList.toggle("is-visible", record);
      this.update();
      this.e.stage.classList.remove("is-void-collapsing");
      this.show(this.e.overO, true);

      this.setStatus("SESSION COMPLETE", "danger");
      this.audio.over();
    }, 1100);
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
    if (this.hudCorruptInterval) return; // Ne pregazi koruptovane simbole dok traje System Breach
    this.e.score.textContent = pad(this.score);
    this.e.best.textContent = pad(this.best);
    this.e.level.textContent = String(this.level).padStart(2, "0");
    this.e.time.textContent = this.timeLeft.toFixed(1);
    this.e.lives.textContent = `${String(this.lives).padStart(2, "0")}/${String(CONFIG.maxLives).padStart(2, "0")}`;

    this.e.timeCard.classList.toggle("is-critical", this.timeLeft <= 8);
    this.e.lives.closest(".hud-card--lives")?.classList.toggle("is-critical", this.lives <= 1);

    this.e.progressText.textContent = `${this.levelHits} / ${CONFIG.hitsPerLevel}`;
    this.e.progressFill.style.width = `${(this.levelHits / CONFIG.hitsPerLevel) * 100}%`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    new Game();
  } catch (error) {
    console.error(error);
    alert("Igra nije mogla da se pokrene. Proveri da li su index.html, style.css i script.js u istom folderu.");
  }
});
