import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { PageLoader } from "./components/ui";

/**
 * LAZY LOADING — sahifalar alohida fayllarga (chunk) ajratiladi va
 * faqat kerak bo'lganda yuklanadi. Natijada birinchi ochilish tezlashadi:
 * foydalanuvchi login sahifasini ochganda admin dashboard kodi yuklanmaydi.
 *
 * lazy() bilan yuklangan komponent <Suspense> ichida bo'lishi SHART —
 * yuklanish davomida fallback ko'rsatiladi.
 */
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Lessons = lazy(() => import("./pages/Lessons"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Lessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/:id"
            element={
              <ProtectedRoute>
                <LessonDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Admin dashboard — faqat role: "admin" bo'lganlar uchun */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}
