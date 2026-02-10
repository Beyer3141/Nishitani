import { Boss } from './Boss';
import { EnemyBullet } from './Bullet';
import { Enemy } from './Enemy';
import { getStageForWave } from './StageData';

// ========== Original bosses (kept for reference/fallback) ==========

export class SentinelBoss extends Boss {
    constructor(game, level) {
        super(game, 'sentinel', level);
        this.hp = 90 + level * 25;
        this.maxHp = this.hp;
        this.attackInterval = 1200;
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        const mult = this.game.getEnemyBulletSpeedMultiplier();
        this.attackPattern = (this.attackPattern + 1) % 3;

        if (this.attackPattern === 0) {
            for (let i = -2; i <= 2; i++) {
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, i * 1.5, (5 + this.phase) * mult));
            }
        } else if (this.attackPattern === 1) {
            const count = 3 + this.phase * 2;
            for (let i = 0; i < count; i++) {
                const angle = -Math.PI / 4 + (Math.PI / 2) * (i / (count - 1));
                const speed = 5 * mult;
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, Math.cos(angle + Math.PI / 2) * speed, Math.sin(angle + Math.PI / 2) * speed));
            }
        } else {
            if (this.game.player) {
                const dx = this.game.player.x + this.game.player.width / 2 - cx;
                const dy = this.game.player.y - bottom;
                const dist = Math.hypot(dx, dy) || 1;
                const speed = 6 * mult;
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
        this.hp = 150 + level * 35;
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
        const mult = this.game.getEnemyBulletSpeedMultiplier();
        const count = 5 + this.phase * 2;
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 3 + (Math.PI * 2 / 3) * (i / (count - 1));
            const speed = 4 * mult;
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, Math.cos(angle + Math.PI / 2) * speed, Math.sin(angle + Math.PI / 2) * speed));
        }
    }
}

export class BerserkerBoss extends Boss {
    constructor(game, level) {
        super(game, 'berserker', level);
        this.hp = 120 + level * 30;
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
                const cx = this.x + this.width / 2;
                const bottom = this.y + this.height;
                const mult = this.game.getEnemyBulletSpeedMultiplier();
                for (let i = -3; i <= 3; i++) {
                    this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, i * 2, 6 * mult));
                }
            }
        }
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        const mult = this.game.getEnemyBulletSpeedMultiplier();
        for (let i = -1; i <= 1; i++) {
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom, i * 3, 7 * mult));
        }
    }
}

export class HivemindBoss extends Boss {
    constructor(game, level) {
        super(game, 'hivemind', level);
        this.hp = 180 + level * 40;
        this.maxHp = this.hp;
        this.attackInterval = 1000;
        this.splitTimer = 0;
        this.fragments = [];
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.entered) return;
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
        const mult = this.game.getEnemyBulletSpeedMultiplier();
        const count = 8 + this.phase * 4;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 3.5 * mult;
            this.game.enemyBullets.push(new EnemyBullet(this.game, cx, this.y + this.height / 2, Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
    }

    draw(ctx) {
        super.draw(ctx);
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

// ========== Stage-specific bosses ==========

// Stage 1: Giant T-Shirt
export class GiantTshirtBoss extends SentinelBoss {
    constructor(game, level) {
        super(game, level);
        this.bossType = '巨大Tシャツ';
    }

    draw(ctx) {
        const bob = Math.sin(this.angle) * 5;

        ctx.save();
        // T-shirt body (white)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#aaaaff';
        // Main body
        ctx.fillRect(this.x + 30, this.y + bob + 50, this.width - 60, this.height - 50);
        // Left sleeve
        ctx.fillRect(this.x, this.y + bob + 50, 40, 60);
        // Right sleeve
        ctx.fillRect(this.x + this.width - 40, this.y + bob + 50, 40, 60);
        // Neckline
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + bob + 55, 30, Math.PI, 0);
        ctx.fillStyle = '#eeeeff';
        ctx.fill();

        // Face on the shirt
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x + this.width / 2 - 45, this.y + bob + 70, 90, 90);
        }
        ctx.restore();

        // Damage flash
        if (this.hpRatio < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(performance.now() / 100) * 0.15;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.restore();
        }

        this._drawHpBar(ctx, bob);
    }
}

