import { Player, SHIPS } from './Player';
import { Bullet, HomingBullet } from './Bullet';
import { Enemy } from './Enemy';
import { ZigZagEnemy, KamikazeEnemy } from './EnemyTypes';
import { Boss } from './Boss';
import { PowerUp } from './PowerUp';
import { Particle, BackgroundStar } from './Particle';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.lastTime = 0;
        this.animationId = null;
        this.running = false;

        // Visuals
        this.particles = [];
        this.stars = [];
        this.createStars();

        // Game State
        this.gameState = 'START'; // START, SHIP_SELECT, PLAYING, BOSS_BATTLE, GAMEOVER
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('nishitaniHighScore') || '0');
        this.gameOver = false;
        this.bossLevel = 0;
        this.lastBossSpawnScore = -1;
        this.wave = 1;
        this.selectedShip = 'balanced';
        this.selectedShipIndex = 1; // For visual highlight on ship select screen

        // Combo System
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDecay = 3000; // ms before combo resets
        this.scorePopups = [];

        // Invincibility Frames
        this.invincibleTimer = 0;

        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        // Flash Effect
        this.flashTimer = 0;
        this.flashColor = 'white';

        // Input
        this.keys = [];
        this.setupKeyboardInput();

        // Touch Input State
        this.touchInput = { left: false, right: false, fire: false };

        // Canvas click/tap handling for menus
        this.setupCanvasInput();

        // Entities
        this.player = null;
        this.bullets = [];
        this.homingBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;

        // Enemy Spawning
        this.enemyTimer = 0;
        this.enemyInterval = 2000;

        // Bind methods
        this.loop = this.loop.bind(this);
        this.resize = this.resize.bind(this);

        // Initial Resize
        this.resize();
        window.addEventListener('resize', this.resize);
    }

    setupKeyboardInput() {
        this._onKeyDown = (e) => {
            if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key);

            if (this.gameState === 'START' && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                this.gameState = 'SHIP_SELECT';
            }

            if (this.gameState === 'SHIP_SELECT') {
                if (e.key === 'ArrowUp' || e.key === 'w') {
                    this.selectedShipIndex = Math.max(0, this.selectedShipIndex - 1);
                }
                if (e.key === 'ArrowDown' || e.key === 's') {
                    this.selectedShipIndex = Math.min(2, this.selectedShipIndex + 1);
                }
                const shipKeys = ['speeder', 'balanced', 'tank'];
                if (e.key === '1') { this.selectedShip = 'speeder'; this.startGame(); }
                if (e.key === '2') { this.selectedShip = 'balanced'; this.startGame(); }
                if (e.key === '3') { this.selectedShip = 'tank'; this.startGame(); }
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectedShip = shipKeys[this.selectedShipIndex];
                    this.startGame();
                }
            }

            if (this.gameState === 'GAMEOVER' && (e.key === 'r' || e.key === 'R')) {
                this.restart();
            }
        };

        this._onKeyUp = (e) => {
            const index = this.keys.indexOf(e.key);
            if (index > -1) this.keys.splice(index, 1);
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    setupCanvasInput() {
        this._onCanvasClick = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.gameState === 'START') {
                this.gameState = 'SHIP_SELECT';
                return;
            }

            if (this.gameState === 'SHIP_SELECT') {
                // Check which ship was clicked
                const ships = ['speeder', 'balanced', 'tank'];
                for (let i = 0; i < ships.length; i++) {
                    const shipY = this.height / 2 - 30 + i * 70;
                    if (y > shipY - 25 && y < shipY + 35) {
                        this.selectedShip = ships[i];
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
            this.player.y = this.height - this.player.height - 20;
        }
        this.createStars();
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push(new BackgroundStar(this));
        }
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this, x, y, color, 6));
        }
    }

    start() {
        if (this.running) return; // Prevent double game loop
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    startGame() {
        this.player = new Player(this, this.selectedShip);
        this.gameState = 'PLAYING';
        this.score = 0;
        this.wave = 1;
        this.bossLevel = 0;
        this.lastBossSpawnScore = -1;
        this.bullets = [];
        this.homingBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;
        this.enemyTimer = 0;
        this.enemyInterval = 2000;
        this.combo = 0;
        this.comboTimer = 0;
        this.scorePopups = [];
        this.invincibleTimer = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        // Don't call start() again - loop is already running from constructor
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        if (this._onCanvasClick) {
            this.canvas.removeEventListener('click', this._onCanvasClick);
        }
    }

    setTouchInput(action, active) {
        if (this.gameState === 'START' && active) {
            this.gameState = 'SHIP_SELECT';
            return;
        }

        // Don't process game inputs if not in PLAYING or BOSS_BATTLE state
        if (this.gameState !== 'PLAYING' && this.gameState !== 'BOSS_BATTLE') return;
        if (!this.player) return;

        if (action === 'left') {
            if (active && this.keys.indexOf('ArrowLeft') === -1) this.keys.push('ArrowLeft');
            if (!active) {
                const idx = this.keys.indexOf('ArrowLeft');
                if (idx > -1) this.keys.splice(idx, 1);
            }
        }
        if (action === 'right') {
            if (active && this.keys.indexOf('ArrowRight') === -1) this.keys.push('ArrowRight');
            if (!active) {
                const idx = this.keys.indexOf('ArrowRight');
                if (idx > -1) this.keys.splice(idx, 1);
            }
        }
        if (action === 'fire') {
            if (active && this.player) this.player.shoot();
        }
    }

    addBullet(x, y, vx = 0, damage = 1) {
        this.bullets.push(new Bullet(this, x, y, vx, damage));
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
        this.scorePopups.push({
            x, y, text, color,
            life: 1.0,
            vy: -2
        });
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

    update(deltaTime) {
        // Always update stars for visual appeal
        this.stars.forEach(star => star.update());

        // Update score popups
        this.scorePopups.forEach(p => {
            p.y += p.vy;
            p.life -= 0.02;
        });
        this.scorePopups = this.scorePopups.filter(p => p.life > 0);

        // Update particles even outside gameplay (for explosion persistence)
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        if (this.gameState !== 'PLAYING' && this.gameState !== 'BOSS_BATTLE') return;
        if (this.gameOver) return;
        if (!this.player) return;

        // Invincibility timer
        if (this.invincibleTimer > 0) this.invincibleTimer -= deltaTime;

        // Combo decay
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Flash timer
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;

        // Player
        this.player.update(this.keys, deltaTime);

        // Auto-fire: hold space to continuously shoot
        if (this.keys.includes(' ') || this.keys.includes('Enter')) {
            this.player.shoot();
        }

        // Bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);

        // Enemy Bullets
        this.enemyBullets.forEach(bullet => bullet.update());
        this.enemyBullets = this.enemyBullets.filter(bullet => !bullet.markedForDeletion);

        // PowerUps
        this.powerUps.forEach(p => p.update());
        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);
        this.powerUps.forEach(p => {
            if (this.checkCollision(this.player, p)) {
                p.markedForDeletion = true;
                if (p.type === 'POWER') {
                    this.player.upgradeWeapon();
                    this.addScorePopup(p.x, p.y, 'POWER UP!', 'lime');
                }
                if (p.type === 'SHIELD') {
                    this.player.hasShield = true;
                    this.addScorePopup(p.x, p.y, 'SHIELD!', 'cyan');
                }
                this.createParticles(p.x, p.y, 'cyan', 10);
            }
        });

        // Homing Bullets update
        this.homingBullets.forEach(b => b.update());
        this.homingBullets = this.homingBullets.filter(b => !b.markedForDeletion);

        // Boss Battle Logic
        const bossThreshold = 20 + this.bossLevel * 50;
        if (this.score >= bossThreshold && !this.boss && this.lastBossSpawnScore !== bossThreshold) {
            this.gameState = 'BOSS_BATTLE';
            this.boss = new Boss(this);
            this.boss.maxHp = 50 + this.bossLevel * 25;
            this.boss.hp = this.boss.maxHp;
            this.enemies = [];
            this.lastBossSpawnScore = bossThreshold;
            this.shakeScreen(10, 500);
            this.flashScreen('rgba(255, 0, 0, 0.3)', 300);
        }

        if (this.gameState === 'BOSS_BATTLE' && this.boss) {
            this.boss.update(deltaTime);

            // Player bullets vs Boss
            [...this.bullets, ...this.homingBullets].forEach(bullet => {
                if (this.boss && this.checkCollision(bullet, this.boss)) {
                    bullet.markedForDeletion = true;
                    this.boss.hp -= bullet.damage || 1;
                    this.createParticles(bullet.x, bullet.y, 'orange', 3);
                    if (this.boss.hp <= 0) {
                        const bossScore = 50 * (this.bossLevel + 1);
                        this.score += bossScore;
                        this.wave++;
                        this.addScorePopup(
                            this.boss.x + this.boss.width / 2,
                            this.boss.y + this.boss.height / 2,
                            '+' + bossScore + '!',
                            'magenta'
                        );
                        this.createParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 'magenta', 60);
                        this.createParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 'yellow', 40);
                        this.shakeScreen(25, 1000);
                        this.flashScreen('rgba(255, 255, 255, 0.5)', 200);
                        this.boss = null;
                        this.bossLevel++;
                        this.gameState = 'PLAYING';
                        this.enemyInterval = Math.max(300, 2000 - this.bossLevel * 200);
                        this.enemyBullets = [];

                        if (this.score > this.highScore) {
                            this.highScore = this.score;
                            localStorage.setItem('nishitaniHighScore', this.highScore);
                        }

                        // Boss drops multiple powerups
                        this.powerUps.push(new PowerUp(this, this.width / 2 - 40, 100, 'POWER'));
                        this.powerUps.push(new PowerUp(this, this.width / 2 + 40, 100, Math.random() < 0.5 ? 'POWER' : 'SHIELD'));
                    }
                }
            });

            // Boss bullets vs Player
            this.enemyBullets.forEach(bullet => {
                if (this.checkCollision(bullet, this.player)) {
                    bullet.markedForDeletion = true;
                    this.handlePlayerHit();
                }
            });

        } else {
            // Regular Enemies
            if (this.enemyTimer > this.enemyInterval) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }

            this.enemies.forEach(enemy => {
                enemy.update(deltaTime);

                // Enemy collision with player
                if (this.checkCollision(this.player, enemy)) {
                    enemy.markedForDeletion = true;
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'red', 10);
                    this.handlePlayerHit();
                }

                // Player bullets vs enemies
                this.bullets.forEach(bullet => {
                    if (this.checkCollision(bullet, enemy)) {
                        bullet.markedForDeletion = true;
                        enemy.hp -= bullet.damage || 1;
                        this.createParticles(bullet.x, bullet.y, 'yellow', 3);
                        if (enemy.hp <= 0) {
                            enemy.markedForDeletion = true;
                            const baseScore = enemy.scoreValue || 1;
                            const multiplier = this.getComboMultiplier();
                            const points = Math.floor(baseScore * multiplier);
                            this.score += points;
                            this.addCombo();
                            this.addScorePopup(enemy.x + enemy.width / 2, enemy.y, '+' + points, multiplier > 1 ? 'yellow' : 'white');
                            this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'yellow', 15);

                            // Random PowerUp drop
                            if (Math.random() < 0.1) {
                                this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, Math.random() < 0.6 ? 'POWER' : 'SHIELD'));
                            }
                        }
                    }
                });

                // Homing bullets vs enemies
                this.homingBullets.forEach(bullet => {
                    if (this.checkCollision(bullet, enemy)) {
                        bullet.markedForDeletion = true;
                        enemy.hp -= bullet.damage || 2;
                        if (enemy.hp <= 0) {
                            enemy.markedForDeletion = true;
                            const baseScore = enemy.scoreValue || 1;
                            const multiplier = this.getComboMultiplier();
                            const points = Math.floor(baseScore * multiplier);
                            this.score += points;
                            this.addCombo();
                            this.addScorePopup(enemy.x + enemy.width / 2, enemy.y, '+' + points, 'magenta');
                            this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'magenta', 15);
                        }
                    }
                });
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        }

        // Save high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('nishitaniHighScore', this.highScore);
        }
    }

    handlePlayerHit() {
        if (this.invincibleTimer > 0) return; // Still invincible

        if (this.player.hasShield) {
            this.player.hasShield = false;
            this.invincibleTimer = 1000; // 1s invincibility after shield break
            this.shakeScreen(5, 200);
            this.flashScreen('rgba(0, 255, 255, 0.3)', 150);
            this.createParticles(this.player.x + this.player.width / 2, this.player.y, 'cyan', 20);
            this.addScorePopup(this.player.x + this.player.width / 2, this.player.y - 20, 'SHIELD BROKEN!', 'cyan');
        } else {
            this.gameOver = true;
            this.gameState = 'GAMEOVER';
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 'red', 40);
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 'yellow', 30);
            this.shakeScreen(15, 600);
            this.flashScreen('rgba(255, 0, 0, 0.5)', 300);
            this.combo = 0;
        }
    }

    restart() {
        this.score = 0;
        this.gameOver = false;
        this.gameState = 'SHIP_SELECT';
        this.selectedShipIndex = 1;
        this.bullets = [];
        this.homingBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;
        this.bossLevel = 0;
        this.wave = 1;
        this.lastBossSpawnScore = -1;
        this.enemyInterval = 2000;
        this.enemyTimer = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.scorePopups = [];
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.invincibleTimer = 0;
        this.flashTimer = 0;
        this.player = null;
        // Loop is already running, no need to restart it
    }

    addEnemy() {
        const x = Math.random() * (this.width - 60);
        const rand = Math.random();
        // Scale difficulty with wave
        const kamikazeChance = Math.min(0.3, 0.15 + this.wave * 0.02);
        const zigzagChance = Math.min(0.4, 0.25 + this.wave * 0.02);

        if (rand < (1 - zigzagChance - kamikazeChance)) {
            this.enemies.push(new Enemy(this, x, -60));
        } else if (rand < (1 - kamikazeChance)) {
            this.enemies.push(new ZigZagEnemy(this, x, -60));
        } else {
            this.enemies.push(new KamikazeEnemy(this, x, -60, this.player ? this.player.x : this.width / 2));
        }
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
        this.ctx.save();

        // Screen shake effect
        if (this.shakeDuration > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(shakeX, shakeY);
            this.shakeDuration -= 16;
            this.shakeIntensity *= 0.98; // Decay shake
        }

        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a3a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        this.stars.forEach(star => star.draw(this.ctx));

        if (this.gameState === 'START') {
            this.drawStartScreen();
            this.ctx.restore();
            return;
        }

        if (this.gameState === 'SHIP_SELECT') {
            this.drawShipSelectScreen();
            this.ctx.restore();
            return;
        }

        // Draw game entities
        if (this.player && this.gameState !== 'GAMEOVER') {
            // Blink during invincibility
            if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 80) % 2 === 0) {
                // Skip drawing player (blink effect)
            } else {
                this.player.draw(this.ctx);
            }
        }

        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.homingBullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
        this.powerUps.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        if (this.boss) this.boss.draw(this.ctx);

        // Score popups
        this.scorePopups.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.font = "bold 14px 'Press Start 2P', monospace";
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fillText(p.text, p.x, p.y);
            this.ctx.restore();
        });

        // HUD
        this.drawHUD();

        // Flash overlay
        if (this.flashTimer > 0) {
            this.ctx.save();
            this.ctx.fillStyle = this.flashColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }

        if (this.gameState === 'GAMEOVER') {
            this.drawGameOverScreen();
        }

        this.ctx.restore();
    }

    drawStartScreen() {
        this.ctx.save();
        // Pulsing glow
        const pulse = Math.sin(performance.now() / 500) * 5 + 20;
        this.ctx.shadowBlur = pulse;
        this.ctx.shadowColor = 'magenta';
        this.ctx.fillStyle = 'white';
        this.ctx.font = "28px 'Press Start 2P', monospace";
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NISHITANI', this.width / 2, this.height / 2 - 50);
        this.ctx.fillText('BREAKER', this.width / 2, this.height / 2 - 10);
        this.ctx.font = "12px 'Press Start 2P', monospace";
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'white';
        // Blinking "TAP / ENTER"
        if (Math.floor(performance.now() / 600) % 2 === 0) {
            this.ctx.fillText('TAP / ENTER', this.width / 2, this.height / 2 + 40);
        }
        this.ctx.fillStyle = 'cyan';
        this.ctx.font = "10px 'Press Start 2P', monospace";
        this.ctx.fillText('HIGH: ' + this.highScore, this.width / 2, this.height / 2 + 70);
        this.ctx.restore();
    }

    drawShipSelectScreen() {
        this.ctx.save();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'cyan';
        this.ctx.fillStyle = 'white';
        this.ctx.font = "18px 'Press Start 2P', monospace";
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECT SHIP', this.width / 2, this.height / 2 - 100);

        const ships = ['speeder', 'balanced', 'tank'];
        ships.forEach((ship, i) => {
            const config = SHIPS[ship];
            const y = this.height / 2 - 30 + i * 70;
            const isSelected = i === this.selectedShipIndex;

            // Selection highlight
            if (isSelected) {
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                this.ctx.fillRect(this.width / 2 - 180, y - 22, 360, 55);
                this.ctx.strokeStyle = config.color1;
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = config.color1;
                this.ctx.strokeRect(this.width / 2 - 180, y - 22, 360, 55);
                this.ctx.restore();
            }

            // Ship preview triangle
            const previewX = this.width / 2 - 150;
            const previewY = y + 5;
            this.ctx.save();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = config.color1;
            this.ctx.fillStyle = config.color1;
            this.ctx.beginPath();
            this.ctx.moveTo(previewX, previewY - 15);
            this.ctx.lineTo(previewX + 15, previewY + 10);
            this.ctx.lineTo(previewX - 15, previewY + 10);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();

            this.ctx.font = "14px 'Press Start 2P', monospace";
            this.ctx.fillStyle = isSelected ? config.color1 : '#888';
            this.ctx.textAlign = 'left';
            this.ctx.fillText((i + 1) + '. ' + config.name, this.width / 2 - 120, y);
            this.ctx.font = "9px 'Press Start 2P', monospace";
            this.ctx.fillStyle = isSelected ? '#ccc' : '#666';
            this.ctx.fillText(config.description, this.width / 2 - 120, y + 20);
        });

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#666';
        this.ctx.font = "9px 'Press Start 2P', monospace";
        this.ctx.fillText('↑↓ SELECT  ENTER/TAP CONFIRM', this.width / 2, this.height / 2 + 200);
        this.ctx.restore();
    }

    drawHUD() {
        this.ctx.save();

        // Score
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'lime';
        this.ctx.fillStyle = 'lime';
        this.ctx.font = "14px 'Press Start 2P', monospace";
        this.ctx.textAlign = 'left';
        this.ctx.fillText('SCORE: ' + this.score, 20, 40);

        // Wave
        this.ctx.fillText('WAVE: ' + this.wave, 20, 65);

        // High score
        this.ctx.fillStyle = 'cyan';
        this.ctx.shadowColor = 'cyan';
        this.ctx.fillText('HIGH: ' + this.highScore, 20, 90);

        // Weapon level (right side)
        if (this.player && this.player.weaponLevel > 1) {
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'yellow';
            this.ctx.shadowColor = 'yellow';
            this.ctx.font = "12px 'Press Start 2P', monospace";
            this.ctx.fillText('WEAPON Lv.' + this.player.weaponLevel, this.width - 20, 40);
        }

        // Shield status
        if (this.player && this.player.hasShield) {
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'cyan';
            this.ctx.shadowColor = 'cyan';
            this.ctx.font = "12px 'Press Start 2P', monospace";
            this.ctx.fillText('SHIELD: ON', this.width - 20, 65);
        }

        // Combo display
        if (this.combo >= 5) {
            this.ctx.textAlign = 'center';
            const comboAlpha = Math.min(1, this.comboTimer / 500);
            this.ctx.globalAlpha = comboAlpha;
            this.ctx.fillStyle = 'yellow';
            this.ctx.shadowColor = 'orange';
            this.ctx.shadowBlur = 15;
            this.ctx.font = "16px 'Press Start 2P', monospace";
            this.ctx.fillText(this.combo + ' COMBO! x' + this.getComboMultiplier(), this.width / 2, 130);
            this.ctx.globalAlpha = 1;
        }

        // Boss warning
        if (this.gameState === 'BOSS_BATTLE') {
            this.ctx.save();
            const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
            this.ctx.globalAlpha = pulse;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'red';
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center';
            this.ctx.font = "16px 'Press Start 2P', monospace";
            this.ctx.fillText('!! BOSS BATTLE !!', this.width / 2, 40);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawGameOverScreen() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.textAlign = 'center';

        // Game Over text with glow
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = 'red';
        this.ctx.fillStyle = 'white';
        this.ctx.font = "32px 'Press Start 2P', monospace";
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);

        this.ctx.shadowBlur = 0;
        this.ctx.font = "16px 'Press Start 2P', monospace";
        this.ctx.fillStyle = 'lime';
        this.ctx.fillText('SCORE: ' + this.score, this.width / 2, this.height / 2 + 10);

        this.ctx.fillStyle = 'cyan';
        this.ctx.fillText('HIGH: ' + this.highScore, this.width / 2, this.height / 2 + 40);

        if (this.score >= this.highScore && this.score > 0) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'gold';
            this.ctx.fillStyle = 'gold';
            this.ctx.font = "14px 'Press Start 2P', monospace";
            this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 70);
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fillStyle = '#888';
        this.ctx.font = "10px 'Press Start 2P', monospace";
        if (Math.floor(performance.now() / 600) % 2 === 0) {
            this.ctx.fillText('R / TAP TO RESTART', this.width / 2, this.height / 2 + 110);
        }

        this.ctx.restore();
    }

    loop(currentTime) {
        if (!this.running) return;

        const deltaTime = Math.min(currentTime - this.lastTime, 50); // Cap delta to prevent huge jumps
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        this.animationId = requestAnimationFrame(this.loop);
    }
}
