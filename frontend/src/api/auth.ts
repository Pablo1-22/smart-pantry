import client from "./client";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<UserResponse> {
  const { data } = await client.post<UserResponse>("/api/auth/register", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<TokenPair> {
  const { data } = await client.post<TokenPair>("/api/auth/login", payload);
  return data;
}
