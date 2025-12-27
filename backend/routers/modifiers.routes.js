// backend/routers/modifiers.routes.js
import express from "express";
import { modifierGroupsController } from "../containers/modifierGroupsContainer.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

// Bắt buộc có TenantID cho mọi route
router.use(tenantMiddleware);

// ==================== MODIFIER GROUPS ROUTES (READ-ONLY) ====================

// [GET] /api/modifier-groups - Lấy danh sách modifier groups
router.get("/modifier-groups", modifierGroupsController.getAll);

// [GET] /api/modifier-groups/:id - Lấy chi tiết modifier group
router.get("/modifier-groups/:id", modifierGroupsController.getById);

// ==================== MODIFIER OPTIONS ROUTES (READ-ONLY) ====================

// [GET] /api/modifier-options/:id - Lấy chi tiết modifier option
router.get("/modifier-options/:id", modifierGroupsController.getOptionById);

export default router;
