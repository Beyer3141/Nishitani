import { Enemy } from './Enemy';
import { EnemyBullet } from './Bullet';

export class ZigZagEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'zigzag';
        this.amplitude = 50;
        this.frequency = 0.05;
        this.startX = x;
        this.time = 0;
        this.speedY = 1.5;
        this.hp = 1;
        this.maxHp = 1;
        this.scoreValue = 2;
    }

    update(deltaTime) {
        this.time += 1;
        this.x = this.startX + Math.sin(this.time * this.frequency) * this.amplitude;
        this.y += this.speedY;
        if (this.y > this.game.height + this.height) this.markedForDeletion = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class KamikazeEnemy extends Enemy {
    constructor(game, x, y, targetX) {
        super(game, x, y);
        this.type = 'kamikaze';
        this.targetX = targetX || (game.player ? game.player.x : game.width / 2);
        this.speedY = 5;
        const dx = this.targetX - x;
        this.speedX = dx / 100;
        this.hp = 1;
        this.maxHp = 1;
        this.scoreValue = 3;
    }

    update(deltaTime) {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y > this.game.height + this.height || this.x < -this.width || this.x > this.game.width + this.width) {
            this.markedForDeletion = true;
        }
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class ShooterEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'shooter';
        this.hp = 3;
        this.maxHp = 3;
        this.scoreValue = 5;
        this.canShootBullets = true;
        this.shootInterval = 1500;
        this.speedY = 0.3;
        this.hoverY = 100 + Math.random() * 150;
        this.hovering = false;
        this.hoverTimer = 0;
        this.hoverDuration = 4000;
    }

    update(deltaTime) {
        if (!this.hovering) {
            this.y += 2;
            if (this.y >= this.hoverY) {
                this.hovering = true;
                this.speedY = 0;
            }
        } else {
            this.x += this.speedX;
            if (this.x + this.width > this.game.width || this.x < 0) this.speedX *= -1;
            this.hoverTimer += deltaTime;
            if (this.hoverTimer > this.hoverDuration) {
                this.speedY = 1;
                this.y += this.speedY;
            }
        }

        if (this.y > this.game.height + this.height) this.markedForDeletion = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;

        if (this.hovering && this.canShootBullets) {
            this.shootTimer += deltaTime;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                this.shoot();
            }
        }
    }

    shoot() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        if (this.game.player) {
            const dx = this.game.player.x + this.game.player.width / 2 - cx;
            const dy = this.game.player.y - bottom;
            const dist = Math.hypot(dx, dy) || 1;
            const speed = 4;
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, (dx / dist) * speed, (dy / dist) * speed));
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class TankEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'tank';
        this.width = 80;
        this.height = 80;
        this.hp = 8;
        this.maxHp = 8;
        this.scoreValue = 10;
        this.speedX = 0.5;
        this.speedY = 0.3;
        this.dropChance = 1.0; // Always drops
    }

    update(deltaTime) {
        super.update(deltaTime);
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class SwarmEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'swarm';
        this.width = 35;
        this.height = 35;
        this.hp = 1;
        this.maxHp = 1;
        this.scoreValue = 1;
        this.speedY = 3;
        this.speedX = (Math.random() - 0.5) * 4;
        this.time = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.time += 0.1;
        this.x += this.speedX + Math.sin(this.time) * 1.5;
        this.y += this.speedY;
        if (this.y > this.game.height + this.height || this.x < -this.width || this.x > this.game.width + this.width) {
            this.markedForDeletion = true;
        }
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class ShieldEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'shield';
        this.hp = 3;
        this.maxHp = 3;
        this.scoreValue = 8;
        this.hasShield = true;
        this.shieldHp = 3;
        this.speedY = 0.5;
        this.speedX = 0.8;
    }

    update(deltaTime) {
        super.update(deltaTime);
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class MeishiEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'meishi';
        this.width = 70;
        this.height = 40;
        this.hp = 2;
        this.maxHp = 2;
        this.scoreValue = 4;
        this.speedY = 1;
        this.spinAngle = 0;
        this.spinSpeed = 0.08;
        this.canShootBullets = true;
        this.shootInterval = 2500;
        this.shootTimer = 0;
    }

    update(deltaTime) {
        this.spinAngle += this.spinSpeed;
        this.x += Math.sin(this.spinAngle) * 2;
        this.y += this.speedY;
        if (this.y > this.game.height + this.height) this.markedForDeletion = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;

        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.shoot();
        }
    }

    shoot() {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const speed = 3;
        const mult = this.game.getEnemyBulletSpeedMultiplier();
        this.game.enemyBullets.push(new EnemyBullet(this.game, cx, cy, 0, speed * mult));
        this.game.enemyBullets.push(new EnemyBullet(this.game, cx, cy, 0, -speed * mult));
        this.game.enemyBullets.push(new EnemyBullet(this.game, cx, cy, speed * mult, 0));
        this.game.enemyBullets.push(new EnemyBullet(this.game, cx, cy, -speed * mult, 0));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.spinAngle * 0.3);

        // Business card shape
        ctx.fillStyle = '#f5f0e0';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffddaa';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Text on card
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#333';
        ctx.font = "bold 8px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NISHITANI', 0, -5);
        ctx.font = "6px Arial";
        ctx.fillText('西谷 泰臣', 0, 8);

        ctx.restore();

        // Damage flash
        if (this.flashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }

        // HP bar
        if (this.hp > 0 && this.hp < this.maxHp) {
            const barWidth = this.width;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 8, barWidth, 4);
            const ratio = this.hp / this.maxHp;
            ctx.fillStyle = ratio > 0.5 ? '#0f0' : '#f00';
            ctx.fillRect(this.x, this.y - 8, barWidth * ratio, 4);
        }
    }
}