// Stage 2: Nishitani Robo Mark-V
export class NishitaniRoboBoss extends MothershipBoss {
    constructor(game, level) {
        super(game, level);
        this.bossType = 'ニシタニ・ロボ Mark-V';
    }

    draw(ctx) {
        const bob = Math.sin(this.angle) * 5;

        ctx.save();
        // Robot body (dark metallic)
        ctx.fillStyle = '#334455';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4488ff';
        // Torso
        ctx.fillRect(this.x + 40, this.y + bob + 80, this.width - 80, this.height - 80);
        // Shoulders
        ctx.fillRect(this.x + 10, this.y + bob + 80, 40, 40);
        ctx.fillRect(this.x + this.width - 50, this.y + bob + 80, 40, 40);
        // Arms
        ctx.fillStyle = '#445566';
        ctx.fillRect(this.x, this.y + bob + 90, 20, 80);
        ctx.fillRect(this.x + this.width - 20, this.y + bob + 90, 20, 80);

        // Monitor head
        ctx.fillStyle = '#222233';
        ctx.fillRect(this.x + 50, this.y + bob + 10, this.width - 100, 75);
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x + 50, this.y + bob + 10, this.width - 100, 75);

        // Face on monitor
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x + 60, this.y + bob + 15, this.width - 120, 65);
        }

        // Scanline effect on monitor
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#00ff00';
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(this.x + 50, this.y + bob + 10 + i * 10, this.width - 100, 1);
        }

        ctx.restore();

        if (this.hpRatio < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(performance.now() / 100) * 0.15;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.restore();
        }

        this._drawHpBar(ctx, bob);
    }
}

// Stage 3: Fleet Commander
export class FleetCommanderBoss extends BerserkerBoss {
    constructor(game, level) {
        super(game, level);
        this.bossType = '艦隊司令官ニシタニ';
    }

    draw(ctx) {
        const bob = Math.sin(this.angle) * 5;

        ctx.save();
        // Military uniform body
        ctx.fillStyle = '#1a1a4a';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffdd00';
        // Body
        ctx.fillRect(this.x + 30, this.y + bob + 70, this.width - 60, this.height - 70);
        // Epaulettes
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(this.x + 25, this.y + bob + 70, 20, 8);
        ctx.fillRect(this.x + this.width - 45, this.y + bob + 70, 20, 8);
        // Belt
        ctx.fillStyle = '#aa8800';
        ctx.fillRect(this.x + 30, this.y + bob + 130, this.width - 60, 8);

        // Head
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x + this.width / 2 - 40, this.y + bob, 80, 75);
        }

        // Military cap
        ctx.fillStyle = '#1a1a4a';
        ctx.fillRect(this.x + this.width / 2 - 45, this.y + bob - 5, 90, 15);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(this.x + this.width / 2 - 15, this.y + bob - 5, 30, 5);

        ctx.restore();

        if (this.hpRatio < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(performance.now() / 100) * 0.15;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.restore();
        }

        this._drawHpBar(ctx, bob);
    }
}

// Stage 4: Emperor Nishitani
export class EmperorBoss extends Boss {
    constructor(game, level) {
        super(game, '皇帝ニシタニ', level);
        this.hp = 250;
        this.maxHp = this.hp;
        this.width = 150;
        this.height = 200;
        this.attackInterval = 1000;
        this.barrierActive = true;
        this.barrierHp = 50;
        this.barrierMaxHp = 50;
        this.barrierRechargeTimer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.entered) return;

