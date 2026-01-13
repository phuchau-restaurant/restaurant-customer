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
    
    // Remove undefined fields
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);
    
    // Don't send created_at - let database set it automatically
    delete dbPayload.created_at;

    // Remove images field as it doesn't exist in DB
    delete dbPayload.images;

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

    // Remove fields that shouldn't be updated or don't exist
    delete dbPayload.created_at;
    delete dbPayload.images;

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
    // 1. Get reviews
    const { data: reviews, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("dish_id", dishId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[Reviews] GetByDishId failed: ${error.message}`);
    
    if (!reviews || reviews.length === 0) return [];

    // 2. Get customer details manually
    const customerIds = [...new Set(reviews.map(r => r.customer_id))];
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, full_name, avatar")
      .in("id", customerIds);

    if (customersError) {
      console.error("Error fetching customers for reviews:", customersError);
      return reviews.map(item => new Review(item));
    }

    // 3. Map customer details to reviews
    const customerMap = {};
    customers?.forEach(c => customerMap[c.id] = c);

    return reviews.map(item => {
      const customer = customerMap[item.customer_id];
      const reviewWithCustomer = { 
        ...item, 
        customerName: customer?.full_name || `Khách hàng #${item.customer_id}`, 
        customerAvatar: customer?.avatar 
      };
      return new Review(reviewWithCustomer);
    });
  }

  /**
   * Get all reviews by a customer
   */
  async getByCustomerId(customerId) {
    // 1. Get reviews
    const { data: reviews, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[Reviews] GetByCustomerId failed: ${error.message}`);
    
    if (!reviews || reviews.length === 0) return [];

    // 2. Get dish details manually
    const dishIds = [...new Set(reviews.map(r => r.dish_id))];
    const { data: dishes, error: dishesError } = await supabase
      .from("dishes")
      .select("id, name, image_url")
      .in("id", dishIds);

    if (dishesError) {
      console.error("Error fetching dishes for reviews:", dishesError);
      // Return reviews without dish details if fetch fails
      return reviews.map(item => new Review(item));
    }

    // 3. Map dish details to reviews
    const dishMap = {};
    dishes?.forEach(d => dishMap[d.id] = d);

    return reviews.map(item => {
      const dish = dishMap[item.dish_id];
      const reviewWithDish = { 
        ...item, 
        dishName: dish?.name, 
        dishImage: dish?.image_url 
      };
      return new Review(reviewWithDish);
    });
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
      .limit(1);

    if (error) throw new Error(`[Reviews] HasCustomerOrderedDish failed: ${error.message}`);
    return data && data.length > 0;
  }
}
