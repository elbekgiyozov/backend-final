/**
 * store/authStore.js — autentifikatsiya holati (Zustand).
 *
 * ZUSTAND nima? Context API'ga alternativa bo'lgan yengil state-manager.
 * Farqi: Provider bilan o'rash shart emas, va komponent faqat o'zi
 * tanlagan bo'lakni kuzatadi — qolgani o'zgarsa qayta render bo'lmaydi.
 *
 * Ishlatilishi:
 *   const user = useAuthStore((s) => s.user);   // faqat user'ni kuzatadi
 *   const login = useAuthStore((s) => s.login);
 */
import { create } from "zustand";
import api from "../api/axios";

// localStorage'dan boshlang'ich holatni o'qish.
// JSON.parse buzilgan qiymatda xato beradi, shuning uchun try/catch.
const readUser = () => {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: readUser(),
  loading: false,
  error: "",

  setError: (error) => set({ error }),

  // Token va foydalanuvchini saqlash (login/register uchun umumiy)
  persist: (data) => {
    const { token, ...rest } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(rest));
    set({ user: rest });
  },

  login: async (email, password) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      get().persist(data);
      // Login javobida createdAt kabi maydonlar yo'q — to'liq profilni olib kelamiz
      get().checkAuth();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Kirishda xatolik" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      get().persist(data);
      get().checkAuth();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Ro'yxatdan o'tishda xatolik" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Profilni tahrirlash — javobdagi yangi ma'lumot localStorage'ga ham yoziladi.
  // Token o'zgarmaydi (uning ichida faqat ID bor), shuning uchun qayta login shart emas.
  updateProfile: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.put("/auth/me", payload);
      localStorage.setItem("user", JSON.stringify(data));
      set({ user: data });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Saqlashda xatolik" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, error: "" });
  },

  // Sahifa yangilanganda tokenning hali amal qilishini tekshiradi.
  // Token eskirgan bo'lsa — chiqarib yuboramiz.
  checkAuth: async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const { data } = await api.get("/auth/me");
      localStorage.setItem("user", JSON.stringify(data));
      set({ user: data });
    } catch {
      get().logout();
    }
  },
}));
