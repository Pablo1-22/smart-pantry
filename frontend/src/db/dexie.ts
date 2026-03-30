import Dexie, { type Table } from "dexie";
import type { Product } from "../api/products";

export type PendingActionType = "create" | "update" | "delete";

export interface PendingAction {
  id?: number; // auto-increment PK
  type: PendingActionType;
  pantryId: string;
  productId: string; // client-side UUID (used as server ID on push)
  payload?: Record<string, unknown>;
  timestamp: string; // ISO-8601
}

class SmartPantryDB extends Dexie {
  products!: Table<Product, string>;
  pending_actions!: Table<PendingAction, number>;

  constructor() {
    super("SmartPantryDB");
    this.version(1).stores({
      // indexed fields (first = primary key)
      products: "id, pantry_id, name, category, updated_at",
      pending_actions: "++id, pantryId, productId, timestamp",
    });
  }
}

export const db = new SmartPantryDB();
