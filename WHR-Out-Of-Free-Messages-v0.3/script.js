"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const $ = (selector) => document.querySelector(selector);

const TAU = Math.PI * 2;

const clamp = (value, minimum, maximum) => {
  return Math.max(minimum, Math.min(maximum, value));
};

const random = (minimum, maximum) => {
  return minimum + Math.random() * (maximum - minimum);
};

const distance = (a, b) => {
  return Math.hypot(a.x - b.x, a.y - b.y);
};

/* =========================================================
   GAME STATE
========================================================= */

const game = {
  running: false,
  paused: false,

  lastTime: 0,
  width: 0,
  height: 0,
  dpr: 1,
  time: 0,

  level: 1,
  score: 0,
  combo: 0,
  comboClock: 0,

  shake: 0,
  flash: 0,
  flashFull: true,
  sound: true,

  spawnClock: 0,
  enemiesRemaining: 12,
  bossActive: false,

  keys: {},

  mouse: {
    x: 0,
    y: 0,
    down: false
  },

  move: {
    x: 0,
    y: 0
  },

  aim: {
    x: 1,
    y: 0,
    fire: false
  },

  bullets: [],
  enemyBullets: [],
  enemies: [],
  particles: [],
  texts: [],
  powerups: [],

  player: null,
  audioContext: null
};

/* =========================================================
   CLOSE BOX SCENES
========================================================= */

const scenes = [
  {
    name: "BLUEPRINT LAB",
    colorA: "#071b31",
    colorB: "#12305e",
    grid: "#26dfff"
  },
  {
    name: "WHAT THE FLOWER",
    colorA: "#180b29",
    colorB: "#4c174d",
    grid: "#ff42bc"
  },
  {
    name: "ZERO-G OFFICE",
    colorA: "#061525",
    colorB: "#123d47",
    grid: "#4dffbd"
  },
  {
    name: "MOON DEBUG",
    colorA: "#0d1020",
    colorB: "#343b59",
    grid: "#b7c7ff"
  },
  {
    name: "PAYWALL CORE",
    colorA: "#250713",
    colorB: "#5a1428",
    grid: "#ff4a65"
  }
];

/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {
  game.dpr = Math.min(
    2,
    window.devicePixelRatio || 1
  );

  game.width = window.innerWidth;
  game.height = window.innerHeight;

  canvas.width = game.width * game.dpr;
  canvas.height = game.height * game.dpr;

  ctx.setTransform(
    game.dpr,
    0,
    0,
    game.dpr,
    0,
    0
  );
}

window.addEventListener(
  "resize",
  resizeCanvas
);

resizeCanvas();

/* =========================================================
   PLAYER
========================================================= */

function createPlayer() {
  return {
    x: game.width * 0.5,
    y: game.height * 0.72,

    vx: 0,
    vy: 0,

    radius: 18,
    hp: 100,
    invincible: 0,

    jumpHeight: 0,
    jumpVelocity: 0,
    jumpsUsed: 0,

    jetTime: 0,
    fireCooldown: 0,

    specialAmmo: 3,
    facing: 0
  };
}

/* =========================================================
   RESET
========================================================= */

function resetGame() {
  game.running = true;
  game.paused = false;

  game.lastTime = performance.now();
  game.time = 0;

  game.level = 1;
  game.score = 0;
  game.combo = 0;
  game.comboClock = 0;

  game.shake = 0;
  game.flash = 0;

  game.spawnClock = 0;
  game.enemiesRemaining = 12;
  game.bossActive = false;

  game.bullets = [];
  game.enemyBullets = [];
  game.enemies = [];
  game.particles = [];
  game.texts = [];
  game.powerups = [];

  game.player = createPlayer();

  updateHUD();
}

/* =========================================================
   SOUND
========================================================= */

function activateAudio() {
  if (!game.audioContext) {
    game.audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (
    game.audioContext.state === "suspended"
  ) {
    game.audioContext.resume();
  }
}

function playSound(type = "laser", pan = 0) {
  if (!game.sound) {
    return;
  }

  activateAudio();

  const audioContext = game.audioContext;
  const startTime = audioContext.currentTime;

  const gain = audioContext.createGain();
  const stereo = audioContext.createStereoPanner();
  const oscillator = audioContext.createOscillator();

  stereo.pan.value = clamp(pan, -1, 1);

  oscillator
    .connect(gain)
    .connect(stereo)
    .connect(audioContext.destination);

  if (type === "laser") {
    oscillator.type = "sawtooth";

    oscillator.frequency.setValueAtTime(
      850,
      startTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      190,
      startTime + 0.09
    );

    gain.gain.setValueAtTime(
      0.07,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + 0.1
    );
  } else if (type === "boom") {
    oscillator.type = "square";

    oscillator.frequency.setValueAtTime(
      95,
      startTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      28,
      startTime + 0.28
    );

    gain.gain.setValueAtTime(
      0.18,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + 0.3
    );
  } else {
    oscillator.type = "triangle";

    oscillator.frequency.setValueAtTime(
      440,
      startTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      90,
      startTime + 0.18
    );

    gain.gain.setValueAtTime(
      0.1,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + 0.2
    );
  }

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.31);
}

