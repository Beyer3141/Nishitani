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

            if (this.gameState === 'GAMEOVER') {
                this.restart();
            }
        };
        this.canvas.addEventListener('click', this._onCanvasClick);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        if (this.player) {
            this.player.y = Math.min(this.player.y, this.height - this.player.height - 20);
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
        this.shop.reset();
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

                this.boss.hp -= bullet.damage || 1;
                this.createParticles(bullet.x, bullet.y, 'orange', 3);
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
        this.gameState = 'WAVE_CLEAR';
        this.waveClearTimer = 2500;
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
                const types = ['POWER', 'POWER', 'SHIELD', 'BOMB', 'LIFE', 'CREDITS'];
                const type = types[Math.floor(Math.random() * types.length)];
                this.powerUps.push(new PowerUp(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, type));
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
            } else {
                this.invincibleTimer = 3000;
                // Reset position
                this.player.x = this.width / 2 - this.player.width / 2;
                this.player.y = this.height - this.player.height - 20;
                this.addScorePopup(this.player.x + this.player.width / 2, this.player.y - 30,
                    'LIVES: ' + this.player.lives, '#ff66aa');
            }
        }
    }

    restart() {
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
        this.shop.reset();
        this.sound.stopMusic();
        this.background.setTheme('space');
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

            ctx.font = "12px 'Press Start 2P', monospace";
            ctx.fillStyle = isSelected ? config.color1 : '#888';
            ctx.textAlign = 'left';
            ctx.fillText((i + 1) + '. ' + config.name, this.width / 2 - 140, y);
            ctx.font = "8px 'Press Start 2P', monospace";
            ctx.fillStyle = isSelected ? '#ccc' : '#666';
            ctx.fillText(config.description, this.width / 2 - 140, y + 18);
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillText('\u2191\u2193 SELECT  ENTER/TAP CONFIRM', this.width / 2, this.height / 2 + 230);
        ctx.restore();
    }

    drawGameOverScreen() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.textAlign = 'center';
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'red';
        ctx.fillStyle = 'white';
        ctx.font = "32px 'Press Start 2P', monospace";
        ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);

        ctx.shadowBlur = 0;
        ctx.font = "16px 'Press Start 2P', monospace";
        ctx.fillStyle = 'lime';
        ctx.fillText('SCORE: ' + this.score, this.width / 2, this.height / 2 + 10);
        ctx.fillStyle = 'cyan';
        ctx.fillText('HIGH: ' + this.highScore, this.width / 2, this.height / 2 + 40);
        ctx.fillStyle = '#aaa';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillText('WAVE: ' + (this.waveManager ? this.waveManager.wave : this.wave), this.width / 2, this.height / 2 + 65);

        if (this.score >= this.highScore && this.score > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'gold';
            ctx.fillStyle = 'gold';
            ctx.font = "14px 'Press Start 2P', monospace";
            ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 95);
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#888';
        ctx.font = "10px 'Press Start 2P', monospace";
        if (Math.floor(performance.now() / 600) % 2 === 0) {
            ctx.fillText('R / TAP TO RESTART', this.width / 2, this.height / 2 + 130);
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
