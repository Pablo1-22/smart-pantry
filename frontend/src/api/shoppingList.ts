import client from "./client";

export interface ShoppingListItem {
  id: string;
  pantry_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  category: string | null;
  is_bought: boolean;
  source_product_id: string | null;
  created_at: string;
}

export interface ShoppingListItemCreate {
  product_name: string;
  quantity: number;
  unit: string;
  category?: string;
  source_product_id?: string;
}

export async function listShoppingItems(
  pantryId: string
): Promise<ShoppingListItem[]> {
  const { data } = await client.get<ShoppingListItem[]>(
    `/api/pantries/${pantryId}/shopping-list/`
  );
  return data;
}

export async function createShoppingItem(
  pantryId: string,
  payload: ShoppingListItemCreate
): Promise<ShoppingListItem> {
  const { data } = await client.post<ShoppingListItem>(
    `/api/pantries/${pantryId}/shopping-list/`,
    payload
  );
  return data;
}

export async function generateShoppingList(
  pantryId: string
): Promise<ShoppingListItem[]> {
  const { data } = await client.post<ShoppingListItem[]>(
    `/api/pantries/${pantryId}/shopping-list/generate`
  );
  return data;
}

export async function updateShoppingItem(
  pantryId: string,
  itemId: string,
  update: { is_bought?: boolean; quantity?: number }
): Promise<ShoppingListItem> {
  const { data } = await client.put<ShoppingListItem>(
    `/api/pantries/${pantryId}/shopping-list/${itemId}`,
    update
  );
  return data;
}

export async function deleteShoppingItem(
  pantryId: string,
  itemId: string
): Promise<void> {
  await client.delete(`/api/pantries/${pantryId}/shopping-list/${itemId}`);
}
