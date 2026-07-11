import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getAllUsersWithTransactions } from '../api/admin';
import { setUserRole } from '../api/users';
import ThemeToggle from './ThemeToggle';
import Toast, { useToast } from './Toast';
import useTheme from '../hooks/useTheme';

export default function AdminDashboard({ user, userData }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useTheme();
  const { toast, show: showToast, setToast } = useToast();
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersWithTransactions();
      setUsers(data);
    } catch {
      showToast('Gagal memuat data pengguna', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleRole = async (uid, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await setUserRole(uid, newRole);
      showToast(`Role berhasil diubah ke ${newRole}`, 'success');
      loadUsers();
    } catch {
      showToast('Gagal mengubah role', 'error');
    }
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  if (loading) {
    return (
      <div className={`min-h-screen ${dark ? 'bg-gray-900' : 'bg-gray-100'} p-4`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-700" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
        <nav className="relative px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white shrink-0">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
            <span className="text-xs sm:text-sm text-white/80 truncate max-w-[120px] sm:max-w-none">
              {user.displayName || user.email}
            </span>
            <button onClick={() => signOut(auth)} className="text-xs sm:text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition">
              Keluar
            </button>
          </div>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-white">
            Daftar Pengguna ({users.length})
          </h2>
          <button onClick={loadUsers} className="text-xs text-blue-600 hover:underline">
            Refresh
          </button>
        </div>

        {users.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Belum ada pengguna</p>
        )}

        <div className="space-y-3">
          {users.map((u) => {
            const isExpanded = expandedUser === u.uid;
            return (
              <div key={u.uid} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div
                  onClick={() => setExpandedUser(isExpanded ? null : u.uid)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium dark:text-white truncate">{u.name || u.email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role || 'user'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                    <span className="text-green-600 font-medium">{formatMoney(u.totalIncome)}</span>
                    <span className="text-red-600 font-medium">{formatMoney(u.totalExpense)}</span>
                    <span className={`font-medium ${(u.totalIncome - u.totalExpense) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatMoney(u.totalIncome - u.totalExpense)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleRole(u.uid, u.role); }}
                      className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                    >
                      {u.role === 'admin' ? 'Turunkan' : 'Jadikan Admin'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t dark:border-gray-700 px-4 py-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Riwayat Transaksi ({u.transactions.length})
                    </p>
                    {u.transactions.length === 0 ? (
                      <p className="text-xs text-gray-400">Belum ada transaksi</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {u.transactions.map((t) => (
                          <div key={t.id} className="flex justify-between text-xs py-1 border-b dark:border-gray-700 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{t.date}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {t.type === 'income' ? '+' : '-'}
                              </span>
                              <span className="dark:text-gray-300">{t.category}</span>
                            </div>
                            <span className={`font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
