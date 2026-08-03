// Boss Class
import { ctx } from '../dom.js';
import {
    CANVAS_CENTER_X,
    CANVAS_WIDTH,
    bossMaxHits,
    bossVerticalAmplitude,
    bossVerticalFrequency,
    bossProjectileSpeed
} from '../config.js';
import { InvaderProjectile } from './projectiles.js';

// Boss image - will be set by main.js
export let bossImage = null;
export function setBossImage(image) {
    bossImage = image;
}

export class Boss {
    constructor() {
        this.width = 150;
        this.height = 150;
        this.position = { x: CANVAS_CENTER_X - 75, y: 50 }; // Optimized calculation
        this.baseY = this.position.y; // Store initial Y position
        this.velocity = { x: 2, y: 0 };
        this.maxHealth = bossMaxHits;
        this.health = this.maxHealth;
        this.image = bossImage;
        this.nextFireFrame = 0;
        this.lastPhase = 1; // Tracks the last seen phase for transitions
        this.minionsSpawned = false; // Phase 3 summons minions once
        // Cache boundary values
        this.leftBoundary = 0;
        this.rightBoundary = CANVAS_WIDTH - this.width;
    }

    // Phase by health: 1 (>66%), 2 (33-66%), 3 (<33%)
    get phase() {
        const frac = this.health / this.maxHealth;
        if (frac > 0.66) return 1;
        if (frac > 0.33) return 2;
        return 3;
    }

    draw() {
        const phaseColor = this.phase === 3 ? '#ff3860' : this.phase === 2 ? '#ffdd57' : '#23d160';
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;

        // Use a soft phase-colored aura instead of a rectangular outline.
        // The sprite has transparent edges, so the aura keeps the boss readable
        // without making it look like it is inside a box.
        ctx.save();
        const aura = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, this.width * 0.72);
        aura.addColorStop(0, `${phaseColor}33`);
        aura.addColorStop(1, `${phaseColor}00`);
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width * 0.7, this.height * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        const healthBarWidth = this.width * (this.health / this.maxHealth);
        const barY = this.position.y - 20;
        ctx.fillStyle = '#35121b';
        ctx.fillRect(this.position.x, barY, this.width, 8);
        ctx.fillStyle = phaseColor;
        ctx.fillRect(this.position.x, barY, healthBarWidth, 8);
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        // Up/down movement using sine wave - optimized calculation
        this.position.y = this.baseY + bossVerticalAmplitude * Math.sin(window.frames * bossVerticalFrequency);

        // Boundary checking with cached values
        if (this.position.x <= this.leftBoundary || this.position.x >= this.rightBoundary) {
            this.velocity.x *= -1;
        }
    }

    // Attack patterns per phase:
    //  Phase 1: single spread shot
    //  Phase 2: twin shots, occasionally aimed at the player
    //  Phase 3: radial 5-shot burst
    shoot(projectiles, player) {
        const cx = this.position.x + 75;
        const cy = this.position.y + this.height;
        const speed = bossProjectileSpeed + (this.phase === 2 ? 1 : 0);

        if (this.phase === 3) {
            for (let a = -2; a <= 2; a++) {
                projectiles.push(new InvaderProjectile({
                    position: { x: cx, y: cy },
                    velocity: { x: a * 1.2, y: speed },
                    isBoss: true
                }));
            }
        } else if (this.phase === 2) {
            let aim = 0;
            if (player && Math.random() < 0.5) {
                aim = (player.position.x + player.width / 2 - cx) / 40;
            }
            projectiles.push(new InvaderProjectile({
                position: { x: cx - 10, y: cy },
                velocity: { x: aim - 0.8, y: speed },
                isBoss: true
            }));
            projectiles.push(new InvaderProjectile({
                position: { x: cx + 10, y: cy },
                velocity: { x: aim + 0.8, y: speed },
                isBoss: true
            }));
        } else {
            // Fire with a random angle/spread
            const spread = Math.random() * 4 - 2; // -2 to +2
            projectiles.push(new InvaderProjectile({
                position: { x: cx, y: cy },
                velocity: { x: spread, y: bossProjectileSpeed },
                isBoss: true
            }));
        }
    }

    takeDamage() {
        this.health--;
    }
}