/* =========================================================
   VISUAL EFFECTS
========================================================= */

function createText(
  x,
  y,
  text,
  color = "#ffffff",
  size = 20
) {
  game.texts.push({
    x,
    y,
    text,
    color,
    size,
    life: 1
  });
}

function createBurst(
  x,
  y,
  color,
  amount = 14,
  power = 170
) {
  for (
    let index = 0;
    index < amount;
    index += 1
  ) {
    const angle =
      Math.random() * TAU;

    const velocity =
      random(30, power);

    game.particles.push({
      x,
      y,

      vx:
        Math.cos(angle) *
        velocity,

      vy:
        Math.sin(angle) *
        velocity,

      radius:
        random(1, 5),

      color,

      life:
        random(0.25, 0.8)
    });
  }
}

/* =========================================================
   BASIC WEAPON
========================================================= */

function shoot() {
  const player = game.player;

  if (player.fireCooldown > 0) {
    return;
  }

  player.fireCooldown = 0.085;

  const angle = Math.atan2(
    game.aim.y,
    game.aim.x
  );

  player.facing = angle;

  game.bullets.push({
    x:
      player.x +
      Math.cos(angle) * 24,

    y:
      player.y -
      player.jumpHeight +
      Math.sin(angle) * 24,

    vx:
      Math.cos(angle) * 720,

    vy:
      Math.sin(angle) * 720,

    radius: 4,
    life: 1.1,
    damage: 12,
    color: "#28edff",
    rocket: false
  });

  playSound(
    "laser",
    player.x / game.width * 2 - 1
  );

  createBurst(
    player.x + Math.cos(angle) * 25,
    player.y -
      player.jumpHeight +
      Math.sin(angle) * 25,
    "#8affff",
    3,
    70
  );
}

/* =========================================================
   DUPLA BAZUKA
========================================================= */

function fireSpecialWeapon() {
  const player = game.player;

  if (
    !game.running ||
    game.paused ||
    player.specialAmmo <= 0
  ) {
    return;
  }

  player.specialAmmo -= 1;

  game.flash = 1;
  game.shake = 18;

  playSound("boom");

  createText(
    player.x,
    player.y -
      player.jumpHeight -
      35,
    "DUPLA BAZUKA!",
    "#ffde5b",
    26
  );

  for (
    let direction = -1;
    direction <= 1;
    direction += 2
  ) {
    const angle =
      player.facing +
      direction * 0.12;

    game.bullets.push({
      x: player.x,
      y:
        player.y -
        player.jumpHeight,

      vx:
        Math.cos(angle) * 430,

      vy:
        Math.sin(angle) * 430,

      radius: 12,
      life: 1.8,
      damage: 48,
      color: "#ff49ad",
      rocket: true
    });
  }

  if (navigator.vibrate) {
    navigator.vibrate([
      35,
      25,
      70
    ]);
  }

  updateHUD();
}

/* =========================================================
   HOP AND DOUBLE HOP
========================================================= */

function hop() {
  const player = game.player;

  if (
    !game.running ||
    game.paused ||
    player.jumpsUsed >= 2
  ) {
    return;
  }

  if (player.jumpsUsed === 0) {
    player.jumpVelocity = 420;
  } else {
    player.jumpVelocity = 355;
  }

  player.jumpsUsed += 1;

  createText(
    player.x,
    player.y -
      player.jumpHeight -
      25,

    player.jumpsUsed === 1
      ? "HOP!"
      : "HOP-HOP!",

    player.jumpsUsed === 1
      ? "#ffffff"
      : "#30edff",

    18
  );

  createBurst(
    player.x,
    player.y,
    "#bdfaff",
    8,
    100
  );

  playSound("hop");
}

/* =========================================================
   ENEMIES
========================================================= */

