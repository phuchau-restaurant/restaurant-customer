// backend/repositories/implementation/ReviewsRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { Review } from "../../models/Review.js";
import { supabase } from "../../configs/database.js";

export class ReviewsRepository extends BaseRepository {
  constructor() {
    super("reviews", "id");
  }

  async create(data) {
    const entity = new Review(data);
    const dbPayload = entity.toPersistence();
    
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const rawData = await super.create(dbPayload);
    return rawData ? new Review(rawData) : null;
  }

  async getById(id) {
    const rawData = await super.getById(id);
    return rawData ? new Review(rawData) : null;
  }

  async update(id, updates) {
    const entity = new Review(updates);
    const dbPayload = entity.toPersistence();
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const rawData = await super.update(id, dbPayload);
    return rawData ? new Review(rawData) : null;
  }

  async delete(id) {
    const rawData = await super.delete(id);
    return rawData ? new Review(rawData) : null;
  }

  /**
   * Get all reviews for a specific dish
   */
  async getByDishId(dishId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("dish_id", dishId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[Reviews] GetByDishId failed: ${error.message}`);
    return data.map(item => new Review(item));
  }

  /**
   * Get all reviews by a customer
   */
  async getByCustomerId(customerId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[Reviews] GetByCustomerId failed: ${error.message}`);
    return data.map(item => new Review(item));
  }

  /**
   * Check if customer already reviewed a dish
   */
  async findByCustomerAndDish(customerId, dishId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("customer_id", customerId)
      .eq("dish_id", dishId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw new Error(`[Reviews] FindByCustomerAndDish failed: ${error.message}`);
    }
    return data ? new Review(data) : null;
  }

  /**
   * Check if customer ordered this dish
   */
  async hasCustomerOrderedDish(customerId, dishId) {
    const { data, error } = await supabase
      .from("order_details")
      .select(`
        id,
        orders!inner(customer_id, status)
      `)
      .eq("dish_id", dishId)
      .eq("orders.customer_id", customerId)
      .in("orders.status", ["Completed", "Served"])
      .limit(1);

    if (error) throw new Error(`[Reviews] HasCustomerOrderedDish failed: ${error.message}`);
    return data && data.length > 0;
  }
}
