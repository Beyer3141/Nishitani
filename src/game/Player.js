export const WEAPON_PATHS = {
    spread: { name: '拡散', color: '#00ff88' },
    rapid: { name: '連射', color: '#ffaa00' },
    heavy: { name: '重火力', color: '#ff4444' },
};

export const SHIPS = {
    speeder: {
        name: 'スピーダー',
        description: 'SPD 9  ATK 1  ダッシュ',
        speed: 9,
        fireRate: 1.0,
        damage: 1,
        color1: '#00ff88',
        color2: '#00aa44',
        weaponPath: 'rapid',
        special: 'dash',
        specialDesc: 'ダッシュ(無敵移動)',
    },
    balanced: {
        name: 'バランス',
        description: 'SPD 6  ATK 1  ボム拡大',
        speed: 6,
        fireRate: 1.0,
        damage: 1,
        color1: '#00d4ff',
        color2: '#0088aa',
        weaponPath: 'spread',
        special: 'bombBoost',
        specialDesc: 'ボム拡大(範囲2倍)',
    },
    tank: {
        name: 'タンク',
        description: 'SPD 4  ATK 2  チャージショット',
        speed: 4,
        fireRate: 0.8,
        damage: 2,
        color1: '#ff6600',
        color2: '#aa4400',
        weaponPath: 'heavy',
        special: 'chargeShot',
        specialDesc: 'チャージショット',
    },
    interceptor: {
        name: 'インターセプター',
        description: 'SPD 11  ATK 1  ホーミングバースト',
        speed: 11,
        fireRate: 1.2,
        damage: 1,
        color1: '#ff00ff',
        color2: '#880088',
        weaponPath: 'rapid',
        special: 'homingBurst',
        specialDesc: 'ホーミングバースト',
    },
    fortress: {
        name: 'フォートレス',
        description: 'SPD 2.5  ATK 3  フォースフィールド',
        speed: 2.5,
        fireRate: 0.6,
        damage: 3,
        color1: '#ffdd00',
        color2: '#aa8800',
        weaponPath: 'heavy',
        special: 'forceField',
        specialDesc: 'フォースフィールド',
    },
    phantom: {
        name: 'ファントム',
        description: 'SPD 7  ATK 1  テレポート',
        speed: 7,
        fireRate: 1.0,
        damage: 1,
        color1: '#8844ff',
        color2: '#442288',
        weaponPath: 'spread',
        special: 'teleport',
        specialDesc: 'テレポート',
    },
};

export const SHIP_KEYS = ['speeder', 'balanced', 'tank', 'interceptor', 'fortress', 'phantom'];

export class Player {
    constructor(game, shipType = 'balanced') {
        this.game = game;
        this.shipType = shipType;
        this.shipConfig = SHIPS[shipType] || SHIPS.balanced;
        this.width = 50;
        this.height = 50;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - this.height - 20;
        this.speed = this.shipConfig.speed;
        this.baseSpeed = this.shipConfig.speed;
        this.damage = this.shipConfig.damage;
        this.baseDamage = this.shipConfig.damage;
        this.weaponLevel = 1;
        this.maxWeaponLevel = 5;
        this.weaponPath = this.shipConfig.weaponPath;
        this.hasShield = false;
        this.fired = false;
        this.engineFlicker = 0;
        this.fireTimer = 0;
        this.fireDelay = 150 * this.shipConfig.fireRate;

        // Life and bomb system
        this.lives = 3;
        this.maxLives = 5;
        this.bombs = 3;
        this.maxBombs = 5;
        this.credits = 0;

        // Special ability
        this.special = this.shipConfig.special;
        this.specialCooldown = 0;
        this.specialMaxCooldown = 3000;
        this.specialActive = false;
        this.specialTimer = 0;

        // Graze bonus multiplier
        this.grazeBonus = 1;

        // Dash state
        this.dashing = false;
        this.dashTimer = 0;

        // Force field state
        this.forceFieldActive = false;
        this.forceFieldTimer = 0;

        // Speed/damage shop upgrades
        this.speedBonus = 0;
        this.damageBonus = 0;
    }

    get effectiveSpeed() {
        return this.baseSpeed + this.speedBonus + (this.dashing ? 15 : 0);
    }

    get effectiveDamage() {
        return this.baseDamage + this.damageBonus;
    }

    update(input, deltaTime) {
        const spd = this.effectiveSpeed;
        if (input.includes('ArrowLeft') || input.includes('a')) this.x -= spd;
        if (input.includes('ArrowRight') || input.includes('d')) this.x += spd;
        if (input.includes('ArrowUp') || input.includes('w')) this.y -= spd * 0.6;
        if (input.includes('ArrowDown') || input.includes('s')) this.y += spd * 0.6;

        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.height - this.height) this.y = this.game.height - this.height;

