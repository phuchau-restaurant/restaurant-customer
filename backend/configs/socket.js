import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Cho phép mọi origin kết nối (hoặc set cụ thể http://localhost:5173)
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // Join room theo bàn (nếu client gửi event join)
    socket.on("join_table", (tableId) => {
        socket.join(`table_${tableId}`);
        console.log(`Socket ${socket.id} joined table_${tableId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
