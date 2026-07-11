export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-400 dark:text-gray-500">Belum ada transaksi</p>
      </div>
    );
  }

  const formatDate = (date) => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-50 dark:border-gray-700 hover:shadow-md transition flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{t.category}</span>
            </div>
            <p className="font-medium text-sm dark:text-white truncate">{t.description || t.category}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(t.date)}</p>
          </div>
          <div className="text-right ml-3 shrink-0">
            <p className={`font-bold text-sm sm:text-base ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
            </p>
            <div className="flex gap-2 mt-1 justify-end">
              <button onClick={() => onEdit(t)} className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition">
                Edit
              </button>
              <button onClick={() => onDelete(t.id)} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition">
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