        this.engineFlicker = Math.random();
        if (this.fireTimer > 0) this.fireTimer -= deltaTime;
        if (this.specialCooldown > 0) this.specialCooldown -= deltaTime;

        if (this.dashing) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) this.dashing = false;
        }

        if (this.forceFieldActive) {
            this.forceFieldTimer -= deltaTime;
            if (this.forceFieldTimer <= 0) this.forceFieldActive = false;
        }

        if (this.specialActive) {
            this.specialTimer -= deltaTime;
            if (this.specialTimer <= 0) this.specialActive = false;
        }
    }

    canShoot() {
        return this.fireTimer <= 0;
    }

    shoot() {
        if (!this.canShoot()) return;
        this.fireTimer = this.fireDelay;
        const cx = this.x + this.width / 2;
        const bulletY = this.y;
        const dmg = this.effectiveDamage;

        if (this.weaponPath === 'spread') {
            this._shootSpread(cx, bulletY, dmg);
        } else if (this.weaponPath === 'rapid') {
            this._shootRapid(cx, bulletY, dmg);
        } else if (this.weaponPath === 'heavy') {
            this._shootHeavy(cx, bulletY, dmg);
        }

        if (this.weaponPath !== 'heavy') {
            this.game.sound.playShoot();
        }
    }

    _shootSpread(cx, bulletY, dmg) {
        const lv = this.weaponLevel;
        if (lv === 1) {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
        } else if (lv === 2) {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
            this.game.addBullet(cx - 10, bulletY, -1.5, dmg);
            this.game.addBullet(cx + 6, bulletY, 1.5, dmg);
        } else if (lv === 3) {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
            this.game.addBullet(cx - 10, bulletY, -2, dmg);
            this.game.addBullet(cx + 6, bulletY, 2, dmg);
            this.game.addBullet(cx - 15, bulletY, -3.5, dmg);
            this.game.addBullet(cx + 11, bulletY, 3.5, dmg);
        } else if (lv === 4) {
            for (let i = -3; i <= 3; i++) {
                this.game.addBullet(cx + i * 5, bulletY, i * 1.2, dmg);
            }
        } else {
            for (let i = -3; i <= 3; i++) {
                this.game.addBullet(cx + i * 5, bulletY, i * 1.2, dmg);
            }
            this.game.addHomingBullet(cx, bulletY, dmg * 2);
        }
    }

    _shootRapid(cx, bulletY, dmg) {
        const lv = this.weaponLevel;
        this.fireDelay = Math.max(40, 100 - lv * 12);
        if (lv === 1) {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
        } else if (lv === 2) {
            this.game.addBullet(this.x + 5, bulletY, 0, dmg);
            this.game.addBullet(this.x + this.width - 9, bulletY, 0, dmg);
        } else if (lv === 3) {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
            this.game.addBullet(this.x + 3, bulletY, -0.5, dmg);
            this.game.addBullet(this.x + this.width - 7, bulletY, 0.5, dmg);
        } else if (lv === 4) {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
            this.game.addBullet(this.x + 3, bulletY, -0.5, dmg);
            this.game.addBullet(this.x + this.width - 7, bulletY, 0.5, dmg);
            this.game.addBullet(cx - 2, bulletY + 10, 0, dmg);
        } else {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
            this.game.addBullet(this.x + 3, bulletY, -1, dmg);
            this.game.addBullet(this.x + this.width - 7, bulletY, 1, dmg);
            this.game.addHomingBullet(cx, bulletY, dmg * 2);
        }
    }

    _shootHeavy(cx, bulletY, dmg) {
        const lv = this.weaponLevel;
        this.fireDelay = 250 * this.shipConfig.fireRate;
        if (lv === 1) {
            this.game.addHeavyBullet(cx - 4, bulletY, 0, dmg * 2);
        } else if (lv === 2) {
            this.game.addHeavyBullet(cx - 4, bulletY, 0, dmg * 2);
            this.game.addBullet(this.x + 3, bulletY, -1, dmg);
            this.game.addBullet(this.x + this.width - 7, bulletY, 1, dmg);
        } else if (lv === 3) {
            this.game.addHeavyBullet(cx - 10, bulletY, -0.3, dmg * 2);
            this.game.addHeavyBullet(cx + 2, bulletY, 0.3, dmg * 2);
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
        } else if (lv === 4) {
            this.game.addHeavyBullet(cx - 10, bulletY, -0.3, dmg * 3);
            this.game.addHeavyBullet(cx + 2, bulletY, 0.3, dmg * 3);
            this.game.addBullet(this.x, bulletY, -1.5, dmg);
            this.game.addBullet(this.x + this.width - 4, bulletY, 1.5, dmg);
        } else {
            this.game.addHeavyBullet(cx - 10, bulletY, -0.3, dmg * 3, true);
            this.game.addHeavyBullet(cx + 2, bulletY, 0.3, dmg * 3, true);
            this.game.addBullet(this.x, bulletY, -1.5, dmg);
            this.game.addBullet(this.x + this.width - 4, bulletY, 1.5, dmg);
            this.game.addHomingBullet(cx, bulletY, dmg * 3);
        }
        this.game.sound.playHeavyShoot();
    }

    useSpecial() {
        if (this.specialCooldown > 0) return false;
        this.specialCooldown = this.specialMaxCooldown;

        switch (this.special) {
            case 'dash':
                this.dashing = true;
                this.dashTimer = 300;
                this.game.createParticles(this.x + this.width / 2, this.y + this.height, this.shipConfig.color1, 15);
                return true;
            case 'bombBoost':
                this.specialActive = true;
                this.specialTimer = 5000;
                this.game.addScorePopup(this.x + this.width / 2, this.y - 20, 'BOMB BOOST!', 'cyan');
                return true;
            case 'chargeShot': {
                const cx = this.x + this.width / 2;
                this.game.addHeavyBullet(cx - 6, this.y, 0, this.effectiveDamage * 8, true);
                this.game.shakeScreen(5, 200);
                this.game.sound.playHeavyShoot();
                return true;
            }
            case 'homingBurst': {
                const cx2 = this.x + this.width / 2;
                for (let i = 0; i < 8; i++) {
                    this.game.addHomingBullet(cx2, this.y, this.effectiveDamage * 2);
                }
                return true;
            }
            case 'forceField':
                this.forceFieldActive = true;
                this.forceFieldTimer = 3000;
                this.game.addScorePopup(this.x + this.width / 2, this.y - 20, 'FORCE FIELD!', 'yellow');
                return true;
            case 'teleport':
                this.x = Math.random() * (this.game.width - this.width);
                this.y = this.game.height - this.height - 20 - Math.random() * 100;
                this.game.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#8844ff', 20);
                this.game.invincibleTimer = 1000;
                return true;
            default:
                return false;
        }
    }

    upgradeWeapon() {
        if (this.weaponLevel < this.maxWeaponLevel) {
            this.weaponLevel++;
            return true;
        }
        return false;
    }

    downgradeWeapon() {
        if (this.weaponLevel > 1) this.weaponLevel--;
    }

    get isInvincible() {
        return this.dashing || this.forceFieldActive || this.game.invincibleTimer > 0;
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        // Engine flame
        ctx.save();
        const flameHeight = 15 + this.engineFlicker * 10;
        const gradient = ctx.createLinearGradient(cx, this.y + this.height, cx, this.y + this.height + flameHeight);
        gradient.addColorStop(0, 'yellow');
        gradient.addColorStop(0.5, 'orange');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx - 10, this.y + this.height);
        ctx.lineTo(cx + 10, this.y + this.height);
        ctx.lineTo(cx, this.y + this.height + flameHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (this.dashing) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.shipConfig.color1;
            ctx.fillRect(this.x - 5, this.y, this.width + 10, this.height + 20);
            ctx.restore();
        }

        // Ship body
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.shipConfig.color1;

        const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        bodyGradient.addColorStop(0, this.shipConfig.color1);
        bodyGradient.addColorStop(0.5, this.shipConfig.color2);
        bodyGradient.addColorStop(1, '#222');
        ctx.fillStyle = bodyGradient;

        ctx.beginPath();
        ctx.moveTo(cx, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(cx, this.y + this.height * 0.7);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#aaeeff';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 20, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (this.hasShield) {
            ctx.save();
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'cyan';
            ctx.beginPath();
            ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.forceFieldActive) {
            ctx.save();
            const pulse = Math.sin(performance.now() / 100) * 0.2 + 0.5;
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#ffdd00';
            ctx.beginPath();
            ctx.arc(cx, cy, 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.fillStyle = WEAPON_PATHS[this.weaponPath].color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = WEAPON_PATHS[this.weaponPath].color;
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText('Lv.' + this.weaponLevel, this.x, this.y - 5);
        ctx.restore();
    }
}
