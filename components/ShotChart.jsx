import Plot from 'react-plotly.js';

// Arc trace generator (like add_arc from Python)
const createArcTrace = (xCenter, yCenter, width, height, theta1, theta2, dashed = false, color = 'black', lw = 2) => {
  const theta = Array.from({ length: 100 }, (_, i) => theta1 + ((theta2 - theta1) / 99) * i);
  const radians = theta.map(deg => (deg * Math.PI) / 180);
  const x = radians.map(r => xCenter + (width / 2) * Math.cos(r));
  const y = radians.map(r => yCenter + (height / 2) * Math.sin(r));

  return {
    x,
    y,
    mode: 'lines',
    line: {
      color,
      width: lw,
      dash: dashed ? 'dash' : 'solid',
    },
    hoverinfo: 'skip',
    showlegend: false,
    type: 'scatter',
  };
};

// Full NBA halfcourt overlay
const generateCourtShapesAndArcs = (lw = 2, color = 'black') => {
  const shapes = [
    { type: 'circle', x0: -7.5, y0: -7.5, x1: 7.5, y1: 7.5 }, // Hoop
    { type: 'rect', x0: -30, y0: -8.5, x1: 30, y1: -7.5 },     // Backboard
    { type: 'rect', x0: -80, y0: -47.5, x1: 80, y1: 142.5 },   // Paint outer
    { type: 'rect', x0: -60, y0: -47.5, x1: 60, y1: 142.5 },   // Paint inner
    { type: 'line', x0: -220, y0: -47.5, x1: -220, y1: 92.5 }, // Corner three left
    { type: 'line', x0: 220, y0: -47.5, x1: 220, y1: 92.5 },   // Corner three right
    { type: 'rect', x0: -250, y0: -47.5, x1: 250, y1: 422.5 }, // Outer bounds
  ].map(shape => ({ ...shape, line: { color, width: lw } }));

  const arcTraces = [
    createArcTrace(0, 142.5, 120, 120, 0, 180, false, color, lw),    // Free throw top
    createArcTrace(0, 142.5, 120, 120, 180, 0, true, color, lw),     // Free throw bottom dashed
    createArcTrace(0, 0, 80, 80, 0, 180, false, color, lw),          // Restricted
    createArcTrace(0, 0, 475, 475, 22, 158, false, color, lw),       // 3PT arc
    createArcTrace(0, 422.5, 120, 120, 180, 0, false, color, lw),    // Halfcourt outer
    createArcTrace(0, 422.5, 40, 40, 180, 0, false, color, lw),      // Halfcourt inner
  ];

  return { shapes, arcTraces };
};

const ShotChart = ({ bins, playerName }) => {
  if (!bins || bins.length === 0) return null;

  const x = bins.map(d => d.HEX_X * 5);
  const y = bins.map(d => d.HEX_Y * 5);
  const color = bins.map(d => Math.max(-0.25, Math.min(0.25, d.FG_PCT_DIFF)) * 100);
  const freq = bins.map(d => d.FREQ_PCT >= 0.0015 ? d.FREQ_PCT : 0);
  const maxFreq = Math.max(...freq);
  const sizes = freq.map(f => Math.sqrt(f / maxFreq) * 45); // Try 40–60 scale
  const hoverFreq = freq.map(f => `${(f * 100).toFixed(1)}%`);
 




  const { shapes, arcTraces } = generateCourtShapesAndArcs();

  return (
    <Plot
      data={[
        {
          type: 'scatter',
          mode: 'markers',
          x,
          y,
          marker: {
            color,
            size: sizes,
            colorscale: 'RdYlBu',
            colorbar: {
              title: 'FG% Diff',
              ticksuffix: '%',
              tickfont: { size: 10 },
            },
            symbol: 'hexagon',
            line: { width: 0 },
          },
          customdata: hoverFreq,
          hovertemplate:
            'FG% Diff: %{marker.color:.1f}%<br>' +
            'Freq: %{customdata}<extra></extra>',
        },
        ...arcTraces
      ]}

      layout={{
        title: `Shot Chart – ${playerName}`,
        xaxis: { range: [250, -250], visible: false, scaleanchor: "y" },
        yaxis: { range: [-47.5, 422.5], visible: false },
        plot_bgcolor: 'white',
        margin: { t: 50, b: 0, l: 0, r: 0 },
        height: 550,
        width: 600,
        shapes,
        showlegend: false,
      }}
    />
  );
};

export default ShotChart;
