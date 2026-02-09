export class Boss {
    constructor(game) {
        this.game = game;
        this.width = 200;
        this.height = 200;
        this.x = game.width / 2 - this.width / 2;
        this.y = -this.height; // Start off-screen
        this.speedX = 2;
        this.speedY = 1;
        this.hp = 50;
        this.maxHp = 50;
        this.markedForDeletion = false;
        this.image = new Image();
        this.image.src = '/face.png';
        this.angle = 0;

        this.attackTimer = 0;
        this.attackInterval = 1000;
    }

    update(deltaTime) {
        // Entrance animation
        if (this.y < 20) {
            this.y += this.speedY;
        } else {
            // Side to side movement with sine wave
            this.x += this.speedX;
            if (this.x < 0 || this.x > this.game.width - this.width) {
                this.speedX *= -1;
            }

            // Attack
            if (this.attackTimer > this.attackInterval) {
                this.attack();
                this.attackTimer = 0;
            } else {
                this.attackTimer += deltaTime;
            }
        }
    }

    attack() {
        // 3-way shot
        const bulletSpeed = 6;
        this.game.enemyBullets.push(new BossBullet(this.game, this.x + this.width / 2, this.y + this.height, 0, bulletSpeed));
        this.game.enemyBullets.push(new BossBullet(this.game, this.x + this.width / 2, this.y + this.height, -2, bulletSpeed));
        this.game.enemyBullets.push(new BossBullet(this.game, this.x + this.width / 2, this.y + this.height, 2, bulletSpeed));
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'purple';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // HP Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 20, this.width, 10);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 20, this.width * (this.hp / this.maxHp), 10);
    }
}

export class BossBullet {
    constructor(game, x, y, vx, vy) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 10;
        this.height = 10;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y > this.game.height || this.x < 0 || this.x > this.game.width) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
