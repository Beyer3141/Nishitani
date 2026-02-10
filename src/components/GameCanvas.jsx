import { useEffect, useRef } from 'react';
import { Game } from '../game/Game';
import Controls from './Controls';

export default function GameCanvas() {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            const game = new Game(canvasRef.current);
            gameRef.current = game;
            game.start();
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.stop();
                gameRef.current = null;
            }
        };
    }, []);

    const handleTouchStart = (action) => {
        if (gameRef.current) {
            const state = gameRef.current.gameState;
            if (state === 'GAMEOVER' || state === 'VICTORY') {
                gameRef.current.restart();
            } else if (state === 'START' && action === 'fire') {
                gameRef.current.input.injectKey('Enter', true);
                setTimeout(() => gameRef.current?.input.injectKey('Enter', false), 100);
            } else if (state === 'SHIP_SELECT') {
                const keyMap = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', fire: 'Enter' };
                const key = keyMap[action];
                if (key) {
                    gameRef.current.input.injectKey(key, true);
                    setTimeout(() => gameRef.current?.input.injectKey(key, false), 100);
                }
            } else if (state === 'SHOP') {
                const keyMap = { up: 'ArrowUp', down: 'ArrowDown', fire: 'Enter', left: 'ArrowLeft', right: 'ArrowRight' };
                const key = keyMap[action];
                if (key) {
                    gameRef.current.input.injectKey(key, true);
                    setTimeout(() => gameRef.current?.input.injectKey(key, false), 100);
                }
            } else {
                gameRef.current.setTouchInput(action, true);
            }
        }
    };

    const handleTouchEnd = (action) => {
        if (gameRef.current) {
            gameRef.current.setTouchInput(action, false);
        }
    };

    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
            />
            <Controls onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />
        </div>
    );
}
