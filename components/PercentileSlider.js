export default function PercentileSlider({ label, value, raw }) {
  const pct = Math.round(value); // already in 0–100
  const barWidth = 225;

  const getColor = (percentile) => {
    if (percentile >= 80) return 'bg-red-500';
    if (percentile >= 60) return 'bg-red-300';
    if (percentile >= 40) return 'bg-gray-300';
    if (percentile >= 20) return 'bg-blue-300';
    return 'bg-blue-500';
  };

  return (
    <div className="flex items-center mb-4">
      {/* Stat Name */}
      <div className="w-64 text-sm text-right pr-4 font-medium text-gray-700">
        {label}
      </div>

      {/* Percentile Bar */}
      <div className="relative h-5 rounded bg-gray-200" style={{ width: `${barWidth}px` }}>
        {/* Filled Portion */}
        <div
          className={`h-5 rounded ${getColor(pct)}`}
          style={{ width: `${pct}%`, transition: 'width 0.3s ease' }}
        />

        {/* Tick Marks */}
        {[0, 50, 100].map((tick) => (
          <div
            key={tick}
            className="absolute top-0 h-full w-[2px] bg-white opacity-50"
            style={{ left: `${(tick / 100) * barWidth}px` }}
          />
        ))}

        {/* Bubble with Percentile */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
          style={{
            left: `calc(${pct}% - 12px)`,
            backgroundColor:
              pct >= 80
                ? '#ef4444'
                : pct >= 60
                ? '#fca5a5'
                : pct >= 40
                ? '#d1d5db'
                : pct >= 20
                ? '#93c5fd'
                : '#3b82f6',
          }}
        >
          {pct}
        </div>
      </div>

      {/* Raw Value */}
      <div className="ml-4 text-sm text-gray-500">
        {raw !== null && !isNaN(raw) ? Number(raw).toFixed(2) : ''}
      </div>
    </div>
  );
}

