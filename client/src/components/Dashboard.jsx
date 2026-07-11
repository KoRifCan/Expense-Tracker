import { useState, useEffect } from 'react';
import { transactions } from '../api';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

export default function Dashboard({ user, onLogout }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });

  const loadData = async () => {
    const [txns, summ] = await Promise.all([
      transactions.getAll(filter),
      transactions.getSummary(filter),
    ]);
    setData(txns);
    setSummary(summ);
  };

  useEffect(() => { loadData(); }, [filter.month, filter.year]);

  const handleCreate = async (payload) => {
    await transactions.create(payload);
    setShowForm(false);
    loadData();
  };

  const handleUpdate = async (payload) => {
    await transactions.update(editing.id, payload);
    setEditing(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus transaksi ini?')) {
      await transactions.delete(id);
      loadData();
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2024, i).toLocaleDateString('id-ID', { month: 'long' }),
  }));

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Catatan Keuangan</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Halo, {user.name}</span>
          <button onClick={onLogout} className="text-sm text-red-500 hover:underline">
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        <div className="flex gap-4 mb-6">
          <select
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
            className="p-2 border rounded-lg"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
            className="p-2 border rounded-lg"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <p className="text-sm text-gray-500">Pemasukan</p>
              <p className="text-xl font-bold text-green-600">{formatMoney(summary.totalIncome)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <p className="text-sm text-gray-500">Pengeluaran</p>
              <p className="text-xl font-bold text-red-600">{formatMoney(summary.totalExpense)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatMoney(summary.balance)}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4"
        >
          {showForm ? 'Tutup Form' : 'Tambah Transaksi'}
        </button>

        {showForm && <TransactionForm onSubmit={handleCreate} />}
        {editing && (
          <TransactionForm
            onSubmit={handleUpdate}
            initialData={editing}
            onCancel={() => setEditing(null)}
          />
        )}

        <TransactionList
          transactions={data}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
