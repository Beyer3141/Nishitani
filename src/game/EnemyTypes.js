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
        const scale = game.mobileScale || 1;
        this.width = Math.floor(55 * scale);
        this.height = Math.floor(55 * scale);
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
        const scale = game.mobileScale || 1;
        this.width = Math.floor(25 * scale);
        this.height = Math.floor(25 * scale);
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
        const scale = game.mobileScale || 1;
        this.width = Math.floor(50 * scale);
        this.height = Math.floor(28 * scale);
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
        const scale = game.mobileScale || 1;
        this.width = Math.floor((isSmall ? 25 : 38) * scale);
        this.height = Math.floor((isSmall ? 25 : 38) * scale);
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

// ========== New Enemy Types ==========

export class SniperEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'sniper';
        this.hp = 2;
        this.maxHp = 2;
        this.scoreValue = 6;
        this.speedY = 0.3;
        this.hoverY = 40 + Math.random() * 80;
        this.hovering = false;
        this.aimTimer = 0;
        this.aimDuration = 1500;
        this.aiming = false;
        this.aimTarget = { x: 0, y: 0 };
        this.shootCooldown = 3000;
        this.shootTimer = 0;
    }

    update(deltaTime) {
        if (!this.hovering) {
            this.y += 2;
            if (this.y >= this.hoverY) {
                this.hovering = true;
                // Snap to left or right edge
                this.x = this.x < this.game.width / 2 ? 10 : this.game.width - this.width - 10;
            }
        }
        if (this.hovering) {
            this.shootTimer += deltaTime;
            if (!this.aiming && this.shootTimer >= this.shootCooldown) {
                this.aiming = true;
                this.aimTimer = 0;
                if (this.game.player) {
                    this.aimTarget = {
                        x: this.game.player.x + this.game.player.width / 2,
                        y: this.game.player.y + this.game.player.height / 2
                    };
                }
            }
            if (this.aiming) {
                this.aimTimer += deltaTime;
                if (this.aimTimer >= this.aimDuration) {
                    this.shoot();
                    this.aiming = false;
                    this.shootTimer = 0;
                }
            }
        }
        if (this.y > this.game.height + this.height) this.markedForDeletion = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }

    shoot() {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const dx = this.aimTarget.x - cx;
        const dy = this.aimTarget.y - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 10 * (this.game.getEnemyBulletSpeedMultiplier());
        this.game.enemyBullets.push(new EnemyBullet(this.game, cx, cy, (dx / dist) * speed, (dy / dist) * speed));
    }

    draw(ctx) {
        super.draw(ctx);
        // Red tint
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff0044';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
        // Laser sight when aiming
        if (this.aiming && this.game.player) {
            ctx.save();
            const progress = this.aimTimer / this.aimDuration;
            ctx.globalAlpha = 0.3 + progress * 0.5;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1 + progress * 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.aimTarget.x, this.aimTarget.y);
            ctx.stroke();
            ctx.restore();
        }
    }
}

export class TeleportEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'teleport';
        this.hp = 2;
        this.maxHp = 2;
        this.scoreValue = 4;
        this.speedY = 0.5;
        this.teleportTimer = 0;
        this.teleportInterval = 2000 + Math.random() * 1000;
        this.teleporting = false;
        this.teleportFade = 1;
    }

    update(deltaTime) {
        this.teleportTimer += deltaTime;
        if (this.teleporting) {
            this.teleportFade -= deltaTime / 200;
            if (this.teleportFade <= 0) {
                // Warp to new position
                this.x = 20 + Math.random() * (this.game.width - this.width - 40);
                this.y = 30 + Math.random() * (this.game.height * 0.4);
                this.teleporting = false;
                this.teleportFade = 0;
                // Fade in
                setTimeout(() => { this.teleportFade = 1; }, 100);
            }
        } else {
            this.teleportFade = Math.min(1, this.teleportFade + deltaTime / 200);
            this.y += this.speedY;
            if (this.teleportTimer >= this.teleportInterval) {
                this.teleportTimer = 0;
                this.teleporting = true;
            }
        }
        if (this.y > this.game.height + this.height) this.markedForDeletion = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.teleportFade);
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#8800ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        // Purple shimmer
        ctx.globalAlpha = Math.max(0, this.teleportFade) * 0.3;
        ctx.fillStyle = '#aa00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();

        if (this.flashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }
}

