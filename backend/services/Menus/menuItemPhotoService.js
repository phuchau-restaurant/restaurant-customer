// backend/services/Menus/menuItemPhotoService.js

class MenuItemPhotoService {
  constructor(menuItemPhotoRepo) {
    this.menuItemPhotoRepo = menuItemPhotoRepo;
  }

  async getPrimaryPhoto(dishId) {
    if(!dishId) throw new Error("Dish ID is required");
    return await this.menuItemPhotoRepo.getPrimaryByDishId(dishId);
  }

  async getPhotosByDishId(dishId) {
    if(!dishId) throw new Error("Dish ID is required");
    return await this.menuItemPhotoRepo.getByDishId(dishId);
  }
}

export default MenuItemPhotoService;
