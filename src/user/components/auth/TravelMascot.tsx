import React, { useMemo } from 'react';

export type MascotMode = 'idle' | 'watching' | 'blindfolded' | 'peeking' | 'success';

interface TravelMascotProps {
  mode: MascotMode;
  lookProgress?: number; // 0 (left) to 1 (right)
  label?: string;
  style?: React.CSSProperties;
}

export const TravelMascot: React.FC<TravelMascotProps> = ({
  mode,
  lookProgress = 0.5,
  label,
  style
}) => {
  // Calculate eye pupil shift based on typing progress (x from -5.5 to +5.5, y down 2.2px)
  const pupilX = useMemo(() => {
    if (mode === 'watching') {
      return -5.5 + Math.min(Math.max(lookProgress, 0), 1) * 11;
    }
    return 0;
  }, [mode, lookProgress]);

  const pupilY = useMemo(() => {
    if (mode === 'watching') return 2.2;
    return 0;
  }, [mode]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
        ...style
      }}
    >
      <svg
        width="110"
        height="95"
        viewBox="0 0 120 105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffedd5" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>
          <linearGradient id="earGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="pawGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#047857" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* EARS */}
        {/* Left Ear */}
        <circle cx="28" cy="38" r="16" fill="url(#earGrad)" />
        <circle cx="28" cy="38" r="9" fill="#fbcfe8" />
        {/* Right Ear */}
        <circle cx="92" cy="38" r="16" fill="url(#earGrad)" />
        <circle cx="92" cy="38" r="9" fill="#fbcfe8" />

        {/* HEAD / FACE */}
        <ellipse cx="60" cy="62" rx="42" ry="34" fill="url(#faceGrad)" filter="url(#softGlow)" />

        {/* ROSY CHEEKS */}
        <ellipse cx="33" cy="71" rx="6" ry="3.5" fill="#f43f5e" opacity="0.4" />
        <ellipse cx="87" cy="71" rx="6" ry="3.5" fill="#f43f5e" opacity="0.4" />

        {/* EXPLORER AVIATOR HAT */}
        <g>
          {/* Hat base dome */}
          <path
            d="M26 44 C28 20, 92 20, 94 44 Z"
            fill="url(#hatGrad)"
          />
          {/* Hat rim */}
          <ellipse cx="60" cy="44" rx="42" ry="6" fill="#047857" />
          {/* Leather band */}
          <path
            d="M30 43 C40 40, 80 40, 90 43"
            stroke="#78350f"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Gold Explorer Compass Pin */}
          <circle cx="60" cy="38" r="5" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
          <polygon points="60,35 61.5,38 60,41 58.5,38" fill="#dc2626" />
        </g>

        {/* EYES CONTAINER */}
        {/* Left Eye Socket */}
        <ellipse cx="44" cy="60" rx="9" ry="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        {/* Right Eye Socket */}
        <ellipse cx="76" cy="60" rx="9" ry="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

        {/* PUPILS (Follows text typing or blinks) */}
        {mode !== 'blindfolded' ? (
          <>
            {/* Left Pupil */}
            <g style={{ transform: `translate(${pupilX}px, ${pupilY}px)`, transition: 'transform 0.15s ease' }}>
              <circle cx="44" cy="60" r="5.2" fill="#1e293b" />
              {/* Eye sparkle */}
              <circle cx="42.5" cy="58.2" r="1.8" fill="#ffffff" />
              <circle cx="45.5" cy="61.5" r="0.9" fill="#ffffff" />
            </g>

            {/* Right Pupil (or winking in peeking mode) */}
            {mode === 'peeking' ? (
              // Winking/peeking right eye
              <g style={{ transform: `translate(${pupilX}px, ${pupilY}px)`, transition: 'transform 0.15s ease' }}>
                <circle cx="76" cy="60" r="5.2" fill="#1e293b" />
                <circle cx="74.5" cy="58.2" r="1.8" fill="#ffffff" />
                <circle cx="77.5" cy="61.5" r="0.9" fill="#ffffff" />
              </g>
            ) : (
              <g style={{ transform: `translate(${pupilX}px, ${pupilY}px)`, transition: 'transform 0.15s ease' }}>
                <circle cx="76" cy="60" r="5.2" fill="#1e293b" />
                <circle cx="74.5" cy="58.2" r="1.8" fill="#ffffff" />
                <circle cx="77.5" cy="61.5" r="0.9" fill="#ffffff" />
              </g>
            )}
          </>
        ) : null}

        {/* NOSE & MOUTH */}
        <path d="M57 66 L63 66 L60 69 Z" fill="#9a3412" />
        {mode === 'success' ? (
          // Super happy open mouth
          <path d="M54 71 Q60 78 66 71 Z" fill="#e11d48" stroke="#9a3412" strokeWidth="1.2" />
        ) : (
          // Cute cat-like smile
          <path
            d="M55 70 Q57.5 73 60 70 Q62.5 73 65 70"
            fill="none"
            stroke="#9a3412"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE PAWS (Arms that cover eyes or rest down)                      */}
        {/* ========================================================================= */}
        {/* LEFT PAW */}
        <g
          style={{
            transformOrigin: '28px 90px',
            transform:
              mode === 'blindfolded'
                ? 'translate(10px, -27px) rotate(-14deg)'
                : mode === 'peeking'
                ? 'translate(10px, -27px) rotate(-14deg)' // Stays covering left eye
                : mode === 'success'
                ? 'translate(-6px, -35px) rotate(-35deg)' // Raising paw happily
                : 'translate(0px, 0px) rotate(0deg)', // Resting down
            transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1.2)'
          }}
        >
          <ellipse cx="32" cy="88" rx="12" ry="9" fill="url(#pawGrad)" stroke="#c2410c" strokeWidth="1" />
          {/* Paw pads */}
          <circle cx="32" cy="88" r="3.5" fill="#fed7aa" />
          <circle cx="27" cy="85" r="1.8" fill="#fed7aa" />
          <circle cx="32" cy="83" r="1.8" fill="#fed7aa" />
          <circle cx="37" cy="85" r="1.8" fill="#fed7aa" />
        </g>

        {/* RIGHT PAW */}
        <g
          style={{
            transformOrigin: '92px 90px',
            transform:
              mode === 'blindfolded'
                ? 'translate(-10px, -27px) rotate(14deg)' // Covers right eye
                : mode === 'peeking'
                ? 'translate(-4px, -14px) rotate(22deg)' // Lowers slightly to peek!
                : mode === 'success'
                ? 'translate(6px, -35px) rotate(35deg)' // Raising paw happily
                : 'translate(0px, 0px) rotate(0deg)', // Resting down
            transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1.2)'
          }}
        >
          <ellipse cx="88" cy="88" rx="12" ry="9" fill="url(#pawGrad)" stroke="#c2410c" strokeWidth="1" />
          {/* Paw pads */}
          <circle cx="88" cy="88" r="3.5" fill="#fed7aa" />
          <circle cx="83" cy="85" r="1.8" fill="#fed7aa" />
          <circle cx="88" cy="83" r="1.8" fill="#fed7aa" />
          <circle cx="93" cy="85" r="1.8" fill="#fed7aa" />
        </g>
      </svg>

      {/* Mood subtitle bubble */}
      <div
        style={{
          marginTop: '-0.3rem',
          fontSize: '0.74rem',
          fontWeight: 700,
          color:
            mode === 'blindfolded'
              ? '#6366f1'
              : mode === 'peeking'
              ? '#d97706'
              : mode === 'success'
              ? '#059669'
              : '#64748b',
          background: '#ffffff',
          padding: '0.2rem 0.65rem',
          borderRadius: '999px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #f1f5f9',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          transition: 'all 0.25s ease'
        }}
      >
        {mode === 'blindfolded' && (
          <>
            <i className="fa-solid fa-eye-slash" />
            <span>Mochi không nhìn trộm đâu! 🙈</span>
          </>
        )}
        {mode === 'peeking' && (
          <>
            <i className="fa-solid fa-eye" />
            <span>Mochi hé mắt xem thử... 🤫</span>
          </>
        )}
        {mode === 'watching' && (
          <>
            <i className="fa-solid fa-compass fa-spin" style={{ animationDuration: '4s' }} />
            <span>{label || 'Đang theo dõi từng ký tự... 👀'}</span>
          </>
        )}
        {mode === 'success' && (
          <>
            <i className="fa-solid fa-party-horn" />
            <span>Chào mừng bạn trở lại! 🎉</span>
          </>
        )}
        {mode === 'idle' && (
          <>
            <i className="fa-solid fa-plane-departure" style={{ color: '#059669' }} />
            <span>Mochi - Trợ lý đồng hành du lịch</span>
          </>
        )}
      </div>
    </div>
  );
};
