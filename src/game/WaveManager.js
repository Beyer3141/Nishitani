import { FORMATIONS, FormationSpawner } from './Formation';

const BACKGROUND_THEMES = ['space', 'nebula', 'asteroid', 'warp', 'crimson'];

const ENEMY_POOL_BY_WAVE = [
    // Wave 1: basics only
    [{ type: 'basic', weight: 7 }, { type: 'zigzag', weight: 3 }],
    // Wave 2: add kamikaze
    [{ type: 'basic', weight: 5 }, { type: 'zigzag', weight: 3 }, { type: 'kamikaze', weight: 2 }],
    // Wave 3: add shooter
    [{ type: 'basic', weight: 4 }, { type: 'zigzag', weight: 3 }, { type: 'kamikaze', weight: 2 }, { type: 'shooter', weight: 1 }],
    // Wave 4: add swarm + shield
    [{ type: 'basic', weight: 3 }, { type: 'zigzag', weight: 2 }, { type: 'kamikaze', weight: 2 }, { type: 'shooter', weight: 1 }, { type: 'swarm', weight: 1 }, { type: 'shield', weight: 1 }],
    // Wave 5+: add tank, all types
    [{ type: 'basic', weight: 2 }, { type: 'zigzag', weight: 2 }, { type: 'kamikaze', weight: 2 }, { type: 'shooter', weight: 2 }, { type: 'swarm', weight: 1 }, { type: 'shield', weight: 1 }, { type: 'tank', weight: 1 }],
];

const FORMATION_POOL = ['line', 'vShape', 'circle', 'diamond', 'wave', 'random', 'sides'];

function pickWeighted(pool) {
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const entry of pool) {
        r -= entry.weight;
        if (r <= 0) return entry.type;
    }
    return pool[0].type;
}

export class WaveManager {
    constructor(game) {
        this.game = game;
        this.wave = 1;
        this.subWave = 0;
        this.subWavesPerWave = 3;
        this.spawners = [];
        this.enemiesAlive = 0;
        this.waveStarted = false;
        this.waveComplete = false;
        this.betweenWaveTimer = 0;
        this.betweenWaveDelay = 2000;
    }

    get backgroundTheme() {
        return BACKGROUND_THEMES[(this.wave - 1) % BACKGROUND_THEMES.length];
    }

    getEnemyPool() {
        const idx = Math.min(this.wave - 1, ENEMY_POOL_BY_WAVE.length - 1);
        return ENEMY_POOL_BY_WAVE[idx];
    }

    getHpMultiplier() {
        return 1 + (this.wave - 1) * 0.2;
    }

    startWave() {
        this.subWave = 0;
        this.waveComplete = false;
        this.waveStarted = true;
        this.betweenWaveTimer = 0;
        this.spawners = [];
        this.enemiesAlive = 0;
        this.game.background.setTheme(this.backgroundTheme);
        this.spawnSubWave();
    }

    spawnSubWave() {
        const pool = this.getEnemyPool();
        const enemyType = pickWeighted(pool);
        const formName = FORMATION_POOL[Math.floor(Math.random() * FORMATION_POOL.length)];
        const count = Math.min(4 + this.wave + this.subWave, 12);
        const gw = this.game.width;

        let spawns;
        if (formName === 'grid') {
            const rows = Math.min(2 + Math.floor(this.subWave / 2), 3);
            const cols = Math.min(3 + this.wave, 5);
            spawns = FORMATIONS.grid(rows, cols, gw);
        } else {
            spawns = FORMATIONS[formName](count, gw);
        }

        const spawner = new FormationSpawner(this.game, spawns, enemyType, this.getHpMultiplier());
        this.spawners.push(spawner);
    }

    update(deltaTime) {
        if (!this.waveStarted || this.waveComplete) return;

        // Update spawners
        this.spawners.forEach(s => s.update(deltaTime));

        // Count alive enemies
        this.enemiesAlive = this.game.enemies.filter(e => !e.markedForDeletion).length;

        // Check if current sub-wave is done
        const allSpawnersComplete = this.spawners.every(s => s.isComplete());
        if (allSpawnersComplete && this.enemiesAlive === 0) {
            this.subWave++;
            if (this.subWave >= this.subWavesPerWave) {
                // All sub-waves done -> boss time
                this.waveComplete = true;
            } else {
                // Small delay between sub-waves
                this.betweenWaveTimer += deltaTime;
                if (this.betweenWaveTimer > this.betweenWaveDelay) {
                    this.betweenWaveTimer = 0;
                    this.spawnSubWave();
                }
            }
        }
    }

    nextWave() {
        this.wave++;
        this.subWavesPerWave = Math.min(3 + Math.floor(this.wave / 3), 6);
    }

    reset() {
        this.wave = 1;
        this.subWave = 0;
        this.subWavesPerWave = 3;
        this.spawners = [];
        this.enemiesAlive = 0;
        this.waveStarted = false;
        this.waveComplete = false;
        this.betweenWaveTimer = 0;
    }
}
