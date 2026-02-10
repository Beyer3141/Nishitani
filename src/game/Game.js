import { Player, SHIPS, SHIP_KEYS } from './Player';
import { Bullet, HeavyBullet, HomingBullet, EnemyBullet } from './Bullet';
import { PowerUp } from './PowerUp';
import { Particle, RingParticle, DebrisParticle } from './Particle';
import { InputManager } from './InputManager';
import { SoundManager } from './SoundManager';
import { Background } from './Background';
import { WaveManager } from './WaveManager';
import { createBoss } from './BossTypes';
import { GrazeMechanic } from './GrazeMechanic';
import { HUD } from './HUD';
import { ShopManager } from './ShopManager';
import { DialogueSystem } from './DialogueSystem';
import { getStageForWave, getMaxWave } from './StageData';

// States: START, SHIP_SELECT, PLAYING, BOSS_INTRO, BOSS_BATTLE, WAVE_CLEAR, SHOP, GAMEOVER, PAUSED
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.lastTime = 0;
        this.animationId = null;
        this.running = false;

        // Managers
        this.input = new InputManager(this);
        this.sound = new SoundManager();
        this.background = new Background(this);
        this.waveManager = new WaveManager(this);
        this.graze = new GrazeMechanic(this);
        this.hud = new HUD(this);
        this.shop = new ShopManager(this);
        this.dialogue = new DialogueSystem(this);

        // Particles
        this.particles = [];

        // Game State
        this.gameState = 'START';
        this.previousState = null; // for pause
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('nishitaniHighScore') || '0');
        this.gameOver = false;
        this.wave = 1;
        this.selectedShip = 'balanced';
        this.selectedShipIndex = 1;

        // Combo System
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDecay = 3000;
        this.scorePopups = [];

        // Invincibility
        this.invincibleTimer = 0;

        // Screen effects
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.flashTimer = 0;
        this.flashColor = 'white';

        // Control overlay height (touch controls area at bottom)
        this.controlAreaHeight = 120;

        // Boss intro timer
        this.bossIntroTimer = 0;

        // Wave clear timer
        this.waveClearTimer = 0;

        // Input (legacy array for player.update compatibility)
        this.keys = this.input.keys;

        // Canvas click
        this.setupCanvasInput();

        // Entities
        this.player = null;
        this.bullets = [];
        this.heavyBullets = [];
        this.homingBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;

        // Bind
        this.loop = this.loop.bind(this);
        this.resize = this.resize.bind(this);

        this.resize();
        window.addEventListener('resize', this.resize);
    }

    setupCanvasInput() {
        this._onCanvasClick = (e) => {
            this.sound.init();
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.gameState === 'START') {
                this.gameState = 'SHIP_SELECT';
                this.sound.playMenuConfirm();
                return;
            }

            if (this.gameState === 'SHIP_SELECT') {
                const shipKeys = SHIP_KEYS;
                for (let i = 0; i < shipKeys.length; i++) {
                    const shipY = this.height / 2 - 60 + i * 60;
                    if (y > shipY - 25 && y < shipY + 35) {
                        this.selectedShip = shipKeys[i];
                        this.startGame();
                        return;
                    }
                }
            }

            if (this.gameState === 'GAMEOVER' || this.gameState === 'VICTORY') {
                this.restart();
            }
        };
        this.canvas.addEventListener('click', this._onCanvasClick);
    }

    get playAreaBottom() {
        return this.height - this.controlAreaHeight;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        if (this.player) {
            this.player.y = Math.min(this.player.y, this.playAreaBottom - this.player.height);
        }
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this, x, y, color, 6));
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    startGame() {
        this.sound.init();
        this.player = new Player(this, this.selectedShip);
        this.gameState = 'PLAYING';
        this.score = 0;
        this.wave = 1;
        this.bullets = [];
        this.heavyBullets = [];
        this.homingBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;
        this.combo = 0;
        this.comboTimer = 0;
        this.scorePopups = [];
        this.invincibleTimer = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.gameOver = false;

        this.waveManager.reset();
        this.graze.reset();
        this.dialogue.reset();

        // New Game+ (強くてニューゲーム): load saved upgrade data
        const saved = this.loadProgress();
        if (saved) {
            // Restore weapon level
            if (saved.weaponLevel && saved.weaponLevel > 1) {
                for (let i = 1; i < saved.weaponLevel; i++) {
                    this.player.upgradeWeapon();
                }
            }
            // Restore speed and damage bonuses
            if (saved.speedBonus) this.player.speedBonus = saved.speedBonus;
            if (saved.damageBonus) this.player.damageBonus = saved.damageBonus;
            // Restore shop purchase history
            if (saved.shopHistory) {
                this.shop.purchaseHistory = { ...saved.shopHistory };
                this.shop.selectedIndex = 0;
            } else {
                this.shop.reset();
            }
            // Restore Nishitani Breaker state
            if (saved.nishitaniBreakerPurchased) {
                this.shop.nishitaniBreakerPurchased = true;
                this.shop.nishitaniBreakerUnlocked = true;
            }
            // Restore high score if higher
            if (saved.highScore && saved.highScore > this.highScore) {
                this.highScore = saved.highScore;
            }
        } else {
            this.shop.reset();
        }

        this.waveManager.startWave();
        this.sound.startMusic();
        this.sound.playMenuConfirm();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.sound.stopMusic();
        window.removeEventListener('resize', this.resize);
        this.input.destroy();
        if (this._onCanvasClick) {
            this.canvas.removeEventListener('click', this._onCanvasClick);
        }
    }

    setTouchInput(action, active) {
        if (this.gameState === 'START' && active) {
            this.sound.init();
            this.gameState = 'SHIP_SELECT';
            this.sound.playMenuConfirm();
            return;
        }

        if (action === 'left') this.input.injectKey('ArrowLeft', active);
        if (action === 'right') this.input.injectKey('ArrowRight', active);
        if (action === 'up') this.input.injectKey('ArrowUp', active);
        if (action === 'down') this.input.injectKey('ArrowDown', active);
        if (action === 'fire') {
            if (active && this.player && (this.gameState === 'PLAYING' || this.gameState === 'BOSS_BATTLE')) {
                this.player.shoot();
            }
        }
        if (action === 'bomb') {
            if (active) this.useBomb();
        }
        if (action === 'special') {
            if (active && this.player) this.player.useSpecial();
        }
    }

    addBullet(x, y, vx = 0, damage = 1) {
        this.bullets.push(new Bullet(this, x, y, vx, damage));
    }

    addHeavyBullet(x, y, vx = 0, damage = 4, piercing = false) {
        this.heavyBullets.push(new HeavyBullet(this, x, y, vx, damage, piercing));
    }

    addHomingBullet(x, y, damage = 2) {
        this.homingBullets.push(new HomingBullet(this, x, y, damage));
    }

    getEnemyBulletSpeedMultiplier() {
        return 1 + (this.waveManager.wave - 1) * 0.04;
    }

    shakeScreen(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    flashScreen(color, duration) {
        this.flashColor = color;
        this.flashTimer = duration;
    }

    addScorePopup(x, y, text, color = 'white') {
        this.scorePopups.push({ x, y, text, color, life: 1.0, vy: -2 });
    }

    addCombo() {
        this.combo++;
        this.comboTimer = this.comboDecay;
    }

    getComboMultiplier() {
        if (this.combo < 5) return 1;
        if (this.combo < 10) return 1.5;
        if (this.combo < 20) return 2;
        if (this.combo < 50) return 3;
        return 5;
    }

    useBomb() {
        if (!this.player || this.player.bombs <= 0) return;
        if (this.gameState !== 'PLAYING' && this.gameState !== 'BOSS_BATTLE') return;

        this.player.bombs--;
        this.sound.playBomb();
        this.shakeScreen(20, 500);
        this.flashScreen('rgba(255, 255, 255, 0.5)', 300);

        const cx = this.player.x + this.player.width / 2;
        const cy = this.player.y + this.player.height / 2;
        const radius = this.player.specialActive ? 600 : 300;

        // Clear enemy bullets
        this.enemyBullets.forEach(b => { b.markedForDeletion = true; });

        // Damage all enemies
        this.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x + enemy.width / 2 - cx, enemy.y + enemy.height / 2 - cy);
            if (dist < radius) {
                const dead = enemy.takeDamage(10);
                if (dead) {
                    enemy.markedForDeletion = true;
                    this.score += enemy.scoreValue;
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'orange', 15);
                }
            }
        });

        // Damage boss
        if (this.boss) {
            this.boss.hp -= 15;
            this.createParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 'orange', 20);
        }

        // Ring effect
        this.particles.push(new RingParticle(this, cx, cy, 'white', radius));
        this.particles.push(new RingParticle(this, cx, cy, '#ff8800', radius * 0.7));
        this.createParticles(cx, cy, 'yellow', 30);
    }

    update(deltaTime) {
        const input = this.input;

        // Always update visual stuff
        this.background.update(deltaTime);
        this.dialogue.update(deltaTime);
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.markedForDeletion);
        this.scorePopups.forEach(p => { p.y += p.vy; p.life -= 0.02; });
        this.scorePopups = this.scorePopups.filter(p => p.life > 0);

        // Pause handling
        if (input.wasJustPressed('Escape')) {
            this.sound.init();
            if (this.gameState === 'PAUSED') {
                this.gameState = this.previousState;
            } else if (this.gameState === 'PLAYING' || this.gameState === 'BOSS_BATTLE') {
                this.previousState = this.gameState;
                this.gameState = 'PAUSED';
            }
        }

        // Menu navigation
        if (this.gameState === 'START') {
            if (input.wasJustPressed(' ') || input.wasJustPressed('Enter')) {
                this.sound.init();
                this.gameState = 'SHIP_SELECT';
                this.sound.playMenuConfirm();
            }
            input.clearFrame();
            return;
        }

        if (this.gameState === 'SHIP_SELECT') {
            this._handleShipSelect(input);
            input.clearFrame();
            return;
        }

        if (this.gameState === 'SHOP') {
            const result = this.shop.handleInput(input);
            if (result === 'continue') {
                this.sound.playMenuConfirm();
                this.waveManager.nextWave();
                this.waveManager.startWave();
                this.gameState = 'PLAYING';
                this.enemies = [];
                this.enemyBullets = [];
                this.boss = null;
                this.sound.startMusic();
            }
            input.clearFrame();
            return;
        }

        if (this.gameState === 'GAMEOVER') {
            if (input.wasJustPressed('r') || input.wasJustPressed('R')) {
                this.restart();
            }
            input.clearFrame();
            return;
        }

        if (this.gameState === 'VICTORY') {
            if (input.wasJustPressed('r') || input.wasJustPressed('R')) {
                this.restart();
            }
            input.clearFrame();
            return;
        }

        if (this.gameState === 'PAUSED') {
            input.clearFrame();
            return;
        }

        if (this.gameState === 'BOSS_INTRO') {
            this.bossIntroTimer -= deltaTime;
            if (this.bossIntroTimer <= 0) {
                this.gameState = 'BOSS_BATTLE';
                this.sound.startBossMusic();
            }
            input.clearFrame();
            return;
        }

        if (this.gameState === 'WAVE_CLEAR') {
            this.waveClearTimer -= deltaTime;
            if (this.waveClearTimer <= 0) {
                this.gameState = 'SHOP';
                this.shop.selectedIndex = 0;
                this.sound.stopMusic();
                this.saveProgress();
            }
            input.clearFrame();
            return;
        }

        // --- GAMEPLAY ---
        if (this.gameState !== 'PLAYING' && this.gameState !== 'BOSS_BATTLE') {
            input.clearFrame();
            return;
        }
        if (this.gameOver || !this.player) {
            input.clearFrame();
            return;
        }

        // Timers
        if (this.invincibleTimer > 0) this.invincibleTimer -= deltaTime;
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) this.combo = 0;
        }
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;

        // Player update
        this.player.update(this.input.keys, deltaTime);

        // Auto-fire
        if (input.isHeld(' ') || input.isHeld('Enter')) {
            this.player.shoot();
        }

        // Bomb (B key)
        if (input.wasJustPressed('b') || input.wasJustPressed('B')) {
            this.useBomb();
        }

        // Special (X key)
        if (input.wasJustPressed('x') || input.wasJustPressed('X')) {
            this.player.useSpecial();
        }

        // Update bullets
        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);
        this.heavyBullets.forEach(b => b.update());
        this.heavyBullets = this.heavyBullets.filter(b => !b.markedForDeletion);
        this.homingBullets.forEach(b => b.update());
        this.homingBullets = this.homingBullets.filter(b => !b.markedForDeletion);
        this.enemyBullets.forEach(b => b.update());
        this.enemyBullets = this.enemyBullets.filter(b => !b.markedForDeletion);

        // PowerUps
        this.powerUps.forEach(p => p.update());
        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);
        this._handlePowerUpCollisions();

        // Graze
        this.graze.update();

        // Enemy bullets vs player
        if (!this.player.isInvincible) {
            this.enemyBullets.forEach(bullet => {
                if (this.checkCollision(bullet, this.player)) {
                    bullet.markedForDeletion = true;
                    this.handlePlayerHit();
                }
            });
        }

        if (this.gameState === 'BOSS_BATTLE' && this.boss) {
            this._updateBoss(deltaTime);
        } else if (this.gameState === 'PLAYING') {
            this._updatePlaying(deltaTime);
        }

        // High score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('nishitaniHighScore', this.highScore);
        }

        input.clearFrame();
    }

    _handleShipSelect(input) {
        const shipKeys = SHIP_KEYS;
        if (input.wasJustPressed('ArrowUp') || input.wasJustPressed('w')) {
            this.selectedShipIndex = Math.max(0, this.selectedShipIndex - 1);
            this.sound.init();
            this.sound.playMenuSelect();
        }
        if (input.wasJustPressed('ArrowDown') || input.wasJustPressed('s')) {
            this.selectedShipIndex = Math.min(shipKeys.length - 1, this.selectedShipIndex + 1);
            this.sound.init();
            this.sound.playMenuSelect();
        }
        for (let i = 0; i < Math.min(shipKeys.length, 6); i++) {
            if (input.wasJustPressed(String(i + 1))) {
                this.selectedShip = shipKeys[i];
                this.startGame();
                return;
            }
        }
        if (input.wasJustPressed('Enter') || input.wasJustPressed(' ')) {
            this.selectedShip = shipKeys[this.selectedShipIndex];
            this.startGame();
        }
    }

    _updatePlaying(deltaTime) {
        // Wave manager
        this.waveManager.update(deltaTime);

        // Enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);

            // Enemy vs player collision
            if (!this.player.isInvincible && this.checkCollision(this.player, enemy)) {
                enemy.markedForDeletion = true;
                this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'red', 10);
                this.handlePlayerHit();
            }

            // All player bullets vs enemy
            this._checkBulletsVsEnemy(enemy);
        });
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);

        // Check if wave is done -> boss intro
        if (this.waveManager.waveComplete && this.enemies.length === 0) {
            this.gameState = 'BOSS_INTRO';
            this.bossIntroTimer = 2000;
            this.boss = createBoss(this, this.waveManager.wave);

            // Show boss intro dialogue from stage data
            const stage = getStageForWave(this.waveManager.wave);
            if (stage && stage.dialogue && stage.dialogue.bossIntro) {
                this.dialogue.show(stage.dialogue.bossIntro.text, stage.dialogue.bossIntro.speaker, 2500);
            }

            this.sound.playBossWarning();
            this.shakeScreen(10, 500);
            this.flashScreen('rgba(255, 0, 0, 0.3)', 300);
        }
    }

    _updateBoss(deltaTime) {
        this.boss.update(deltaTime);

        // Player bullets vs Boss
        const allPlayerBullets = [...this.bullets, ...this.heavyBullets, ...this.homingBullets];
        allPlayerBullets.forEach(bullet => {
            if (this.boss && this.checkCollision(bullet, this.boss)) {
                // Piercing heavy bullets don't get deleted
                if (bullet.piercing) {
                    if (bullet.hitEnemies && bullet.hitEnemies.has(this.boss)) return;
                    if (bullet.hitEnemies) bullet.hitEnemies.add(this.boss);
                } else {
                    bullet.markedForDeletion = true;
                }

                const dmg = bullet.damage || 1;

                // EmperorBoss barrier handling
                if (this.boss.barrierActive && this.boss.barrierHp !== undefined) {
                    this.boss.barrierHp -= dmg;
                    this.createParticles(bullet.x, bullet.y, 'cyan', 3);
                    if (this.boss.barrierHp <= 0) {
                        this.boss.barrierActive = false;
                        this.boss.barrierRechargeTimer = 0;
                        this.flashScreen('rgba(0, 255, 255, 0.3)', 200);
                        this.addScorePopup(this.boss.x + this.boss.width / 2, this.boss.y, 'BARRIER DOWN!', 'cyan');
                    }
                } else {
                    this.boss.hp -= dmg;
                    this.createParticles(bullet.x, bullet.y, 'orange', 3);
                }
                this.sound.playHit();

                if (this.boss.hp <= 0) {
                    this._handleBossDefeat();
                }
            }
        });

        // Boss collision with player
        if (this.boss && !this.player.isInvincible && this.checkCollision(this.player, this.boss)) {
            this.handlePlayerHit();
        }
    }

    _handleBossDefeat() {
        const bossScore = 50 * (this.waveManager.wave);
        const credits = 20 + this.waveManager.wave * 10;
        this.score += bossScore;
        this.player.credits += credits;

        this.addScorePopup(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '+' + bossScore + '!', 'magenta');
        this.addScorePopup(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2 + 30, '+$' + credits, '#ffdd00');

        this.createParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 'magenta', 60);
        this.createParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 'yellow', 40);
        for (let i = 0; i < 5; i++) {
            this.particles.push(new DebrisParticle(this, this.boss.x + Math.random() * this.boss.width, this.boss.y + Math.random() * this.boss.height, '#ff4400'));
        }

        this.shakeScreen(25, 1000);
        this.flashScreen('rgba(255, 255, 255, 0.5)', 200);
        this.sound.playBossDeath();
        this.sound.playWaveClear();

        this.boss = null;
        this.enemyBullets = [];

        // Save progress after boss defeat
        this.saveProgress();

        // Check if final wave -> VICTORY
        if (this.waveManager.wave >= getMaxWave()) {
            this.handleGameVictory();
        } else {
            this.gameState = 'WAVE_CLEAR';
            this.waveClearTimer = 2500;
        }
    }

    _checkBulletsVsEnemy(enemy) {
        // Regular bullets
        this.bullets.forEach(bullet => {
            if (this.checkCollision(bullet, enemy)) {
                bullet.markedForDeletion = true;
                this._damageEnemy(enemy, bullet.damage || 1, bullet.x, bullet.y);
            }
        });

        // Heavy bullets
        this.heavyBullets.forEach(bullet => {
            if (this.checkCollision(bullet, enemy)) {
                if (bullet.piercing) {
                    if (bullet.hitEnemies.has(enemy)) return;
                    bullet.hitEnemies.add(enemy);
                } else {
                    bullet.markedForDeletion = true;
                }
                this._damageEnemy(enemy, bullet.damage || 4, bullet.x, bullet.y);
            }
        });

        // Homing bullets
        this.homingBullets.forEach(bullet => {
            if (this.checkCollision(bullet, enemy)) {
                bullet.markedForDeletion = true;
                this._damageEnemy(enemy, bullet.damage || 2, bullet.x, bullet.y);
            }
        });
    }

    _damageEnemy(enemy, damage, bx, by) {
        this.createParticles(bx, by, 'yellow', 3);
        this.sound.playHit();
        const dead = enemy.takeDamage(damage);
        if (dead) {
            enemy.markedForDeletion = true;
            const baseScore = enemy.scoreValue || 1;
            const multiplier = this.getComboMultiplier();
            const points = Math.floor(baseScore * multiplier);
            this.score += points;
            const credits = Math.floor(baseScore * 2);
            this.player.credits += credits;
            this.addCombo();
            this.addScorePopup(enemy.x + enemy.width / 2, enemy.y, '+' + points, multiplier > 1 ? 'yellow' : 'white');
            this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'yellow', 15);
            this.sound.playExplosion();

            // Power-up drops
            const dropRoll = Math.random();
            if (dropRoll < enemy.dropChance) {
                if (Math.random() < 0.08) {
                    this.powerUps.push(new PowerUp(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'LIFE'));
                } else {
                    const types = ['POWER', 'SHIELD', 'BOMB', 'CREDITS', 'CREDITS'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    this.powerUps.push(new PowerUp(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, type));
                }
            }
        }
    }

    _handlePowerUpCollisions() {
        if (!this.player) return;
        this.powerUps.forEach(p => {
            if (this.checkCollision(this.player, p)) {
                p.markedForDeletion = true;
                this.createParticles(p.x, p.y, 'cyan', 10);
                this.sound.playPowerUp();

                switch (p.type) {
                    case 'POWER':
                        this.player.upgradeWeapon();
                        this.addScorePopup(p.x, p.y, 'POWER UP!', 'lime');
                        break;
                    case 'SHIELD':
                        this.player.hasShield = true;
                        this.addScorePopup(p.x, p.y, 'SHIELD!', 'cyan');
                        break;
                    case 'BOMB':
                        if (this.player.bombs < this.player.maxBombs) this.player.bombs++;
                        this.addScorePopup(p.x, p.y, 'BOMB +1', '#ff6600');
                        break;
                    case 'LIFE':
                        if (this.player.lives < this.player.maxLives) {
                            this.player.lives++;
                            this.sound.playLifeUp();
                        }
                        this.addScorePopup(p.x, p.y, 'LIFE +1', '#ff66aa');
                        break;
                    case 'CREDITS':
                        this.player.credits += p.creditValue;
                        this.addScorePopup(p.x, p.y, '+$' + p.creditValue, '#ffdd00');
                        break;
                }
            }
        });
    }

    handlePlayerHit() {
        if (this.invincibleTimer > 0 || this.player.isInvincible) return;

        if (this.player.hasShield) {
            this.player.hasShield = false;
            this.invincibleTimer = 1500;
            this.shakeScreen(5, 200);
            this.flashScreen('rgba(0, 255, 255, 0.3)', 150);
            this.createParticles(this.player.x + this.player.width / 2, this.player.y, 'cyan', 20);
            this.addScorePopup(this.player.x + this.player.width / 2, this.player.y - 20, 'SHIELD BROKEN!', 'cyan');
        } else {
            this.player.lives--;
            this.player.downgradeWeapon();
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 'red', 40);
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 'yellow', 30);
            this.shakeScreen(15, 600);
            this.flashScreen('rgba(255, 0, 0, 0.5)', 300);
            this.sound.playDeath();

            if (this.player.lives <= 0) {
                this.gameOver = true;
                this.gameState = 'GAMEOVER';
                this.sound.stopMusic();
                this.combo = 0;
                this.saveProgress();
            } else {
                this.invincibleTimer = 3000;
                // Reset position (above control area)
                this.player.x = this.width / 2 - this.player.width / 2;
                this.player.y = this.playAreaBottom - this.player.height - 10;
                this.addScorePopup(this.player.x + this.player.width / 2, this.player.y - 30,
                    'LIVES: ' + this.player.lives, '#ff66aa');
            }
        }
    }

    handleGameVictory() {
        this.gameState = 'VICTORY';
        this.sound.stopMusic();
        this.sound.playWaveClear();
        this.saveProgress();
    }

    // --- New Game+ (強くてニューゲーム) Save/Load ---

    saveProgress() {
        if (!this.player) return;
        const data = {
            weaponLevel: this.player.weaponLevel,
            speedBonus: this.player.speedBonus,
            damageBonus: this.player.damageBonus,
            shopHistory: { ...this.shop.purchaseHistory },
            nishitaniBreakerPurchased: this.shop.nishitaniBreakerPurchased,
            highScore: this.highScore,
        };
        try {
            localStorage.setItem('nishitaniSaveData', JSON.stringify(data));
        } catch (e) {
            // localStorage may be full or unavailable
        }
    }

    loadProgress() {
        try {
            const raw = localStorage.getItem('nishitaniSaveData');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    clearProgress() {
        try {
            localStorage.removeItem('nishitaniSaveData');
        } catch (e) {
            // ignore
        }
    }

    restart(fullReset = false) {
        this.score = 0;
        this.gameOver = false;
        this.gameState = 'SHIP_SELECT';
        this.selectedShipIndex = 1;
        this.bullets = [];
        this.heavyBullets = [];
        this.homingBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;
        this.wave = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.scorePopups = [];
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.invincibleTimer = 0;
        this.flashTimer = 0;
        this.player = null;
        this.waveManager.reset();
        this.graze.reset();
        this.dialogue.reset();
        this.sound.stopMusic();
        this.background.setTheme('space');

        if (fullReset) {
            // Shift+R: full reset - clear all saved progress
            this.shop.reset();
            this.clearProgress();
        }
        // Normal restart: shop history is preserved in localStorage
        // and will be loaded in startGame() via loadProgress()
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.height + rect1.y > rect2.y
        );
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();

        // Screen shake
        if (this.shakeDuration > 0) {
            ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
            this.shakeDuration -= 16;
            this.shakeIntensity *= 0.98;
        }

        // Background
        this.background.draw(ctx);

        if (this.gameState === 'START') {
            this.drawStartScreen();
            ctx.restore();
            return;
        }

        if (this.gameState === 'SHIP_SELECT') {
            this.drawShipSelectScreen();
            ctx.restore();
            return;
        }

        if (this.gameState === 'SHOP') {
            this.shop.draw(ctx, this.width, this.height);
            ctx.restore();
            return;
        }

        // Game entities
        if (this.player && this.gameState !== 'GAMEOVER') {
            if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 80) % 2 === 0) {
                // Blink
            } else {
                this.player.draw(ctx);
            }
        }

        this.bullets.forEach(b => b.draw(ctx));
        this.heavyBullets.forEach(b => b.draw(ctx));
        this.homingBullets.forEach(b => b.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        this.enemyBullets.forEach(b => b.draw(ctx));
        this.powerUps.forEach(p => p.draw(ctx));
        this.particles.forEach(p => p.draw(ctx));
        if (this.boss) this.boss.draw(ctx);

        // Score popups
        this.scorePopups.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.font = "bold 14px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        });

        // HUD
        this.hud.draw(ctx);

        // Dialogue overlay
        this.dialogue.draw(ctx);

        // Flash overlay
        if (this.flashTimer > 0) {
            ctx.save();
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }

        // Boss intro overlay
        if (this.gameState === 'BOSS_INTRO') {
            ctx.save();
            const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'red';
            ctx.fillStyle = 'red';
            ctx.font = "24px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('WARNING', this.width / 2, this.height / 2 - 20);
            ctx.fillStyle = 'white';
            ctx.font = "14px 'Press Start 2P', monospace";
            ctx.fillText('BOSS APPROACHING', this.width / 2, this.height / 2 + 20);
            ctx.restore();
        }

        // Wave clear overlay
        if (this.gameState === 'WAVE_CLEAR') {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ff88';
            ctx.fillStyle = '#00ff88';
            ctx.font = "24px 'Press Start 2P', monospace";
            ctx.fillText('WAVE ' + this.waveManager.wave + ' CLEAR!', this.width / 2, this.height / 2);
            ctx.restore();
        }

        // Pause overlay
        if (this.gameState === 'PAUSED') {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.font = "24px 'Press Start 2P', monospace";
            ctx.fillText('PAUSED', this.width / 2, this.height / 2);
            ctx.font = "12px 'Press Start 2P', monospace";
            ctx.fillText('ESC to resume', this.width / 2, this.height / 2 + 40);
            ctx.restore();
        }

        if (this.gameState === 'GAMEOVER') {
            this.drawGameOverScreen();
        }

        if (this.gameState === 'VICTORY') {
            this.drawVictoryScreen();
        }

        ctx.restore();
    }

    drawStartScreen() {
        const ctx = this.ctx;
        ctx.save();
        const pulse = Math.sin(performance.now() / 500) * 5 + 20;
        ctx.shadowBlur = pulse;
        ctx.shadowColor = 'magenta';
        ctx.fillStyle = 'white';
        ctx.font = "28px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('NISHITANI', this.width / 2, this.height / 2 - 50);
        ctx.fillText('BREAKER', this.width / 2, this.height / 2 - 10);
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'white';
        if (Math.floor(performance.now() / 600) % 2 === 0) {
            ctx.fillText('TAP / ENTER', this.width / 2, this.height / 2 + 40);
        }
        ctx.fillStyle = 'cyan';
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText('HIGH: ' + this.highScore, this.width / 2, this.height / 2 + 70);
        ctx.restore();
    }

    drawShipSelectScreen() {
        const ctx = this.ctx;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'cyan';
        ctx.fillStyle = 'white';
        ctx.font = "18px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('SELECT SHIP', this.width / 2, this.height / 2 - 200);

        const shipKeys = SHIP_KEYS;
        shipKeys.forEach((ship, i) => {
            const config = SHIPS[ship];
            const y = this.height / 2 - 120 + i * 55;
            const isSelected = i === this.selectedShipIndex;

            if (isSelected) {
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(this.width / 2 - 200, y - 18, 400, 46);
                ctx.strokeStyle = config.color1;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = config.color1;
                ctx.strokeRect(this.width / 2 - 200, y - 18, 400, 46);
                ctx.restore();
            }

            const previewX = this.width / 2 - 170;
            const previewY = y + 5;
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = config.color1;
            ctx.fillStyle = config.color1;
            ctx.beginPath();
            ctx.moveTo(previewX, previewY - 12);
            ctx.lineTo(previewX + 12, previewY + 8);
            ctx.lineTo(previewX - 12, previewY + 8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.font = "11px 'Press Start 2P', monospace";
            ctx.fillStyle = isSelected ? config.color1 : '#888';
            ctx.textAlign = 'left';
            ctx.fillText((i + 1) + '. ' + config.name, this.width / 2 - 140, y);
            ctx.font = "7px 'Press Start 2P', monospace";
            ctx.fillStyle = isSelected ? '#ccc' : '#666';
            ctx.fillText(config.description, this.width / 2 - 140, y + 15);
            // Evolution line
            if (isSelected && config.evolution) {
                ctx.fillStyle = '#555';
                ctx.font = "6px 'Press Start 2P', monospace";
                ctx.fillText(config.evolution.join(' \u2192 '), this.width / 2 - 140, y + 27);
            }
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillText('\u2191\u2193 SELECT  ENTER/TAP CONFIRM', this.width / 2, this.height / 2 + 210);

        ctx.fillStyle = '#555';
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.fillText('WASD/ARROWS:MOVE  SPACE:FIRE', this.width / 2, this.height / 2 + 235);
        ctx.fillText('B:BOMB  X:SPECIAL  ESC:PAUSE', this.width / 2, this.height / 2 + 255);
        ctx.restore();
    }

    drawGameOverScreen() {
        const ctx = this.ctx;
        const t = performance.now();
        ctx.save();

        // Dark overlay with subtle pulse
        ctx.fillStyle = 'rgba(0, 0, 0, 0.80)';
        ctx.fillRect(0, 0, this.width, this.height);

        // 西谷化 morphing effect - GAME OVER text morphs into 西谷化
        const morphProgress = Math.min(1, (t % 8000) / 4000); // cycles every 8s
        const isGameOver = morphProgress < 0.5;
        const textStr = isGameOver ? 'GAME OVER' : '西 谷 化';
        const morphFade = isGameOver ? 1 : Math.sin((morphProgress - 0.5) * Math.PI * 2) * 0.5 + 0.5;

        ctx.textAlign = 'center';

        // Glitch scanlines behind text
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ff0044';
        for (let i = 0; i < 10; i++) {
            const sy = this.height / 2 - 80 + Math.random() * 160;
            ctx.fillRect(0, sy, this.width, 2);
        }
        ctx.globalAlpha = 1;

        // Main text with glitch offset
        const glitchX = (Math.random() - 0.5) * (isGameOver ? 2 : 8);
        const glitchY = (Math.random() - 0.5) * (isGameOver ? 1 : 4);

        if (!isGameOver) {
            // Red shadow layer for 西谷化
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#ff0000';
            ctx.font = "36px 'Press Start 2P', monospace";
            ctx.globalAlpha = 0.4;
            ctx.fillText(textStr, this.width / 2 + glitchX + 3, this.height / 2 - 40 + glitchY + 3);
            ctx.globalAlpha = 1;
        }

        ctx.shadowBlur = 30;
        ctx.shadowColor = isGameOver ? 'red' : '#ff00ff';
        ctx.fillStyle = isGameOver ? 'white' : '#ff4488';
        ctx.font = `${isGameOver ? 32 : 36}px 'Press Start 2P', monospace`;
        ctx.fillText(textStr, this.width / 2 + glitchX, this.height / 2 - 40 + glitchY);

        // Subtitle for 西谷化
        if (!isGameOver) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0088';
            ctx.fillStyle = '#ff88aa';
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillText('- BAD END -', this.width / 2, this.height / 2 - 5);
            ctx.fillStyle = '#cc6688';
            ctx.font = "8px 'Press Start 2P', monospace";
            ctx.fillText('あなたも西谷になりました', this.width / 2, this.height / 2 + 15);
        }

        // Score info
        ctx.shadowBlur = 0;
        ctx.font = "16px 'Press Start 2P', monospace";
        ctx.fillStyle = 'lime';
        ctx.fillText('SCORE: ' + this.score, this.width / 2, this.height / 2 + 45);
        ctx.fillStyle = 'cyan';
        ctx.fillText('HIGH: ' + this.highScore, this.width / 2, this.height / 2 + 70);
        ctx.fillStyle = '#aaa';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillText('WAVE: ' + (this.waveManager ? this.waveManager.wave : this.wave), this.width / 2, this.height / 2 + 95);

        if (this.score >= this.highScore && this.score > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'gold';
            ctx.fillStyle = 'gold';
            ctx.font = "14px 'Press Start 2P', monospace";
            ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 120);
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#888';
        ctx.font = "10px 'Press Start 2P', monospace";
        if (Math.floor(t / 600) % 2 === 0) {
            ctx.fillText('R / TAP TO RESTART', this.width / 2, this.height / 2 + 155);
        }
        ctx.restore();
    }

    drawVictoryScreen() {
        const ctx = this.ctx;
        const t = performance.now();
        ctx.save();

        // Black overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Golden particles
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 20; i++) {
            const px = (t * 0.02 + i * 137) % this.width;
            const py = (t * 0.01 + i * 97) % this.height;
            ctx.fillStyle = i % 2 === 0 ? '#ffdd00' : '#ff8800';
            ctx.beginPath();
            ctx.arc(px, py, 2 + Math.sin(t / 500 + i) * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.textAlign = 'center';

        // VICTORY text with gold glow
        const pulse = Math.sin(t / 500) * 5 + 25;
        ctx.shadowBlur = pulse;
        ctx.shadowColor = '#ffdd00';
        ctx.fillStyle = '#ffdd00';
        ctx.font = "36px 'Press Start 2P', monospace";
        ctx.fillText('VICTORY', this.width / 2, this.height / 2 - 100);

        // Normal End subtitle
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.font = "14px 'Press Start 2P', monospace";
        ctx.fillText('- NORMAL END -', this.width / 2, this.height / 2 - 60);

        // Story text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#cccccc';
        ctx.font = "9px 'Press Start 2P', monospace";
        const lines = [
            '顔面戦艦YASUOMIは崩壊した。',
            'しかし、西谷の笑顔はまだ',
            '宇宙のどこかで微笑んでいる……',
            '',
            '「また会おう。次はもっと',
            '  素敵な笑顔を見せてあげるよ」',
        ];
        lines.forEach((line, i) => {
            ctx.fillText(line, this.width / 2, this.height / 2 - 20 + i * 22);
        });

        // Score
        ctx.fillStyle = 'lime';
        ctx.font = "16px 'Press Start 2P', monospace";
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'lime';
        ctx.fillText('FINAL SCORE: ' + this.score, this.width / 2, this.height / 2 + 130);

        if (this.score >= this.highScore && this.score > 0) {
            ctx.shadowColor = 'gold';
            ctx.fillStyle = 'gold';
            ctx.font = "14px 'Press Start 2P', monospace";
            ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 160);
        }

        ctx.fillStyle = '#888';
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.shadowBlur = 0;
        if (Math.floor(t / 600) % 2 === 0) {
            ctx.fillText('R / TAP TO RESTART', this.width / 2, this.height / 2 + 195);
        }
        ctx.restore();
    }

    loop(currentTime) {
        if (!this.running) return;
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        this.update(deltaTime);
        this.draw();
        this.animationId = requestAnimationFrame(this.loop);
    }
}
