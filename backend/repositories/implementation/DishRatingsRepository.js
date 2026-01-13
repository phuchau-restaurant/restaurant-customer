// backend/repositories/implementation/DishRatingsRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { DishRating } from "../../models/DishRating.js";
import { supabase } from "../../configs/database.js";

export class DishRatingsRepository extends BaseRepository {
  constructor() {
    super("dish_ratings", "id");
  }

  async create(data) {
    const entity = new DishRating(data);
    const dbPayload = entity.toPersistence();
    
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const rawData = await super.create(dbPayload);
    return rawData ? new DishRating(rawData) : null;
  }

  async getById(id) {
    const rawData = await super.getById(id);
    return rawData ? new DishRating(rawData) : null;
  }

  async update(id, updates) {
    const entity = new DishRating(updates);
    const dbPayload = entity.toPersistence();
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const rawData = await super.update(id, dbPayload);
    return rawData ? new DishRating(rawData) : null;
  }

  /**
   * Get rating by dish ID
   */
  async getByDishId(dishId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("dish_id", dishId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`[DishRatings] GetByDishId failed: ${error.message}`);
    }
    return data ? new DishRating(data) : null;
  }

  /**
   * Upsert (insert or update) rating for a dish
   */
  async upsert(data) {
    const entity = new DishRating(data);
    const dbPayload = entity.toPersistence();
    
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const { data: result, error } = await supabase
      .from(this.tableName)
      .upsert(dbPayload, {
        onConflict: 'dish_id',
        returning: true
      })
      .select()
      .single();

    if (error) throw new Error(`[DishRatings] Upsert failed: ${error.message}`);
    return result ? new DishRating(result) : null;
  }

  /**
   * Get ratings for multiple dishes
   */
  async getByDishIds(dishIds) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .in("dish_id", dishIds);

    if (error) throw new Error(`[DishRatings] GetByDishIds failed: ${error.message}`);
    return data.map(item => new DishRating(item));
  }
}
