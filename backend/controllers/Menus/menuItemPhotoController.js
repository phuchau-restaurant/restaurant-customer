// backend/controllers/Menus/menuItemPhotoController.js

class MenuItemPhotoController {
  constructor(menuItemPhotoService) {
    this.menuItemPhotoService = menuItemPhotoService;
  }

  // [GET] /api/items/photos/primary?dishId=123
  getPrimary = async (req, res) => {
    try {
      const { dishId } = req.query;

      const photo = await this.menuItemPhotoService.getPrimaryPhoto(dishId);

      if (!photo) {
          return res.status(404).json({ 
              success: false, 
              message: "No primary photo found for this dish" 
          });
      }

      return res.status(200).json({
        success: true,
        data: photo.toResponse()
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  // [GET] /api/items/photos?dishId=123
  getByDishId = async (req, res) => {
    try {
      const { dishId } = req.query;
      const photos = await this.menuItemPhotoService.getPhotosByDishId(dishId);

      return res.status(200).json({
        success: true,
        data: photos.map(p => p.toResponse())
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
  }
}

export default MenuItemPhotoController;
