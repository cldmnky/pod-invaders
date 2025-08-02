// Player Class
import { ctx } from '../dom.js';
import { CANVAS_CENTER_X, CANVAS_HEIGHT, PI2 } from '../config.js';

export class Player {
    constructor() {
        this.width = 50;
        this.height = 40;
        this.position = { x: CANVAS_CENTER_X - 25, y: CANVAS_HEIGHT - 60 }; // Optimized calculation
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
        this.opacity = 1;
        this.haloTimer = 0; // Frames remaining for red halo
        this.haloMax = 60; // Duration for halo effect
        // Cache commonly used values
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        const headX = this.halfWidth, headY = this.halfHeight;
        
        // Draw glowing, fading red halo if hit - optimized
        if (this.haloTimer > 0) {
            const fade = this.haloTimer / this.haloMax;
            const pulse = 1.5 + Math.sin(window.frames * 0.3) * 1.5;
            ctx.save();
            ctx.globalAlpha = 0.6 * fade;
            ctx.beginPath();
            ctx.arc(headX, headY, 35 + pulse * 2, 0, PI2);
            ctx.strokeStyle = `rgba(255,56,96,${0.7 * fade})`;
            ctx.shadowColor = '#ff3860';
            ctx.shadowBlur = 18 * fade + pulse * 4;
            ctx.lineWidth = 8 + pulse * 2;
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw player character - cheerful monkey design
        // Draw ears
        ctx.fillStyle = '#A0522D';
        ctx.beginPath(); ctx.arc(headX - 20, headY - 5, 10, 0, PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX + 20, headY - 5, 10, 0, PI2); ctx.fill();
        
        // Draw main head
        ctx.beginPath(); ctx.arc(headX, headY, 20, 0, PI2); ctx.fill();
        
        // Draw face
        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath(); ctx.arc(headX, headY, 15, 0, PI2); ctx.fill();
        
        // Draw red mohawk/hat on top
        ctx.fillStyle = '#FF4444';
        ctx.beginPath(); ctx.arc(headX, headY - 18, 3, 0, PI2); ctx.fill();
        
        // Draw snout/muzzle area
        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath(); ctx.arc(headX, headY + 5, 8, 0, PI2); ctx.fill();
        
        // Draw white eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(headX - 6, headY - 3, 4, 0, PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX + 6, headY - 3, 4, 0, PI2); ctx.fill();
        
        // Draw black pupils
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(headX - 6, headY - 3, 2, 0, PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(headX + 6, headY - 3, 2, 0, PI2); ctx.fill();
        
        // Draw smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(headX, headY + 3, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    update() {
        this.draw();
        
        // Update position with boundaries
        this.position.x += this.velocity.x;
        if (this.position.x <= 0) this.position.x = 0;
        if (this.position.x >= 550) this.position.x = 550; // Canvas width - player width
        
        if (this.haloTimer > 0) this.haloTimer--;
    }
}
