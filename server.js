// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // You should restrict this in production
    methods: ["GET", "POST"],
  },
});

const users = {}; // roomId => [socketIds]

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    // Track users in the room
    if (!users[roomId]) users[roomId] = [];
    users[roomId].push(socket.id);

    // Send list of existing users to the new user
    const otherUsers = users[roomId].filter((id) => id !== socket.id);
    socket.emit("all-users", otherUsers);

    // Notify others of new user
    socket.to(roomId).emit("user-joined", socket.id);

    // Handle offer, answer, and ICE candidates
    socket.on("offer", (payload) => {
      io.to(payload.target).emit("offer", {
        sdp: payload.sdp,
        caller: socket.id,
      });
    });

    socket.on("answer", (payload) => {
      io.to(payload.target).emit("answer", {
        sdp: payload.sdp,
        caller: socket.id,
      });
    });

    socket.on("ice-candidate", (incoming) => {
      io.to(incoming.target).emit("ice-candidate", {
        candidate: incoming.candidate,
        from: socket.id,
      });
    });

    socket.on("disconnect", () => {
      for (const room in users) {
        users[room] = users[room].filter((id) => id !== socket.id);
        socket.to(room).emit("user-disconnected", socket.id);
      }
    });
    socket.on("chat-message", ({ roomId, message }) => {
      socket.to(roomId).emit("chat-message", { message, sender: socket.id });
    });
  });
});

server.listen(5000, () => console.log("Server listening on port 5000"));
