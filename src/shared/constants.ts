export const AVAILABLE_FILTERS = [
  { id: 'bassboost', name: 'Bass Boost', description: 'Deep low-end punch' },
  { id: 'nightcore', name: 'Nightcore', description: 'Faster tempo and higher pitch' },
  { id: 'vaporwave', name: 'Vaporwave', description: 'Slowed down nostalgic aesthetic' },
  { id: '8D', name: '8D Audio', description: 'Pans audio around your ears in 360°' },
  { id: 'treble', name: 'Treble Boost', description: 'Crisp high frequencies and vocals' },
  { id: 'normalizer', name: 'Normalizer', description: 'Equalize track volume spikes' },
] as const;

export const DEFAULT_VOLUME = 80;
