import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Music2,
  Sparkles,
  Radio,
  Youtube,
  Zap,
  Sliders,
  ShieldCheck,
  Disc3,
  ExternalLink,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { loginWithDiscord, devLogin, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Background radial spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-spotify/15 via-discord/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-discord to-spotify flex items-center justify-center shadow-lg shadow-spotify/20">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-spotify bg-clip-text text-transparent">
            HARMONIX
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={devLogin}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-subtle hover:bg-surface-card border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            Explore Demo Mode
          </button>
          <button
            onClick={loginWithDiscord}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-discord hover:bg-discord-hover text-white shadow-lg shadow-discord/30 hover:scale-105 transition-all"
          >
            <DiscordIcon className="w-4 h-4 fill-current" />
            <span>Login with Discord</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-subtle/80 border border-white/10 text-xs font-medium text-slate-300 mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-spotify animate-pulse" />
          <span>Next-Generation Discord Music Experience</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          Lossless Music for Discord.{' '}
          <span className="bg-gradient-to-r from-spotify via-emerald-400 to-neon-cyan bg-clip-text text-transparent">
            Controlled from the Web.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mt-6 leading-relaxed">
          High-bitrate audio streaming from YouTube & Spotify straight to your voice channels.
          Featuring a real-time web dashboard, synchronized scrubbers, drag-and-drop queues, and hardware-accelerated 3D audio filters.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
          <button
            onClick={loginWithDiscord}
            disabled={isLoading}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-spotify to-emerald-400 hover:from-spotify-hover hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-spotify/25 hover:scale-105 active:scale-95 transition-all"
          >
            <DiscordIcon className="w-5 h-5 fill-current" />
            <span>Connect with Discord</span>
          </button>

          <button
            onClick={devLogin}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-subtle hover:bg-surface-card border border-white/10 text-white font-semibold text-sm transition-all hover:border-spotify/40"
          >
            <Disc3 className="w-4 h-4 text-spotify" />
            <span>Open Interactive Dashboard</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 w-full text-left">
          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <Youtube className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">YouTube & Spotify</h3>
            <p className="text-xs text-slate-400 mt-1">
              Paste track links, playlist URLs, or search directly from your web dashboard.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-spotify/10 text-spotify flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Real-Time WebSync</h3>
            <p className="text-xs text-slate-400 mt-1">
              Instant bi-directional state reflection via WebSockets between Discord and browser.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 text-neon-purple flex items-center justify-center mb-3">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Equalizer & DSP FX</h3>
            <p className="text-xs text-slate-400 mt-1">
              Toggle 8D Audio, Nightcore, Bass Boost, and Vaporwave on the fly.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-discord/10 text-discord flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Interactive Embeds</h3>
            <p className="text-xs text-slate-400 mt-1">
              Full control inside Discord text channels with animated buttons and scrubbers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/5 text-center text-xs text-slate-500 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>Harmonix Music System • High-Fidelity Discord Audio</span>
        <div className="flex items-center gap-4">
          <span>Node.js v26</span>
          <span>•</span>
          <span>Discord.js v14</span>
          <span>•</span>
          <span>React 18 & Vite</span>
        </div>
      </footer>
    </div>
  );
};

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
