import { useEffect, useState } from "react";
import api from "../api/axios";
import { Alert, Spinner } from "../components/ui";

const REFRESH_MS = 15000; // real-time yangilanish oralig'i

/**
 * Admin dashboard (TZ 5-bo'lim) — faqat role: "admin" uchun.
 *
 * Ma'lumot ikkita endpointdan keladi:
 *   GET /api/stats       — umumiy ko'rsatkichlar
 *   GET /api/auth/users  — foydalanuvchilar ro'yxati (pagination bilan)
 *
 * Real-time: har 15 soniyada polling. WebSocket'ga nisbatan soddaroq va
 * bu hajmdagi ilova uchun yetarli.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/stats"),
        api.get(`/auth/users?page=${page}&limit=8`),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.data);
      setPagination(usersRes.data.pagination);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // Polling — silent: true, ya'ni yangilanishda spinner ko'rsatilmaydi
    const timer = setInterval(() => load(pagination.page, true), REFRESH_MS);
    // Komponent yopilganda intervalni tozalash SHART, aks holda
    // boshqa sahifaga o'tilgach ham so'rovlar ketaveradi (memory leak).
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Platforma bo'yicha umumiy ko'rsatkichlar.
          </p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {updatedAt && `Yangilandi: ${updatedAt.toLocaleTimeString("uz-UZ")}`}
          {" · har 15 soniyada"}
        </p>
      </header>

      <Alert>{error}</Alert>

      {stats && (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Foydalanuvchilar" value={stats.totals.users} hint={`+${stats.growth.newUsersWeek} / hafta`} />
            <Stat label="Darslar" value={stats.totals.lessons} />
            <Stat label="So'zlar" value={stats.totals.words} />
            <Stat label="Bot obunachilari" value={stats.totals.botUsers} />
            <Stat label="Akkaunt bog'langan" value={stats.totals.botLinked} />
          </div>

          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            <Panel title="Darslar darajasi bo'yicha">
              <LevelBar levels={stats.levels} total={stats.totals.lessons} />
            </Panel>

            <Panel title="Oxirgi darslar">
              {stats.recentLessons.length === 0 ? (
                <Empty>Dars yo'q</Empty>
              ) : (
                <ul className="space-y-2 text-sm">
                  {stats.recentLessons.map((l) => (
                    <li key={l._id} className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{l.title}</span>
                      <span className="shrink-0 text-gray-500 dark:text-gray-400">
                        {l.createdBy?.name || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Foydalanuvchilar">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="pb-2">Ism</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Rol</th>
                    <th className="pb-2">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="py-2 font-medium">{u.name}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => load(p)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                      p === pagination.page
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-gray-400 dark:text-gray-500">{children}</p>;
}

const LEVEL_LABEL = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Yuqori" };
const LEVEL_COLOR = { beginner: "bg-emerald-500", intermediate: "bg-amber-500", advanced: "bg-rose-500" };

function LevelBar({ levels, total }) {
  if (!total) return <Empty>Dars yo'q</Empty>;
  return (
    <div className="space-y-3">
      {Object.entries(levels).map(([key, count]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{LEVEL_LABEL[key]}</span>
            <span className="text-gray-500 dark:text-gray-400">{count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={`h-full rounded-full ${LEVEL_COLOR[key]}`}
              style={{ width: `${total ? (count / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
