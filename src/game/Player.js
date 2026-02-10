export const WEAPON_PATHS = {
    spread: { name: '拡散', color: '#00ff88' },
    rapid: { name: '連射', color: '#ffaa00' },
    heavy: { name: '重火力', color: '#ff4444' },
    beam: { name: '光線', color: '#ff00ff' },
    all: { name: '全兵装', color: '#ffdd00' },
};

// Evolution tiers: base → Mk-II → Mk-III (at weapon lv 10, 20)
// Each ship is PEAKY - extreme in one area, weak in another
export const SHIPS = {
    speeder: {
        name: 'スピーダー',
        description: 'SPD MAX  ATK 低  ダッシュ',
        speed: 11,
        fireRate: 1.0,
        damage: 0.5,
        color1: '#00ff88',
        color2: '#00aa44',
        weaponPath: 'rapid',
        special: 'dash',
        specialDesc: 'ダッシュ(無敵移動)',
        evolution: ['スピーダー', 'スピーダー Mk-II', 'ライトニング'],
        trait: 'speed',
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
        evolution: ['バランス', 'バランス Mk-II', 'ヴァンガード'],
        trait: 'balanced',
    },
    tank: {
        name: 'タンク',
        description: 'SPD 極低  ATK MAX  チャージ',
        speed: 2.5,
        fireRate: 0.6,
        damage: 3,
        color1: '#ff6600',
        color2: '#aa4400',
        weaponPath: 'heavy',
        special: 'chargeShot',
        specialDesc: 'チャージショット',
        evolution: ['タンク', 'タンク Mk-II', 'デストロイヤー'],
        trait: 'power',
    },
    interceptor: {
        name: 'インターセプター',
        description: 'SPD 11  ATK 1  ホーミング',
        speed: 11,
        fireRate: 1.2,
        damage: 1,
        color1: '#ff00ff',
        color2: '#880088',
        weaponPath: 'rapid',
        special: 'homingBurst',
        specialDesc: 'ホーミングバースト',
        evolution: ['インターセプター', 'インターセプター Mk-II', 'ファルコン'],
        trait: 'homing',
    },
    fortress: {
        name: 'フォートレス',
        description: 'SPD 極低  ATK 3  鉄壁',
        speed: 2,
        fireRate: 0.5,
        damage: 3,
        color1: '#ffdd00',
        color2: '#aa8800',
        weaponPath: 'heavy',
        special: 'forceField',
        specialDesc: 'フォースフィールド',
        evolution: ['フォートレス', 'フォートレス Mk-II', 'アイアンウォール'],
        trait: 'defense',
    },
    phantom: {
        name: 'ファントム',
        description: 'SPD 7  ATK 1  テレポ+回避特化',
        speed: 7,
        fireRate: 1.0,
        damage: 1,
        color1: '#8844ff',
        color2: '#442288',
        weaponPath: 'spread',
        special: 'teleport',
        specialDesc: 'テレポート',
        evolution: ['ファントム', 'ファントム Mk-II', 'シャドウ'],
        trait: 'evasion',
    },
};

// NISHITANI BREAKER - ultimate ship, unlocked after maxing all shop upgrades
export const NISHITANI_BREAKER = {
    name: 'NISHITANI BREAKER',
    description: 'ALL MAX  全兵装搭載  最終決戦兵器',
    speed: 8,
    fireRate: 0.8,
    damage: 3,
    color1: '#ffdd00',
    color2: '#ff4400',
    weaponPath: 'all',
    special: 'nishitaniBreak',
    specialDesc: 'ニシタニブレイク',
    evolution: ['NISHITANI BREAKER', 'N-BREAKER EX', 'N-BREAKER OMEGA'],
    trait: 'ultimate',
};

export const SHIP_KEYS = ['speeder', 'balanced', 'tank', 'interceptor', 'fortress', 'phantom'];

export class Player {
    constructor(game, shipType = 'balanced') {
        this.game = game;
        this.shipType = shipType;

        if (shipType === 'nishitaniBreaker') {
            this.shipConfig = NISHITANI_BREAKER;
        } else {
            this.shipConfig = SHIPS[shipType] || SHIPS.balanced;
        }

        this.width = 50;
        this.height = 50;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.playAreaBottom - this.height - 10;
        this.speed = this.shipConfig.speed;
        this.baseSpeed = this.shipConfig.speed;
        this.damage = this.shipConfig.damage;
        this.baseDamage = this.shipConfig.damage;
        this.weaponLevel = 1;
        this.maxWeaponLevel = 30;
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

        // Speed/damage shop upgrades (max 30 each)
        this.speedBonus = 0;
        this.damageBonus = 0;
    }

    // Evolution tier based on weapon level
    get evolutionTier() {
        if (this.weaponLevel >= 20) return 2;
        if (this.weaponLevel >= 10) return 1;
        return 0;
    }

    get evolutionName() {
        const evos = this.shipConfig.evolution;
        if (!evos) return this.shipConfig.name;
        return evos[this.evolutionTier] || evos[0];
    }

