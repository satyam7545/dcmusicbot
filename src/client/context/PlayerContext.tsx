import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  GuildPlayerState,
  UserGuild,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../../shared/types';
import { useAuth } from './AuthContext';

interface PlayerContextType {
  selectedGuildId: string | null;
  setSelectedGuildId: (id: string | null) => void;
  guilds: UserGuild[];
  playerState: GuildPlayerState | null;
  isLoadingGuilds: boolean;
  refreshGuilds: () => Promise<void>;
  play: (query: string, voiceChannelId?: string) => Promise<boolean>;
  togglePause: () => Promise<void>;
  skip: () => Promise<void>;
  previous: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (timeMs: number) => Promise<void>;
  setVolume: (level: number) => Promise<void>;
  setLoop: (mode: 'off' | 'track' | 'queue' | 'autoplay') => Promise<void>;
  shuffle: () => Promise<void>;
  removeQueueItem: (index: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  moveTrack: (from: number, to: number) => Promise<void>;
  toggleFilter: (filterId: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [guilds, setGuilds] = useState<UserGuild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<GuildPlayerState | null>(null);
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(false);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // 1. Fetch available guilds
  const refreshGuilds = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingGuilds(true);
      const res = await fetch('/api/guilds');
      if (res.ok) {
        const data = await res.json();
        setGuilds(data);
        // Automatically select first guild if none selected
        if (!selectedGuildId && data.length > 0) {
          const defaultGuild = data.find((g: UserGuild) => g.botInVoice) || data[0];
          setSelectedGuildId(defaultGuild.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch guilds:', err);
    } finally {
      setIsLoadingGuilds(false);
    }
  }, [isAuthenticated, selectedGuildId]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshGuilds();
    }
  }, [isAuthenticated, refreshGuilds]);

  // 2. Initialize Socket.IO connection
  useEffect(() => {
    const s = io('/', { path: '/socket.io', autoConnect: true });
    setSocket(s);

    s.on('player:state', (newState) => {
      setPlayerState((prev) => {
        if (!prev || prev.guildId === newState.guildId) {
          return newState;
        }
        return prev;
      });
    });

    s.on('player:progress', (progressMs) => {
      setPlayerState((prev) => (prev ? { ...prev, progressMs } : null));
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // 3. Handle Guild Room Subscriptions
  useEffect(() => {
    if (!socket || !selectedGuildId) return;

    socket.emit('guild:join', selectedGuildId);

    // Initial state fetch for selected guild
    fetch(`/api/guilds/${selectedGuildId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPlayerState(data);
      })
      .catch((err) => console.error('Fetch player state error:', err));

    return () => {
      socket.emit('guild:leave', selectedGuildId);
    };
  }, [socket, selectedGuildId]);

  // 4. Action Handlers
  const play = async (query: string, voiceChannelId?: string): Promise<boolean> => {
    if (!selectedGuildId) return false;
    try {
      const res = await fetch(`/api/guilds/${selectedGuildId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, voiceChannelId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const togglePause = async () => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/pause`, { method: 'POST' });
  };

  const skip = async () => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/skip`, { method: 'POST' });
  };

  const previous = async () => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/previous`, { method: 'POST' });
  };

  const stop = async () => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/stop`, { method: 'POST' });
  };

  const seek = async (timeMs: number) => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/seek`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeMs }),
    });
  };

  const setVolume = async (volume: number) => {
    if (!selectedGuildId) return;
    setPlayerState((prev) => (prev ? { ...prev, volume } : null));
    await fetch(`/api/guilds/${selectedGuildId}/volume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume }),
    });
  };

  const setLoop = async (mode: 'off' | 'track' | 'queue' | 'autoplay') => {
    if (!selectedGuildId) return;
    setPlayerState((prev) => (prev ? { ...prev, repeatMode: mode } : null));
    await fetch(`/api/guilds/${selectedGuildId}/loop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
  };

  const shuffle = async () => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/shuffle`, { method: 'POST' });
  };

  const removeQueueItem = async (index: number) => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/queue/${index}`, { method: 'DELETE' });
  };

  const clearQueue = async () => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/queue/clear`, { method: 'POST' });
  };

  const moveTrack = async (from: number, to: number) => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/queue/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    });
  };

  const toggleFilter = async (filter: string) => {
    if (!selectedGuildId) return;
    await fetch(`/api/guilds/${selectedGuildId}/filters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter }),
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        selectedGuildId,
        setSelectedGuildId,
        guilds,
        playerState,
        isLoadingGuilds,
        refreshGuilds,
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
