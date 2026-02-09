import { Enemy } from './Enemy';

export class ZigZagEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.amplitude = 50;
        this.frequency = 0.05;
        this.startX = x;
        this.time = 0;
        this.speedY = 1.5; // Override parent speedY - faster descent
        this.hp = 1;
        this.scoreValue = 2;
    }

    update() {
        this.time += 1;
        this.x = this.startX + Math.sin(this.time * this.frequency) * this.amplitude;
        this.y += this.speedY;

        if (this.y > this.game.height + this.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Draw with a magenta tint overlay
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class KamikazeEnemy extends Enemy {
    constructor(game, x, y, targetX) {
        super(game, x, y);
        this.targetX = targetX;
        this.speedY = 5;
        const dx = targetX - x;
        this.speedX = dx / 100;
        this.hp = 1;
        this.scoreValue = 3;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y > this.game.height + this.height || this.x < -this.width || this.x > this.game.width + this.width) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Draw with a red tint overlay
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}
