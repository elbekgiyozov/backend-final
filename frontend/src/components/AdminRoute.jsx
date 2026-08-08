import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * Faqat admin roli uchun. Ikki bosqichli tekshiruv:
 *   - umuman kirmagan bo'lsa   -> /login
 *   - kirgan, lekin admin emas -> bosh sahifa
 *
 * Bu faqat interfeys darajasidagi himoya — haqiqiy nazorat backend'da
 * (adminOnly middleware), chunki brauzerdagi kodni o'zgartirish mumkin.
 */
export default function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
