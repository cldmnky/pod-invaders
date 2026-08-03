// Input Handling
import { initAudio } from './audio.js';
import { getGameState, togglePause, restartGame } from './game.js';

let inputHandlersSetup = false;

export function setupInputHandlers() {
    if (inputHandlersSetup) return; // Prevent duplicate event listeners

    // --- Keyboard: movement, WASD, pause, restart ---
    window.addEventListener('keydown', (event) => {
        // Ignore keys while typing in text fields / textareas
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return;
        }

        const gameState = getGameState();
        const key = event.key;

        // Pause / resume (only while a game is active)
        if ((key === 'p' || key === 'P' || key === 'Escape') && gameState.game.active && !gameState.game.over) {
            togglePause();
            event.preventDefault();
            return;
        }

        // Restart after a game has started (works on the game-over screen too)
        if ((key === 'r' || key === 'R') && gameState.game.started) {
            restartGame();
            event.preventDefault();
            return;
        }

        if (gameState.game.over) return;

        if (!gameState.game.active || gameState.game.paused) return;
        initAudio();

        switch (key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                gameState.keys.arrowLeft.pressed = true;
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                gameState.keys.arrowRight.pressed = true;
                event.preventDefault();
                break;
            case ' ':
            case 'w':
            case 'W':
                // Autofire is handled in the game loop; just mark the key as pressed
                gameState.keys.space.pressed = true;
                event.preventDefault();
                break;
        }
    });

    window.addEventListener('keyup', ({ key }) => {
        const gameState = getGameState();
        switch (key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                gameState.keys.arrowLeft.pressed = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                gameState.keys.arrowRight.pressed = false;
                break;
            case ' ':
            case 'w':
            case 'W':
                gameState.keys.space.pressed = false;
                break;
        }
    });

    // --- Touch controls (also work with mouse for testing) ---
    setupTouchControls();

    inputHandlersSetup = true;
}

function setupTouchControls() {
    const bindTouchButton = (el, onDown, onUp) => {
        if (!el) return;
        const down = (e) => {
            e.preventDefault();
            onDown();
        };
        const up = (e) => {
            e.preventDefault();
            onUp();
        };
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
    };

    const setKey = (name, value) => {
        const gameState = getGameState();
        if (gameState.keys[name]) {
            gameState.keys[name].pressed = value;
        }
    };

    bindTouchButton(document.getElementById('touchLeft'), () => setKey('arrowLeft', true), () => setKey('arrowLeft', false));
    bindTouchButton(document.getElementById('touchRight'), () => setKey('arrowRight', true), () => setKey('arrowRight', false));
    bindTouchButton(document.getElementById('touchFire'), () => setKey('space', true), () => setKey('space', false));
}
