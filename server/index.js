const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:4200' }
});

const ALL_EMOJIS = Object.keys(require('unicode-emoji-json'));

function pickEmojis() {
  const shuffled = [...ALL_EMOJIS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

// roomCode → { players: [{ id, choice }], state }
const rooms = new Map();

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function uniqueCode() {
  let code;
  do { code = generateCode(); } while (rooms.has(code));
  return code;
}

io.on('connection', (socket) => {
  socket.on('create-room', () => {
    const code = uniqueCode();
    rooms.set(code, {
      players: [{ id: socket.id, choice: null }],
      state: 'waiting',
      streak: 0,
    });
    socket.join(code);
    socket.emit('room-created', { roomCode: code });
  });

  socket.on('join-room', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('room-error', { message: 'Room not found.' });
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('room-error', { message: 'Room is full.' });
      return;
    }
    room.players.push({ id: socket.id, choice: null });
    room.state = 'playing';
    socket.join(roomCode);
    socket.emit('room-joined', { roomCode });
    io.to(roomCode).emit('game-ready', { emojis: pickEmojis() });
  });

  socket.on('pick-emoji', ({ roomCode, emoji }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || player.choice) return;

    player.choice = emoji;
    socket.to(roomCode).emit('opponent-picked');

    const [p1, p2] = room.players;
    if (p1.choice && p2.choice) {
      const match = p1.choice === p2.choice;
      room.streak = match ? room.streak + 1 : 0;
      const streak = room.streak;
      io.to(p1.id).emit('game-result', { myChoice: p1.choice, opponentChoice: p2.choice, match, streak });
      io.to(p2.id).emit('game-result', { myChoice: p2.choice, opponentChoice: p1.choice, match, streak });
    }
  });

  socket.on('play-again', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.players.forEach((p) => (p.choice = null));
    io.to(roomCode).emit('game-reset', { emojis: pickEmojis() });
  });

  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      if (room.players.some((p) => p.id === socket.id)) {
        socket.to(code).emit('opponent-left');
        rooms.delete(code);
        break;
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
