import React, { useState, useRef, useCallback } from 'react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  maxTilt?: number; // default 8 degrees
  glare?: boolean; // enable dynamic sheen highlight
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  maxTilt = 7,
  glare = true,
  className = '',
  style,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const px = x / rect.width; // 0 to 1
      const py = y / rect.height; // 0 to 1

      // Calculate tilt angles: py affects rotateX (inverted), px affects rotateY
      const rotateX = (0.5 - py) * (maxTilt * 2);
      const rotateY = (px - 0.5) * (maxTilt * 2);

      setTilt({ rotateX, rotateY });
      setGlarePos({ x: px * 100, y: py * 100, opacity: 0.25 });
    },
    [maxTilt]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered
          ? 'transform 0.1s ease-out'
          : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        ...style
      }}
    >
      {children}

      {/* Dynamic Specular Glare Sheen Overlay */}
      {glare && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            zIndex: 10,
            background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}), transparent 70%)`,
            transition: 'opacity 0.25s ease',
            mixBlendMode: 'overlay'
          }}
        />
      )}
    </div>
  );
};
