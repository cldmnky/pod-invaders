// Particle and FlashingText Classes
import { ctx } from '../dom.js';
import { PI2 } from '../config.js';

export class Particle {
    constructor({ position, velocity, radius, color, fades }) {
        this.position = position; 
        this.velocity = velocity; 
        this.radius = radius;
        this.color = color; 
        this.opacity = 1; 
        this.fades = fades;
    }
    
    draw() {
        ctx.save(); 
        ctx.globalAlpha = this.opacity;
        ctx.beginPath(); 
        ctx.arc(this.position.x, this.position.y, this.radius, 0, PI2);
        ctx.fillStyle = this.color; 
        ctx.fill(); 
        ctx.closePath(); 
        ctx.restore();
    }
    
    update() {
        this.draw(); 
        this.position.x += this.velocity.x; 
        this.position.y += this.velocity.y;
        if (this.fades) this.opacity -= 0.01;
    }
}

export class FlashingText {
    constructor({ text, position }) {
        this.text = text; 
        this.position = position;
        this.opacity = 1; 
        this.life = 180;
    }
    
    draw() {
        ctx.save(); 
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = 'yellow'; 
        ctx.font = '16px "Courier New"';
        ctx.textAlign = 'center'; 
        ctx.fillText(this.text, this.position.x, this.position.y);
        ctx.restore();
    }
    
    update() { 
        this.draw(); 
        this.life--; 
        this.opacity -= 1 / 180; 
    }
}
