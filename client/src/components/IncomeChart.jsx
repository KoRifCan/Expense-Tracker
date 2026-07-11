import { useState, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';

const COLORS = ['#22c55e', '#16a34a', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#f59e0b', '#14b8a6', '#84cc16', '#10b981'];

export default function IncomeChart({ categories }) {
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

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center text-gray-400 text-sm flex items-center justify-center h-[278px]">
        Belum ada data pemasukan bulan ini
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md chart-no-focus relative" ref={containerRef}>
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
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {categories.map((_, i) => (
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
