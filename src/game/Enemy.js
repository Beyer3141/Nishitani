export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.speedX = 1; // Default horizontal speed
        this.markedForDeletion = false;

        // Load image
        this.image = new Image();
        this.image.src = '/face.png'; // Path to the uploaded face image
    }

    update() {
        this.x += this.speedX;

        // Boundary check handled by controller usually, but self-check here
        if (this.x + this.width > this.game.width || this.x < 0) {
            this.speedX *= -1;
            this.y += this.height; // Move down
        }
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height); // Fallback
        }
    }
}
