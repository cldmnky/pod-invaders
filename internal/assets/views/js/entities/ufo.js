// UFO Class - mystery bonus ship
import { ctx } from '../dom.js';
import { CANVAS_WIDTH, UFO_SPEED, UFO_MIN_VALUE, UFO_MAX_VALUE } from '../config.js';

export class Ufo {
    constructor() {
        this.width = 44;
        this.height = 24;
        // Enter from a random side
        this.direction = Math.random() < 0.5 ? 1 : -1;
        this.position = {
            x: this.direction === 1 ? -this.width : CANVAS_WIDTH,
            y: 40
        };
        this.velocity = { x: this.direction * UFO_SPEED, y: 0 };
        this.value = UFO_MIN_VALUE + Math.floor(Math.random() * (UFO_MAX_VALUE - UFO_MIN_VALUE + 1));
    }

    draw() {
        const x = this.position.x, y = this.position.y;
        ctx.save();
        // Body
        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2 + 3, this.width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Dome
        ctx.fillStyle = '#7ae1f9';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        // Lights
        ctx.fillStyle = '#ffdd57';
        ctx.beginPath(); ctx.arc(x + 8, y + this.height / 2 + 3, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 22, y + this.height / 2 + 3, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 36, y + this.height / 2 + 3, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
    }

    isOffScreen() {
        return this.position.x > CANVAS_WIDTH + this.width || this.position.x < -this.width * 2;
    }
}
