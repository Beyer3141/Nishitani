export const FORMATIONS = {
    line(count, gameWidth, spacing = 70) {
        const spawns = [];
        const startX = (gameWidth - (count - 1) * spacing) / 2;
        for (let i = 0; i < count; i++) {
            spawns.push({
                x: Math.max(10, Math.min(gameWidth - 70, startX + i * spacing)),
                y: -60,
                delay: i * 150,
            });
        }
        return spawns;
    },

    vShape(count, gameWidth, spacing = 60) {
        const spawns = [];
        const cx = gameWidth / 2;
        const half = Math.floor(count / 2);
        spawns.push({ x: cx - 30, y: -60, delay: 0 });
        for (let i = 1; i <= half; i++) {
            spawns.push({ x: Math.max(10, cx - 30 - i * spacing), y: -60 - i * 40, delay: i * 200 });
            spawns.push({ x: Math.min(gameWidth - 70, cx - 30 + i * spacing), y: -60 - i * 40, delay: i * 200 });
        }
        return spawns;
    },

    circle(count, gameWidth, radius = 100) {
        const spawns = [];
        const cx = gameWidth / 2;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
            spawns.push({
                x: cx + Math.cos(angle) * radius - 30,
                y: -60,
                delay: i * 100,
            });
        }
        return spawns;
    },

    diamond(count, gameWidth, size = 80) {
        const spawns = [];
        const cx = gameWidth / 2 - 30;
        const rows = Math.ceil(Math.sqrt(count));
        let idx = 0;
        for (let r = 0; r < rows && idx < count; r++) {
            const rowCount = r < rows / 2 ? r + 1 : rows - r;
            const startX = cx - (rowCount - 1) * size / 2;
            for (let c = 0; c < rowCount && idx < count; c++) {
                spawns.push({
                    x: Math.max(10, Math.min(gameWidth - 70, startX + c * size)),
                    y: -60,
                    delay: idx * 120,
                });
                idx++;
            }
        }
        return spawns;
    },

    grid(rows, cols, gameWidth, spacingX = 70, spacingY = 60) {
        const spawns = [];
        const startX = (gameWidth - (cols - 1) * spacingX) / 2;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                spawns.push({
                    x: Math.max(10, Math.min(gameWidth - 70, startX + c * spacingX)),
                    y: -60 - r * spacingY,
                    delay: (r * cols + c) * 100,
                });
            }
        }
        return spawns;
    },

    wave(count, gameWidth, amplitude = 50) {
        const spawns = [];
        for (let i = 0; i < count; i++) {
            spawns.push({
                x: Math.max(10, Math.min(gameWidth - 70, gameWidth / 2 + Math.sin(i * 0.8) * amplitude - 30)),
                y: -60,
                delay: i * 300,
            });
        }
        return spawns;
    },

    random(count, gameWidth) {
        const spawns = [];
        for (let i = 0; i < count; i++) {
            spawns.push({
                x: 10 + Math.random() * (gameWidth - 80),
                y: -60,
                delay: i * 400 + Math.random() * 200,
            });
        }
        return spawns;
    },

    sides(count, gameWidth) {
        const spawns = [];
        for (let i = 0; i < count; i++) {
            spawns.push({
                x: i % 2 === 0 ? 10 : gameWidth - 70,
                y: -60,
                delay: i * 250,
            });
        }
        return spawns;
    },
};

export class FormationSpawner {
    constructor(game, formationSpawns, enemyType, hpMultiplier = 1) {
        this.game = game;
        this.spawnQueue = formationSpawns.map(s => ({ ...s, spawned: false }));
        this.enemyType = enemyType;
        this.hpMultiplier = hpMultiplier;
        this.elapsedTime = 0;
        this.complete = false;
        this.totalSpawned = 0;
    }

    update(deltaTime) {
        if (this.complete) return;
        this.elapsedTime += deltaTime;

        let allDone = true;
        this.spawnQueue.forEach(spawn => {
            if (spawn.spawned) return;
            allDone = false;
            if (this.elapsedTime >= spawn.delay) {
                this._spawnEnemy(spawn);
                spawn.spawned = true;
                this.totalSpawned++;
            }
        });

        if (allDone) this.complete = true;
    }

    _spawnEnemy(spawn) {
        // Lazy import to avoid circular dependency
        const { createEnemy } = require('./EnemyTypes');
        const enemy = createEnemy(this.enemyType, this.game, spawn.x, spawn.y);
        if (this.hpMultiplier > 1) {
            enemy.hp = Math.ceil(enemy.hp * this.hpMultiplier);
            enemy.maxHp = enemy.hp;
        }
        this.game.enemies.push(enemy);
        this.game.waveManager.enemiesAlive++;
    }

    isComplete() {
        return this.complete;
    }
}
