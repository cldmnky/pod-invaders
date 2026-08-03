// UI Functions - Score, Lives, Level, Highscore, Debug Panel
import { scoreEl, livesEl, levelEl, elements } from './dom.js';
import { POWERUP_TYPES } from './config.js';

// Performance optimization: Cache score display to reduce DOM updates
let lastScoreDisplay = '';
export function updateScore(newScore, score) {
    const scoreDisplay = `Score: ${newScore}`;
    if (scoreDisplay !== lastScoreDisplay) {
        scoreEl.innerHTML = scoreDisplay;
        scoreEl.style.marginRight = '20px'; // Add spacing
        lastScoreDisplay = scoreDisplay;
    }
    return newScore;
}

// Cache lives display
let lastLivesDisplay = '';
export function updateLives(newLives) {
    const livesDisplay = `Lives: ${newLives}`;
    if (livesDisplay !== lastLivesDisplay) {
        livesEl.innerHTML = livesDisplay;
        livesEl.style.marginRight = '20px'; // Add spacing
        lastLivesDisplay = livesDisplay;
    }
    return newLives;
}

// Cache level display
let lastLevelDisplay = '';
export function updateLevel(newLevel) {
    const levelDisplay = `Level: ${newLevel}`;
    if (levelDisplay !== lastLevelDisplay) {
        levelEl.innerHTML = levelDisplay;
        levelEl.style.marginRight = '20px'; // Add spacing
        lastLevelDisplay = levelDisplay;
    }
    return newLevel;
}

// Reset cached display values
export function resetCachedDisplays() {
    lastScoreDisplay = '';
    lastLivesDisplay = '';
    lastLevelDisplay = '';
    lastComboDisplay = '';
    lastPowerupDisplay = '';
}

// Combo multiplier display (cached to avoid needless DOM updates)
let lastComboDisplay = '';
export function updateComboDisplay(combo, multiplier) {
    const el = elements.comboEl;
    if (!el) return;
    const display = multiplier > 1 ? `x${multiplier} COMBO (${combo})` : '';
    if (display !== lastComboDisplay) {
        el.innerHTML = display;
        el.style.color = multiplier > 1 ? '#ffdd57' : '#999';
        lastComboDisplay = display;
    }
}

// Active power-up display (cached to avoid needless DOM updates)
let lastPowerupDisplay = '';
export function updatePowerupDisplay(powerups) {
    const el = elements.powerupEl;
    if (!el) return;
    if (!powerups || (!powerups.rapidFire && !powerups.tripleShot && !powerups.slowMo)) {
        if (lastPowerupDisplay !== '') {
            el.innerHTML = '';
            lastPowerupDisplay = '';
        }
        return;
    }
    const seconds = (frames) => Math.ceil(frames / 60);
    const parts = [];
    if (powerups.rapidFire > 0) parts.push(`<span style="color:${POWERUP_TYPES.rapid.color};">RAPID ${seconds(powerups.rapidFire)}s</span>`);
    if (powerups.tripleShot > 0) parts.push(`<span style="color:${POWERUP_TYPES.triple.color};">TRIPLE ${seconds(powerups.tripleShot)}s</span>`);
    if (powerups.slowMo > 0) parts.push(`<span style="color:${POWERUP_TYPES.slow.color};">SLOW ${seconds(powerups.slowMo)}s</span>`);
    const display = parts.join(' ');
    if (display !== lastPowerupDisplay) {
        el.innerHTML = display;
        lastPowerupDisplay = display;
    }
}

// Pause overlay
export function showPauseOverlay() {
    const overlay = elements.pauseOverlay;
    if (overlay) overlay.style.display = 'flex';
}

export function hidePauseOverlay() {
    const overlay = elements.pauseOverlay;
    if (overlay) overlay.style.display = 'none';
}

// Highscore functions
export function renderHighscoreTable(highscores) {
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

export function showHighscoreTable() {
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

// Killed pods sidebar
export let killedPods = [];

export function addKilledPodToSidebar(namespace, name) {
    killedPods.push(`${namespace}/${name}`);
    const killedPodsList = elements.killedPodsList;
    if (killedPodsList) {
        killedPodsList.textContent = killedPods.map((pod) => `💀 ${pod}`).join('\n');
        killedPodsList.parentElement.scrollTop = killedPodsList.parentElement.scrollHeight;
    }
}

export function resetKilledPods() {
    killedPods = [];
    const killedPodsList = elements.killedPodsList;
    if (killedPodsList) {
        killedPodsList.textContent = '';
    }
}

// Monitoring status
let monitorIsUp = false;

export function updateMonitoringStatusEl() {
    const el = elements.monitoringStatusEl;
    if (!el) return;
    if (monitorIsUp) {
        el.innerHTML = '<span style="color:#23d160;font-size:1.2em;">Monitoring: &#x2705;</span>';
    } else {
        el.innerHTML = '<span style="color:#ff3860;font-size:1.2em;">Monitoring: &#x274C;</span>';
    }
}

export function setMonitorIsUp(isUp) {
    monitorIsUp = isUp;
    updateMonitoringStatusEl();
}

export function getMonitorIsUp() {
    return monitorIsUp;
}

// Debug panel functions
export function showDebugPanel() {
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

export function updateDebugPanel(gameState = {}) {
    const info = document.getElementById('debugInfo');
    if (!info) return;

    const {
        frames = 0,
        score = 0,
        level = 1,
        lives = 3,
        combo = 0,
        multiplier = 1,
        invaderSpeed = 1,
        invaderProjectileSpeed = 3,
        bossProjectileSpeed = 4,
        bossMaxHits = 7,
        bossVerticalAmplitude = 20,
        bossVerticalFrequency = 0.01,
        grids = [],
        projectiles = [],
        invaderProjectiles = [],
        particles = [],
        flashingTexts = []
    } = gameState;

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
        <b>Combo:</b> x${multiplier} (${combo} kills)<br>
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

export function updateDebugPanelMonitorStatus(text) {
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
    setMonitorIsUp(/\bup\b/i.test(text));
}

// Player name function
export function getPlayerName() {
    return elements.playerNameInput?.value.trim() || '';
}
