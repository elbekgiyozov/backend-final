import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Token yo'q bo'lsa login sahifasiga yo'naltiradi.
// replace — brauzer tarixida orqaga qaytganda yana bu yerga tushmasin.
export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
