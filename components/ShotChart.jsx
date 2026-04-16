import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// ── Color scale: blue=below avg, red=above avg ───────────────────────────────
const COLOR_SCALE = d3.scaleSequential()
  .domain([-0.15, 0.15])
  .interpolator(d3.interpolateRgbBasis([
    '#1a3a8f',  // deep blue (very cold)
    '#4a7fd4',  // blue
    '#a8c4e8',  // light blue
    '#e8e0d0',  // neutral
    '#e8a060',  // orange
    '#c83020',  // red
    '#8b0000',  // dark red (very hot)
  ]));

const SIZE_SCALE = d3.scaleSqrt().domain([0, 1]).range([1.5, 10]).clamp(true);

export default function ShotChart({ bins, playerName }) {
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  const shots = useMemo(() => {
    if (!bins || bins.length === 0) return [];
    return bins
      .filter(d => d.FREQ_PCT >= 0.001 && d.player_total_shots >= 2)
      .map(d => {
        const x    = d.HEX_X * 0.5;  // 5 tenths-of-foot bins → feet
        const y    = d.HEX_Y * 0.5;
        const dist  = Math.sqrt(x * x + y * y);
        const angle = Math.atan2(x, y) * (180 / Math.PI);
        return { angle, dist, fgDiff: d.FG_PCT_DIFF, freq: d.FREQ_PCT, fga: d.player_total_shots, fgPct: d.PLAYER_FG_PCT };
      })
      .filter(d => d.dist <= 35 && Math.abs(d.angle) <= 95);
  }, [bins]);

  const maxFreq = useMemo(() => Math.max(...shots.map(s => s.freq), 0.001), [shots]);

  const W = 520, H = 420;
  const margin = { top: 20, right: 55, bottom: 48, left: 52 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top  - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || shots.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([-95, 95]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 35]).range([innerH, 0]);

    // Grid
    g.selectAll('line.hgrid').data(yScale.ticks(7)).enter().append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .style('stroke', 'rgba(128,128,128,0.12)').attr('stroke-width', 1);

    g.selectAll('line.vgrid').data(xScale.ticks(8)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
      .attr('y1', 0).attr('y2', innerH)
      .style('stroke', 'rgba(128,128,128,0.12)').attr('stroke-width', 1);

    // Center line
    g.append('line')
      .attr('x1', xScale(0)).attr('x2', xScale(0))
      .attr('y1', 0).attr('y2', innerH)
      .style('stroke', 'rgba(128,128,128,0.25)').style('stroke-dasharray', '4,4').attr('stroke-width', 1);

    // 3PT reference
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', yScale(22)).attr('y2', yScale(22))
      .style('stroke', 'rgba(128,128,128,0.2)').style('stroke-dasharray', '4,4').attr('stroke-width', 1);
    g.append('text')
      .attr('x', innerW - 2).attr('y', yScale(22) - 4)
      .style('font-size', '9px').style('font-family', 'monospace')
      .style('fill', 'rgba(128,128,128,0.5)').style('text-anchor', 'end')
      .text('3PT line');

    // Axes
    g.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues([-90, -45, 0, 45, 90]).tickFormat(d => `${d}°`))
      .call(ax => ax.select('.domain').style('stroke', 'rgba(128,128,128,0.3)'))
      .call(ax => ax.selectAll('line').style('stroke', 'rgba(128,128,128,0.3)'))
      .call(ax => ax.selectAll('text').style('fill', 'rgba(128,128,128,0.8)').style('font-size', '11px').style('font-family', 'monospace'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(7).tickFormat(d => `${d}ft`))
      .call(ax => ax.select('.domain').style('stroke', 'rgba(128,128,128,0.3)'))
      .call(ax => ax.selectAll('line').style('stroke', 'rgba(128,128,128,0.3)'))
      .call(ax => ax.selectAll('text').style('fill', 'rgba(128,128,128,0.8)').style('font-size', '11px').style('font-family', 'monospace'));

    // Axis labels
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 38)
      .style('text-anchor', 'middle').style('font-size', '11px').style('font-family', 'monospace')
      .style('fill', 'rgba(128,128,128,0.7)').text('Angle (degrees)  ←left · right→');

    g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -38)
      .style('text-anchor', 'middle').style('font-size', '11px').style('font-family', 'monospace')
      .style('fill', 'rgba(128,128,128,0.7)').text('Distance (ft)');

    // Shots
    g.selectAll('rect.shot').data(shots).enter().append('rect')
      .attr('class', 'shot')
      .attr('x', d => xScale(d.angle) - SIZE_SCALE(d.freq / maxFreq))
      .attr('y', d => yScale(d.dist)  - SIZE_SCALE(d.freq / maxFreq))
      .attr('width',  d => SIZE_SCALE(d.freq / maxFreq) * 2)
      .attr('height', d => SIZE_SCALE(d.freq / maxFreq) * 2)
      .attr('fill', d => COLOR_SCALE(d.fgDiff))
      .attr('opacity', 0.85).attr('rx', 1)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke', 'white').attr('stroke-width', 1);
        const tip = tipRef.current;
        if (tip) {
          tip.style.opacity = '1';
          tip.innerHTML = `
            <div style="font-weight:700;margin-bottom:3px">${d.fgDiff >= 0 ? '+' : ''}${(d.fgDiff * 100).toFixed(1)}% vs avg</div>
            <div style="opacity:0.7">${(d.fgPct * 100).toFixed(1)}% FG · ${d.fga} attempts</div>
            <div style="opacity:0.7">${(d.freq * 100).toFixed(1)}% of shots</div>
            <div style="opacity:0.55;margin-top:3px">${Math.round(d.dist)}ft · ${Math.round(d.angle)}°</div>
          `;
        }
      })
      .on('mousemove', function(event) {
        const tip = tipRef.current;
        const container = svgRef.current?.parentElement;
        if (tip && container) {
          const rect = container.getBoundingClientRect();
          tip.style.left = `${event.clientX - rect.left + 12}px`;
          tip.style.top  = `${event.clientY - rect.top  - 10}px`;
        }
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.85).attr('stroke', 'none');
        if (tipRef.current) tipRef.current.style.opacity = '0';
      });

    // Colorbar
    const cbH = 100, cbW = 10;
    const cbX = innerW + 12, cbY = innerH / 2 - cbH / 2;
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'adGrad')
      .attr('x1', '0%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
    [-0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15].forEach(v => {
      grad.append('stop').attr('offset', `${((v + 0.15) / 0.30) * 100}%`).attr('stop-color', COLOR_SCALE(v));
    });
    const cg = svg.append('g').attr('transform', `translate(${margin.left + cbX},${margin.top + cbY})`);
    cg.append('rect').attr('width', cbW).attr('height', cbH).attr('fill', 'url(#adGrad)').attr('rx', 2);
    cg.append('g').attr('transform', `translate(${cbW},0)`)
      .call(d3.axisRight(d3.scaleLinear().domain([-0.15, 0.15]).range([cbH, 0]))
        .tickValues([-0.10, 0, 0.10])
        .tickFormat(d => `${d > 0 ? '+' : ''}${(d * 100).toFixed(0)}%`))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('line').style('stroke', 'rgba(128,128,128,0.4)'))
      .call(ax => ax.selectAll('text').style('fill', 'rgba(128,128,128,0.8)').style('font-size', '9px').style('font-family', 'monospace'));

  }, [shots, maxFreq]);

  if (!bins || bins.length === 0) return (
    <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.35, fontSize: 13 }}>
      No shot data available for this season.
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div ref={tipRef} style={{
        position: 'absolute', background: 'var(--background)',
        border: '1px solid color-mix(in srgb, var(--foreground) 15%, transparent)',
        borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-mono)',
        pointerEvents: 'none', opacity: 0, transition: 'opacity 0.1s',
        zIndex: 10, color: 'var(--foreground)', whiteSpace: 'nowrap', lineHeight: 1.6,
      }} />
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  );
}
