// --- Global variables and constants ---
// These control the core gameplay difficulty and scaling. Adjust for desired challenge.

/**
 * invaderProjectileSpeed: Speed of invader projectiles (pixels/frame).
 *   Example: 2 (easy), 3 (normal), 5 (hard). Higher = faster, harder to dodge.
 */
let invaderProjectileSpeed = 3;
/**
 * bossProjectileSpeed: Speed of boss projectiles (pixels/frame).
 *   Example: 3 (easy), 4 (normal), 6 (hard). Higher = boss projectiles move faster.
 */
let bossProjectileSpeed = 4;
/**
 * bossMaxHits: Hits required to kill boss. Example: 5 (easy), 7 (normal), 12 (hard). Higher = boss tougher.
 */
let bossMaxHits = 7;
/**
 * bossVerticalAmplitude: Boss vertical movement amplitude (pixels). Example: 10 (easy), 20 (normal), 40 (hard). Higher = boss moves more up/down.
 */
let bossVerticalAmplitude = 20;
/**
 * bossVerticalFrequency: Boss vertical movement frequency (radians/frame). Example: 0.005 (easy), 0.01 (normal), 0.03 (hard). Higher = boss moves up/down faster.
 */
let bossVerticalFrequency = 0.01;
/**
 * invaderSpeed: Invader grid horizontal speed (pixels/frame). Example: 0.7 (easy), 1 (normal), 2 (hard). Higher = invaders move faster.
 */
let invaderSpeed = 1;
/**
 * invaderProjectileFrequency: Frames between invader shots. Example: 400 (easy), 250 (normal), 100 (hard). Lower = invaders shoot more often.
 */
let invaderProjectileFrequency = 150; // Adjusted for more frequent invader shots
/**
 * bossProjectileFrequency: Frames between boss shots. Example: 200 (easy), 120 (normal), 60 (hard). Lower = boss shoots more often.
 */
let bossProjectileFrequency = 100;

// --- Difficulty scaling increments ---
/**
 * INVADER_SPEED_INCREMENT: Invader speed increase per non-boss level. Example: 0.1 (gentle), 0.2 (normal), 0.4 (aggressive).
 */
const INVADER_SPEED_INCREMENT = 0.4;
/**
 * INVADER_REAL_POD_HITS: Number of hits required to kill a real pod invader. Example: 3 (gentle), 5 (normal), 7 (aggressive).
 */
const INVADER_REAL_POD_HITS = 5;
/**
 * BOSS_MAX_HITS_INCREMENT: Boss health increase per boss level. Example: 2 (gentle), 5 (normal), 10 (aggressive).
 */
const BOSS_MAX_HITS_INCREMENT = 10;
/**
 * BOSS_PROJECTILE_SPEED_INCREMENT: Boss projectile speed increase per boss level. Example: 0.2 (gentle), 0.5 (normal), 1 (aggressive).
 */
const BOSS_PROJECTILE_SPEED_INCREMENT = 0.74;
/**
 * BOSS_VERTICAL_AMPLITUDE_INCREMENT: Boss vertical amplitude increase per boss level. Example: 2 (gentle), 5 (normal), 10 (aggressive).
 */
const BOSS_VERTICAL_AMPLITUDE_INCREMENT = 10;
/**
 * BOSS_VERTICAL_FREQUENCY_INCREMENT: Boss vertical frequency increase per boss level. Example: 0.005 (gentle), 0.01 (normal), 0.02 (aggressive).
 */
const BOSS_VERTICAL_FREQUENCY_INCREMENT = 0.02;
/**
 * BOSS_PROJECTILE_FREQUENCY_INCREMENT: Boss projectile frequency increase per boss level (frames less between shots). Example: 5 (gentle), 10 (normal), 20 (aggressive).
 */
const BOSS_PROJECTILE_FREQUENCY_INCREMENT = 15;


// --- Constants for resetting the game ---
const INIT_INVADER_PROJECTILE_SPEED = invaderProjectileSpeed;
const INIT_BOSS_PROJECTILE_SPEED = bossProjectileSpeed;
const INIT_BOSS_MAX_HITS = bossMaxHits;
const INIT_BOSS_VERTICAL_AMPLITUDE = bossVerticalAmplitude;
const INIT_BOSS_VERTICAL_FREQUENCY = bossVerticalFrequency;
const INIT_INVADER_SPEED = invaderSpeed;
const INIT_INVADER_PROJECTILE_FREQUENCY = invaderProjectileFrequency;
const INIT_BOSS_PROJECTILE_FREQUENCY = bossProjectileFrequency;

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const scoreEl = document.getElementById('scoreEl');
const livesEl = document.getElementById('livesEl');
const levelEl = document.getElementById('levelEl');
const gameOverScreen = document.getElementById('gameOverScreen');
const endGameTitle = document.getElementById('endGameTitle');
const finalScoreEl = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const ctx = canvas.getContext('2d');
const killedPodsList = document.getElementById('killedPodsList');
const muteButton = document.getElementById('muteButton');
const muteIcon = document.getElementById('muteIcon');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownText = document.getElementById('countdownText');

