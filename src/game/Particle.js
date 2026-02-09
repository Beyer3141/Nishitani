export class Particle {
    constructor(game, x, y, color, speed) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * speed - speed / 2;
        this.speedY = Math.random() * speed - speed / 2;
        this.markedForDeletion = false;
        this.life = 1.0; // Opacity/Life
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class BackgroundStar {
    constructor(game) {
        this.game = game;
        this.x = Math.random() * game.width;
        this.y = Math.random() * game.height;
        this.size = Math.random() * 2;
        this.speedY = Math.random() * 0.5 + 0.1; // Slow scrolling
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
    }

    update() {
        this.y += this.speedY;
        if (this.y > this.game.height) {
            this.y = 0;
            this.x = Math.random() * this.game.width;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}
