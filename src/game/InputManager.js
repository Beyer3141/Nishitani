export class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = [];
        this._justPressed = {};
        this._justReleased = {};
        this.paused = false;

        this._onKeyDown = (e) => {
            if (this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
                this._justPressed[e.key] = true;
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        };

        this._onKeyUp = (e) => {
            const idx = this.keys.indexOf(e.key);
            if (idx > -1) this.keys.splice(idx, 1);
            this._justReleased[e.key] = true;
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    isHeld(key) {
        return this.keys.includes(key);
    }

    wasJustPressed(key) {
        return !!this._justPressed[key];
    }

    wasJustReleased(key) {
        return !!this._justReleased[key];
    }

    injectKey(key, active) {
        if (active) {
            if (this.keys.indexOf(key) === -1) {
                this.keys.push(key);
                this._justPressed[key] = true;
            }
        } else {
            const idx = this.keys.indexOf(key);
            if (idx > -1) this.keys.splice(idx, 1);
            this._justReleased[key] = true;
        }
    }

    clearFrame() {
        this._justPressed = {};
        this._justReleased = {};
    }

    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
    }
}
