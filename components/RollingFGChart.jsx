import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';

const ZONE_LABELS = {
  'Mid-Range_Right Side Center(RC)':        'Right-Center Mid-Range',
  'Mid-Range_Left Side(L)':                 'Left Mid-Range',
  'Mid-Range_Right Side(R)':                'Right Mid-Range',
  'Restricted Area_Center(C)':              'Restricted Area',
  'Mid-Range_Left Side Center(LC)':         'Left-Center Mid-Range',
  'Mid-Range_Center(C)':                    'Center Mid-Range',
  'In The Paint (Non-RA)_Center(C)':        'Paint (Center)',
  'Above the Break 3_Right Side Center(RC)':'Right-Center 3PT',
  'Above the Break 3_Left Side Center(LC)': 'Left-Center 3PT',
  'Above the Break 3_Center(C)':            'Center 3PT',
  'Right Corner 3_Right Side(R)':           'Right Corner 3',
  'In The Paint (Non-RA)_Right Side(R)':    'Paint (Right)',
  'Left Corner 3_Left Side(L)':             'Left Corner 3',
  'In The Paint (Non-RA)_Left Side(L)':     'Paint (Left)',
  'Backcourt_Back Court(BC)':               'Backcourt',
};

const ZONE_COLORS = {
  'Mid-Range_Right Side Center(RC)':        '#3b82f6',
  'Mid-Range_Left Side(L)':                 '#8b5cf6',
  'Mid-Range_Right Side(R)':                '#06b6d4',
  'Restricted Area_Center(C)':              '#ef4444',
  'Mid-Range_Left Side Center(LC)':         '#a855f7',
  'Mid-Range_Center(C)':                    '#0ea5e9',
  'In The Paint (Non-RA)_Center(C)':        '#f97316',
  'Above the Break 3_Right Side Center(RC)':'#10b981',
  'Above the Break 3_Left Side Center(LC)': '#059669',
  'Above the Break 3_Center(C)':            '#34d399',
  'Right Corner 3_Right Side(R)':           '#f59e0b',
  'In The Paint (Non-RA)_Right Side(R)':    '#fb923c',
  'Left Corner 3_Left Side(L)':             '#eab308',
  'In The Paint (Non-RA)_Left Side(L)':     '#fd8a4b',
  'Backcourt_Back Court(BC)':               '#94a3b8',
};

