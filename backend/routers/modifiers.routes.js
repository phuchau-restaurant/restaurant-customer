// backend/routers/modifiers.routes.js
import express from "express";
import { modifierGroupsController } from "../containers/modifierGroupsContainer.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

// Bắt buộc có TenantID cho mọi route
router.use(tenantMiddleware);

// ==================== MODIFIER GROUPS ROUTES ====================

// [GET] /api/admin/menu/modifier-groups - Lấy danh sách modifier groups
router.get("/modifier-groups", modifierGroupsController.getAll);
router.get("/modifier-groups/:id", modifierGroupsController.getById);

export default router;
