import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200/70 bg-white/70 backdrop-blur-lg dark:border-gray-800/70 dark:bg-gray-950/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base shadow-md shadow-indigo-500/30">
            📚
          </span>
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
            TilOrgan
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Mavzuni almashtirish"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Chiqish
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Kirish
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
