import { useState, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';

const COLORS = ['#22c55e', '#ef4444'];

export default function CombinedChart({ incomeCategories, expenseCategories }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  const handleMouseMove = useCallback((_, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      payload: e.payload,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const totalIncome = (incomeCategories || []).reduce((s, c) => s + c.total, 0);
  const totalExpense = (expenseCategories || []).reduce((s, c) => s + c.total, 0);

  const data = [
    { name: 'Pemasukan', value: totalIncome },
    { name: 'Pengeluaran', value: totalExpense },
  ];

  if (totalIncome === 0 && totalExpense === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center text-gray-400 text-sm flex items-center justify-center h-[278px]">
        Belum ada data untuk grafik gabungan
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md chart-no-focus relative" ref={containerRef}>
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Perbandingan Pemasukan & Pengeluaran</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            labelLine={true}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: tooltip.x, top: tooltip.y - 12, transform: 'translate(-50%, -100%)' }}
        >
          <ChartTooltip
            active={true}
            payload={[{ name: tooltip.payload?.name, value: tooltip.payload?.value, color: tooltip.payload?.color }]}
          />
        </div>
      )}
    </div>
  );
}
