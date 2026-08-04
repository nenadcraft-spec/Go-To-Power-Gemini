/**
 * WHR: MASTER RABBIT MATERIAL ENGINE v6.1.2 (STABLE DELTA BUILD)
 * Finalne ispravke za vizuelni test:
 * 1. Touch-first Eye Tracking na pointerdown pre provere udara
 * 2. Vremenski stabilan delta (dt) tajmer – identično trajanje na 60/120/144 Hz
 * 3. Korigovana osnovna sivo-srebrna boja "#b8c5d6" za prikaz staklenog odsjaja i magle
 * 4. Popravljen RGB proračun i Retina rendering
 */

const canvas = document.getElementById('rabbitStage');
const ctx = canvas.getContext('2d');

let gameWidth = 0;
let gameHeight = 0;
let mousePos = { x: 0, y: 0 };
let lastTime = 0;

// --- 1. RETINA DISPLAY RESIZING ---
function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    gameWidth = rect.width;
    gameHeight = rect.height;

    mousePos.x = gameWidth * 0.5;
    mousePos.y = gameHeight * 0.3;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 2. COLOR UTILITY FUNKCIJE ---
function clampColor(value) {
    return Math.max(0, Math.min(255, value));
}

function adjustColor(hex, percent) {
    const cleanHex = hex.replace("#", "");
    const num = parseInt(cleanHex, 16);
    const amount = Math.round(2.55 * percent);

    const r = clampColor((num >> 16) + amount);
    const g = clampColor(((num >> 8) & 0xff) + amount);
    const b = clampColor((num & 0xff) + amount);

    return `#${[
        r.toString(16).padStart(2, "0"),
        g.toString(16).padStart(2, "0"),
        b.toString(16).padStart(2, "0")
    ].join("")}`;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// --- KLASA MASTER ZECA ---
class ProceduralRabbit {
    constructor(x, y, radius, baseColor) {
        this.x = x;
        this.y = y;
        this.baseRadius = radius;
        this.baseColor = baseColor; // Srebrno-bela baza
        
        this.motionSeed = Math.random() * 100;
        this.squashX = 1;
        this.squashY = 1;
        this.tilt = 0;
        this.recoil = 0;
        
        // Elastic Ear Spring
        this.leftEarAngle = -0.15;
        this.rightEarAngle = 0.15;
        this.earVelL = 0;
        this.earVelR = 0;

        // Unutrašnji oblačići magle
        this.fogBlobs = [
            { angle: 0, dist: radius * 0.35, speed: 0.015, size: radius * 0.45 },
            { angle: 2.1, dist: radius * 0.25, speed: -0.022, size: radius * 0.35 },
            { angle: 4.2, dist: radius * 0.4, speed: 0.018, size: radius * 0.3 }
        ];

        this.hitTimer = 0; // Trajanje udara u sekundama
    }

    triggerStrike(pointerX, pointerY) {
        const dx = pointerX - this.x;
        const dy = pointerY - this.y;
        const direction = Math.atan2(dy, dx);

        this.squashX = 1.35;
        this.squashY = 0.7;
        this.recoil = 15;

        // Tilt zavisi od smera pogodka
        this.tilt = clamp((-dx / this.baseRadius) * 0.22, -0.3, 0.3);

        this.earVelL = -Math.cos(direction) * 0.18;
        this.earVelR = Math.cos(direction) * 0.18;
        this.hitTimer = 0.22; // 0.22s stabilnog sjaja pri udaru
    }

    update(time, dt) {
        // Smooth disanje
        this.breathe = Math.sin(time * 0.003 + this.motionSeed) * 2.0;
        this.microVibe = Math.sin(time * 0.017 + this.motionSeed) * 0.22 +
                         Math.sin(time * 0.031 + this.motionSeed * 2) * 0.1;

        // Opruga za Squash / Stretch / Recoil
        this.squashX += (1 - this.squashX) * 0.12;
        this.squashY += (1 - this.squashY) * 0.12;
        this.tilt *= 0.88;
        this.recoil *= 0.85;

        // Opruga za uši
        const earWave = Math.sin(time * 0.0045 + this.motionSeed) * 0.045;
        const targetAngleL = -0.15 + earWave;
        const targetAngleR = 0.15 - earWave;

        this.earVelL += (targetAngleL - this.leftEarAngle) * 0.1;
        this.earVelR += (targetAngleR - this.rightEarAngle) * 0.1;
        this.earVelL *= 0.82;
        this.earVelR *= 0.82;
        
        this.leftEarAngle += this.earVelL;
        this.rightEarAngle += this.earVelR;

        // Clamping za uši
        this.leftEarAngle = clamp(this.leftEarAngle, -0.6, 0.2);
        this.rightEarAngle = clamp(this.rightEarAngle, -0.2, 0.6);

        // Deformacija magle u kristalnoj kugli
        this.fogBlobs.forEach(b => {
            b.angle += b.speed;
        });

        if (this.hitTimer > 0) {
            this.hitTimer = Math.max(0, this.hitTimer - dt);
        }
    }

    drawShadow(ctx) {
        const shadowY = this.y + this.baseRadius * 0.95;
        const shadowScale = 1 + (this.recoil * 0.008);
        
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(this.x, shadowY, this.baseRadius * 0.95 * shadowScale, this.baseRadius * 0.28, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
        ctx.filter = "blur(7px)";
        ctx.fill();
        ctx.restore();
    }

    draw(ctx, time) {
        const r = this.baseRadius + this.breathe;
        
        // Balansirani tonovi za srebrno-belog zeca
        const lightColor = adjustColor(this.baseColor, 35);   // Highlight
        const innerColor = adjustColor(this.baseColor, 15);   // Midtone
        const shadowColor = adjustColor(this.baseColor, -55); // Shadow

        ctx.save();
        ctx.translate(this.x, this.y + this.recoil + this.microVibe);
        ctx.rotate(this.tilt);
        ctx.scale(this.squashX, this.squashY);

        // --- UŠI ---
        [ { angle: this.leftEarAngle, xOff: -r * 0.42 }, 
          { angle: this.rightEarAngle, xOff: r * 0.42 } ].forEach(ear => {
            ctx.save();
            ctx.translate(ear.xOff, -r * 0.85);
            ctx.rotate(ear.angle);

            const earGrad = ctx.createLinearGradient(0, -r * 0.8, 0, 0);
            earGrad.addColorStop(0, lightColor);
            earGrad.addColorStop(0.5, innerColor);
            earGrad.addColorStop(1, shadowColor);

            ctx.beginPath();
            ctx.ellipse(0, -r * 0.45, r * 0.22, r * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = earGrad;
            ctx.fill();
            ctx.strokeStyle = adjustColor(this.baseColor, 25);
            ctx.lineWidth = 2;
            ctx.stroke();

            // Unutrašnji koren ušiju
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.35, r * 0.1, r * 0.35, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
            ctx.fill();

            ctx.restore();
        });

        // --- TELO (Polimer & Fresnel) ---
        const bodyGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, lightColor);
        bodyGrad.addColorStop(0.75, this.hitTimer > 0 ? '#ec4899' : this.baseColor);
        bodyGrad.addColorStop(1, shadowColor);

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = this.hitTimer > 0 ? '#ec4899' : '#06b6d4';
        ctx.shadowBlur = this.hitTimer > 0 ? 35 : 15;
        ctx.fill();

        // --- KRISTALNA KUGLA: UNUTRAŠNJA DEFORMISANA MAGLA ---
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        ctx.clip();

        ctx.globalCompositeOperation = 'screen';
        this.fogBlobs.forEach(blob => {
            const wobbleX = Math.sin(blob.angle * 1.7 + this.motionSeed) * r * 0.07;
            const wobbleY = Math.cos(blob.angle * 1.3 + this.motionSeed) * r * 0.06;

            const bx = Math.cos(blob.angle) * blob.dist + wobbleX;
            const by = Math.sin(blob.angle) * blob.dist * 0.72 + wobbleY;
            
            const fogGrad = ctx.createRadialGradient(bx, by, 0, bx, by, blob.size);
            fogGrad.addColorStop(0, adjustColor(this.baseColor, 30));
            fogGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.18)');
            fogGrad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(bx, by, blob.size, 0, Math.PI * 2);
            ctx.fillStyle = fogGrad;
            ctx.fill();
        });
        ctx.restore();

        // --- UNUTRAŠNJI EYE TRACKING ---
        const dx = mousePos.x - this.x;
        const dy = mousePos.y - this.y;
        const angleToTarget = Math.atan2(dy, dx);
        
        const eyeShiftX = Math.cos(angleToTarget) * (r * 0.1);
        const eyeShiftY = Math.sin(angleToTarget) * (r * 0.06);

        // Stabilno spoljašnje kućište visora
        ctx.fillStyle = "rgba(5, 22, 30, 0.92)";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.roundRect(-r * 0.43, -r * 0.18, r * 0.86, r * 0.24, 6);
        ctx.fill();

        // Pokretna unutrašnja LED linija
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(-r * 0.4, -r * 0.15, r * 0.8, r * 0.18, 5);
        ctx.clip();

        ctx.translate(eyeShiftX, eyeShiftY);

        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 12;
        ctx.fillRect(-r * 0.31, -r * 0.12, r * 0.62, r * 0.1);

        // Glint
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-r * 0.2, -r * 0.1, r * 0.2, 2);
        ctx.restore();

        // --- STAKLASTI SLOJ ---
        const glassGrad = ctx.createLinearGradient(-r, -r, r, r);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        glassGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.03)');
        glassGrad.addColorStop(0.9, 'rgba(6, 182, 212, 0.22)');

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = glassGrad;
        ctx.fill();

        ctx.restore();
    }
}

// Inicijalizacija zeca sa korigovanom bazo m "#b8c5d6"
const masterRabbit = new ProceduralRabbit(0, 0, 65, "#b8c5d6");

// --- RENDER LOOP SA DELTA (dt) TAJMEROM ---
function renderStage(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // Pretvaranje u sekunde
    lastTime = timestamp;

    ctx.clearRect(0, 0, gameWidth, gameHeight);

    masterRabbit.x = gameWidth * 0.5;
    masterRabbit.y = gameHeight * 0.48;

    masterRabbit.update(timestamp, dt);
    
    masterRabbit.drawShadow(ctx);
    masterRabbit.draw(ctx, timestamp);

    requestAnimationFrame(renderStage);
}
requestAnimationFrame(renderStage);

// --- TOUCH & POINTER HANDLERS ---
window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault(); // Sprečava kašnjenje ili neželjeni skrol na telefonima

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Prvo odmah okreni pogled prema tački dodira
    mousePos.x = x;
    mousePos.y = y;

    const hitDistance = Math.hypot(x - masterRabbit.x, y - masterRabbit.y);

    if (hitDistance <= masterRabbit.baseRadius + 20) {
        masterRabbit.triggerStrike(x, y);
    }
}, { passive: false });
