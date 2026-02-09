export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.speedX = 1;
        this.speedY = 0.5; // Constant downward drift
        this.hp = 1;
        this.scoreValue = 1;
        this.markedForDeletion = false;

        // Load image
        this.image = new Image();
        this.image.src = '/face.png';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off side walls
        if (this.x + this.width > this.game.width || this.x < 0) {
            this.speedX *= -1;
            this.y += 20; // Extra drop on bounce
        }

        // Remove if off bottom of screen
        if (this.y > this.game.height + this.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Flash white when hit (hp < max)
        if (this.hp < 1) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }
}
