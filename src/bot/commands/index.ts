import * as play from './play';
import * as skip from './skip';
import * as pause from './pause';
import * as resume from './resume';
import * as stop from './stop';
import * as queue from './queue';
import * as volume from './volume';
import * as loop from './loop';
import * as shuffle from './shuffle';
import * as filters from './filters';
import * as lyrics from './lyrics';
import * as nowplaying from './nowplaying';
import * as dashboard from './dashboard';

export const commands = [
  play,
  skip,
  pause,
  resume,
  stop,
  queue,
  volume,
  loop,
  shuffle,
  filters,
  lyrics,
  nowplaying,
  dashboard,
];

export const commandMap = new Map<string, any>(
  commands.map((cmd) => [cmd.data.name, cmd])
);
