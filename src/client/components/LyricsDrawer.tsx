import React, { useState, useEffect } from 'react';
import { FileText, X, Loader2, Music } from 'lucide-react';

interface LyricsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  guildId: string | null;
  trackTitle: string | null;
}

export const LyricsDrawer: React.FC<LyricsDrawerProps> = ({
  isOpen,
  onClose,
  guildId,
  trackTitle,
}) => {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [artist, setArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !guildId) return;

    setIsLoading(true);
    setLyrics(null);

    fetch(`/api/guilds/${guildId}/lyrics`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.lyrics) {
          setLyrics(data.lyrics);
          setArtist(data.artist);
          setSongTitle(data.title);
        } else {
          setLyrics('No lyrics found for this track.');
        }
      })
      .catch(() => {
        setLyrics('Failed to load lyrics.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, guildId, trackTitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-card border-l border-white/10 h-full p-6 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-spotify/20 text-spotify">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Song Lyrics</h3>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                {songTitle || trackTitle || 'Unknown Track'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-subtle text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 pr-2 text-center custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-spotify" />
              <span className="text-xs">Fetching lyrics from Genius...</span>
            </div>
          ) : lyrics ? (
            <div className="space-y-4">
              {artist && (
                <div className="text-xs font-semibold uppercase tracking-wider text-spotify">
                  {artist}
                </div>
              )}
              <pre className="font-sans text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
                {lyrics}
              </pre>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Music className="w-8 h-8 opacity-30" />
              <p className="text-xs">No lyrics found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
