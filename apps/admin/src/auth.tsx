import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ManagerProject {
  id: string;
  name: string;
  slug: string;
}

interface Manager {
  id: string;
  email: string;
  name: string;
  role: "manager" | "super_admin";
  projects?: ManagerProject[];
}

interface AuthCtx {
  manager: Manager | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

const TOKEN_KEY = "ilanhub_admin_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<Manager | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${import.meta.env.VITE_API_URL ?? "/api"}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setManager(d.data))
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? "/api"}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("API недоступний. Запустіть: pnpm dev:api");
      throw new Error("Невірний email або пароль");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setManager(data.manager);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setManager(null);
  };

  return (
    <AuthContext.Provider value={{ manager, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
