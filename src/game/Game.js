import { Player } from './Player';
import { Bullet } from './Bullet';
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

        // Visuals
        this.particles = [];
        this.stars = [];
        this.createStars();

        // Game State
        this.gameState = 'START'; // START, PLAYING, BOSS_BATTLE, GAMEOVER
        this.score = 0;
        this.gameOver = false;
        this.bossLevel = 0; // Track how many bosses defeated

        // Input
        this.keys = [];
        window.addEventListener('keydown', e => {
            if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key);
            if (this.gameState === 'START' && (e.key === ' ' || e.key === 'Enter')) {
                this.gameState = 'PLAYING';
                this.start();
            }
        });
        window.addEventListener('keyup', e => {
            const index = this.keys.indexOf(e.key);
            if (index > -1) this.keys.splice(index, 1);
        });

        // Touch Input State
        this.touchInput = { left: false, right: false, fire: false };

        // Entities
        this.player = new Player(this);
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = []; // Boss bullets
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
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.resize);
    }

    setTouchInput(action, active) {
        if (this.gameState === 'START' && active) {
            this.gameState = 'PLAYING';
            this.start();
            return;
        }
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
            if (active) this.player.shoot();
        }
    }

    addBullet(x, y) {
        this.bullets.push(new Bullet(this, x, y));
    }

    update(deltaTime) {
        if (this.gameState !== 'PLAYING' && this.gameState !== 'BOSS_BATTLE') return;
        if (this.gameOver) return;

        // Player
        this.player.update(this.keys);

        // Shooting input for desktop logic handled in Player updates or via keys check here?
        // Let's stick to simple logic: check keys here and call player.shoot
        if (this.keys.includes(' ') && !this.player.fired) {
            this.player.shoot();
            this.player.fired = true;
        }
        if (!this.keys.includes(' ')) {
            this.player.fired = false;
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
                if (p.type === 'DOUBLE') this.player.weaponLevel = 2;
                if (p.type === 'SHIELD') this.player.hasShield = true;
            }
        });

        // Boss Battle Logic - triggers at 20, 70, 120, etc.
        const bossThreshold = 20 + this.bossLevel * 50;
        if (this.score >= bossThreshold && !this.boss) {
            this.gameState = 'BOSS_BATTLE';
            this.boss = new Boss(this);
            this.boss.maxHp = 50 + this.bossLevel * 25; // Stronger each time
            this.boss.hp = this.boss.maxHp;
            this.enemies = []; // Clear small enemies
        }

        if (this.gameState === 'BOSS_BATTLE' && this.boss) {
            this.boss.update(deltaTime);

            // Player bullets vs Boss
            this.bullets.forEach(bullet => {
                if (this.checkCollision(bullet, this.boss)) {
                    bullet.markedForDeletion = true;
                    this.boss.hp--;
                    if (this.boss.hp <= 0) {
                        // Boss Defeated
                        this.score += 50;
                        this.createParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 'magenta', 60);
                        this.boss = null;
                        this.bossLevel++;
                        this.gameState = 'PLAYING';
                        this.enemyInterval = Math.max(300, 2000 - this.bossLevel * 200);

                        // Spawn PowerUp
                        this.powerUps.push(new PowerUp(this, this.width / 2, 0, 'DOUBLE'));
                    }
                }
            });

            // Boss bullets vs Player
            this.enemyBullets.forEach(bullet => {
                if (this.checkCollision(bullet, this.player)) {
                    bullet.markedForDeletion = true;
                    if (this.player.hasShield) {
                        this.player.hasShield = false;
                    } else {
                        this.gameOver = true;
                        this.gameState = 'GAMEOVER';
                    }
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
                enemy.update();
                if (this.checkCollision(this.player, enemy)) {
                    if (this.player.hasShield) {
                        this.player.hasShield = false;
                        enemy.markedForDeletion = true;
                    } else {
                        this.gameOver = true;
                        this.gameState = 'GAMEOVER';
                    }
                }
                this.bullets.forEach(bullet => {
                    if (this.checkCollision(bullet, enemy)) {
                        bullet.markedForDeletion = true;
                        enemy.markedForDeletion = true;
                        this.score++;
                        this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'yellow', 15);

                        // Random PowerUp drop
                        if (Math.random() < 0.1) {
                            this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, Math.random() < 0.5 ? 'DOUBLE' : 'SHIELD'));
                        }
                    }
                });
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        }

        // Update stars and particles
        this.stars.forEach(star => star.update());
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.markedForDeletion);
    }

    restart() {
        this.score = 0;
        this.gameOver = false;
        this.gameState = 'PLAYING';
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;
        this.bossLevel = 0;
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.weaponLevel = 1;
        this.player.hasShield = false;
        this.enemyInterval = 2000;
        this.enemyTimer = 0;
        this.lastTime = performance.now();
    }

    addEnemy() {
        const x = Math.random() * (this.width - 60);
        const rand = Math.random();
        if (rand < 0.6) {
            this.enemies.push(new Enemy(this, x, -60));
        } else if (rand < 0.85) {
            this.enemies.push(new ZigZagEnemy(this, x, -60));
        } else {
            // Kamikaze targets player's current position
            this.enemies.push(new KamikazeEnemy(this, x, -60, this.player.x));
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
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a3a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        this.stars.forEach(star => star.draw(this.ctx));

        if (this.gameState === 'START') {
            this.ctx.save();
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'cyan';
            this.ctx.fillStyle = 'white';
            this.ctx.font = "32px 'Press Start 2P', monospace";
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FACE INVADERS', this.width / 2, this.height / 2 - 40);
            this.ctx.font = "12px 'Press Start 2P', monospace";
            this.ctx.shadowBlur = 0;
            this.ctx.fillText('TAP OR PRESS ENTER', this.width / 2, this.height / 2 + 20);
            this.ctx.restore();
            return;
        }

        this.player.draw(this.ctx);
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
        this.powerUps.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        if (this.boss) this.boss.draw(this.ctx);

        // UI with glow
        this.ctx.save();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'lime';
        this.ctx.fillStyle = 'lime';
        this.ctx.font = "14px 'Press Start 2P', monospace";
        this.ctx.textAlign = 'left';
        this.ctx.fillText('SCORE: ' + this.score, 20, 40);
        this.ctx.restore();

        if (this.player.weaponLevel > 1) {
            this.ctx.fillText('武器: Lv.' + this.player.weaponLevel, 20, 60);
        }
        if (this.player.hasShield) {
            this.ctx.fillStyle = 'cyan';
            this.ctx.fillText('シールド: ON', 20, 90);
        }

        if (this.gameState === 'BOSS_BATTLE') {
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center';
            this.ctx.font = '30px Arial';
            this.ctx.fillText('警告！！巨大な顔が接近中！！', this.width / 2, 80);
        }

        if (this.gameState === 'GAMEOVER') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ゲームオーバー', this.width / 2, this.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('スコア: ' + this.score, this.width / 2, this.height / 2 + 40);
            this.ctx.fillText('Rキー または タップしてリスタート', this.width / 2, this.height / 2 + 80);

            if (this.keys.includes('r') || this.keys.includes('R')) {
                this.restart();
            }
        }
    }

    loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        this.animationId = requestAnimationFrame(this.loop);
    }
}
