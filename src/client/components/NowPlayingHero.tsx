import React from 'react';
import type { TrackData } from '../../shared/types';
import { Disc3, Youtube, Radio, Music, Sparkles } from 'lucide-react';

interface NowPlayingHeroProps {
  track: TrackData | null;
  isPlaying: boolean;
  isPaused: boolean;
  onOpenSearch: () => void;
}

export const NowPlayingHero: React.FC<NowPlayingHeroProps> = ({
  track,
  isPlaying,
  isPaused,
  onOpenSearch,
}) => {
  if (!track) {
    return (
      <div className="glass-card rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-5 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-spotify/5 via-transparent to-discord/5 pointer-events-none" />
        <div className="w-20 h-20 rounded-full bg-surface-subtle border border-white/10 flex items-center justify-center text-slate-500 shadow-inner">
          <Disc3 className="w-10 h-10 animate-spin-slow animate-spin-paused" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-wide text-slate-200">
            No Audio Playing
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
            Search YouTube or Spotify below, paste a link, or pick a track from your queue.
          </p>
        </div>
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-gradient-to-r from-spotify to-emerald-500 hover:from-spotify-hover hover:to-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-full text-xs sm:text-sm shadow-lg shadow-spotify/25 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Pick a Song to Play</span>
        </button>
      </div>
    );
  }

  // Determine source styling
  let SourceIcon = Music;
  let sourceBadge = 'Harmonix';
  let badgeColor = 'text-spotify bg-spotify/10 border-spotify/30';

  if (track.source === 'youtube') {
    SourceIcon = Youtube;
    sourceBadge = 'YouTube Music';
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else if (track.source === 'spotify') {
    SourceIcon = Radio;
    sourceBadge = 'Spotify';
    badgeColor = 'text-spotify bg-spotify/10 border-spotify/30';
  }

  const isSpinning = isPlaying && !isPaused;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10">
      {/* Ambient background glow from artwork */}
      {track.thumbnail && (
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[100px] opacity-25 pointer-events-none"
          style={{ backgroundImage: `url(${track.thumbnail})`, backgroundSize: 'cover' }}
        />
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 lg:gap-8">
        {/* Album Artwork + Vinyl Record combo */}
        <div className="relative group shrink-0 flex items-center justify-center">
          {/* Rotating Vinyl Record */}
          <div
            className={`absolute -right-6 sm:-right-8 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-black via-zinc-900 to-black p-1 shadow-2xl border border-zinc-700/50 flex items-center justify-center transition-all ${
              isSpinning ? 'animate-spin-slow' : 'animate-spin-slow animate-spin-paused'
            }`}
          >
            {/* Vinyl grooves */}
            <div className="w-full h-full rounded-full border border-zinc-700/30 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border border-zinc-700/20 flex items-center justify-center">
                {/* Center label */}
                <div
                  className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-inner flex items-center justify-center"
                  style={{
                    backgroundImage: track.thumbnail ? `url(${track.thumbnail})` : undefined,
                    backgroundSize: 'cover',
                  }}
                >
                  <div className="w-3.5 h-3.5 bg-black rounded-full border border-zinc-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Front Album Sleeve Artwork */}
          <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-surface-subtle">
            {track.thumbnail ? (
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Music className="w-12 h-12" />
              </div>
            )}
          </div>
        </div>

        {/* Track Metadata & Badges */}
        <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-center">
          {/* Source & Status Badges */}
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${badgeColor}`}
            >
              <SourceIcon className="w-3.5 h-3.5" />
              {sourceBadge}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-surface-subtle text-slate-300 border border-white/5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSpinning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isSpinning ? 'Streaming Live' : isPaused ? 'Playback Paused' : 'Buffering'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug line-clamp-2">
            <a
              href={track.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-spotify transition-colors"
            >
              {track.title}
            </a>
          </h1>

          {/* Artist & Requested By */}
          <p className="text-sm sm:text-base font-medium text-slate-300 mt-1">
            {track.author || 'Unknown Artist'}
          </p>

          {track.requestedBy && (
            <div className="flex items-center justify-center md:justify-start gap-2 mt-3 pt-3 border-t border-white/5 text-xs text-slate-400">
              <span>Requested by:</span>
              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                {track.requestedBy.avatar && (
                  <img
                    src={track.requestedBy.avatar}
                    alt={track.requestedBy.username}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span>@{track.requestedBy.username}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
