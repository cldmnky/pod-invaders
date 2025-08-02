// Utility Functions

// --- Object Pools ---
const particlePool = [];
const projectilePool = [];

// Store classes for object pools - will be set by game.js
let ParticleClass = null;
let ProjectileClass = null;

export function setEntityClasses(Particle, Projectile) {
    ParticleClass = Particle;
    ProjectileClass = Projectile;
}

// Optimized object pool functions with better memory management
export function getParticle(params) {
    let p = particlePool.length > 0 ? particlePool.pop() : new ParticleClass(params);
    // Reset properties efficiently
    Object.assign(p, {
        position: { x: params.position.x, y: params.position.y },
        velocity: { x: params.velocity.x, y: params.velocity.y },
        radius: params.radius,
        color: params.color || '#326ce5',
        opacity: 1,
        fades: params.fades
    });
    return p;
}

export function releaseParticle(p) {
    if (particlePool.length < 100) { // Limit pool size
        particlePool.push(p);
    }
}

export function getProjectile(params) {
    let pr = projectilePool.length > 0 ? projectilePool.pop() : new ProjectileClass(params);
    Object.assign(pr, {
        position: { x: params.position.x, y: params.position.y },
        velocity: { x: params.velocity.x, y: params.velocity.y },
        radius: 4
    });
    return pr;
}

export function releaseProjectile(pr) {
    if (projectilePool.length < 50) { // Limit pool size
        projectilePool.push(pr);
    }
}

// Optimized collision detection functions
export function checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

export function checkCircleRectCollision(circle, rect) {
    return circle.x - circle.radius <= rect.x + rect.width &&
           circle.x + circle.radius >= rect.x &&
           circle.y - circle.radius <= rect.y + rect.height &&
           circle.y + circle.radius >= rect.y;
}

// Game Logic ---
export function createParticles({ object, color, amount, particles }) {
    for (let i = 0; i < amount; i++) {
        const p = getParticle({
            position: { x: object.position.x + object.width / 2, y: object.position.y + object.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
            radius: Math.random() * 3,
            color: color || '#326ce5',
            fades: true
        });
        particles.push(p);
    }
}
