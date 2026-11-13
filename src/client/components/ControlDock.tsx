import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Infinity as InfinityIcon,
  Square,
  Sliders,
  FileText,
} from 'lucide-react';
import { VolumeSlider } from './VolumeSlider';

interface ControlDockProps {
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  repeatMode: 'off' | 'track' | 'queue' | 'autoplay';
  onTogglePause: () => void;
  onSkip: () => void;
  onPrevious: () => void;
  onStop: () => void;
  onShuffle: () => void;
  onSetLoop: (mode: 'off' | 'track' | 'queue' | 'autoplay') => void;
  onVolumeChange: (volume: number) => void;
  onOpenEqualizer: () => void;
  onOpenLyrics: () => void;
  disabled?: boolean;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  isPlaying,
  isPaused,
  volume,
  repeatMode,
  onTogglePause,
  onSkip,
  onPrevious,
  onStop,
  onShuffle,
  onSetLoop,
  onVolumeChange,
  onOpenEqualizer,
  onOpenLyrics,
  disabled = false,
}) => {
  const cycleLoopMode = () => {
    if (repeatMode === 'off') onSetLoop('track');
    else if (repeatMode === 'track') onSetLoop('queue');
    else if (repeatMode === 'queue') onSetLoop('autoplay');
    else onSetLoop('off');
  };

  const getLoopIcon = () => {
    if (repeatMode === 'track') return <Repeat1 className="w-4 h-4 text-spotify" />;
    if (repeatMode === 'queue') return <Repeat className="w-4 h-4 text-spotify" />;
    if (repeatMode === 'autoplay') return <InfinityIcon className="w-4 h-4 text-neon-cyan" />;
    return <Repeat className="w-4 h-4 text-slate-400" />;
  };

  const activeLoopBadge = repeatMode !== 'off';

  return (
    <div className="glass-panel rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 shadow-2xl">
      {/* Left: Quick Actions & Volume */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <VolumeSlider volume={volume} onChange={onVolumeChange} disabled={disabled} />

        <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
          <button
            onClick={onOpenEqualizer}
            title="Equalizer & Sound FX"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-card border border-white/5 text-slate-400 hover:text-white transition-all"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenLyrics}
            title="Song Lyrics"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-card border border-white/5 text-slate-400 hover:text-white transition-all"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Playback Transport Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shuffle */}
        <button
          onClick={onShuffle}
          disabled={disabled}
          title="Shuffle Queue"
          className="p-2.5 rounded-full hover:bg-surface-card text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        {/* Previous */}
        <button
          onClick={onPrevious}
          disabled={disabled}
          title="Previous Track"
          className="p-2.5 rounded-full hover:bg-surface-card text-slate-300 hover:text-white transition-all disabled:opacity-30"
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </button>

        {/* Play / Pause (Hero Center Button) */}
        <button
          onClick={onTogglePause}
          disabled={disabled}
          title={isPaused ? 'Resume Playback' : 'Pause Playback'}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-spotify to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-spotify/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
        >
          {isPlaying && !isPaused ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Skip Next */}
        <button
          onClick={onSkip}
          disabled={disabled}
          title="Skip Track"
          className="p-2.5 rounded-full hover:bg-surface-card text-slate-300 hover:text-white transition-all disabled:opacity-30"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>

        {/* Loop Cycle */}
        <button
          onClick={cycleLoopMode}
          disabled={disabled}
          title={`Loop Mode: ${repeatMode.toUpperCase()}`}
          className={`p-2.5 rounded-full transition-all relative ${
            activeLoopBadge
              ? 'bg-spotify/15 border border-spotify/30'
              : 'hover:bg-surface-card text-slate-400'
          }`}
        >
          {getLoopIcon()}
        </button>
      </div>

      {/* Right: Stop & Leave */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onStop}
          disabled={disabled}
          title="Stop & Clear Queue"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all disabled:opacity-30"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Stop</span>
        </button>
      </div>
    </div>
  );
};
