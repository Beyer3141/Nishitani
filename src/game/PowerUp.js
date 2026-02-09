export class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type; // 'POWER', 'SHIELD'
        this.speed = 2;
        this.markedForDeletion = false;
        this.angle = 0;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
        if (this.y > this.game.height) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.shadowBlur = 15;
        if (this.type === 'POWER') {
            ctx.shadowColor = 'lime';
            ctx.fillStyle = '#0f0';
        } else {
            ctx.shadowColor = 'cyan';
            ctx.fillStyle = '#0ff';
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = "bold 14px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type === 'POWER' ? 'P' : 'S', 0, 0);

        ctx.restore();
    }
}
