import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const persist = (data) => {
    const { token, ...rest } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(rest));
    setUser(rest);
  };

  const login = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persist(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Kirishda xatolik");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      persist(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Ro'yxatdan o'tishda xatolik");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Sahifa yangilanganda token amal qilishini tekshirish
  useEffect(() => {
    if (localStorage.getItem("token")) {
      api.get("/auth/me").catch(() => logout());
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