// Audio Elements
const shootSound = document.getElementById('shootSound');
const explosionSound = document.getElementById('explosionSound');
const backgroundMusic = document.getElementById('backgroundMusic');
const backgroundBossMusic = document.getElementById('backgroundBossMusic');
const hitBossSound = document.getElementById('hitBossSound');
const explosionBossSound = document.getElementById('explosionBossSound');
const countDownSound = document.getElementById('countDownSound');

// --- Audio Functions ---
let audioContext;
let isAudioInitialized = false;
let isMuted = false;
let isMusicOn = true;

function initAudio() {
    if (isAudioInitialized) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sources = [shootSound, explosionSound, backgroundMusic, backgroundBossMusic].map(
            el => audioContext.createMediaElementSource(el)
        );
        sources.forEach(source => source.connect(audioContext.destination));

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        isAudioInitialized = true;
        console.log("Audio initialized and connected successfully.");
    } catch (e) {
        console.error("Failed to initialize Web Audio:", e);
    }
}

function playShootSound() {
    if (!isAudioInitialized || isMuted) return;
    try {
        shootSound.currentTime = 0;
        shootSound.play();
    } catch (e) {
        console.warn('Could not play shoot sound:', e);
    }
}
function playExplosionSound() {
    if (!isAudioInitialized || isMuted) return;
    try {
        explosionSound.currentTime = 0;
        explosionSound.play();
    } catch (e) {
        console.warn('Could not play explosion sound:', e);
    }
}
function playhitBossSound() {
    if (!isAudioInitialized || isMuted) return;
    try {
        hitBossSound.currentTime = 0;
        hitBossSound.play();
    } catch (e) {
        console.warn('Could not play boss explosion sound:', e);
    }
}
function playExplosionBossSound() {
    if (!isAudioInitialized || isMuted) return;
    try {
        explosionBossSound.currentTime = 0;
        explosionBossSound.play();
    } catch (e) {
        console.warn('Could not play boss explosion sound:', e);
    }
}
function playCountDownSound() {
    if (!countDownSound) return;
    try {
        countDownSound.currentTime = 0;
        countDownSound.play();
    } catch (e) {
        console.warn('Could not play countdown sound:', e);
    }
}

function switchMusic(isBossLevel) {
    backgroundMusic.pause();
    backgroundBossMusic.pause();
    if (isMuted || !game.active || !isMusicOn) return;
    const musicToPlay = isBossLevel ? backgroundBossMusic : backgroundMusic;
    musicToPlay.currentTime = 0;
    musicToPlay.play().catch(() => { });
}

// Canvas setup
canvas.width = 600;
canvas.height = 600;

// --- Game Data ---
const levelConfigs = [
    { rows: 1, cols: 2 },   // Level 1
    null,                   // Level 2 (Boss)
    { rows: 2, cols: 2 },   // Level 3
    null,                   // Level 4 (Boss)
    { rows: 4, cols: 4 },   // Level 5
    null,                   // Level 6 (Boss)
    { rows: 4, cols: 5 },   // Level 7
    null,                   // Level 8 (Boss)
    { rows: 5, cols: 6 },   // Level 9
    null                    // Level 10 (Boss)
];
const podNames = [
    "adeodatus", "adrianus", "amadeus", "anicetus", "antonius", "aprus", "augustus",
    "bartholomeus", "bernardus", "cathrinus", "claudius", "cornelius", "danilo",
    "dionysius", "flavianus", "franciscus", "fulgentius", "gaius", "gerardus",
    "gustavus", "henricus", "hilarius", "hubertus", "isaias", "josephus", "julius",
    "justin", "justus", "lambertus", "laurentius", "leonardus", "lotario",
    "lucious", "lucius", "ludovicus", "luke", "magnus", "marianus", "marinus",
    "mark", "martin", "matthaeus", "maximus", "petrus", "porcarius", "quintus",
    "renatus", "rex", "sergius", "siro", "solinus", "sylvester", "thaddeus",
    "titus", "ulysses", "vespasian", "victor", "vincentius", "vulcanus", "xystus", "zacharias"
];

