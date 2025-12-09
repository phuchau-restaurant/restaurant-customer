// backend/routers/menus.routes.js
import express from 'express';
import { menusController } from '../containers/menusContainer.js';
import { tenantMiddleware } from '../middlewares/tenantMiddleware.js';

const router = express.Router();

// Bắt buộc phải có Tenant ID cho mọi thao tác menu
router.use(tenantMiddleware);

// Định nghĩa routes
router.get('/', menusController.getAll); // GET api/menus?categoryId=<id>&available=true
router.get('/:id', menusController.getById); //lấy một món ăn theo ID
router.post('/', menusController.create);
router.put('/:id', menusController.update);
//router.delete('/:id', menusController.delete);

export default router;