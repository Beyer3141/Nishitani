export class Bullet {
    constructor(game, x, y, vx = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx; // Horizontal velocity for angled shots
        this.width = 4;
        this.height = 10;
        this.speed = 10;
        this.markedForDeletion = false;
    }

    update() {
        this.y -= this.speed;
        this.x += this.vx;
        if (this.y < 0 || this.x < 0 || this.x > this.game.width) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0';
        ctx.fillStyle = '#ff0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}
