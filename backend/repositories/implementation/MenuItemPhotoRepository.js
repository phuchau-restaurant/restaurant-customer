// restaurant-staff/backend/repositories/implementation/MenuItemPhotoRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { supabase } from "../../configs/database.js";
import { MenuItemPhoto } from "../../models/MenuItemPhotos.js";

export class MenuItemPhotoRepository extends BaseRepository {
  constructor() {
    super("menu_item_photos", "id");
  }

  async getPrimaryByDishId(dishId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("dish_id", dishId)
      .eq("is_primary", true)
      .single(); // Chỉ lấy 1

    if (error && error.code !== "PGRST116") {
      // 116 là lỗi không tìm thấy
      throw new Error(`[MenuItemPhoto] GetPrimary failed: ${error.message}`);
    }
    return data ? new MenuItemPhoto(data) : null;
  }

  async getByDishId(dishId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("dish_id", dishId);
    if (error) {
      throw new Error(`[MenuItemPhoto] GetByDishId failed: ${error.message}`);
    }
    return data.map((item) => new MenuItemPhoto(item));
  }
}
