import { Enemy } from './Enemy';

export class ZigZagEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.amplitude = 50;
        this.frequency = 0.05;
        this.startX = x;
        this.time = 0;
        this.color = '#ff00ff'; // Magenta for variation
    }

    update() {
        this.time += 1;
        this.x = this.startX + Math.sin(this.time * this.frequency) * this.amplitude;
        this.y += this.speedY;
        if (this.y > this.game.height) this.markedForDeletion = true;
    }
}

export class KamikazeEnemy extends Enemy {
    constructor(game, x, y, targetX) {
        super(game, x, y);
        this.targetX = targetX;
        this.speedY = 5; // Faster
        const dx = targetX - x;
        this.speedX = dx / 100; // Aim toward player
        this.color = '#ff0000'; // Red for danger
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y > this.game.height || this.x < -this.width || this.x > this.game.width) {
            this.markedForDeletion = true;
        }
    }
}
