// Core Game Logic and State Management
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    getLevelConfig,
    isBossLevel,
    INIT_INVADER_PROJECTILE_SPEED,
    INIT_BOSS_PROJECTILE_SPEED,
    INIT_BOSS_MAX_HITS,
    INIT_BOSS_VERTICAL_AMPLITUDE,
    INIT_BOSS_VERTICAL_FREQUENCY,
    INIT_INVADER_SPEED,
    INIT_INVADER_PROJECTILE_FREQUENCY,
    INIT_BOSS_PROJECTILE_FREQUENCY,
    setInvaderProjectileSpeed,
    setBossProjectileSpeed,
    setBossMaxHits,
    setBossVerticalAmplitude,
    setBossVerticalFrequency,
    setInvaderSpeed,
    setInvaderProjectileFrequency,
    setBossProjectileFrequency,
    invaderProjectileSpeed,
    bossProjectileSpeed,
    bossMaxHits,
    bossVerticalAmplitude,
    bossVerticalFrequency,
    invaderSpeed,
    invaderProjectileFrequency,
    bossProjectileFrequency,
    BOSS_MAX_HITS_INCREMENT,
    BOSS_PROJECTILE_SPEED_INCREMENT,
    BOSS_VERTICAL_AMPLITUDE_INCREMENT,
    BOSS_VERTICAL_FREQUENCY_INCREMENT,
    BOSS_PROJECTILE_FREQUENCY_INCREMENT,
    INVADER_PROJECTILE_FREQUENCY_INCREMENT,
    INVADER_SPEED_INCREMENT,
    PLAYER_FIRE_COOLDOWN,
    PLAYER_RAPID_FIRE_COOLDOWN,
    PLAYER_INVULNERABLE_FRAMES,
    PLAYER_SHOOT_SPEED,
    POWERUP_DROP_FAKE,
    POWERUP_DROP_REAL,
    POWERUP_RAPID_FIRE_DURATION,
    POWERUP_TRIPLE_SHOT_DURATION,
    POWERUP_SLOW_MO_DURATION,
    POWERUP_SLOW_MO_FACTOR,
    POWERUP_TYPES,
    COMBO_MULTIPLIER_STEP,
    COMBO_MULTIPLIER_MAX,
    UFO_SPAWN_MIN,
    UFO_SPAWN_MAX,
    SHAKE_MAX,
    SHAKE_DECAY
} from './config.js';
import { ctx, gameOverScreen, countdownOverlay, countdownText, elements, endGameTitle, finalScoreEl } from './dom.js';
import { switchMusic, backgroundMusic, playExplosionSound, playhitBossSound, playExplosionBossSound, playCountDownSound, playShootSound } from './audio.js';
import { Player, Boss, Grid, FlashingText, Particle, Projectile, Invader, PowerUp, Ufo } from './entities/index.js';
import {
    releaseParticle,
    releaseProjectile,
    getProjectile,
    checkRectCollision,
    checkCircleRectCollision,
    createParticles,
    setEntityClasses
} from './utils.js';
import {
    updateScore,
    updateLives,
    updateLevel,
    resetCachedDisplays,
    showHighscoreTable,
    getPlayerName,
    addKilledPodToSidebar,
    resetKilledPods,
    updateDebugPanel,
    updateComboDisplay,
    updatePowerupDisplay,
    showPauseOverlay,
    hidePauseOverlay,
    getMonitorIsUp
} from './ui.js';
import { sendHighscore, reportKill, stopMonitor, stopMonitorStatusPolling } from './api.js';

// --- Game State ---
export let player = null, projectiles = [], grids = [], invaderProjectiles = [], particles = [], flashingTexts = [], powerups = [], boss = null, ufo = null;
export let keys = {
    arrowLeft: { pressed: false },
    arrowRight: { pressed: false },
    space: { pressed: false }
}, score = 0, lives = 3, level = 1, game = { over: false, active: false, paused: false, started: false }, frames = 0;
export let combo = 0, multiplier = 1;
export let animationId;
export let gameStartedTimestamp;
let currentMonitorId = null;
let ufoSpawnFrame = 0;
let nextShotFrame = 0;
let shake = 0;
let levelTransitioning = false;

// Global frames counter for game entities
window.frames = 0;

// --- Helpers ---
function addShake(amount) {
    shake = Math.min(SHAKE_MAX, shake + amount);
}

