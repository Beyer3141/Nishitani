import { FORMATIONS, FormationSpawner } from './Formation';
import { getStageForWave, getMaxWave } from './StageData';

const FORMATION_POOL = ['line', 'vShape', 'circle', 'diamond', 'wave', 'random', 'sides', 'surround'];

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
        this.currentStage = null;
        this.previousStageId = 0;
    }

    get backgroundTheme() {
        const stage = getStageForWave(this.wave);
        return stage ? stage.background : 'space';
    }

    getEnemyPool() {
        const stage = getStageForWave(this.wave);
        if (stage && stage.enemyPool.length > 0) return stage.enemyPool;
        return [{ type: 'basic', weight: 5 }, { type: 'zigzag', weight: 3 }];
    }

    getHpMultiplier() {
        return 1 + (this.wave - 1) * 0.5;
    }

    startWave() {
        const stage = getStageForWave(this.wave);
        this.currentStage = stage;

        // Trigger stage start dialogue if entering a new stage
        if (stage && stage.id !== this.previousStageId) {
            this.previousStageId = stage.id;
            if (stage.dialogue && stage.dialogue.stageStart && this.game.dialogue) {
                this.game.dialogue.show(
                    stage.dialogue.stageStart.text,
                    stage.dialogue.stageStart.speaker,
                    3000
                );
            }
        }

        this.subWave = 0;
        this.waveComplete = false;
        this.waveStarted = true;
        this.betweenWaveTimer = 0;
        this.spawners = [];
        this.enemiesAlive = 0;
        this.game.background.setTheme(this.backgroundTheme);

        // If stage has no enemy pool (e.g., Stage 5), go straight to boss
        if (stage && stage.enemyPool.length === 0) {
            this.waveComplete = true;
            return;
        }

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
        if (this.wave >= getMaxWave()) {
            // Game completed - trigger victory
            this.game.handleGameVictory();
            return;
        }
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
        this.currentStage = null;
        this.previousStageId = 0;
    }
}
