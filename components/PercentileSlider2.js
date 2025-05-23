// components/PercentileSlider2.js

export default function PercentileSlider2({ label, ppp, percentiles }) {
  const getColor = (value) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-red-300';
    if (value >= 40) return 'bg-gray-300';
    if (value >= 20) return 'bg-blue-300';
    return 'bg-blue-500';
  };

  const barWidth = 150; // Make narrower if 4 bars in row

  return (
    <div className="flex items-center mb-2">
      {/* Label */}
      <div className="w-32 text-sm text-right pr-4 font-medium text-gray-700">
        {label}
      </div>

      {/* 4 Percentile Bars */}
      {percentiles.map((pct, i) => {
        const value = Math.round((pct || 0) * 100); // ensure numeric
        return (
          <div
            key={i}
            className="relative h-5 mx-1 rounded bg-gray-200"
            style={{ width: `${barWidth}px` }}
          >
            {/* Filled Bar */}
            <div
              className={`h-5 rounded ${getColor(value)}`}
              style={{ width: `${value}%`, transition: 'width 0.3s ease' }}
            />

            {/* Bubble */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
              style={{
                left: `calc(${value}% - 12px)`,
                backgroundColor:
                  value >= 80
                    ? '#ef4444'
                    : value >= 60
                    ? '#fca5a5'
                    : value >= 40
                    ? '#d1d5db'
                    : value >= 20
                    ? '#93c5fd'
                    : '#3b82f6',
              }}
            >
              {isNaN(value) ? '–' : value}
            </div>
          </div>
        );
      })}

      {/* Raw PPP */}
      <div className="ml-4 text-sm text-gray-500 min-w-[3rem] text-right">
        {ppp !== null && !isNaN(ppp) ? `→ ${ppp.toFixed(2)}` : ''}
      </div>
    </div>
  );
}
