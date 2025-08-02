// Grid Class
import { levelConfigs, podNames, invaderSpeed, CANVAS_WIDTH } from '../config.js';
import { Invader } from './invader.js';

export class Grid {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: invaderSpeed, y: 0 };
        this.invaders = [];
        this.width = 0;
        // Cache boundary values for performance
        this.leftBoundary = 0;
        this.rightBoundary = CANVAS_WIDTH;
    }
    
    async init(level) {
        const config = levelConfigs[level - 1];
        if (!config) return;

        const { rows, cols } = config;
        this.width = cols * 45;
        
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
                    this.invaders[invaderIndex++] = new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: names[nameIndex]?.name || podNames[Math.floor(Math.random() * podNames.length)],
                        namespace: names[nameIndex]?.namespace || podNames[Math.floor(Math.random() * podNames.length)],
                        isRealPod: names[nameIndex]?.isRealPod || false
                    });
                    nameIndex++;
                }
            }
        } catch (error) {
            console.error("Failed to fetch invader names:", error);
            const { rows, cols } = levelConfigs[level - 1];
            this.invaders = new Array(rows * cols);
            let invaderIndex = 0;
            
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    this.invaders[invaderIndex++] = new Invader({
                        position: { x: x * 45, y: y * 45 + 50 },
                        name: `invader-${x}-${y}`,
                        namespace: `invader-${x}-${y}`,
                        isRealPod: false
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
        
        // Ensure velocity.x always matches global invaderSpeed
        this.velocity.x = Math.sign(this.velocity.x) * invaderSpeed;
    }
}
