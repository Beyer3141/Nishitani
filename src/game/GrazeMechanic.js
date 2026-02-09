export class GrazeMechanic {
    constructor(game) {
        this.game = game;
        this.grazeRadius = 30;
        this.grazeScore = 5;
        this.totalGrazes = 0;
    }

    update() {
        if (!this.game.player) return;
        const player = this.game.player;
        const pcx = player.x + player.width / 2;
        const pcy = player.y + player.height / 2;
        const grazeZone = this.grazeRadius + Math.max(player.width, player.height) / 2;

        this.game.enemyBullets.forEach(bullet => {
            if (bullet.grazed) return;
            const bcx = bullet.x + bullet.width / 2;
            const bcy = bullet.y + bullet.height / 2;
            const dist = Math.hypot(bcx - pcx, bcy - pcy);

            if (dist < grazeZone && dist > player.width / 2) {
                bullet.grazed = true;
                this.totalGrazes++;
                const points = Math.floor(this.grazeScore * (player.grazeBonus || 1));
                this.game.score += points;
                this.game.addCombo();
                this.game.addScorePopup(bcx, bcy, 'GRAZE +' + points, '#ff88ff');
                this.game.sound.playGraze();
                this.game.createParticles(bcx, bcy, '#ff88ff', 3);
            }
        });
    }

    reset() {
        this.totalGrazes = 0;
    }
}
