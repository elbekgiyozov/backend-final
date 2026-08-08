// Umumiy kichik UI komponentlar

// Lazy yuklanayotgan sahifa uchun fallback (App.jsx dagi Suspense)
export function PageLoader() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="h-8 w-8 text-indigo-600" />
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

const LEVEL_STYLE = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  advanced: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const LEVEL_LABEL = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Yuqori",
};

export function LevelBadge({ level }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        LEVEL_STYLE[level] || LEVEL_STYLE.beginner
      }`}
    >
      {LEVEL_LABEL[level] || level}
    </span>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
      {children}
    </div>
  );
}

export function Field({ error, ...props }) {
  return (
    <div>
      <input
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-500/40 dark:bg-gray-800 dark:text-white ${
          error
            ? "border-rose-400 focus:border-rose-500"
            : "border-gray-300 focus:border-indigo-500 dark:border-gray-700"
        }`}
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
