// Core Game Logic and State Management
import { 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    levelConfigs,
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
    INVADER_REAL_POD_HITS
} from './config.js';
import { ctx, gameOverScreen, countdownOverlay, endGameTitle, finalScoreEl } from './dom.js';
import { switchMusic, backgroundMusic, playExplosionSound, playhitBossSound, playExplosionBossSound, playCountDownSound } from './audio.js';
import { Player, Boss, Grid, FlashingText, Particle, Projectile } from './entities/index.js';
import { 
    releaseParticle, 
    releaseProjectile, 
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
    updateDebugPanel,
    getMonitorIsUp
} from './ui.js';
import { sendHighscore, reportKill, stopMonitor, stopMonitorStatusPolling } from './api.js';

// --- Game State ---
export let player = null, projectiles = [], grids = [], invaderProjectiles = [], particles = [], flashingTexts = [], boss = null;
export let keys = { 
    arrowLeft: { pressed: false }, 
    arrowRight: { pressed: false }, 
    space: { pressed: false } 
}, score = 0, lives = 3, level = 1, game = { over: false, active: false }, frames = 0;
export let animationId;
export let gameStartedTimestamp;

// Global frames counter for game entities
window.frames = 0;

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
    keys = { 
        arrowLeft: { pressed: false }, 
        arrowRight: { pressed: false }, 
        space: { pressed: false } 
    };
    
    // Use optimized update functions
    score = updateScore(0);
    lives = updateLives(3);
    level = updateLevel(1);
    
    game = { over: false, active: false };
    frames = 0;
    window.frames = 0;
    boss = null;
    grids = [];

    gameOverScreen.style.display = 'none';
    countdownOverlay.style.display = 'none';
    
    // Reset cached display values
    resetCachedDisplays();
}

function endGame() {
    game.over = true; 
    game.active = false;
    switchMusic(false, game); // Switch to normal music, then pause
    backgroundMusic.pause();
    stopMonitor();
    stopMonitorStatusPolling();
    
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

function winGame() {
    game.over = true; 
    game.active = false;
    switchMusic(false, game); // Switch to normal music, then pause
    backgroundMusic.pause();
    stopMonitor();
    stopMonitorStatusPolling();
    
    // --- Highscore submission ---
    const timeTaken = Date.now() - gameStartedTimestamp;
    const levelsFinished = level;
    const playerName = getPlayerName();
    
    // Award the player with 1000 points for each life remaining
    const bonusPoints = lives * 1000;
    const finalScore = score + bonusPoints;
    score = updateScore(finalScore); // Update score with bonus
    
    sendHighscore(playerName, gameStartedTimestamp, timeTaken, levelsFinished, score);
    
    setTimeout(() => {
        endGameTitle.innerHTML = 'YOU WIN!';
        endGameTitle.classList.remove('has-text-danger'); 
        endGameTitle.classList.add('has-text-success');
        finalScoreEl.innerHTML = `Final Score: ${score}`;
        gameOverScreen.style.display = 'block';
        showHighscoreTable();
    }, 1000);
}

export async function advanceLevel() {
    if (level >= levelConfigs.length) {
        winGame();
        return;
    }

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

    const isBossLevel = levelConfigs[level - 1] === null;
    if (isBossLevel) {
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
    switchMusic(isBossLevel, game);
}

export function animate() {
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
            lives = updateLives(lives - 1);
            player.haloTimer = 60;
            if (lives > 0) {
                createParticles({ object: player, color: 'white', amount: 15, particles });
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
                    amount: 8,
                    particles 
                });
                
                if (boss.health <= 0) {
                    score = updateScore(score + 1000);
                    createParticles({ object: boss, color: '#D92A2A', amount: 100, particles });
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
                            if (invader.hits >= INVADER_REAL_POD_HITS) {
                                score = updateScore(score + 200);
                                // Add random offset to prevent text overlap
                                const randomOffsetX = (Math.random() - 0.5) * 30; // -15 to +15 pixels
                                const randomOffsetY = (Math.random() - 0.5) * 20; // -10 to +10 pixels
                                flashingTexts.push(new FlashingText({ 
                                    text: `${invader.name} killed!`, 
                                    position: { 
                                        x: invader.position.x + 17 + randomOffsetX, 
                                        y: invader.position.y + randomOffsetY 
                                    } 
                                }));
                                createParticles({ object: invader, color: '#326ce5', amount: 15, particles });
                                playExplosionSound();
                                reportKill(invader.name, invader.namespace, invader.isRealPod);
                                addKilledPodToSidebar(invader.namespace, invader.name);
                                invader.isKilled = true;
                                hit = true;
                            } else {
                                // Add random offset to prevent text overlap
                                const randomOffsetX = (Math.random() - 0.5) * 30; // -15 to +15 pixels
                                const randomOffsetY = (Math.random() - 0.5) * 20; // -10 to +10 pixels
                                flashingTexts.push(new FlashingText({ 
                                    text: `Hit ${invader.hits}/${INVADER_REAL_POD_HITS}`, 
                                    position: { 
                                        x: invader.position.x + 17 + randomOffsetX, 
                                        y: invader.position.y + randomOffsetY 
                                    } 
                                }));
                                createParticles({ object: invader, color: '#326ce5', amount: 5, particles });
                            }
                        } else {
                            score = updateScore(score + 100);
                            createParticles({ object: invader, color: '#ff9800', amount: 15, particles });
                            playExplosionSound();
                            invader.isKilled = true;
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
    window.frames = frames;
    
    // Debug panel update - only if exists
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        updateDebugPanel({
            frames,
            score,
            level,
            lives,
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
    await init();
    gameStartedTimestamp = Date.now();

    // Always start monitoring with every new game
    if (monitorUrl) {
        try {
            const { startMonitor, startMonitorStatusPolling } = await import('./api.js');
            const monitorId = await startMonitor(monitorUrl);
            if (monitorId) {
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
    switchMusic(isBossLevel, game);
    animate();
}

// Export game state getters
export const getGameState = () => ({ 
    player, projectiles, grids, invaderProjectiles, particles, flashingTexts, boss,
    keys, score, lives, level, game, frames 
});
