export class Bullet {
    constructor(game, x, y, vx = 0, damage = 1) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.damage = damage;
        this.width = 4;
        this.height = 10;
        this.speed = 12;
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

export class HomingBullet {
    constructor(game, x, y, damage = 2) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.width = 8;
        this.height = 8;
        this.speed = 8;
        this.markedForDeletion = false;
    }

    update() {
        // Find nearest enemy or boss
        let target = null;
        let minDist = Infinity;

        this.game.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        });

        if (this.game.boss) {
            const dist = Math.hypot(this.game.boss.x - this.x, this.game.boss.y - this.y);
            if (dist < minDist) {
                target = this.game.boss;
            }
        }

        if (target) {
            const dx = (target.x + target.width / 2) - this.x;
            const dy = (target.y + target.height / 2) - this.y;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        } else {
            this.y -= this.speed;
        }

        if (this.y < -20 || this.y > this.game.height || this.x < -20 || this.x > this.game.width + 20) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f0f';
        ctx.fillStyle = '#f0f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

