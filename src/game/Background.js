const THEMES = {
    space: {
        gradient: ['#0a0a1a', '#1a1a3a'],
        layers: [
            { speed: 0.2, count: 60, sizeRange: [0.5, 1.5], alphaRange: [0.1, 0.3], color: 'white' },
            { speed: 0.5, count: 40, sizeRange: [1, 2.5], alphaRange: [0.3, 0.5], color: 'white' },
            { speed: 1.0, count: 20, sizeRange: [2, 3], alphaRange: [0.6, 0.9], color: 'white' },
        ]
    },
    nebula: {
        gradient: ['#1a0a2e', '#0a1a2e'],
        layers: [
            { speed: 0.1, count: 5, sizeRange: [60, 120], alphaRange: [0.04, 0.08], color: 'nebula', type: 'cloud' },
            { speed: 0.3, count: 50, sizeRange: [0.5, 2], alphaRange: [0.2, 0.5], color: 'white' },
            { speed: 0.8, count: 25, sizeRange: [1, 3], alphaRange: [0.5, 0.8], color: 'white' },
        ]
    },
    asteroid: {
        gradient: ['#1a1a0a', '#2a1a0a'],
        layers: [
            { speed: 0.2, count: 40, sizeRange: [0.5, 1.5], alphaRange: [0.1, 0.3], color: 'white' },
            { speed: 0.4, count: 6, sizeRange: [8, 25], alphaRange: [0.15, 0.25], color: '#665544', type: 'asteroid' },
            { speed: 0.7, count: 3, sizeRange: [15, 35], alphaRange: [0.2, 0.35], color: '#887766', type: 'asteroid' },
        ]
    },
    warp: {
        gradient: ['#000020', '#100030'],
        layers: [
            { speed: 4.0, count: 80, sizeRange: [1, 2], alphaRange: [0.3, 0.7], color: 'cyan', type: 'warpline' },
        ]
    },
    crimson: {
        gradient: ['#1a0a0a', '#2a0a1a'],
        layers: [
            { speed: 0.15, count: 4, sizeRange: [50, 100], alphaRange: [0.03, 0.06], color: 'crimson_cloud', type: 'cloud' },
            { speed: 0.3, count: 45, sizeRange: [0.5, 2], alphaRange: [0.2, 0.4], color: '#ffaaaa' },
            { speed: 0.9, count: 15, sizeRange: [1.5, 3], alphaRange: [0.5, 0.8], color: '#ff6666' },
        ]
    },
};

export class Background {
    constructor(game) {
        this.game = game;
        this.theme = 'space';
        this.layers = [];
        this.gradient = ['#0a0a1a', '#1a1a3a'];
        this.setTheme('space');
    }

    setTheme(theme) {
        this.theme = theme;
        const def = THEMES[theme] || THEMES.space;
        this.gradient = def.gradient;
        this.layers = [];

        def.layers.forEach(layerDef => {
            const particles = [];
            for (let i = 0; i < layerDef.count; i++) {
                particles.push(this._createParticle(layerDef));
            }
            this.layers.push({ ...layerDef, particles });
        });
    }

    _createParticle(layerDef, atTop = false) {
        const w = this.game.width;
        const h = this.game.height;
        const size = layerDef.sizeRange[0] + Math.random() * (layerDef.sizeRange[1] - layerDef.sizeRange[0]);
        const alpha = layerDef.alphaRange[0] + Math.random() * (layerDef.alphaRange[1] - layerDef.alphaRange[0]);

        return {
            x: Math.random() * w,
            y: atTop ? -size : Math.random() * h,
            size,
            alpha,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            // For nebula clouds
            cloudColor: layerDef.color === 'nebula'
                ? ['#4400aa', '#0044aa', '#aa0044', '#006644'][Math.floor(Math.random() * 4)]
                : layerDef.color === 'crimson_cloud'
                    ? ['#aa0000', '#880022', '#660044'][Math.floor(Math.random() * 3)]
                    : layerDef.color,
            // For warp lines
            length: layerDef.type === 'warpline' ? 10 + Math.random() * 30 : 0,
        };
    }

    update(deltaTime) {
        this.layers.forEach(layer => {
            layer.particles.forEach(p => {
                p.y += layer.speed;
                p.rotation += p.rotSpeed;

                if (p.y > this.game.height + p.size + 10) {
                    Object.assign(p, this._createParticle(layer, true));
                    p.y = -(p.size + 5);
                }
            });
        });
    }

    draw(ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, this.game.height);
        grad.addColorStop(0, this.gradient[0]);
        grad.addColorStop(1, this.gradient[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // Draw layers
        this.layers.forEach(layer => {
            layer.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.alpha;

                if (layer.type === 'cloud') {
                    // Soft radial gradient circle
                    const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                    radGrad.addColorStop(0, p.cloudColor);
                    radGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = radGrad;
                    ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
                } else if (layer.type === 'asteroid') {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.cloudColor;
                    ctx.beginPath();
                    // Irregular polygon
                    const sides = 6;
                    for (let i = 0; i < sides; i++) {
                        const angle = (Math.PI * 2 / sides) * i;
                        const r = p.size * (0.7 + Math.sin(i * 2.3) * 0.3);
                        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    }
                    ctx.closePath();
                    ctx.fill();
                } else if (layer.type === 'warpline') {
                    ctx.strokeStyle = p.cloudColor;
                    ctx.lineWidth = p.size * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x, p.y - p.length);
                    ctx.stroke();
                } else {
                    // Regular star
                    ctx.fillStyle = p.cloudColor || 'white';
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }

                ctx.restore();
            });
        });
    }
}
