export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none"
      style={{ backgroundColor: dark ? '#374151' : '#93c5fd' }}
      title={dark ? 'Mode Terang' : 'Mode Gelap'}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs transition-transform duration-300 ${
          dark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
