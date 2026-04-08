import client from "./client";

export interface Pantry {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface PantryMember {
  id: string;
  user_id: string;
  user_email: string;
  role: "owner" | "member";
  joined_at: string;
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

export async function listMembers(pantryId: string): Promise<PantryMember[]> {
  const { data } = await client.get<PantryMember[]>(`/api/pantries/${pantryId}/members`);
  return data;
}

export async function inviteMember(pantryId: string, email: string): Promise<PantryMember> {
  const { data } = await client.post<PantryMember>(`/api/pantries/${pantryId}/invite`, { email });
  return data;
}

export async function removeMember(pantryId: string, userId: string): Promise<void> {
  await client.delete(`/api/pantries/${pantryId}/members/${userId}`);
}
