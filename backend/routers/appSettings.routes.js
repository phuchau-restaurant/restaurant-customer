// backend/routers/appSettings.routes.js

import express from "express";
import { appSettingsController } from "../containers/appSettingsContainer.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

// Áp dụng middleware cho tất cả routes
router.use(tenantMiddleware);

router.get("/", appSettingsController.getAll);
router.get("/:id", appSettingsController.getById);
router.post("/", appSettingsController.create);
router.put("/:id", appSettingsController.update);
router.delete("/:id", appSettingsController.delete);

export default router;
