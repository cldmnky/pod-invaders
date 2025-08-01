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

// DOM Elements - Cache all elements at once to reduce DOM lookups
const elements = {
    canvas: document.getElementById('gameCanvas'),
    scoreEl: document.getElementById('scoreEl'),
    livesEl: document.getElementById('livesEl'),
    levelEl: document.getElementById('levelEl'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    endGameTitle: document.getElementById('endGameTitle'),
    finalScoreEl: document.getElementById('finalScore'),
    restartButton: document.getElementById('restartButton'),
    killedPodsList: document.getElementById('killedPodsList'),
    muteButton: document.getElementById('muteButton'),
    muteIcon: document.getElementById('muteIcon'),
    countdownOverlay: document.getElementById('countdownOverlay'),
    countdownText: document.getElementById('countdownText'),
    musicButton: document.getElementById('musicButton'),
    musicIcon: document.getElementById('musicIcon'),
    playOverlay: document.getElementById('playOverlay'),
    playButton: document.getElementById('playButton'),
    playerNameInput: document.getElementById('playerNameInput'),
    namespaceInput: document.getElementById('namespaceInput'),
    monitorUrlInput: document.getElementById('monitorUrlInput'),
    monitoringStatusEl: document.getElementById('monitoringStatusEl'),
    highscoreTableContainer: document.getElementById('highscoreTableContainer')
};

// Extract commonly used elements for better performance
const canvas = elements.canvas;
const scoreEl = elements.scoreEl;
const livesEl = elements.livesEl;
const levelEl = elements.levelEl;
const gameOverScreen = elements.gameOverScreen;
const endGameTitle = elements.endGameTitle;
const finalScoreEl = elements.finalScoreEl;
const restartButton = elements.restartButton;
const ctx = canvas.getContext('2d');
const killedPodsList = elements.killedPodsList;
const muteButton = elements.muteButton;
const muteIcon = elements.muteIcon;
const countdownOverlay = elements.countdownOverlay;
const countdownText = elements.countdownText;

// Apply initial styling for proper spacing
if (scoreEl) scoreEl.style.marginRight = '20px';
if (livesEl) livesEl.style.marginRight = '20px';
if (levelEl) levelEl.style.marginRight = '20px';

// Audio Elements
const audioElements = {
    shootSound: document.getElementById('shootSound'),
    explosionSound: document.getElementById('explosionSound'),
    backgroundMusic: document.getElementById('backgroundMusic'),
    backgroundBossMusic: document.getElementById('backgroundBossMusic'),
    hitBossSound: document.getElementById('hitBossSound'),
    explosionBossSound: document.getElementById('explosionBossSound'),
    countDownSound: document.getElementById('countDownSound')
};

// Extract commonly used audio elements
const shootSound = audioElements.shootSound;
const explosionSound = audioElements.explosionSound;
const backgroundMusic = audioElements.backgroundMusic;
const backgroundBossMusic = audioElements.backgroundBossMusic;
const hitBossSound = audioElements.hitBossSound;
const explosionBossSound = audioElements.explosionBossSound;
const countDownSound = audioElements.countDownSound;

// --- Audio Functions ---
let audioContext;
let isAudioInitialized = false;
let isMuted = false;
let isMusicOn = true;

function initAudio() {
    if (isAudioInitialized) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const soundElements = [shootSound, explosionSound, backgroundMusic, backgroundBossMusic];
        const sources = soundElements.map(el => audioContext.createMediaElementSource(el));
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

// Optimized audio functions with reduced redundancy
function playAudioElement(element, errorMessage) {
    if (!isAudioInitialized || isMuted || !element) return;
    try {
        element.currentTime = 0;
        element.play();
    } catch (e) {
        console.warn(errorMessage, e);
    }
}

function playShootSound() {
    playAudioElement(shootSound, 'Could not play shoot sound:');
}

function playExplosionSound() {
    playAudioElement(explosionSound, 'Could not play explosion sound:');
}

function playhitBossSound() {
    playAudioElement(hitBossSound, 'Could not play boss hit sound:');
}

function playExplosionBossSound() {
    playAudioElement(explosionBossSound, 'Could not play boss explosion sound:');
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

// Cache canvas dimensions for performance
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
const CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;

// Math constants for performance
const PI2 = Math.PI * 2;
const PI_HALF = Math.PI / 2;

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
        this.position = { x: CANVAS_CENTER_X - 25, y: CANVAS_HEIGHT - 60 }; // Optimized calculation
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
        this.opacity = 1;
        this.haloTimer = 0; // Frames remaining for red halo
        this.haloMax = 60; // Duration for halo effect
        // Cache commonly used values
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        const headX = this.halfWidth, headY = this.halfHeight;
        
        // Draw glowing, fading red halo if hit - optimized
        if (this.haloTimer > 0) {
            const fade = this.haloTimer / this.haloMax;
            const pulse = 1.5 + Math.sin(frames * 0.3) * 1.5;
            ctx.save();
            ctx.globalAlpha = 0.6 * fade;
            ctx.beginPath();
            ctx.arc(headX, headY, 35 + pulse * 2, 0, PI2);
            ctx.strokeStyle = `rgba(255,56,96,${0.7 * fade})`;
            ctx.shadowColor = '#ff3860';
            ctx.shadowBlur = 18 * fade + pulse * 4;
            ctx.lineWidth = 8 + pulse * 2;
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw player character - optimized with reused paths
        ctx.fillStyle = '#A0522D';
        ctx.beginPath(); ctx.arc(headX - 20, headY - 5, 10, 0, PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX + 20, headY - 5, 10, 0, PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX, headY, 20, 0, PI2); ctx.fill();
        
        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath(); ctx.arc(headX, headY + 5, 15, 0, PI2); ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(headX - 7, headY, 3, 0, PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX + 7, headY, 3, 0, PI2); ctx.fill();
        
        ctx.strokeStyle = 'black'; 
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.arc(headX, headY + 10, 8, 0.2 * Math.PI, 0.8 * Math.PI); 
        ctx.stroke();
        ctx.restore();
    }
    
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        
        // Boundary checking with cached values
        if (this.position.x < 0) {
            this.position.x = 0;
        } else if (this.position.x + this.width > CANVAS_WIDTH) {
            this.position.x = CANVAS_WIDTH - this.width;
        }
        
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
        ctx.beginPath(); 
        ctx.arc(this.position.x, this.position.y, this.radius, 0, PI2);
        ctx.fillStyle = '#ffdd57'; 
        ctx.fill();
    }
    
    update() { 
        this.draw(); 
        this.position.x += this.velocity.x; 
        this.position.y += this.velocity.y; 
    }
}

class InvaderProjectile {
    constructor({ position, velocity, isBoss }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 3; 
        this.height = 10;
        this.isBoss = isBoss || false;
    }
    
    draw() {
        const x = this.position.x, y = this.position.y;
        
        if (this.isBoss) {
            // Draw a simple robot: head, eyes, antenna - optimized
            ctx.save();
            // Head
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(x - 7, y, 14, 14);
            // Eyes
            ctx.fillStyle = '#326ce5';
            ctx.beginPath(); 
            ctx.arc(x - 3, y + 5, 2, 0, PI2); 
            ctx.fill();
            ctx.beginPath(); 
            ctx.arc(x + 3, y + 5, 2, 0, PI2); 
            ctx.fill();
            // Antenna
            ctx.strokeStyle = '#ff3860'; 
            ctx.lineWidth = 2;
            ctx.beginPath(); 
            ctx.moveTo(x, y); 
            ctx.lineTo(x, y - 6); 
            ctx.stroke();
            ctx.beginPath(); 
            ctx.arc(x, y - 7, 2, 0, PI2); 
            ctx.fillStyle = '#ffdd57'; 
            ctx.fill();
            ctx.restore();
        } else {
            // Missile body - optimized drawing
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
            ctx.arc(x + 1.5, y + 18, 4, 0, PI2);
            ctx.fillStyle = 'rgba(255,221,87,0.5)';
            ctx.fill();
            ctx.restore();
        }
    }
    
    update() { 
        this.draw(); 
        this.position.x += this.velocity.x; 
        this.position.y += this.velocity.y; 
    }
}

class Invader {
    constructor({ position, name, namespace, isRealPod }) {
        this.width = 35; 
        this.height = 35;
        this.position = { x: position.x, y: position.y };
        this.name = name; 
        this.namespace = namespace;
        this.isRealPod = isRealPod; 
        this.isKilled = false; // Track if this pod has been killed
        this.hits = 0; // Track number of hits for real pods
        // Cache commonly used values
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;
    }
    
    draw() {
        const x = this.position.x, y = this.position.y, w = this.width, h = this.height;
        ctx.save();
        ctx.fillStyle = this.isRealPod ? '#326ce5' : '#ff9800';
        
        // Optimized hexagon drawing
        ctx.beginPath();
        ctx.moveTo(x + this.halfWidth, y); 
        ctx.lineTo(x + w, y + h * 0.25); 
        ctx.lineTo(x + w, y + h * 0.75);
        ctx.lineTo(x + this.halfWidth, y + h); 
        ctx.lineTo(x, y + h * 0.75); 
        ctx.lineTo(x, y + h * 0.25);
        ctx.closePath(); 
        ctx.fill();
        
        // Optimized detail drawing
        ctx.strokeStyle = 'white'; 
        ctx.lineWidth = 1.5;
        ctx.beginPath(); 
        ctx.rect(x + w * 0.25, y + h * 0.3, w * 0.5, h * 0.4);
        ctx.moveTo(x + w * 0.25, y + h * 0.3); 
        ctx.lineTo(x + w * 0.4, y + h * 0.2);
        ctx.lineTo(x + w * 0.65, y + h * 0.2); 
        ctx.lineTo(x + w * 0.75, y + h * 0.3);
        ctx.moveTo(x + w * 0.75, y + h * 0.3); 
        ctx.lineTo(x + w * 0.65, y + h * 0.45);
        ctx.lineTo(x + w * 0.65, y + h * 0.6); 
        ctx.lineTo(x + w * 0.75, y + h * 0.7);
        ctx.stroke(); 
        ctx.restore();
    }
    
    update({ velocity }) { 
        this.draw(); 
        this.position.x += velocity.x; 
        this.position.y += velocity.y; 
    }
    
    shoot(invaderProjectiles) {
        // Add larger random angle to invader projectiles
        const angle = (Math.random() - 0.5) * 2.0; // -1.0 to +1.0
        invaderProjectiles.push(new InvaderProjectile({
            position: { x: this.position.x + this.halfWidth, y: this.position.y + this.height },
            velocity: { x: angle, y: invaderProjectileSpeed },
        }));
    }
}

class Boss {
    constructor() {
        this.width = 150;
        this.height = 150;
        this.position = { x: CANVAS_CENTER_X - 75, y: 50 }; // Optimized calculation
        this.baseY = this.position.y; // Store initial Y position
        this.velocity = { x: 2, y: 0 };
        this.maxHealth = bossMaxHits;
        this.health = this.maxHealth;
        this.image = bossImage;
        this.nextFireFrame = 0;
        // Cache boundary values
        this.leftBoundary = 0;
        this.rightBoundary = CANVAS_WIDTH - this.width;
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
        // Up/down movement using sine wave - optimized calculation
        this.position.y = this.baseY + bossVerticalAmplitude * Math.sin(frames * bossVerticalFrequency);
        
        // Boundary checking with cached values
        if (this.position.x <= this.leftBoundary || this.position.x >= this.rightBoundary) {
            this.velocity.x *= -1;
        }
    }

    shoot(projectiles) {
        // Fire with a random angle/spread
        const spread = Math.random() * 4 - 2; // -2 to +2
        projectiles.push(new InvaderProjectile({
            position: { x: this.position.x + 75, y: this.position.y + this.height }, // Use cached half-width
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
        this.width = 0;
        // Cache boundary values for performance
        this.leftBoundary = 0;
        this.rightBoundary = CANVAS_WIDTH;
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
            
            // Pre-allocate array for better performance
            this.invaders = new Array(rows * cols);
            let invaderIndex = 0;
            
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    this.invaders[invaderIndex++] = new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: names[nameIndex]?.name || podNames[Math.floor(Math.random() * podNames.length)],
                        namespace: names[nameIndex]?.namespace || podNames[Math.floor(Math.random() * podNames.length)],
                        isRealPod: names[nameIndex]?.isRealPod || false
                    });
                    nameIndex++;
                }
            }
        } catch (error) {
            console.error("Failed to fetch invader names:", error);
            const { rows, cols } = levelConfigs[level - 1];
            this.invaders = new Array(rows * cols);
            let invaderIndex = 0;
            
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    this.invaders[invaderIndex++] = new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: `invader-${x}-${y}`,
                        namespace: `invader-${x}-${y}`,
                        isRealPod: false
                    });
                }
            }
        }
        
        // Fisher-Yates shuffle optimization
        for (let i = this.invaders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.invaders[i];
            this.invaders[i] = this.invaders[j];
            this.invaders[j] = temp;
        }
    }
    
    update() {
        const invaderCount = this.invaders.length;
        if (invaderCount === 0) return;
        
        // Optimized boundary calculation
        let minX = this.invaders[0].position.x;
        let maxX = this.invaders[0].position.x + 35; // Use cached width
        
        for (let i = 1; i < invaderCount; i++) {
            const invader = this.invaders[i];
            if (invader.position.x < minX) minX = invader.position.x;
            const rightEdge = invader.position.x + 35;
            if (rightEdge > maxX) maxX = rightEdge;
        }
        
        this.velocity.y = 0;
        if (maxX + this.velocity.x >= this.rightBoundary || minX + this.velocity.x <= this.leftBoundary) {
            this.velocity.x = -this.velocity.x; 
            this.velocity.y = 30;
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

// Performance optimization: Cache score display to reduce DOM updates
let lastScoreDisplay = '';
function updateScore(newScore) {
    score = newScore;
    const scoreDisplay = `Score: ${score}`;
    if (scoreDisplay !== lastScoreDisplay) {
        scoreEl.innerHTML = scoreDisplay;
        scoreEl.style.marginRight = '20px'; // Add spacing
        lastScoreDisplay = scoreDisplay;
    }
}

// Cache lives display
let lastLivesDisplay = '';
function updateLives(newLives) {
    lives = newLives;
    const livesDisplay = `Lives: ${lives}`;
    if (livesDisplay !== lastLivesDisplay) {
        livesEl.innerHTML = livesDisplay;
        livesEl.style.marginRight = '20px'; // Add spacing
        lastLivesDisplay = livesDisplay;
    }
}

// Cache level display
let lastLevelDisplay = '';
function updateLevel(newLevel) {
    level = newLevel;
    const levelDisplay = `Level: ${level}`;
    if (levelDisplay !== lastLevelDisplay) {
        levelEl.innerHTML = levelDisplay;
        levelEl.style.marginRight = '20px'; // Add spacing
        lastLevelDisplay = levelDisplay;
    }
}

// --- Object Pools ---
const particlePool = [];
const projectilePool = [];

// Optimized object pool functions with better memory management
function getParticle(params) {
    let p = particlePool.length > 0 ? particlePool.pop() : new Particle(params);
    // Reset properties efficiently
    Object.assign(p, {
        position: { x: params.position.x, y: params.position.y },
        velocity: { x: params.velocity.x, y: params.velocity.y },
        radius: params.radius,
        color: params.color || '#326ce5',
        opacity: 1,
        fades: params.fades
    });
    return p;
}

function releaseParticle(p) {
    if (particlePool.length < 100) { // Limit pool size
        particlePool.push(p);
    }
}

function getProjectile(params) {
    let pr = projectilePool.length > 0 ? projectilePool.pop() : new Projectile(params);
    Object.assign(pr, {
        position: { x: params.position.x, y: params.position.y },
        velocity: { x: params.velocity.x, y: params.velocity.y },
        radius: 4
    });
    return pr;
}

function releaseProjectile(pr) {
    if (projectilePool.length < 50) { // Limit pool size
        projectilePool.push(pr);
    }
}

// Optimized collision detection functions
function checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkCircleRectCollision(circle, rect) {
    return circle.x - circle.radius <= rect.x + rect.width &&
           circle.x + circle.radius >= rect.x &&
           circle.y - circle.radius <= rect.y + rect.height &&
           circle.y + circle.radius >= rect.y;
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
    projectiles = []; 
    invaderProjectiles = []; 
    particles = []; 
    flashingTexts = [];
    keys = { 
        arrowLeft: { pressed: false }, 
        arrowRight: { pressed: false }, 
        space: { pressed: false } 
    };
    
    // Use optimized update functions
    updateScore(0);
    updateLives(3);
    updateLevel(1);
    
    game = { over: false, active: false };
    frames = 0;
    boss = null;
    grids = [];

    gameOverScreen.style.display = 'none';
    countdownOverlay.style.display = 'none';
    
    // Reset cached display values
    lastScoreDisplay = '';
    lastLivesDisplay = '';
    lastLevelDisplay = '';
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
            const container = elements.highscoreTableContainer;
            if (container) container.innerHTML = renderHighscoreTable(data);
        })
        .catch(() => {
            const container = elements.highscoreTableContainer;
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
        updateScore(score + 1000);
    }

    updateLevel(level + 1);
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
    const el = elements.monitoringStatusEl;
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
    
    // Clear canvas efficiently
    ctx.fillStyle = 'black'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    player.update();

    // --- Optimized particle system ---
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.opacity <= 0) {
            releaseParticle(p);
            particles.splice(i, 1);
        } else {
            p.update();
        }
    }

    // --- Optimized flashing text system ---
    for (let i = flashingTexts.length - 1; i >= 0; i--) {
        const t = flashingTexts[i];
        if (t.life <= 0) {
            flashingTexts.splice(i, 1);
        } else {
            t.update();
        }
    }

    // --- Optimized invader projectiles with collision detection ---
    for (let i = invaderProjectiles.length - 1; i >= 0; i--) {
        const proj = invaderProjectiles[i];
        
        if (proj.position.y + proj.height >= CANVAS_HEIGHT) {
            invaderProjectiles.splice(i, 1);
            continue;
        }
        
        proj.update();
        
        // Player collision check using optimized function
        if (checkRectCollision(
            { x: proj.position.x, y: proj.position.y, width: proj.width, height: proj.height },
            { x: player.position.x, y: player.position.y, width: player.width, height: player.height }
        )) {
            updateLives(lives - 1);
            player.haloTimer = 60;
            if (lives > 0) {
                createParticles({ object: player, color: 'white', amount: 15 });
            } else {
                endGame();
            }
            invaderProjectiles.splice(i, 1);
        }
    }

    // --- Optimized player projectiles ---
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const pr = projectiles[i];
        if (pr.position.y + pr.radius <= 0) {
            releaseProjectile(pr);
            projectiles.splice(i, 1);
        } else {
            pr.update();
        }
    }

    // --- Boss logic optimization ---
    if (boss) {
        boss.update();
        
        if (frames >= boss.nextFireFrame) {
            boss.shoot(invaderProjectiles);
            boss.nextFireFrame = frames + bossProjectileFrequency + Math.floor(Math.random() * bossProjectileFrequency);
        }
        
        // Boss collision with projectiles - optimized
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const projectile = projectiles[j];
            if (checkCircleRectCollision(
                { x: projectile.position.x, y: projectile.position.y, radius: projectile.radius },
                { x: boss.position.x, y: boss.position.y, width: boss.width, height: boss.height }
            )) {
                projectiles.splice(j, 1);
                boss.takeDamage();
                playhitBossSound();
                createParticles({ 
                    object: { position: projectile.position, width: 10, height: 10 }, 
                    color: '#D92A2A', 
                    amount: 8 
                });
                
                if (boss.health <= 0) {
                    updateScore(score + 1000);
                    createParticles({ object: boss, color: '#D92A2A', amount: 100 });
                    playExplosionBossSound();
                    playExplosionSound();
                    boss = null;
                    advanceLevel();
                    break;
                }
            }
        }
    }

    // --- Grid processing optimization ---
    for (let gridIndex = grids.length - 1; gridIndex >= 0; gridIndex--) {
        const grid = grids[gridIndex];
        grid.update();
        
        // Invader shooting logic
        if (frames % invaderProjectileFrequency === 0 && grid.invaders.length > 0) {
            const randomInvader = grid.invaders[Math.floor(Math.random() * grid.invaders.length)];
            randomInvader.shoot(invaderProjectiles);
        }
        
        // Invader collision detection - optimized
        for (let i = grid.invaders.length - 1; i >= 0; i--) {
            const invader = grid.invaders[i];
            invader.update({ velocity: grid.velocity });
            
            // Check if invaders reached player
            if (invader.position.y + invader.height >= player.position.y) {
                endGame();
                return;
            }
            
            let hit = false;
            // Check projectile collisions
            for (let j = projectiles.length - 1; j >= 0; j--) {
                const projectile = projectiles[j];
                if (checkCircleRectCollision(
                    { x: projectile.position.x, y: projectile.position.y, radius: projectile.radius },
                    { x: invader.position.x, y: invader.position.y, width: invader.width, height: invader.height }
                )) {
                    if (!invader.isKilled) {
                        if (invader.isRealPod) {
                            invader.hits++;
                            createParticles({ object: invader, color: '#D92A2A', amount: 10 });
                            if (invader.hits >= INVADER_REAL_POD_HITS) {
                                invader.isKilled = true;
                                updateScore(score + 200);
                                createParticles({ object: invader, color: '#D92A2A', amount: 30 });
                                flashingTexts.push(new FlashingText({ 
                                    text: `${invader.namespace}/${invader.name}`, 
                                    position: { x: invader.position.x + invader.halfWidth, y: invader.position.y } 
                                }));
                                addKilledPodToSidebar(invader.namespace, invader.name);
                                playExplosionSound();
                                reportKill(invader.name, invader.namespace);
                                hit = true;
                            }
                        } else {
                            invader.isKilled = true;
                            updateScore(score + 100);
                            createParticles({ object: invader, color: '#ff9800', amount: 30 });
                            playExplosionSound();
                            hit = true;
                        }
                        projectiles.splice(j, 1);
                        break;
                    }
                }
            }
            
            if (hit) {
                grid.invaders.splice(i, 1);
            }
        }
        
        if (grid.invaders.length === 0) {
            grids.splice(gridIndex, 1);
            advanceLevel();
        }
    }

    // Player movement - simplified
    player.velocity.x = keys.arrowLeft.pressed ? -player.speed : 
                       keys.arrowRight.pressed ? player.speed : 0;

    frames++;
    
    // Debug panel update - only if exists
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) updateDebugPanel();
    
    updateMonitoringStatusEl(); // Always update info-panel monitoring status
}

async function startGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    await init();
    gameStartedTimestamp = Date.now();

    // Always start monitoring with every new game - use cached element
    const monitorUrlInput = elements.monitorUrlInput;
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

elements.musicButton.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    const musicIcon = elements.musicIcon;
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

// Optimized play button with cached elements
let hasGameStarted = false;

function showPlayOverlay() {
    elements.playOverlay.style.display = 'flex';
}

function hidePlayOverlay() {
    elements.playOverlay.style.display = 'none';
}

elements.playButton.addEventListener('click', async () => {
    if (hasGameStarted) return;
    hasGameStarted = true;
    
    // Get namespaces from input - use cached element
    const namespaceInput = elements.namespaceInput;
    let namespaces = [];
    if (namespaceInput) {
        namespaces = namespaceInput.value.split(/\r?\n/)
            .map(ns => ns.trim())
            .filter(ns => ns.length > 0);
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

// Optimized player name function
function getPlayerName() {
    return elements.playerNameInput?.value.trim() || '';
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