    get effectiveSpeed() {
        return this.baseSpeed + this.speedBonus * 0.3 + (this.dashing ? 15 : 0);
    }

    get effectiveDamage() {
        return this.baseDamage + this.damageBonus * 0.15;
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
        if (this.y > this.game.playAreaBottom - this.height) this.y = this.game.playAreaBottom - this.height;

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

        // NISHITANI BREAKER uses all weapon types
        if (this.weaponPath === 'all') {
            this._shootAll(cx, bulletY, dmg);
        } else if (this.weaponPath === 'spread') {
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
        // Gradual spread increase: more bullets, wider angles
        const bulletCount = Math.min(1 + Math.floor(lv / 3), 11);
        const maxAngle = Math.min(1.5 + lv * 0.15, 5);

        if (bulletCount === 1) {
            this.game.addBullet(cx - 2, bulletY, 0, dmg);
        } else {
            for (let i = 0; i < bulletCount; i++) {
                const t = bulletCount === 1 ? 0 : i / (bulletCount - 1);
                const vx = -maxAngle + t * maxAngle * 2;
                this.game.addBullet(cx + i * 3 - bulletCount * 1.5, bulletY, vx, dmg);
            }
        }
        // Homing at lv15+
        if (lv >= 15) {
            this.game.addHomingBullet(cx, bulletY, dmg * 2);
        }
        if (lv >= 25) {
            this.game.addHomingBullet(cx - 10, bulletY, dmg * 2);
            this.game.addHomingBullet(cx + 10, bulletY, dmg * 2);
        }
    }

    _shootRapid(cx, bulletY, dmg) {
        const lv = this.weaponLevel;
        this.fireDelay = Math.max(30, 120 - lv * 3);
        const streams = Math.min(1 + Math.floor(lv / 5), 5);
        const spreadW = streams * 8;

        for (let i = 0; i < streams; i++) {
            const sx = cx - spreadW / 2 + (spreadW / Math.max(1, streams - 1)) * i;
            const vx = streams > 1 ? (i / (streams - 1) - 0.5) * 1.5 : 0;
            this.game.addBullet(sx, bulletY, vx, dmg);
        }
        if (lv >= 20) {
            this.game.addHomingBullet(cx, bulletY, dmg * 2);
        }
    }

    _shootHeavy(cx, bulletY, dmg) {
        const lv = this.weaponLevel;
        this.fireDelay = Math.max(150, 300 - lv * 4) * this.shipConfig.fireRate;
        const heavyCount = Math.min(1 + Math.floor(lv / 8), 4);
        const isPiercing = lv >= 15;
        const heavyDmg = dmg * (2 + Math.floor(lv / 10));

        for (let i = 0; i < heavyCount; i++) {
            const offset = (i - (heavyCount - 1) / 2) * 14;
            const vx = (i - (heavyCount - 1) / 2) * 0.3;
            this.game.addHeavyBullet(cx + offset - 4, bulletY, vx, heavyDmg, isPiercing);
        }
        // Side bullets
        if (lv >= 5) {
            this.game.addBullet(this.x + 3, bulletY, -1.5, dmg);
            this.game.addBullet(this.x + this.width - 7, bulletY, 1.5, dmg);
        }
        if (lv >= 25) {
            this.game.addHomingBullet(cx, bulletY, dmg * 3);
        }
        this.game.sound.playHeavyShoot();
    }

    _shootAll(cx, bulletY, dmg) {
        const lv = this.weaponLevel;
        this.fireDelay = Math.max(50, 100 - lv * 2);

        // Spread fan
        const fanCount = Math.min(3 + Math.floor(lv / 5), 9);
        for (let i = 0; i < fanCount; i++) {
            const vx = (i / (fanCount - 1) - 0.5) * 4;
            this.game.addBullet(cx + (i - fanCount / 2) * 4, bulletY, vx, dmg);
        }
        // Heavy center
        if (lv >= 5) {
            this.game.addHeavyBullet(cx - 4, bulletY, 0, dmg * 3, lv >= 15);
        }
        // Homing
        if (lv >= 10) {
            this.game.addHomingBullet(cx - 15, bulletY, dmg * 2);
            this.game.addHomingBullet(cx + 15, bulletY, dmg * 2);
        }
        this.game.sound.playShoot();
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
                this.y = this.game.playAreaBottom - this.height - 10 - Math.random() * 100;
                this.game.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#8844ff', 20);
                this.game.invincibleTimer = 1000;
                return true;
            case 'nishitaniBreak': {
                // Ultimate: bomb + homing burst + force field
                const cx3 = this.x + this.width / 2;
                this.game.useBomb();
                for (let i = 0; i < 12; i++) {
                    this.game.addHomingBullet(cx3, this.y, this.effectiveDamage * 3);
                }
                this.forceFieldActive = true;
                this.forceFieldTimer = 2000;
                this.game.shakeScreen(15, 500);
                this.game.flashScreen('rgba(255, 255, 0, 0.3)', 300);
                this.game.addScorePopup(cx3, this.y - 30, 'NISHITANI BREAK!', '#ffdd00');
                return true;
            }
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
        const tier = this.evolutionTier;

        // Engine flame (bigger at higher tiers)
        ctx.save();
        const flameH = 15 + this.engineFlicker * 10 + tier * 5;
        const flameW = 10 + tier * 4;
        const gradient = ctx.createLinearGradient(cx, this.y + this.height, cx, this.y + this.height + flameH);
        gradient.addColorStop(0, tier >= 2 ? '#00ffff' : 'yellow');
        gradient.addColorStop(0.5, tier >= 2 ? '#0088ff' : 'orange');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx - flameW, this.y + this.height);
        ctx.lineTo(cx + flameW, this.y + this.height);
        ctx.lineTo(cx, this.y + this.height + flameH);
        ctx.closePath();
        ctx.fill();
        // Side thrusters at tier 2
        if (tier >= 2) {
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + this.height - 5);
            ctx.lineTo(this.x + 12, this.y + this.height - 5);
            ctx.lineTo(this.x + 8, this.y + this.height + flameH * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 12, this.y + this.height - 5);
            ctx.lineTo(this.x + this.width - 5, this.y + this.height - 5);
            ctx.lineTo(this.x + this.width - 8, this.y + this.height + flameH * 0.5);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        if (this.dashing) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.shipConfig.color1;
            ctx.fillRect(this.x - 5, this.y, this.width + 10, this.height + 20);
            ctx.restore();
        }

