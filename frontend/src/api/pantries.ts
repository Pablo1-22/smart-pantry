import client from "./client";

export interface Pantry {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export async function listPantries(): Promise<Pantry[]> {
  const { data } = await client.get<Pantry[]>("/api/pantries/");
  return data;
}

export async function createPantry(name: string): Promise<Pantry> {
  const { data } = await client.post<Pantry>("/api/pantries/", { name });
  return data;
}

export async function deletePantry(pantryId: string): Promise<void> {
  await client.delete(`/api/pantries/${pantryId}`);
}