function spawnEnemy() {
  const side =
    Math.floor(Math.random() * 4);

  const padding = 48;

  let x;
  let y;

  if (side === 0) {
    x = random(
      padding,
      game.width - padding
    );

    y = 80;
  } else if (side === 1) {
    x = game.width - padding;

    y = random(
      90,
      game.height - padding
    );
  } else if (side === 2) {
    x = random(
      padding,
      game.width - padding
    );

    y = game.height - padding;
  } else {
    x = padding;

    y = random(
      90,
      game.height - padding
    );
  }

  const elite =
    Math.random() <
    0.16 +
    game.level * 0.02;

  const hp = elite
    ? 55
    : 24;

  game.enemies.push({
    x,
    y,

    vx: 0,
    vy: 0,

    radius:
      elite ? 22 : 15,

    hp,
    maxHp: hp,

    speed:
      random(42, 76) +
      game.level * 6,

    fireCooldown:
      random(0.7, 1.8),

    color:
      elite
        ? "#ff3eaa"
        : "#ff4968",

    elite,
    boss: false,

    phase:
      Math.random() * TAU
  });

  game.enemiesRemaining -= 1;
}

/* =========================================================
   BOSS
========================================================= */

function spawnBoss() {
  game.bossActive = true;

  const hp =
    450 +
    game.level * 80;

  game.enemies.push({
    x: game.width * 0.5,
    y: 120,

    vx: 0,
    vy: 0,

    radius: 58,

    hp,
    maxHp: hp,

    speed: 28,
    fireCooldown: 0.25,

    color: "#ff245d",

    elite: false,
    boss: true,
    phase: 0
  });

  createText(
    game.width * 0.5,
    game.height * 0.42,
    "TROGLAVI SUBSCRIPTION PAYWALL",
    "#ff4769",
    28
  );

  game.flash = 1;

  playSound("boom");
}

/* =========================================================
   JET POWER-UP
========================================================= */

function dropJetPowerup() {
  game.powerups.push({
    x:
      random(
        100,
        game.width - 100
      ),

    y:
      random(
        120,
        game.height - 100
      ),

    radius: 16,
    type: "jet",
    life: 10,
    phase: 0
  });

  createText(
    game.width * 0.5,
    100,
    "JET POWER-UP DETECTED",
    "#35edff",
    20
  );
}

/* =========================================================
   NEXT LEVEL
========================================================= */

function nextLevel() {
  game.level += 1;
  game.enemiesRemaining =
    10 + game.level * 3;

  game.bossActive = false;

  game.enemyBullets = [];
  game.powerups = [];

  game.player.x =
    game.width * 0.5;

  game.player.y =
    game.height * 0.72;

  game.player.hp =
    Math.min(
      100,
      game.player.hp + 25
    );

  game.player.specialAmmo =
    Math.min(
      5,
      game.player.specialAmmo + 1
    );

  game.flash = 1;

  const scene =
    scenes[
      (game.level - 1) %
      scenes.length
    ];

  createText(
    game.width * 0.5,
    game.height * 0.45,
    `LEVEL ${game.level} // ${scene.name}`,
    "#ffffff",
    30
  );

  updateHUD();
}

/* =========================================================
   ENEMY DAMAGE
========================================================= */

function hitEnemy(bullet, enemy) {
  enemy.hp -= bullet.damage;
  bullet.life = 0;

  createBurst(
    bullet.x,
    bullet.y,
    bullet.color,
    bullet.rocket ? 18 : 5,
    bullet.rocket ? 230 : 100
  );

  if (bullet.rocket) {
    game.shake = 14;
    game.flash = 0.7;

    playSound("boom");
  }

  if (enemy.hp > 0) {
    return;
  }

  if (enemy.boss) {
    game.score += 5000;
  } else if (enemy.elite) {
    game.score += 350;
  } else {
    game.score += 120;
  }

  game.combo += 1;
  game.comboClock = 2.5;

  createBurst(
    enemy.x,
    enemy.y,
    enemy.color,
    enemy.boss ? 80 : 22,
    enemy.boss ? 350 : 210
  );

  playSound(
    "boom",
    enemy.x / game.width * 2 - 1
  );

  let finishingText = "TRAS!";

  if (enemy.boss) {
    finishingText = "FEJTALITI!";
  } else if (
    game.combo % 10 === 0
  ) {
    finishingText = "BRUTALITI!";
  }

  createText(
    enemy.x,
    enemy.y,

    finishingText,

    enemy.boss
      ? "#ffe45f"
      : "#ffffff",

    enemy.boss
      ? 42
      : 18
  );

  game.shake =
    enemy.boss ? 25 : 8;

  game.flash =
    enemy.boss ? 1 : 0.35;

  if (enemy.boss) {
    setTimeout(
      nextLevel,
      1600
    );
  } else if (
    Math.random() < 0.09
  ) {
    dropJetPowerup();
  }

  updateHUD();
}

/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(damage) {
  const player = game.player;

  if (player.invincible > 0) {
    return;
  }

  player.hp -= damage;
  player.invincible = 0.8;

  game.combo = 0;
  game.shake = 12;
  game.flash = 0.5;

  playSound("boom");

  if (navigator.vibrate) {
    navigator.vibrate(60);
  }

  if (player.hp <= 0) {
    gameOver();
  }

  updateHUD();
}

