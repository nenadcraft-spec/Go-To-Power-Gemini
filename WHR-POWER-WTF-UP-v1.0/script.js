/* =========================================================
   WHR v1.4.1 — INSTANT SENSITIVITY & HIGH-BOUNCE PANG PHYSICS
========================================================= */

const GAME_CONFIG = {
    startingLives: 3,
    playerWidth: 50,
    playerHeight: 24,
    playerSpeed: 750, // Povećana brzina za mikrosekundni odziv
    cableSpeed: 1300,
    gravity: 620,     // Blago smanjena gravitacija radi višeg leta
    shootDelay: 300
};

// Znatno pojačane bounce vrednosti da kugle lete do plafona
const ORB_TYPES = {
    large: { radius: 42, speedX: 160, bounce: 880, score: 100, next: "medium" },
    medium: { radius: 26, speedX: 200, bounce: 760, score: 180, next: "small" },
    small: { radius: 15, speedX: 250, bounce: 640, score: 300, next: null }
};

/* SENSITIVITY NA MAX — TRENUTNA REAKCIJA KLIZAČA */
function handleMove(e) {
    if (!joystick.active) return;

    let touch = null;
    if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystick.touchId) {
                touch = e.changedTouches[i];
                break;
            }
        }
    } else {
        touch = e;
    }

    if (!touch) return;

    let deltaX = touch.clientX - joystick.startX;

    if (deltaX > joystick.maxRadius) deltaX = joystick.maxRadius;
    if (deltaX < -joystick.maxRadius) deltaX = -joystick.maxRadius;

    joystick.stick.style.transform = `translateX(${deltaX}px)`;

    // Minimalni deadzone (3px) — instant reakcija pri najmanjem pomaku!
    if (deltaX < -3) {
        state.touch.left = true;
        state.touch.right = false;
    } else if (deltaX > 3) {
        state.touch.right = true;
        state.touch.left = false;
    } else {
        state.touch.left = false;
        state.touch.right = false;
    }
}

/* ODBIJANJE KUGLE OD SVIH ZIDOVA I PLAFONA ARENE */
function updateGame(delta, timestamp) {
    const dir = (state.keys.left || state.touch.left ? -1 : 0) + (state.keys.right || state.touch.right ? 1 : 0);
    state.player.x += dir * GAME_CONFIG.playerSpeed * delta;
    state.player.x = Math.max(0, Math.min(state.width - state.player.width, state.player.x));

    if (state.keys.shoot || state.touch.shoot) {
        tryShoot(timestamp);
    }

    // Cables Update
    for (let i = state.cables.length - 1; i >= 0; i--) {
        const cable = state.cables[i];
        cable.height += GAME_CONFIG.cableSpeed * delta;

        if (cable.height >= state.height) {
            state.cables.splice(i, 1);
        }
    }

    // Orbs Physics — Odbijanje od poda, zidova I PLAFONA
    state.orbs.forEach(orb => {
        orb.velocityY += GAME_CONFIG.gravity * delta;
        orb.x += orb.velocityX * delta;
        orb.y += orb.velocityY * delta;

        // Odbijanje od bočnih zidova
        if (orb.x - orb.radius < 0) {
            orb.x = orb.radius;
            orb.velocityX *= -1;
        } else if (orb.x + orb.radius > state.width) {
            orb.x = state.width - orb.radius;
            orb.velocityX *= -1;
        }

        // Odbijanje od PLAFONA
        if (orb.y - orb.radius < 0) {
            orb.y = orb.radius;
            orb.velocityY = Math.abs(orb.velocityY) * 0.8; // Odbijanje naniže
        }

        // Odbijanje od PODA (skok do plafona)
        if (orb.y + orb.radius > state.height - 4) {
            orb.y = state.height - 4 - orb.radius;
            orb.velocityY = -ORB_TYPES[orb.type].bounce;
        }
    });

    // Collision Check...
}
