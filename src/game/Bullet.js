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
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 4) this.trail.shift();
        this.y -= this.speed;
        this.x += this.vx;
        if (this.y < -20 || this.x < -20 || this.x > this.game.width + 20) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        this.trail.forEach((pos, i) => {
            ctx.globalAlpha = (i / this.trail.length) * 0.2;
            ctx.fillStyle = '#ff0';
            ctx.fillRect(pos.x, pos.y, this.width, this.height / 2);
        });
        ctx.restore();
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0';
        ctx.fillStyle = '#ff0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class HeavyBullet {
    constructor(game, x, y, vx = 0, damage = 4, piercing = false) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.damage = damage;
        this.piercing = piercing;
        this.width = 10;
        this.height = 16;
        this.speed = 8;
        this.markedForDeletion = false;
        this.trail = [];
        this.hitEnemies = new Set();
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();
        this.y -= this.speed;
        this.x += this.vx;
        if (this.y < -20 || this.x < -20 || this.x > this.game.width + 20) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        this.trail.forEach((pos, i) => {
            ctx.globalAlpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(pos.x - 1, pos.y, this.width + 2, this.height / 2);
        });
        ctx.restore();
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4400';
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
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
        this.trail = [];
        this.angle = -Math.PI / 2;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();

        let target = null;
        let minDist = Infinity;
        this.game.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDist) { minDist = dist; target = enemy; }
        });
        if (this.game.boss) {
            const dist = Math.hypot(this.game.boss.x - this.x, this.game.boss.y - this.y);
            if (dist < minDist) target = this.game.boss;
        }

        if (target) {
            const dx = (target.x + target.width / 2) - this.x;
            const dy = (target.y + target.height / 2) - this.y;
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.15;
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        } else {
            this.y -= this.speed;
        }

        if (this.y < -20 || this.y > this.game.height + 20 || this.x < -20 || this.x > this.game.width + 20) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        this.trail.forEach((pos, i) => {
            ctx.globalAlpha = (i / this.trail.length) * 0.4;
            ctx.fillStyle = '#f0f';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f0f';
        ctx.fillStyle = '#f0f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class EnemyBullet {
    constructor(game, x, y, vx, vy) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        const scale = game.mobileScale || 1;
        this.width = Math.floor(10 * scale);
        this.height = Math.floor(10 * scale);
        this.markedForDeletion = false;
        this.trail = [];
        this.grazed = false;
        this.isKanji = false;
        this.rotation = 0;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        if (this.isKanji) this.rotation += 0.05;
        if (this.y > this.game.height + 20 || this.y < -20 || this.x < -20 || this.x > this.game.width + 20) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        if (this.isKanji) {
            // 「西」kanji energy ball
            ctx.save();
            this.trail.forEach((pos, i) => {
                ctx.globalAlpha = (i / this.trail.length) * 0.2;
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, this.width / 3, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#ff00ff';
            ctx.fillStyle = 'rgba(200, 0, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${this.width}px 'Press Start 2P', serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('西', 0, 0);
            ctx.restore();
            return;
        }

        ctx.save();
        this.trail.forEach((pos, i) => {
            ctx.globalAlpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff4400';
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
