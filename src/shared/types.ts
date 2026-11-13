export type AudioSource = 'youtube' | 'spotify' | 'soundcloud' | 'apple' | 'other';

export interface RequesterInfo {
  id: string;
  username: string;
  avatar: string;
}

export interface TrackData {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  durationMs: number;
  source: AudioSource;
  requestedBy?: RequesterInfo;
}

export interface GuildPlayerState {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  voiceChannelId: string | null;
  voiceChannelName: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTrack: TrackData | null;
  queue: TrackData[];
  volume: number;
  repeatMode: 'off' | 'track' | 'queue' | 'autoplay';
  progressMs: number;
  activeFilters: string[];
  membersInVoice: number;
}

export interface UserGuild {
  id: string;
  name: string;
  icon: string | null;
  canManage: boolean;
  botPresent: boolean;
  botInVoice: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}

export interface SearchResultItem {
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  source: AudioSource;
}

export interface ServerToClientEvents {
  'player:state': (state: GuildPlayerState) => void;
  'player:trackStart': (track: TrackData) => void;
  'player:trackEnd': (track: TrackData | null) => void;
  'player:queueUpdate': (queue: TrackData[]) => void;
  'player:status': (status: { isPlaying: boolean; isPaused: boolean; volume: number; repeatMode: string }) => void;
  'player:progress': (progressMs: number) => void;
}

export interface ClientToServerEvents {
  'guild:join': (guildId: string) => void;
  'guild:leave': (guildId: string) => void;
}
