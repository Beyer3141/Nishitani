export class DialogueSystem {
    constructor(game) {
        this.game = game;
        this.queue = [];
        this.currentDialogue = null;
        this.displayedChars = 0;
        this.charTimer = 0;
        this.charDelay = 50;
        this.displayTimer = 0;
        this.displayDuration = 4000;
        this.active = false;
    }

    show(text, speaker = '', duration = 4000) {
        this.queue.push({ text, speaker, duration });
        if (!this.active) this._nextDialogue();
    }

    _nextDialogue() {
        if (this.queue.length === 0) {
            this.active = false;
            this.currentDialogue = null;
            return;
        }
        this.currentDialogue = this.queue.shift();
        this.displayedChars = 0;
        this.charTimer = 0;
        this.displayTimer = 0;
        this.displayDuration = this.currentDialogue.duration;
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active || !this.currentDialogue) return;

        if (this.displayedChars < this.currentDialogue.text.length) {
            this.charTimer += deltaTime;
            while (this.charTimer >= this.charDelay && this.displayedChars < this.currentDialogue.text.length) {
                this.charTimer -= this.charDelay;
                this.displayedChars++;
            }
        } else {
            this.displayTimer += deltaTime;
            if (this.displayTimer >= this.displayDuration) {
                this._nextDialogue();
            }
        }
    }

    draw(ctx) {
        if (!this.active || !this.currentDialogue) return;
        const text = this.currentDialogue.text.substring(0, this.displayedChars);
        const speaker = this.currentDialogue.speaker;

        ctx.save();

        // Semi-transparent bar at top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.game.width, 80);
        ctx.strokeStyle = 'rgba(255, 221, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.lineTo(this.game.width, 80);
        ctx.stroke();

        // Speaker name
        if (speaker) {
            ctx.fillStyle = '#ffdd00';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffdd00';
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.textAlign = 'left';
            ctx.fillText(speaker, 20, 25);
        }

        // Dialogue text
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = "11px 'Press Start 2P', monospace";
        ctx.textAlign = 'left';

        // Word wrap for long text
        const maxWidth = this.game.width - 40;
        const words = text.split('');
        let line = '';
        let lineY = 50;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.length > 0) {
                ctx.fillText(line, 20, lineY);
                line = words[i];
                lineY += 18;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 20, lineY);

        // Blinking cursor
        if (this.displayedChars < this.currentDialogue.text.length && Math.floor(performance.now() / 300) % 2 === 0) {
            const cursorMetrics = ctx.measureText(line);
            ctx.fillText('_', 20 + cursorMetrics.width + 2, lineY);
        }

        ctx.restore();
    }

    reset() {
        this.queue = [];
        this.currentDialogue = null;
        this.active = false;
    }
}
