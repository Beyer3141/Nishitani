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

export function createEnemy(type, game, x, y) {
    switch (type) {
        case 'basic': return new Enemy(game, x, y);
        case 'zigzag': return new ZigZagEnemy(game, x, y);
        case 'kamikaze': return new KamikazeEnemy(game, x, y);
        case 'shooter': return new ShooterEnemy(game, x, y);
        case 'tank': return new TankEnemy(game, x, y);
        case 'swarm': return new SwarmEnemy(game, x, y);
        case 'shield': return new ShieldEnemy(game, x, y);
        default: return new Enemy(game, x, y);
    }
}
