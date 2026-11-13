import React, { useState, useRef } from 'react';

interface ProgressBarProps {
  progressMs: number;
  durationMs: number;
  durationFormatted: string;
  onSeek: (timeMs: number) => void;
  disabled?: boolean;
}

function formatMs(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressMs,
  durationMs,
  durationFormatted,
  onSeek,
  disabled = false,
}) => {
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMs, setDragMs] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  const effectiveDuration = durationMs > 0 ? durationMs : 1;
  const currentMs = isDragging && dragMs !== null ? dragMs : progressMs;
  const percent = Math.min(100, Math.max(0, (currentMs / effectiveDuration) * 100));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || disabled) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetMs = ratio * effectiveDuration;

    setHoverPosition(ratio * 100);

    if (isDragging) {
      setDragMs(targetMs);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !barRef.current) return;
    setIsDragging(true);
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setDragMs(ratio * effectiveDuration);
  };

  const handleMouseUp = () => {
    if (isDragging && dragMs !== null) {
      onSeek(dragMs);
      setIsDragging(false);
      setDragMs(null);
    }
  };

  return (
    <div
      className="w-full flex flex-col gap-1.5 select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setHoverPosition(null);
        if (isDragging && dragMs !== null) {
          onSeek(dragMs);
          setIsDragging(false);
          setDragMs(null);
        }
      }}
    >
      {/* Scrubber Bar */}
      <div
        ref={barRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        className={`group relative h-2.5 w-full bg-surface-border/60 hover:bg-surface-border rounded-full cursor-pointer transition-all ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        {/* Fill Track */}
        <div
          className="h-full bg-gradient-to-r from-spotify via-emerald-400 to-neon-cyan rounded-full relative transition-all"
          style={{ width: `${percent}%` }}
        >
          {/* Scrubber Knob */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg shadow-spotify/50 scale-0 group-hover:scale-100 transition-transform" />
        </div>

        {/* Hover timestamp tooltip */}
        {hoverPosition !== null && durationMs > 0 && (
          <div
            className="absolute -top-7 -translate-x-1/2 bg-surface-card border border-white/10 text-[11px] font-mono font-medium px-2 py-0.5 rounded shadow pointer-events-none"
            style={{ left: `${hoverPosition}%` }}
          >
            {formatMs((hoverPosition / 100) * durationMs)}
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>{formatMs(currentMs)}</span>
        <span>{durationFormatted || '0:00'}</span>
      </div>
    </div>
  );
};
