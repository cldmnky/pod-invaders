// PowerUp Class
import { ctx } from '../dom.js';
import { POWERUP_TYPES, POWERUP_FALL_SPEED } from '../config.js';

export class PowerUp {
    constructor({ position, type }) {
        this.type = type; // rapid | triple | shield | life | slow
        this.width = 22;
        this.height = 22;
        this.position = { x: position.x - 11, y: position.y - 11 };
        this.velocity = { x: 0, y: POWERUP_FALL_SPEED };
    }

    draw() {
        const meta = POWERUP_TYPES[this.type] || POWERUP_TYPES.rapid;
        const x = this.position.x, y = this.position.y, w = this.width, h = this.height;
        ctx.save();
        // Glowing outer ring
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 2, 0, Math.PI * 2);
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = meta.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        // Body
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 - 3, 0, Math.PI * 2);
        ctx.fillStyle = meta.color;
        ctx.fill();
        // Label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.label, x + w / 2, y + h / 2 + 1);
        ctx.restore();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}
