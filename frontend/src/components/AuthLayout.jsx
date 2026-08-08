// Login/Register uchun umumiy chiroyli konteyner
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl shadow-lg shadow-indigo-500/30">
            📚
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-xl shadow-gray-200/50 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 dark:shadow-black/30">
          {children}
        </div>
        {footer && <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">{footer}</p>}
      </div>
    </div>
  );
}