// --- Game Classes ---
class Player {
    constructor() {
        this.width = 50;
        this.height = 40;
        this.position = { x: canvas.width / 2 - this.width / 2, y: canvas.height - this.height - 20 };
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
        this.opacity = 1;
        this.haloTimer = 0; // Frames remaining for red halo
        this.haloMax = 60; // Duration for halo effect
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        const headX = this.width / 2, headY = this.height / 2;
        // Draw glowing, fading red halo if hit
        if (this.haloTimer > 0) {
            // Fade out
            const fade = this.haloTimer / this.haloMax;
            // Glow pulse
            const pulse = 1.5 + Math.sin(frames * 0.3) * 1.5;
            ctx.save();
            ctx.globalAlpha = 0.6 * fade;
            ctx.beginPath();
            ctx.arc(headX, headY, 35 + pulse * 2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,56,96,${0.7 * fade})`;
            ctx.shadowColor = '#ff3860';
            ctx.shadowBlur = 18 * fade + pulse * 4;
            ctx.lineWidth = 8 + pulse * 2;
            ctx.stroke();
            ctx.restore();
        }
        ctx.fillStyle = '#A0522D';
        ctx.beginPath(); ctx.arc(headX - 20, headY - 5, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX + 20, headY - 5, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX, headY, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath(); ctx.arc(headX, headY + 5, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(headX - 7, headY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX + 7, headY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(headX, headY + 10, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
        ctx.restore();
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        if (this.position.x < 0) this.position.x = 0;
        else if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;
        if (this.haloTimer > 0) this.haloTimer--;
    }
}

class Projectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 4;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdd57'; ctx.fill(); ctx.closePath();
    }
    update() { this.draw(); this.position.x += this.velocity.x; this.position.y += this.velocity.y; }
}

class InvaderProjectile {
    constructor({ position, velocity, isBoss }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 3; this.height = 10;
        this.isBoss = isBoss || false;
    }
    draw() {
        if (this.isBoss) {
            // Draw a simple robot: head, eyes, antenna
            const x = this.position.x, y = this.position.y;
            ctx.save();
            // Head
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(x - 7, y, 14, 14);
            // Eyes
            ctx.fillStyle = '#326ce5';
            ctx.beginPath(); ctx.arc(x - 3, y + 5, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 3, y + 5, 2, 0, Math.PI * 2); ctx.fill();
            // Antenna
            ctx.strokeStyle = '#ff3860'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 6); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y - 7, 2, 0, Math.PI * 2); ctx.fillStyle = '#ffdd57'; ctx.fill();
            ctx.restore();
        } else {
            // Missile body
            const x = this.position.x, y = this.position.y;
            ctx.save();
            // Body
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(x - 2, y, 7, 14);
            // Nose cone
            ctx.beginPath();
            ctx.moveTo(x - 2, y);
            ctx.lineTo(x + 1.5, y - 6);
            ctx.lineTo(x + 5, y);
            ctx.closePath();
            ctx.fillStyle = '#ff3860';
            ctx.fill();
            // Tail fins
            ctx.fillStyle = '#326ce5';
            ctx.beginPath();
            ctx.moveTo(x - 2, y + 14);
            ctx.lineTo(x - 6, y + 18);
            ctx.lineTo(x + 1.5, y + 14);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 14);
            ctx.lineTo(x + 9, y + 18);
            ctx.lineTo(x + 1.5, y + 14);
            ctx.closePath();
            ctx.fill();
            // Exhaust glow
            ctx.beginPath();
            ctx.arc(x + 1.5, y + 18, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,221,87,0.5)';
            ctx.fill();
            ctx.restore();
        }
    }
    update() { this.draw(); this.position.x += this.velocity.x; this.position.y += this.velocity.y; }
}

class Invader {
    constructor({ position, name, namespace, isRealPod }) {
        this.width = 35; this.height = 35;
        this.position = { x: position.x, y: position.y };
        this.name = name; this.namespace = namespace;
        this.isRealPod = isRealPod; this.isKilled = false; // Track if this pod has been killed
        this.hits = 0; // Track number of hits for real pods
    }
    draw() {
        const x = this.position.x, y = this.position.y, w = this.width, h = this.height;
        ctx.save();
        ctx.fillStyle = this.isRealPod ? '#326ce5' : '#ff9800';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y); ctx.lineTo(x + w, y + h * 0.25); ctx.lineTo(x + w, y + h * 0.75);
        ctx.lineTo(x + w * 0.5, y + h); ctx.lineTo(x, y + h * 0.75); ctx.lineTo(x, y + h * 0.25);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(x + w * 0.25, y + h * 0.3, w * 0.5, h * 0.4);
        ctx.moveTo(x + w * 0.25, y + h * 0.3); ctx.lineTo(x + w * 0.4, y + h * 0.2);
        ctx.lineTo(x + w * 0.65, y + h * 0.2); ctx.lineTo(x + w * 0.75, y + h * 0.3);
        ctx.moveTo(x + w * 0.75, y + h * 0.3); ctx.lineTo(x + w * 0.65, y + h * 0.45);
        ctx.lineTo(x + w * 0.65, y + h * 0.6); ctx.lineTo(x + w * 0.75, y + h * 0.7);
        ctx.stroke(); ctx.restore();
    }
    update({ velocity }) { this.draw(); this.position.x += velocity.x; this.position.y += velocity.y; }
    shoot(invaderProjectiles) {
        // Add larger random angle to invader projectiles
        const angle = (Math.random() - 0.5) * 2.0; // -1.0 to +1.0
        invaderProjectiles.push(new InvaderProjectile({
            position: { x: this.position.x + this.width / 2, y: this.position.y + this.height },
            velocity: { x: angle, y: invaderProjectileSpeed },
        }));
    }
}

class Boss {
    constructor() {
        this.width = 150;
        this.height = 150;
        this.position = { x: canvas.width / 2 - this.width / 2, y: 50 };
        this.baseY = this.position.y; // Store initial Y position
        this.velocity = { x: 2, y: 0 };
        this.maxHealth = bossMaxHits;
        this.health = this.maxHealth;
        this.image = bossImage;
        this.nextFireFrame = 0;
    }

    draw() {
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        const healthBarWidth = this.width * (this.health / this.maxHealth);
        ctx.fillStyle = '#ff3860';
        ctx.fillRect(this.position.x, this.position.y - 20, this.width, 10);
        ctx.fillStyle = '#23d160';
        ctx.fillRect(this.position.x, this.position.y - 20, healthBarWidth, 10);
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        // Up/down movement using sine wave
        this.position.y = this.baseY + bossVerticalAmplitude * Math.sin(frames * bossVerticalFrequency);
        if (this.position.x <= 0 || this.position.x + this.width >= canvas.width) {
            this.velocity.x *= -1;
        }
    }

    shoot(projectiles) {
        // Fire with a random angle/spread
        const spread = Math.random() * 4 - 2; // -2 to +2
        projectiles.push(new InvaderProjectile({
            position: { x: this.position.x + this.width / 2, y: this.position.y + this.height },
            velocity: { x: spread, y: bossProjectileSpeed },
            isBoss: true
        }));
    }

    takeDamage() {
        this.health--;
    }
}

class Grid {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: invaderSpeed, y: 0 };
        this.invaders = [];
    }
    async init(level) {
        const config = levelConfigs[level - 1];
        if (!config) return;

        const { rows, cols } = config;
        this.width = cols * 45;
        try {
            const response = await fetch(`/names?count=${rows * cols}`);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const names = await response.json();
            let nameIndex = 0;
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    this.invaders.push(new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: names[nameIndex]?.name || podNames[Math.floor(Math.random() * podNames.length)],
                        namespace: names[nameIndex]?.namespace || podNames[Math.floor(Math.random() * podNames.length)],
                        isRealPod: names[nameIndex]?.isRealPod || false
                    }));
                    nameIndex++;
                }
            }
        } catch (error) {
            console.error("Failed to fetch invader names:", error);
            const { rows, cols } = levelConfigs[level - 1];
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    this.invaders.push(new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: `invader-${x}-${y}`,
                        namespace: `invader-${x}-${y}`,
                        isRealPod: false
                    }));
                }
            }
        }
        // randomize this.invaders using Fisher-Yates shuffle
        for (let i = this.invaders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.invaders[i], this.invaders[j]] = [this.invaders[j], this.invaders[i]];
        }
    }
    update() {
        if (this.invaders.length === 0) return;
        let minX = this.invaders[0].position.x, maxX = this.invaders[0].position.x + this.invaders[0].width;
        for (const invader of this.invaders) {
            if (invader.position.x < minX) minX = invader.position.x;
            if (invader.position.x + invader.width > maxX) maxX = invader.position.x + invader.width;
        }
        this.velocity.y = 0;
        if (maxX + this.velocity.x >= canvas.width || minX + this.velocity.x <= 0) {
            this.velocity.x = -this.velocity.x; this.velocity.y = 30;
        }
        // Ensure velocity.x always matches global invaderSpeed
        this.velocity.x = Math.sign(this.velocity.x) * invaderSpeed;
    }
}

class Particle {
    constructor({ position, velocity, radius, color, fades }) {
        this.position = position; this.velocity = velocity; this.radius = radius;
        this.color = color; this.opacity = 1; this.fades = fades;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.opacity;
        ctx.beginPath(); ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill(); ctx.closePath(); ctx.restore();
    }
    update() {
        this.draw(); this.position.x += this.velocity.x; this.position.y += this.velocity.y;
        if (this.fades) this.opacity -= 0.01;
    }
}

class FlashingText {
    constructor({ text, position }) {
        this.text = text; this.position = position;
        this.opacity = 1; this.life = 180;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.opacity;
        ctx.fillStyle = 'yellow'; ctx.font = '16px "Courier New"';
        ctx.textAlign = 'center'; ctx.fillText(this.text, this.position.x, this.position.y);
        ctx.restore();
    }
    update() { this.draw(); this.life--; this.opacity -= 1 / 180; }
}

// --- Game State ---
let player, projectiles, grids, invaderProjectiles, particles, flashingTexts, boss;
let keys, score, lives, level, game, frames;
let killedPods = [];
let animationId;
const bossImage = new Image();
bossImage.src = 'assets/boss.png';

let gameStartedTimestamp;
let playerName = '';

// --- Object Pools ---
const particlePool = [];
const projectilePool = [];

function getParticle(params) {
    let p = particlePool.length > 0 ? particlePool.pop() : new Particle(params);
    // Reset properties
    p.position = { ...params.position };
    p.velocity = { ...params.velocity };
    p.radius = params.radius;
    p.color = params.color || '#326ce5';
    p.opacity = 1;
    p.fades = params.fades;
    return p;
}
function releaseParticle(p) {
    particlePool.push(p);
}

function getProjectile(params) {
    let pr = projectilePool.length > 0 ? projectilePool.pop() : new Projectile(params);
    pr.position = { ...params.position };
    pr.velocity = { ...params.velocity };
    pr.radius = 4;
    return pr;
}
function releaseProjectile(pr) {
    projectilePool.push(pr);
}

async function init() {
    invaderProjectileSpeed = INIT_INVADER_PROJECTILE_SPEED;
    bossProjectileSpeed = INIT_BOSS_PROJECTILE_SPEED;
    bossMaxHits = INIT_BOSS_MAX_HITS;
    bossVerticalAmplitude = INIT_BOSS_VERTICAL_AMPLITUDE;
    bossVerticalFrequency = INIT_BOSS_VERTICAL_FREQUENCY;
    invaderSpeed = INIT_INVADER_SPEED;
    invaderProjectileFrequency = INIT_INVADER_PROJECTILE_FREQUENCY;
    bossProjectileFrequency = INIT_BOSS_PROJECTILE_FREQUENCY;
    player = new Player();
    projectiles = []; invaderProjectiles = []; particles = []; flashingTexts = [];
    keys = { arrowLeft: { pressed: false }, arrowRight: { pressed: false }, space: { pressed: false } };
    score = 0; lives = 3; level = 1;
    game = { over: false, active: false };
    frames = 0;
    boss = null;
    grids = [];

    scoreEl.innerHTML = `Score: ${score}`;
    livesEl.innerHTML = `Lives: ${lives}`;
    levelEl.innerHTML = `Level: ${level}`;
    gameOverScreen.style.display = 'none';
    countdownOverlay.style.display = 'none';
}

// --- Game Logic ---
function createParticles({ object, color, amount }) {
    for (let i = 0; i < amount; i++) {
        const p = getParticle({
            position: { x: object.position.x + object.width / 2, y: object.position.y + object.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
            radius: Math.random() * 3,
            color: color || '#326ce5',
            fades: true
        });
        particles.push(p);
    }
}

// --- Highscore Table: Always visible and updated ---
function showHighscoreTable() {
    fetch('/highscores')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('highscoreTableContainer');
            if (container) container.innerHTML = renderHighscoreTable(data);
        })
        .catch(() => {
            const container = document.getElementById('highscoreTableContainer');
            if (container) container.innerHTML = '<p>Could not load highscores.</p>';
        });
}

// Call on page load
window.addEventListener('DOMContentLoaded', () => {
    showHighscoreTable();
    if (window.location.search.includes('debug=true')) {
        showDebugPanel();
    }
});

// Also update after game events
function endGame() {
    game.over = true; game.active = false;
    switchMusic(false); // Switch to normal music, then pause
    backgroundMusic.pause();
    stopMonitor();
    stopMonitorStatusPolling();
    // --- Highscore submission ---
    const timeTaken = Date.now() - gameStartedTimestamp;
    const levelsFinished = level;
    playerName = getPlayerName();
    // Send highscore (fire and forget)
    fetch('/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: playerName,
            gameStarted: gameStartedTimestamp,
            timeTaken: timeTaken,
            levelsFinished: levelsFinished,
            score: score
        })
    }).catch(e => console.error('Failed to send highscore:', e));
    setTimeout(() => {
        player.opacity = 0;
        endGameTitle.innerHTML = 'GAME OVER';
        endGameTitle.classList.remove('has-text-success'); endGameTitle.classList.add('has-text-danger');
        finalScoreEl.innerHTML = `Your Score: ${score}`;
        gameOverScreen.style.display = 'block';
        // Refresh highscore table after game over
        setTimeout(showHighscoreTable, 500);
    }, 1000);
    setTimeout(() => createParticles({ object: player, color: '#A0522D', amount: 30 }), 500);
}

function winGame() {
    game.over = true; game.active = false;
    switchMusic(false); // Switch to normal music, then pause
    backgroundMusic.pause();
    stopMonitor();
    stopMonitorStatusPolling();
    // --- Highscore submission ---
    const timeTaken = Date.now() - gameStartedTimestamp;
    const levelsFinished = level;
    playerName = getPlayerName();
    // Award the player with 1000 points for each life remaining
    const bonusPoints = lives * 1000;
    const finalScore = score + bonusPoints;
    score = finalScore; // Update score with bonus
    fetch('/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: playerName,
            gameStarted: gameStartedTimestamp,
            timeTaken: timeTaken,
            levelsFinished: levelsFinished,
            score: score
        })
    }).catch(e => console.error('Failed to send highscore:', e));
    setTimeout(() => {
        endGameTitle.innerHTML = 'YOU WIN!';
        endGameTitle.classList.remove('has-text-danger'); endGameTitle.classList.add('has-text-success');
        finalScoreEl.innerHTML = `Final Score: ${score}`;
        gameOverScreen.style.display = 'block';
        showHighscoreTable();
    }, 1000);
}

async function advanceLevel() {
    if (level >= levelConfigs.length) {
        winGame();
        return;
    }

    // Pause for 1 second before starting next level
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add 1000 points if monitoring is up
    if (monitorIsUp) {
        score += 1000;
        if (scoreEl) scoreEl.innerHTML = `Score: ${score}`;
    }

    level++;
    levelEl.innerHTML = `Level: ${level}`;
    invaderProjectileSpeed += 0.2;
    boss = null;
    grids = [];

    const isBossLevel = levelConfigs[level - 1] === null;
    if (isBossLevel) {
        // Use global increment variables for boss level difficulty scaling
        bossMaxHits += BOSS_MAX_HITS_INCREMENT;
        bossProjectileSpeed += BOSS_PROJECTILE_SPEED_INCREMENT;
        bossVerticalAmplitude += BOSS_VERTICAL_AMPLITUDE_INCREMENT;
        bossVerticalFrequency += BOSS_VERTICAL_FREQUENCY_INCREMENT;
        bossProjectileFrequency = Math.max(40, bossProjectileFrequency - BOSS_PROJECTILE_FREQUENCY_INCREMENT); // Increase boss firing rate
        boss = new Boss();
        } else {
        // Increase invader speed
        invaderSpeed += INVADER_SPEED_INCREMENT;
        // increase invader projectile frequency
        invaderProjectileFrequency = Math.max(60, invaderProjectileFrequency - 40);
        const newGrid = new Grid();
        await newGrid.init(level);
        grids.push(newGrid);
    }
    game.active = true;
    switchMusic(isBossLevel);
}

async function reportKill(podName, namespace, isRealPod) {
    try {
        await fetch('/kill', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: podName, namespace: namespace, isRealPod: true })
        });
    } catch (error) { console.error("Failed to report kill:", error); }
}

function addKilledPodToSidebar(namespace, name) {
    killedPods.push(`${namespace}/${name}`);
    killedPodsList.textContent = killedPods.map((pod) => `💀 ${pod}`).join('\n');
    killedPodsList.parentElement.scrollTop = killedPodsList.parentElement.scrollHeight;
}

function renderHighscoreTable(highscores) {
    if (!highscores || highscores.length === 0) return '<p>No highscores yet.</p>';
    // Limit to top 20 scores
    highscores.sort((a, b) => b.score - a.score);
    const topScores = highscores.slice(0, 20);
    let html = '<table class="table is-striped is-fullwidth" style="background:#222;color:#fff;border-radius:8px;">';
    html += '<thead style="background:#222;color:#fff;"><tr><th>#</th><th>Name</th><th>Score</th><th>Levels</th><th>Time (s)</th><th>Started</th></tr></thead><tbody>';
    topScores.forEach((hs, i) => {
        const date = new Date(hs.gameStarted).toLocaleString();
        html += `<tr style="background:#222;color:#fff;"><td>${i + 1}</td><td>${hs.name || ''}</td><td>${hs.score}</td><td>${hs.levelsFinished}</td><td>${(hs.timeTaken / 1000).toFixed(1)}</td><td>${date}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
}

// --- Debug Sidepanel ---
function showDebugPanel() {
    if (document.getElementById('debugPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'debugPanel';
    panel.style.position = 'fixed';
    panel.style.top = '60px';
    panel.style.right = '0';
    panel.style.width = '260px';
    panel.style.height = 'auto';
    panel.style.background = 'rgba(30,30,30,0.95)';
    panel.style.color = '#fff';
    panel.style.zIndex = '1000';
    panel.style.borderLeft = '2px solid #326ce5';
    panel.style.padding = '16px';
    panel.style.fontFamily = 'monospace';
    panel.innerHTML = `
        <h3 style="margin-top:0;color:#ffdd57;">Debug Panel</h3>
        <div id="debugInfo"></div>
    `;
    document.body.appendChild(panel);
    updateDebugPanel();
}
function updateMonitoringStatusEl() {
    const el = document.getElementById('monitoringStatusEl');
    if (!el) return;
    if (monitorIsUp) {
        el.innerHTML = '<span style="color:#23d160;font-size:1.2em;">Monitoring: &#x2705;</span>';
    } else {
        el.innerHTML = '<span style="color:#ff3860;font-size:1.2em;">Monitoring: &#x274C;</span>';
    }
}
function updateDebugPanel() {
    const info = document.getElementById('debugInfo');
    if (!info) return;
    let monitoringLine = '<b>Monitoring:</b> ';
    if (monitorIsUp) {
        monitoringLine += '<span style="color:#23d160;font-size:1.2em;">&#x2705;</span>';
    } else {
        monitoringLine += '<span style="color:#ff3860;font-size:1.2em;">&#x274C;</span>';
    }
    info.innerHTML = `
        <b>Frames:</b> ${frames}<br>
        <b>Score:</b> ${score}<br>
        <b>Level:</b> ${level}<br>
        <b>Lives:</b> ${lives}<br>
        ${monitoringLine}<br>
        <b>Invader Speed:</b> ${invaderSpeed}<br>
        <b>Invader Projectile Speed:</b> ${invaderProjectileSpeed}<br>
        <b>Boss Projectile Speed:</b> ${bossProjectileSpeed}<br>
        <b>Boss Max Hits:</b> ${bossMaxHits}<br>
        <b>Boss Vertical Amplitude:</b> ${bossVerticalAmplitude}<br>
        <b>Boss Vertical Frequency:</b> ${bossVerticalFrequency}<br>
        <b>Active Grids:</b> ${grids.length}<br>
        <b>Active Projectiles:</b> ${projectiles.length}<br>
        <b>Active Invader Projectiles:</b> ${invaderProjectiles.length}<br>
        <b>Active Particles:</b> ${particles.length}<br>
        <b>Active FlashingTexts:</b> ${flashingTexts.length}<br>
    `;
    updateMonitoringStatusEl(); // Also update info-panel
}
// --- Monitor Status Polling ---
let monitorStatusInterval = null;
function startMonitorStatusPolling(monitorId) {
    if (monitorStatusInterval) clearInterval(monitorStatusInterval);
    monitorStatusInterval = setInterval(() => {
        fetch(`/monitor/status?id=${monitorId}`)
            .then(res => res.json())
            .then(data => {
                let statusText = '';
                if (data.error) {
                    statusText = `Monitor Error: ${data.error}`;
                } else {
                    statusText = `Monitor Status: ${data.status || data.Status} | URL: ${data.url || data.URL}`;
                }
                updateDebugPanelMonitorStatus(statusText);
            })
            .catch(err => {
                updateDebugPanelMonitorStatus(`Monitor Status fetch error: ${err}`);
            });
    }, 5000);
}
function stopMonitorStatusPolling() {
    if (monitorStatusInterval) {
        clearInterval(monitorStatusInterval);
        monitorStatusInterval = null;
        updateDebugPanelMonitorStatus('');
    }
}
let monitorIsUp = false; // Track monitor status

function updateDebugPanelMonitorStatus(text) {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        let monitorStatusDiv = document.getElementById('monitor-status');
        if (!monitorStatusDiv) {
            monitorStatusDiv = document.createElement('div');
            monitorStatusDiv.id = 'monitor-status';
            debugPanel.appendChild(monitorStatusDiv);
        }
        monitorStatusDiv.textContent = text;
    }
    // Set monitorIsUp if the word 'up' appears anywhere in the status text (case-insensitive)
    monitorIsUp = /\bup\b/i.test(text);
    updateMonitoringStatusEl(); // Also update info-panel
}

// Update debug panel every animation frame if present
function animate() {
    if (!game.active) return;
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.update();

    // --- Optimized update & removal for particles ---
    particles = particles.filter((p) => {
        if (p.opacity <= 0) {
            releaseParticle(p);
            return false;
        }
        p.update();
        return true;
    });
    // --- Optimized update & removal for flashingTexts ---
    flashingTexts = flashingTexts.filter((t) => {
        if (t.life <= 0) return false;
        t.update();
        return true;
    });

    // --- Optimized update & removal for invaderProjectiles ---
    invaderProjectiles = invaderProjectiles.filter((proj) => {
        if (proj.position.y + proj.height >= canvas.height) return false;
        proj.update();
        // Collision with player
        if (
            proj.position.y + proj.height >= player.position.y &&
            proj.position.y <= player.position.y + player.height &&
            proj.position.x + proj.width >= player.position.x &&
            proj.position.x <= player.position.x + player.width
        ) {
            lives--;
            livesEl.innerHTML = `Lives: ${lives}`;
            player.haloTimer = 60;
            if (lives > 0) createParticles({ object: player, color: 'white', amount: 15 });
            else endGame();
            return false;
        }
        return true;
    });

    // --- Optimized update & removal for projectiles ---
    projectiles = projectiles.filter((pr) => {
        if (pr.position.y + pr.radius <= 0) {
            releaseProjectile(pr);
            return false;
        }
        pr.update();
        return true;
    });

    if (boss) {
        boss.update();
        if (frames >= boss.nextFireFrame) {
            boss.shoot(invaderProjectiles);
            boss.nextFireFrame = frames + bossProjectileFrequency + Math.floor(Math.random() * bossProjectileFrequency);
        }
        projectiles.forEach((projectile, j) => {
            if (
                projectile.position.y - projectile.radius <= boss.position.y + boss.height &&
                projectile.position.x + projectile.radius >= boss.position.x &&
                projectile.position.x - projectile.radius <= boss.position.x + boss.width &&
                projectile.position.y + projectile.radius >= boss.position.y
            ) {
                if (!projectiles.includes(projectile)) return;
                projectiles.splice(j, 1);
                boss.takeDamage();
                playhitBossSound();
                createParticles({ object: { position: projectile.position, width: 10, height: 10 }, color: '#D92A2A', amount: 8 });
                if (boss.health <= 0) {
                    score += 1000;
                    scoreEl.innerHTML = `Score: ${score}`;
                    createParticles({ object: boss, color: '#D92A2A', amount: 100 });
                    playExplosionBossSound();
                    playExplosionSound();
                    boss = null;
                    advanceLevel();
                }
            }
        });
    }

    grids.forEach((grid, gridIndex) => {
        grid.update();
        if (frames % invaderProjectileFrequency === 0 && grid.invaders.length > 0) {
            grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles);
        }
        // --- Optimized invader & projectile collision ---
        grid.invaders = grid.invaders.filter((invader, i) => {
            invader.update({ velocity: grid.velocity });
            if (invader.position.y + invader.height >= player.position.y) {
                endGame();
                return false;
            }
            let hit = false;
            projectiles.forEach((projectile, j) => {
                if (
                    projectile.position.y - projectile.radius <= invader.position.y + invader.height &&
                    projectile.position.x + projectile.radius >= invader.position.x &&
                    projectile.position.x - projectile.radius <= invader.position.x + invader.width &&
                    projectile.position.y + projectile.radius >= invader.position.y
                ) {
                    if (!invader.isKilled) {
                        if (invader.isRealPod) {
                            invader.hits++;
                            createParticles({ object: invader, color: '#D92A2A', amount: 10 });
                            if (invader.hits >= INVADER_REAL_POD_HITS) {
                                invader.isKilled = true;
                                let points = 200;
                                score += points;
                                scoreEl.innerHTML = `Score: ${score}`;
                                createParticles({ object: invader, color: '#D92A2A', amount: 30 });
                                flashingTexts.push(new FlashingText({ text: `${invader.namespace}/${invader.name}`, position: { x: invader.position.x + invader.width / 2, y: invader.position.y } }));
                                addKilledPodToSidebar(invader.namespace, invader.name);
                                playExplosionSound();
                                reportKill(invader.name, invader.namespace);
                                hit = true;
                            }
                        } else {
                            invader.isKilled = true;
                            let points = 100;
                            score += points;
                            scoreEl.innerHTML = `Score: ${score}`;
                            createParticles({ object: invader, color: '#ff9800', amount: 30 });
                            playExplosionSound();
                            hit = true;
                        }
                        projectiles.splice(j, 1);
                    }
                }
            });
            return !hit;
        });
        if (grid.invaders.length === 0) {
            grids.splice(gridIndex, 1);
            advanceLevel();
        }
    });

    if (keys.arrowLeft.pressed) player.velocity.x = -player.speed;
    else if (keys.arrowRight.pressed) player.velocity.x = player.speed;
    else player.velocity.x = 0;

    frames++;
    if (document.getElementById('debugPanel')) updateDebugPanel();
    updateMonitoringStatusEl(); // Always update info-panel monitoring status
}

async function startGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    await init();
    gameStartedTimestamp = Date.now();

    // Always start monitoring with every new game
    const monitorUrlInput = document.getElementById('monitorUrlInput');
    const monitorUrl = monitorUrlInput ? monitorUrlInput.value.trim() : '';
    if (monitorUrl) {
        try {
            const res = await fetch('/monitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: monitorUrl })
            });
            if (res.ok) {
                const data = await res.json();
                monitorId = data.id || null;
                startMonitorStatusPolling(monitorId);
            }
        } catch (e) {
            console.error('Failed to send monitor URL:', e);
        }
    }

