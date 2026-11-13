import React, { useState } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number;
  onChange: (level: number) => void;
  disabled?: boolean;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  volume,
  onChange,
  disabled = false,
}) => {
  const [prevVolume, setPrevVolume] = useState(volume || 80);

  const toggleMute = () => {
    if (disabled) return;
    if (volume > 0) {
      setPrevVolume(volume);
      onChange(0);
    } else {
      onChange(prevVolume || 80);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-4 h-4 text-rose-400" />;
    if (volume < 50) return <Volume1 className="w-4 h-4 text-slate-300" />;
    return <Volume2 className="w-4 h-4 text-spotify" />;
  };

  return (
    <div className="flex items-center gap-2 select-none group">
      <button
        onClick={toggleMute}
        disabled={disabled}
        title={volume === 0 ? 'Unmute' : 'Mute'}
        className="p-1 text-slate-400 hover:text-white transition-colors"
      >
        {getVolumeIcon()}
      </button>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="120"
          value={volume}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-20 sm:w-28 h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-spotify disabled:opacity-30"
        />
        <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
          {volume}%
        </span>
      </div>
    </div>
  );
};
