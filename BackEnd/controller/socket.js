import { Server } from 'socket.io';
import Chat from '../database/ChatModel.js';

const socketConnection = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {

    // Join room
    socket.on("joinRoom", ({ roomId, userId }) => {
      socket.join(roomId);
    });

    // Receive message
    socket.on("sendMessage", async (data) => {
      const newMsg = await Chat.create(data);

      // Send message to room
      io.to(data.roomId).emit("receiveMessage", newMsg.toObject());
    });

    // Leave room
    socket.on("leaveRoom", ({ roomId }) => {
      socket.leave(roomId);
    });

    socket.on("disconnect", () => {
    });
  });
};

export default socketConnection;
