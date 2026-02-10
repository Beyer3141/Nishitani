import { NISHITANI_BREAKER } from './Player';

const SHOP_ITEMS = [
    { id: 'weaponUp', name: '武器 UP', desc: 'Weapon Lv +1', cost: 25, max: 30, apply(p) { return p.upgradeWeapon(); } },
    { id: 'life', name: 'ライフ', desc: 'Life +1', cost: 50, max: 5, apply(p) { if (p.lives < p.maxLives) { p.lives++; return true; } return false; } },
    { id: 'bomb', name: 'ボム', desc: 'Bomb +1', cost: 25, max: 5, apply(p) { if (p.bombs < p.maxBombs) { p.bombs++; return true; } return false; } },
    { id: 'shield', name: 'シールド', desc: 'Shield', cost: 40, max: 1, apply(p) { if (!p.hasShield) { p.hasShield = true; return true; } return false; } },
    { id: 'speed', name: '速度 UP', desc: 'Speed +1', cost: 15, max: 30, apply(p) { if (p.speedBonus < 30) { p.speedBonus++; return true; } return false; } },
    { id: 'damage', name: '火力 UP', desc: 'Damage +1', cost: 20, max: 30, apply(p) { if (p.damageBonus < 30) { p.damageBonus++; return true; } return false; } },
];

export class ShopManager {
    constructor(game) {
        this.game = game;
        this.items = SHOP_ITEMS;
        this.selectedIndex = 0;
        this.purchaseHistory = {};
        this.nishitaniBreakerUnlocked = false;
        this.nishitaniBreakerPurchased = false;
    }

    isAllMaxed() {
        const upgradeIds = ['weaponUp', 'speed', 'damage'];
        return upgradeIds.every(id => {
            const item = this.items.find(it => it.id === id);
            return item && (this.purchaseHistory[id] || 0) >= item.max;
        });
    }

    getAvailableItems() {
        const items = this.items.map(item => {
            const purchased = this.purchaseHistory[item.id] || 0;
            // Gentle cost scaling: base * (1 + purchased/10)
            const scaledCost = Math.floor(item.cost * (1 + purchased * 0.1));
            return {
                ...item,
                currentCost: scaledCost,
                purchased,
                canBuy: purchased < item.max && this.game.player && this.game.player.credits >= scaledCost,
            };
        });

        // Add NISHITANI BREAKER if all core upgrades maxed
        if (this.isAllMaxed() && !this.nishitaniBreakerPurchased) {
            if (!this.nishitaniBreakerUnlocked) {
                this.nishitaniBreakerUnlocked = true;
            }
            items.push({
                id: 'nishitaniBreaker',
                name: 'N-BREAKER',
                desc: '最終兵器 NISHITANI BREAKER',
                currentCost: 999,
                purchased: 0,
                max: 1,
                canBuy: this.game.player && this.game.player.credits >= 999,
                isSpecial: true,
            });
        }

        return items;
    }

    purchase(itemIndex) {
        const available = this.getAvailableItems();
        const item = available[itemIndex];
        if (!item || !item.canBuy) return false;

        const player = this.game.player;

        // NISHITANI BREAKER special handling
        if (item.id === 'nishitaniBreaker') {
            player.credits -= item.currentCost;
            this.nishitaniBreakerPurchased = true;

            // Transform current ship to NISHITANI BREAKER
            player.shipType = 'nishitaniBreaker';
            player.shipConfig = NISHITANI_BREAKER;
            player.weaponPath = 'all';
            player.special = 'nishitaniBreak';
            player.baseDamage = NISHITANI_BREAKER.damage;
            player.baseSpeed = NISHITANI_BREAKER.speed;
            player.fireDelay = 150 * NISHITANI_BREAKER.fireRate;

            this.game.shakeScreen(20, 800);
            this.game.flashScreen('rgba(255, 255, 0, 0.5)', 500);
            this.game.addScorePopup(this.game.width / 2, this.game.height / 2, 'NISHITANI BREAKER UNLOCKED!', '#ffdd00');
            this.game.sound.playBossDeath();
            return true;
        }

        const applied = item.apply(player);
        if (applied) {
            player.credits -= item.currentCost;
            this.purchaseHistory[item.id] = (this.purchaseHistory[item.id] || 0) + 1;
            this.game.sound.playShopBuy();

            // Show evolution notification on weapon milestones
            if (item.id === 'weaponUp') {
                const wlv = player.weaponLevel;
                if (wlv === 10) {
                    this.game.addScorePopup(this.game.width / 2, this.game.height / 2 - 30, 'EVOLUTION: Mk-II!', '#00ff88');
                    this.game.flashScreen('rgba(0, 255, 136, 0.3)', 300);
                } else if (wlv === 20) {
                    this.game.addScorePopup(this.game.width / 2, this.game.height / 2 - 30, 'FINAL EVOLUTION!', '#ff00ff');
                    this.game.flashScreen('rgba(255, 0, 255, 0.3)', 300);
                    this.game.shakeScreen(10, 300);
                }
            }
            return true;
        }
        return false;
    }

