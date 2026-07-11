import { useState, useEffect, useCallback } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import * as txns from '../api/transactions';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ExpenseChart from './ExpenseChart';
import ExportButton from './ExportButton';
import Navbar from './Navbar';
import Toast, { useToast } from './Toast';
import useTheme from '../hooks/useTheme';

const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Gaji', 'Freelance', 'Lainnya'];

function DailyTrend({ transactions }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const dayData = days.map((d) => {
    const dayTxns = transactions.filter((t) => {
      const day = parseInt(t.date?.split('-')[2], 10);
      return day === d;
    });
    const income = dayTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { day: String(d), income, expense, max: Math.max(income, expense, 1) };
  });
  const maxVal = Math.max(...dayData.map((d) => d.max), 1);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Tren Harian (Bulan Ini)</h3>
      <div className="flex items-end gap-[2px] h-20 sm:h-24 overflow-x-auto pb-1">
        {dayData.slice(0, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()).map((d) => (
          <div key={d.day} className="flex flex-col items-center gap-[1px] min-w-[8px] flex-1">
            <div className="w-full flex flex-col items-center" style={{ height: '100%' }}>
              <div
                className="w-full bg-green-400 dark:bg-green-500 rounded-t"
                style={{ height: `${(d.income / maxVal) * 100}%`, minHeight: d.income > 0 ? 2 : 0 }}
              />
              <div
                className="w-full bg-red-400 dark:bg-red-500 rounded-b"
                style={{ height: `${(d.expense / maxVal) * 100}%`, minHeight: d.expense > 0 ? 2 : 0 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-400" /> Pemasukan</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> Pengeluaran</span>
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [dark, setDark] = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user.displayName || '');
  const perPage = 10;

  const { toast, show: showToast, setToast } = useToast();

  const [filter, setFilter] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });

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

  useEffect(() => { loadData(); }, [loadData]);

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

  const handleSaveName = async () => {
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      setEditingName(false);
      showToast('Nama berhasil diubah', 'success');
    } catch {
      showToast('Gagal mengubah nama', 'error');
    }
  };

  const filtered = catFilter ? data.filter((t) => t.category === catFilter) : data;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [catFilter]);

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

  const topCategory = summary?.categories?.length
    ? [...summary.categories].sort((a, b) => b.total - a.total)[0]
    : null;

  const expenseTotal = summary?.totalExpense || 0;

  return (
    <div className={`min-h-screen ${dark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
        <Navbar dark={dark} onToggleTheme={() => setDark(!dark)}>
          {editingName ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveName(); }} className="flex gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs p-1 border rounded w-20 sm:w-32 dark:bg-gray-700 dark:text-white"
                required
              />
              <button type="submit" className="text-xs text-blue-600 hover:underline">Simpan</button>
              <button type="button" onClick={() => setEditingName(false)} className="text-xs text-gray-500 hover:underline">Batal</button>
            </form>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-xs sm:text-sm text-white/80 hover:text-white truncate max-w-[120px] sm:max-w-none"
            >
              {user.displayName || user.email}
            </button>
          )}
          <button onClick={() => signOut(auth)} className="text-xs sm:text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg shrink-0 transition">
            Keluar
          </button>
        </Navbar>
      </div>

      <div className="max-w-5xl mx-auto p-3 sm:p-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <ExpenseChart categories={summary?.categories} />
              <DailyTrend transactions={data} />
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
                        <div
                          className={`h-2 rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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
            {editing && (
              <TransactionForm onSubmit={handleUpdate} initialData={editing} onCancel={() => setEditing(null)} />
            )}

            {filtered.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {catFilter ? `Belum ada transaksi kategori ${catFilter}` : 'Belum ada transaksi'}
              </p>
            ) : (
              <>
                <TransactionList transactions={paged} onEdit={setEditing} onDelete={handleDelete} />
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-sm dark:text-white">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6 pb-4">
        &copy; {new Date().getFullYear()} Rifan Eko Candra Maulana
      </p>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
