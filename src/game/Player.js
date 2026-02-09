// Ship configurations for selection
export const SHIPS = {
    speeder: {
        name: 'スピーダー',
        description: '高速移動・攻撃力低',
        speed: 9,
        fireRate: 1.0,
        damage: 1,
        color1: '#00ff88',
        color2: '#00aa44',
        hasShield: false
    },
    balanced: {
        name: 'バランス',
        description: '標準性能',
        speed: 6,
        fireRate: 1.0,
        damage: 1,
        color1: '#00d4ff',
        color2: '#0088aa',
        hasShield: false
    },
    tank: {
        name: 'タンク',
        description: '低速・高火力・初期シールド',
        speed: 4,
        fireRate: 0.8,
        damage: 2,
        color1: '#ff6600',
        color2: '#aa4400',
        hasShield: true
    }
};

export class Player {
    constructor(game, shipType = 'balanced') {
        this.game = game;
        this.shipConfig = SHIPS[shipType] || SHIPS.balanced;
        this.width = 50;
        this.height = 50;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - this.height - 20;
        this.speed = this.shipConfig.speed;
        this.damage = this.shipConfig.damage;
        this.weaponLevel = 1;
        this.maxWeaponLevel = 5;
        this.hasShield = this.shipConfig.hasShield;
        this.fired = false;
        this.engineFlicker = 0;
        this.fireTimer = 0;
        this.fireDelay = 150 * this.shipConfig.fireRate; // ms between shots
    }

    update(input, deltaTime) {
        // Horizontal Movement
        if (input.includes('ArrowLeft')) this.x -= this.speed;
        if (input.includes('ArrowRight')) this.x += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // Engine flicker animation
        this.engineFlicker = Math.random();

        // Fire timer
        if (this.fireTimer > 0) this.fireTimer -= deltaTime;
    }

    canShoot() {
        return this.fireTimer <= 0;
    }

    shoot() {
        if (!this.canShoot()) return;
        this.fireTimer = this.fireDelay;

        const bulletY = this.y;
        const cx = this.x + this.width / 2;

        if (this.weaponLevel === 1) {
            this.game.addBullet(cx - 2, bulletY, 0, this.damage);
        } else if (this.weaponLevel === 2) {
            this.game.addBullet(this.x + 5, bulletY, 0, this.damage);
            this.game.addBullet(this.x + this.width - 9, bulletY, 0, this.damage);
        } else if (this.weaponLevel === 3) {
            // 3-way shot
            this.game.addBullet(cx - 2, bulletY, 0, this.damage);
            this.game.addBullet(this.x, bulletY, -2, this.damage);
            this.game.addBullet(this.x + this.width - 4, bulletY, 2, this.damage);
        } else if (this.weaponLevel === 4) {
            // 4-way + faster
            this.game.addBullet(cx - 2, bulletY, 0, this.damage);
            this.game.addBullet(this.x, bulletY, -2, this.damage);
            this.game.addBullet(this.x + this.width - 4, bulletY, 2, this.damage);
            this.game.addBullet(cx - 10, bulletY, -1, this.damage);
            this.game.addBullet(cx + 6, bulletY, 1, this.damage);
        } else if (this.weaponLevel >= 5) {
            // 5-way + homing
            this.game.addBullet(cx - 2, bulletY, 0, this.damage);
            this.game.addBullet(this.x, bulletY, -2, this.damage);
            this.game.addBullet(this.x + this.width - 4, bulletY, 2, this.damage);
            this.game.addBullet(cx - 15, bulletY, -1, this.damage);
            this.game.addBullet(cx + 11, bulletY, 1, this.damage);
            // Homing bullet
            this.game.addHomingBullet(cx, bulletY, this.damage * 2);
        }
    }

    upgradeWeapon() {
        if (this.weaponLevel < this.maxWeaponLevel) {
            this.weaponLevel++;
            return true;
        }
        return false;
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

        // Cockpit
        ctx.fillStyle = '#aaeeff';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 20, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Shield visual
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

        // Weapon level indicator
        ctx.save();
        ctx.fillStyle = 'lime';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'lime';
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText('Lv.' + this.weaponLevel, this.x, this.y - 5);
        ctx.restore();
    }
}
