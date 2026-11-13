import React, { useState, useEffect, useRef } from 'react';
import type { SearchResultItem } from '../../shared/types';
import {
  Search,
  X,
  Play,
  Plus,
  Loader2,
  Youtube,
  Radio,
  Music,
  Link as LinkIcon,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlay: (query: string) => Promise<boolean>;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onPlay,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // If it's a direct URL, don't auto-fetch previews via search
    if (query.startsWith('http://') || query.startsWith('https://')) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search query failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleDirectUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const success = await onPlay(query.trim());
    setIsLoading(false);
    if (success) onClose();
  };

  const handleAddSong = async (url: string) => {
    setAddingUrl(url);
    await onPlay(url);
    setAddingUrl(null);
  };

  const isUrl = query.startsWith('http://') || query.startsWith('https://');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-surface-card border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-spotify absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search song, artist, YouTube URL or Spotify link..."
              className="w-full bg-surface-subtle border border-white/10 rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-spotify/50 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-surface-subtle text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Link detected banner */}
        {isUrl && (
          <form
            onSubmit={handleDirectUrlSubmit}
            className="my-4 p-4 rounded-2xl bg-surface-subtle border border-spotify/30 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-spotify/20 text-spotify">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200">Direct Audio Link Detected</p>
                <p className="text-[11px] text-slate-400 truncate">{query}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-spotify hover:bg-spotify-hover text-black font-bold text-xs rounded-xl shadow-lg shadow-spotify/20 transition-all shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>Play Now</span>
            </button>
          </form>
        )}

        {/* Loading Indicator */}
        {isLoading && !isUrl && (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-spotify" />
            <span className="text-xs">Searching YouTube & Spotify...</span>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && results.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
            {results.map((item, idx) => {
              let SourceIcon = Music;
              if (item.source === 'youtube') SourceIcon = Youtube;
              if (item.source === 'spotify') SourceIcon = Radio;

              const isAdding = addingUrl === item.url;

              return (
                <div
                  key={`${item.url}-${idx}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-subtle/50 hover:bg-surface-subtle border border-white/5 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-card border border-white/10">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Music className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-spotify transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="truncate">{item.author}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{item.duration}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAddSong(item.url)}
                      disabled={isAdding}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-spotify hover:bg-spotify-hover text-black font-semibold text-xs transition-all shadow-md shadow-spotify/20"
                    >
                      {isAdding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state prompt */}
        {!isLoading && results.length === 0 && !isUrl && (
          <div className="py-12 text-center text-slate-500">
            <Search className="w-8 h-8 mx-auto opacity-30 mb-2" />
            <p className="text-xs">Type song name, artist, or paste a URL above</p>
          </div>
        )}
      </div>
    </div>
  );
};