        // Barrier recharge when broken
        if (!this.barrierActive) {
            this.barrierRechargeTimer += deltaTime;
            if (this.barrierRechargeTimer >= 8000) {
                this.barrierActive = true;
                this.barrierHp = this.barrierMaxHp;
                this.barrierRechargeTimer = 0;
            }
        }
    }

    attack() {
        const cx = this.x + this.width / 2;
        const bottom = this.y + this.height;
        const mult = this.game.getEnemyBulletSpeedMultiplier();

        if (this.phase === 1) {
            // Elegant aimed shots
            if (this.game.player) {
                const dx = this.game.player.x + this.game.player.width / 2 - cx;
                const dy = this.game.player.y - bottom;
                const dist = Math.hypot(dx, dy) || 1;
                for (let i = -1; i <= 1; i++) {
                    this.game.enemyBullets.push(new EnemyBullet(this.game, cx, bottom,
                        (dx / dist) * 5 * mult + i * 1.5, (dy / dist) * 5 * mult));
                }
            }
        } else if (this.phase >= 2) {
            // Circular burst + aimed
            const count = 12 + this.phase * 2;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                this.game.enemyBullets.push(new EnemyBullet(this.game, cx, this.y + this.height / 2,
                    Math.cos(angle) * 4 * mult, Math.sin(angle) * 4 * mult));
            }
        }
    }

    draw(ctx) {
        const bob = Math.sin(this.angle) * 3;

        ctx.save();
        // Body (navy jacket)
        ctx.fillStyle = '#1a1a4a';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffdd00';
        ctx.fillRect(this.x + 25, this.y + bob + 85, this.width - 50, this.height - 85);

        // White T-shirt under jacket
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 45, this.y + bob + 85, this.width - 90, 30);

        // Head
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x + this.width / 2 - 40, this.y + bob + 5, 80, 80);
        }

        // Crown/aura
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ffdd00';
        ctx.strokeStyle = '#ffdd00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + bob + 45, 50, 0, Math.PI * 2);
        ctx.stroke();

        // Crown points
        ctx.fillStyle = '#ffdd00';
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + (Math.PI * 2 / 5) * i;
            const px = this.x + this.width / 2 + Math.cos(a) * 55;
            const py = this.y + bob + 45 + Math.sin(a) * 55;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Barrier visualization
        if (this.barrierActive) {
            ctx.save();
            const pulse = Math.sin(performance.now() / 200) * 0.2 + 0.4;
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + bob + this.height / 2, this.width / 2 + 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Damage flash
        if (this.hpRatio < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(performance.now() / 100) * 0.15;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.restore();
        }

        this._drawHpBar(ctx, bob);
    }
}

// Stage 5: Face Battleship YASUOMI - FINAL BOSS
export class FaceBattleshipBoss extends Boss {
    constructor(game, level) {
        super(game, '顔面戦艦 YASUOMI', level);
        this.hp = 500;
        this.maxHp = this.hp;
        this.width = Math.floor(game.width * 0.8);
        this.height = Math.floor(game.width * 0.8);
        this.x = (game.width - this.width) / 2;
        this.y = -this.height;
        this.speedX = 0;
        this.speedY = 0.5;
        this.attackInterval = 800;

        // Phase-specific timers
        this.eyeLaserTimer = 0;
        this.hairMissileTimer = 0;
        this.mouthTimer = 0;
        this.phaseDialogueShown = { 2: false, 3: false };
    }

