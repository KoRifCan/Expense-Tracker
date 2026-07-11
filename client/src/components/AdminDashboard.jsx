import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase/config';
import * as txns from '../api/transactions';
import { getAllUsersWithTransactions, deleteUserAccount, deleteUserTransactions, deleteAllUsersTransactions } from '../api/admin';
import { setUserRole } from '../api/users';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ExpenseChart from './ExpenseChart';
import IncomeChart from './IncomeChart';
import CombinedChart from './CombinedChart';
import ChartTooltip from './ChartTooltip';
import ExportButton from './ExportButton';
import Navbar from './Navbar';
import UserMenu from './UserMenu';
import Toast, { useToast } from './Toast';
import useTheme from '../hooks/useTheme';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Gaji', 'Freelance', 'Lainnya'];

function TrendChart({ transactions, dark }) {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const data = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dayTxns = transactions.filter((t) => {
      const day = parseInt(t.date?.split('-')[2], 10);
      return day === d;
    });
    return {
      day: String(d),
      Pemasukan: dayTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      Pengeluaran: dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  if (data.every((d) => d.Pemasukan === 0 && d.Pengeluaran === 0)) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md chart-no-focus">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Tren Harian (Bulan Ini)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: dark ? '#9ca3af' : '#6b7280' }} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: dark ? '#9ca3af' : '#6b7280' }} />
          <Tooltip content={<ChartTooltip />} offset={8} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: dark ? '#d1d5db' : '#6b7280' }} />
          <Area type="monotone" dataKey="Pemasukan" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminDashboard({ user }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dark, setDark] = useTheme();
  const perPage = 10;

  const [filter, setFilter] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState(null);
  const [confirmDeleteAllTx, setConfirmDeleteAllTx] = useState(false);

  const { toast, show: showToast, setToast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txnList, summ] = await Promise.all([
        txns.getAll(user.uid, filter),
        txns.getSummary(user.uid, filter),
      ]);
      if (!txnList) return;
      setData(txnList);
      setSummary(summ);
    } catch {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.uid, filter.month, filter.year]);

  useEffect(() => { if (tab === 'dashboard') loadData(); }, [loadData, tab]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await getAllUsersWithTransactions();
      setUsers(data);
    } catch {
      showToast('Gagal memuat data pengguna', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { if (tab === 'admin') loadUsers(); }, [tab]);

  const handleCreate = async (payload) => {
    try {
      await txns.create(user.uid, payload);
      setShowForm(false);
      showToast('Transaksi berhasil ditambahkan', 'success');
      loadData();
    } catch {
      showToast('Gagal menambah transaksi', 'error');
    }
  };

  const handleUpdate = async (payload) => {
    try {
      await txns.update(user.uid, editing.id, payload);
      setEditing(null);
      showToast('Transaksi berhasil diubah', 'success');
      loadData();
    } catch {
      showToast('Gagal mengubah transaksi', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await txns.del(user.uid, id);
      showToast('Transaksi berhasil dihapus', 'success');
      loadData();
    } catch {
      showToast('Gagal menghapus transaksi', 'error');
    }
  };

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

  const handleDeleteAccount = async (uid) => {
    try {
      await deleteUserAccount(uid);
      showToast('Akun berhasil dihapus', 'success');
      setConfirmDelete(null);
      loadUsers();
    } catch {
      showToast('Gagal menghapus akun', 'error');
    }
  };

  const handleDeleteUserTx = async (uid) => {
    try {
      await deleteUserTransactions(uid);
      showToast('Riwayat transaksi berhasil dihapus', 'success');
      setConfirmDeleteTx(null);
      loadUsers();
    } catch {
      showToast('Gagal menghapus riwayat transaksi', 'error');
    }
  };

  const handleDeleteAllTx = async () => {
    try {
      await deleteAllUsersTransactions();
      showToast('Semua riwayat transaksi berhasil dihapus', 'success');
      setConfirmDeleteAllTx(false);
      loadUsers();
    } catch {
      showToast('Gagal menghapus semua riwayat', 'error');
    }
  };

  const filteredUsers = users
    .filter((u) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      return sortOrder === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });

  const filtered = data.filter((t) => {
    if (catFilter && t.category !== catFilter) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [catFilter, typeFilter]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2024, i).toLocaleDateString('id-ID', { month: 'long' }),
  }));

  const formatMoney = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  const savingsRate = summary && summary.totalIncome > 0
    ? ((summary.balance / summary.totalIncome) * 100).toFixed(1)
    : 0;

  const daysInMonth = new Date(Number(filter.year), Number(filter.month), 0).getDate();
  const avgDaily = summary && daysInMonth > 0
    ? Math.round(summary.totalExpense / daysInMonth)
    : 0;

  return (
    <div className={`min-h-screen ${dark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
        <Navbar dark={dark} onToggleTheme={() => setDark(!dark)}>
          <UserMenu user={user} onProfileSaved={() => {}} dark={dark} onToggleTheme={() => setDark(!dark)} />
        </Navbar>
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-4">
        <div className="flex gap-1 bg-gray-200 dark:bg-white/20 rounded-2xl p-1 mb-4 w-fit">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              tab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm dark:bg-white dark:text-blue-600' : 'text-gray-600 dark:text-white hover:bg-gray-300/50 dark:hover:bg-white/20'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard Saya
          </button>
          <button
            onClick={() => setTab('admin')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              tab === 'admin' ? 'bg-white text-blue-600 shadow-sm dark:bg-white dark:text-blue-600' : 'text-gray-600 dark:text-white hover:bg-gray-300/50 dark:hover:bg-white/20'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Panel Admin
          </button>
        </div>

        {tab === 'dashboard' ? (
          <>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md h-20" />
                  ))}
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-14" />
                ))}
              </div>
            ) : (
              <>
                {summary && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-md border border-gray-50 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Pemasukan</p>
                            <p className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400 truncate">{formatMoney(summary.totalIncome)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-md border border-gray-50 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Pengeluaran</p>
                            <p className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400 truncate">{formatMoney(summary.totalExpense)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-md border border-gray-50 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${summary.balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <svg className={`w-5 h-5 ${summary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Saldo</p>
                             <p className={`text-sm sm:text-lg font-bold truncate ${summary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatMoney(summary.balance)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-md border border-gray-50 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Rata-rata/Hari</p>
                            <p className={`text-sm sm:text-lg font-bold truncate ${avgDaily > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                              {formatMoney(avgDaily)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
                      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-md">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Transaksi</p>
                        <p className="text-lg sm:text-2xl font-bold dark:text-white">{data.length}</p>
                        <p className="text-[10px] text-gray-400">
                          {summary.totalIncome > 0 ? `${filtered.filter(t => t.type === 'income').length} masuk` : ''}
                          {summary.totalIncome > 0 && summary.totalExpense > 0 ? ' · ' : ''}
                          {summary.totalExpense > 0 ? `${filtered.filter(t => t.type === 'expense').length} keluar` : ''}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-md">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Menabung</p>
                        <p className={`text-lg sm:text-2xl font-bold ${Number(savingsRate) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {savingsRate}%
                        </p>
                        <p className="text-[10px] text-gray-400">dari total pemasukan</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3 mb-4">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-50 dark:border-gray-700 flex flex-wrap items-center gap-2">
                    <select value={filter.month} onChange={(e) => setFilter({ ...filter, month: e.target.value })} className="p-2 border-0 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-400">
                      {months.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                    </select>
                    <select value={filter.year} onChange={(e) => setFilter({ ...filter, year: e.target.value })} className="p-2 border-0 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-400">
                      {[2024, 2025, 2026, 2027].map((y) => (<option key={y} value={y}>{y}</option>))}
                    </select>
                    <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="p-2 border-0 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-400">
                      <option value="">Semua Kategori</option>
                      {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    <ExportButton transactions={filtered} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <IncomeChart categories={summary?.incomeCategories} />
                  <ExpenseChart categories={summary?.categories} />
                </div>

                <div className="mb-4">
                  <CombinedChart incomeCategories={summary?.incomeCategories} expenseCategories={summary?.categories} />
                </div>

                <div className="mb-6">
                  <TrendChart transactions={data} dark={dark} />
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Budget per Kategori</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CATEGORIES.map((cat) => {
                      const spent = summary?.categories?.find((c) => c.category === cat)?.total || 0;
                      const budget = 1000000;
                      const pct = Math.min((spent / budget) * 100, 100);
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span className="truncate">{cat}</span>
                            <span className="shrink-0 ml-2">{formatMoney(spent)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <button onClick={() => setTypeFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!typeFilter ? 'bg-blue-500 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Semua</button>
                  <button onClick={() => setTypeFilter('income')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${typeFilter === 'income' ? 'bg-green-500 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Pemasukan</button>
                  <button onClick={() => setTypeFilter('expense')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${typeFilter === 'expense' ? 'bg-red-500 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Pengeluaran</button>
                </div>

                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 mb-4 w-full sm:w-auto font-medium transition shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className={`w-5 h-5 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {showForm ? 'Tutup Form' : 'Tambah Transaksi'}
                </button>

                {showForm && <TransactionForm onSubmit={handleCreate} />}
                {editing && <TransactionForm onSubmit={handleUpdate} initialData={editing} onCancel={() => setEditing(null)} />}

                {filtered.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {catFilter ? `Belum ada transaksi kategori ${catFilter}` : 'Belum ada transaksi'}
                  </p>
                ) : (
                  <>
                    <TransactionList transactions={paged} onEdit={setEditing} onDelete={handleDelete} />
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600">Prev</button>
                        <span className="px-3 py-1 text-sm dark:text-white">{page} / {totalPages}</span>
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600">Next</button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Panel Admin</h2>
                    <p className="text-blue-100 text-xs sm:text-sm mt-0.5">{users.length} pengguna terdaftar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmDeleteAllTx(true)}
                      className="flex items-center gap-1.5 bg-red-500/30 hover:bg-red-500/50 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus Semua Riwayat
                    </button>
                    <button
                      onClick={loadUsers}
                      className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari pengguna..."
                      className="w-full pl-9 pr-3 py-2 bg-white/20 text-white placeholder-white/50 text-sm rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                    />
                  </div>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm px-3 py-2 rounded-lg transition self-start sm:self-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 h-16 rounded-xl" />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada pengguna ditemukan</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((u) => {
                      const isExpanded = expandedUser === u.uid;
                      return (
                        <div key={u.uid} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl transition hover:shadow-sm overflow-hidden">
                          <div
                            onClick={() => setExpandedUser(isExpanded ? null : u.uid)}
                            className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-0 px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {(u.name || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium dark:text-white truncate">{u.name || 'Tanpa Nama'}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                                    {u.role || 'user'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ml-10 sm:ml-0 mt-0.5 sm:mt-0">
                              <span className="font-semibold text-green-600">+{formatMoney(u.totalIncome)}</span>
                              <span className="font-semibold text-red-600">-{formatMoney(u.totalExpense)}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleRole(u.uid, u.role); }}
                                  className={`text-[11px] px-2 py-1 rounded-lg font-medium transition ${
                                    u.role === 'admin'
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}
                                >
                                  {u.role === 'admin' ? 'Turunkan' : 'Promosi'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(u.uid); }}
                                  className="text-[11px] px-2 py-1 rounded-lg font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition"
                                >
                                  Hapus
                                </button>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-600 px-3 sm:px-4 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Riwayat Transaksi ({u.transactions.length})
                                  </p>
                                </div>
                                {u.transactions.length > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteTx(u.uid); }}
                                    className="text-[10px] px-2 py-1 rounded-lg font-medium bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition"
                                  >
                                    Hapus Riwayat
                                  </button>
                                )}
                              </div>
                              {u.transactions.length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-gray-500 ml-5">Belum ada transaksi</p>
                              ) : (
                                <div className="max-h-60 overflow-y-auto space-y-0.5 ml-5">
                                  {u.transactions.map((t) => (
                                    <div key={t.id} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400 dark:text-gray-500 w-16 shrink-0">{t.date}</span>
                                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                                          t.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                        }`}>
                                          {t.type === 'income' ? '+' : '-'}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-300">{t.category}</span>
                                      </div>
                                      <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
                )}
              </div>
            </div>

            {confirmDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
                  <h3 className="text-base font-semibold dark:text-white mb-2">Hapus Akun</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Semua data pengguna ini akan dihapus permanen. Yakin?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(confirmDelete)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}

            {confirmDeleteTx && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmDeleteTx(null)} />
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
                  <h3 className="text-base font-semibold dark:text-white mb-2">Hapus Riwayat Transaksi</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Semua transaksi pengguna ini akan dihapus permanen. Akun tetap ada. Yakin?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setConfirmDeleteTx(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleDeleteUserTx(confirmDeleteTx)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}

            {confirmDeleteAllTx && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmDeleteAllTx(false)} />
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
                  <h3 className="text-base font-semibold dark:text-white mb-2">Hapus Semua Riwayat</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Semua transaksi semua pengguna akan dihapus permanen. Akun tetap ada. Yakin?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setConfirmDeleteAllTx(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDeleteAllTx}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6 pb-4">
          &copy; {new Date().getFullYear()} Rifan Eko Candra Maulana
        </p>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
