import { EnemyBullet } from './Bullet';

export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speedX = 1;
        this.speedY = 0.5;
        this.hp = 1;
        this.maxHp = 1;
        this.scoreValue = 1;
        this.markedForDeletion = false;
        this.type = 'basic';
        this.isElite = false;
        this.dropChance = 0.1;

        this.image = new Image();
        this.image.src = '/face.png';

        this.canShootBullets = false;
        this.shootTimer = 0;
        this.shootInterval = 2000;

        this.hasShield = false;
        this.shieldHp = 0;

        this.flashTimer = 0;
    }

    update(deltaTime) {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x + this.width > this.game.width || this.x < 0) {
            this.speedX *= -1;
            this.y += 20;
        }

        if (this.y > this.game.height + this.height) {
            this.markedForDeletion = true;
        }

        if (this.flashTimer > 0) this.flashTimer -= deltaTime;

        if (this.canShootBullets && deltaTime) {
            this.shootTimer += deltaTime;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                this.shoot();
            }
        }
    }

    shoot() {}

    takeDamage(amount) {
        if (this.hasShield && this.shieldHp > 0) {
            this.shieldHp -= amount;
            if (this.shieldHp <= 0) {
                this.hasShield = false;
                this.shieldHp = 0;
            }
            return false;
        }
        this.hp -= amount;
        this.flashTimer = 100;
        return this.hp <= 0;
    }

    draw(ctx) {
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.flashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }

        if (this.isElite) {
            ctx.save();
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffdd00';
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.restore();
        }

        if (this.maxHp > 1 && this.hp > 0) {
            const barWidth = this.width;
            const barHeight = 4;
            const barY = this.y - 8;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, barY, barWidth, barHeight);
            const ratio = this.hp / this.maxHp;
            ctx.fillStyle = ratio > 0.5 ? '#0f0' : ratio > 0.25 ? '#ff0' : '#f00';
            ctx.fillRect(this.x, barY, barWidth * ratio, barHeight);
        }

        if (this.hasShield) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00aaff';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 5, -Math.PI * 0.7, Math.PI * 0.7);
            ctx.stroke();
            ctx.restore();
        }
    }
}
