import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  isPaused: boolean;
  barCount?: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  isPaused,
  barCount = 36,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const spacing = 3;
      const totalSpacing = spacing * (barCount - 1);
      const barWidth = (width - totalSpacing) / barCount;

      const active = isPlaying && !isPaused;

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        let barHeight = 4; // idle baseline

        if (active) {
          // Dynamic harmonic formula for fluid bounce
          const wave1 = Math.sin(phase + i * 0.25);
          const wave2 = Math.cos(phase * 1.5 + i * 0.45);
          const factor = Math.abs((wave1 + wave2) / 2);
          barHeight = 4 + factor * (height - 8);
        } else if (isPaused) {
          barHeight = 6;
        }

        const x = i * (barWidth + spacing);
        const y = height - barHeight;

        // Gradient styling
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#1DB954'); // Spotify green
        gradient.addColorStop(0.5, '#5865F2'); // Discord blurple
        gradient.addColorStop(1, '#A855F7'); // Neon purple

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      if (active) {
        phase += 0.08;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isPaused, barCount]);

  return (
    <div className="w-full flex items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        className="w-full max-w-[320px] h-12 pointer-events-none opacity-90"
      />
    </div>
  );
};
