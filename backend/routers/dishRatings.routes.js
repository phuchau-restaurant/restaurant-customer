// backend/routers/dishRatings.routes.js
import express from 'express';
import { dishRatingsController } from '../containers/dishRatingsContainer.js';
import { tenantMiddleware } from '../middlewares/tenantMiddleware.js';

const router = express.Router();

// Tenant middleware
router.use(tenantMiddleware);

// Get ratings for multiple dishes (bulk)
router.post('/bulk', dishRatingsController.getBulk);

// Get rating for a single dish
router.get('/:dishId', dishRatingsController.getByDish);

export default router;
