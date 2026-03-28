import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { jwtDecode } from "./jwtDecode";
import { loginUser, registerUser, type LoginPayload, type RegisterPayload } from "../api/auth";

interface AuthUser {
  id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getUserFromToken(): AuthUser | null {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    return { id: payload.sub };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getUserFromToken());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await loginUser(payload);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    setUser(getUserFromToken());
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
