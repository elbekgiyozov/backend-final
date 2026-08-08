import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { Alert, LevelBadge, Spinner } from "../components/ui";

export default function LessonDetail() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ term: "", translation: "", example: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [lessonRes, wordsRes] = await Promise.all([
        api.get(`/lessons/${id}`),
        api.get(`/words?lesson=${id}&limit=50`),
      ]);
      setLesson(lessonRes.data);
      setWords(wordsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const addWord = async (e) => {
    e.preventDefault();
    if (!form.term.trim() || !form.translation.trim()) return;
    setSaving(true);
    try {
      await api.post("/words", { ...form, lesson: id });
      setForm({ term: "", translation: "", example: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "So'z qo'shishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const removeWord = async (wid) => {
    try {
      await api.delete(`/words/${wid}`);
      setWords((w) => w.filter((x) => x._id !== wid));
    } catch (err) {
      setError(err.response?.data?.message || "O'chirishda xatolik");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

  if (loading)
    return (
      <div className="flex justify-center py-24 text-indigo-600 dark:text-indigo-400">
        <Spinner className="h-8 w-8" />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        ← Darslar
      </Link>

      {lesson && (
        <div className="my-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
            <LevelBadge level={lesson.level} />
          </div>
          <p className="text-gray-500 dark:text-gray-400">{lesson.description || "Tavsif yo'q"}</p>
          <p className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {words.length} ta so'z
          </p>
        </div>
      )}

      <div className="mb-4">
        <Alert>{error}</Alert>
      </div>

      {/* So'z qo'shish */}
      <form
        onSubmit={addWord}
        className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/60 sm:grid-cols-3"
      >
        <input
          placeholder="So'z"
          value={form.term}
          onChange={(e) => setForm({ ...form, term: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Tarjima"
          value={form.translation}
          onChange={(e) => setForm({ ...form, translation: e.target.value })}
          className={inputCls}
        />
        <div className="flex gap-2">
          <input
            placeholder="Misol"
            value={form.example}
            onChange={(e) => setForm({ ...form, example: e.target.value })}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center rounded-xl bg-indigo-600 px-5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <Spinner /> : "+"}
          </button>
        </div>
      </form>

      {words.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
          <p className="mt-2 text-gray-500 dark:text-gray-400">Hali so'z yo'q. Birinchisini qo'shing!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {words.map((w) => (
            <li
              key={w._id}
              className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-indigo-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-500/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{w.term}</span>
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{w.translation}</span>
                </div>
                {w.example && (
                  <p className="mt-0.5 text-xs italic text-gray-400 dark:text-gray-500">“{w.example}”</p>
                )}
              </div>
              <button
                onClick={() => removeWord(w._id)}
                className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                title="O'chirish"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
