import React, { useEffect, useState, useRef } from 'react';

export const TravelCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only enable for desktop devices with fine pointer (mouse), disable on touchscreens
    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Directly update inner dot for zero latency
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button, a, input, select, textarea, [role="button"], .interactive-hover')
        );
        setHovered(isInteractive);
      }
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);
    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth trailing loop for outer compass ring
    const updateRing = () => {
      const lerp = 0.18; // smooth inertia
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * lerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * lerp;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(updateRing);
    };

    rafId.current = requestAnimationFrame(updateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s ease'
      }}
    >
      {/* 1. Precise Center Dot */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: -3,
          left: -3,
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#059669',
          boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)',
          pointerEvents: 'none',
          willChange: 'transform'
        }}
      />

      {/* 2. Trailing Compass Outer Ring */}
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          top: hovered ? -24 : -16,
          left: hovered ? -24 : -16,
          width: hovered ? '48px' : '32px',
          height: hovered ? '48px' : '32px',
          borderRadius: '50%',
          border: hovered ? '1.5px dashed #059669' : '1.5px solid rgba(5, 150, 105, 0.45)',
          backgroundColor: hovered ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
          transform: `scale(${clicked ? 0.82 : 1})`,
          transition: 'width 0.22s ease, height 0.22s ease, top 0.22s ease, left 0.22s ease, border-color 0.2s ease, background-color 0.2s ease, transform 0.15s ease',
          pointerEvents: 'none',
          willChange: 'transform',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Subtle compass cardinal tick mark at North */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '2px',
            height: hovered ? '5px' : '3px',
            backgroundColor: '#059669',
            borderRadius: '1px'
          }}
        />
      </div>
    </div>
  );
};
