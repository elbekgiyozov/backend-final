import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Alert, Field, Spinner } from "../components/ui";

/**
 * Profil sahifasi — ism/email va parolni o'zgartirish (TZ 5-bo'lim).
 * PUT /api/auth/me ga faqat to'ldirilgan maydonlar yuboriladi.
 */
export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const setError = useAuthStore((s) => s.setError);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
  });
  const [fieldErr, setFieldErr] = useState({});
  const [saved, setSaved] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Ism bo'sh bo'lmasin";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email formati noto'g'ri";
    // Parol ixtiyoriy: bo'sh qoldirilsa o'zgarmaydi
    if (form.password && form.password.length < 6) e.password = "Parol kamida 6 ta belgi";
    setFieldErr(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError("");
    setSaved(false);
    if (!validate()) return;

    const payload = { name: form.name.trim(), email: form.email.trim() };
    if (form.password) payload.password = form.password;

    const ok = await updateProfile(payload);
    if (ok) {
      setSaved(true);
      setForm((f) => ({ ...f, password: "" })); // parol maydonini tozalaymiz
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Ma'lumotlaringizni yangilang. Parolni bo'sh qoldirsangiz — o'zgarmaydi.
        </p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <InfoCard label="Rol" value={user?.role === "admin" ? "Admin" : "Foydalanuvchi"} />
        <InfoCard label="Email" value={user?.email} />
        <InfoCard
          label="Ro'yxatdan o'tgan"
          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("uz-UZ") : "—"}
        />
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        noValidate
      >
        <Alert>{error}</Alert>
        {saved && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Saqlandi
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">Ism</label>
          <Field
            placeholder="Ism"
            value={form.name}
            error={fieldErr.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
          <Field
            type="email"
            placeholder="Email"
            value={form.email}
            error={fieldErr.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
            Yangi parol (ixtiyoriy)
          </label>
          <Field
            type="password"
            placeholder="Yangi parol"
            value={form.password}
            error={fieldErr.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading && <Spinner />}
          {loading ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 truncate font-medium">{value || "—"}</p>
    </div>
  );
}
