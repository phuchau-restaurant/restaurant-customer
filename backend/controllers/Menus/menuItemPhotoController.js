class MenuItemPhotoController {
  constructor(menuItemPhotoService) {
    this.menuItemPhotoService = menuItemPhotoService;
  }

  // [GET] /api/admin/menu/items/photos/primary
  getPrimary = async (req, res) => {
    try {
      const { dishId } = req.body; // Lấy từ Body theo yêu cầu

      const photo = await this.menuItemPhotoService.getPrimaryPhoto(dishId);

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: "No primary photo found for this dish",
        });
      }

      return res.status(200).json({
        success: true,
        data: photo,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

  // [GET] /api/admin/menu/items/photos?dishId=123
  getByDishId = async (req, res) => {
    try {
      const { dishId } = req.query; // Lấy từ query parameter
      const photos = await this.menuItemPhotoService.getPhotosByDishId(dishId);

      return res.status(200).json({
        success: true,
        data: photos,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
}

export default MenuItemPhotoController;
