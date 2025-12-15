// backend/routers/admin.routes.js
import express from 'express';
import { tablesController } from '../containers/tablesContainer.js';
import { tenantMiddleware } from '../middlewares/tenantMiddleware.js';

const router = express.Router();

router.use(tenantMiddleware);


// --- TABLES ROUTES ---
// GET All (Filter by location, status)
router.get('/tables', tablesController.getAll);

// GET by id
router.get('/tables/:id', tablesController.getById);

// POST Create
router.post('/tables', tablesController.create);

// PUT Update (Full update or partial)
router.put('/tables/:id', tablesController.update);

// PATCH Status (only)
router.patch('/tables/:id/status', tablesController.updateStatus);

export default router;