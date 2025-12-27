import express from "express";
import { menuItemPhotoController } from "../containers/menuItemPhotoContainer.js";

const router = express.Router();

// Yêu cầu Body (JSON/Form): { "dishId": 123 }
router.get("/photos/primary", menuItemPhotoController.getPrimary);

//5 Get api/menu/items/photos?dishId = 123
router.get("/photos", menuItemPhotoController.getByDishId);

export default router;
