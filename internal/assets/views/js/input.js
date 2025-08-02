// Input Handling
import { initAudio, playShootSound } from './audio.js';
import { getProjectile } from './utils.js';
import { getGameState } from './game.js';

let inputHandlersSetup = false;

export function setupInputHandlers() {
    if (inputHandlersSetup) return; // Prevent duplicate event listeners
    
    // --- Event Listeners ---
    window.addEventListener('keydown', ({ key }) => {
        const gameState = getGameState();
        console.log('Keydown:', key, 'Game active:', gameState.game.active, 'Game over:', gameState.game.over);
        if (gameState.game.over || !gameState.game.active) return;
        initAudio();

        switch (key) {
            case 'ArrowLeft': 
                gameState.keys.arrowLeft.pressed = true; 
                break;
            case 'ArrowRight': 
                gameState.keys.arrowRight.pressed = true; 
                break;
            case ' ':
                if (!gameState.keys.space.pressed) {
                    const projectile = getProjectile({ 
                        position: { x: gameState.player.position.x + gameState.player.width / 2, y: gameState.player.position.y }, 
                        velocity: { x: 0, y: -10 } 
                    });
                    gameState.projectiles.push(projectile);
                    gameState.keys.space.pressed = true;
                    playShootSound();
                }
                break;
        }
    });

    window.addEventListener('keyup', ({ key }) => {
        const gameState = getGameState();
        switch (key) {
            case 'ArrowLeft': 
                gameState.keys.arrowLeft.pressed = false; 
                break;
            case 'ArrowRight': 
                gameState.keys.arrowRight.pressed = false; 
                break;
            case ' ': 
                gameState.keys.space.pressed = false; 
                break;
        }
    });
    
    inputHandlersSetup = true;
}
