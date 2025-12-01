import { BaseRepository } from "./BaseRepository.js";
import { supabase } from "../../configs/database.js";
import { OrderDetails } from "../../models/OrderDetails.js";

export class OrderDetailsRepository extends BaseRepository {
  constructor() {
    // Tên bảng trong DB là "order_details"
    super("order_details", "id");
  }

  // Hàm tạo nhiều bản ghi cùng lúc
  async createMany(detailsArray) {
    // 1. Map sang Persistence format
    const dbPayloads = detailsArray.map(item => {
      const entity = new OrderDetails(item);
      const payload = entity.toPersistence();
      // Clean payload
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
      return payload;
    });

    // 2. Insert bulk bằng Supabase
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(dbPayloads)
      .select();

    if (error) throw new Error(`[OrderDetails] CreateMany failed: ${error.message}`);
    
    // 3. Map kết quả về Model
    return data.map(item => new OrderDetails(item));
  }

  async getByOrderId(orderId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("order_id", orderId);

    if (error) throw new Error(`[OrderDetails] GetByOrderId failed: ${error.message}`);
    return data.map(item => new OrderDetails(item));
  }
}