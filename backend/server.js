//Nơi khởi động Express App - Customer App

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

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

//Import middlewares
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { requestLogger } from "./middlewares/loggerMiddleware.js";

// Cấu hình môi trường
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") }); // Load from backend/.env

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // QUAN TRỌNG: Để server đọc được JSON từ body request (req.body)
// [LOGGER] Đặt ở đây để ghi lại MỌI request bay vào server
app.use(requestLogger);

// --- ROUTES ---
// API dành cho khách hàng
app.use("/api/categories", categoriesRoutes);
app.use("/api/menus", menusRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/appsettings", appSettingsRoutes);
app.use("/api", modifiersRoutes);
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
  app.listen(PORT, () => {
    console.log(`\n✅ Server đang chạy tại: http://localhost:${PORT}`);
  });
};

startServer();