function addFloatingText({ text, position, size = 16, color = 'yellow', life = 75 }) {
    const padding = 12;
    const lineHeight = size + 8;
    const measuredWidth = text.length * size * 0.62;
    const renderSize = measuredWidth > CANVAS_WIDTH - padding * 2
        ? Math.max(12, size * (CANVAS_WIDTH - padding * 2) / measuredWidth)
        : size;
    const width = Math.min(CANVAS_WIDTH - padding * 2, text.length * renderSize * 0.62);
    const height = renderSize + 8;
    const clampX = (x) => Math.max(width / 2 + padding, Math.min(CANVAS_WIDTH - width / 2 - padding, x));
    const clampY = (y) => Math.max(height + padding, Math.min(CANVAS_HEIGHT - padding, y));
    const base = { x: clampX(position.x), y: clampY(position.y) };
    const candidates = [
        base,
        { x: base.x, y: clampY(base.y - lineHeight) },
        { x: base.x, y: clampY(base.y + lineHeight) },
        { x: clampX(base.x - width * 0.45), y: base.y },
        { x: clampX(base.x + width * 0.45), y: base.y },
        { x: base.x, y: clampY(base.y - lineHeight * 2) },
        { x: base.x, y: clampY(base.y + lineHeight * 2) }
    ];

    // If several events happen together, move notifications into a dedicated
    // rail below the boss instead of allowing labels to pile up at the target.
    for (let y = 230; y <= 470; y += lineHeight + 6) {
        candidates.push({ x: CANVAS_WIDTH / 2, y: clampY(y) });
        candidates.push({ x: clampX(CANVAS_WIDTH * 0.25), y: clampY(y) });
        candidates.push({ x: clampX(CANVAS_WIDTH * 0.75), y: clampY(y) });
    }

    const getBounds = (candidate) => ({
        left: candidate.x - width / 2,
        right: candidate.x + width / 2,
        top: candidate.y - renderSize,
        bottom: candidate.y + 6
    });
    const overlaps = (a, b) => a.left < b.right + 4 && a.right > b.left - 4 &&
        a.top < b.bottom + 4 && a.bottom > b.top - 4;
    const bossBounds = boss ? {
        left: boss.position.x - 8,
        right: boss.position.x + boss.width + 8,
        top: boss.position.y - 28,
        bottom: boss.position.y + boss.height + 8
    } : null;
    const activeBounds = flashingTexts
        .filter((item) => item.life > 0 && item.layoutBounds)
        .map((item) => item.layoutBounds);

    const canUse = (candidate) => {
        const bounds = getBounds(candidate);
        const overlapsBoss = bossBounds && overlaps(bounds, bossBounds);
        return !overlapsBoss && activeBounds.every((existing) => !overlaps(bounds, existing));
    };
    let chosen = candidates.find(canUse);
    if (!chosen) {
        // Keep the no-overlap guarantee even during a very dense burst.
        const oldest = flashingTexts.find((item) => item.life > 0 && item.layoutBounds);
        if (oldest) {
            const oldBounds = oldest.layoutBounds;
            oldest.life = 0;
            oldest.layoutBounds = null;
            const oldIndex = activeBounds.indexOf(oldBounds);
            if (oldIndex >= 0) activeBounds.splice(oldIndex, 1);
        }
        chosen = candidates.find(canUse) || base;
    }

    const item = new FlashingText({
        text,
        position: chosen,
        size: renderSize,
        color,
        life
    });
    item.layoutBounds = getBounds(chosen);
    flashingTexts.push(item);
}

function pickPowerUpType() {
    const roll = Math.random();
    if (roll < 0.3) return 'rapid';
    if (roll < 0.5) return 'triple';
    if (roll < 0.7) return 'shield';
    if (roll < 0.85) return 'life';
    return 'slow';
}

function maybeDropPowerUp(x, y, isRealPod, guaranteed = false) {
    const chance = guaranteed ? 1 : (isRealPod ? POWERUP_DROP_REAL : POWERUP_DROP_FAKE);
    if (Math.random() < chance) {
        powerups.push(new PowerUp({ position: { x, y }, type: pickPowerUpType() }));
    }
}

