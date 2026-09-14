import React, { useState, useRef, useCallback } from 'react';

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  id: number;
}

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magneticStrength?: number; // default 0.25
  enableRipple?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  magneticStrength = 0.25,
  enableRipple = true,
  style,
  onMouseMove,
  onMouseLeave,
  onClick,
  ...rest
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) * magneticStrength;
      const dy = (e.clientY - centerY) * magneticStrength;
      setOffset({ x: dx, y: dy });
      onMouseMove?.(e);
    },
    [magneticStrength, onMouseMove]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setOffset({ x: 0, y: 0 });
      onMouseLeave?.(e);
    },
    [onMouseLeave]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableRipple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const newRipple: RippleEffect = { x, y, size, id: Date.now() };

        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
      }
      onClick?.(e);
    },
    [enableRipple, onClick]
  );

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0 ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.1s ease-out',
        ...style
      }}
      {...rest}
    >
      {/* Ripple elements */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            transform: 'scale(0)',
            animation: 'liquidRipple 0.6s linear',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      ))}
      <span style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        {children}
      </span>
      <style>{`
        @keyframes liquidRipple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};
