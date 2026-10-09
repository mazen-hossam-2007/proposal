import React, { useMemo } from 'react';

export const FloatingHearts: React.FC = () => {
  const hearts = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.5 + Math.random() * 4) % 96}%`,
      delay: `${(i * 1.3) % 12}s`,
      duration: `${14 + (i % 8) * 2}s`,
      size: `${14 + (i % 5) * 6}px`,
      symbol: ['❤️', '💖', '🌸', '✨', '💕', '🌷'][i % 6],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute opacity-0 select-none"
          style={{
            left: h.left,
            bottom: '-40px',
            fontSize: h.size,
            animation: `float-heart ${h.duration} linear infinite`,
            animationDelay: h.delay,
          }}
        >
          {h.symbol}
        </span>
      ))}
    </div>
  );
};