function collectPowerUp(p) {
    switch (p.type) {
        case 'rapid':
            player.powerups.rapidFire = POWERUP_RAPID_FIRE_DURATION;
            break;
        case 'triple':
            player.powerups.tripleShot = POWERUP_TRIPLE_SHOT_DURATION;
            break;
        case 'slow':
            player.powerups.slowMo = POWERUP_SLOW_MO_DURATION;
            break;
        case 'shield':
            player.shield = true;
            break;
        case 'life':
            if (lives < 5) {
                lives = updateLives(lives + 1);
            } else {
                score = updateScore(score + 500);
            }
            break;
    }
    addFloatingText({
        text: `${POWERUP_TYPES[p.type].name}!`,
        position: { x: player.position.x + 25, y: player.position.y - 20 },
        size: 16,
        color: POWERUP_TYPES[p.type].color,
        life: 60
    });
}

function spawnMinionGrid() {
    if (!boss) return;
    const grid = new Grid();
    grid.totalInvaders = 2;
    grid.invaders = [
        new Invader({ position: { x: boss.position.x - 20, y: boss.position.y + boss.height + 20 }, name: 'minion-1', namespace: 'boss', isRealPod: false, type: 'normal' }),
        new Invader({ position: { x: boss.position.x + 50, y: boss.position.y + boss.height + 20 }, name: 'minion-2', namespace: 'boss', isRealPod: false, type: 'shooter' })
    ];
    grid.velocity = { x: invaderSpeed, y: 0 };
    grids.push(grid);
}

function playerShoot() {
    const px = player.position.x + player.width / 2;
    const py = player.position.y;
    const shots = player.powerups.tripleShot > 0 ? [-0.15, 0, 0.15] : [0];
    for (const dx of shots) {
        projectiles.push(getProjectile({
            position: { x: px, y: py },
            velocity: { x: dx, y: PLAYER_SHOOT_SPEED }
        }));
    }
    playShootSound();
}

function bumpCombo() {
    combo++;
    const newMultiplier = Math.min(COMBO_MULTIPLIER_MAX, 1 + Math.floor(combo / COMBO_MULTIPLIER_STEP));
    if (newMultiplier > multiplier) {
        multiplier = newMultiplier;
        addFloatingText({
            text: `x${multiplier} MULTIPLIER!`,
            position: { x: CANVAS_WIDTH / 2, y: 280 },
            size: 28,
            color: '#ffdd57',
            life: 60
        });
    }
    updateComboDisplay(combo, multiplier);
}

function resetCombo() {
    if (combo > 0) {
        combo = 0;
        multiplier = 1;
        updateComboDisplay(0, 1);
    }
}

export async function init() {
    // Set entity classes for object pools
    setEntityClasses(Particle, Projectile);

    // Reset difficulty variables to initial values
    setInvaderProjectileSpeed(INIT_INVADER_PROJECTILE_SPEED);
    setBossProjectileSpeed(INIT_BOSS_PROJECTILE_SPEED);
    setBossMaxHits(INIT_BOSS_MAX_HITS);
    setBossVerticalAmplitude(INIT_BOSS_VERTICAL_AMPLITUDE);
    setBossVerticalFrequency(INIT_BOSS_VERTICAL_FREQUENCY);
    setInvaderSpeed(INIT_INVADER_SPEED);
    setInvaderProjectileFrequency(INIT_INVADER_PROJECTILE_FREQUENCY);
    setBossProjectileFrequency(INIT_BOSS_PROJECTILE_FREQUENCY);

    player = new Player();
    projectiles = [];
    invaderProjectiles = [];
    particles = [];
    flashingTexts = [];
    powerups = [];
    keys = {
        arrowLeft: { pressed: false },
        arrowRight: { pressed: false },
        space: { pressed: false }
    };

    // Use optimized update functions
    score = updateScore(0);
    lives = updateLives(3);
    level = updateLevel(1);

    game = { over: false, active: false, paused: false, started: false };
    frames = 0;
    window.frames = 0;
    boss = null;
    grids = [];
    ufo = null;
    ufoSpawnFrame = 0;
    nextShotFrame = 0;
    shake = 0;
    levelTransitioning = false;
    combo = 0;
    multiplier = 1;
    updateComboDisplay(0, 1);
    updatePowerupDisplay(player.powerups);

    hidePauseOverlay();
    gameOverScreen.style.display = 'none';
    countdownOverlay.style.display = 'none';

    // Reset cached display values
    resetCachedDisplays();
}

