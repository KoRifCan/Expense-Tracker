import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6366f1'];

export default function CombinedChart({ incomeCategories, expenseCategories }) {
  const allCats = [...new Set([
    ...(incomeCategories || []).map((c) => c.category),
    ...(expenseCategories || []).map((c) => c.category),
  ])];

  const data = allCats.map((cat) => ({
    name: cat,
    Pemasukan: (incomeCategories || []).find((c) => c.category === cat)?.total || 0,
    Pengeluaran: (expenseCategories || []).find((c) => c.category === cat)?.total || 0,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center text-gray-400 text-sm flex items-center justify-center h-[278px]">
        Belum ada data untuk grafik gabungan
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Perbandingan Pemasukan & Pengeluaran</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={20}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `Rp${v.toLocaleString('id-ID')}`} />
          <Legend />
          <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
