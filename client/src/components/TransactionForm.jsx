import { useState } from 'react';

const categories = [
  'Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan',
  'Kesehatan', 'Pendidikan', 'Gaji', 'Freelance', 'Lainnya',
];

import ErrorMessage from './ErrorMessage';

export default function TransactionForm({ onSubmit, initialData, onCancel }) {
  const [type, setType] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData ? Number(initialData.amount).toLocaleString('id-ID') : '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') { setAmount(''); return; }
    setAmount(parseInt(raw, 10).toLocaleString('id-ID'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const rawAmount = parseFloat(amount.replace(/\./g, ''));
    if (!amount || !category || !date) {
      setError('Jumlah, kategori, dan tanggal harus diisi');
      return;
    }
    if (isNaN(rawAmount) || rawAmount <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }
    onSubmit({ type, amount: rawAmount, category, description, date });
    if (!initialData) {
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl mb-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-5 dark:text-white flex items-center gap-2">
        <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block" />
        {initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}
      </h3>
      <ErrorMessage message={error} onClose={() => setError('')} />
      <div className="flex gap-3 mb-5">
        <button type="button" onClick={() => setType('expense')}
          className={`flex-1 p-2.5 rounded-xl font-medium text-sm transition ${
            type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}>
          Pengeluaran
        </button>
        <button type="button" onClick={() => setType('income')}
          className={`flex-1 p-2.5 rounded-xl font-medium text-sm transition ${
            type === 'income' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}>
          Pemasukan
        </button>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-3.5 text-gray-400 text-sm">Rp</span>
          <input type="text" inputMode="numeric" placeholder="0"
            className="w-full pl-10 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition"
            value={amount} onChange={handleAmountChange} required />
        </div>
        <select
          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition"
          value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Pilih Kategori</option>
          {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <input type="text" placeholder="Deskripsi (opsional)"
          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition"
          value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="date"
          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition"
          value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="flex gap-3 mt-5">
        <button type="submit"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium transition">
          {initialData ? 'Simpan' : 'Tambah'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