export default function RollingFGChart({ shotData, season }) {
  const svgRef = useRef(null);
  const tipRef = useRef(null);
  const [activeZones, setActiveZones] = useState(new Set());

  const byZone = useMemo(() => {
    if (!shotData || shotData.length === 0) return {};
    const seasonData = shotData.filter(d => d.SEASON === season);
    const groups = {};
    for (const row of seasonData) {
      const z = row.ZONE_KEY;
      if (!ZONE_LABELS[z]) continue;
      if (!groups[z]) groups[z] = [];
      groups[z].push(row);
    }
    for (const z of Object.keys(groups)) {
      groups[z].sort((a, b) => a.ZONE_SHOT_NUM - b.ZONE_SHOT_NUM);
    }
    return groups;
  }, [shotData, season]);

  const zones = useMemo(() => Object.keys(byZone), [byZone]);

  // Default: show all zones when data loads
  useEffect(() => {
    if (zones.length > 0) setActiveZones(new Set(zones));
  }, [zones.join(',')]);

  const leagueAvg = useMemo(() => {
    const avgs = {};
    for (const z of zones) avgs[z] = byZone[z]?.[0]?.LEAGUE_FG_PCT ?? null;
    return avgs;
  }, [byZone, zones]);

  const W = 580, H = 320;
  const margin = { top: 16, right: 16, bottom: 34, left: 44 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || zones.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const visibleZones = zones.filter(z => activeZones.has(z));
    if (visibleZones.length === 0) return;

    const allShots  = visibleZones.flatMap(z => byZone[z].map(d => d.ZONE_SHOT_NUM));
    const allPcts   = visibleZones.flatMap(z => byZone[z].map(d => d.ROLLING_FG_PCT));
    const allLeague = visibleZones.map(z => leagueAvg[z]).filter(Boolean);

    const xMax = Math.max(...allShots, 1);
    const yMin = Math.max(0,  Math.min(...allPcts, ...allLeague) - 0.04);
    const yMax = Math.min(1,  Math.max(...allPcts, ...allLeague) + 0.04);

    const xScale = d3.scaleLinear().domain([1, xMax]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]);

    // Grid
    g.selectAll('line.hg').data(yScale.ticks(5)).enter().append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .style('stroke', 'rgba(128,128,128,0.1)').style('stroke-dasharray', '4,4').attr('stroke-width', 1);

    // Axes
    g.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .call(ax => ax.select('.domain').style('stroke', 'rgba(128,128,128,0.25)'))
      .call(ax => ax.selectAll('line').style('stroke', 'rgba(128,128,128,0.25)'))
      .call(ax => ax.selectAll('text').style('fill', 'rgba(128,128,128,0.65)').style('font-size', '10px').style('font-family', 'monospace'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${(d * 100).toFixed(0)}%`))
      .call(ax => ax.select('.domain').style('stroke', 'rgba(128,128,128,0.25)'))
      .call(ax => ax.selectAll('line').style('stroke', 'rgba(128,128,128,0.25)'))
      .call(ax => ax.selectAll('text').style('fill', 'rgba(128,128,128,0.65)').style('font-size', '10px').style('font-family', 'monospace'));

    g.append('text').attr('x', innerW / 2).attr('y', innerH + 28)
      .style('text-anchor', 'middle').style('font-size', '10px')
      .style('font-family', 'monospace').style('fill', 'rgba(128,128,128,0.5)')
      .text('Shot # in Zone This Season');

    const line = d3.line()
      .x(d => xScale(d.ZONE_SHOT_NUM))
      .y(d => yScale(d.ROLLING_FG_PCT))
      .curve(d3.curveCatmullRom.alpha(0.5));

    for (const z of visibleZones) {
      const color = ZONE_COLORS[z] || '#94a3b8';
      const data  = byZone[z];

      // League avg reference line
      if (leagueAvg[z] != null) {
        g.append('line')
          .attr('x1', 0).attr('x2', innerW)
          .attr('y1', yScale(leagueAvg[z])).attr('y2', yScale(leagueAvg[z]))
          .style('stroke', color).style('stroke-opacity', 0.2)
          .style('stroke-dasharray', '3,4').attr('stroke-width', 1);
      }

      // Rolling FG% line
      g.append('path')
        .datum(data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.85);

      // Invisible hover targets
      g.selectAll(null)
        .data(data)
        .enter().append('circle')
        .attr('cx', d => xScale(d.ZONE_SHOT_NUM))
        .attr('cy', d => yScale(d.ROLLING_FG_PCT))
        .attr('r', 5)
        .attr('fill', color)
        .attr('opacity', 0)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('opacity', 1);
          const tip = tipRef.current;
          if (tip) {
            tip.style.opacity = '1';
            tip.innerHTML = `
              <div style="font-weight:700;color:${color};margin-bottom:3px">${ZONE_LABELS[z] || z}</div>
              <div>FG%: <strong>${(d.ROLLING_FG_PCT * 100).toFixed(1)}%</strong></div>
              ${leagueAvg[z] != null ? `<div style="opacity:0.6">Lg Avg: ${(leagueAvg[z] * 100).toFixed(1)}%</div>` : ''}
              <div style="opacity:0.55">Shot #${d.ZONE_SHOT_NUM} this season</div>
            `;
          }
        })
        .on('mousemove', function(event) {
          const tip = tipRef.current;
          const container = svgRef.current?.parentElement;
          if (tip && container) {
            const rect = container.getBoundingClientRect();
            tip.style.left = `${event.clientX - rect.left + 14}px`;
            tip.style.top  = `${event.clientY - rect.top  - 10}px`;
          }
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0);
          if (tipRef.current) tipRef.current.style.opacity = '0';
        });
    }
  }, [byZone, zones, activeZones, leagueAvg]);

  const toggleZone = z => setActiveZones(prev => {
    const next = new Set(prev);
    next.has(z) ? next.delete(z) : next.add(z);
    return next;
  });

  if (!shotData || shotData.length === 0) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* Zone pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {zones.map(z => {
          const color  = ZONE_COLORS[z] || '#94a3b8';
          const active = activeZones.has(z);
          return (
            <button key={z} onClick={() => toggleZone(z)} style={{
              padding: '2px 9px', borderRadius: 20, fontSize: 9,
              fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 0.5,
              cursor: 'pointer', transition: 'all 0.15s',
              border: `1.5px solid ${color}`,
              background: active ? `${color}22` : 'transparent',
              color: active ? color : 'rgba(128,128,128,0.4)',
            }}>
              {ZONE_LABELS[z] || z}
            </button>
          );
        })}
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <div ref={tipRef} style={{
          position: 'absolute', background: 'var(--background)',
          border: '1px solid color-mix(in srgb, var(--foreground) 15%, transparent)',
          borderRadius: 7, padding: '8px 12px', fontSize: 12,
          fontFamily: 'var(--font-mono)', pointerEvents: 'none',
          opacity: 0, transition: 'opacity 0.1s', zIndex: 10,
          color: 'var(--foreground)', whiteSpace: 'nowrap', lineHeight: 1.7,
        }} />
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    </div>
  );
}
