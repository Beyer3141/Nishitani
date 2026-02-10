const POWERUP_COLORS = {
    POWER: { fill: '#0f0', shadow: 'lime', label: 'P' },
    SHIELD: { fill: '#0ff', shadow: 'cyan', label: 'S' },
    BOMB: { fill: '#ff4400', shadow: '#ff6600', label: 'B' },
    LIFE: { fill: '#ff66aa', shadow: '#ff88cc', label: '\u2665' },
    CREDITS: { fill: '#ffdd00', shadow: '#ffaa00', label: '$' },
};

export class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.speed = 2;
        this.markedForDeletion = false;
        this.angle = 0;
        this.creditValue = type === 'CREDITS' ? (10 + Math.floor(Math.random() * 20)) : 0;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
        if (this.y > this.game.height) this.markedForDeletion = true;
    }

    draw(ctx) {
        const config = POWERUP_COLORS[this.type] || POWERUP_COLORS.POWER;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.shadow;
        ctx.fillStyle = config.fill;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = "bold 14px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.label, 0, 0);
        ctx.restore();
    }
}
