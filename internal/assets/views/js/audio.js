// Audio System Management
import { 
    shootSound, 
    explosionSound, 
    backgroundMusic, 
    backgroundBossMusic, 
    hitBossSound, 
    explosionBossSound, 
    countDownSound 
} from './dom.js';

// Export audio elements for use by other modules
export { 
    shootSound, 
    explosionSound, 
    backgroundMusic, 
    backgroundBossMusic, 
    hitBossSound, 
    explosionBossSound, 
    countDownSound 
};

// Audio state
let audioContext;
let isAudioInitialized = false;
export let isMuted = false;
export let isMusicOn = true;

export function initAudio() {
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

export function playShootSound() {
    playAudioElement(shootSound, 'Could not play shoot sound:');
}

export function playExplosionSound() {
    playAudioElement(explosionSound, 'Could not play explosion sound:');
}

export function playhitBossSound() {
    playAudioElement(hitBossSound, 'Could not play boss hit sound:');
}

export function playExplosionBossSound() {
    playAudioElement(explosionBossSound, 'Could not play boss explosion sound:');
}

export function playCountDownSound() {
    if (!countDownSound) return;
    try {
        countDownSound.currentTime = 0;
        countDownSound.play();
    } catch (e) {
        console.warn('Could not play countdown sound:', e);
    }
}

export function switchMusic(isBossLevel, game) {
    backgroundMusic.pause();
    backgroundBossMusic.pause();
    if (isMuted || !game.active || !isMusicOn) return;
    const musicToPlay = isBossLevel ? backgroundBossMusic : backgroundMusic;
    musicToPlay.currentTime = 0;
    musicToPlay.play().catch(() => { });
}

export function setMuted(muted) {
    isMuted = muted;
}

export function setMusicOn(musicOn) {
    isMusicOn = musicOn;
}
