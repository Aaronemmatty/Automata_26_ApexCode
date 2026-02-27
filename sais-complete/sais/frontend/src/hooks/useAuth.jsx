import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/auth";
import { localAuth } from "../lib/localAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("sais_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Try real backend first
      const { data } = await getMe();
      setUser(data);
    } catch {
      // Fallback to localStorage
      try {
        const { data } = localAuth.me();
        setUser(data);
      } catch {
        localStorage.removeItem("sais_token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const setToken = useCallback(
    async (token) => {
      localStorage.setItem("sais_token", token);
      await fetchUser();
    },
    [fetchUser],
  );

  const logout = useCallback(() => {
    localAuth.logout();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    setToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