    const isBossLevel = levelConfigs[level - 1] === null;
    if (isBossLevel) {
        boss = new Boss();
    } else {
        const firstGrid = new Grid();
        await firstGrid.init(level);
        grids.push(firstGrid);
    }

    const countdownValues = ['3', '2', '1', 'GO!'];
    countdownOverlay.style.display = 'block';
    for (let i = 0; i < countdownValues.length; i++) {
        countdownText.textContent = countdownValues[i];
        playCountDownSound();
        await new Promise(resolve => setTimeout(resolve, 700));
    }
    countdownOverlay.style.display = 'none';

    game.active = true;
    switchMusic(isBossLevel);
    animate();
}

// --- Event Listeners ---
window.addEventListener('keydown', ({ key }) => {
    if (game.over || !game.active) return;
    initAudio();

    switch (key) {
        case 'ArrowLeft': keys.arrowLeft.pressed = true; break;
        case 'ArrowRight': keys.arrowRight.pressed = true; break;
        case ' ':
            if (!keys.space.pressed) {
                projectiles.push(getProjectile({ position: { x: player.position.x + player.width / 2, y: player.position.y }, velocity: { x: 0, y: -10 } }));
                keys.space.pressed = true;
                playShootSound();
            }
            break;
    }
});
window.addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'ArrowLeft': keys.arrowLeft.pressed = false; break;
        case 'ArrowRight': keys.arrowRight.pressed = false; break;
        case ' ': keys.space.pressed = false; break;
    }
});

