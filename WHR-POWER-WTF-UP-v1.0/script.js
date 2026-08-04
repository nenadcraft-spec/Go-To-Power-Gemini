const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const TERRAIN_COLOR = [100, 160, 80]; // Boja podloge u CSS-u
let isRunning = true;
let generationCount = 1;

// --- KLASE ---

class Rabbit {
    constructor(x, y, r, g, b, age = 0) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;
        this.b = b;
        this.age = age; // 0 = mali zeko, 1 = odrasli
        this.size = age === 0 ? 6 : 12;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.isAlive = true;
        this.growthTimer = 0; // Tajmer za odrastanje
    }

    update() {
        // Kretanje
        this.x += this.vx;
        this.y += this.vy;

        // Odbijanje od ivica platna
        if (this.x < 10 || this.x > canvas.width - 10) this.vx *= -1;
        if (this.y < 10 || this.y > canvas.height - 10) this.vy *= -1;

        // Odrastanje malog zeca
        if (this.age === 0) {
            this.growthTimer += 1;
            if (this.growthTimer > 300) { // Nakon ~5 sekundi odrasta
                this.age = 1;
                this.size = 12;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.r}, ${this.g}, ${this.b})`;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Određivanje kamuflaže u odnosu na boju terena
    getVisibility() {
        const diffR = Math.abs(this.r - TERRAIN_COLOR[0]);
        const diffG = Math.abs(this.g - TERRAIN_COLOR[1]);
        const diffB = Math.abs(this.b - TERRAIN_COLOR[2]);
        const visibilityScore = diffR + diffG + diffB;
        
        // Mali zeko ima hendikep (lakše se uočava)
        return this.age === 0 ? visibilityScore + 80 : visibilityScore;
    }
}

class Predator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 16;
        this.speed = 2.2;
        this.hunger = 0;
        this.isAlive = true;
    }

    update(rabbits) {
        this.hunger += 0.002;
        if (this.hunger > 1) {
            this.isAlive = false; // Umire od gladi
            return;
        }

        // Pronađi najuočljivijeg zeca u blizini
        let target = null;
        let highestVisibility = -1;

        for (let r of rabbits) {
            if (!r.isAlive) continue;
            let dist = Math.hypot(r.x - this.x, r.y - this.y);
            let vis = r.getVisibility();

            // Predator primećuje zečeve koji nisu kamuflirani i blizu su
            if (dist < 150 && vis > 40 && vis > highestVisibility) {
                highestVisibility = vis;
                target = r;
            }
        }

        // Kretanje ka meti ili nasumično patroliranje
        if (target) {
            let angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Ako ulovi zeca
            let distToTarget = Math.hypot(target.x - this.x, target.y - this.y);
            if (distToTarget < this.size + target.size) {
                target.isAlive = false;
                this.hunger = 0; // Nahranjen
            }
        } else {
            this.x += (Math.random() - 0.5) * 2;
            this.y += (Math.random() - 0.5) * 2;
        }

        // Ograničenje na platno
        this.x = Math.max(10, Math.min(canvas.width - 10, this.x));
        this.y = Math.max(10, Math.min(canvas.height - 10, this.y));
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#d90429'; // Crvena boja predatora
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// --- INITIAL DATA ---

let rabbits = [
    new Rabbit(200, 250, 220, 130, 90, 1),
    new Rabbit(250, 250, 180, 150, 70, 1)
];
let predators = [new Predator(600, 250)];

// --- FUNKCIJA ZA UKRŠTANJE (GENETIKA) ---

function reproduce(p1, p2) {
    let r = Math.min(255, Math.max(0, Math.floor((p1.r + p2.r) / 2 + (Math.random() * 30 - 15))));
    let g = Math.min(255, Math.max(0, Math.floor((p1.g + p2.g) / 2 + (Math.random() * 30 - 15))));
    let b = Math.min(255, Math.max(0, Math.floor((p1.b + p2.b) / 2 + (Math.random() * 30 - 15))));
    
    return new Rabbit((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, r, g, b, 0);
}

// --- MAIN LOOP ---

function gameLoop() {
    if (isRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update & Draw Rabbits
        rabbits.forEach(r => {
            r.update();
            r.draw();
        });

        // "Sudar" odraslih zečeva i rađanje
        let adults = rabbits.filter(r => r.age === 1 && r.isAlive);
        for (let i = 0; i < adults.length; i++) {
            for (let j = i + 1; j < adults.length; j++) {
                let dist = Math.hypot(adults[i].x - adults[j].x, adults[i].y - adults[j].y);
                if (dist < 20 && Math.random() < 0.02) { // 2% šanse pri dodiru
                    let baby = reproduce(adults[i], adults[j]);
                    rabbits.push(baby);

                    // Smena generacija: Roditelji nestaju nakon stvorenog novog života
                    adults[i].isAlive = false;
                    adults[j].isAlive = false;
                    generationCount++;
                    break;
                }
            }
        }

        // Update & Draw Predators
        predators.forEach(p => {
            p.update(rabbits);
            p.draw();
        });

        // Filtriranje uginulih
        rabbits = rabbits.filter(r => r.isAlive);
        predators = predators.filter(p => p.isAlive);

        // Osvežavanje statistike
        document.getElementById('statRabbits').innerText = rabbits.length;
        document.getElementById('statPredators').innerText = predators.length;
        document.getElementById('statGenerations').innerText = generationCount;
    }

    requestAnimationFrame(gameLoop);
}

// --- DUGMIĆI ---

document.getElementById('btnSpawnRabbit').addEventListener('click', () => {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    rabbits.push(new Rabbit(Math.random() * canvas.width, Math.random() * canvas.height, r, g, b, 1));
});

document.getElementById('btnSpawnPredator').addEventListener('click', () => {
    predators.push(new Predator(Math.random() * canvas.width, Math.random() * canvas.height));
});

document.getElementById('btnTogglePause').addEventListener('click', () => {
    isRunning = !isRunning;
});

// Pokreni simulaciju
gameLoop();