/* =========================================================
   UPDATE
========================================================= */

function update(deltaTime) {
  const player = game.player;

  game.time += deltaTime;

  player.invincible = Math.max(
    0,
    player.invincible - deltaTime
  );

  player.fireCooldown = Math.max(
    0,
    player.fireCooldown - deltaTime
  );

  game.comboClock -= deltaTime;

  if (game.comboClock <= 0) {
    game.combo = 0;
  }

  updatePlayerMovement(
    player,
    deltaTime
  );

  updatePlayerJump(
    player,
    deltaTime
  );

  updatePlayerJet(
    player,
    deltaTime
  );

  if (
    (
      game.aim.fire ||
      game.mouse.down
    ) &&
    Math.hypot(
      game.aim.x,
      game.aim.y
    ) > 0.15
  ) {
    shoot();
  }

  updateEnemySpawning(
    deltaTime
  );

  updateEnemies(
    player,
    deltaTime
  );

  updatePlayerBullets(
    deltaTime
  );

  updateEnemyBullets(
    player,
    deltaTime
  );

  updatePowerups(
    player,
    deltaTime
  );

  updateEffects(
    deltaTime
  );

  removeInactiveObjects();

  game.shake *= 0.88;

  game.flash = Math.max(
    0,
    game.flash - deltaTime * 4
  );

  updateHUD();
}

/* =========================================================
   MOVEMENT
========================================================= */

function updatePlayerMovement(
  player,
  deltaTime
) {
  let moveX = game.move.x;
  let moveY = game.move.y;

  if (
    game.keys.KeyA ||
    game.keys.ArrowLeft
  ) {
    moveX = -1;
  }

  if (
    game.keys.KeyD ||
    game.keys.ArrowRight
  ) {
    moveX = 1;
  }

  if (
    game.keys.KeyW ||
    game.keys.ArrowUp
  ) {
    moveY = -1;
  }

  if (
    game.keys.KeyS ||
    game.keys.ArrowDown
  ) {
    moveY = 1;
  }

  const movementLength =
    Math.hypot(
      moveX,
      moveY
    ) || 1;

  const targetVelocityX =
    moveX /
    movementLength *
    275;

  const targetVelocityY =
    moveY /
    movementLength *
    275;

  const response =
    Math.min(
      1,
      deltaTime * 10
    );

  player.vx +=
    (
      targetVelocityX -
      player.vx
    ) *
    response;

  player.vy +=
    (
      targetVelocityY -
      player.vy
    ) *
    response;

  player.x = clamp(
    player.x +
    player.vx *
    deltaTime,

    30,
    game.width - 30
  );

  player.y = clamp(
    player.y +
    player.vy *
    deltaTime,

    92,
    game.height - 28
  );
}

/* =========================================================
   JUMP
========================================================= */

function updatePlayerJump(
  player,
  deltaTime
) {
  player.jumpHeight +=
    player.jumpVelocity *
    deltaTime;

  player.jumpVelocity -=
    900 *
    deltaTime;

  if (player.jumpHeight <= 0) {
    player.jumpHeight = 0;
    player.jumpVelocity = 0;
    player.jumpsUsed = 0;
  }
}

/* =========================================================
   JET
========================================================= */

function updatePlayerJet(
  player,
  deltaTime
) {
  if (player.jetTime <= 0) {
    return;
  }

  player.jetTime -= deltaTime;

  player.jumpHeight =
    Math.max(
      45,
      player.jumpHeight
    );

  player.jumpVelocity =
    Math.max(
      -40,
      player.jumpVelocity
    );

  player.x = clamp(
    player.x +
    game.move.x *
    90 *
    deltaTime,

    25,
    game.width - 25
  );

  player.y = clamp(
    player.y +
    game.move.y *
    90 *
    deltaTime,

    90,
    game.height - 25
  );
}

/* =========================================================
   ENEMY SPAWNING
========================================================= */

function updateEnemySpawning(
  deltaTime
) {
  game.spawnClock -= deltaTime;

  if (
    game.spawnClock <= 0 &&
    game.enemiesRemaining > 0
  ) {
    spawnEnemy();

    game.spawnClock =
      Math.max(
        0.2,
        1 - game.level * 0.07
      );
  }

  if (
    game.enemiesRemaining <= 0 &&
    game.enemies.length === 0 &&
    !game.bossActive
  ) {
    spawnBoss();
  }
}

/* =========================================================
   ENEMY UPDATE
========================================================= */

