const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // React client
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("send_message", ({ roomId, text }) => {
    io.to(roomId).emit("receive_message", { text });
  });

  socket.on("button_click", (roomId) => {
    io.to(roomId).emit("button_clicked", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 3001, "0.0.0.0", () => {
  console.log(`Server is running on port ${process.env.PORT || 3001}`);
});
