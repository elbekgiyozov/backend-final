import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Alert, LevelBadge, Spinner } from "../components/ui";

const LEVELS = [
  { value: "beginner", label: "Boshlang'ich" },
  { value: "intermediate", label: "O'rta" },
  { value: "advanced", label: "Yuqori" },
];

export default function Lessons() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", level: "beginner" });
  const [saving, setSaving] = useState(false);

  const load = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/lessons?page=${page}&limit=6`);
      setLessons(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.post("/lessons", form);
      setForm({ title: "", description: "", level: "beginner" });
      load(1);
    } catch (err) {
      setError(err.response?.data?.message || "Yaratishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Darsni o'chirasizmi?")) return;
    try {
      await api.delete(`/lessons/${id}`);
      load(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || "O'chirishda xatolik");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Salom, {user?.name}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Darslar to'plamingizni boshqaring va yangi so'zlar o'rganing.
        </p>
      </header>

      {/* Yaratish formasi */}
      <form
        onSubmit={create}
        className="mb-10 rounded-2xl border border-gray-200 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/60"
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <span className="text-indigo-500">+</span> Yangi dars
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Dars nomi"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputCls}
          />
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className={inputCls}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <input
            placeholder="Tavsif (ixtiyoriy)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${inputCls} sm:col-span-2`}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving && <Spinner />}
          {saving ? "Saqlanmoqda..." : "Dars qo'shish"}
        </button>
      </form>

      <div className="mb-4">
        <Alert>{error}</Alert>
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <p className="mt-2 text-gray-500 dark:text-gray-400">Hozircha dars yo'q. Birinchisini qo'shing!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => (
            <div
              key={l._id}
              className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <LevelBadge level={l.level} />
                <button
                  onClick={() => remove(l._id)}
                  className="rounded-lg p-1 text-gray-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                  title="O'chirish"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <Link to={`/lessons/${l._id}`} className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  {l.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {l.description || "Tavsif yo'q"}
                </p>
              </Link>
              <Link
                to={`/lessons/${l._id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
              >
                So'zlarni ko'rish →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => load(p)}
              className={`h-10 w-10 rounded-xl text-sm font-medium transition ${
                p === pagination.page
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
