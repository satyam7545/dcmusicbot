import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import {
  Music2,
  ChevronDown,
  Search,
  Sliders,
  LogOut,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenEqualizer: () => void;
  onOpenLyrics: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenEqualizer,
  onOpenLyrics,
}) => {
  const { user, logout } = useAuth();
  const { guilds, selectedGuildId, setSelectedGuildId, playerState } = usePlayer();

  const currentGuild = guilds.find((g) => g.id === selectedGuildId);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-discord to-spotify flex items-center justify-center shadow-lg shadow-spotify/20">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display text-xl tracking-wider font-extrabold bg-gradient-to-r from-white via-slate-200 to-spotify bg-clip-text text-transparent">
              HARMONIX
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE AUDIO ENGINE</span>
            </div>
          </div>
        </div>

        {/* Center: Server Selector & Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-xl justify-center">
          {/* Guild Picker */}
          {guilds.length > 0 && (
            <div className="relative">
              <select
                value={selectedGuildId || ''}
                onChange={(e) => setSelectedGuildId(e.target.value)}
                className="appearance-none bg-surface-subtle hover:bg-surface-card border border-white/10 text-slate-200 text-xs sm:text-sm font-medium rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-spotify/40 cursor-pointer transition-all"
              >
                {guilds.map((g) => (
                  <option key={g.id} value={g.id} className="bg-surface-card text-white">
                    {g.name} {g.botInVoice ? '🔊 (Active)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Quick Search Shortcut */}
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 bg-surface-subtle/80 hover:bg-surface-card text-slate-400 hover:text-slate-200 px-3.5 py-2 rounded-xl border border-white/5 text-xs transition-all group"
          >
            <Search className="w-3.5 h-3.5 text-spotify group-hover:scale-110 transition-transform" />
            <span>Search YouTube or Spotify...</span>
            <kbd className="bg-surface-card px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/10 text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenEqualizer}
            title="Audio Equalizer & Sound FX"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-surface-subtle hover:bg-surface-card border border-white/5 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all hover:border-neon-purple/40"
          >
            <Sliders className="w-4 h-4 text-neon-purple" />
            <span className="hidden md:inline">Equalizer</span>
          </button>

          <button
            onClick={onOpenLyrics}
            title="Lyrics Viewer"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-surface-subtle hover:bg-surface-card border border-white/5 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all hover:border-spotify/40"
          >
            <Radio className="w-4 h-4 text-spotify" />
            <span className="hidden md:inline">Lyrics</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-white/10 object-cover"
              />
              <span className="hidden lg:inline text-xs font-semibold text-slate-200">
                {user.username}
              </span>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
