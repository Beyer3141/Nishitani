export class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 50;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - this.height - 20;
        this.speed = 6;
        this.weaponLevel = 1;
        this.hasShield = false;
        this.fired = false;
        this.engineFlicker = 0;
    }

    update(input) {
        // Horizontal Movement
        if (input.includes('ArrowLeft')) this.x -= this.speed;
        if (input.includes('ArrowRight')) this.x += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // Engine flicker animation
        this.engineFlicker = Math.random();
    }

    shoot() {
        const bulletY = this.y;
        const cx = this.x + this.width / 2;

        if (this.weaponLevel === 1) {
            this.game.addBullet(cx - 2, bulletY);
        } else if (this.weaponLevel === 2) {
            this.game.addBullet(this.x + 5, bulletY);
            this.game.addBullet(this.x + this.width - 9, bulletY);
        } else if (this.weaponLevel >= 3) {
            // 3-way shot
            this.game.addBullet(cx - 2, bulletY); // Center
            this.game.addBullet(this.x, bulletY, -2); // Left angled
            this.game.addBullet(this.x + this.width - 4, bulletY, 2); // Right angled
        }
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        // Engine flame
        ctx.save();
        const flameHeight = 15 + this.engineFlicker * 10;
        const gradient = ctx.createLinearGradient(cx, this.y + this.height, cx, this.y + this.height + flameHeight);
        gradient.addColorStop(0, 'yellow');
        gradient.addColorStop(0.5, 'orange');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx - 10, this.y + this.height);
        ctx.lineTo(cx + 10, this.y + this.height);
        ctx.lineTo(cx, this.y + this.height + flameHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Ship body - sleek triangle
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'cyan';

        // Main body gradient
        const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        bodyGradient.addColorStop(0, '#00d4ff');
        bodyGradient.addColorStop(0.5, '#0088aa');
        bodyGradient.addColorStop(1, '#005566');
        ctx.fillStyle = bodyGradient;

        ctx.beginPath();
        ctx.moveTo(cx, this.y); // Top point
        ctx.lineTo(this.x + this.width, this.y + this.height); // Bottom right
        ctx.lineTo(cx, this.y + this.height * 0.7); // Inner bottom
        ctx.lineTo(this.x, this.y + this.height); // Bottom left
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#aaeeff';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 20, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Shield visual
        if (this.hasShield) {
            ctx.save();
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'cyan';
            ctx.beginPath();
            ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Weapon level indicator
        if (this.weaponLevel > 1) {
            ctx.fillStyle = 'lime';
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillText('Lv.' + this.weaponLevel, this.x, this.y - 5);
        }
    }
}
