//Nơi khởi động Express App - Customer App

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { initSocket } from "./configs/socket.js";

// Import các routes
import { connectDatabase } from "./configs/database.js";
import categoriesRoutes from "./routers/categories.routes.js";
import menusRoutes from "./routers/menus.routes.js";
import customersRoutes from "./routers/customers.routes.js";
import ordersRoutes from "./routers/orders.routes.js";
import appSettingsRoutes from "./routers/appSettings.routes.js";
import modifiersRoutes from "./routers/modifiers.routes.js";
import menuItemModifierGroupRoutes from "./routers/menuItemModifierGroup.routes.js";
import menuItemPhotoRoutes from "./routers/menuItemPhoto.routes.js";
import tokensRoutes from "./routers/tokens.routes.js";
import uploadRoutes from "./routers/upload.routes.js";
import reviewsRoutes from "./routers/reviews.routes.js";
import dishRatingsRoutes from "./routers/dishRatings.routes.js";
import paymentRoutes from "./routers/payment.routes.js";

//Import middlewares
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { requestLogger } from "./middlewares/loggerMiddleware.js";

// Cấu hình môi trường
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") }); // Load from backend/.env

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Init Socket
initSocket(httpServer);

// --- MIDDLEWARE ---
// Cấu hình CORS chặt chẽ để fix lỗi "credentials mode is include"
app.use(cors({
  origin: "http://localhost:5173", // Chỉ định rõ URL Frontend
  credentials: true,               // Cho phép gửi cookie/token
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"]
}));
app.use(express.json()); // QUAN TRỌNG: Để server đọc được JSON từ body request (req.body)
// [LOGGER] Đặt ở đây để ghi lại MỌI request bay vào server
app.use(requestLogger);

// --- ROUTES ---
// API dành cho khách hàng
// IMPORTANT: More specific routes MUST come before broad routes
app.use("/api/tokens", tokensRoutes); // Must be before "/api" route
app.use("/api/categories", categoriesRoutes);
app.use("/api/menus", menusRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/appsettings", appSettingsRoutes);
app.use("/api/upload", uploadRoutes); // Upload routes
app.use("/api/reviews", reviewsRoutes); // Reviews routes
app.use("/api/dish-ratings", dishRatingsRoutes); // Dish ratings routes
app.use("/api/payment", paymentRoutes); // Payment Routes
app.use("/api", modifiersRoutes); // This catches all /api/* routes
app.use("/api/menu-item-modifier-group", menuItemModifierGroupRoutes);
app.use("/api/items", menuItemPhotoRoutes);
// Route kiểm tra server sống hay chết
app.get("/", (req, res) => {
  res.send("🍽️ Customer App - Server is running...");
});

// --- ERROR HANDLING  ---
// Nếu controller gọi next(error), nó sẽ nhảy thẳng xuống đây
app.use(errorMiddleware);

// --- START SERVER ---
const startServer = async () => {
  // 1. Kiểm tra kết nối DB trước
  await connectDatabase();

  // 2. Chạy server
  httpServer.listen(PORT, () => {
    console.log(`\n✅ Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO initialized`);
  });
};

startServer();