export class CloneEnemy extends Enemy {
    constructor(game, x, y, isSmall = false) {
        super(game, x, y);
        this.type = 'clone';
        this.isSmall = isSmall;
        this.width = isSmall ? 35 : 55;
        this.height = isSmall ? 35 : 55;
        this.hp = isSmall ? 1 : 3;
        this.maxHp = this.hp;
        this.scoreValue = isSmall ? 2 : 5;
        this.speedY = 0.8;
        this.speedX = isSmall ? (Math.random() - 0.5) * 2 : 0;
        this.glitchTimer = 0;
    }

    update(deltaTime) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.glitchTimer += deltaTime;
        if (this.y > this.game.height + this.height) this.markedForDeletion = true;
        if (this.x < -this.width || this.x > this.game.width + this.width) this.markedForDeletion = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }

    takeDamage(amount) {
        if (this.hasShield && this.shieldHp > 0) {
            this.shieldHp -= amount;
            if (this.shieldHp <= 0) { this.hasShield = false; this.shieldHp = 0; }
            return false;
        }
        this.hp -= amount;
        this.flashTimer = 100;
        if (this.hp <= 0) {
            // Split into 2 smaller clones when destroyed (only if not already small)
            if (!this.isSmall) {
                const clone1 = new CloneEnemy(this.game, this.x - 20, this.y, true);
                const clone2 = new CloneEnemy(this.game, this.x + 20, this.y, true);
                clone1.speedX = -1.5;
                clone2.speedX = 1.5;
                this.game.enemies.push(clone1);
                this.game.enemies.push(clone2);
            }
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.globalAlpha = this.isSmall ? 0.6 : 0.8;
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

            // Glitch overlay - horizontal scan lines
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#00ff00';
            const glitchOffset = Math.floor(this.glitchTimer / 100) % 5;
            for (let i = 0; i < 3; i++) {
                const ly = this.y + ((i * 15 + glitchOffset * 7) % this.height);
                ctx.fillRect(this.x, ly, this.width, 2);
            }
        } else {
            ctx.fillStyle = this.isSmall ? '#003300' : '#005500';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();

        // Damage flash
        if (this.flashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }

        // HP bar for non-small
        if (!this.isSmall && this.hp > 0 && this.hp < this.maxHp) {
            const barWidth = this.width;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 8, barWidth, 4);
            const ratio = this.hp / this.maxHp;
            ctx.fillStyle = ratio > 0.5 ? '#0f0' : '#f00';
            ctx.fillRect(this.x, this.y - 8, barWidth * ratio, 4);
        }
    }
}

export function createEnemy(type, game, x, y) {
    switch (type) {
        case 'basic': return new Enemy(game, x, y);
        case 'zigzag': return new ZigZagEnemy(game, x, y);
        case 'kamikaze': return new KamikazeEnemy(game, x, y);
        case 'shooter': return new ShooterEnemy(game, x, y);
        case 'tank': return new TankEnemy(game, x, y);
        case 'swarm': return new SwarmEnemy(game, x, y);
        case 'shield': return new ShieldEnemy(game, x, y);
        case 'meishi': return new MeishiEnemy(game, x, y);
        case 'clone': return new CloneEnemy(game, x, y);
        default: return new Enemy(game, x, y);
    }
}
