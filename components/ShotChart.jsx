import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { hexbin as d3Hexbin } from 'd3-hexbin';

// ── Color scale: blue=cold, cream=neutral, red=hot (matches reference) ───────
const COLOR_SCALE = d3.scaleSequential()
  .domain([-0.12, 0.12])
  .interpolator(d3.interpolateRgbBasis([
    '#1a3a8f',  // deep blue
    '#4a7fd4',  // blue
    '#93c4e8',  // light blue
    '#e8e4d8',  // cream neutral
    '#e8b060',  // orange
    '#c83020',  // red
    '#7a0000',  // dark red
  ]));

// ── Court dimensions in feet ─────────────────────────────────────────────────
const COURT_W = 50;   // -25 to +25
const COURT_H = 47.5; // -4.75 to 42.75

// ── Draw NBA half-court ───────────────────────────────────────────────────────
// Translated directly from working Plotly court (tenths-of-feet ÷ 10 = feet)
// sx: feet → SVG x,  sy: feet → SVG y (basket at bottom, halfcourt at top)
function drawCourt(g, sx, sy, color = '#9ca3af', lw = 1.2) {
  const cx = x => sx(x);
  const cy = y => sy(y);

  // Arc helper: center (ox,oy) in feet, radius r in feet, angles in degrees
  // Plotly used degrees so we keep that convention here for easy comparison
  const arc = (ox, oy, rx, ry, deg1, deg2, steps = 100) => {
    const pts = d3.range(steps).map(i => {
      const deg = deg1 + (deg2 - deg1) * i / (steps - 1);
      const rad = deg * Math.PI / 180;
      return [cx(ox + rx * Math.cos(rad)), cy(oy + ry * Math.sin(rad))];
    });
    return 'M ' + pts.map(p => p.join(',')).join(' L ');
  };

  // Outer bounds: x0=-250,y0=-47.5,x1=250,y1=422.5 (÷10 = -25,-4.75,25,42.25)
  g.append('rect')
    .attr('x', cx(-25)).attr('y', cy(42.25))
    .attr('width', cx(25) - cx(-25))
    .attr('height', cy(-4.75) - cy(42.25))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Paint outer: x0=-80,y0=-47.5,x1=80,y1=142.5 → -8,-4.75,8,14.25
  g.append('rect')
    .attr('x', cx(-8)).attr('y', cy(14.25))
    .attr('width', cx(8) - cx(-8))
    .attr('height', cy(-4.75) - cy(14.25))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Paint inner: x0=-60,y0=-47.5,x1=60,y1=142.5 → -6,-4.75,6,14.25
  g.append('rect')
    .attr('x', cx(-6)).attr('y', cy(14.25))
    .attr('width', cx(6) - cx(-6))
    .attr('height', cy(-4.75) - cy(14.25))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Backboard: x0=-30,y0=-8.5,x1=30,y1=-7.5 → -3,-0.85,3,-0.75
  g.append('line')
    .attr('x1', cx(-3)).attr('y1', cy(-0.75))
    .attr('x2', cx(3)).attr('y2', cy(-0.75))
    .attr('stroke', color).attr('stroke-width', lw);

  // Hoop: circle x0=-7.5,y0=-7.5,x1=7.5,y1=7.5 → radius=0.75ft
  g.append('circle')
    .attr('cx', cx(0)).attr('cy', cy(0))
    .attr('r', Math.abs(cx(0.75) - cx(0)))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Restricted arc: center(0,0) width=80,height=80 → radius=4ft, 0→180°
  g.append('path')
    .attr('d', arc(0, 0, 4, 4, 0, 180))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Free throw top: center(0,14.25) width=120,height=120 → radius=6ft, 0→180°
  g.append('path')
    .attr('d', arc(0, 14.25, 6, 6, 0, 180))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Free throw bottom dashed: 180→0°
  g.append('path')
    .attr('d', arc(0, 14.25, 6, 6, 180, 360))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw)
    .attr('stroke-dasharray', '4,3');

  // Corner three left: x0=-220,y0=-47.5,x1=-220,y1=92.5 → x=-22, y=-4.75 to 9.25
  g.append('line')
    .attr('x1', cx(-22)).attr('y1', cy(-4.75))
    .attr('x2', cx(-22)).attr('y2', cy(9.25))
    .attr('stroke', color).attr('stroke-width', lw);

  // Corner three right
  g.append('line')
    .attr('x1', cx(22)).attr('y1', cy(-4.75))
    .attr('x2', cx(22)).attr('y2', cy(9.25))
    .attr('stroke', color).attr('stroke-width', lw);

  // 3PT arc: center(0,0) width=475,height=475 → radius=23.75ft, 22°→158°
  g.append('path')
    .attr('d', arc(0, 0, 23.75, 23.75, 22, 158))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Halfcourt outer: center(0,42.25) width=120,height=120 → radius=6ft, 180→360°
  g.append('path')
    .attr('d', arc(0, 42.25, 6, 6, 180, 360))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);

  // Halfcourt inner: center(0,42.25) width=40,height=40 → radius=2ft, 180→360°
  g.append('path')
    .attr('d', arc(0, 42.25, 2, 2, 180, 360))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', lw);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ShotChart({ bins }) {
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  const W = 500, H = 490;
  const margin = { top: 10, right: 45, bottom: 10, left: 10 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Scales: court feet → SVG pixels
  const sx = d3.scaleLinear().domain([-25, 25]).range([0, innerW]);
  const sy = d3.scaleLinear().domain([-4.75, 42.25]).range([innerH, 0]);

  // Filter + convert bins — HEX_X/HEX_Y already in feet from new pipeline
  const shots = useMemo(() => {
    if (!bins || bins.length === 0) return [];
    return bins
      .filter(d => d.FREQ_PCT >= 0.001 && d.FGA >= 2)
      .map(d => ({
        x:      sx(d.HEX_X),  // already in feet from new pipeline
        y:      sy(d.HEX_Y),
        fgDiff: d.FG_PCT_DIFF,
        freq:   d.FREQ_PCT,
        fga:    d.FGA,
        fgPct:  d.FG_PCT,
      }));
  }, [bins]);

  const maxFreq = useMemo(() => Math.max(...shots.map(s => s.freq), 0.001), [shots]);

  useEffect(() => {
    if (!svgRef.current || shots.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Hex radius — 1.5ft in pixels gives good tiling density
    const hexR = Math.abs(sx(1.5) - sx(0));

    const hexbinGen = d3Hexbin()
      .x(d => d.x)
      .y(d => d.y)
      .radius(hexR)
      .extent([[0, 0], [innerW, innerH]]);

    // Draw court behind hexagons
    drawCourt(g, sx, sy, '#9ca3af', 1.2);

    // Draw hexagons — each shot bin is placed at its precomputed center
    g.append('g').selectAll('path')
      .data(shots)
      .enter()
      .append('path')
      .attr('d', d => {
        // Size hex proportional to frequency, min size so rare zones still show
        const r = hexR * (0.25 + 0.75 * Math.sqrt(d.freq / maxFreq));
        return hexbinGen.hexagon(r);
      })
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('fill', d => COLOR_SCALE(d.fgDiff))
      .attr('opacity', d => 0.5 + 0.5 * Math.sqrt(d.freq / maxFreq))
      .attr('stroke', d => d3.color(COLOR_SCALE(d.fgDiff))?.darker(0.3).toString() || 'none')
      .attr('stroke-width', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', 1.5).attr('stroke', 'white');
        const tip = tipRef.current;
        if (tip) {
          tip.style.opacity = '1';
          tip.innerHTML = `
            <div style="font-weight:700;margin-bottom:2px">${d.fgDiff >= 0 ? '+' : ''}${(d.fgDiff * 100).toFixed(1)}% vs league</div>
            <div style="opacity:0.7">${(d.fgPct * 100).toFixed(1)}% FG · ${d.fga} FGA</div>
            <div style="opacity:0.7">${(d.freq * 100).toFixed(1)}% of shots</div>
          `;
        }
      })
      .on('mousemove', function(event) {
        const tip = tipRef.current;
        const container = svgRef.current?.parentElement;
        if (tip && container) {
          const rect = container.getBoundingClientRect();
          tip.style.left = `${event.clientX - rect.left + 12}px`;
          tip.style.top  = `${event.clientY - rect.top - 10}px`;
        }
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.5 + 0.5 * Math.sqrt(d.freq / maxFreq))
          .attr('stroke-width', 0.5)
          .attr('stroke', d3.color(COLOR_SCALE(d.fgDiff))?.darker(0.3).toString() || 'none');
        if (tipRef.current) tipRef.current.style.opacity = '0';
      });

    // ── Colorbar ─────────────────────────────────────────────────────────────
    const cbH = 120, cbW = 10;
    const cbX = innerW + 12, cbY = innerH / 2 - cbH / 2;

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'hexGrad')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');

    [-0.12, -0.08, -0.04, 0, 0.04, 0.08, 0.12].forEach(v => {
      grad.append('stop')
        .attr('offset', `${((v + 0.12) / 0.24) * 100}%`)
        .attr('stop-color', COLOR_SCALE(v));
    });

    const cg = svg.append('g')
      .attr('transform', `translate(${margin.left + cbX},${margin.top + cbY})`);

    cg.append('rect')
      .attr('width', cbW).attr('height', cbH)
      .attr('fill', 'url(#hexGrad)').attr('rx', 2);

    const cbScale = d3.scaleLinear().domain([-0.12, 0.12]).range([cbH, 0]);
    cg.append('g')
      .attr('transform', `translate(${cbW},0)`)
      .call(d3.axisRight(cbScale)
        .tickValues([-0.10, 0, 0.10])
        .tickFormat(d => `${d > 0 ? '+' : ''}${(d * 100).toFixed(0)}%`))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('line').style('stroke', 'rgba(128,128,128,0.4)'))
      .call(ax => ax.selectAll('text')
        .style('fill', 'rgba(128,128,128,0.8)')
        .style('font-size', '9px')
        .style('font-family', 'monospace'));

  }, [shots, maxFreq]);

  if (!bins || bins.length === 0) return (
    <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.35, fontSize: 13 }}>
      No shot data available for this season.
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div ref={tipRef} style={{
        position: 'absolute',
        background: 'var(--background)',
        border: '1px solid color-mix(in srgb, var(--foreground) 15%, transparent)',
        borderRadius: 7, padding: '7px 10px', fontSize: 12,
        fontFamily: 'var(--font-mono)', pointerEvents: 'none',
        opacity: 0, transition: 'opacity 0.1s', zIndex: 10,
        color: 'var(--foreground)', whiteSpace: 'nowrap', lineHeight: 1.6,
      }} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
