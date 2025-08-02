// Invader Class
import { ctx } from '../dom.js';
import { invaderProjectileSpeed, INVADER_REAL_POD_HITS } from '../config.js';
import { InvaderProjectile } from './projectiles.js';

export class Invader {
    constructor({ position, name, namespace, isRealPod }) {
        this.width = 35; 
        this.height = 35;
        this.position = { x: position.x, y: position.y };
        this.name = name; 
        this.namespace = namespace;
        this.isRealPod = isRealPod; 
        this.isKilled = false; // Track if this pod has been killed
        this.hits = 0; // Track number of hits for real pods
        // Cache commonly used values
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;
    }
    
    draw() {
        const x = this.position.x, y = this.position.y, w = this.width, h = this.height;
        ctx.save();
        ctx.fillStyle = this.isRealPod ? '#326ce5' : '#ff9800';
        
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
        
        // Optimized detail drawing
        ctx.strokeStyle = 'white'; 
        ctx.lineWidth = 1.5;
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
        invaderProjectiles.push(new InvaderProjectile({
            position: { x: this.position.x + this.halfWidth, y: this.position.y + this.height },
            velocity: { x: angle, y: invaderProjectileSpeed },
        }));
    }
}
