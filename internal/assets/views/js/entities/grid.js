// Grid Class
import { getLevelConfig, podNames, fakeNamespaceNames, invaderSpeed, CANVAS_WIDTH } from '../config.js';
import { Invader } from './invader.js';

export class Grid {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: invaderSpeed, y: 0 };
        this.invaders = [];
        this.width = 0;
        this.totalInvaders = 0; // Used for speed-up scaling as invaders die
        // Cache boundary values for performance
        this.leftBoundary = 0;
        this.rightBoundary = CANVAS_WIDTH;
    }

    // assignType picks an invader type per row:
    // top row = shooter (fires often), bottom row = tanky (tough, drops loot), middle = normal.
    assignType(y, rows) {
        if (rows === 1) return 'normal';
        if (y === 0) return 'shooter';
        if (y === rows - 1) return 'tanky';
        return 'normal';
    }

    async init(level) {
        const config = getLevelConfig(level);
        if (!config) return;

        const { rows, cols } = config;
        this.width = cols * 45;
        this.totalInvaders = rows * cols;

        try {
            const response = await fetch(`/names?count=${rows * cols}`);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const names = await response.json();
            let nameIndex = 0;

            // Pre-allocate array for better performance
            this.invaders = new Array(rows * cols);
            let invaderIndex = 0;

            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    const pod = names[nameIndex] || {};
                    this.invaders[invaderIndex++] = new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: pod.name || podNames[Math.floor(Math.random() * podNames.length)],
                        namespace: pod.namespace || fakeNamespaceNames[Math.floor(Math.random() * fakeNamespaceNames.length)],
                        isRealPod: pod.isRealPod || false,
                        type: this.assignType(y, rows)
                    });
                    nameIndex++;
                }
            }
        } catch (error) {
            console.error("Failed to fetch invader names:", error);
            this.invaders = new Array(rows * cols);
            let invaderIndex = 0;

            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    this.invaders[invaderIndex++] = new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: `invader-${x}-${y}`,
                        namespace: `fake-${x}-${y}`,
                        isRealPod: false,
                        type: this.assignType(y, rows)
                    });
                }
            }
        }

        // Fisher-Yates shuffle optimization
        for (let i = this.invaders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.invaders[i];
            this.invaders[i] = this.invaders[j];
            this.invaders[j] = temp;
        }
    }

    update() {
        const invaderCount = this.invaders.length;
        if (invaderCount === 0) return;

        // Optimized boundary calculation
        let minX = this.invaders[0].position.x;
        let maxX = this.invaders[0].position.x + 35; // Use cached width

        for (let i = 1; i < invaderCount; i++) {
            const invader = this.invaders[i];
            if (invader.position.x < minX) minX = invader.position.x;
            const rightEdge = invader.position.x + 35;
            if (rightEdge > maxX) maxX = rightEdge;
        }

        this.velocity.y = 0;
        if (maxX + this.velocity.x >= this.rightBoundary || minX + this.velocity.x <= this.leftBoundary) {
            this.velocity.x = -this.velocity.x;
            this.velocity.y = 30;
        }

        // Ensure velocity.x always matches global invaderSpeed, scaled up
        // as invaders die (classic Space Invaders behavior).
        const remainingFactor = this.totalInvaders > 0
            ? 1 + (1 - invaderCount / this.totalInvaders) * 0.8
            : 1;
        this.velocity.x = Math.sign(this.velocity.x) * invaderSpeed * remainingFactor;
    }
}
