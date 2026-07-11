import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';

const COLORS = ['#22c55e', '#16a34a', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#f59e0b', '#14b8a6', '#84cc16', '#10b981'];

export default function IncomeChart({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center text-gray-400 text-sm flex items-center justify-center h-[278px]">
        Belum ada data pemasukan bulan ini
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md chart-no-focus">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Grafik Pemasukan</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={categories}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            labelLine={true}
            label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
          >
            {categories.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
