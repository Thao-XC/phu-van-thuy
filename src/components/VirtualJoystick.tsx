import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onInteract?: () => void;
  interactLabel?: string | null;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onInteract,
  interactLabel,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  const radius = 45; // Max radius in pixels

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, radius);
    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: clampedX, y: clampedY });
    onMove({
      x: clampedX / radius,
      y: clampedY / radius,
    });
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  // Only show on touch-enabled devices
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouchDevice) return null;

  return (
    <>
      {/* Left Virtual Joystick */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="fixed bottom-44 left-4 z-30 w-28 h-28 rounded-full bg-stone-900/40 border border-stone-600/40 backdrop-blur-xs flex items-center justify-center touch-none select-none pointer-events-auto"
      >
        {/* Joystick Center Indicator */}
        <div className="w-8 h-8 rounded-full border border-stone-500/30 bg-stone-800/20" />

        {/* Draggable Knob */}
        <div
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
          className={`absolute w-12 h-12 rounded-full border border-amber-400/60 bg-gradient-to-br from-amber-600 to-red-600 shadow-md transition-shadow ${
            isActive ? 'ring-2 ring-amber-400 scale-105' : ''
          }`}
        />
      </div>

      {/* Quick Action Button for Mobile when near a spot */}
      {interactLabel && onInteract && (
        <button
          onClick={onInteract}
          className="fixed bottom-24 right-6 z-30 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-700 to-amber-700 text-amber-100 font-cinzel font-semibold text-xs border border-amber-500 shadow-2xl active:scale-95 transition-all cursor-pointer"
        >
          {interactLabel}
        </button>
      )}
    </>
  );
};
