export class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.muted = false;
        this.initialized = false;
        this.musicNodes = [];
        this.musicInterval = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.25;
            this.musicGain.connect(this.masterGain);

            this.initialized = true;
        } catch (e) {
            // Web Audio not available
        }
    }

    _ensureCtx() {
        if (!this.initialized) this.init();
        if (!this.ctx) return false;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
    }

    _playTone(freq, type, duration, gainValue = 0.3, dest = null) {
        if (!this._ensureCtx() || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(dest || this.sfxGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    _playNoise(duration, gainValue = 0.2, filterFreq = 4000) {
        if (!this._ensureCtx() || this.muted) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        source.start();
    }

    playShoot() {
        this._playTone(880, 'square', 0.05, 0.15);
    }

    playHeavyShoot() {
        this._playTone(220, 'sawtooth', 0.1, 0.2);
        this._playNoise(0.05, 0.1, 2000);
    }

    playHit() {
        this._playTone(300, 'square', 0.08, 0.15);
        this._playNoise(0.06, 0.1, 3000);
    }

    playExplosion() {
        this._playNoise(0.3, 0.25, 2000);
        this._playTone(80, 'sine', 0.3, 0.2);
    }

    playBigExplosion() {
        this._playNoise(0.6, 0.35, 1500);
        this._playTone(50, 'sine', 0.5, 0.3);
        setTimeout(() => this._playNoise(0.3, 0.2, 1000), 100);
    }

    playPowerUp() {
        if (!this._ensureCtx() || this.muted) return;
        const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 'sine', 0.12, 0.2), i * 60);
        });
    }

    playBossWarning() {
        if (!this._ensureCtx() || this.muted) return;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this._playTone(100, 'square', 0.15, 0.25);
                this._playTone(150, 'square', 0.15, 0.15);
            }, i * 300);
        }
    }

    playBossDeath() {
        this.playBigExplosion();
        setTimeout(() => this._playNoise(0.4, 0.2, 800), 200);
        setTimeout(() => {
            const notes = [262, 330, 392, 523];
            notes.forEach((f, i) => {
                setTimeout(() => this._playTone(f, 'sine', 0.2, 0.2), i * 80);
            });
        }, 500);
    }

    playGraze() {
        this._playTone(2000, 'triangle', 0.03, 0.1);
    }

    playBomb() {
        this._playNoise(0.5, 0.3, 1500);
        this._playTone(60, 'sine', 0.6, 0.3);
        this._playTone(40, 'sine', 0.8, 0.2);
    }

    playMenuSelect() {
        this._playTone(1000, 'square', 0.03, 0.1);
    }

    playMenuConfirm() {
        this._playTone(800, 'square', 0.05, 0.12);
        setTimeout(() => this._playTone(1200, 'square', 0.05, 0.12), 60);
    }

    playWaveClear() {
        if (!this._ensureCtx() || this.muted) return;
        const notes = [392, 494, 587, 659, 784]; // G4 B4 D5 E5 G5
        notes.forEach((f, i) => {
            setTimeout(() => this._playTone(f, 'sine', 0.2, 0.2), i * 100);
        });
    }

    playDeath() {
        this._playTone(400, 'square', 0.1, 0.2);
        setTimeout(() => this._playTone(200, 'square', 0.15, 0.2), 100);
        setTimeout(() => this._playTone(100, 'square', 0.3, 0.2), 200);
        this._playNoise(0.5, 0.2, 2000);
    }

    playShopBuy() {
        this._playTone(1500, 'triangle', 0.06, 0.15);
        setTimeout(() => this._playTone(2000, 'triangle', 0.08, 0.15), 70);
    }

    playLifeUp() {
        if (!this._ensureCtx() || this.muted) return;
        const notes = [523, 659, 784, 1047, 1319];
        notes.forEach((f, i) => {
            setTimeout(() => this._playTone(f, 'sine', 0.15, 0.15), i * 70);
        });
    }

    startMusic(tempo = 120) {
        this.stopMusic();
        if (!this._ensureCtx() || this.muted) return;

        const beatDuration = 60000 / tempo;
        let beat = 0;
        const bassNotes = [65, 65, 82, 82, 73, 73, 98, 98]; // C2 C2 E2 E2 D2 D2 G2 G2

        this.musicInterval = setInterval(() => {
            if (this.muted || !this.ctx) return;
            const noteIdx = beat % bassNotes.length;

            // Bass
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'sine';
            bassOsc.frequency.value = bassNotes[noteIdx];
            bassGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + beatDuration / 1000 * 0.8);
            bassOsc.connect(bassGain);
            bassGain.connect(this.musicGain);
            bassOsc.start();
            bassOsc.stop(this.ctx.currentTime + beatDuration / 1000);

            // Kick on beats 0, 4
            if (beat % 4 === 0) {
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.type = 'sine';
                kickOsc.frequency.setValueAtTime(150, this.ctx.currentTime);
                kickOsc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);
                kickGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
                kickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
                kickOsc.connect(kickGain);
                kickGain.connect(this.musicGain);
                kickOsc.start();
                kickOsc.stop(this.ctx.currentTime + 0.15);
            }

            // Hi-hat on every beat
            if (beat % 2 === 1) {
                const bufSize = this.ctx.sampleRate * 0.03;
                const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
                const src = this.ctx.createBufferSource();
                src.buffer = buf;
                const hg = this.ctx.createGain();
                hg.gain.setValueAtTime(0.08, this.ctx.currentTime);
                hg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
                const hf = this.ctx.createBiquadFilter();
                hf.type = 'highpass';
                hf.frequency.value = 8000;
                src.connect(hf);
                hf.connect(hg);
                hg.connect(this.musicGain);
                src.start();
            }

            beat++;
        }, beatDuration / 2);
    }

    startBossMusic() {
        this.startMusic(150);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    toggle() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        }
        return this.muted;
    }
}
