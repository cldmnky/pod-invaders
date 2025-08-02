// Projectile Classes
import { ctx } from '../dom.js';
import { PI2 } from '../config.js';

export class Projectile {
    constructor({ position, velocity, radius = 4 }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, PI2);
        ctx.fillStyle = '#ffdd57';
        ctx.fill();
        ctx.closePath();
    }
    
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

export class InvaderProjectile {
    constructor({ position, velocity, isBoss = false }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 3;
        this.height = 10;
        this.isBoss = isBoss;
    }
    
    draw() {
        if (this.isBoss) {
            // Draw tiny robot projectile for boss
            this.drawRobot();
        } else {
            // Draw missile for regular invaders
            this.drawMissile();
        }
    }
    
    drawMissile() {
        const x = this.position.x;
        const y = this.position.y;
        
        // Missile body (gray) - made wider and taller
        ctx.fillStyle = '#666666';
        ctx.fillRect(x - 3, y, 6, 16);
        
        // Missile tip (red) - made bigger
        ctx.fillStyle = '#ff3860';
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.closePath();
        ctx.fill();
        
        // Fins (darker gray) - made bigger
        ctx.fillStyle = '#444444';
        ctx.fillRect(x - 4, y + 11, 3, 4);
        ctx.fillRect(x + 1, y + 11, 3, 4);
        
        // Flame effect at the back - made bigger
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(x - 2, y + 16, 4, 3);
    }
    
    drawRobot() {
        const x = this.position.x;
        const y = this.position.y;
        
        // Robot head (gray) - made bigger
        ctx.fillStyle = '#888888';
        ctx.fillRect(x - 4, y, 8, 8);
        
        // Robot eyes (red) - made bigger
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - 3, y + 2, 2, 2);
        ctx.fillRect(x + 1, y + 2, 2, 2);
        
        // Robot body (darker gray) - made bigger
        ctx.fillStyle = '#666666';
        ctx.fillRect(x - 3, y + 8, 6, 6);
        
        // Robot arms (extending slightly) - made bigger
        ctx.fillStyle = '#888888';
        ctx.fillRect(x - 6, y + 9, 3, 3);
        ctx.fillRect(x + 3, y + 9, 3, 3);
        
        // Robot legs - made bigger
        ctx.fillRect(x - 3, y + 14, 2, 3);
        ctx.fillRect(x + 1, y + 14, 2, 3);
    }
    
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}
