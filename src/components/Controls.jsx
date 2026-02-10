export default function Controls({ onTouchStart, onTouchEnd }) {
    return (
        <div className="absolute bottom-4 left-0 w-full px-4 flex justify-between items-center pointer-events-none">
            <div className="flex gap-4 pointer-events-auto">
                <button
                    className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center active:bg-white/40 touch-none select-none"
                    onTouchStart={(e) => { e.preventDefault(); onTouchStart('left'); }}
                    onTouchEnd={(e) => { e.preventDefault(); onTouchEnd('left'); }}
                    onMouseDown={() => onTouchStart('left')}
                    onMouseUp={() => onTouchEnd('left')}
                >
                    ←
                </button>
                <button
                    className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center active:bg-white/40 touch-none select-none"
                    onTouchStart={(e) => { e.preventDefault(); onTouchStart('right'); }}
                    onTouchEnd={(e) => { e.preventDefault(); onTouchEnd('right'); }}
                    onMouseDown={() => onTouchStart('right')}
                    onMouseUp={() => onTouchEnd('right')}
                >
                    →
                </button>
            </div>
            <div className="flex gap-3 pointer-events-auto items-center">
                <button
                    className="w-14 h-14 bg-yellow-500/40 rounded-full flex items-center justify-center active:bg-yellow-500/60 touch-none select-none text-white font-bold text-sm"
                    onTouchStart={(e) => { e.preventDefault(); onTouchStart('bomb'); }}
                    onTouchEnd={(e) => { e.preventDefault(); onTouchEnd('bomb'); }}
                    onMouseDown={() => onTouchStart('bomb')}
                    onMouseUp={() => onTouchEnd('bomb')}
                >
                    爆
                </button>
                <button
                    className="w-20 h-20 bg-red-500/40 rounded-full flex items-center justify-center active:bg-red-500/60 touch-none select-none text-white font-bold"
                    onTouchStart={(e) => { e.preventDefault(); onTouchStart('fire'); }}
                    onTouchEnd={(e) => { e.preventDefault(); onTouchEnd('fire'); }}
                    onMouseDown={() => onTouchStart('fire')}
                    onMouseUp={() => onTouchEnd('fire')}
                >
                    発射
                </button>
                <button
                    className="w-14 h-14 bg-blue-500/40 rounded-full flex items-center justify-center active:bg-blue-500/60 touch-none select-none text-white font-bold text-sm"
                    onTouchStart={(e) => { e.preventDefault(); onTouchStart('special'); }}
                    onTouchEnd={(e) => { e.preventDefault(); onTouchEnd('special'); }}
                    onMouseDown={() => onTouchStart('special')}
                    onMouseUp={() => onTouchEnd('special')}
                >
                    技
                </button>
            </div>
        </div>
    );
}
