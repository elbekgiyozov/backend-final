import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lessons from "./pages/Lessons";
import LessonDetail from "./pages/LessonDetail";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-black dark:text-white">
      <Navbar />
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
      </Routes>
    </div>
  );
}