        // Ship body - evolves with tier
        ctx.save();
        ctx.shadowBlur = 15 + tier * 5;
        ctx.shadowColor = this.shipConfig.color1;

        const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        bodyGradient.addColorStop(0, this.shipConfig.color1);
        bodyGradient.addColorStop(0.5, this.shipConfig.color2);
        bodyGradient.addColorStop(1, '#222');
        ctx.fillStyle = bodyGradient;

        if (tier === 0) {
            // Basic triangle
            ctx.beginPath();
            ctx.moveTo(cx, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(cx, this.y + this.height * 0.7);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        } else if (tier === 1) {
            // Mk-II: swept wings + fin
            ctx.beginPath();
            ctx.moveTo(cx, this.y - 4);
            ctx.lineTo(this.x + this.width + 5, this.y + this.height * 0.9);
            ctx.lineTo(this.x + this.width - 5, this.y + this.height);
            ctx.lineTo(cx, this.y + this.height * 0.6);
            ctx.lineTo(this.x + 5, this.y + this.height);
            ctx.lineTo(this.x - 5, this.y + this.height * 0.9);
            ctx.closePath();
            ctx.fill();
            // Dorsal fin
            ctx.fillStyle = this.shipConfig.color1;
            ctx.beginPath();
            ctx.moveTo(cx, this.y - 4);
            ctx.lineTo(cx + 3, this.y + 20);
            ctx.lineTo(cx - 3, this.y + 20);
            ctx.closePath();
            ctx.fill();
        } else {
            // Tier 2: aggressive angular body with wing hardpoints
            ctx.beginPath();
            ctx.moveTo(cx, this.y - 8);
            ctx.lineTo(this.x + this.width + 10, this.y + this.height * 0.85);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(cx + 8, this.y + this.height * 0.55);
            ctx.lineTo(cx, this.y + this.height * 0.6);
            ctx.lineTo(cx - 8, this.y + this.height * 0.55);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.lineTo(this.x - 10, this.y + this.height * 0.85);
            ctx.closePath();
            ctx.fill();

            // Wing hardpoints (glowing dots)
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x - 5, this.y + this.height * 0.87, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width + 5, this.y + this.height * 0.87, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cockpit glow
        ctx.fillStyle = tier >= 2 ? '#ffffff' : '#aaeeff';
        ctx.shadowBlur = tier >= 2 ? 15 : 5;
        ctx.shadowColor = tier >= 2 ? '#00ffff' : '#aaeeff';
        ctx.beginPath();
        const cockpitH = tier >= 1 ? 14 : 12;
        ctx.ellipse(cx, this.y + 18 - tier * 2, 6 + tier * 2, cockpitH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // NISHITANI BREAKER special glow
        if (this.shipType === 'nishitaniBreaker') {
            ctx.save();
            const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.5;
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffdd00';
            ctx.beginPath();
            ctx.arc(cx, cy, 35, 0, Math.PI * 2);
            ctx.stroke();
            // "N" emblem
            ctx.fillStyle = '#ffdd00';
            ctx.font = "bold 10px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('N', cx, this.y + this.height + 15);
            ctx.restore();
        }

        // Shield
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

        // Force field
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

        // Weapon level + evolution name
        ctx.save();
        ctx.fillStyle = WEAPON_PATHS[this.weaponPath] ? WEAPON_PATHS[this.weaponPath].color : '#fff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = ctx.fillStyle;
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('Lv.' + this.weaponLevel, cx, this.y - 5);
        ctx.restore();
    }
}
