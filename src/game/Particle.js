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
        this.life = 1.0;
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

export class RingParticle {
    constructor(game, x, y, color, maxRadius) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 0;
        this.maxRadius = maxRadius;
        this.life = 1.0;
        this.speed = 12;
        this.markedForDeletion = false;
    }

    update() {
        this.radius += this.speed;
        this.life = 1 - (this.radius / this.maxRadius);
        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life * 0.6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

export class DebrisParticle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 6 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.3;
        this.gravity = 0.08;
        this.life = 1.0;
        this.decay = Math.random() * 0.01 + 0.01;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.speedX;
        this.speedY += this.gravity;
        this.y += this.speedY;
        this.rotation += this.rotSpeed;
        this.life -= this.decay;
        if (this.life <= 0 || this.y > this.game.height + 20) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

export class BackgroundStar {
    constructor(game) {
        this.game = game;
        this.x = Math.random() * game.width;
        this.y = Math.random() * game.height;
        this.size = Math.random() * 2;
        this.speedY = Math.random() * 0.5 + 0.1;
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
