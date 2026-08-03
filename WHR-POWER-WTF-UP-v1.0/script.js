/* HOTFIX v3.0.1: SPREČAVANJE BESTKONAČNE PETLJE ZA ZLATNOG ZECA */

function triggerRabbitPower(orb, orbIndex) {
    switch (orb.theme.id) {
        case "white": // EMP Pulse
            state.orbs.forEach(other => {
                if (other !== orb && !other.inHole) {
                    const d = Math.hypot(other.x - orb.x, other.y - orb.y);
                    if (d < 220) {
                        other.velocityX += (other.x - orb.x) * 4.0;
                        other.velocityY += (other.y - orb.y) * 4.0;
                    }
                }
            });
            break;

        case "black": // Hacker Teleport Swap
            orb.x = 40 + Math.random() * (state.width - 80);
            orb.y = 40 + Math.random() * (state.height * 0.4);
            orb.velocityX = (Math.random() > 0.5 ? 1 : -1) * 350;
            orb.velocityY = -150;
            break;

        case "blue": // Absolute Zero Stasis na 3s
            state.globalFreezeTimer = 3.0;
            break;

        case "gold": // Split-Shot Trigger (SA COOLDOWN-OM OD 2s DA NE SKUCA IGRU)
            if (!orb.goldCooldown || orb.goldCooldown <= 0) {
                orb.goldCooldown = 2.0; // Sprečava eksploziju od 1000 metaka!
                spawnSplitLasers(orb.x, orb.y, orb.radius);
            }
            break;

        case "red": // Boomerang Explosion & Respawn za 3s
            state.orbs.forEach(other => {
                if (other !== orb && !other.inHole) {
                    const d = Math.hypot(other.x - orb.x, other.y - orb.y);
                    if (d < 250) {
                        other.velocityX = (other.x - orb.x) * 5.0;
                        other.velocityY = (other.y - orb.y) * 5.0;
                    }
                }
            });
            state.orbs.splice(orbIndex, 1);
            state.pendingRespawns.push({ theme: orb.theme, delay: 3.0 });
            break;

        case "green": // Time-Warp Cycle
            state.globalSpeedMultiplier = 0.2;
            state.orbs.splice(orbIndex, 1);
            state.pendingRespawns.push({ theme: orb.theme, delay: 2.5 });
            setTimeout(() => { state.globalSpeedMultiplier = 1.1; }, 2500);
            break;

        case "void": // Void Shadow Turbo Trigger
            orb.isVoidTurbo = true;
            orb.velocityX *= 1.8;
            orb.velocityY *= 1.8;
            break;
    }
}

function spawnSplitLasers(x, y, radius) {
    const angles = [Math.PI / 3, -Math.PI / 3]; // Ugao izletanja
    const offset = radius + 15; // Izleću IZVAN zeca da ga ne pogode instant ponovo!

    angles.forEach(ang => {
        const vx = Math.sin(ang) * GAME_CONFIG.laserSpeed;
        const vy = -Math.cos(ang) * GAME_CONFIG.laserSpeed;

        const startX = x + Math.sin(ang) * offset;
        const startY = y - Math.cos(ang) * offset;

        state.lasers.push({
            headX: startX, headY: startY, tailX: startX, tailY: startY,
            vx: vx, vy: vy, life: 2.0
        });
    });
}
