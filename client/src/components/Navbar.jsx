import ThemeToggle from './ThemeToggle';

export default function Navbar({ dark, onToggleTheme, children }) {
  return (
    <nav className="relative px-4 py-3 flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
          <svg className="w-5 h-5 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-white shrink-0">Catatan Keuangan</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        {children}
      </div>
    </nav>
  );
}
