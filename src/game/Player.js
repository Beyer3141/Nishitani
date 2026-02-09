export class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 50;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - this.height - 20;
        this.speed = 5;
        this.color = '#00ff00'; // Green for now
        this.weaponLevel = 1;
        this.hasShield = false;
        this.fired = false;
    }

    update(input) {
        // Horizontal Movement
        if (input.includes('ArrowLeft')) this.x -= this.speed;
        if (input.includes('ArrowRight')) this.x += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
    }

    shoot() {
        // We need to access Game class Bullet, so we might need to import it or access via game instance if it exposes it
        // Ideally Game should handle bullet creation or expose a method. 
        // For now, let's assume game has addBullet method or similar, or we import Bullet here.
        // But to keep it simple and avoid circular dependency if possible, let's use game.addBullet

        const bulletY = this.y;
        if (this.weaponLevel === 1) {
            this.game.addBullet(this.x + this.width / 2 - 2, bulletY);
        } else {
            this.game.addBullet(this.x, bulletY);
            this.game.addBullet(this.x + this.width - 4, bulletY);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Shield visual
        if (this.hasShield) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 40, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Simple shape details (e.g. cannon)
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + this.width / 2 - 5, this.y - 10, 10, 10);
    }
}