function updateEnemies(
  player,
  deltaTime
) {
  game.enemies.forEach((enemy) => {
    const directionX =
      player.x - enemy.x;

    const directionY =
      player.y - enemy.y;

    const directionLength =
      Math.hypot(
        directionX,
        directionY
      ) || 1;

    enemy.phase += deltaTime;

    enemy.vx =
      directionX /
      directionLength *
      enemy.speed;

    enemy.vy =
      directionY /
      directionLength *
      enemy.speed;

    enemy.x +=
      enemy.vx *
      deltaTime;

    enemy.y +=
      enemy.vy *
      deltaTime;

    enemy.fireCooldown -=
      deltaTime;

    if (
      enemy.fireCooldown <= 0
    ) {
      let angle =
        Math.atan2(
          directionY,
          directionX
        );

      if (enemy.boss) {
        angle += random(
          -0.7,
          0.7
        );
      } else {
        angle += random(
          -0.15,
          0.15
        );
      }

      const projectileSpeed =
        enemy.boss ? 260 : 185;

      game.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,

        vx:
          Math.cos(angle) *
          projectileSpeed,

        vy:
          Math.sin(angle) *
          projectileSpeed,

        radius:
          enemy.boss ? 7 : 5,

        life: 4,

        color:
          enemy.boss
            ? "#ffca45"
            : "#ff516d"
      });

      enemy.fireCooldown =
        enemy.boss
          ? 0.3
          : random(1.1, 2.2);
    }

    if (
      distance(player, enemy) <
      player.radius +
      enemy.radius &&
      player.jumpHeight < 18
    ) {
      damagePlayer(
        enemy.boss ? 22 : 12
      );
    }
  });
}

/* =========================================================
   PLAYER BULLETS
========================================================= */

function updatePlayerBullets(
  deltaTime
) {
  game.bullets.forEach((bullet) => {
    bullet.x +=
      bullet.vx *
      deltaTime;

    bullet.y +=
      bullet.vy *
      deltaTime;

    bullet.life -= deltaTime;

    game.enemies.forEach((enemy) => {
      if (
        enemy.hp > 0 &&
        bullet.life > 0 &&
        distance(
          bullet,
          enemy
        ) <
        bullet.radius +
        enemy.radius
      ) {
        hitEnemy(
          bullet,
          enemy
        );
      }
    });
  });
}

/* =========================================================
   ENEMY BULLETS
========================================================= */

function updateEnemyBullets(
  player,
  deltaTime
) {
  game.enemyBullets.forEach(
    (bullet) => {
      bullet.x +=
        bullet.vx *
        deltaTime;

      bullet.y +=
        bullet.vy *
        deltaTime;

      bullet.life -= deltaTime;

      if (
        distance(
          bullet,
          player
        ) <
        bullet.radius +
        player.radius &&
        player.jumpHeight < 22
      ) {
        bullet.life = 0;

        damagePlayer(9);
      }
    }
  );
}

/* =========================================================
   POWER-UPS
========================================================= */

function updatePowerups(
  player,
  deltaTime
) {
  game.powerups.forEach(
    (powerup) => {
      powerup.life -= deltaTime;
      powerup.phase += deltaTime;

      if (
        distance(
          powerup,
          player
        ) <
        powerup.radius +
        player.radius
      ) {
        powerup.life = 0;
        player.jetTime = 5;

        game.flash = 0.8;

        createText(
          player.x,
          player.y -
          player.jumpHeight -
          35,

          "LETEĆI ZEC!",

          "#39efff",
          28
        );

        playSound("hop");
      }
    }
  );
}

/* =========================================================
   EFFECT UPDATE
========================================================= */

function updateEffects(
  deltaTime
) {
  game.particles.forEach(
    (particle) => {
      particle.x +=
        particle.vx *
        deltaTime;

      particle.y +=
        particle.vy *
        deltaTime;

      particle.vx *= 0.97;
      particle.vy *= 0.97;

      particle.life -= deltaTime;
    }
  );

  game.texts.forEach((text) => {
    text.y -= 28 * deltaTime;
    text.life -= deltaTime;
  });
}

/* =========================================================
   CLEANUP
========================================================= */

function removeInactiveObjects() {
  game.enemies =
    game.enemies.filter(
      (enemy) => enemy.hp > 0
    );

  game.bullets =
    game.bullets.filter(
      (bullet) => bullet.life > 0
    );

  game.enemyBullets =
    game.enemyBullets.filter(
      (bullet) => bullet.life > 0
    );

  game.powerups =
    game.powerups.filter(
      (powerup) => powerup.life > 0
    );

  game.particles =
    game.particles.filter(
      (particle) => particle.life > 0
    );

  game.texts =
    game.texts.filter(
      (text) => text.life > 0
    );
}

/* =========================================================
   DRAW SCENE
========================================================= */

