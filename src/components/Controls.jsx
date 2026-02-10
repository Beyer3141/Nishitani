import { useState, useCallback, useRef, useEffect } from 'react';

// ---------- Constants ----------
const JOYSTICK_RADIUS = 60;
const KNOB_RADIUS = 20;
const DEAD_ZONE = 12;

// ---------- Virtual Joystick ----------
function VirtualJoystick({ onTouchStart, onTouchEnd }) {
    const baseRef = useRef(null);
    const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
    const [active, setActive] = useState(false);
    const activeDirections = useRef(new Set());

    const emitDirections = useCallback((dx, dy) => {
        const next = new Set();
        if (dx < -DEAD_ZONE) next.add('left');
        if (dx > DEAD_ZONE) next.add('right');
        if (dy < -DEAD_ZONE) next.add('up');
        if (dy > DEAD_ZONE) next.add('down');

        const prev = activeDirections.current;
        // Release directions no longer held
        for (const dir of prev) {
            if (!next.has(dir)) onTouchEnd(dir);
        }
        // Press new directions
        for (const dir of next) {
            if (!prev.has(dir)) onTouchStart(dir);
        }
        activeDirections.current = next;
    }, [onTouchStart, onTouchEnd]);

    const releaseAll = useCallback(() => {
        for (const dir of activeDirections.current) {
            onTouchEnd(dir);
        }
        activeDirections.current = new Set();
        setKnobPos({ x: 0, y: 0 });
        setActive(false);
    }, [onTouchEnd]);

    const getOffset = useCallback((clientX, clientY) => {
        const rect = baseRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = JOYSTICK_RADIUS - KNOB_RADIUS;
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }
        return { dx, dy };
    }, []);

    const handleStart = useCallback((e) => {
        e.preventDefault();
        setActive(true);
        const t = e.touches ? e.touches[0] : e;
        const { dx, dy } = getOffset(t.clientX, t.clientY);
        setKnobPos({ x: dx, y: dy });
        emitDirections(dx, dy);
    }, [getOffset, emitDirections]);

    const handleMove = useCallback((e) => {
        e.preventDefault();
        if (!active && !e.touches) return;
        const t = e.touches ? e.touches[0] : e;
        const { dx, dy } = getOffset(t.clientX, t.clientY);
        setKnobPos({ x: dx, y: dy });
        emitDirections(dx, dy);
    }, [active, getOffset, emitDirections]);

    const handleEnd = useCallback((e) => {
        e.preventDefault();
        releaseAll();
    }, [releaseAll]);

    // Mouse move/up on window so dragging outside still works
    useEffect(() => {
        if (!active) return;
        const onMouseMove = (e) => {
            const { dx, dy } = getOffset(e.clientX, e.clientY);
            setKnobPos({ x: dx, y: dy });
            emitDirections(dx, dy);
        };
        const onMouseUp = () => releaseAll();
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [active, getOffset, emitDirections, releaseAll]);

    const diameter = JOYSTICK_RADIUS * 2;

    return (
        <div
            ref={baseRef}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
            onMouseDown={handleStart}
            style={{
                width: diameter,
                height: diameter,
                borderRadius: '50%',
                position: 'relative',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                // Base ring
                background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.25) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: active
                    ? 'inset 0 0 30px rgba(140,180,255,0.06), 0 0 12px rgba(140,180,255,0.04)'
                    : 'inset 0 0 20px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                overflow: 'hidden',
            }}
        >
            {/* Concentric guide rings */}
            <svg
                width={diameter}
                height={diameter}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
                <circle cx={JOYSTICK_RADIUS} cy={JOYSTICK_RADIUS} r={JOYSTICK_RADIUS - 4}
                    fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <circle cx={JOYSTICK_RADIUS} cy={JOYSTICK_RADIUS} r={JOYSTICK_RADIUS * 0.6}
                    fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <circle cx={JOYSTICK_RADIUS} cy={JOYSTICK_RADIUS} r={JOYSTICK_RADIUS * 0.3}
                    fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                {/* Crosshair lines */}
                <line x1={JOYSTICK_RADIUS} y1={4} x2={JOYSTICK_RADIUS} y2={diameter - 4}
                    stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1={4} y1={JOYSTICK_RADIUS} x2={diameter - 4} y2={JOYSTICK_RADIUS}
                    stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                {/* Diagonal guides */}
                <line x1={14} y1={14} x2={diameter - 14} y2={diameter - 14}
                    stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
                <line x1={diameter - 14} y1={14} x2={14} y2={diameter - 14}
                    stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
            </svg>

            {/* Knob */}
            <div
                style={{
                    position: 'absolute',
                    width: KNOB_RADIUS * 2,
                    height: KNOB_RADIUS * 2,
                    borderRadius: '50%',
                    left: JOYSTICK_RADIUS - KNOB_RADIUS + knobPos.x,
                    top: JOYSTICK_RADIUS - KNOB_RADIUS + knobPos.y,
                    background: active
                        ? 'radial-gradient(circle at 40% 38%, rgba(180,200,255,0.18) 0%, rgba(100,130,200,0.10) 60%, rgba(60,80,140,0.06) 100%)'
                        : 'radial-gradient(circle at 40% 38%, rgba(255,255,255,0.10) 0%, rgba(150,150,180,0.06) 60%, rgba(80,80,100,0.04) 100%)',
                    border: active
                        ? '1px solid rgba(180,200,255,0.25)'
                        : '1px solid rgba(255,255,255,0.10)',
                    boxShadow: active
                        ? '0 0 8px rgba(140,170,255,0.12), inset 0 1px 2px rgba(255,255,255,0.08)'
                        : '0 0 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.05)',
                    transition: active ? 'none' : 'all 0.15s ease-out',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}

// ---------- Action Button ----------
function ActionButton({ onDown, onUp, size, label, accentColor, style: extraStyle }) {
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

    const handleLeave = useCallback(() => {
        if (pressed) {
            setPressed(false);
            onUp();
        }
    }, [pressed, onUp]);

    const accent = accentColor || 'rgba(255,255,255,0.15)';

    return (
        <button
            onTouchStart={handleDown}
            onTouchEnd={handleUp}
            onTouchCancel={handleUp}
            onMouseDown={handleDown}
            onMouseUp={handleUp}
            onMouseLeave={handleLeave}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                border: `1px solid ${pressed ? accentColor || 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                background: pressed
                    ? `radial-gradient(circle at 45% 42%, ${accent}, rgba(0,0,0,0.3) 100%)`
                    : 'radial-gradient(circle at 45% 42%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.25) 100%)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                boxShadow: pressed
                    ? `inset 0 0 12px rgba(0,0,0,0.4), 0 0 8px ${accent}`
                    : 'inset 0 0 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
                transform: pressed ? 'scale(0.93)' : 'scale(1)',
                filter: pressed ? 'brightness(1.3)' : 'brightness(1)',
                transition: 'transform 0.06s ease, filter 0.06s ease, border-color 0.1s ease, box-shadow 0.1s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: 'pointer',
                outline: 'none',
                padding: 0,
                color: '#fff',
                ...extraStyle,
            }}
        >
            <span style={{
                fontSize: size > 60 ? 16 : 12,
                fontWeight: 300,
                letterSpacing: '0.05em',
                color: pressed ? '#fff' : 'rgba(255,255,255,0.55)',
                textShadow: pressed ? `0 0 6px ${accent}` : 'none',
                transition: 'color 0.06s ease, text-shadow 0.06s ease',
                fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',
                lineHeight: 1,
                pointerEvents: 'none',
            }}>
                {label}
            </span>
        </button>
    );
}

// ---------- Main Controls ----------
export default function Controls({ onTouchStart, onTouchEnd }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
                pointerEvents: 'none',
                zIndex: 50,
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '0 12px',
            }}>
                {/* Left: Virtual Joystick */}
                <div style={{ pointerEvents: 'auto' }}>
                    <VirtualJoystick onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} />
                </div>

                {/* Right: Action Buttons - triangular layout */}
                <div style={{
                    pointerEvents: 'auto',
                    position: 'relative',
                    width: 140,
                    height: 140,
                }}>
                    {/* FIRE - center, largest */}
                    <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)' }}>
                        <ActionButton
                            onDown={() => onTouchStart('fire')}
                            onUp={() => onTouchEnd('fire')}
                            size={68}
                            label={'\u767A\u5C04'}
                            accentColor="rgba(200,160,140,0.18)"
                        />
                    </div>

                    {/* BOMB - bottom left */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
                        <ActionButton
                            onDown={() => onTouchStart('bomb')}
                            onUp={() => onTouchEnd('bomb')}
                            size={52}
                            label={'\u7206'}
                            accentColor="rgba(255,180,100,0.15)"
                        />
                    </div>

                    {/* SPECIAL - bottom right */}
                    <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                        <ActionButton
                            onDown={() => onTouchStart('special')}
                            onUp={() => onTouchEnd('special')}
                            size={52}
                            label={'\u6280'}
                            accentColor="rgba(140,160,255,0.15)"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
