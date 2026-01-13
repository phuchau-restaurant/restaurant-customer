// backend/routers/reviews.routes.js
import express from 'express';
import { reviewsController } from '../containers/reviewsContainer.js';
import { tenantMiddleware } from '../middlewares/tenantMiddleware.js';

const router = express.Router();

// Tenant middleware
router.use(tenantMiddleware);

// Check if customer can review a dish (before creating review)
router.get('/can-review/:dishId', reviewsController.canReview);

// Get reviews by dish
router.get('/dish/:dishId', reviewsController.getByDish);

// Get reviews by customer
router.get('/customer/:customerId', reviewsController.getByCustomer);

// Get single review
router.get('/:id', reviewsController.getById);

// Create review
router.post('/', reviewsController.create);

// Update review
router.put('/:id', reviewsController.update);

// Delete review
router.delete('/:id', reviewsController.delete);

export default router;
