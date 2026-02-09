export class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type; // 'DOUBLE', 'SHIELD'
        this.speed = 2;
        this.markedForDeletion = false;
    }

    update() {
        this.y += this.speed;
        if (this.y > this.game.height) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.fillStyle = this.type === 'DOUBLE' ? '#0ff' : '#00f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type === 'DOUBLE' ? 'P' : 'S', this.x, this.y + 4);
    }
}
