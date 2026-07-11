export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return <p className="text-gray-500 text-center py-8">Belum ada transaksi</p>;
  }

  const formatDate = (date) => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-3">
      {transactions.map((t) => (
        <div key={t.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
              <span className="text-xs text-gray-500">{t.category}</span>
            </div>
              <p className="font-medium truncate max-w-[160px] sm:max-w-none">{t.description || t.category}</p>
            <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
          </div>
          <div className="text-right">
            <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
            </p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => onEdit(t)} className="text-xs text-blue-600 hover:underline">
                Edit
              </button>
              <button onClick={() => onDelete(t.id)} className="text-xs text-red-600 hover:underline">
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
