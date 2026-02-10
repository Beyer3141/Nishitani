import { WEAPON_PATHS } from './Player';

export class HUD {
    constructor(game) {
        this.game = game;
    }

    draw(ctx) {
        const g = this.game;
        const p = g.player;
        ctx.save();

        // Score
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'lime';
        ctx.fillStyle = 'lime';
        ctx.font = "14px 'Press Start 2P', monospace";
        ctx.textAlign = 'left';
        ctx.fillText('SCORE: ' + g.score, 20, 40);

        // Wave
        ctx.fillText('WAVE: ' + (g.waveManager ? g.waveManager.wave : g.wave), 20, 65);

        // High score
        ctx.fillStyle = 'cyan';
        ctx.shadowColor = 'cyan';
        ctx.fillText('HIGH: ' + g.highScore, 20, 90);

        if (p) {
            // Lives
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ff66aa';
            ctx.shadowColor = '#ff66aa';
            ctx.font = "12px 'Press Start 2P', monospace";
            let livesStr = '';
            for (let i = 0; i < p.lives; i++) livesStr += '\u2665 ';
            ctx.fillText(livesStr, 20, 115);

            // Bombs
            ctx.fillStyle = '#ff6600';
            ctx.shadowColor = '#ff6600';
            let bombStr = '';
            for (let i = 0; i < p.bombs; i++) bombStr += '\u25C6 ';
            ctx.fillText(bombStr, 20, 138);

            // Credits
            ctx.fillStyle = '#ffdd00';
            ctx.shadowColor = '#ffdd00';
            ctx.fillText('$' + p.credits, 20, 160);

            // Weapon info (right side)
            ctx.textAlign = 'right';
            const wpColor = WEAPON_PATHS[p.weaponPath] ? WEAPON_PATHS[p.weaponPath].color : '#fff';
            ctx.fillStyle = wpColor;
            ctx.shadowColor = wpColor;
            ctx.font = "12px 'Press Start 2P', monospace";
            ctx.fillText(WEAPON_PATHS[p.weaponPath] ? WEAPON_PATHS[p.weaponPath].name : '', g.width - 20, 40);
            ctx.fillStyle = 'yellow';
            ctx.shadowColor = 'yellow';
            ctx.fillText('Lv.' + p.weaponLevel, g.width - 20, 60);

            // Shield status
            if (p.hasShield) {
                ctx.fillStyle = 'cyan';
                ctx.shadowColor = 'cyan';
                ctx.fillText('SHIELD: ON', g.width - 20, 80);
            }

            // Special cooldown
            if (p.specialCooldown > 0) {
                const cd = Math.ceil(p.specialCooldown / 1000);
                ctx.fillStyle = '#888';
                ctx.fillText('\u6280: ' + cd + 's', g.width - 20, 100);
            } else {
                ctx.fillStyle = '#0f0';
                ctx.shadowColor = '#0f0';
                ctx.fillText('\u6280: READY', g.width - 20, 100);
            }
        }

        // Combo display
        if (g.combo >= 5) {
            ctx.textAlign = 'center';
            const comboAlpha = Math.min(1, g.comboTimer / 500);
            ctx.globalAlpha = comboAlpha;
            ctx.fillStyle = 'yellow';
            ctx.shadowColor = 'orange';
            ctx.shadowBlur = 15;
            ctx.font = "16px 'Press Start 2P', monospace";
            ctx.fillText(g.combo + ' COMBO! x' + g.getComboMultiplier(), g.width / 2, 130);
            ctx.globalAlpha = 1;
        }

        // Graze display
        if (g.graze && g.graze.totalGrazes > 0) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ff88ff';
            ctx.shadowColor = '#ff88ff';
            ctx.shadowBlur = 5;
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillText('GRAZE: ' + g.graze.totalGrazes, g.width - 20, 120);
        }

        // Boss warning
        if (g.gameState === 'BOSS_INTRO' || g.gameState === 'BOSS_BATTLE') {
            ctx.save();
            const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'red';
            ctx.fillStyle = 'red';
            ctx.textAlign = 'center';
            ctx.font = "16px 'Press Start 2P', monospace";
            ctx.fillText('!! BOSS BATTLE !!', g.width / 2, 40);
            ctx.restore();
        }

        // Pause indicator
        if (g.gameState === 'PAUSED') {
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.font = "24px 'Press Start 2P', monospace";
            ctx.fillText('PAUSED', g.width / 2, g.height / 2);
            ctx.font = "12px 'Press Start 2P', monospace";
            ctx.fillText('ESC to resume', g.width / 2, g.height / 2 + 40);
        }

        ctx.restore();
    }
}
