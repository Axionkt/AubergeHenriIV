import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { refreshAccessToken } from "../lib/auth";
import { getApiStatus } from "../lib/apiError";
import { keys, queryClient } from "../lib/query";
import { User } from "../types/user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (googleToken: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  registerWithGoogle: (googleToken: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Restores the session on page load. The access token lives 15 minutes but
 * the refresh token 7 days, so a 401 here usually just means the access
 * token expired while the tab was closed: refresh once, then retry. The
 * axios interceptor skips /auth/* routes, so this has to be done here.
 * Throws when there is no valid session (anonymous visitor).
 */
async function restoreSession(): Promise<User> {
  try {
    return (await api.get<User>("/auth/me")).data;
  } catch (err) {
    if (getApiStatus(err) !== 401) throw err;
    await refreshAccessToken();
    return (await api.get<User>("/auth/me")).data;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const res = await api.post<User>("/auth/login", { email, password });
      qc.invalidateQueries({ queryKey: keys.apartments() });
      qc.invalidateQueries({ queryKey: keys.proSpaces() });
      setUser(res.data);
      return res.data;
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ): Promise<void> => {
      await api.post<User>("/auth/register", {
        email,
        password,
        firstName,
        lastName,
      });
      return;
    },
    [],
  );

  const loginWithGoogle = useCallback(
    async (googleToken: string): Promise<User> => {
      const res = await api.post<User>("/auth/google/login", { googleToken });
      qc.invalidateQueries({ queryKey: keys.apartments() });
      qc.invalidateQueries({ queryKey: keys.proSpaces() });
      setUser(res.data);
      return res.data;
    },
    [],
  );

  const registerWithGoogle = useCallback(
    async (googleToken: string): Promise<User> => {
      const res = await api.post<User>("/auth/google/register", {
        googleToken,
      });
      qc.invalidateQueries({ queryKey: keys.apartments() });
      qc.invalidateQueries({ queryKey: keys.proSpaces() });
      setUser(res.data);
      return res.data;
    },
    [],
  );

  const logout = useCallback(() => {
    api.post("/auth/logout").finally(() => {
      setUser(null);
      queryClient.clear();
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuth: !!user,
        isAdmin: user?.isAdmin || false,
        login,
        loginWithGoogle,
        register,
        registerWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
