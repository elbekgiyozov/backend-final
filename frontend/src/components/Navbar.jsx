import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

// Telegram bot havolasi — .env dan olinadi (TZ: bot havolasi saytda ko'rinsin)
const BOT_URL = import.meta.env.VITE_BOT_URL || "https://t.me/backccbot";

export default function Navbar() {
  // Har bir qiymatni alohida tanlaymiz — shunda faqat o'sha o'zgarganda
  // komponent qayta render bo'ladi (Zustand'ning asosiy afzalligi).
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const dark = useThemeStore((s) => s.dark);
  const toggle = useThemeStore((s) => s.toggle);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    }`;

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">
              T
            </span>
            <span className="text-indigo-600 dark:text-indigo-400">Tilim</span>
          </Link>

          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              <NavLink to="/" className={linkCls} end>
                Darslar
              </NavLink>
              <NavLink to="/profile" className={linkCls}>
                Profil
              </NavLink>
              {/* Admin havolasi faqat adminlarga ko'rinadi */}
              {user.role === "admin" && (
                <NavLink to="/admin" className={linkCls}>
                  Admin
                </NavLink>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Telegram bot havolasi */}
          <a
            href={BOT_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 sm:block dark:text-gray-300 dark:hover:bg-gray-800"
            title="Telegram bot"
          >
            Telegram bot
          </a>

          <button
            onClick={toggle}
            className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Mavzuni almashtirish"
            aria-label="Mavzuni almashtirish"
          >
            {/* Quyosh / oy ikonkasi — emoji o'rniga inline SVG */}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {dark ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </>
              ) : (
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8" />
              )}
            </svg>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                title={user.name}
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </Link>
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
