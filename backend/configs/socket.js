import { Server } from "socket.io";
import webhookService from "../services/webhookService.js";

let io;

export const initSocket = (httpServer) => {
  // Danh sách origins được phép (dev + production)
  const allowedOrigins = [
    "http://localhost:5173", // Development
    process.env.FRONTEND_URL, // Production (Vercel)
    process.env.STAFF_FRONTEND_URL || "http://localhost:5174", // Staff app (optional)
  ].filter(Boolean); // Loại bỏ undefined

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
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
      console.log(
        `Socket ${socket.id} joined waiters room (Waiter ID: ${waiterId})`
      );
    });

    // Handle call waiter for payment
    socket.on("call_waiter_payment", async (data) => {
      console.log("📞 Payment request received:", data);

      const paymentData = {
        ...data,
        timestamp: new Date().toISOString(),
        requestId: `PAY-${Date.now()}`,
      };

      // ❌ KHÔNG cần emit socket local (Staff frontend không connect đến Customer backend)
      // io.to("waiters").emit("payment_request", paymentData);

      // ✅ CHỈ gửi webhook đến Staff Backend
      try {
        await webhookService.notifyPaymentRequest(paymentData);
        console.log("✅ Webhook sent to Staff Backend");
      } catch (err) {
        console.error("❌ Failed to send payment webhook:", err);
      }
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