function drawScene() {
  const scene =
    scenes[
      (game.level - 1) %
      scenes.length
    ];

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      game.width,
      game.height
    );

  gradient.addColorStop(
    0,
    scene.colorA
  );

  gradient.addColorStop(
    1,
    scene.colorB
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    game.width,
    game.height
  );

  ctx.strokeStyle =
    scene.grid + "22";

  ctx.lineWidth = 1;

  for (
    let x = 0;
    x < game.width;
    x += 48
  ) {
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x, game.height);
    ctx.stroke();
  }

  for (
    let y = 80;
    y < game.height;
    y += 48
  ) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(game.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle =
    scene.grid + "99";

  ctx.lineWidth = 3;

  ctx.strokeRect(
    8,
    70,
    game.width - 16,
    game.height - 78
  );

  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const x =
      (
        index * 173 +
        game.time * 12
      ) %
      (
        game.width + 100
      ) -
      50;

    const y =
      110 +
      (
        index * 97
      ) %
      (
        game.height - 150
      );

    ctx.fillStyle =
      scene.grid + "22";

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      18 +
      10 *
      Math.sin(
        game.time +
        index
      ),
      0,
      TAU
    );

    ctx.fill();
  }

  ctx.fillStyle = scene.grid;
  ctx.font = "700 12px system-ui";
  ctx.textAlign = "left";

  ctx.fillText(
    `SCENA ${String(game.level).padStart(2, "0")} // ${scene.name}`,
    20,
    90
  );
}

/* =========================================================
   DRAW CIRCLE
========================================================= */

function drawCircle(
  object,
  color,
  radius = object.radius
) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  ctx.beginPath();

  ctx.arc(
    object.x,
    object.y,
    radius,
    0,
    TAU
  );

  ctx.fill();

  ctx.shadowBlur = 0;
}

/* =========================================================
   DRAW POWER-UPS
========================================================= */

function drawPowerups() {
  game.powerups.forEach(
    (powerup) => {
      ctx.save();

      ctx.translate(
        powerup.x,
        powerup.y
      );

      ctx.rotate(
        powerup.phase * 3
      );

      ctx.strokeStyle = "#36efff";
      ctx.lineWidth = 4;

      ctx.strokeRect(
        -12,
        -12,
        24,
        24
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 10px system-ui";
      ctx.textAlign = "left";

      ctx.fillText(
        "JET",
        -10,
        4
      );

      ctx.restore();
    }
  );
}

/* =========================================================
   DRAW BULLETS
========================================================= */

function drawBullets() {
  game.bullets.forEach((bullet) => {
    drawCircle(
      bullet,
      bullet.color
    );

    ctx.strokeStyle = bullet.color;

    ctx.lineWidth =
      bullet.rocket ? 8 : 2;

    ctx.beginPath();

    ctx.moveTo(
      bullet.x,
      bullet.y
    );

    ctx.lineTo(
      bullet.x -
      bullet.vx * 0.035,

      bullet.y -
      bullet.vy * 0.035
    );

    ctx.stroke();
  });

  game.enemyBullets.forEach(
    (bullet) => {
      drawCircle(
        bullet,
        bullet.color
      );
    }
  );
}

/* =========================================================
   DRAW ENEMIES
========================================================= */

function drawEnemies() {
  game.enemies.forEach((enemy) => {
    drawCircle(
      enemy,
      enemy.color
    );

    ctx.fillStyle = "#08040a";

    ctx.font =
      `900 ${
        enemy.boss ? 24 : 12
      }px system-ui`;

    ctx.textAlign = "center";

    ctx.fillText(
      enemy.boss ? "$" : "BUG",
      enemy.x,
      enemy.y + 4
    );

    ctx.fillStyle = "#160814";

    ctx.fillRect(
      enemy.x -
      enemy.radius,

      enemy.y -
      enemy.radius -
      10,

      enemy.radius * 2,
      4
    );

    ctx.fillStyle = "#53ff9e";

    ctx.fillRect(
      enemy.x -
      enemy.radius,

      enemy.y -
      enemy.radius -
      10,

      enemy.radius *
      2 *
      (
        enemy.hp /
        enemy.maxHp
      ),

      4
    );
  });
}

/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {
  const player = game.player;

  ctx.save();

  if (
    player.invincible > 0 &&
    Math.floor(
      player.invincible * 16
    ) %
    2
  ) {
    ctx.globalAlpha = 0.25;
  }

  ctx.translate(
    player.x,
    player.y -
    player.jumpHeight
  );

  ctx.rotate(
    player.facing
  );

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 20;

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    20,
    15,
    0,
    0,
    TAU
  );

  ctx.fill();

  ctx.beginPath();

  ctx.ellipse(
    -8,
    -21,
    6,
    18,
    -0.18,
    0,
    TAU
  );

  ctx.ellipse(
    8,
    -21,
    6,
    18,
    0.18,
    0,
    TAU
  );

  ctx.fill();

  ctx.fillStyle = "#1b2836";

  ctx.fillRect(
    8,
    -4,
    26,
    8
  );

  ctx.fillStyle = "#2af0ff";

  ctx.fillRect(
    31,
    -3,
    10,
    6
  );

  if (player.jetTime > 0) {
    ctx.fillStyle = "#ff48b2";

    ctx.beginPath();

    ctx.moveTo(
      -18,
      4
    );

    ctx.lineTo(
      -45 +
      random(-8, 8),
      0
    );

    ctx.lineTo(
      -18,
      -4
    );

    ctx.fill();
  }

  ctx.restore();

  if (player.jumpHeight > 0) {
    ctx.strokeStyle = "#ffffff22";

    ctx.beginPath();

    ctx.ellipse(
      player.x,
      player.y,
      20,
      7,
      0,
      0,
      TAU
    );

    ctx.stroke();
  }
}

