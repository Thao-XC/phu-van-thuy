import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useBackLayer } from '../../services/backStack';

type SheetSize = 'sm' | 'md' | 'lg' | 'xl';

interface SheetProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Max width on PC. Phones always get a full-width bottom sheet. */
  size?: SheetSize;
  /** Extra classes for the scrolling body (padding, flex layout…) */
  className?: string;
  /** Extra classes for the sheet itself (e.g. a fixed height for chat) */
  cardClassName?: string;
  /** Accessible name for the dialog */
  label?: string;
}

const WIDTH: Record<SheetSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/**
 * One responsive popup for the whole app.
 * - Phone: bottom sheet, full width, grab handle, swipe down to dismiss.
 * - PC: centred dialog.
 * - Both: Esc, back button/gesture, tapping the backdrop, or the × button closes it; page behind doesn't scroll.
 */
export const Sheet: React.FC<SheetProps> = ({
  onClose,
  children,
  size = 'md',
  className = '',
  cardClassName = '',
  label,
}) => {
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc, the browser back button and Android back all close the topmost sheet only
  useBackLayer(true, onClose);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Swipe-down-to-close, from the grab handle area only (so inner scrolling still works)
  const onTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - dragStart.current));
  };
  const onTouchEnd = () => {
    if (dragY > 90) onClose();
    setDragY(0);
    dragStart.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="absolute inset-0 bg-[#2c241c]/45 backdrop-blur-[2px] sheet-fade" onClick={onClose} />

      <div
        className={`sheet-panel relative w-full ${WIDTH[size]} flex flex-col max-h-[92dvh] sm:max-h-[88vh] dh-paper rounded-t-2xl sm:rounded-lg shadow-[0_-8px_40px_rgba(44,36,28,0.25)] sm:shadow-[0_20px_60px_rgba(44,36,28,0.3)] overflow-hidden ${cardClassName}`}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        {/* Vermilion hairline (PC) / grab handle (phone) */}
        <div className="hidden sm:block absolute top-4 left-4 w-3.5 h-3.5 bg-[#b8382b] border-2 border-[#211a15] rotate-45" aria-hidden />
        <div
          className="sm:hidden shrink-0 flex justify-center pt-2.5 pb-1 touch-none cursor-grab"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div className="w-10 h-1.5 rounded-full bg-[#d8c9b1]" />
        </div>

        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-2.5 right-3 sm:top-3.5 sm:right-3.5 z-30 w-9 h-9 flex items-center justify-center rounded-full text-[#6d5b49] hover:text-[#2c241c] hover:bg-[#efe5d3] focus-visible:outline-2 focus-visible:outline-[#b45309] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[max(1.25rem,env(safe-area-inset-bottom))] ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