    handleInput(input) {
        const available = this.getAvailableItems();
        if (input.wasJustPressed('ArrowUp') || input.wasJustPressed('w')) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.game.sound.playMenuSelect();
        }
        if (input.wasJustPressed('ArrowDown') || input.wasJustPressed('s')) {
            this.selectedIndex = Math.min(available.length, this.selectedIndex + 1);
            this.game.sound.playMenuSelect();
        }
        if (input.wasJustPressed('Enter') || input.wasJustPressed(' ')) {
            if (this.selectedIndex === available.length) {
                // "Continue" button
                return 'continue';
            }
            this.purchase(this.selectedIndex);
        }
        return null;
    }

    draw(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffdd00';
        ctx.fillStyle = '#ffdd00';
        ctx.font = "20px 'Press Start 2P', monospace";
        ctx.fillText('SHOP', width / 2, 50);

        // Credits display
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffdd00';
        ctx.fillStyle = '#ffdd00';
        ctx.font = "14px 'Press Start 2P', monospace";
        ctx.fillText('CREDITS: ' + (this.game.player ? this.game.player.credits : 0), width / 2, 80);

        // Evolution name display
        if (this.game.player) {
            ctx.fillStyle = this.game.player.shipConfig.color1 || '#fff';
            ctx.shadowColor = ctx.fillStyle;
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillText(this.game.player.evolutionName || this.game.player.shipConfig.name, width / 2, 100);
        }

        const available = this.getAvailableItems();
        const startY = 125;
        const rowHeight = 42;

        available.forEach((item, i) => {
            const y = startY + i * rowHeight;
            const isSelected = i === this.selectedIndex;
            const isSpecial = item.isSpecial;

            if (isSelected) {
                ctx.fillStyle = isSpecial ? 'rgba(255, 221, 0, 0.1)' : 'rgba(255, 255, 255, 0.06)';
                ctx.fillRect(width / 2 - 200, y - 12, 400, 34);
                ctx.strokeStyle = isSpecial ? '#ffdd00' : (item.canBuy ? '#ffdd00' : '#444');
                ctx.lineWidth = isSpecial ? 2 : 1;
                ctx.shadowBlur = isSpecial ? 10 : 0;
                ctx.shadowColor = '#ffdd00';
                ctx.strokeRect(width / 2 - 200, y - 12, 400, 34);
                ctx.shadowBlur = 0;
            }

            // Item name
            ctx.textAlign = 'left';
            ctx.font = isSpecial ? "11px 'Press Start 2P', monospace" : "11px 'Press Start 2P', monospace";
            ctx.fillStyle = isSelected ? (isSpecial ? '#ffdd00' : (item.canBuy ? '#fff' : '#666')) : '#999';
            if (isSpecial) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffdd00';
            }
            ctx.fillText(item.name, width / 2 - 185, y + 5);
            ctx.shadowBlur = 0;

            // Progress bar for upgrades with max > 1
            if (item.max > 1) {
                const barX = width / 2 - 20;
                const barW = 100;
                const barH = 6;
                const barY2 = y + 1;
                const progress = item.purchased / item.max;
                ctx.fillStyle = '#222';
                ctx.fillRect(barX, barY2, barW, barH);
                const barColor = progress >= 1 ? '#ff00ff' : progress >= 0.66 ? '#00ff88' : progress >= 0.33 ? '#ffdd00' : '#666';
                ctx.fillStyle = barColor;
                ctx.fillRect(barX, barY2, barW * progress, barH);
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(barX, barY2, barW, barH);
                // Level text
                ctx.fillStyle = '#888';
                ctx.font = "7px 'Press Start 2P', monospace";
                ctx.textAlign = 'left';
                ctx.fillText(item.purchased + '/' + item.max, barX + barW + 5, barY2 + 5);
            }

            // Cost
            ctx.textAlign = 'right';
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillStyle = item.purchased >= item.max ? '#ff00ff' : (item.canBuy ? '#ffdd00' : '#555');
            ctx.fillText(item.purchased >= item.max ? 'MAX' : '$' + item.currentCost, width / 2 + 190, y + 5);
        });

        // Continue button
        const contY = startY + available.length * rowHeight + 10;
        const isContSelected = this.selectedIndex === available.length;
        if (isContSelected) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.08)';
            ctx.fillRect(width / 2 - 100, contY - 12, 200, 36);
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0f0';
            ctx.strokeRect(width / 2 - 100, contY - 12, 200, 36);
            ctx.shadowBlur = 0;
        }
        ctx.textAlign = 'center';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillStyle = isContSelected ? '#0f0' : '#666';
        ctx.fillText('>> NEXT WAVE >>', width / 2, contY + 10);

        // Controls hint
        ctx.fillStyle = '#555';
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.fillText('\u2191\u2193 SELECT  ENTER/FIRE BUY', width / 2, height - 25);

        ctx.restore();
    }

    reset() {
        this.selectedIndex = 0;
        this.purchaseHistory = {};
        this.nishitaniBreakerUnlocked = false;
        this.nishitaniBreakerPurchased = false;
    }
}
