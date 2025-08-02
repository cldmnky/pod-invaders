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
        // Cache boundary values
        this.leftBoundary = 0;
        this.rightBoundary = CANVAS_WIDTH - this.width;
    }

    draw() {
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        const healthBarWidth = this.width * (this.health / this.maxHealth);
        ctx.fillStyle = '#ff3860';
        ctx.fillRect(this.position.x, this.position.y - 20, this.width, 10);
        ctx.fillStyle = '#23d160';
        ctx.fillRect(this.position.x, this.position.y - 20, healthBarWidth, 10);
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

    shoot(projectiles) {
        // Fire with a random angle/spread
        const spread = Math.random() * 4 - 2; // -2 to +2
        projectiles.push(new InvaderProjectile({
            position: { x: this.position.x + 75, y: this.position.y + this.height }, // Use cached half-width
            velocity: { x: spread, y: bossProjectileSpeed },
            isBoss: true
        }));
    }

    takeDamage() {
        this.health--;
    }
}
