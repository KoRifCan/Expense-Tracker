import { useState, useEffect, useCallback } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import * as txns from '../api/transactions';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ExpenseChart from './ExpenseChart';
import ExportButton from './ExportButton';
import Toast, { useToast } from './Toast';

const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Gaji', 'Freelance', 'Lainnya'];

export default function Dashboard({ user }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
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
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txnList, summ] = await Promise.all([
        txns.getAll(user.uid, filter),
        txns.getSummary(user.uid, filter),
      ]);
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

  return (
    <div className={`min-h-screen ${dark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <nav className="bg-white dark:bg-gray-800 shadow-md px-4 py-3 flex justify-between items-center gap-2">
        <h1 className="text-lg sm:text-xl font-bold text-blue-600 shrink-0">Catatan Keuangan</h1>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => setDark(!dark)} className="text-lg" title="Toggle dark mode">
            {dark ? '☀️' : '🌙'}
          </button>
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
              className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-none hover:underline"
            >
              {user.displayName || user.email}
            </button>
          )}
          <button onClick={() => signOut(auth)} className="text-xs sm:text-sm text-red-500 hover:underline shrink-0">
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
          <select value={filter.month} onChange={(e) => setFilter({ ...filter, month: e.target.value })} className="p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            {months.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
          <select value={filter.year} onChange={(e) => setFilter({ ...filter, year: e.target.value })} className="p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            {[2024, 2025, 2026, 2027].map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <ExportButton transactions={filtered} />
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              {[1, 2, 3].map((i) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pemasukan</p>
                  <p className="text-base sm:text-xl font-bold text-green-600">{formatMoney(summary.totalIncome)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pengeluaran</p>
                  <p className="text-base sm:text-xl font-bold text-red-600">{formatMoney(summary.totalExpense)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Saldo</p>
                  <p className={`text-base sm:text-xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatMoney(summary.balance)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <ExpenseChart categories={summary?.categories} />
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Budget per Kategori</h3>
                {CATEGORIES.slice(0, 6).map((cat) => {
                  const spent = summary?.categories?.find((c) => c.category === cat)?.total || 0;
                  const budget = 1000000;
                  const pct = Math.min((spent / budget) * 100, 100);
                  return (
                    <div key={cat} className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{cat}</span>
                        <span>{formatMoney(spent)} / {formatMoney(budget)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4 w-full sm:w-auto"
            >
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
