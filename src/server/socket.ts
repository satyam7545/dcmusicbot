import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ServerToClientEvents, ClientToServerEvents } from '../shared/types';
import { getGuildPlayerState } from '../music/player';

export let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export function initSocket(httpServer: HTTPServer) {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    socket.on('guild:join', (guildId) => {
      socket.join(`guild:${guildId}`);
      // Send immediate state to newly joined socket
      const state = getGuildPlayerState(guildId);
      if (state) {
        socket.emit('player:state', state);
      }
    });

    socket.on('guild:leave', (guildId) => {
      socket.leave(`guild:${guildId}`);
    });
  });

  console.log('[Harmonix Server] Socket.IO real-time gateway initialized');
  return io;
}
