import { EnemyBullet } from './Bullet';

export class Boss {
    constructor(game, type = 'sentinel', level = 0) {
        this.game = game;
        this.bossType = type;
        this.level = level;
        this.width = 200;
        this.height = 200;
        this.x = game.width / 2 - this.width / 2;
        this.y = -this.height;
        this.speedX = 2;
        this.speedY = 1;
        this.hp = 60;
        this.maxHp = 60;
        this.markedForDeletion = false;
        this.image = new Image();
        this.image.src = '/face.png';
        this.angle = 0;
        this.entered = false;

        this.attackTimer = 0;
        this.attackInterval = 1200;
        this.attackPattern = 0;

        // Phase system
        this.phase = 1;
        this.phaseThresholds = [0.6, 0.3]; // Switch phases at 60% and 30% HP
    }

    get hpRatio() {
        return this.hp / this.maxHp;
    }

    update(deltaTime) {
        if (!this.entered) {
            this.y += this.speedY * 2;
            if (this.y >= 20) {
                this.y = 20;
                this.entered = true;
            }
            return;
        }

        // Phase transitions
        if (this.hpRatio <= this.phaseThresholds[1] && this.phase < 3) {
            this.phase = 3;
        } else if (this.hpRatio <= this.phaseThresholds[0] && this.phase < 2) {
            this.phase = 2;
        }

        this.x += this.speedX;
        if (this.x < 0 || this.x > this.game.width - this.width) this.speedX *= -1;
        this.angle += 0.02;

        // Phase-based speed/attack
        if (this.phase === 3) {
            this.attackInterval = 600;
            this.speedX = this.speedX > 0 ? 4 : -4;
        } else if (this.phase === 2) {
            this.attackInterval = 900;
            this.speedX = this.speedX > 0 ? 3 : -3;
        }

        if (this.attackTimer > this.attackInterval) {
            this.attack();
            this.attackTimer = 0;
        } else {
            this.attackTimer += deltaTime;
        }
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        this.attackPattern = (this.attackPattern + 1) % 3;

        if (this.attackPattern === 0) {
            const bulletSpeed = 6;
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, 0, bulletSpeed));
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, -2, bulletSpeed));
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, 2, bulletSpeed));
        } else if (this.attackPattern === 1) {
            for (let i = -2; i <= 2; i++) {
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, i * 1.5, 5));
            }
        } else {
            if (this.game.player) {
                const dx = this.game.player.x + this.game.player.width / 2 - cx;
                const dy = this.game.player.y - bottom;
                const dist = Math.hypot(dx, dy) || 1;
                const speed = 7;
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, (dx / dist) * speed, (dy / dist) * speed));
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, (dx / dist) * speed - 1.5, (dy / dist) * speed));
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, (dx / dist) * speed + 1.5, (dy / dist) * speed));
            }
        }
    }

    draw(ctx) {
        const bob = Math.sin(this.angle) * 5;

        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x, this.y + bob, this.width, this.height);
        } else {
            ctx.fillStyle = 'purple';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
        }

        if (this.hpRatio < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(performance.now() / 100) * 0.15;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.restore();
        }

        // HP Bar
        const barWidth = this.width + 40;
        const barX = this.x - 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, this.y - 25, barWidth, 14);
        const hpColor = this.hpRatio > 0.5 ? '#0f0' : this.hpRatio > 0.25 ? '#ff0' : '#f00';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX + 2, this.y - 23, (barWidth - 4) * this.hpRatio, 10);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, this.y - 25, barWidth, 14);

        // Boss name
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText(this.bossType.toUpperCase(), this.x + this.width / 2, this.y - 32);
        ctx.restore();
    }
}