muteButton.addEventListener('click', () => {
    initAudio();
    isMuted = !isMuted;
    if (isMuted) {
        muteIcon.classList.remove('fa-volume-up');
        muteIcon.classList.add('fa-volume-mute');
        backgroundMusic.pause();
        backgroundBossMusic.pause();
    } else {
        muteIcon.classList.remove('fa-volume-mute');
        muteIcon.classList.add('fa-volume-up');
        if (game.active) {
            const isBossLevel = levelConfigs[level - 1] === null;
            switchMusic(isBossLevel);
        }
    }
});

musicButton.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    if (!isMusicOn) {
        musicIcon.classList.remove('fa-music');
        musicIcon.classList.add('fa-music-slash');
        backgroundMusic.pause();
        backgroundBossMusic.pause();
    } else {
        musicIcon.classList.remove('fa-music-slash');
        musicIcon.classList.add('fa-music');
        if (game.active) {
            const isBossLevel = levelConfigs[level - 1] === null;
            switchMusic(isBossLevel);
        }
    }
});

restartButton.addEventListener('click', () => {
    killedPods = [];
    killedPodsList.textContent = '';
    startGame();
});

const playOverlay = document.getElementById('playOverlay');
const playButton = document.getElementById('playButton');
// Prevent game from starting automatically
let hasGameStarted = false;
function showPlayOverlay() {
    playOverlay.style.display = 'flex';
}
function hidePlayOverlay() {
    playOverlay.style.display = 'none';
}
playButton.addEventListener('click', async () => {
    if (hasGameStarted) return;
    hasGameStarted = true;
    // Get namespaces from input
    const namespaceInput = document.getElementById('namespaceInput');
    let namespaces = [];
    if (namespaceInput) {
        namespaces = namespaceInput.value.split(/\r?\n/).map(ns => ns.trim()).filter(ns => ns.length > 0);
        if (namespaces.length > 0) {
            try {
                await fetch('/namespaces', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ namespaces })
                });
            } catch (e) {
                console.error('Failed to send namespaces:', e);
            }
        }
    }
    hidePlayOverlay();
    await startGame();
});

// Show overlay on load
showPlayOverlay();

const playerNameInput = document.getElementById('playerNameInput');
function getPlayerName() {
    return playerNameInput ? playerNameInput.value.trim() : '';
}

let monitorId = null;

async function stopMonitor() {
    if (monitorId) {
        try {
            await fetch('/monitor/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: monitorId })
            });
            monitorId = null;
        } catch (e) {
            console.error('Failed to stop monitor:', e);
        }
    }
}