/* =========================================================
   DRAW EFFECTS
========================================================= */

function drawEffects() {
  game.particles.forEach(
    (particle) => {
      ctx.globalAlpha = clamp(
        particle.life * 2,
        0,
        1
      );

      drawCircle(
        particle,
        particle.color,
        particle.radius
      );
    }
  );

  ctx.globalAlpha = 1;
  ctx.textAlign = "center";

  game.texts.forEach((text) => {
    ctx.globalAlpha = clamp(
      text.life,
      0,
      1
    );

    ctx.fillStyle = text.color;
    ctx.shadowColor = text.color;
    ctx.shadowBlur = 14;

    ctx.font =
      `900 ${text.size}px system-ui`;

    ctx.fillText(
      text.text,
      text.x,
      text.y
    );
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

/* =========================================================
   MAIN DRAW
========================================================= */

function draw() {
  ctx.save();

  const shakeX =
    random(
      -game.shake,
      game.shake
    );

  const shakeY =
    random(
      -game.shake,
      game.shake
    );

  ctx.translate(
    shakeX,
    shakeY
  );

  drawScene();
  drawPowerups();
  drawBullets();
  drawEnemies();
  drawPlayer();
  drawEffects();

  ctx.restore();

  ctx.globalAlpha = 1;

  if (game.flash > 0) {
    const strength =
      game.flashFull
        ? 0.52
        : 0.12;

    ctx.fillStyle =
      `rgba(255,255,255,${
        game.flash *
        strength
      })`;

    ctx.fillRect(
      0,
      0,
      game.width,
      game.height
    );
  }
}

/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(currentTime) {
  const deltaTime =
    Math.min(
      0.033,
      (
        currentTime -
        game.lastTime
      ) /
      1000 ||
      0
    );

  game.lastTime =
    currentTime;

  if (
    game.running &&
    !game.paused
  ) {
    update(deltaTime);
  }

  draw();

  requestAnimationFrame(
    gameLoop
  );
}

requestAnimationFrame(
  gameLoop
);

/* =========================================================
   HUD
========================================================= */

function updateHUD() {
  const player =
    game.player || {
      hp: 100,
      jetTime: 0,
      specialAmmo: 0
    };

  $("#levelHud").textContent =
    String(
      game.level
    ).padStart(
      2,
      "0"
    );

  $("#scoreHud").textContent =
    String(
      game.score
    ).padStart(
      6,
      "0"
    );

  $("#comboHud").textContent =
    "x" + game.combo;

  $("#hpBar").style.width =
    clamp(
      player.hp,
      0,
      100
    ) + "%";

  $("#jetBar").style.width =
    clamp(
      player.jetTime /
      5 *
      100,
      0,
      100
    ) + "%";

  $("#specialBtn").textContent =
    `SPECIAL ×${player.specialAmmo}`;
}

/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {
  game.running = false;

  $("#messageCard").innerHTML = `
    <p class="eyebrow">
      DELETE FAIL: OFF
    </p>

    <h1>GEJM OVER</h1>

    <p>
      SCORE:
      <b>${game.score}</b><br>

      KOMBO:
      <b>x${game.combo}</b>
    </p>

    <button id="playAgain">
      HOP PONOVO
    </button>
  `;

  $("#messageScreen").classList.add(
    "active"
  );

  $("#playAgain").addEventListener(
    "click",
    () => {
      $("#messageScreen").classList.remove(
        "active"
      );

      resetGame();
    }
  );
}

/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
  "keydown",
  (event) => {
    game.keys[event.code] = true;

    if (event.code === "Space") {
      event.preventDefault();
      hop();
    }

    if (event.code === "KeyE") {
      fireSpecialWeapon();
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    game.keys[event.code] = false;
  }
);

/* =========================================================
   MOUSE AIM
========================================================= */

canvas.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType === "touch") {
      return;
    }

    game.mouse.x = event.clientX;
    game.mouse.y = event.clientY;

    const player = game.player;

    if (!player) {
      return;
    }

    const directionX =
      event.clientX -
      player.x;

    const directionY =
      event.clientY -
      (
        player.y -
        player.jumpHeight
      );

    const directionLength =
      Math.hypot(
        directionX,
        directionY
      ) || 1;

    game.aim.x =
      directionX /
      directionLength;

    game.aim.y =
      directionY /
      directionLength;
  }
);

