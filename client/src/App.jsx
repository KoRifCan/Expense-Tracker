import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { getUser } from './api/users';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('login');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

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
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
    <div className={`min-h-screen flex items-center justify-center p-4 ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <button onClick={() => { setDark(!dark); localStorage.setItem('theme', dark ? 'light' : 'dark'); }} className="text-2xl">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
          Catatan Keuangan
        </h1>
        {page === 'login' ? (
          <Login onSwitch={() => setPage('register')} />
        ) : (
          <Register onSwitch={() => setPage('login')} />
        )}
      </div>
    </div>
  );
}
