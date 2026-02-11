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

// NISHITANI BREAKER - ultimate ship, unlocked when any stat (weapon/speed/damage) reaches MAX
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

        const scale = game.mobileScale || 1;
        this.width = Math.floor(35 * scale);
        this.height = Math.floor(35 * scale);
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

        // Shop items
        this.hasMagnet = false;
        this.fireRateBonus = 0;
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
        const t = performance.now();
        const trait = this.shipConfig.trait;
        const c1 = this.shipConfig.color1;
        const c2 = this.shipConfig.color2;
        const w = this.width;
        const h = this.height;
        const lx = this.x;       // left x
        const ty = this.y;       // top y
        const rx = lx + w;       // right x
        const by = ty + h;       // bottom y
        const flicker = this.engineFlicker;

        // ── Helper: radial engine glow ──
        const drawEngineGlow = (ex, ey, radius, innerColor, outerColor) => {
            const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius);
            g.addColorStop(0, innerColor);
            g.addColorStop(0.4, outerColor);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(ex, ey, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        // ── Helper: panel line ──
        const panelLine = (x1, y1, x2, y2, alpha) => {
            ctx.strokeStyle = `rgba(255,255,255,${alpha || 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        };

        // ── Helper: weapon pod ──
        const drawWeaponPod = (px, py, size) => {
            ctx.fillStyle = '#555';
            ctx.fillRect(px - size / 2, py - size, size, size * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 4;
            ctx.shadowColor = c1;
            ctx.beginPath();
            ctx.arc(px, py - size, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        };

        // ── Dash after-image ──
        if (this.dashing) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = c1;
            ctx.fillRect(lx - 5, ty, w + 10, h + 20);
            ctx.restore();
        }

        // ================================================================
        //  SHIP DRAWING — per trait, per tier
        // ================================================================
        ctx.save();

        if (trait === 'speed') {
            // ── SPEEDER — needle body, swept-back tiny wings ──
            const engineR = 6 + tier * 3 + flicker * 4;
            // Engine nacelles — dual thin engines
            const eOffX = 6 + tier * 2;
            drawEngineGlow(cx - eOffX, by + 2, engineR, '#aaffcc', '#00ff88');
            drawEngineGlow(cx + eOffX, by + 2, engineR, '#aaffcc', '#00ff88');
            if (tier >= 2) {
                drawEngineGlow(cx, by + 4, engineR * 1.2, '#ffffff', '#00ffaa');
            }

            // Hull gradient
            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, c1);
            bg.addColorStop(0.6, c2);
            bg.addColorStop(1, '#1a3322');
            ctx.fillStyle = bg;
            ctx.shadowBlur = 12 + tier * 6;
            ctx.shadowColor = c1;

            if (tier === 0) {
                // Sleek needle — long thin fuselage, tiny swept wings
                ctx.beginPath();
                ctx.moveTo(cx, ty);                    // nose tip
                ctx.lineTo(cx + 4, ty + h * 0.25);     // right fuselage widen
                ctx.lineTo(cx + 5, ty + h * 0.55);     // right body
                ctx.lineTo(rx - 2, ty + h * 0.85);     // right wing tip
                ctx.lineTo(cx + 7, ty + h * 0.78);     // wing root right
                ctx.lineTo(cx + 5, by);                 // right engine
                ctx.lineTo(cx - 5, by);                 // left engine
                ctx.lineTo(cx - 7, ty + h * 0.78);     // wing root left
                ctx.lineTo(lx + 2, ty + h * 0.85);     // left wing tip
                ctx.lineTo(cx - 5, ty + h * 0.55);     // left body
                ctx.lineTo(cx - 4, ty + h * 0.25);     // left fuselage
                ctx.closePath();
                ctx.fill();
            } else if (tier === 1) {
                // Mk-II: F-22 raptor silhouette — wider angular intakes, canted tails
                ctx.beginPath();
                ctx.moveTo(cx, ty - 4);                // nose
                ctx.lineTo(cx + 6, ty + h * 0.15);     // right cheek
                ctx.lineTo(cx + 10, ty + h * 0.3);     // right intake
                ctx.lineTo(rx + 4, ty + h * 0.72);     // right wing leading edge
                ctx.lineTo(rx + 6, ty + h * 0.78);     // right wing tip
                ctx.lineTo(rx - 4, ty + h * 0.82);     // right wing trailing
                ctx.lineTo(cx + 8, ty + h * 0.7);      // right body
                ctx.lineTo(cx + 8, by);                 // right tail
                ctx.lineTo(cx + 12, by + 4);            // right canted tail tip
                ctx.lineTo(cx + 6, by - 2);             // inner tail right
                ctx.lineTo(cx - 6, by - 2);             // inner tail left
                ctx.lineTo(cx - 12, by + 4);            // left canted tail tip
                ctx.lineTo(cx - 8, by);                 // left tail
                ctx.lineTo(cx - 8, ty + h * 0.7);      // left body
                ctx.lineTo(lx + 4, ty + h * 0.82);     // left wing trailing
                ctx.lineTo(lx - 6, ty + h * 0.78);     // left wing tip
                ctx.lineTo(lx - 4, ty + h * 0.72);     // left wing leading
                ctx.lineTo(cx - 10, ty + h * 0.3);     // left intake
                ctx.lineTo(cx - 6, ty + h * 0.15);     // left cheek
                ctx.closePath();
                ctx.fill();
                // Intake shadow panels
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.moveTo(cx + 6, ty + h * 0.15);
                ctx.lineTo(cx + 10, ty + h * 0.3);
                ctx.lineTo(cx + 8, ty + h * 0.45);
                ctx.lineTo(cx + 5, ty + h * 0.35);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx - 6, ty + h * 0.15);
                ctx.lineTo(cx - 10, ty + h * 0.3);
                ctx.lineTo(cx - 8, ty + h * 0.45);
                ctx.lineTo(cx - 5, ty + h * 0.35);
                ctx.closePath();
                ctx.fill();
            } else {
                // Tier 2 Lightning — extreme swept, razor-thin with afterburners
                ctx.beginPath();
                ctx.moveTo(cx, ty - 8);                // long needle nose
                ctx.lineTo(cx + 3, ty + h * 0.1);
                ctx.lineTo(cx + 8, ty + h * 0.2);      // right intake bulge
                ctx.lineTo(rx + 8, ty + h * 0.65);     // right wing far out
                ctx.lineTo(rx + 12, ty + h * 0.7);     // right wingtip
                ctx.lineTo(rx, ty + h * 0.75);         // trailing edge
                ctx.lineTo(cx + 10, ty + h * 0.6);
                ctx.lineTo(cx + 10, by);                // right nozzle
                ctx.lineTo(cx + 14, by + 6);            // right tail fin
                ctx.lineTo(cx + 7, by - 2);
                ctx.lineTo(cx - 7, by - 2);
                ctx.lineTo(cx - 14, by + 6);            // left tail fin
                ctx.lineTo(cx - 10, by);
                ctx.lineTo(cx - 10, ty + h * 0.6);
                ctx.lineTo(lx, ty + h * 0.75);
                ctx.lineTo(lx - 12, ty + h * 0.7);
                ctx.lineTo(lx - 8, ty + h * 0.65);
                ctx.lineTo(cx - 8, ty + h * 0.2);
                ctx.lineTo(cx - 3, ty + h * 0.1);
                ctx.closePath();
                ctx.fill();
                // Canard fins
                ctx.fillStyle = c1;
                ctx.beginPath();
                ctx.moveTo(cx + 5, ty + h * 0.18);
                ctx.lineTo(cx + 16, ty + h * 0.25);
                ctx.lineTo(cx + 6, ty + h * 0.28);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx - 5, ty + h * 0.18);
                ctx.lineTo(cx - 16, ty + h * 0.25);
                ctx.lineTo(cx - 6, ty + h * 0.28);
                ctx.closePath();
                ctx.fill();
                // Wing hardpoints
                drawWeaponPod(lx - 8, ty + h * 0.68, 3);
                drawWeaponPod(rx + 8, ty + h * 0.68, 3);
            }
            // Panel lines
            panelLine(cx, ty + 4, cx, ty + h * 0.5, 0.15);
            panelLine(cx - 3, ty + h * 0.3, cx + 3, ty + h * 0.3, 0.1);

            // Cockpit
            ctx.fillStyle = '#ccffee';
            ctx.shadowBlur = 8 + tier * 4;
            ctx.shadowColor = '#00ff88';
            ctx.beginPath();
            ctx.ellipse(cx, ty + 12 + tier * 2, 3 + tier, 8 + tier * 2, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (trait === 'balanced') {
            // ── BALANCED — X-Wing style ──
            const engineR = 7 + tier * 3 + flicker * 4;
            // Four engine nacelles on wing tips
            const wingTipXOff = 14 + tier * 6;
            const wingTipY = ty + h * 0.75;
            drawEngineGlow(cx - wingTipXOff, wingTipY + 4, engineR, '#aaddff', '#0088ff');
            drawEngineGlow(cx + wingTipXOff, wingTipY + 4, engineR, '#aaddff', '#0088ff');
            if (tier >= 1) {
                drawEngineGlow(cx - wingTipXOff + 3, wingTipY - 8, engineR * 0.7, '#ffffff', '#00aaff');
                drawEngineGlow(cx + wingTipXOff - 3, wingTipY - 8, engineR * 0.7, '#ffffff', '#00aaff');
            }

            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, c1);
            bg.addColorStop(0.5, c2);
            bg.addColorStop(1, '#112233');
            ctx.fillStyle = bg;
            ctx.shadowBlur = 12 + tier * 5;
            ctx.shadowColor = c1;

            if (tier === 0) {
                // Classic X-Wing — four wings in X pattern, cylindrical body
                // Fuselage
                ctx.beginPath();
                ctx.moveTo(cx, ty + 2);
                ctx.lineTo(cx + 6, ty + h * 0.15);
                ctx.lineTo(cx + 7, ty + h * 0.7);
                ctx.lineTo(cx + 5, by);
                ctx.lineTo(cx - 5, by);
                ctx.lineTo(cx - 7, ty + h * 0.7);
                ctx.lineTo(cx - 6, ty + h * 0.15);
                ctx.closePath();
                ctx.fill();
                // Upper-right wing
                ctx.beginPath();
                ctx.moveTo(cx + 6, ty + h * 0.3);
                ctx.lineTo(rx + 2, ty + h * 0.15);
                ctx.lineTo(rx + 4, ty + h * 0.2);
                ctx.lineTo(cx + 7, ty + h * 0.5);
                ctx.closePath();
                ctx.fill();
                // Lower-right wing
                ctx.beginPath();
                ctx.moveTo(cx + 7, ty + h * 0.55);
                ctx.lineTo(rx + 4, ty + h * 0.8);
                ctx.lineTo(rx + 2, ty + h * 0.85);
                ctx.lineTo(cx + 7, ty + h * 0.7);
                ctx.closePath();
                ctx.fill();
                // Upper-left wing
                ctx.beginPath();
                ctx.moveTo(cx - 6, ty + h * 0.3);
                ctx.lineTo(lx - 2, ty + h * 0.15);
                ctx.lineTo(lx - 4, ty + h * 0.2);
                ctx.lineTo(cx - 7, ty + h * 0.5);
                ctx.closePath();
                ctx.fill();
                // Lower-left wing
                ctx.beginPath();
                ctx.moveTo(cx - 7, ty + h * 0.55);
                ctx.lineTo(lx - 4, ty + h * 0.8);
                ctx.lineTo(lx - 2, ty + h * 0.85);
                ctx.lineTo(cx - 7, ty + h * 0.7);
                ctx.closePath();
                ctx.fill();
            } else if (tier === 1) {
                // Mk-II with forward canards, wider X-wings
                // Fuselage
                ctx.beginPath();
                ctx.moveTo(cx, ty - 2);
                ctx.lineTo(cx + 7, ty + h * 0.12);
                ctx.lineTo(cx + 8, ty + h * 0.7);
                ctx.lineTo(cx + 6, by + 2);
                ctx.lineTo(cx - 6, by + 2);
                ctx.lineTo(cx - 8, ty + h * 0.7);
                ctx.lineTo(cx - 7, ty + h * 0.12);
                ctx.closePath();
                ctx.fill();
                // Right wings — wider spread
                ctx.beginPath();
                ctx.moveTo(cx + 7, ty + h * 0.25);
                ctx.lineTo(rx + 8, ty + h * 0.08);
                ctx.lineTo(rx + 10, ty + h * 0.15);
                ctx.lineTo(cx + 8, ty + h * 0.45);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx + 8, ty + h * 0.55);
                ctx.lineTo(rx + 10, ty + h * 0.82);
                ctx.lineTo(rx + 8, ty + h * 0.9);
                ctx.lineTo(cx + 8, ty + h * 0.72);
                ctx.closePath();
                ctx.fill();
                // Left wings
                ctx.beginPath();
                ctx.moveTo(cx - 7, ty + h * 0.25);
                ctx.lineTo(lx - 8, ty + h * 0.08);
                ctx.lineTo(lx - 10, ty + h * 0.15);
                ctx.lineTo(cx - 8, ty + h * 0.45);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx - 8, ty + h * 0.55);
                ctx.lineTo(lx - 10, ty + h * 0.82);
                ctx.lineTo(lx - 8, ty + h * 0.9);
                ctx.lineTo(cx - 8, ty + h * 0.72);
                ctx.closePath();
                ctx.fill();
                // Forward canards
                ctx.fillStyle = c1;
                ctx.beginPath();
                ctx.moveTo(cx + 5, ty + h * 0.1);
                ctx.lineTo(cx + 18, ty + h * 0.05);
                ctx.lineTo(cx + 16, ty + h * 0.12);
                ctx.lineTo(cx + 6, ty + h * 0.15);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx - 5, ty + h * 0.1);
                ctx.lineTo(cx - 18, ty + h * 0.05);
                ctx.lineTo(cx - 16, ty + h * 0.12);
                ctx.lineTo(cx - 6, ty + h * 0.15);
                ctx.closePath();
                ctx.fill();
            } else {
                // Tier 2 Vanguard — full X-wing with armored body + canards + pods
                // Wide fuselage
                ctx.beginPath();
                ctx.moveTo(cx, ty - 4);
                ctx.lineTo(cx + 9, ty + h * 0.1);
                ctx.lineTo(cx + 10, ty + h * 0.65);
                ctx.lineTo(cx + 8, by + 2);
                ctx.lineTo(cx - 8, by + 2);
                ctx.lineTo(cx - 10, ty + h * 0.65);
                ctx.lineTo(cx - 9, ty + h * 0.1);
                ctx.closePath();
                ctx.fill();
                // Upper wings
                ctx.beginPath();
                ctx.moveTo(cx + 9, ty + h * 0.2);
                ctx.lineTo(rx + 14, ty);
                ctx.lineTo(rx + 16, ty + h * 0.1);
                ctx.lineTo(cx + 10, ty + h * 0.42);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx - 9, ty + h * 0.2);
                ctx.lineTo(lx - 14, ty);
                ctx.lineTo(lx - 16, ty + h * 0.1);
                ctx.lineTo(cx - 10, ty + h * 0.42);
                ctx.closePath();
                ctx.fill();
                // Lower wings
                ctx.beginPath();
                ctx.moveTo(cx + 10, ty + h * 0.55);
                ctx.lineTo(rx + 16, ty + h * 0.85);
                ctx.lineTo(rx + 14, ty + h * 0.95);
                ctx.lineTo(cx + 10, ty + h * 0.72);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx - 10, ty + h * 0.55);
                ctx.lineTo(lx - 16, ty + h * 0.85);
                ctx.lineTo(lx - 14, ty + h * 0.95);
                ctx.lineTo(cx - 10, ty + h * 0.72);
                ctx.closePath();
                ctx.fill();
                // Canards
                ctx.fillStyle = c1;
                ctx.beginPath();
                ctx.moveTo(cx + 6, ty + h * 0.06);
                ctx.lineTo(cx + 22, ty - 2);
                ctx.lineTo(cx + 20, ty + h * 0.08);
                ctx.lineTo(cx + 7, ty + h * 0.12);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx - 6, ty + h * 0.06);
                ctx.lineTo(cx - 22, ty - 2);
                ctx.lineTo(cx - 20, ty + h * 0.08);
                ctx.lineTo(cx - 7, ty + h * 0.12);
                ctx.closePath();
                ctx.fill();
                // Wing tip weapon pods
                drawWeaponPod(rx + 15, ty + h * 0.05, 3);
                drawWeaponPod(lx - 15, ty + h * 0.05, 3);
                drawWeaponPod(rx + 15, ty + h * 0.9, 3);
                drawWeaponPod(lx - 15, ty + h * 0.9, 3);
            }
            // Panel lines
            panelLine(cx, ty + 6, cx, by - 6, 0.1);
            panelLine(cx - 5, ty + h * 0.4, cx + 5, ty + h * 0.4, 0.12);

            // Cockpit
            ctx.fillStyle = '#ccddff';
            ctx.shadowBlur = 6 + tier * 4;
            ctx.shadowColor = '#00aaff';
            ctx.beginPath();
            ctx.ellipse(cx, ty + 14 + tier, 4 + tier, 9 + tier * 2, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (trait === 'power') {
            // ── TANK — heavy bomber, wide flat body ──
            const engineR = 10 + tier * 4 + flicker * 5;
            // Massive single engine block
            drawEngineGlow(cx, by + 4, engineR * 1.4, '#ffcc88', '#ff6600');
            if (tier >= 1) {
                drawEngineGlow(cx - 12, by + 2, engineR * 0.8, '#ffaa44', '#aa4400');
                drawEngineGlow(cx + 12, by + 2, engineR * 0.8, '#ffaa44', '#aa4400');
            }
            if (tier >= 2) {
                drawEngineGlow(cx - 20, by, engineR * 0.6, '#ffcc88', '#ff4400');
                drawEngineGlow(cx + 20, by, engineR * 0.6, '#ffcc88', '#ff4400');
            }

            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, c1);
            bg.addColorStop(0.4, c2);
            bg.addColorStop(1, '#331100');
            ctx.fillStyle = bg;
            ctx.shadowBlur = 10 + tier * 6;
            ctx.shadowColor = c1;

            if (tier === 0) {
                // Wide flat bomber body
                ctx.beginPath();
                ctx.moveTo(cx, ty + 4);                // nose (blunt)
                ctx.lineTo(cx + 8, ty + 2);
                ctx.lineTo(cx + 12, ty + h * 0.2);
                ctx.lineTo(rx + 2, ty + h * 0.5);      // right wing
                ctx.lineTo(rx + 4, ty + h * 0.55);
                ctx.lineTo(rx - 2, ty + h * 0.65);
                ctx.lineTo(cx + 14, ty + h * 0.7);
                ctx.lineTo(cx + 12, by);
                ctx.lineTo(cx - 12, by);
                ctx.lineTo(cx - 14, ty + h * 0.7);
                ctx.lineTo(lx + 2, ty + h * 0.65);
                ctx.lineTo(lx - 4, ty + h * 0.55);
                ctx.lineTo(lx - 2, ty + h * 0.5);
                ctx.lineTo(cx - 12, ty + h * 0.2);
                ctx.lineTo(cx - 8, ty + 2);
                ctx.closePath();
                ctx.fill();
                // Armor plate lines
                panelLine(cx - 10, ty + h * 0.25, cx + 10, ty + h * 0.25, 0.15);
                panelLine(cx - 12, ty + h * 0.5, cx + 12, ty + h * 0.5, 0.15);
                panelLine(cx - 10, ty + h * 0.7, cx + 10, ty + h * 0.7, 0.12);
            } else if (tier === 1) {
                // Mk-II: heavier, wider wings, visible bombs/hardpoints
                ctx.beginPath();
                ctx.moveTo(cx, ty);
                ctx.lineTo(cx + 10, ty + 2);
                ctx.lineTo(cx + 14, ty + h * 0.18);
                ctx.lineTo(rx + 8, ty + h * 0.45);
                ctx.lineTo(rx + 10, ty + h * 0.52);
                ctx.lineTo(rx + 6, ty + h * 0.6);
                ctx.lineTo(cx + 16, ty + h * 0.65);
                ctx.lineTo(cx + 14, by + 2);
                ctx.lineTo(cx - 14, by + 2);
                ctx.lineTo(cx - 16, ty + h * 0.65);
                ctx.lineTo(lx - 6, ty + h * 0.6);
                ctx.lineTo(lx - 10, ty + h * 0.52);
                ctx.lineTo(lx - 8, ty + h * 0.45);
                ctx.lineTo(cx - 14, ty + h * 0.18);
                ctx.lineTo(cx - 10, ty + 2);
                ctx.closePath();
                ctx.fill();
                // Hardpoints under wings
                drawWeaponPod(rx + 4, ty + h * 0.55, 3);
                drawWeaponPod(lx - 4, ty + h * 0.55, 3);
                panelLine(cx - 12, ty + h * 0.22, cx + 12, ty + h * 0.22, 0.15);
                panelLine(cx - 14, ty + h * 0.5, cx + 14, ty + h * 0.5, 0.15);
            } else {
                // Tier 2 Destroyer — flying fortress with turret mounts
                ctx.beginPath();
                ctx.moveTo(cx, ty - 4);
                ctx.lineTo(cx + 12, ty);
                ctx.lineTo(cx + 16, ty + h * 0.15);
                ctx.lineTo(rx + 14, ty + h * 0.4);
                ctx.lineTo(rx + 18, ty + h * 0.48);
                ctx.lineTo(rx + 14, ty + h * 0.58);
                ctx.lineTo(cx + 18, ty + h * 0.62);
                ctx.lineTo(cx + 16, by + 2);
                ctx.lineTo(cx - 16, by + 2);
                ctx.lineTo(cx - 18, ty + h * 0.62);
                ctx.lineTo(lx - 14, ty + h * 0.58);
                ctx.lineTo(lx - 18, ty + h * 0.48);
                ctx.lineTo(lx - 14, ty + h * 0.4);
                ctx.lineTo(cx - 16, ty + h * 0.15);
                ctx.lineTo(cx - 12, ty);
                ctx.closePath();
                ctx.fill();
                // Armor plating overlay
                ctx.fillStyle = 'rgba(255,150,0,0.15)';
                ctx.fillRect(cx - 14, ty + h * 0.18, 28, h * 0.25);
                ctx.fillRect(cx - 16, ty + h * 0.5, 32, h * 0.15);
                // Turret mounts
                drawWeaponPod(rx + 10, ty + h * 0.45, 4);
                drawWeaponPod(lx - 10, ty + h * 0.45, 4);
                drawWeaponPod(cx, ty + h * 0.18, 4);
                panelLine(cx - 14, ty + h * 0.2, cx + 14, ty + h * 0.2, 0.18);
                panelLine(cx - 16, ty + h * 0.48, cx + 16, ty + h * 0.48, 0.18);
                panelLine(cx - 14, ty + h * 0.65, cx + 14, ty + h * 0.65, 0.15);
            }
            // Cockpit — small armored slit
            ctx.fillStyle = '#ffeedd';
            ctx.shadowBlur = 5 + tier * 3;
            ctx.shadowColor = '#ff8800';
            ctx.beginPath();
            ctx.ellipse(cx, ty + 10 + tier * 2, 5 + tier * 2, 5 + tier, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (trait === 'homing') {
            // ── INTERCEPTOR — aggressive delta wing ──
            const engineR = 7 + tier * 3 + flicker * 5;
            drawEngineGlow(cx - 5, by + 3, engineR, '#ffaaff', '#ff00ff');
            drawEngineGlow(cx + 5, by + 3, engineR, '#ffaaff', '#ff00ff');
            if (tier >= 2) {
                drawEngineGlow(cx, by + 5, engineR * 1.3, '#ffffff', '#ff44ff');
            }

            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, c1);
            bg.addColorStop(0.5, c2);
            bg.addColorStop(1, '#220022');
            ctx.fillStyle = bg;
            ctx.shadowBlur = 14 + tier * 6;
            ctx.shadowColor = c1;

            if (tier === 0) {
                // Aggressive delta — sharp pointed nose, wide triangular wings
                ctx.beginPath();
                ctx.moveTo(cx, ty - 2);                 // sharp nose
                ctx.lineTo(cx + 4, ty + h * 0.2);
                ctx.lineTo(rx + 6, ty + h * 0.7);       // right wing tip
                ctx.lineTo(rx + 2, ty + h * 0.78);
                ctx.lineTo(cx + 6, ty + h * 0.65);
                ctx.lineTo(cx + 6, by);
                ctx.lineTo(cx - 6, by);
                ctx.lineTo(cx - 6, ty + h * 0.65);
                ctx.lineTo(lx - 2, ty + h * 0.78);
                ctx.lineTo(lx - 6, ty + h * 0.7);       // left wing tip
                ctx.lineTo(cx - 4, ty + h * 0.2);
                ctx.closePath();
                ctx.fill();
                // Wing edge highlights
                ctx.strokeStyle = 'rgba(255,0,255,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, ty - 2);
                ctx.lineTo(rx + 6, ty + h * 0.7);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, ty - 2);
                ctx.lineTo(lx - 6, ty + h * 0.7);
                ctx.stroke();
            } else if (tier === 1) {
                // Mk-II: sharper edges, ventral fins
                ctx.beginPath();
                ctx.moveTo(cx, ty - 6);
                ctx.lineTo(cx + 5, ty + h * 0.15);
                ctx.lineTo(rx + 10, ty + h * 0.65);
                ctx.lineTo(rx + 8, ty + h * 0.75);
                ctx.lineTo(cx + 8, ty + h * 0.6);
                ctx.lineTo(cx + 8, by);
                ctx.lineTo(cx + 10, by + 6);            // right ventral fin
                ctx.lineTo(cx + 6, by - 2);
                ctx.lineTo(cx - 6, by - 2);
                ctx.lineTo(cx - 10, by + 6);            // left ventral fin
                ctx.lineTo(cx - 8, by);
                ctx.lineTo(cx - 8, ty + h * 0.6);
                ctx.lineTo(lx - 8, ty + h * 0.75);
                ctx.lineTo(lx - 10, ty + h * 0.65);
                ctx.lineTo(cx - 5, ty + h * 0.15);
                ctx.closePath();
                ctx.fill();
                // Dorsal spine
                ctx.fillStyle = c1;
                ctx.beginPath();
                ctx.moveTo(cx, ty - 6);
                ctx.lineTo(cx + 2, ty + h * 0.35);
                ctx.lineTo(cx - 2, ty + h * 0.35);
                ctx.closePath();
                ctx.fill();
            } else {
                // Tier 2 Falcon — forward-swept wings, ultra aggressive
                ctx.beginPath();
                ctx.moveTo(cx, ty - 10);                // extreme needle nose
                ctx.lineTo(cx + 4, ty + h * 0.1);
                ctx.lineTo(cx + 10, ty + h * 0.25);
                // Forward-swept right wing
                ctx.lineTo(rx + 12, ty + h * 0.2);      // wing sweeps FORWARD
                ctx.lineTo(rx + 14, ty + h * 0.28);
                ctx.lineTo(cx + 12, ty + h * 0.45);
                ctx.lineTo(cx + 10, ty + h * 0.55);
                // Rear right stabilizer
                ctx.lineTo(rx + 6, ty + h * 0.82);
                ctx.lineTo(rx + 4, ty + h * 0.9);
                ctx.lineTo(cx + 8, ty + h * 0.75);
                ctx.lineTo(cx + 8, by);
                ctx.lineTo(cx + 12, by + 8);            // tail fin
                ctx.lineTo(cx + 6, by - 2);
                ctx.lineTo(cx - 6, by - 2);
                ctx.lineTo(cx - 12, by + 8);
                ctx.lineTo(cx - 8, by);
                ctx.lineTo(cx - 8, ty + h * 0.75);
                ctx.lineTo(lx - 4, ty + h * 0.9);
                ctx.lineTo(lx - 6, ty + h * 0.82);
                ctx.lineTo(cx - 10, ty + h * 0.55);
                ctx.lineTo(cx - 12, ty + h * 0.45);
                ctx.lineTo(lx - 14, ty + h * 0.28);
                ctx.lineTo(lx - 12, ty + h * 0.2);
                ctx.lineTo(cx - 10, ty + h * 0.25);
                ctx.lineTo(cx - 4, ty + h * 0.1);
                ctx.closePath();
                ctx.fill();
                // Weapon pods on forward-swept wing tips
                drawWeaponPod(rx + 13, ty + h * 0.24, 3);
                drawWeaponPod(lx - 13, ty + h * 0.24, 3);
                // Edge glow lines
                ctx.strokeStyle = 'rgba(255,0,255,0.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, ty - 10);
                ctx.lineTo(rx + 12, ty + h * 0.2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, ty - 10);
                ctx.lineTo(lx - 12, ty + h * 0.2);
                ctx.stroke();
            }
            panelLine(cx, ty + 4, cx, by - 8, 0.1);

            // Cockpit — angular
            ctx.fillStyle = '#ffccff';
            ctx.shadowBlur = 8 + tier * 4;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(cx, ty + 8 + tier);
            ctx.lineTo(cx + 4 + tier, ty + 18 + tier * 2);
            ctx.lineTo(cx - 4 - tier, ty + 18 + tier * 2);
            ctx.closePath();
            ctx.fill();

        } else if (trait === 'defense') {
            // ── FORTRESS — boxy armored gunship ──
            const engineR = 9 + tier * 4 + flicker * 4;
            drawEngineGlow(cx - 10, by + 3, engineR, '#ffffaa', '#ffdd00');
            drawEngineGlow(cx + 10, by + 3, engineR, '#ffffaa', '#ffdd00');
            drawEngineGlow(cx, by + 5, engineR * 0.8, '#ffffff', '#ffaa00');
            if (tier >= 2) {
                drawEngineGlow(cx - 20, by + 2, engineR * 0.7, '#ffee88', '#aa8800');
                drawEngineGlow(cx + 20, by + 2, engineR * 0.7, '#ffee88', '#aa8800');
            }

            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, c1);
            bg.addColorStop(0.4, c2);
            bg.addColorStop(1, '#332200');
            ctx.fillStyle = bg;
            ctx.shadowBlur = 10 + tier * 5;
            ctx.shadowColor = c1;

            if (tier === 0) {
                // Boxy gunship — flat armored hull
                ctx.beginPath();
                ctx.moveTo(cx - 4, ty + 4);             // blunt nose left
                ctx.lineTo(cx + 4, ty + 4);             // blunt nose right
                ctx.lineTo(cx + 10, ty + h * 0.15);
                ctx.lineTo(rx + 2, ty + h * 0.35);      // right sponson
                ctx.lineTo(rx + 4, ty + h * 0.45);
                ctx.lineTo(rx + 2, ty + h * 0.55);
                ctx.lineTo(cx + 12, ty + h * 0.6);
                ctx.lineTo(cx + 12, by);
                ctx.lineTo(cx - 12, by);
                ctx.lineTo(cx - 12, ty + h * 0.6);
                ctx.lineTo(lx - 2, ty + h * 0.55);
                ctx.lineTo(lx - 4, ty + h * 0.45);
                ctx.lineTo(lx - 2, ty + h * 0.35);
                ctx.lineTo(cx - 10, ty + h * 0.15);
                ctx.closePath();
                ctx.fill();
                // Shield generator domes
                ctx.fillStyle = '#ffee88';
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#ffdd00';
                ctx.beginPath();
                ctx.arc(cx - 8, ty + h * 0.35, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + 8, ty + h * 0.35, 3, 0, Math.PI * 2);
                ctx.fill();
                panelLine(cx - 10, ty + h * 0.2, cx + 10, ty + h * 0.2, 0.15);
                panelLine(cx - 12, ty + h * 0.5, cx + 12, ty + h * 0.5, 0.15);
            } else if (tier === 1) {
                // Mk-II: wider, turret mounts, heavier armor
                ctx.beginPath();
                ctx.moveTo(cx - 6, ty + 2);
                ctx.lineTo(cx + 6, ty + 2);
                ctx.lineTo(cx + 12, ty + h * 0.12);
                ctx.lineTo(rx + 8, ty + h * 0.3);
                ctx.lineTo(rx + 10, ty + h * 0.42);
                ctx.lineTo(rx + 8, ty + h * 0.55);
                ctx.lineTo(cx + 14, ty + h * 0.58);
                ctx.lineTo(cx + 14, by + 2);
                ctx.lineTo(cx - 14, by + 2);
                ctx.lineTo(cx - 14, ty + h * 0.58);
                ctx.lineTo(lx - 8, ty + h * 0.55);
                ctx.lineTo(lx - 10, ty + h * 0.42);
                ctx.lineTo(lx - 8, ty + h * 0.3);
                ctx.lineTo(cx - 12, ty + h * 0.12);
                ctx.closePath();
                ctx.fill();
                // Turret hardpoints
                drawWeaponPod(rx + 6, ty + h * 0.38, 3);
                drawWeaponPod(lx - 6, ty + h * 0.38, 3);
                // Shield generator domes (bigger)
                ctx.fillStyle = '#ffee88';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffdd00';
                ctx.beginPath();
                ctx.arc(cx - 10, ty + h * 0.28, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + 10, ty + h * 0.28, 4, 0, Math.PI * 2);
                ctx.fill();
                panelLine(cx - 12, ty + h * 0.15, cx + 12, ty + h * 0.15, 0.18);
                panelLine(cx - 14, ty + h * 0.45, cx + 14, ty + h * 0.45, 0.18);
            } else {
                // Tier 2 Iron Wall — literal flying battleship
                ctx.beginPath();
                ctx.moveTo(cx - 8, ty);
                ctx.lineTo(cx + 8, ty);
                ctx.lineTo(cx + 14, ty + h * 0.1);
                ctx.lineTo(rx + 14, ty + h * 0.25);
                ctx.lineTo(rx + 18, ty + h * 0.38);
                ctx.lineTo(rx + 16, ty + h * 0.52);
                ctx.lineTo(cx + 18, ty + h * 0.56);
                ctx.lineTo(cx + 18, by + 2);
                ctx.lineTo(cx - 18, by + 2);
                ctx.lineTo(cx - 18, ty + h * 0.56);
                ctx.lineTo(lx - 16, ty + h * 0.52);
                ctx.lineTo(lx - 18, ty + h * 0.38);
                ctx.lineTo(lx - 14, ty + h * 0.25);
                ctx.lineTo(cx - 14, ty + h * 0.1);
                ctx.closePath();
                ctx.fill();
                // Layered armor plates
                ctx.fillStyle = 'rgba(255,220,0,0.1)';
                ctx.fillRect(cx - 16, ty + h * 0.12, 32, h * 0.15);
                ctx.fillRect(cx - 18, ty + h * 0.38, 36, h * 0.12);
                ctx.fillRect(cx - 16, ty + h * 0.6, 32, h * 0.15);
                // Multiple turret mounts
                drawWeaponPod(rx + 14, ty + h * 0.32, 4);
                drawWeaponPod(lx - 14, ty + h * 0.32, 4);
                drawWeaponPod(cx - 8, ty + h * 0.12, 3);
                drawWeaponPod(cx + 8, ty + h * 0.12, 3);
                drawWeaponPod(cx, ty + h * 0.56, 3);
                // Shield generator array — three domes
                ctx.fillStyle = '#ffee88';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffdd00';
                for (const sx of [-12, 0, 12]) {
                    ctx.beginPath();
                    ctx.arc(cx + sx, ty + h * 0.22, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                panelLine(cx - 16, ty + h * 0.14, cx + 16, ty + h * 0.14, 0.2);
                panelLine(cx - 18, ty + h * 0.4, cx + 18, ty + h * 0.4, 0.2);
                panelLine(cx - 16, ty + h * 0.62, cx + 16, ty + h * 0.62, 0.18);
            }
            // Cockpit — armored viewport
            ctx.fillStyle = '#ffeedd';
            ctx.shadowBlur = 5 + tier * 2;
            ctx.shadowColor = '#ffdd00';
            ctx.beginPath();
            ctx.ellipse(cx, ty + 12 + tier * 2, 4 + tier, 5 + tier, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (trait === 'evasion') {
            // ── PHANTOM — stealth fighter, angular facets ──
            const engineR = 6 + tier * 2 + flicker * 3;
            // Dim blue-purple engines
            drawEngineGlow(cx - 6, by + 2, engineR, '#aa88ff', '#442288');
            drawEngineGlow(cx + 6, by + 2, engineR, '#aa88ff', '#442288');

            if (tier >= 2) {
                // Holographic shimmer — nearly transparent
                ctx.save();
                const shimmer = Math.sin(t / 150) * 0.15 + 0.35;
                ctx.globalAlpha = shimmer;
            }

            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, tier >= 2 ? '#6633cc' : c1);
            bg.addColorStop(0.5, tier >= 2 ? '#331166' : c2);
            bg.addColorStop(1, '#110022');
            ctx.fillStyle = bg;
            ctx.shadowBlur = tier >= 2 ? 20 : 10 + tier * 4;
            ctx.shadowColor = tier >= 2 ? '#aa66ff' : c1;

            if (tier === 0) {
                // F-117 style — flat angular facets
                ctx.beginPath();
                ctx.moveTo(cx, ty + 4);                  // nose point
                ctx.lineTo(cx + 8, ty + h * 0.2);        // right facet
                ctx.lineTo(rx + 4, ty + h * 0.55);       // right wing
                ctx.lineTo(rx, ty + h * 0.65);
                ctx.lineTo(cx + 10, ty + h * 0.6);
                ctx.lineTo(cx + 8, by);
                ctx.lineTo(cx - 8, by);
                ctx.lineTo(cx - 10, ty + h * 0.6);
                ctx.lineTo(lx, ty + h * 0.65);
                ctx.lineTo(lx - 4, ty + h * 0.55);
                ctx.lineTo(cx - 8, ty + h * 0.2);
                ctx.closePath();
                ctx.fill();
                // Facet lines
                panelLine(cx, ty + 4, cx + 8, ty + h * 0.2, 0.2);
                panelLine(cx, ty + 4, cx - 8, ty + h * 0.2, 0.2);
                panelLine(cx + 8, ty + h * 0.2, cx + 10, ty + h * 0.6, 0.15);
                panelLine(cx - 8, ty + h * 0.2, cx - 10, ty + h * 0.6, 0.15);
                panelLine(cx - 8, ty + h * 0.4, cx + 8, ty + h * 0.4, 0.12);
            } else if (tier === 1) {
                // Mk-II: B-2 flying wing style — very wide, thin
                ctx.beginPath();
                ctx.moveTo(cx, ty);
                ctx.lineTo(cx + 6, ty + h * 0.1);
                ctx.lineTo(rx + 12, ty + h * 0.45);     // wide right wing
                ctx.lineTo(rx + 14, ty + h * 0.5);
                ctx.lineTo(rx + 8, ty + h * 0.58);
                ctx.lineTo(cx + 10, ty + h * 0.55);
                ctx.lineTo(cx + 8, by);
                ctx.lineTo(cx + 10, by + 4);             // right tail notch
                ctx.lineTo(cx + 4, by - 2);
                ctx.lineTo(cx - 4, by - 2);
                ctx.lineTo(cx - 10, by + 4);
                ctx.lineTo(cx - 8, by);
                ctx.lineTo(cx - 10, ty + h * 0.55);
                ctx.lineTo(lx - 8, ty + h * 0.58);
                ctx.lineTo(lx - 14, ty + h * 0.5);
                ctx.lineTo(lx - 12, ty + h * 0.45);
                ctx.lineTo(cx - 6, ty + h * 0.1);
                ctx.closePath();
                ctx.fill();
                panelLine(cx, ty, rx + 12, ty + h * 0.45, 0.18);
                panelLine(cx, ty, lx - 12, ty + h * 0.45, 0.18);
                panelLine(cx - 6, ty + h * 0.35, cx + 6, ty + h * 0.35, 0.12);
            } else {
                // Tier 2 Shadow — near-transparent with holographic edge lines
                ctx.beginPath();
                ctx.moveTo(cx, ty - 4);
                ctx.lineTo(cx + 8, ty + h * 0.08);
                ctx.lineTo(rx + 16, ty + h * 0.4);
                ctx.lineTo(rx + 18, ty + h * 0.46);
                ctx.lineTo(rx + 10, ty + h * 0.56);
                ctx.lineTo(cx + 12, ty + h * 0.52);
                ctx.lineTo(cx + 10, by);
                ctx.lineTo(cx + 14, by + 6);
                ctx.lineTo(cx + 5, by - 2);
                ctx.lineTo(cx - 5, by - 2);
                ctx.lineTo(cx - 14, by + 6);
                ctx.lineTo(cx - 10, by);
                ctx.lineTo(cx - 12, ty + h * 0.52);
                ctx.lineTo(lx - 10, ty + h * 0.56);
                ctx.lineTo(lx - 18, ty + h * 0.46);
                ctx.lineTo(lx - 16, ty + h * 0.4);
                ctx.lineTo(cx - 8, ty + h * 0.08);
                ctx.closePath();
                ctx.fill();
                // Holographic edge glow
                const hue = (t / 10) % 360;
                ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.6)`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx, ty - 4);
                ctx.lineTo(rx + 18, ty + h * 0.46);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, ty - 4);
                ctx.lineTo(lx - 18, ty + h * 0.46);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(rx + 10, ty + h * 0.56);
                ctx.lineTo(cx + 14, by + 6);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(lx - 10, ty + h * 0.56);
                ctx.lineTo(cx - 14, by + 6);
                ctx.stroke();
                // Inner holographic grid
                ctx.strokeStyle = `hsla(${(hue + 120) % 360}, 80%, 60%, 0.15)`;
                ctx.lineWidth = 0.5;
                for (let i = 0.2; i < 0.8; i += 0.15) {
                    panelLine(cx - 10, ty + h * i, cx + 10, ty + h * i, 0.08);
                }
            }

            if (tier >= 2) {
                ctx.restore(); // restore shimmer alpha
            }

            // Cockpit — sensor slit
            ctx.fillStyle = tier >= 2 ? `hsla(${(t / 8) % 360}, 100%, 70%, 0.8)` : '#bbaaff';
            ctx.shadowBlur = 6 + tier * 3;
            ctx.shadowColor = '#8844ff';
            ctx.beginPath();
            ctx.ellipse(cx, ty + 14 + tier, 3 + tier, 6 + tier, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (trait === 'ultimate') {
            // ── NISHITANI BREAKER — the ultimate ship ──
            const pulse = Math.sin(t / 200) * 0.15 + 0.85;
            const engineR = 12 + tier * 5 + flicker * 6;

            // Golden engine array
            drawEngineGlow(cx, by + 5, engineR * 1.5, '#ffffff', '#ffdd00');
            drawEngineGlow(cx - 12, by + 3, engineR, '#ffcc44', '#ff4400');
            drawEngineGlow(cx + 12, by + 3, engineR, '#ffcc44', '#ff4400');
            if (tier >= 1) {
                drawEngineGlow(cx - 20, by + 2, engineR * 0.7, '#ffaa00', '#aa4400');
                drawEngineGlow(cx + 20, by + 2, engineR * 0.7, '#ffaa00', '#aa4400');
            }

            // Golden aura
            ctx.save();
            ctx.globalAlpha = pulse * 0.25;
            const auraG = ctx.createRadialGradient(cx, cy, 5, cx, cy, 40 + tier * 8);
            auraG.addColorStop(0, '#ffdd00');
            auraG.addColorStop(0.5, '#ff8800');
            auraG.addColorStop(1, 'transparent');
            ctx.fillStyle = auraG;
            ctx.beginPath();
            ctx.arc(cx, cy, 40 + tier * 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, '#ffee44');
            bg.addColorStop(0.3, '#ffaa00');
            bg.addColorStop(0.6, '#cc4400');
            bg.addColorStop(1, '#441100');
            ctx.fillStyle = bg;
            ctx.shadowBlur = 20 + tier * 8;
            ctx.shadowColor = '#ffdd00';

            if (tier === 0) {
                // Base NISHITANI — ornate golden fighter
                ctx.beginPath();
                ctx.moveTo(cx, ty - 4);
                ctx.lineTo(cx + 6, ty + h * 0.1);
                ctx.lineTo(cx + 12, ty + h * 0.2);
                ctx.lineTo(rx + 8, ty + h * 0.55);
                ctx.lineTo(rx + 10, ty + h * 0.62);
                ctx.lineTo(rx + 6, ty + h * 0.72);
                ctx.lineTo(cx + 14, ty + h * 0.68);
                ctx.lineTo(cx + 12, by);
                ctx.lineTo(cx - 12, by);
                ctx.lineTo(cx - 14, ty + h * 0.68);
                ctx.lineTo(lx - 6, ty + h * 0.72);
                ctx.lineTo(lx - 10, ty + h * 0.62);
                ctx.lineTo(lx - 8, ty + h * 0.55);
                ctx.lineTo(cx - 12, ty + h * 0.2);
                ctx.lineTo(cx - 6, ty + h * 0.1);
                ctx.closePath();
                ctx.fill();
            } else if (tier === 1) {
                // N-BREAKER EX — expanded wings, more weapon pods
                ctx.beginPath();
                ctx.moveTo(cx, ty - 8);
                ctx.lineTo(cx + 8, ty + h * 0.08);
                ctx.lineTo(cx + 14, ty + h * 0.18);
                ctx.lineTo(rx + 14, ty + h * 0.48);
                ctx.lineTo(rx + 16, ty + h * 0.56);
                ctx.lineTo(rx + 10, ty + h * 0.68);
                ctx.lineTo(cx + 16, ty + h * 0.64);
                ctx.lineTo(cx + 14, by + 2);
                ctx.lineTo(cx + 16, by + 6);            // right tail
                ctx.lineTo(cx + 10, by);
                ctx.lineTo(cx - 10, by);
                ctx.lineTo(cx - 16, by + 6);
                ctx.lineTo(cx - 14, by + 2);
                ctx.lineTo(cx - 16, ty + h * 0.64);
                ctx.lineTo(lx - 10, ty + h * 0.68);
                ctx.lineTo(lx - 16, ty + h * 0.56);
                ctx.lineTo(lx - 14, ty + h * 0.48);
                ctx.lineTo(cx - 14, ty + h * 0.18);
                ctx.lineTo(cx - 8, ty + h * 0.08);
                ctx.closePath();
                ctx.fill();
                drawWeaponPod(rx + 12, ty + h * 0.52, 3);
                drawWeaponPod(lx - 12, ty + h * 0.52, 3);
            } else {
                // N-BREAKER OMEGA — the ultimate form
                ctx.beginPath();
                ctx.moveTo(cx, ty - 12);
                ctx.lineTo(cx + 10, ty + h * 0.05);
                ctx.lineTo(cx + 16, ty + h * 0.15);
                // Right forward-swept canard
                ctx.lineTo(rx + 10, ty + h * 0.08);
                ctx.lineTo(rx + 12, ty + h * 0.14);
                ctx.lineTo(cx + 16, ty + h * 0.22);
                // Right main wing
                ctx.lineTo(rx + 20, ty + h * 0.45);
                ctx.lineTo(rx + 22, ty + h * 0.52);
                ctx.lineTo(rx + 16, ty + h * 0.62);
                ctx.lineTo(cx + 18, ty + h * 0.58);
                // Right rear stabilizer
                ctx.lineTo(rx + 8, ty + h * 0.82);
                ctx.lineTo(rx + 6, ty + h * 0.88);
                ctx.lineTo(cx + 16, ty + h * 0.78);
                ctx.lineTo(cx + 16, by + 2);
                ctx.lineTo(cx + 18, by + 8);
                ctx.lineTo(cx + 10, by);
                // Bottom center
                ctx.lineTo(cx - 10, by);
                ctx.lineTo(cx - 18, by + 8);
                ctx.lineTo(cx - 16, by + 2);
                ctx.lineTo(cx - 16, ty + h * 0.78);
                ctx.lineTo(lx - 6, ty + h * 0.88);
                ctx.lineTo(lx - 8, ty + h * 0.82);
                ctx.lineTo(cx - 18, ty + h * 0.58);
                ctx.lineTo(lx - 16, ty + h * 0.62);
                ctx.lineTo(lx - 22, ty + h * 0.52);
                ctx.lineTo(lx - 20, ty + h * 0.45);
                ctx.lineTo(cx - 16, ty + h * 0.22);
                ctx.lineTo(lx - 12, ty + h * 0.14);
                ctx.lineTo(lx - 10, ty + h * 0.08);
                ctx.lineTo(cx - 16, ty + h * 0.15);
                ctx.lineTo(cx - 10, ty + h * 0.05);
                ctx.closePath();
                ctx.fill();

                // Ornate gold trim lines
                ctx.strokeStyle = 'rgba(255,255,200,0.35)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, ty - 12);
                ctx.lineTo(rx + 22, ty + h * 0.52);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, ty - 12);
                ctx.lineTo(lx - 22, ty + h * 0.52);
                ctx.stroke();

                // Multiple weapon pods
                drawWeaponPod(rx + 18, ty + h * 0.48, 4);
                drawWeaponPod(lx - 18, ty + h * 0.48, 4);
                drawWeaponPod(rx + 5, ty + h * 0.85, 3);
                drawWeaponPod(lx - 5, ty + h * 0.85, 3);
                // Shield generator domes
                ctx.fillStyle = '#ffee88';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffdd00';
                ctx.beginPath();
                ctx.arc(cx - 12, ty + h * 0.2, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + 12, ty + h * 0.2, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Panel lines
            panelLine(cx, ty, cx, by - 6, 0.12);
            panelLine(cx - 10, ty + h * 0.3, cx + 10, ty + h * 0.3, 0.1);
            panelLine(cx - 12, ty + h * 0.55, cx + 12, ty + h * 0.55, 0.1);

            // "N" emblem on hull
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffdd00';
            ctx.font = "bold 9px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('N', cx, cy + 2);
            ctx.textBaseline = 'alphabetic';

            // Cockpit — ornate golden
            ctx.fillStyle = '#ffffcc';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ffdd00';
            ctx.beginPath();
            ctx.ellipse(cx, ty + 12 + tier * 2, 5 + tier * 2, 8 + tier * 2, 0, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // ── FALLBACK (unknown trait) — generic fighter ──
            const engineR = 7 + tier * 3 + flicker * 4;
            drawEngineGlow(cx, by + 3, engineR, '#ffffff', c1);

            const bg = ctx.createLinearGradient(lx, ty, rx, by);
            bg.addColorStop(0, c1);
            bg.addColorStop(0.5, c2);
            bg.addColorStop(1, '#222');
            ctx.fillStyle = bg;
            ctx.shadowBlur = 12 + tier * 5;
            ctx.shadowColor = c1;

            ctx.beginPath();
            ctx.moveTo(cx, ty);
            ctx.lineTo(rx + tier * 4, ty + h * 0.85);
            ctx.lineTo(cx + 5, by);
            ctx.lineTo(cx, ty + h * 0.65);
            ctx.lineTo(cx - 5, by);
            ctx.lineTo(lx - tier * 4, ty + h * 0.85);
            ctx.closePath();
            ctx.fill();

            // Cockpit
            ctx.fillStyle = '#aaeeff';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#aaeeff';
            ctx.beginPath();
            ctx.ellipse(cx, ty + 16, 5, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // ── NISHITANI BREAKER outer aura ring + "N" below ship ──
        if (this.shipType === 'nishitaniBreaker') {
            ctx.save();
            const pulse = Math.sin(t / 200) * 0.3 + 0.5;
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffdd00';
            ctx.beginPath();
            ctx.arc(cx, cy, 35 + tier * 4, 0, Math.PI * 2);
            ctx.stroke();
            // Secondary ring
            ctx.strokeStyle = '#ff4400';
            ctx.lineWidth = 1;
            ctx.globalAlpha = pulse * 0.5;
            ctx.beginPath();
            ctx.arc(cx, cy, 40 + tier * 4, 0, Math.PI * 2);
            ctx.stroke();
            // "N" emblem below
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ffdd00';
            ctx.font = "bold 10px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('N', cx, by + 18);
            ctx.restore();
        }

        // ── Shield ──
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

        // ── Force field ──
        if (this.forceFieldActive) {
            ctx.save();
            const pulse = Math.sin(t / 100) * 0.2 + 0.5;
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

        // ── Weapon level text ──
        ctx.save();
        ctx.fillStyle = WEAPON_PATHS[this.weaponPath] ? WEAPON_PATHS[this.weaponPath].color : '#fff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = ctx.fillStyle;
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('Lv.' + this.weaponLevel, cx, ty - 5);
        ctx.restore();
    }
}
