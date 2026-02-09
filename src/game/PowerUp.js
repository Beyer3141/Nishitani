export class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type; // 'DOUBLE', 'TRIPLE', 'SHIELD'
        this.speed = 2;
        this.markedForDeletion = false;
        this.angle = 0;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05; // Rotation animation
        if (this.y > this.game.height) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Glow
        ctx.shadowBlur = 15;
        if (this.type === 'DOUBLE') {
            ctx.shadowColor = 'cyan';
            ctx.fillStyle = '#0ff';
        } else if (this.type === 'TRIPLE') {
            ctx.shadowColor = 'magenta';
            ctx.fillStyle = '#f0f';
        } else {
            ctx.shadowColor = 'blue';
            ctx.fillStyle = '#00f';
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = "bold 14px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = this.type === 'DOUBLE' ? '2' : this.type === 'TRIPLE' ? '3' : 'S';
        ctx.fillText(label, 0, 0);

        ctx.restore();
    }
}
