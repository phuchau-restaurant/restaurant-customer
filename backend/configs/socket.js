import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Cho phép mọi origin kết nối
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // Join room theo bàn (customer app)
    socket.on("join_table", (tableId) => {
        socket.join(`table_${tableId}`);
        console.log(`Socket ${socket.id} joined table_${tableId}`);
    });

    // Join waiter room (staff app)
    socket.on("join_waiter", (waiterId) => {
      socket.join("waiters");
      console.log(`Socket ${socket.id} joined waiters room (Waiter ID: ${waiterId})`);
    });

    // Handle call waiter for payment
    socket.on("call_waiter_payment", (data) => {
      console.log("📞 Payment request received:", data);
      
      // Broadcast to all waiters
      io.to("waiters").emit("payment_request", {
        ...data,
        timestamp: new Date().toISOString(),
        requestId: `PAY-${Date.now()}`,
      });

      console.log("✅ Payment request broadcasted to waiters");
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
