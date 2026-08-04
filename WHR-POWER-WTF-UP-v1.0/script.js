const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const TERRAIN_COLOR = [100, 160, 80];
let isRunning = true;
let generationCount = 1;

class Rabbit {
    constructor(x, y, r, g, b, age = 0) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;
        this.b = b;
        this.age = age; // 0 = mali zeko, 1 = odrasli zeko
        this.size = age === 0 ? 6 : 14;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.isAlive = true;
        this.growthTimer = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Odbijanje od zidova
        if (this.x < 15 || this.x > canvas.width - 15) this.vx *= -1;
        if (this.y < 15 || this.y > canvas.height - 15) this.vy *= -1;

        // Odrastanje malog zeca (nakon 180 frejmova ~ 3 sekunde)
        if (this.age === 0) {
            this.growthTimer += 1;
            if (this.growthTimer > 180) {
                this.age = 1;
                this.size = 14;
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

        // Dodatne uši da se jasnije vidi da je zeko
        ctx.beginPath();
        ctx.ellipse(this.x - 4, this.y - this.size, 3, this.size / 2, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 4, this.y - this.size, 3, this.size / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.r}, ${this.g}, ${this.b})`;
        ctx.fill();
        ctx.stroke();
    }

    getVisibility() {
        const diffR = Math.abs(this.r - TERRAIN_COLOR[0]);
        const diffG = Math.abs(this.g - TERRAIN_COLOR[1]);
        const diffB = Math.abs(this.b - TERRAIN_COLOR[2]);
        const visibilityScore = diffR + diffG + diffB;
        
        // Mali zeko ima hendikep (lakše ga primete)
        return this.age === 0 ? visibilityScore + 70 : visibilityScore;
    }
}

class Predator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 18;
        this.speed = 1.8;
        this.hunger = 0;
        this.isAlive = true;
    }

    update(rabbits) {
        this.hunger += 0.001;
        if (this.hunger > 1) {
            this.isAlive = false;
            return;
        }

        let target = null;
        let highestVisibility = -1;

        // Lov na najuočljivijeg zeca u dometu
        for (let r of rabbits) {
            if (!r.isAlive) continue;
            let dist = Math.hypot(r.x - this.x, r.y - this.y);
            let vis = r.getVisibility();

            if (dist < 200 && vis > 35 && vis > highestVisibility) {
                highestVisibility = vis;
                target = r;
            }
        }

        if (target) {
            let angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            let distToTarget = Math.hypot(target.x - this.x, target.y - this.y);
            if (distToTarget < this.size + target.size) {
                target.isAlive = false;
                this.hunger = 0;
            }
        } else {
            this.x += (Math.random() - 0.5) * 1.5;
            this.y += (Math.random() - 0.5) * 1.5;
        }

        this.x = Math.max(15, Math.min(canvas.width - 15, this.x));
        this.y = Math.max(15, Math.min(canvas.height - 15, this.y));
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#e63946';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Početna populacija
let rabbits = [
    new Rabbit(200, 250, 220, 130, 90, 1),
    new Rabbit(250, 250, 180, 150, 70, 1)
];
let predators = [new Predator(600, 250)];

function reproduce(p1, p2) {
    let r = Math.min(255, Math.max(0, Math.floor((p1.r + p2.r) / 2 + (Math.random() * 40 - 20))));
    let g = Math.min(255, Math.max(0, Math.floor((p1.g + p2.g) / 2 + (Math.random() * 40 - 20))));
    let b = Math.min(255, Math.max(0, Math.floor((p1.b + p2.b) / 2 + (Math.random() * 40 - 20))));
    
    return new Rabbit((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, r, g, b, 0);
}

function gameLoop() {
    if (isRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ažuriranje i iscrtavanje zečeva
        rabbits.forEach(r => {
            r.update();
            r.draw();
        });

        // "Sudar" odraslih zečeva i nastanak novih
        let adults = rabbits.filter(r => r.age === 1 && r.isAlive);
        for (let i = 0; i < adults.length; i++) {
            for (let j = i + 1; j < adults.length; j++) {
                let dist = Math.hypot(adults[i].x - adults[j].x, adults[i].y - adults[j].y);
                
                if (dist < 25) {
                    let baby = reproduce(adults[i], adults[j]);
                    rabbits.push(baby);

                    // Roditelji se povlače / nestaju
                    adults[i].isAlive = false;
                    adults[j].isAlive = false;
                    generationCount++;
                    break;
                }
            }
        }

        // Ažuriranje i iscrtavanje predatora
        predators.forEach(p => {
            p.update(rabbits);
            p.draw();
        });

        // Uklanjanje mrtvih objekata
        rabbits = rabbits.filter(r => r.isAlive);
        predators = predators.filter(p => p.isAlive);

        // Osvežavanje teksta statistike
        document.getElementById('statRabbits').innerText = rabbits.length;
        document.getElementById('statPredators').innerText = predators.length;
        document.getElementById('statGenerations').innerText = generationCount;
    }

    requestAnimationFrame(gameLoop);
}

// Kontrolna dugmad
document.getElementById('btnSpawnRabbit').addEventListener('click', () => {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    rabbits.push(new Rabbit(Math.random() * (canvas.width - 40) + 20, Math.random() * (canvas.height - 40) + 20, r, g, b, 1));
});

document.getElementById('btnSpawnPredator').addEventListener('click', () => {
    predators.push(new Predator(Math.random() * (canvas.width - 40) + 20, Math.random() * (canvas.height - 40) + 20));
});

document.getElementById('btnTogglePause').addEventListener('click', () => {
    isRunning = !isRunning;
});

// Pokretanje petlje
gameLoop();
