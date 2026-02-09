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
            if (gameRef.current.gameState === 'GAMEOVER') {
                gameRef.current.restart();
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
