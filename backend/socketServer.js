const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "https://nayyab10122004.github.io"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-connected", userId);
      console.log(`👤 User ${userId} joined room ${roomId}`);
    });

    socket.on("offer", (data) => {
      socket.to(data.roomId).emit("offer", {
        sdp: data.sdp,
        senderId: data.senderId,
      });
    });

    socket.on("answer", (data) => {
      socket.to(data.roomId).emit("answer", {
        sdp: data.sdp,
        senderId: data.senderId,
      });
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        senderId: data.senderId,
      });
    });

    socket.on("toggle-audio", (data) => {
      socket.to(data.roomId).emit("audio-toggled", {
        userId: data.userId,
        isAudioEnabled: data.isAudioEnabled,
      });
    });

    socket.on("toggle-video", (data) => {
      socket.to(data.roomId).emit("video-toggled", {
        userId: data.userId,
        isVideoEnabled: data.isVideoEnabled,
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit("user-disconnected", socket.id);
        }
      });
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user-disconnected", socket.id);
      console.log(`👤 User ${socket.id} left room ${roomId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};

module.exports = { initializeSocket, getIO };