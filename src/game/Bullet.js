export class Bullet {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 10;
        this.markedForDeletion = false;
    }

    update() {
        this.y -= this.speed;
        if (this.y < 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.fillStyle = '#ff0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
