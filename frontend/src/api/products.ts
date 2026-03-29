import client from "./client";

export interface Product {
  id: string;
  pantry_id: string;
  name: string;
  barcode: string | null;
  quantity: number;
  unit: string;
  category: string | null;
  expiry_date: string | null;
  min_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  barcode?: string;
  quantity: number;
  unit: string;
  category?: string;
  expiry_date?: string;
  min_quantity: number;
}

export interface ProductUpdate {
  name?: string;
  barcode?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  expiry_date?: string | null;
  min_quantity?: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
}

export async function listProducts(
  pantryId: string,
  filters?: ProductFilters
): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters?.category) params.category = filters.category;
  if (filters?.search) params.search = filters.search;

  const { data } = await client.get<Product[]>(
    `/api/pantries/${pantryId}/products/`,
    { params }
  );
  return data;
}

export async function createProduct(
  pantryId: string,
  payload: ProductCreate
): Promise<Product> {
  const { data } = await client.post<Product>(
    `/api/pantries/${pantryId}/products/`,
    payload
  );
  return data;
}

export async function updateProduct(
  pantryId: string,
  productId: string,
  payload: ProductUpdate
): Promise<Product> {
  const { data } = await client.put<Product>(
    `/api/pantries/${pantryId}/products/${productId}`,
    payload
  );
  return data;
}

export async function deleteProduct(
  pantryId: string,
  productId: string
): Promise<void> {
  await client.delete(`/api/pantries/${pantryId}/products/${productId}`);
}
