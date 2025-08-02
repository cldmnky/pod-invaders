// Main Entry Point - Pod Invaders Game
import { initDOM, elements, muteIcon, muteButton } from './dom.js';
import { initAudio, isMuted, isMusicOn, setMuted, setMusicOn, switchMusic, backgroundMusic, backgroundBossMusic } from './audio.js';
import { setBossImage } from './entities/index.js';
import { levelConfigs } from './config.js';
import { startGame, getGameState } from './game.js';
import { setupInputHandlers } from './input.js';
import { 
    showHighscoreTable, 
    resetKilledPods, 
    showDebugPanel 
} from './ui.js';
import { sendNamespaces } from './api.js';

// Initialize the game
async function initialize() {
    // Initialize DOM
    initDOM();
    
    // Load boss image
    const bossImage = new Image();
    bossImage.src = 'assets/boss.png';
    setBossImage(bossImage);
    
    // Setup input handlers
    setupInputHandlers();
    
    // Setup UI event handlers
    setupUIEventHandlers();
    
    // Show highscore table on load
    showHighscoreTable();
    
    // Show debug panel if requested
    if (window.location.search.includes('debug=true')) {
        showDebugPanel();
    }
}

function setupUIEventHandlers() {
    // Mute button handler
    elements.muteButton.addEventListener('click', () => {
        initAudio();
        const newMuted = !isMuted;
        setMuted(newMuted);
        
        if (newMuted) {
            muteIcon.classList.remove('fa-volume-up');
            muteIcon.classList.add('fa-volume-mute');
            backgroundMusic.pause();
            backgroundBossMusic.pause();
        } else {
            muteIcon.classList.remove('fa-volume-mute');
            muteIcon.classList.add('fa-volume-up');
            const gameState = getGameState();
            if (gameState.game.active) {
                const isBossLevel = levelConfigs[gameState.level - 1] === null;
                switchMusic(isBossLevel, gameState.game);
            }
        }
    });

    // Music button handler
    elements.musicButton.addEventListener('click', () => {
        const newMusicOn = !isMusicOn;
        setMusicOn(newMusicOn);
        const musicIcon = elements.musicIcon;
        
        if (!newMusicOn) {
            musicIcon.classList.remove('fa-music');
            musicIcon.classList.add('fa-music-slash');
            backgroundMusic.pause();
            backgroundBossMusic.pause();
        } else {
            musicIcon.classList.remove('fa-music-slash');
            musicIcon.classList.add('fa-music');
            const gameState = getGameState();
            if (gameState.game.active) {
                const isBossLevel = levelConfigs[gameState.level - 1] === null;
                switchMusic(isBossLevel, gameState.game);
            }
        }
    });

    // Restart button handler
    elements.restartButton.addEventListener('click', () => {
        resetKilledPods();
        const monitorUrl = elements.monitorUrlInput?.value.trim() || '';
        startGame(elements.countdownText, monitorUrl);
    });

    // Play button handler
    let hasGameStarted = false;
    
    elements.playButton.addEventListener('click', async () => {
        console.log('Play button clicked, hasGameStarted:', hasGameStarted);
        if (hasGameStarted) return;
        hasGameStarted = true;
        
        // Get namespaces from input
        const namespaceInput = elements.namespaceInput;
        let namespaces = [];
        if (namespaceInput) {
            namespaces = namespaceInput.value.split(/\r?\n/)
                .map(ns => ns.trim())
                .filter(ns => ns.length > 0);
            if (namespaces.length > 0) {
                await sendNamespaces(namespaces);
            }
        }
        
        hidePlayOverlay();
        const monitorUrl = elements.monitorUrlInput?.value.trim() || '';
        await startGame(elements.countdownText, monitorUrl);
    });
}

function showPlayOverlay() {
    elements.playOverlay.style.display = 'flex';
}

function hidePlayOverlay() {
    elements.playOverlay.style.display = 'none';
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    initialize();
    showPlayOverlay();
});

// Export for debugging
window.gameDebug = {
    getGameState,
    showDebugPanel
};
