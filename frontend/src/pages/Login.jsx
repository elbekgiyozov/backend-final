import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import AuthLayout from "../components/AuthLayout";
import { Alert, Field, Spinner } from "../components/ui";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const setError = useAuthStore((s) => s.setError);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErr, setFieldErr] = useState({});

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email formati noto'g'ri";
    if (form.password.length < 6) e.password = "Parol kamida 6 ta belgi";
    setFieldErr(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError("");
    if (!validate()) return;
    const ok = await login(form.email, form.password);
    if (ok) navigate("/");
  };

  return (
    <AuthLayout
      title="Xush kelibsiz"
      subtitle="Davom etish uchun hisobingizga kiring"
      footer={
        <>
          Hisobingiz yo'qmi?{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Ro'yxatdan o'tish
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <Field
          type="email"
          placeholder="Email"
          value={form.email}
          error={fieldErr.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Field
          type="password"
          placeholder="Parol"
          value={form.password}
          error={fieldErr.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading && <Spinner />}
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>
    </AuthLayout>
  );
}
