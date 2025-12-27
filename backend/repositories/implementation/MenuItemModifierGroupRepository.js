// backend/repositories/implementation/MenuItemModifierGroupRepository.js
import { supabase } from "../../configs/database.js";
import { MenuItemModifierGroup } from "../../models/MenuItemModifierGroup.js";

export class MenuItemModifierGroupRepository {
  
  constructor() {
    this.tableName = "menu_item_modifier_groups";
  }

  // Thêm liên kết (cặp dishId, groupId)
  async add(dishId, groupId) {
    const payload = { dish_id: dishId, group_id: groupId };
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([payload])
      .select();
    if (error) throw new Error(error.message);
    return data?.[0] ? new MenuItemModifierGroup(data[0]) : null;
  }

  // Xóa liên kết (cặp dishId, groupId)
  async remove(dishId, groupId) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("dish_id", dishId)
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return true;
  }

  // Tìm kiếm liên kết theo dishId và groupId
  async find(dishId, groupId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select()
      .eq("dish_id", dishId)
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data || []).map((row) => new MenuItemModifierGroup(row));
  }

  // Tìm tất cả group liên quan đến dishId (kèm thông tin chi tiết)
  async findByDishId(dishId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        modifier_groups!inner (
          id,
          name,
          description,
          min_selections,
          max_selection,
          is_required,
          is_active,
          modifier_options (
            id,
            name,
            price,
            is_default,
            is_active,
            display_order
          )
        )
      `)
      .eq("dish_id", dishId)
      .eq("modifier_groups.is_active", true)
      .order("modifier_groups(display_order)", { ascending: true });
    
    if (error) throw new Error(error.message);
    return data || [];
  }
}
