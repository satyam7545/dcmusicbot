import React from 'react';
import { AVAILABLE_FILTERS } from '../../shared/constants';
import { Sliders, X, Sparkles, Check, Trash2 } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: string[];
  onToggleFilter: (filterId: string) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  activeFilters,
  onToggleFilter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div
        className="w-full max-w-lg bg-surface-card border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neon-purple/20 text-neon-purple">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Audio Equalizer & Sound FX</h3>
              <p className="text-xs text-slate-400">Live hardware-accelerated DSP audio filters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-subtle text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_FILTERS.map((f) => {
            const isActive = activeFilters.includes(f.id);

            return (
              <button
                key={f.id}
                onClick={() => onToggleFilter(f.id)}
                className={`flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'bg-neon-purple/15 border-neon-purple/50 text-white shadow-lg shadow-neon-purple/20'
                    : 'bg-surface-subtle/70 hover:bg-surface-subtle border-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <span>{f.name}</span>
                    {isActive && <Sparkles className="w-3.5 h-3.5 text-neon-purple" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{f.description}</p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    isActive
                      ? 'bg-neon-purple border-neon-purple text-black'
                      : 'border-white/20 bg-surface-card'
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer: Clear All */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'} enabled
          </span>

          {activeFilters.length > 0 && (
            <button
              onClick={() => onToggleFilter('clear')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 text-xs font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
