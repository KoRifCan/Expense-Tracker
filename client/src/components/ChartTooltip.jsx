export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const isPie = payload.length === 1;

  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-3 py-2 rounded-xl shadow-lg whitespace-nowrap">
        {isPie ? (
          <span style={{ color: payload[0].color }}>{payload[0].name}: <strong>Rp{payload[0].value.toLocaleString('id-ID')}</strong></span>
        ) : (
          <>
            <div className="text-gray-400 dark:text-gray-500 text-[10px] mb-1">Hari ke-{label}</div>
            {payload.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span>{p.name}: <strong>Rp{p.value.toLocaleString('id-ID')}</strong></span>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100 -mt-px" />
    </div>
  );
}
