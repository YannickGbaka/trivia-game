const formatMessage = require("./utils/formatMessage.js");

const {
  addPlayer,
  getAllPlayers,
  getPlayer,
  removePlayer,
} = require("./utils/players.js");

const express = require("express");

const http = require("http");
const socketio = require("socket.io");

const { getAbsolutePathTo } = require("./helper");

const app = express();

const server = http.createServer(app); // create the HTTP server using the Express app created on the previous line
const io = socketio(server); //

const PORT = process.env.PORT || 3000;

const publicDirectoryPath = getAbsolutePathTo("public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("A new player just connected");

  socket.on("join", ({ playerName, room }, callback) => {
    const { error, newPlayer } = addPlayer({ id: socket.id, playerName, room });

    if (error) return callback(error.message);
    callback(); // The callback can be called without data.

    socket.join(newPlayer.room); //join a channel

    socket.emit("message", formatMessage("Admin", "Welcome!"));

    socket.broadcast
      .to(newPlayer.room)
      .emit(
        "message",
        formatMessage("Admin", `${newPlayer.playerName} has joined the game!`)
      );

    io.in(newPlayer.room).emit("room", {
      room: newPlayer.room,
      players: getAllPlayers(newPlayer.room),
    });
  });
  socket.on("disconnect", () => {
    console.log("A player disconnected.");

    const disconnectedPlayer = removePlayer(socket.id);

    if (disconnectedPlayer) {
      const { playerName, room } = disconnectedPlayer;
      io.in(room).emit(
        "message",
        formatMessage("Admin", `${playerName} has left!`)
      );

      io.in(room).emit("room", {
        room,
        players: getAllPlayers(room),
      });
    }
  });
  socket.on("sendMessage", (message, callback) => {
    const { error, player } = getPlayer(socket.id);

    if (error) return callback(error.message);

    if (player) {
      io.to(player.room).emit(
        "message",
        formatMessage(player.playerName, message)
      );
      callback(); // invoke the callback to trigger event acknowledgment
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