canvas.addEventListener(
  "pointerdown",
  (event) => {
    if (event.pointerType !== "touch") {
      game.mouse.down = true;
      activateAudio();
    }
  }
);

window.addEventListener(
  "pointerup",
  (event) => {
    if (event.pointerType !== "touch") {
      game.mouse.down = false;
    }
  }
);

/* =========================================================
   MOBILE JOYSTICKS
========================================================= */

function createJoystick(
  zone,
  output,
  controlsFire = false
) {
  const base =
    zone.querySelector(
      ".stick-base"
    );

  const knob =
    base.querySelector("i");

  let activePointer = null;
  let centerX = 0;
  let centerY = 0;

  zone.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();

      activePointer =
        event.pointerId;

      centerX =
        event.clientX;

      centerY =
        event.clientY;

      zone.setPointerCapture(
        activePointer
      );

      zone.classList.add(
        "active"
      );

      const zoneRect =
        zone.getBoundingClientRect();

      base.style.left =
        centerX -
        zoneRect.left +
        "px";

      base.style.top =
        centerY -
        zoneRect.top +
        "px";

      activateAudio();
    }
  );

  zone.addEventListener(
    "pointermove",
    (event) => {
      if (
        event.pointerId !==
        activePointer
      ) {
        return;
      }

      const deltaX =
        event.clientX -
        centerX;

      const deltaY =
        event.clientY -
        centerY;

      const length =
        Math.hypot(
          deltaX,
          deltaY
        );

      const knobDistance =
        Math.min(
          44,
          length
        );

      if (length > 0) {
        output.x =
          deltaX /
          length *
          Math.min(
            1,
            length / 44
          );

        output.y =
          deltaY /
          length *
          Math.min(
            1,
            length / 44
          );
      } else {
        output.x = 0;
        output.y = 0;
      }

      if (controlsFire) {
        output.fire =
          length > 10;
      }

      const knobX =
        length > 0
          ? deltaX /
            length *
            knobDistance
          : 0;

      const knobY =
        length > 0
          ? deltaY /
            length *
            knobDistance
          : 0;

      knob.style.transform =
        `translate(${knobX}px,${knobY}px)`;
    }
  );

  const endJoystick =
    (event) => {
      if (
        event.pointerId !==
        activePointer
      ) {
        return;
      }

      activePointer = null;

      output.x = 0;
      output.y = 0;

      if (controlsFire) {
        output.fire = false;
      }

      zone.classList.remove(
        "active"
      );

      knob.style.transform = "";
    };

  zone.addEventListener(
    "pointerup",
    endJoystick
  );

  zone.addEventListener(
    "pointercancel",
    endJoystick
  );
}

createJoystick(
  $("#moveZone"),
  game.move
);

createJoystick(
  $("#aimZone"),
  game.aim,
  true
);

/* =========================================================
   MOBILE ACTIONS
========================================================= */

$("#hopBtn").addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();
    hop();
  }
);

$("#specialBtn").addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();
    fireSpecialWeapon();
  }
);

/* =========================================================
   UI BUTTONS
========================================================= */

$("#startBtn").addEventListener(
  "click",
  () => {
    activateAudio();

    $("#startScreen").classList.remove(
      "active"
    );

    resetGame();
  }
);

$("#pauseBtn").addEventListener(
  "click",
  () => {
    game.paused =
      !game.paused;

    $("#pauseBtn").textContent =
      game.paused
        ? "▶"
        : "Ⅱ";
  }
);

$("#soundBtn").addEventListener(
  "click",
  () => {
    game.sound =
      !game.sound;

    $("#soundBtn").textContent =
      game.sound
        ? "SOUND ON"
        : "SOUND OFF";
  }
);

$("#flashBtn").addEventListener(
  "click",
  () => {
    game.flashFull =
      !game.flashFull;

    $("#flashBtn").textContent =
      game.flashFull
        ? "FLASH FULL"
        : "FLASH REDUCED";

    $("#warning").style.display =
      game.flashFull
        ? "block"
        : "none";
  }
);
