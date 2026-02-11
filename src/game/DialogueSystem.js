export class DialogueSystem {
    constructor(game) {
        this.game = game;
        this.queue = [];
        this.currentDialogue = null;
        this.displayedChars = 0;
        this.charTimer = 0;
        this.charDelay = 40; // ms per character for typewriter effect
        this.active = false;
        this.blocking = false; // Game.js checks this to pause gameplay
        this.textComplete = false;
        this.advanceRequested = false;

        // Blinking indicator
        this.blinkTimer = 0;

        // Portrait image
        this.portraitImg = new Image();
        this.portraitImg.src = '/face.png';
        this.portraitLoaded = false;
        this.portraitImg.onload = () => { this.portraitLoaded = true; };

        // Touch/click handler for advancing dialogue
        this._onAdvance = (e) => {
            if (this.active && this.blocking) {
                e.preventDefault();
                e.stopPropagation();
                this.advanceRequested = true;
            }
        };
        // Use capture phase so we intercept before game canvas click handlers
        window.addEventListener('click', this._onAdvance, true);
        window.addEventListener('touchstart', this._onAdvance, true);
    }

    /**
     * Show dialogue message(s).
     * @param {string|Array} textOrArray - Single text string OR array of {text, speaker} objects
     * @param {string} speaker - Speaker name (for single message mode)
     * @param {object|number} options - Options object OR legacy duration number
     */
    show(textOrArray, speaker = '', options = {}) {
        if (typeof options === 'number') {
            options = {};
        }

        // Support array of dialogue messages: [{text, speaker}, ...]
        if (Array.isArray(textOrArray)) {
            textOrArray.forEach(entry => {
                const s = entry.speaker || speaker;
                const portrait = entry.portrait !== undefined ? entry.portrait : this._guessPortrait(s);
                const blocking = entry.blocking !== undefined ? entry.blocking : true;
                this.queue.push({ text: entry.text, speaker: s, portrait, blocking });
            });
            if (!this.active) this._nextDialogue();
            return;
        }

        const portrait = options.portrait !== undefined ? options.portrait : this._guessPortrait(speaker);
        const blocking = options.blocking !== undefined ? options.blocking : true;

        this.queue.push({ text: textOrArray, speaker, portrait, blocking });
        if (!this.active) this._nextDialogue();
    }

    /**
     * Guess portrait from speaker name for convenience
     */
    _guessPortrait(speaker) {
        if (!speaker) return null;
        const nishitaniNames = ['西谷', '???', '皇帝ニシタニ', '艦隊司令官', '顔面戦艦', '巨大Tシャツ', 'ニシタニ・ロボ', '艦隊司令官ニシタニ'];
        for (const name of nishitaniNames) {
            if (speaker.includes(name) || name.includes(speaker)) return 'nishitani';
        }
        return null;
    }

    _nextDialogue() {
        if (this.queue.length === 0) {
            this.active = false;
            this.blocking = false;
            this.currentDialogue = null;
            return;
        }
        this.currentDialogue = this.queue.shift();
        this.displayedChars = 0;
        this.charTimer = 0;
        this.textComplete = false;
        this.advanceRequested = false;
        this.blinkTimer = 0;
        this.active = true;
        this.blocking = this.currentDialogue.blocking;
    }

    update(deltaTime) {
        if (!this.active || !this.currentDialogue) return;

        // Check for advance input (keyboard)
        const input = this.game.input;
        if (input) {
            if (input.wasJustPressed(' ') || input.wasJustPressed('Enter')) {
                this.advanceRequested = true;
            }
        }

        if (!this.textComplete) {
            // Still typing out characters
            if (this.advanceRequested) {
                // Skip to end of text immediately
                this.displayedChars = this.currentDialogue.text.length;
                this.textComplete = true;
                this.advanceRequested = false;
                this.blinkTimer = 0;
            } else {
                // Typewriter effect
                this.charTimer += deltaTime;
                while (this.charTimer >= this.charDelay && this.displayedChars < this.currentDialogue.text.length) {
                    this.charTimer -= this.charDelay;
                    this.displayedChars++;
                }
                if (this.displayedChars >= this.currentDialogue.text.length) {
                    this.textComplete = true;
                    this.blinkTimer = 0;
                }
            }
        } else {
            // Text complete, waiting for advance input
            this.blinkTimer += deltaTime;
            if (this.advanceRequested) {
                this.advanceRequested = false;
                this._nextDialogue();
            }
        }

        // Always reset advanceRequested at end of frame if not consumed
        this.advanceRequested = false;
    }

    draw(ctx) {
        if (!this.active || !this.currentDialogue) return;

        const W = this.game.width;
        const H = this.game.height;

        ctx.save();

        // ---- Full-screen semi-transparent overlay ----
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, W, H);

        // ---- Layout calculations ----
        const margin = Math.max(8, W * 0.03);
        const boxHeight = Math.max(130, H * 0.28);
        const boxY = margin; // Position at top of screen to avoid overlap with controls on mobile
        const boxX = margin;
        const boxW = W - margin * 2;

        // Portrait dimensions
        const hasPortrait = this.currentDialogue.portrait === 'nishitani' && this.portraitLoaded;
        const portraitSize = Math.min(80, boxHeight - 30);
        const portraitPadding = 12;
        const portraitX = boxX + portraitPadding;
        const portraitY = boxY + (boxHeight - portraitSize) / 2 + 8; // slight offset for name tab

        // Text area
        const textLeftBase = boxX + portraitPadding;
        const textLeft = hasPortrait ? portraitX + portraitSize + portraitPadding : textLeftBase + 8;
        const textRight = boxX + boxW - 16;
        const textMaxWidth = textRight - textLeft;
        const textTopStart = boxY + 40;

        // ---- Draw textbox background (RPG-style dark panel with border) ----
        // Outer border glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(100, 160, 255, 0.4)';

        // Main box background
        this._drawRoundedRect(ctx, boxX, boxY, boxW, boxHeight, 8);
        ctx.fillStyle = 'rgba(10, 10, 35, 0.92)';
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(140, 180, 255, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner highlight border
        this._drawRoundedRect(ctx, boxX + 3, boxY + 3, boxW - 6, boxHeight - 6, 6);
        ctx.strokeStyle = 'rgba(80, 120, 200, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // ---- Speaker name tab (positioned at bottom-left of box) ----
        const speaker = this.currentDialogue.speaker;
        if (speaker) {
            ctx.font = "bold 11px 'Press Start 2P', monospace";
            const nameWidth = ctx.measureText(speaker).width + 24;
            const nameTabH = 24;
            const nameTabX = boxX + 16;
            const nameTabY = boxY + boxHeight - 4;

            // Name tab background
            this._drawRoundedRectBottom(ctx, nameTabX, nameTabY, nameWidth, nameTabH + 4, 6);
            ctx.fillStyle = 'rgba(10, 10, 35, 0.92)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(140, 180, 255, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Cover the top border where tab meets box
            ctx.fillStyle = 'rgba(10, 10, 35, 0.92)';
            ctx.fillRect(nameTabX + 1, nameTabY - 2, nameWidth - 2, 6);

            // Speaker name text
            ctx.fillStyle = '#ffdd44';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#ffdd44';
            ctx.font = "11px 'Press Start 2P', monospace";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(speaker, nameTabX + 12, nameTabY + nameTabH / 2 + 1);
            ctx.shadowBlur = 0;
        }

        // ---- Portrait ----
        if (hasPortrait) {
            // Portrait frame
            ctx.strokeStyle = 'rgba(140, 180, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(portraitX - 2, portraitY - 2, portraitSize + 4, portraitSize + 4);

            // Draw portrait image
            ctx.drawImage(this.portraitImg, portraitX, portraitY, portraitSize, portraitSize);

            // Subtle shine on portrait
            const grad = ctx.createLinearGradient(portraitX, portraitY, portraitX + portraitSize, portraitY + portraitSize);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
            ctx.fillStyle = grad;
            ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
        }

        // ---- Typewriter text ----
        const text = this.currentDialogue.text.substring(0, this.displayedChars);
        ctx.fillStyle = '#ffffff';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Word wrap (character by character for Japanese support)
        const lineHeight = 22;
        const maxLines = Math.floor((boxHeight - 50) / lineHeight);
        const lines = this._wrapText(ctx, text, textMaxWidth);

        for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
            ctx.fillText(lines[i], textLeft, textTopStart + i * lineHeight);
        }

        // ---- Blinking advance indicator ----
        if (this.textComplete) {
            const blink = Math.floor(this.blinkTimer / 400) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#ffdd44';
                ctx.font = "14px 'Press Start 2P', monospace";
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText('\u25BC', boxX + boxW - 16, boxY + boxHeight - 10);
            }
        }

        // ---- "SPACE / TAP" hint at bottom-right (subtle) ----
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('SPACE / TAP', boxX + boxW - 36, boxY + boxHeight - 10);

        ctx.restore();
    }

    /**
     * Word wrap text, breaking per character (handles Japanese where spaces are rare)
     */
    _wrapText(ctx, text, maxWidth) {
        const lines = [];
        let line = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const testLine = line + ch;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.length > 0) {
                lines.push(line);
                line = ch;
            } else {
                line = testLine;
            }
        }
        if (line.length > 0) lines.push(line);
        return lines;
    }

    /**
     * Draw rounded rectangle path
     */
    _drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * Draw rounded rectangle with only top corners rounded (for name tab)
     */
    _drawRoundedRectTop(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * Draw rounded rectangle with only bottom corners rounded (for name tab below box)
     */
    _drawRoundedRectBottom(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.closePath();
    }

    reset() {
        this.queue = [];
        this.currentDialogue = null;
        this.active = false;
        this.blocking = false;
        this.textComplete = false;
        this.advanceRequested = false;
        this.displayedChars = 0;
        this.charTimer = 0;
        this.blinkTimer = 0;
    }

    destroy() {
        window.removeEventListener('click', this._onAdvance, true);
        window.removeEventListener('touchstart', this._onAdvance, true);
    }
}
