import React from 'react';
import type { TrackData } from '../../shared/types';
import {
  ListMusic,
  Trash2,
  Play,
  GripVertical,
  Youtube,
  Radio,
  Music,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface QueueListProps {
  queue: TrackData[];
  onRemoveTrack: (index: number) => void;
  onClearQueue: () => void;
  onMoveTrack: (from: number, to: number) => void;
  onPlayDirect: (url: string) => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  queue,
  onRemoveTrack,
  onClearQueue,
  onMoveTrack,
  onPlayDirect,
}) => {
  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/5 flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-surface-subtle text-spotify">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Upcoming Queue</h3>
            <span className="text-xs text-slate-400">
              {queue.length} {queue.length === 1 ? 'song' : 'songs'} queued
            </span>
          </div>
        </div>

        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            title="Clear Queue"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {queue.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 gap-2">
            <Music className="w-8 h-8 opacity-40" />
            <p className="text-xs sm:text-sm">Queue is empty</p>
            <span className="text-[11px] text-slate-600">
              Add music from YouTube or Spotify
            </span>
          </div>
        ) : (
          queue.map((track, idx) => {
            let SourceIcon = Music;
            if (track.source === 'youtube') SourceIcon = Youtube;
            if (track.source === 'spotify') SourceIcon = Radio;

            return (
              <div
                key={`${track.id}-${idx}`}
                className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface-subtle/60 hover:bg-surface-subtle border border-white/5 transition-all"
              >
                {/* Drag / Index */}
                <div className="flex items-center gap-1 text-slate-500 shrink-0">
                  <span className="text-xs font-mono font-medium w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <button
                      onClick={() => idx > 0 && onMoveTrack(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move Up"
                      className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => idx < queue.length - 1 && onMoveTrack(idx, idx + 1)}
                      disabled={idx === queue.length - 1}
                      title="Move Down"
                      className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-card border border-white/10">
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                  <button
                    onClick={() => onPlayDirect(track.url)}
                    title="Play Immediately"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>

                {/* Title & Author */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-spotify transition-colors">
                    {track.title}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="truncate">{track.author}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{track.duration}</span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => onRemoveTrack(idx)}
                  title="Remove from queue"
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
