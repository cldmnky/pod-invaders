// DOM Element Management
// Cache all DOM elements at once to reduce DOM lookups

export const elements = {
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
export const canvas = elements.canvas;
export const scoreEl = elements.scoreEl;
export const livesEl = elements.livesEl;
export const levelEl = elements.levelEl;
export const gameOverScreen = elements.gameOverScreen;
export const endGameTitle = elements.endGameTitle;
export const finalScoreEl = elements.finalScoreEl;
export const restartButton = elements.restartButton;
export const ctx = canvas.getContext('2d');
export const killedPodsList = elements.killedPodsList;
export const muteButton = elements.muteButton;
export const muteIcon = elements.muteIcon;
export const countdownOverlay = elements.countdownOverlay;
export const countdownText = elements.countdownText;

// Canvas setup
canvas.width = 600;
canvas.height = 600;

// Apply initial styling for proper spacing
function applyInitialStyling() {
    if (scoreEl) scoreEl.style.marginRight = '20px';
    if (livesEl) livesEl.style.marginRight = '20px';
    if (levelEl) levelEl.style.marginRight = '20px';
}

// Initialize DOM setup
export function initDOM() {
    applyInitialStyling();
}

// Audio Elements
export const audioElements = {
    shootSound: document.getElementById('shootSound'),
    explosionSound: document.getElementById('explosionSound'),
    backgroundMusic: document.getElementById('backgroundMusic'),
    backgroundBossMusic: document.getElementById('backgroundBossMusic'),
    hitBossSound: document.getElementById('hitBossSound'),
    explosionBossSound: document.getElementById('explosionBossSound'),
    countDownSound: document.getElementById('countDownSound')
};

// Extract commonly used audio elements
export const shootSound = audioElements.shootSound;
export const explosionSound = audioElements.explosionSound;
export const backgroundMusic = audioElements.backgroundMusic;
export const backgroundBossMusic = audioElements.backgroundBossMusic;
export const hitBossSound = audioElements.hitBossSound;
export const explosionBossSound = audioElements.explosionBossSound;
export const countDownSound = audioElements.countDownSound;
