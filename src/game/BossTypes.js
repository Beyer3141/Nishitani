import { Boss } from './Boss';
import { EnemyBullet } from './Bullet';
import { Enemy } from './Enemy';

export class SentinelBoss extends Boss {
    constructor(game, level) {
        super(game, 'sentinel', level);
        this.hp = 60 + level * 15;
        this.maxHp = this.hp;
        this.attackInterval = 1200;
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        this.attackPattern = (this.attackPattern + 1) % 3;

        if (this.attackPattern === 0) {
            // Spread
            for (let i = -2; i <= 2; i++) {
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, i * 1.5, 5 + this.phase));
            }
        } else if (this.attackPattern === 1) {
            // Fan burst (more in later phases)
            const count = 3 + this.phase * 2;
            for (let i = 0; i < count; i++) {
                const angle = -Math.PI / 4 + (Math.PI / 2) * (i / (count - 1));
                const speed = 5;
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, Math.cos(angle + Math.PI / 2) * speed, Math.sin(angle + Math.PI / 2) * speed));
            }
        } else {
            // Aimed
            if (this.game.player) {
                const dx = this.game.player.x + this.game.player.width / 2 - cx;
                const dy = this.game.player.y - bottom;
                const dist = Math.hypot(dx, dy) || 1;
                const speed = 6;
                for (let i = -1; i <= 1; i++) {
                    this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, (dx / dist) * speed + i * 1.5, (dy / dist) * speed));
                }
            }
        }
    }
}

export class MothershipBoss extends Boss {
    constructor(game, level) {
        super(game, 'mothership', level);
        this.hp = 100 + level * 20;
        this.maxHp = this.hp;
        this.width = 250;
        this.height = 200;
        this.attackInterval = 1500;
        this.spawnTimer = 0;
        this.spawnInterval = 3000;
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.entered) return;

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.game.enemies.length < 6) {
            this.spawnTimer = 0;
            this.spawnMinions();
        }
    }

    spawnMinions() {
        const count = 1 + this.phase;
        for (let i = 0; i < count; i++) {
            const ex = this.x + Math.random() * this.width;
            const ey = this.y + this.height;
            const enemy = new Enemy(this.game, ex, ey);
            enemy.speedY = 1.5;
            this.game.enemies.push(enemy);
        }
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        // Wide spread from the mothership
        const count = 5 + this.phase * 2;
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 3 + (Math.PI * 2 / 3) * (i / (count - 1));
            const speed = 4;
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, Math.cos(angle + Math.PI / 2) * speed, Math.sin(angle + Math.PI / 2) * speed));
        }
    }
}

export class BerserkerBoss extends Boss {
    constructor(game, level) {
        super(game, 'berserker', level);
        this.hp = 80 + level * 18;
        this.maxHp = this.hp;
        this.speedX = 3;
        this.attackInterval = 800;
        this.chargeTimer = 0;
        this.charging = false;
        this.chargeTarget = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.entered) return;

        if (this.phase >= 2 && !this.charging) {
            this.chargeTimer += deltaTime;
            if (this.chargeTimer > 2000) {
                this.charging = true;
                this.chargeTimer = 0;
                if (this.game.player) {
                    this.chargeTarget = this.game.player.x + this.game.player.width / 2 - this.width / 2;
                }
            }
        }

        if (this.charging) {
            const dx = this.chargeTarget - this.x;
            this.x += Math.sign(dx) * 8;
            if (Math.abs(dx) < 10) {
                this.charging = false;
                this.game.shakeScreen(10, 300);
                // Slam attack
                const cx = this.x + this.width / 2;
                const bottom = this.y + this.height;
                for (let i = -3; i <= 3; i++) {
                    this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, i * 2, 6));
                }
            }
        }
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        // Fast burst
        for (let i = -1; i <= 1; i++) {
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, i * 3, 7));
        }
    }
}

export class HivemindBoss extends Boss {
    constructor(game, level) {
        super(game, 'hivemind', level);
        this.hp = 120 + level * 25;
        this.maxHp = this.hp;
        this.attackInterval = 1000;
        this.splitTimer = 0;
        this.fragments = [];
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.entered) return;

        // Update fragments
        this.fragments = this.fragments.filter(f => !f.markedForDeletion);
        this.fragments.forEach(f => {
            f.angle += 0.03;
            f.x = this.x + this.width / 2 + Math.cos(f.angle) * f.orbitRadius - 30;
            f.y = this.y + this.height / 2 + Math.sin(f.angle) * f.orbitRadius - 30;
            f.shootTimer += deltaTime;
            if (f.shootTimer > 2000) {
                f.shootTimer = 0;
                if (this.game.player) {
                    const dx = this.game.player.x - f.x;
                    const dy = this.game.player.y - f.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    this.game.enemyBullets.push(new EnemyBullet(this.game, f.x + 30, f.y + 30, (dx / dist) * 4, (dy / dist) * 4));
                }
            }
        });

        // Spawn fragments at phase changes
        if (this.phase >= 2 && this.fragments.length < this.phase) {
            this.fragments.push({
                x: this.x, y: this.y,
                angle: Math.random() * Math.PI * 2,
                orbitRadius: 120 + this.fragments.length * 40,
                shootTimer: 0,
                markedForDeletion: false,
            });
        }
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        // Circular burst
        const count = 8 + this.phase * 4;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 3.5;
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, this.y + this.height / 2, Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw fragments
        this.fragments.forEach(f => {
            ctx.save();
            ctx.globalAlpha = 0.7;
            if (this.image.complete && this.image.naturalWidth > 0) {
                ctx.drawImage(this.image, f.x, f.y, 60, 60);
            } else {
                ctx.fillStyle = '#8800aa';
                ctx.fillRect(f.x, f.y, 60, 60);
            }
            ctx.restore();
        });
    }
}

const BOSS_CYCLE = ['sentinel', 'mothership', 'berserker', 'hivemind'];

export function createBoss(game, waveNumber) {
    const typeIndex = (waveNumber - 1) % BOSS_CYCLE.length;
    const type = BOSS_CYCLE[typeIndex];
    const level = Math.floor((waveNumber - 1) / BOSS_CYCLE.length);

    switch (type) {
        case 'sentinel': return new SentinelBoss(game, level);
        case 'mothership': return new MothershipBoss(game, level);
        case 'berserker': return new BerserkerBoss(game, level);
        case 'hivemind': return new HivemindBoss(game, level);
        default: return new SentinelBoss(game, level);
    }
}
