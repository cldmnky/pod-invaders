// Invader Class
import { ctx } from '../dom.js';
import { invaderProjectileSpeed, INVADER_REAL_POD_HITS } from '../config.js';
import { InvaderProjectile } from './projectiles.js';

// Invader types:
//  - normal: baseline pod, 1 hit (fake) / 5 hits (real)
//  - tanky:  extra hits, guaranteed power-up drop, high score
//  - shooter: fires projectiles much more often, mid score
export class Invader {
    constructor({ position, name, namespace, isRealPod, type = 'normal' }) {
        this.width = 35;
        this.height = 35;
        this.position = { x: position.x, y: position.y };
        this.name = name;
        this.namespace = namespace;
        this.isRealPod = isRealPod;
        this.type = type;
        this.isKilled = false; // Track if this pod has been killed
        this.hits = 0; // Track number of hits
        const baseHits = isRealPod ? INVADER_REAL_POD_HITS : 1;
        this.maxHits = type === 'tanky' ? baseHits + 2 : baseHits;
        if (type === 'tanky') {
            this.score = isRealPod ? 400 : 300;
        } else if (type === 'shooter') {
            this.score = isRealPod ? 250 : 150;
        } else {
            this.score = isRealPod ? 200 : 100;
        }
        // Cache commonly used values
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;
    }

    draw() {
        const x = this.position.x, y = this.position.y, w = this.width, h = this.height;
        ctx.save();
        if (this.type === 'tanky') {
            ctx.fillStyle = this.isRealPod ? '#1c4ea8' : '#c77800';
        } else if (this.type === 'shooter') {
            ctx.fillStyle = this.isRealPod ? '#5b8cff' : '#ffb74d';
        } else {
            ctx.fillStyle = this.isRealPod ? '#326ce5' : '#ff9800';
        }

        // Optimized hexagon drawing
        ctx.beginPath();
        ctx.moveTo(x + this.halfWidth, y);
        ctx.lineTo(x + w, y + h * 0.25);
        ctx.lineTo(x + w, y + h * 0.75);
        ctx.lineTo(x + this.halfWidth, y + h);
        ctx.lineTo(x, y + h * 0.75);
        ctx.lineTo(x, y + h * 0.25);
        ctx.closePath();
        ctx.fill();

        // Tanky pods get a thicker, brighter outline
        ctx.strokeStyle = this.type === 'tanky' ? '#ffdd57' : 'white';
        ctx.lineWidth = this.type === 'tanky' ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.rect(x + w * 0.25, y + h * 0.3, w * 0.5, h * 0.4);
        ctx.moveTo(x + w * 0.25, y + h * 0.3);
        ctx.lineTo(x + w * 0.4, y + h * 0.2);
        ctx.lineTo(x + w * 0.65, y + h * 0.2);
        ctx.lineTo(x + w * 0.75, y + h * 0.3);
        ctx.moveTo(x + w * 0.75, y + h * 0.3);
        ctx.lineTo(x + w * 0.65, y + h * 0.45);
        ctx.lineTo(x + w * 0.65, y + h * 0.6);
        ctx.lineTo(x + w * 0.75, y + h * 0.7);
        ctx.stroke();

        // Shooter pods get a small warning pip (fires often)
        if (this.type === 'shooter') {
            ctx.fillStyle = '#ff3860';
            ctx.beginPath();
            ctx.arc(x + w * 0.5, y + h * 0.5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    update({ velocity }) {
        this.draw();
        this.position.x += velocity.x;
        this.position.y += velocity.y;
    }

    shoot(invaderProjectiles) {
        // Add larger random angle to invader projectiles
        const angle = (Math.random() - 0.5) * 2.0; // -1.0 to +1.0
        const speed = invaderProjectileSpeed + (this.type === 'shooter' ? 1 : 0);
        invaderProjectiles.push(new InvaderProjectile({
            position: { x: this.position.x + this.halfWidth, y: this.position.y + this.height },
            velocity: { x: angle, y: speed },
        }));
    }
}