export class BombEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'bomb';
        this.hp = 1;
        this.maxHp = 1;
        this.scoreValue = 5;
        this.speedY = 1.2;
        this.speedX = (Math.random() - 0.5) * 2;
    }

    update(deltaTime) {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x + this.width > this.game.width) this.speedX *= -1;
        if (this.y > this.game.height + this.height) this.markedForDeletion = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 100;
        if (this.hp <= 0) {
            // Explode: shoot bullets in all directions
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const count = 8;
            const speed = 3 * (this.game.getEnemyBulletSpeedMultiplier());
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                this.game.enemyBullets.push(new EnemyBullet(
                    this.game, cx, cy,
                    Math.cos(angle) * speed, Math.sin(angle) * speed
                ));
            }
            return true;
        }
        return false;
    }

    draw(ctx) {
        super.draw(ctx);
        // Warning red pulse
        ctx.save();
        const pulse = Math.sin(performance.now() / 200) * 0.2 + 0.3;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
        // Bomb icon
        ctx.save();
        ctx.fillStyle = '#ffdd00';
        ctx.font = `bold ${Math.floor(this.width * 0.5)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', this.x + this.width / 2, this.y + this.height / 2);
        ctx.restore();
    }
}

// ========== Enemy Quotes ==========

export const ENEMY_QUOTES = {
    basic: {
        spawn: ['名刺はいかがですか？', '西谷さんに会えて光栄です', '笑顔は世界を救う'],
        death: ['営業成績が…', '笑顔を…絶やすな…', '次の面談は…'],
    },
    zigzag: {
        spawn: ['ジグザグ営業回り中！', '効率的なルートで参ります'],
        death: ['ルートが…途切れた…', 'GPS壊れた…'],
    },
    kamikaze: {
        spawn: ['西谷さんのためなら！', '突撃営業ぃぃ！', '契約取れるまで帰れません！'],
        death: ['本望です…', '西谷さぁぁん…'],
    },
    shooter: {
        spawn: ['遠距離からでも笑顔は届く', '名刺ミサイル発射！'],
        death: ['射程外だと…', '弾切れ…'],
    },
    tank: {
        spawn: ['重厚な営業力を見よ', '石橋を叩いて渡る営業スタイル'],
        death: ['この重厚さが…通じないとは…', '重すぎた…'],
    },
    swarm: {
        spawn: ['数の暴力ならぬ数の営業', '集団面接を思い出す'],
        death: ['仲間がー！', 'ちっちゃくてもプライドはある'],
    },
    shield: {
        spawn: ['クレーム対応力には自信がある', '防御は最大の営業'],
        death: ['シールドが…', 'クレーム処理しきれなかった…'],
    },
    meishi: {
        spawn: ['名刺交換しましょう！', '弊社をよろしく'],
        death: ['名刺が…散った…', '印刷代が…'],
    },
    clone: {
        spawn: ['コピーは本物を超える', '量産型の方が生産性高い'],
        death: ['オリジナルに…報告を…', '複製エラー…'],
    },
    sniper: {
        spawn: ['狙い撃ちの営業だ', 'ターゲットロック…'],
        death: ['照準が…ズレた…', '外した…'],
    },
    teleport: {
        spawn: ['どこにでも行ける営業マン', '瞬間移動で即訪問'],
        death: ['テレポート…失敗…', '転送先が…ない…'],
    },
    bomb: {
        spawn: ['爆発的な営業力！', '自爆覚悟で契約を取る！'],
        death: ['道連れだ！', 'さよなら…ボーナス…'],
    },
};

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
        case 'sniper': return new SniperEnemy(game, x, y);
        case 'teleport': return new TeleportEnemy(game, x, y);
        case 'bomb': return new BombEnemy(game, x, y);
        default: return new Enemy(game, x, y);
    }
}
