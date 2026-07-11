import ThemeToggle from './ThemeToggle';

export default function Navbar({ dark, onToggleTheme, children }) {
  return (
    <nav className="relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-sm sm:text-lg font-bold text-white truncate">Catatan Keuangan</h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        {children}
      </div>
    </nav>
  );
}
