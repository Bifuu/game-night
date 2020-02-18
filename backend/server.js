const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const olg = require('./OneLeftGame');
// const axios = require('axios');

const port = process.env.PORT || 4001;
const index = require('./routes/index.js');

const app = express();
app.use(index);
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};

const playersArray = room =>
  Array.from(rooms[room]).map(([username, socket]) => ({
    username,
    leader: socket.leader,
    socketId: socket.socketId,
  }));

io.on('connection', socket => {
  console.log('New client connected', socket.id);
  let loggedIn = false;

  socket.on('chat message', data => {
    console.log(`sending message to room ${socket.room}`);

    socket.to(socket.room).emit('new message', {
      username: socket.username,
      message: data,
    });
  });

  socket.on('login', ({ username, room }) => {
    if (loggedIn) return;
    if (rooms[room] !== undefined && rooms[room].get(username)) return;
    console.log(`${username} is trying to connect to ${room}`);
    socket.username = username;
    socket.room = room;
    if (rooms[room] === undefined) {
      socket.leader = true;
      rooms[room] = new Map();
      rooms[room].set(username, socket);
    } else {
      socket.leader = false;
      rooms[room].set(username, socket);
    }

    socket.join(room);
    loggedIn = true;
    console.log(
      `${username} has hoined room ${socket.room}. ${rooms[room].size} online`
    );
    socket.emit('loggedin', {
      username: socket.username,
      leader: socket.leader,
      players: playersArray(socket.room),
    });

    socket.to(socket.room).emit('player joined', {
      username: socket.username,
      leader: socket.leader,
      players: playersArray(socket.room),
    });
  });

  socket.on('disconnect', () => {
    if (loggedIn) {
      rooms[socket.room].delete(socket.username);

      console.log(
        `${socket.username} has logged out. ${
          rooms[socket.room].size
        } are online`
      );
      socket.to(socket.room).emit('player left', {
        username: socket.username,
        players: playersArray(socket.room),
      });
      socket.leave();
    }
    socket.removeAllListeners('game start');
    console.log('Client disconnected');
  });

  socket.on('olg start', data => {
    console.log('OLG starting....');
    socket.to(socket.room).emit('starting olg');
    olg(io, data);
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
