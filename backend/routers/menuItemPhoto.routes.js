// backend/routers/menuItemPhoto.routes.js
import express from 'express';
import { menuItemPhotoController } from '../containers/menuItemPhotoContainer.js';

const router = express.Router();

// [GET] /api/items/photos/primary?dishId=123
router.get('/photos/primary', menuItemPhotoController.getPrimary);

// [GET] /api/items/photos?dishId=123
router.get('/photos', menuItemPhotoController.getByDishId);

export default router;
