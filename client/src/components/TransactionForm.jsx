import { useState } from 'react';

const categories = [
  'Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan',
  'Kesehatan', 'Pendidikan', 'Gaji', 'Freelance', 'Lainnya',
];

export default function TransactionForm({ onSubmit, initialData, onCancel }) {
  const [type, setType] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!amount || !category || !date) {
      setError('Amount, kategori, dan tanggal harus diisi');
      return;
    }
    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    });
    if (!initialData) {
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}
      </h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 p-2 rounded-lg ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 p-2 rounded-lg ${type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Pemasukan
        </button>
      </div>
      <input
        type="number"
        step="0.01"
        placeholder="Jumlah (Rp)"
        className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <select
        className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      >
        <option value="">Pilih Kategori</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Deskripsi (opsional)"
        className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="date"
        className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
        >
          {initialData ? 'Simpan' : 'Tambah'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 p-3 rounded-lg hover:bg-gray-400">
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
