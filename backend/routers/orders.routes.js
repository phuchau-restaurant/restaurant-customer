import express from 'express';
import { ordersController } from '../containers/ordersContainer.js';
import { tenantMiddleware } from '../middlewares/tenantMiddleware.js';

const router = express.Router();

// Bắt buộc có TenantID
router.use(tenantMiddleware);

router.get('/', ordersController.getAll);
router.post('/', ordersController.create);
router.get('/active', ordersController.getActiveOrder); // MUST be before /:id to avoid conflict
router.get('/customer/:customerId', ordersController.getByCustomerId); // Get orders by customer ID
router.get('/:id', ordersController.getById);
router.put('/:id', ordersController.update);
router.patch('/:id/items', ordersController.addItemsToOrder); // Add items to existing order
router.delete('/:id', ordersController.delete);

export default router;