function endGame() {
    game.over = true;
    game.active = false;
    game.paused = false;
    hidePauseOverlay();
    switchMusic(false, game); // Switch to normal music, then pause
    backgroundMusic.pause();
    stopMonitor(currentMonitorId);
    stopMonitorStatusPolling();
    currentMonitorId = null;

    // --- Highscore submission ---
    const timeTaken = Date.now() - gameStartedTimestamp;
    const levelsFinished = level;
    const playerName = getPlayerName();

    // Send highscore (fire and forget)
    sendHighscore(playerName, gameStartedTimestamp, timeTaken, levelsFinished, score);

    setTimeout(() => {
        player.opacity = 0;
        endGameTitle.innerHTML = 'GAME OVER';
        endGameTitle.classList.remove('has-text-success');
        endGameTitle.classList.add('has-text-danger');
        finalScoreEl.innerHTML = `Your Score: ${score}`;
        gameOverScreen.style.display = 'block';
        // Refresh highscore table after game over
        setTimeout(showHighscoreTable, 500);
    }, 1000);
    setTimeout(() => createParticles({ object: player, color: '#A0522D', amount: 30, particles }), 500);
}

export async function advanceLevel() {
    // Endless mode: there is no final level, difficulty keeps scaling.
    // Guard against double advancement (e.g. boss and minions both cleared).
    if (levelTransitioning) return;
    levelTransitioning = true;

    // Pause for 1 second before starting next level
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add 1000 points if monitoring is up
    if (getMonitorIsUp()) {
        score = updateScore(score + 1000);
    }

    level = updateLevel(level + 1);
    setInvaderProjectileSpeed(invaderProjectileSpeed + 0.2);
    boss = null;
    grids = [];
    ufo = null;
    ufoSpawnFrame = frames + UFO_SPAWN_MIN + Math.floor(Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN));

    const isBoss = isBossLevel(level);
    // Level intro banner
    addFloatingText({
        text: isBoss ? `BOSS LEVEL ${level}!` : `LEVEL ${level}`,
        // Keep the level banner below the boss sprite and health bar.
        position: { x: CANVAS_WIDTH / 2, y: 260 },
        size: 34,
        color: isBoss ? '#ff3860' : '#ffdd57',
        life: 90
    });

    if (isBoss) {
        // Use global increment variables for boss level difficulty scaling
        setBossMaxHits(bossMaxHits + BOSS_MAX_HITS_INCREMENT);
        setBossProjectileSpeed(bossProjectileSpeed + BOSS_PROJECTILE_SPEED_INCREMENT);
        setBossVerticalAmplitude(bossVerticalAmplitude + BOSS_VERTICAL_AMPLITUDE_INCREMENT);
        setBossVerticalFrequency(bossVerticalFrequency + BOSS_VERTICAL_FREQUENCY_INCREMENT);
        setBossProjectileFrequency(Math.max(40, bossProjectileFrequency - BOSS_PROJECTILE_FREQUENCY_INCREMENT)); // Increase boss firing rate
        boss = new Boss();
    } else {
        // Increase invader speed
        setInvaderSpeed(invaderSpeed + INVADER_SPEED_INCREMENT);
        // increase invader projectile frequency
        setInvaderProjectileFrequency(Math.max(60, invaderProjectileFrequency - INVADER_PROJECTILE_FREQUENCY_INCREMENT));
        const newGrid = new Grid();
        await newGrid.init(level);
        grids.push(newGrid);
    }
    game.active = true;
    switchMusic(isBoss, game);
    levelTransitioning = false;
}

