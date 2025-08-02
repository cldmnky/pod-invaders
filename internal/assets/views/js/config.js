// --- Game Configuration and Constants ---
// These control the core gameplay difficulty and scaling. Adjust for desired challenge.

/**
 * invaderProjectileSpeed: Speed of invader projectiles (pixels/frame).
 *   Example: 2 (easy), 3 (normal), 5 (hard). Higher = faster, harder to dodge.
 */
export let invaderProjectileSpeed = 2;
/**
 * bossProjectileSpeed: Speed of boss projectiles (pixels/frame).
 *   Example: 3 (easy), 4 (normal), 6 (hard). Higher = boss projectiles move faster.
 */
export let bossProjectileSpeed = 4;
/**
 * bossMaxHits: Hits required to kill boss. Example: 5 (easy), 7 (normal), 12 (hard). Higher = boss tougher.
 */
export let bossMaxHits = 7;
/**
 * bossVerticalAmplitude: Boss vertical movement amplitude (pixels). Example: 10 (easy), 20 (normal), 40 (hard). Higher = boss moves more up/down.
 */
export let bossVerticalAmplitude = 20;
/**
 * bossVerticalFrequency: Boss vertical movement frequency (radians/frame). Example: 0.005 (easy), 0.01 (normal), 0.03 (hard). Higher = boss moves up/down faster.
 */
export let bossVerticalFrequency = 0.01;
/**
 * invaderSpeed: Invader grid horizontal speed (pixels/frame). Example: 0.7 (easy), 1 (normal), 2 (hard). Higher = invaders move faster.
 */
export let invaderSpeed = 0.7;
/**
 * invaderProjectileFrequency: Frames between invader shots. Example: 400 (easy), 250 (normal), 100 (hard). Lower = invaders shoot more often.
 */
export let invaderProjectileFrequency = 150; // Adjusted for more frequent invader shots
/**
 * bossProjectileFrequency: Frames between boss shots. Example: 200 (easy), 120 (normal), 60 (hard). Lower = boss shoots more often.
 */
export let bossProjectileFrequency = 120;

// --- Difficulty scaling increments ---
/**
 * INVADER_SPEED_INCREMENT: Invader speed increase per non-boss level. Example: 0.1 (gentle), 0.2 (normal), 0.4 (aggressive).
 */
export const INVADER_SPEED_INCREMENT = 0.4;
/**
 * INVADER_REAL_POD_HITS: Number of hits required to kill a real pod invader. Example: 3 (gentle), 5 (normal), 7 (aggressive).
 */
export const INVADER_REAL_POD_HITS = 5;
/**
 * BOSS_MAX_HITS_INCREMENT: Boss health increase per boss level. Example: 2 (gentle), 5 (normal), 10 (aggressive).
 */
export const BOSS_MAX_HITS_INCREMENT = 10;
/**
 * BOSS_PROJECTILE_SPEED_INCREMENT: Boss projectile speed increase per boss level. Example: 0.2 (gentle), 0.5 (normal), 1 (aggressive).
 */
export const BOSS_PROJECTILE_SPEED_INCREMENT = 0.74;
/**
 * BOSS_VERTICAL_AMPLITUDE_INCREMENT: Boss vertical amplitude increase per boss level. Example: 2 (gentle), 5 (normal), 10 (aggressive).
 */
export const BOSS_VERTICAL_AMPLITUDE_INCREMENT = 10;
/**
 * BOSS_VERTICAL_FREQUENCY_INCREMENT: Boss vertical frequency increase per boss level. Example: 0.005 (gentle), 0.01 (normal), 0.02 (aggressive).
 */
export const BOSS_VERTICAL_FREQUENCY_INCREMENT = 0.02;
/**
 * BOSS_PROJECTILE_FREQUENCY_INCREMENT: Boss projectile frequency increase per boss level (frames less between shots). Example: 5 (gentle), 10 (normal), 20 (aggressive).
 */
export const BOSS_PROJECTILE_FREQUENCY_INCREMENT = 15;
/**
 * INVADER_PROJECTILE_FREQUENCY_INCREMENT: Invader projectile frequency increase per level (frames less between shots). Example: 5 (gentle), 10 (normal), 20 (aggressive).
 */
export const INVADER_PROJECTILE_FREQUENCY_INCREMENT = 10;

// --- Constants for resetting the game ---
export const INIT_INVADER_PROJECTILE_SPEED = invaderProjectileSpeed;
export const INIT_BOSS_PROJECTILE_SPEED = bossProjectileSpeed;
export const INIT_BOSS_MAX_HITS = bossMaxHits;
export const INIT_BOSS_VERTICAL_AMPLITUDE = bossVerticalAmplitude;
export const INIT_BOSS_VERTICAL_FREQUENCY = bossVerticalFrequency;
export const INIT_INVADER_SPEED = invaderSpeed;
export const INIT_INVADER_PROJECTILE_FREQUENCY = invaderProjectileFrequency;
export const INIT_BOSS_PROJECTILE_FREQUENCY = bossProjectileFrequency;

// Canvas constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 600;
export const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
export const CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;

// Math constants for performance
export const PI2 = Math.PI * 2;
export const PI_HALF = Math.PI / 2;

// --- Game Data ---
export const levelConfigs = [
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

export const podNames = [
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

// Functions to update configuration values
export function setInvaderProjectileSpeed(value) { invaderProjectileSpeed = value; }
export function setBossProjectileSpeed(value) { bossProjectileSpeed = value; }
export function setBossMaxHits(value) { bossMaxHits = value; }
export function setBossVerticalAmplitude(value) { bossVerticalAmplitude = value; }
export function setBossVerticalFrequency(value) { bossVerticalFrequency = value; }
export function setInvaderSpeed(value) { invaderSpeed = value; }
export function setInvaderProjectileFrequency(value) { invaderProjectileFrequency = value; }
export function setBossProjectileFrequency(value) { bossProjectileFrequency = value; }
