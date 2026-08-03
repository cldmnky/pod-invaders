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
 * BOSS_MAX_HITS_INCREMENT: Boss health increase per boss level. Example: 2 (gentle), 3 (normal), 5 (aggressive).
 */
export const BOSS_MAX_HITS_INCREMENT = 3;
/**
 * BOSS_PROJECTILE_SPEED_INCREMENT: Boss projectile speed increase per boss level. Example: 0.2 (gentle), 0.3 (normal), 0.5 (aggressive).
 */
export const BOSS_PROJECTILE_SPEED_INCREMENT = 0.3;
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
export const BOSS_PROJECTILE_FREQUENCY_INCREMENT = 10;
/**
 * INVADER_PROJECTILE_FREQUENCY_INCREMENT: Invader projectile frequency increase per level (frames less between shots). Example: 5 (gentle), 10 (normal), 20 (aggressive).
 */
export const INVADER_PROJECTILE_FREQUENCY_INCREMENT = 10;

// --- Player tuning ---
/**
 * PLAYER_FIRE_COOLDOWN: Frames between shots while holding SPACE (autofire).
 */
export const PLAYER_FIRE_COOLDOWN = 10;
/**
 * PLAYER_RAPID_FIRE_COOLDOWN: Frames between shots with the rapid-fire power-up.
 */
export const PLAYER_RAPID_FIRE_COOLDOWN = 3;
/**
 * PLAYER_INVULNERABLE_FRAMES: Invulnerability duration after being hit (frames).
 */
export const PLAYER_INVULNERABLE_FRAMES = 90;
/**
 * PLAYER_SHOOT_SPEED: Player projectile vertical speed (pixels/frame).
 */
export const PLAYER_SHOOT_SPEED = -10;

// --- Power-up tuning ---
/**
 * POWERUP_DROP_FAKE: Chance a fake pod drops a power-up when killed.
 */
export const POWERUP_DROP_FAKE = 0.08;
/**
 * POWERUP_DROP_REAL: Chance a real pod drops a power-up when killed (chaos is rewarded).
 */
export const POWERUP_DROP_REAL = 0.15;
/**
 * POWERUP_RAPID_FIRE_DURATION: Rapid fire duration (frames).
 */
export const POWERUP_RAPID_FIRE_DURATION = 600;
/**
 * POWERUP_TRIPLE_SHOT_DURATION: Triple shot duration (frames).
 */
export const POWERUP_TRIPLE_SHOT_DURATION = 600;
/**
 * POWERUP_SLOW_MO_DURATION: Slow-mo duration (frames).
 */
export const POWERUP_SLOW_MO_DURATION = 360;
/**
 * POWERUP_SLOW_MO_FACTOR: Invader projectile speed multiplier while slow-mo is active.
 */
export const POWERUP_SLOW_MO_FACTOR = 0.5;
/**
 * POWERUP_FALL_SPEED: Vertical speed of falling power-ups (pixels/frame).
 */
export const POWERUP_FALL_SPEED = 1.5;
/**
 * POWERUP_TYPES: Available power-up types with display letter and color.
 */
export const POWERUP_TYPES = {
    rapid:  { label: 'R', color: '#ffdd57', name: 'Rapid Fire' },
    triple: { label: 'T', color: '#23d160', name: 'Triple Shot' },
    shield: { label: 'S', color: '#3298dc', name: 'Shield' },
    life:   { label: '+', color: '#ff3860', name: 'Extra Life' },
    slow:   { label: 'F', color: '#7ae1f9', name: 'Slow-Mo' }
};

// --- Combo tuning ---
/**
 * COMBO_MULTIPLIER_STEP: Kills needed to increase the score multiplier by 1.
 */
export const COMBO_MULTIPLIER_STEP = 5;
/**
 * COMBO_MULTIPLIER_MAX: Maximum score multiplier.
 */
export const COMBO_MULTIPLIER_MAX = 5;

// --- UFO tuning ---
/**
 * UFO_SPAWN_MIN / UFO_SPAWN_MAX: Frames between UFO spawn attempts (random within range).
 */
export const UFO_SPAWN_MIN = 1200;
export const UFO_SPAWN_MAX = 2100;
/**
 * UFO_SPEED: UFO horizontal speed (pixels/frame).
 */
export const UFO_SPEED = 2.5;
/**
 * UFO_MIN_VALUE / UFO_MAX_VALUE: UFO score range.
 */
export const UFO_MIN_VALUE = 200;
export const UFO_MAX_VALUE = 500;

// --- Game feel ---
/**
 * SHAKE_MAX: Maximum screen shake amplitude (pixels).
 */
export const SHAKE_MAX = 16;
/**
 * SHAKE_DECAY: Screen shake decay per frame.
 */
export const SHAKE_DECAY = 0.88;

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

// getLevelConfig returns the level configuration, generating procedurally
// after the fixed campaign ends (endless mode). Boss levels every 2 levels,
// grid size cycles with a cap so the game stays playable forever.
export function getLevelConfig(level) {
    if (level <= levelConfigs.length) {
        return levelConfigs[level - 1];
    }
    const idx = level - levelConfigs.length; // 1-based index into endless progression
    if (idx % 2 === 0) {
        return null; // Boss level
    }
    const nonBossIdx = Math.ceil(idx / 2); // 1, 2, 3, ... counting non-boss endless levels
    const cycle = (nonBossIdx - 1) % 4; // 0..3
    return { rows: 2 + cycle, cols: 3 + cycle };
}

// isBossLevel returns true when the given level is a boss level.
export function isBossLevel(level) {
    return getLevelConfig(level) === null;
}

export const fakeNamespaceNames = [
    "tiger", "lion", "elephant", "giraffe", "zebra", "panda", "koala", "kangaroo",
    "penguin", "dolphin", "whale", "shark", "octopus", "crab", "lobster", "jellyfish"
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