export function animate() {
    if (!game.active) return;
    animationId = requestAnimationFrame(animate);

    if (game.paused) return;

    // Reset any leftover canvas transform (e.g. from a shake-aborted frame)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear canvas efficiently
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Screen shake
    ctx.save();
    if (shake > 0.5) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    player.update();

    // --- Autofire: hold SPACE to keep shooting ---
    if (keys.space.pressed && frames >= nextShotFrame) {
        playerShoot();
        nextShotFrame = frames + (player.powerups.rapidFire > 0 ? PLAYER_RAPID_FIRE_COOLDOWN : PLAYER_FIRE_COOLDOWN);
    }

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

        // Slow-mo power-up slows invader projectiles (temporary, per frame)
        const vy = proj.velocity.y;
        if (player.powerups.slowMo > 0) {
            proj.velocity.y = vy * POWERUP_SLOW_MO_FACTOR;
        }
        proj.update();
        proj.velocity.y = vy;

        // Player collision check using optimized function
        if (player.invulnerableTimer <= 0 && checkRectCollision(
            { x: proj.position.x, y: proj.position.y, width: proj.width, height: proj.height },
            { x: player.position.x, y: player.position.y, width: player.width, height: player.height }
        )) {
            invaderProjectiles.splice(i, 1);
            // Shield absorbs one hit
            if (player.shield) {
                player.shield = false;
                addShake(6);
                player.flashTimer = 30;
                addFloatingText({
                    text: 'SHIELD DOWN!',
                    position: { x: player.position.x + 25, y: player.position.y - 20 },
                    size: 16,
                    color: '#3298dc',
                    life: 60
                });
                continue;
            }
            resetCombo();
            lives = updateLives(lives - 1);
            player.haloTimer = 60;
            player.invulnerableTimer = PLAYER_INVULNERABLE_FRAMES;
            player.flashTimer = 30;
            addShake(10);
            if (lives > 0) {
                createParticles({ object: player, color: 'white', amount: 15, particles });
            } else {
                endGame();
            }
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

    // --- Power-up drops ---
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.update();
        if (p.position.y >= CANVAS_HEIGHT) {
            powerups.splice(i, 1);
            continue;
        }
        if (checkRectCollision(
            { x: p.position.x, y: p.position.y, width: p.width, height: p.height },
            { x: player.position.x, y: player.position.y, width: player.width, height: player.height }
        )) {
            powerups.splice(i, 1);
            collectPowerUp(p);
        }
    }
    // Keep the power-up HUD ticking down (cached in ui.js, cheap)
    if (frames % 15 === 0) {
        updatePowerupDisplay(player.powerups);
    }

    // --- Mystery UFO ---
    if (!ufo && game.active && frames >= ufoSpawnFrame) {
        ufo = new Ufo();
    }
    if (ufo) {
        ufo.update();
        if (ufo.isOffScreen()) {
            ufo = null;
            ufoSpawnFrame = frames + UFO_SPAWN_MIN + Math.floor(Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN));
        } else {
            // UFO hit by player projectile
            for (let j = projectiles.length - 1; j >= 0; j--) {
                const projectile = projectiles[j];
                if (checkCircleRectCollision(
                    { x: projectile.position.x, y: projectile.position.y, radius: projectile.radius },
                    { x: ufo.position.x, y: ufo.position.y, width: ufo.width, height: ufo.height }
                )) {
                    projectiles.splice(j, 1);
                    bumpCombo();
                    const points = ufo.value * multiplier;
                    score = updateScore(score + points);
                    addFloatingText({
                        text: `UFO +${points}!`,
                        position: { x: ufo.position.x + 22, y: ufo.position.y },
                        size: 16,
                        color: '#9d4edd',
                        life: 60
                    });
                    createParticles({ object: ufo, color: '#9d4edd', amount: 20, particles });
                    playExplosionSound();
                    maybeDropPowerUp(ufo.position.x + 22, ufo.position.y + 12, false, true);
                    ufo = null;
                    ufoSpawnFrame = frames + UFO_SPAWN_MIN + Math.floor(Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN));
                    break;
                }
            }
        }
    }

    // --- Boss logic optimization ---
    if (boss) {
        boss.update();

        // Phase transitions
        if (boss.phase !== boss.lastPhase) {
            boss.lastPhase = boss.phase;
            addShake(12);
            addFloatingText({
                text: boss.phase === 3 ? 'ENRAGED!' : 'PHASE 2!',
                // Keep phase alerts in the notification lane below the boss.
                position: { x: CANVAS_WIDTH / 2, y: 260 },
                size: 28,
                color: '#ff3860',
                life: 60
            });
            if (boss.phase === 3 && !boss.minionsSpawned) {
                boss.minionsSpawned = true;
                spawnMinionGrid();
            }
        }

        if (frames >= boss.nextFireFrame) {
            boss.shoot(invaderProjectiles, player);
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
                    amount: 8,
                    particles
                });

                if (boss.health <= 0) {
                    bumpCombo();
                    score = updateScore(score + 1000 * multiplier);
                    createParticles({ object: boss, color: '#D92A2A', amount: 100, particles });
                    playExplosionBossSound();
                    playExplosionSound();
                    addShake(14);
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

        // Invader shooting logic - shooter types are weighted 3x
        if (frames % invaderProjectileFrequency === 0 && grid.invaders.length > 0) {
            let totalWeight = 0;
            for (const inv of grid.invaders) {
                totalWeight += inv.type === 'shooter' ? 3 : 1;
            }
            let roll = Math.random() * totalWeight;
            let shooter = grid.invaders[0];
            for (const inv of grid.invaders) {
                roll -= inv.type === 'shooter' ? 3 : 1;
                if (roll <= 0) {
                    shooter = inv;
                    break;
                }
            }
            shooter.shoot(invaderProjectiles);
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
                        invader.hits++;
                        if (invader.hits >= invader.maxHits) {
                            bumpCombo();
                            const points = invader.score * multiplier;
                            score = updateScore(score + points);
                            addFloatingText({
                                text: `${invader.name} killed! +${points}`,
                                position: { x: invader.position.x + 17, y: invader.position.y },
                                size: 16,
                                color: invader.isRealPod ? '#7ae1f9' : '#ffdd57',
                                life: 90
                            });
                            createParticles({ object: invader, color: '#326ce5', amount: 15, particles });
                            playExplosionSound();
                            addKilledPodToSidebar(invader.namespace, invader.name);
                            if (invader.isRealPod) {
                                reportKill(invader.name, invader.namespace, invader.isRealPod);
                            }
                            maybeDropPowerUp(
                                invader.position.x + 17,
                                invader.position.y + 17,
                                invader.isRealPod,
                                invader.type === 'tanky'
                            );
                            invader.isKilled = true;
                            hit = true;
                        } else {
                            addFloatingText({
                                text: `Hit ${invader.hits}/${invader.maxHits}`,
                                position: { x: invader.position.x + 17, y: invader.position.y },
                                size: 15,
                                color: '#ffdd57',
                                life: 45
                            });
                            createParticles({ object: invader, color: '#326ce5', amount: 5, particles });
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

    // Decay screen shake
    shake *= SHAKE_DECAY;
    if (shake < 0.5) shake = 0;
    ctx.restore();

    frames++;
    window.frames = frames;

    // Debug panel update - only if exists
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        updateDebugPanel({
            frames,
            score,
            level,
            lives,
            combo,
            multiplier,
            invaderSpeed,
            invaderProjectileSpeed,
            bossProjectileSpeed,
            bossMaxHits,
            bossVerticalAmplitude,
            bossVerticalFrequency,
            grids,
            projectiles,
            invaderProjectiles,
            particles,
            flashingTexts
        });
    }
}

export async function startGame(countdownText, monitorUrl = '') {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Stop any existing monitor before starting a new one
    if (currentMonitorId) {
        stopMonitor(currentMonitorId);
        stopMonitorStatusPolling();
        currentMonitorId = null;
    }

    await init();
    game.started = true;
    gameStartedTimestamp = Date.now();

    // Always start monitoring with every new game
    if (monitorUrl) {
        try {
            const { startMonitor, startMonitorStatusPolling } = await import('./api.js');
            const monitorId = await startMonitor(monitorUrl);
            if (monitorId) {
                currentMonitorId = monitorId;
                startMonitorStatusPolling(monitorId);
            }
        } catch (e) {
            console.error('Failed to send monitor URL:', e);
        }
    }

    if (isBossLevel(level)) {
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

    // Schedule the first mystery UFO
    ufoSpawnFrame = frames + UFO_SPAWN_MIN + Math.floor(Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN));

    game.active = true;
    switchMusic(isBossLevel(level), game);
    animate();
}

export function togglePause() {
    if (!game.active || game.over) return;
    game.paused = !game.paused;
    if (game.paused) {
        showPauseOverlay();
    } else {
        hidePauseOverlay();
    }
}

export function restartGame() {
    resetKilledPods();
    const monitorUrl = elements.monitorUrlInput?.value.trim() || '';
    startGame(countdownText, monitorUrl);
}

// Export game state getters
export const getGameState = () => ({
    player, projectiles, grids, invaderProjectiles, particles, flashingTexts, boss, ufo, powerups,
    keys, score, lives, level, game, frames, combo, multiplier
});
