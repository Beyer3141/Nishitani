export class Boss {
    constructor(game) {
        this.game = game;
        this.width = 200;
        this.height = 200;
        this.x = game.width / 2 - this.width / 2;
        this.y = -this.height;
        this.speedX = 2;
        this.speedY = 1;
        this.hp = 50;
        this.maxHp = 50;
        this.markedForDeletion = false;
        this.image = new Image();
        this.image.src = '/face.png';
        this.angle = 0;
        this.entered = false;

        this.attackTimer = 0;
        this.attackInterval = 1200;
        this.attackPattern = 0;
    }

    update(deltaTime) {
        // Entrance animation
        if (!this.entered) {
            this.y += this.speedY * 2;
            if (this.y >= 20) {
                this.y = 20;
                this.entered = true;
            }
            return;
        }

        // Side to side movement with sine wave
        this.x += this.speedX;
        if (this.x < 0 || this.x > this.game.width - this.width) {
            this.speedX *= -1;
        }

        // Slight bobbing
        this.angle += 0.02;

        // Attack - cycle through patterns
        if (this.attackTimer > this.attackInterval) {
            this.attack();
            this.attackTimer = 0;
        } else {
            this.attackTimer += deltaTime;
        }

        // Speed up as health decreases
        const hpRatio = this.hp / this.maxHp;
        if (hpRatio < 0.3) {
            this.attackInterval = 600;
            this.speedX = this.speedX > 0 ? 4 : -4;
        } else if (hpRatio < 0.6) {
            this.attackInterval = 900;
            this.speedX = this.speedX > 0 ? 3 : -3;
        }
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        this.attackPattern = (this.attackPattern + 1) % 3;

        if (this.attackPattern === 0) {
            // 3-way spread
            const bulletSpeed = 6;
            this.game.enemyBullets.push(new BossBullet(this.game, cx, bottom, 0, bulletSpeed));
            this.game.enemyBullets.push(new BossBullet(this.game, cx, bottom, -2, bulletSpeed));
            this.game.enemyBullets.push(new BossBullet(this.game, cx, bottom, 2, bulletSpeed));
        } else if (this.attackPattern === 1) {
            // 5-way fan
            for (let i = -2; i <= 2; i++) {
                this.game.enemyBullets.push(new BossBullet(this.game, cx, bottom, i * 1.5, 5));
            }
        } else {
            // Aimed shot toward player
            if (this.game.player) {
                const dx = this.game.player.x + this.game.player.width / 2 - cx;
                const dy = this.game.player.y - bottom;
                const dist = Math.hypot(dx, dy);
                const speed = 7;
                this.game.enemyBullets.push(new BossBullet(this.game, cx, bottom, (dx / dist) * speed, (dy / dist) * speed));
                // Slight spread
                this.game.enemyBullets.push(new BossBullet(this.game, cx, bottom, (dx / dist) * speed - 1.5, (dy / dist) * speed));
                this.game.enemyBullets.push(new BossBullet(this.game, cx, bottom, (dx / dist) * speed + 1.5, (dy / dist) * speed));
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

        // Damage flash
        const hpRatio = this.hp / this.maxHp;
        if (hpRatio < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(performance.now() / 100) * 0.15;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.restore();
        }

        // HP Bar background
        const barWidth = this.width + 40;
        const barX = this.x - 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, this.y - 25, barWidth, 14);

        // HP Bar fill
        const hpColor = hpRatio > 0.5 ? '#0f0' : hpRatio > 0.25 ? '#ff0' : '#f00';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX + 2, this.y - 23, (barWidth - 4) * hpRatio, 10);

        // HP Bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, this.y - 25, barWidth, 14);
    }
}

export class BossBullet {
    constructor(game, x, y, vx, vy) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 10;
        this.height = 10;
        this.markedForDeletion = false;
        this.trail = [];
    }

    update() {
        // Store trail positions
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;

        if (this.y > this.game.height + 20 || this.y < -20 || this.x < -20 || this.x > this.game.width + 20) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Trail
        ctx.save();
        this.trail.forEach((pos, i) => {
            ctx.globalAlpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Main bullet
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff4400';
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
