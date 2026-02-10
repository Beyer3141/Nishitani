const SHOP_ITEMS = [
    { id: 'weaponUp', name: '武器 UP', desc: 'Weapon Lv +1', cost: 30, max: 5, apply(p) { return p.upgradeWeapon(); } },
    { id: 'life', name: 'ライフ', desc: 'Life +1', cost: 50, max: 5, apply(p) { if (p.lives < p.maxLives) { p.lives++; return true; } return false; } },
    { id: 'bomb', name: 'ボム', desc: 'Bomb +1', cost: 25, max: 5, apply(p) { if (p.bombs < p.maxBombs) { p.bombs++; return true; } return false; } },
    { id: 'shield', name: 'シールド', desc: 'Shield', cost: 40, max: 1, apply(p) { if (!p.hasShield) { p.hasShield = true; return true; } return false; } },
    { id: 'speed', name: '速度 UP', desc: 'Speed +1', cost: 35, max: 3, apply(p) { if (p.speedBonus < 3) { p.speedBonus++; return true; } return false; } },
    { id: 'damage', name: '火力 UP', desc: 'Damage +1', cost: 45, max: 3, apply(p) { if (p.damageBonus < 3) { p.damageBonus++; return true; } return false; } },
];

export class ShopManager {
    constructor(game) {
        this.game = game;
        this.items = SHOP_ITEMS;
        this.selectedIndex = 0;
        this.purchaseHistory = {};
    }

    getAvailableItems() {
        return this.items.map(item => {
            const purchased = this.purchaseHistory[item.id] || 0;
            const scaledCost = Math.floor(item.cost * (1 + purchased * 0.5));
            return {
                ...item,
                currentCost: scaledCost,
                purchased,
                canBuy: purchased < item.max && this.game.player.credits >= scaledCost,
            };
        });
    }

    purchase(itemIndex) {
        const available = this.getAvailableItems();
        const item = available[itemIndex];
        if (!item || !item.canBuy) return false;

        const player = this.game.player;
        const applied = item.apply(player);
        if (applied) {
            player.credits -= item.currentCost;
            this.purchaseHistory[item.id] = (this.purchaseHistory[item.id] || 0) + 1;
            this.game.sound.playShopBuy();
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffdd00';
        ctx.fillStyle = '#ffdd00';
        ctx.font = "20px 'Press Start 2P', monospace";
        ctx.fillText('SHOP', width / 2, 60);

        // Credits display
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffdd00';
        ctx.fillStyle = '#ffdd00';
        ctx.font = "14px 'Press Start 2P', monospace";
        ctx.fillText('CREDITS: ' + (this.game.player ? this.game.player.credits : 0), width / 2, 95);

        const available = this.getAvailableItems();
        const startY = 140;
        const rowHeight = 50;

        available.forEach((item, i) => {
            const y = startY + i * rowHeight;
            const isSelected = i === this.selectedIndex;

            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(width / 2 - 200, y - 15, 400, 40);
                ctx.strokeStyle = item.canBuy ? '#ffdd00' : '#666';
                ctx.lineWidth = 1;
                ctx.strokeRect(width / 2 - 200, y - 15, 400, 40);
            }

            ctx.textAlign = 'left';
            ctx.font = "12px 'Press Start 2P', monospace";
            ctx.fillStyle = isSelected ? (item.canBuy ? '#fff' : '#888') : '#aaa';
            ctx.shadowBlur = 0;
            ctx.fillText(item.name, width / 2 - 180, y + 5);

            ctx.textAlign = 'right';
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillStyle = item.canBuy ? '#ffdd00' : '#666';
            ctx.fillText(item.purchased >= item.max ? 'MAX' : '$' + item.currentCost, width / 2 + 180, y + 5);
        });

        // Continue button
        const contY = startY + available.length * rowHeight;
        const isContSelected = this.selectedIndex === available.length;
        if (isContSelected) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(width / 2 - 100, contY - 15, 200, 40);
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(width / 2 - 100, contY - 15, 200, 40);
        }
        ctx.textAlign = 'center';
        ctx.font = "14px 'Press Start 2P', monospace";
        ctx.fillStyle = isContSelected ? '#0f0' : '#888';
        ctx.shadowBlur = isContSelected ? 10 : 0;
        ctx.shadowColor = '#0f0';
        ctx.fillText('>> NEXT WAVE >>', width / 2, contY + 8);

        ctx.fillStyle = '#666';
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.shadowBlur = 0;
        ctx.fillText('\u2191\u2193 SELECT  ENTER BUY', width / 2, height - 30);

        ctx.restore();
    }

    reset() {
        this.selectedIndex = 0;
        this.purchaseHistory = {};
    }
}
