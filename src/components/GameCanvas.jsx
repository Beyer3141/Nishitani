import { useEffect, useRef } from 'react';
import { Game } from '../game/Game';
import Controls from './Controls';

export default function GameCanvas() {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            gameRef.current = new Game(canvasRef.current);
            gameRef.current.start();
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.stop();
            }
        };
    }, []);

    const handleTouchStart = (action) => {
        if (gameRef.current) {
            if (gameRef.current.gameOver) {
                gameRef.current.restart();
            } else {
                gameRef.current.setTouchInput(action, true);
            }
        }
    };

    const handleTouchEnd = (action) => {
        if (gameRef.current && !gameRef.current.gameOver) {
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