    update(deltaTime) {
        // Custom entry animation
        if (!this.entered) {
            this.y += this.speedY * 1.5;
            const targetY = -this.height * 0.3;
            if (this.y >= targetY) {
                this.y = targetY;
                this.entered = true;
            }
            this.angle += 0.01;
            return;
        }

        // Phase transitions
        if (this.hpRatio <= 0.30 && this.phase < 3) {
            this.phase = 3;
            this.game.shakeScreen(20, 1000);
            this.game.flashScreen('rgba(255, 0, 0, 0.3)', 500);
            if (!this.phaseDialogueShown[3]) {
                this.phaseDialogueShown[3] = true;
                this.game.dialogue.show('ファイナル・スマイル…！口を開けろ！', '顔面戦艦', 2000);
            }
        } else if (this.hpRatio <= 0.65 && this.phase < 2) {
            this.phase = 2;
            this.game.shakeScreen(15, 500);
            if (!this.phaseDialogueShown[2]) {
                this.phaseDialogueShown[2] = true;
                this.game.dialogue.show('セットが乱れるなぁ……黒髪の乱舞！', '顔面戦艦', 2000);
            }
        }

        // Slight horizontal sway
        this.angle += 0.01;
        this.x = (this.game.width - this.width) / 2 + Math.sin(this.angle) * 20;

        const mult = this.game.getEnemyBulletSpeedMultiplier();

        // Phase 1: Eye Force
        this.eyeLaserTimer += deltaTime;
        const eyeInterval = this.phase >= 3 ? 1500 : this.phase >= 2 ? 2000 : 1200;
        if (this.eyeLaserTimer > eyeInterval) {
            this.eyeLaserTimer = 0;
            this._eyeLaserAttack(mult);
        }

        // Phase 2+: Hair Storm
        if (this.phase >= 2) {
            this.hairMissileTimer += deltaTime;
            const hairInterval = this.phase >= 3 ? 800 : 600;
            if (this.hairMissileTimer > hairInterval) {
                this.hairMissileTimer = 0;
                this._hairMissileAttack(mult);
            }
        }

        // Phase 3: Final Smile
        if (this.phase >= 3) {
            this.mouthTimer += deltaTime;
            if (this.mouthTimer > 500) {
                this.mouthTimer = 0;
                this._mouthAttack(mult);
            }
        }
    }

    _eyeLaserAttack(mult) {
        const leftEyeX = this.x + this.width * 0.35;
        const rightEyeX = this.x + this.width * 0.65;
        const eyeY = this.y + this.height * 0.45;

        if (this.game.player) {
            const px = this.game.player.x + this.game.player.width / 2;
            const py = this.game.player.y;

            for (const ex of [leftEyeX, rightEyeX]) {
                const dx = px - ex;
                const dy = py - eyeY;
                const dist = Math.hypot(dx, dy) || 1;
                const speed = 6 * mult;
                this.game.enemyBullets.push(new EnemyBullet(this.game, ex, eyeY, (dx / dist) * speed, (dy / dist) * speed));
                // Additional side bullets in later phases
                if (this.phase >= 2) {
                    this.game.enemyBullets.push(new EnemyBullet(this.game, ex, eyeY, (dx / dist) * speed + 1.5, (dy / dist) * speed));
                    this.game.enemyBullets.push(new EnemyBullet(this.game, ex, eyeY, (dx / dist) * speed - 1.5, (dy / dist) * speed));
                }
            }
        }
    }

    _hairMissileAttack(mult) {
        const hairY = this.y + this.height * 0.15;
        const count = 3 + this.phase;
        for (let i = 0; i < count; i++) {
            const hx = this.x + this.width * 0.2 + Math.random() * this.width * 0.6;
            const speed = 4 + Math.random() * 2;
            this.game.enemyBullets.push(new EnemyBullet(this.game, hx, hairY, (Math.random() - 0.5) * 2, speed * mult));
        }
    }

    _mouthAttack(mult) {
        const mouthX = this.x + this.width * 0.5;
        const mouthY = this.y + this.height * 0.75;

        if (this.game.player) {
            const dx = this.game.player.x + this.game.player.width / 2 - mouthX;
            const dy = this.game.player.y - mouthY;
            const dist = Math.hypot(dx, dy) || 1;
            const speed = 3 * mult;

            // Large 「西」character energy ball
            const bullet = new EnemyBullet(this.game, mouthX, mouthY, (dx / dist) * speed, (dy / dist) * speed);
            bullet.width = 30;
            bullet.height = 30;
            bullet.isKanji = true;
            this.game.enemyBullets.push(bullet);
        }
    }

