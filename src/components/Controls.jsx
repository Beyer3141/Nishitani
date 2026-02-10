import { useState, useCallback } from 'react';

const BTN_BASE = 'touch-none select-none transition-all duration-75 flex items-center justify-center';

function TouchBtn({ onDown, onUp, className, children, style }) {
    const [pressed, setPressed] = useState(false);
    const handleDown = useCallback((e) => {
        e.preventDefault();
        setPressed(true);
        onDown();
    }, [onDown]);
    const handleUp = useCallback((e) => {
        e.preventDefault();
        setPressed(false);
        onUp();
    }, [onUp]);

    return (
        <button
            className={`${BTN_BASE} ${className} ${pressed ? 'scale-90 brightness-150' : ''}`}
            style={style}
            onTouchStart={handleDown}
            onTouchEnd={handleUp}
            onTouchCancel={handleUp}
            onMouseDown={handleDown}
            onMouseUp={handleUp}
            onMouseLeave={() => { setPressed(false); onUp(); }}
        >
            {children}
        </button>
    );
}

export default function Controls({ onTouchStart, onTouchEnd }) {
    return (
        <div
            className="absolute left-0 w-full pointer-events-none"
            style={{ bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
        >
            {/* Main control area */}
            <div className="px-3 flex justify-between items-end">
                {/* D-Pad (left side) */}
                <div className="pointer-events-auto flex flex-col items-center gap-1" style={{ filter: 'drop-shadow(0 0 8px rgba(0,200,255,0.4))' }}>
                    {/* Up button */}
                    <TouchBtn
                        onDown={() => onTouchStart('up')}
                        onUp={() => onTouchEnd('up')}
                        className="w-12 h-10 rounded-t-xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(0,200,255,0.45) 0%, rgba(0,100,200,0.35) 100%)',
                            border: '1px solid rgba(0,200,255,0.5)',
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                            <path d="M8 1L15 9H1L8 1Z" fill="white" fillOpacity="0.9"/>
                        </svg>
                    </TouchBtn>
                    {/* Left / Right row */}
                    <div className="flex gap-1">
                        <TouchBtn
                            onDown={() => onTouchStart('left')}
                            onUp={() => onTouchEnd('left')}
                            className="w-14 h-14 rounded-l-xl"
                            style={{
                                background: 'linear-gradient(90deg, rgba(0,200,255,0.45) 0%, rgba(0,100,200,0.3) 100%)',
                                border: '1px solid rgba(0,200,255,0.5)',
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                                <path d="M1 8L9 1V15L1 8Z" fill="white" fillOpacity="0.9"/>
                            </svg>
                        </TouchBtn>
                        <TouchBtn
                            onDown={() => onTouchStart('right')}
                            onUp={() => onTouchEnd('right')}
                            className="w-14 h-14 rounded-r-xl"
                            style={{
                                background: 'linear-gradient(270deg, rgba(0,200,255,0.45) 0%, rgba(0,100,200,0.3) 100%)',
                                border: '1px solid rgba(0,200,255,0.5)',
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                                <path d="M9 8L1 15V1L9 8Z" fill="white" fillOpacity="0.9"/>
                            </svg>
                        </TouchBtn>
                    </div>
                    {/* Down button */}
                    <TouchBtn
                        onDown={() => onTouchStart('down')}
                        onUp={() => onTouchEnd('down')}
                        className="w-12 h-10 rounded-b-xl"
                        style={{
                            background: 'linear-gradient(0deg, rgba(0,200,255,0.45) 0%, rgba(0,100,200,0.35) 100%)',
                            border: '1px solid rgba(0,200,255,0.5)',
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                            <path d="M8 9L1 1H15L8 9Z" fill="white" fillOpacity="0.9"/>
                        </svg>
                    </TouchBtn>
                </div>

                {/* Action buttons (right side) - arcade style */}
                <div className="pointer-events-auto flex items-end gap-2" style={{ filter: 'drop-shadow(0 0 10px rgba(255,50,50,0.3))' }}>
                    {/* Bomb button */}
                    <TouchBtn
                        onDown={() => onTouchStart('bomb')}
                        onUp={() => onTouchEnd('bomb')}
                        className="w-13 h-13 rounded-full"
                        style={{
                            width: '52px',
                            height: '52px',
                            background: 'radial-gradient(circle at 35% 35%, rgba(255,200,0,0.6) 0%, rgba(255,120,0,0.45) 60%, rgba(200,80,0,0.3) 100%)',
                            border: '2px solid rgba(255,200,0,0.6)',
                            boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.3), 0 0 15px rgba(255,150,0,0.3)',
                            marginBottom: '18px',
                        }}
                    >
                        <span style={{ fontSize: '18px', textShadow: '0 0 8px rgba(255,200,0,0.8)', color: '#fff', fontWeight: 'bold' }}>
                            💣
                        </span>
                    </TouchBtn>

                    {/* FIRE button (main, biggest) */}
                    <TouchBtn
                        onDown={() => onTouchStart('fire')}
                        onUp={() => onTouchEnd('fire')}
                        className="rounded-full"
                        style={{
                            width: '76px',
                            height: '76px',
                            background: 'radial-gradient(circle at 35% 35%, rgba(255,80,80,0.7) 0%, rgba(220,30,30,0.55) 50%, rgba(150,0,0,0.4) 100%)',
                            border: '2.5px solid rgba(255,100,100,0.7)',
                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,50,50,0.4)',
                        }}
                    >
                        <div className="flex flex-col items-center">
                            <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#fff', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,100,100,0.9)' }}>
                                FIRE
                            </span>
                        </div>
                    </TouchBtn>

                    {/* Special button */}
                    <TouchBtn
                        onDown={() => onTouchStart('special')}
                        onUp={() => onTouchEnd('special')}
                        className="rounded-full"
                        style={{
                            width: '52px',
                            height: '52px',
                            background: 'radial-gradient(circle at 35% 35%, rgba(100,100,255,0.6) 0%, rgba(50,50,220,0.45) 60%, rgba(30,0,180,0.3) 100%)',
                            border: '2px solid rgba(120,120,255,0.6)',
                            boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.3), 0 0 15px rgba(100,100,255,0.3)',
                            marginBottom: '18px',
                        }}
                    >
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ddf', textShadow: '0 0 8px rgba(100,100,255,0.9)', letterSpacing: '1px' }}>
                            SP
                        </span>
                    </TouchBtn>
                </div>
            </div>
        </div>
    );
}
