import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type BeforeAfterSliderProps = {
  before: {
    src: string;
    srcSet?: string;
    alt?: string;
  };
  after: {
    src: string;
    srcSet?: string;
    alt?: string;
  };
  className?: string;
  /** 0..1 */
  initialRatio?: number;
  /** Animate the handle across once on mount (disabled after user interaction). */
  autoSweep?: boolean;
  /** Called when user starts interacting; useful to pause parent auto-rotation. */
  onUserInteract?: () => void;
};

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  before,
  after,
  className = '',
  initialRatio = 0.5,
  autoSweep = false,
  onUserInteract,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const [ratio, setRatio] = useState(() => clamp01(initialRatio));
  const [hasInteracted, setHasInteracted] = useState(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = clamp01((clientX - rect.left) / rect.width);
    setRatio(next);
  }, []);

  const notifyInteract = useCallback(() => {
    if (hasInteracted) return;
    setHasInteracted(true);
    onUserInteract?.();
  }, [hasInteracted, onUserInteract]);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) return;
    if (!autoSweep || hasInteracted) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1500;

    const tick = (t: number) => {
      const p = clamp01((t - start) / duration);
      // Ease in/out
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setRatio(0.2 + eased * 0.6);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSweep, hasInteracted]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      notifyInteract();
      setFromClientX(e.clientX);
    };
    const onUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [notifyInteract, setFromClientX]);

  const posPct = useMemo(() => `${ratio * 100}%`, [ratio]);

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden select-none touch-none ${className}`}
      role="group"
      aria-label="Before and after comparison"
    >
      {/* After image (base) */}
      <img
        src={after.src}
        srcSet={after.srcSet}
        sizes="100vw"
        alt={after.alt || 'After'}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Before image (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: posPct }}>
        <img
          src={before.src}
          srcSet={before.srcSet}
          sizes="100vw"
          alt={before.alt || 'Before'}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Handle */}
      <div
        className="absolute inset-y-0"
        style={{ left: posPct, transform: 'translateX(-1px)' }}
        aria-hidden="true"
      >
        <div className="h-full w-[2px] bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 border border-black/10 shadow-lg h-10 w-10 flex items-center justify-center"
        >
          <div className="flex gap-1">
            <span className="block h-4 w-[2px] bg-black/40" />
            <span className="block h-4 w-[2px] bg-black/40" />
          </div>
        </div>
      </div>

      {/* Interaction layer */}
      <button
        type="button"
        className="absolute inset-0 cursor-ew-resize"
        aria-label="Drag to compare before and after"
        onPointerDown={(e) => {
          isDraggingRef.current = true;
          notifyInteract();
          setFromClientX(e.clientX);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          notifyInteract();
          setRatio((r) => clamp01(r + (e.key === 'ArrowRight' ? 0.03 : -0.03)));
        }}
      />
    </div>
  );
};
