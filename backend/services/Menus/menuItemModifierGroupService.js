// backend/services/Menus/menuItemModifierGroupService.js
import { MenuItemModifierGroupRepository } from "../../repositories/implementation/MenuItemModifierGroupRepository.js";

class MenuItemModifierGroupService {
  constructor(menuItemModifierGroupRepo) {
    this.repo = menuItemModifierGroupRepo;
  }

  // Thêm liên kết món ăn - modifier group
  async addLink(dishId, groupId) {
    return await this.repo.add(dishId, groupId);
  }

  // Xóa liên kết món ăn - modifier group
  async removeLink(dishId, groupId) {
    return await this.repo.remove(dishId, groupId);
  }

  // Tìm kiếm liên kết cụ thể (theo dishId và groupId)
  async findLink(dishId, groupId) {
    return await this.repo.find(dishId, groupId);
  }

  // Tìm tất cả group liên quan đến dishId
  async findByDishId(dishId) {
    return await this.repo.findByDishId(dishId);
  }

  // Lấy modifiers đầy đủ cho dishId (format cho frontend)
  async getModifiersByDishId(dishId) {
    const rawData = await this.repo.findByDishId(dishId);
    
    // Transform dữ liệu từ Supabase join sang format dễ dùng
    return rawData.map(item => {
      const group = item.modifier_groups;
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        minSelections: group.min_selections,
        maxSelection: group.max_selection,
        isRequired: group.is_required,
        isActive: group.is_active,
        options: (group.modifier_options || []).map(opt => ({
          id: opt.id,
          name: opt.name,
          price: opt.price,
          isDefault: opt.is_default,
          isActive: opt.is_active,
          displayOrder: opt.display_order
        }))
      };
    });
  }
}

export default MenuItemModifierGroupService;
