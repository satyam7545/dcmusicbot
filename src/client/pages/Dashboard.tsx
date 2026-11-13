import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Navbar } from '../components/Navbar';
import { NowPlayingHero } from '../components/NowPlayingHero';
import { Visualizer } from '../components/Visualizer';
import { ProgressBar } from '../components/ProgressBar';
import { ControlDock } from '../components/ControlDock';
import { QueueList } from '../components/QueueList';
import { SearchModal } from '../components/SearchModal';
import { EqualizerModal } from '../components/EqualizerModal';
import { LyricsDrawer } from '../components/LyricsDrawer';
import {
  Volume2,
  Users,
  Radio,
  Sliders,
  Sparkles,
  Search,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    playerState,
    selectedGuildId,
    guilds,
    play,
    togglePause,
    skip,
    previous,
    stop,
    seek,
    setVolume,
    setLoop,
    shuffle,
    removeQueueItem,
    clearQueue,
    moveTrack,
    toggleFilter,
  } = usePlayer();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause]);

  const currentGuild = guilds.find((g) => g.id === selectedGuildId);
  const isPlaying = !!playerState?.isPlaying;
  const isPaused = !!playerState?.isPaused;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B14]">
      {/* Top Navigation */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenLyrics={() => setIsLyricsOpen(true)}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Guild Status Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-subtle flex items-center justify-center border border-white/10 overflow-hidden">
              {currentGuild?.icon ? (
                <img
                  src={currentGuild.icon}
                  alt={currentGuild.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Radio className="w-5 h-5 text-spotify" />
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {playerState?.guildName || currentGuild?.name || 'Harmonix Audio'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {playerState?.voiceChannelName ? (
                    <span>Channel: <strong className="text-slate-200">#{playerState.voiceChannelName}</strong></span>
                  ) : (
                    <span>Connected to Voice Gateway</span>
                  )}
                </span>
                {playerState?.membersInVoice !== undefined && playerState.membersInVoice > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{playerState.membersInVoice} listening</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-spotify to-emerald-400 hover:from-spotify-hover hover:to-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-spotify/20 transition-all hover:scale-105"
          >
            <Search className="w-4 h-4" />
            <span>Search & Add Music</span>
          </button>
        </div>

        {/* Console Grid: Left Player Hero, Right Live Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Now Playing Hero + Scrubber + Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Now Playing Vinyl Hero Card */}
            <NowPlayingHero
              track={playerState?.currentTrack || null}
              isPlaying={isPlaying}
              isPaused={isPaused}
              onOpenSearch={() => setIsSearchOpen(true)}
            />

            {/* Audio Wave Visualizer */}
            <div className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col items-center">
              <Visualizer isPlaying={isPlaying} isPaused={isPaused} />
              
              {/* Progress Scrubber Bar */}
              <div className="w-full mt-2">
                <ProgressBar
                  progressMs={playerState?.progressMs || 0}
                  durationMs={playerState?.currentTrack?.durationMs || 0}
                  durationFormatted={playerState?.currentTrack?.duration || '0:00'}
                  onSeek={seek}
                  disabled={!playerState?.currentTrack}
                />
              </div>
            </div>

            {/* Control Dock */}
            <ControlDock
              isPlaying={isPlaying}
              isPaused={isPaused}
              volume={playerState?.volume ?? 80}
              repeatMode={playerState?.repeatMode ?? 'off'}
              onTogglePause={togglePause}
              onSkip={skip}
              onPrevious={previous}
              onStop={stop}
              onShuffle={shuffle}
              onSetLoop={setLoop}
              onVolumeChange={setVolume}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
              onOpenLyrics={() => setIsLyricsOpen(true)}
              disabled={!playerState?.currentTrack}
            />
          </div>

          {/* Right Column: Upcoming Queue (5 cols) */}
          <div className="lg:col-span-5">
            <QueueList
              queue={playerState?.queue || []}
              onRemoveTrack={removeQueueItem}
              onClearQueue={clearQueue}
              onMoveTrack={moveTrack}
              onPlayDirect={(url) => play(url)}
            />
          </div>
        </div>
      </main>

      {/* Floating Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onPlay={play}
      />

      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        activeFilters={playerState?.activeFilters || []}
        onToggleFilter={toggleFilter}
      />

      <LyricsDrawer
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        guildId={selectedGuildId}
        trackTitle={playerState?.currentTrack?.title || null}
      />
    </div>
  );
};
