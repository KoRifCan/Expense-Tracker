import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { getUser } from './api/users';
import ThemeToggle from './components/ThemeToggle';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import useTheme from './hooks/useTheme';

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('login');
  const [dark, setDark] = useTheme();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const data = await getUser(u.uid);
        setUserData(data);
      } else {
        setUserData(null);
      }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (userData?.role === 'admin') {
      return <AdminDashboard user={user} userData={userData} />;
    }
    return <UserDashboard user={user} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
      <div className="w-full max-w-md relative">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/70">{dark ? 'Gelap' : 'Terang'}</span>
            <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
          </div>
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Catatan Keuangan</h1>
          <p className="text-white/70 text-sm mt-1">Kelola pemasukan & pengeluaranmu</p>
        </div>
        {page === 'login' ? (
          <Login onSwitch={() => setPage('register')} />
        ) : (
          <Register onSwitch={() => setPage('login')} />
        )}
      </div>
    </div>
  );
}
