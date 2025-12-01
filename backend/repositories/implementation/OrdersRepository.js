// backend/repositories/implementation/OrdersRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { Orders } from "../../models/Orders.js";

export class OrdersRepository extends BaseRepository {
  constructor() {
    super("orders", "id");
  }

  // Override create để trả về Model
  async create(data) {
    const entity = new Orders(data);
    const dbPayload = entity.toPersistence();
    
    // Clean payload
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    // Gọi cha (BaseRepository)
    const rawData = await super.create(dbPayload); 
    return rawData ? new Orders(rawData) : null;
  }

  // Override getById
  async getById(id) {
    const rawData = await super.getById(id);
    return rawData ? new Orders(rawData) : null;
  }
  
  // Override update
  async update(id, updates) {
    const entity = new Orders(updates);
    const dbPayload = entity.toPersistence();
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const rawData = await super.update(id, dbPayload);
    return rawData ? new Orders(rawData) : null;
  }
}