    attack() {
        // Handled by phase-specific methods
    }

    draw(ctx) {
        const bob = Math.sin(this.angle) * 3;

        // Draw face.png at massive scale
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x, this.y + bob, this.width, this.height);
        } else {
            ctx.fillStyle = '#ffddcc';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
        }

        // Phase 1+: Eye glow effect
        const leftEyeX = this.x + this.width * 0.35;
        const rightEyeX = this.x + this.width * 0.65;
        const eyeY = this.y + bob + this.height * 0.45;

        ctx.save();
        const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.5;
        ctx.globalAlpha = pulse;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(leftEyeX, eyeY, 12 + this.phase * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeX, eyeY, 12 + this.phase * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Phase 2+: Hair glow
        if (this.phase >= 2) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#4400ff';
            ctx.fillRect(this.x + this.width * 0.1, this.y + bob, this.width * 0.8, this.height * 0.2);
            ctx.restore();
        }

        // Phase 3: Mouth open animation
        if (this.phase >= 3) {
            const mouthX = this.x + this.width * 0.35;
            const mouthY = this.y + bob + this.height * 0.7;
            const mouthW = this.width * 0.3;
            const mouthH = this.height * 0.12;

            ctx.save();
            const mPulse = Math.sin(performance.now() / 300) * 0.2 + 0.5;
            ctx.globalAlpha = mPulse;
            ctx.fillStyle = '#ff4400';
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#ff4400';
            ctx.fillRect(mouthX, mouthY, mouthW, mouthH);
            // "西" character inside mouth
            ctx.fillStyle = '#ffffff';
            ctx.font = "bold 20px 'Press Start 2P', serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('西', mouthX + mouthW / 2, mouthY + mouthH / 2);
            ctx.restore();
        }

        // Damage cracks
        if (this.hpRatio < 0.5) {
            ctx.save();
            const crackAlpha = (1 - this.hpRatio) * 0.4;
            ctx.globalAlpha = crackAlpha;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            // Draw crack lines
            const cx = this.x + this.width / 2;
            const cy = this.y + bob + this.height / 2;
            for (let i = 0; i < 5; i++) {
                const a = (Math.PI * 2 / 5) * i + this.angle;
                const len = this.width * 0.3 * (1 - this.hpRatio);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Damage flash (low HP)
        if (this.hpRatio < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.2 + Math.sin(performance.now() / 100) * 0.15;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + bob, this.width, this.height);
            ctx.restore();
        }

        // HP bar at bottom
        const barWidth = this.game.width - 40;
        const barX = 20;
        const barY = Math.max(this.y + this.height + bob + 10, this.game.height * 0.45);
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, 18);
        const hpColor = this.hpRatio > 0.5 ? '#0f0' : this.hpRatio > 0.25 ? '#ff0' : '#f00';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * this.hpRatio, 14);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, 18);

        // Boss name
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'red';
        ctx.fillText(this.bossType, this.game.width / 2, barY - 5);
        ctx.restore();
    }
}

// ========== Boss Factory ==========

export function createBoss(game, waveNumber) {
    const stage = getStageForWave(waveNumber);
    if (!stage) return new SentinelBoss(game, 0);

    switch (stage.bossType) {
        case 'giantTshirt': return new GiantTshirtBoss(game, 0);
        case 'nishitaniRobo': return new NishitaniRoboBoss(game, 0);
        case 'fleetCommander': return new FleetCommanderBoss(game, 0);
        case 'emperor': return new EmperorBoss(game, 0);
        case 'faceBattleship': return new FaceBattleshipBoss(game, 0);
        default: return new SentinelBoss(game, 0);
    }
}
