import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';

const POSITION_GROUPS = {
  All:     null,
  Guard:   ['Guard', 'Guard-Forward'],
  Wing:    ['Forward', 'Forward-Guard'],
  Forward: ['Center', 'Center-Forward', 'Forward-Center'],
};

const POSITION_COLORS = {
  'Guard':          '#3b82f6',
  'Guard-Forward':  '#3b82f6',
  'Forward':        '#059669',
  'Forward-Guard':  '#059669',
  'Center':         '#d97706',
  'Center-Forward': '#d97706',
  'Forward-Center': '#d97706',
};

const DECISION_COLORS = {
  good:     '#059669',
  great:    '#0ea5e9',
  bad:      '#f59e0b',
  terrible: '#dc2626',
};

function DecisionBar({ good, great, bad, terrible }) {
  const total = (good + great + bad + terrible) || 1;
  const segments = [
    { key: 'great',    val: great,    color: DECISION_COLORS.great },
    { key: 'good',     val: good,     color: DECISION_COLORS.good },
    { key: 'bad',      val: bad,      color: DECISION_COLORS.bad },
    { key: 'terrible', val: terrible, color: DECISION_COLORS.terrible },
  ];
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', width: 80, gap: 1 }}>
      {segments.map(s => (
        <div key={s.key} style={{
          width: `${(s.val / total) * 100}%`,
          background: s.color,
          transition: 'width 0.4s ease',
        }} title={`${s.key}: ${Math.round(s.val * 100)}%`} />
      ))}
    </div>
  );
}

export default function HeliocentricLeaderboard() {
  const [leaderboardType, setLeaderboardType]   = useState('');
  const [leaderboardTypes, setLeaderboardTypes] = useState([]);
  const [leaderboardData, setLeaderboardData]   = useState([]);
  const [playerMap, setPlayerMap]               = useState({});
  const [loading, setLoading]                   = useState(false);
  const [filters, setFilters]                   = useState({ good: 0, great: 0, bad: 0, terrible: 0 });
  const [sortConfig, setSortConfig]             = useState({ key: '', direction: 'asc' });
  const [posFilter, setPosFilter]               = useState('All');
  const [infoOpen, setInfoOpen]                 = useState(false);

  // ── Fetch leaderboard types ───────────────────────────────────────────────
  useEffect(() => {
    const fetchLeaderboardTypes = async () => {
      const batchSize = 1000;
      let start = 0, allRows = [], finished = false;
      while (!finished) {
        const { data, error } = await supabase
          .from('heliocentric_leaderboard')
          .select('leaderboard_type')
          .neq('leaderboard_type', '')
          .range(start, start + batchSize - 1);
        if (error) { console.error(error); return; }
        allRows = allRows.concat(data);
        if (data.length < batchSize) finished = true;
        start += batchSize;
      }
      setLeaderboardTypes([...new Set(allRows.map(d => d.leaderboard_type))]);
    };
    fetchLeaderboardTypes();
  }, []);

  // ── Fetch leaderboard data ────────────────────────────────────────────────
  useEffect(() => {
    if (!leaderboardType) return;
    setLoading(true);

    const fetchData = async () => {
      let allRows = [], start = 0;
      const batchSize = 1000;
      let finished = false;
      while (!finished) {
        const { data, error } = await supabase
          .from('heliocentric_leaderboard')
          .select('*')
          .eq('leaderboard_type', leaderboardType)
          .range(start, start + batchSize - 1);
        if (error) { console.error(error); setLoading(false); return; }
        allRows = allRows.concat(data);
        if (data.length < batchSize) finished = true;
        start += batchSize;
      }

      const playerIds = allRows.map(r => r.player_id);

      const [{ data: players }, { data: headshots }, { data: shotMakers }] = await Promise.all([
        supabase.from('players').select('player_id, player_name, position').in('player_id', playerIds),
        supabase.from('player_headshots').select('player_id, headshot').in('player_id', playerIds),
        supabase.from('shot_maker').select('player_id, total_shots, avg_shot_maker_difficulty, total_shot_maker_difficulty, avg_shot_maker_difficulty_cat, total_shot_maker_difficulty_cat').in('player_id', playerIds),
      ]);

      const map = {};
      for (const r of players || []) map[r.player_id] = { name: r.player_name, position: r.position };
      for (const r of headshots || []) map[r.player_id] = { ...map[r.player_id], headshot: r.headshot };

      const shotMakerMap = {};
      for (const r of shotMakers || []) shotMakerMap[r.player_id] = r;

      const isBoth = leaderboardType.toLowerCase() === 'both_categorical';
      const isCat  = leaderboardType.toLowerCase() === 'categorical' || isBoth;

      const merged = allRows.map(row => {
        const shot = shotMakerMap[row.player_id] || {};
        return {
          ...row,
          avg_shot_maker_difficulty: isBoth
            ? `${shot.avg_shot_maker_difficulty?.toFixed(2)} / ${shot.avg_shot_maker_difficulty_cat?.toFixed(2)}`
            : isCat ? shot.avg_shot_maker_difficulty_cat : shot.avg_shot_maker_difficulty,
          total_shot_maker_difficulty: isBoth
            ? `${shot.total_shot_maker_difficulty} / ${shot.total_shot_maker_difficulty_cat}`
            : isCat ? shot.total_shot_maker_difficulty_cat : shot.total_shot_maker_difficulty,
          avg_shot_maker_difficulty_cat:   shot.avg_shot_maker_difficulty_cat,
          total_shot_maker_difficulty_cat: shot.total_shot_maker_difficulty_cat,
        };
      });

      setPlayerMap(map);
      setLeaderboardData(merged);
      setLoading(false);
    };

    fetchData();
  }, [leaderboardType]);

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
    );
  };

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return leaderboardData.filter(row => {
      if (row.good_decision_pct * 100 < filters.good)     return false;
      if (row.great_decision_pct * 100 < filters.great)   return false;
      if (row.bad_decision_pct * 100 < filters.bad)       return false;
      if (row.terrible_decision_pct * 100 < filters.terrible) return false;
      if (posFilter !== 'All') {
        const group = POSITION_GROUPS[posFilter];
        const pos = playerMap[row.player_id]?.position;
        if (!group?.includes(pos)) return false;
      }
      return true;
    });
  }, [leaderboardData, filters, posFilter, playerMap]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const { key, direction } = sortConfig;
      if (!key) return 0;
      const aVal = a[key], bVal = b[key];
      if (typeof aVal === 'number' && typeof bVal === 'number')
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      return direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortConfig]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    background: 'transparent',
    border: '1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
    borderRadius: 7, padding: '7px 10px', fontSize: 13,
    color: 'var(--foreground)', fontFamily: 'var(--font-sans)', width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle = {
    fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
    letterSpacing: 1, textTransform: 'uppercase', opacity: 0.45,
    marginBottom: 5, display: 'block',
  };

  const thStyle = (key) => ({
    padding: '10px 12px', textAlign: 'left', fontSize: 10,
    fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 1,
    textTransform: 'uppercase', opacity: 0.5, cursor: 'pointer',
    userSelect: 'none', whiteSpace: 'nowrap',
    borderBottom: '2px solid color-mix(in srgb, var(--navbar) 70%, transparent)',
    background: sortConfig.key === key
      ? 'color-mix(in srgb, var(--navbar) 20%, transparent)'
      : 'transparent',
  });

  const helioColor = (val) => {
    if (val > 0.05)  return '#059669';
    if (val < -0.05) return '#dc2626';
    return 'var(--foreground)';
  };

  return (
    <>
      <style>{`
        .heli-input:focus {
          outline: none;
          border-color: var(--navbar) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--navbar) 25%, transparent);
        }
        .heli-row:hover { background: color-mix(in srgb, var(--navbar) 14%, transparent) !important; }
        .sort-th:hover { opacity: 0.8 !important; }
        .pos-pill { transition: all 0.15s; cursor: pointer; }
        .pos-pill:hover { opacity: 0.8; }
        .info-toggle:hover { opacity: 0.8; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.2s ease both; }
      `}</style>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>
            Heliocentric Leaderboard
          </h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.45 }}>
            Player decision-making based on Heliocentric Shot Selection · 2015-16 NBA season
          </p>
        </div>

        {/* Collapsible info section */}
        <div style={{
          border: '1.5px solid color-mix(in srgb, var(--navbar) 45%, transparent)',
          borderRadius: 10, marginBottom: 24, overflow: 'hidden',
        }}>
          <button
            className="info-toggle"
            onClick={() => setInfoOpen(v => !v)}
            style={{
              width: '100%', background: 'color-mix(in srgb, var(--navbar) 15%, transparent)',
              border: 'none', padding: '12px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: 'var(--foreground)', transition: 'opacity 0.15s',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
              What is Heliocentric Shot Selection?
            </span>
            <span style={{ fontSize: 12, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
              {infoOpen ? '▲ Hide' : '▼ Show'}
            </span>
          </button>

          {infoOpen && (
            <div className="fade-in" style={{ padding: '20px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 auto' }}>
                <Image
                  src="/images/ep_snapshot.png"
                  alt="EP Snapshot"
                  width={420}
                  height={210}
                  style={{ borderRadius: 8, display: 'block' }}
                />
              </div>
              <div style={{ flex: '1 1 280px', fontSize: 13, lineHeight: 1.7 }}>
                <p style={{ margin: '0 0 10px' }}>
                  A metric that evaluates the <strong>expected value of a shot versus the best available teammate option</strong> on the floor. It measures how often players take good, great, bad, or terrible shots based on spatial tracking data.
                </p>
                <p style={{ margin: '0 0 10px', opacity: 0.7 }}>
                  In this EP Snapshot, the shooter (▲) took a shot worth <strong>0.97 EP</strong> while the best available teammate (■) had an EP of <strong>1.14</strong>. The <strong>Heliocentric Value</strong> is calculated as <code>(0.97 − 1.14) + 0.20 = +0.03</code>.
                </p>
                <div style={{
                  background: 'color-mix(in srgb, var(--navbar) 15%, transparent)',
                  borderRadius: 7, padding: '10px 12px', fontSize: 12,
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  {[
                    [DECISION_COLORS.great,    'Great',    'Shot EP significantly better than best teammate'],
                    [DECISION_COLORS.good,     'Good',     'Shot EP moderately better than best teammate'],
                    [DECISION_COLORS.bad,      'Bad',      'Shot EP moderately worse than best teammate'],
                    [DECISION_COLORS.terrible, 'Terrible', 'Shot EP significantly worse than best teammate'],
                  ].map(([color, label, desc]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, minWidth: 52 }}>{label}</span>
                      <span style={{ opacity: 0.55 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{
          background: 'color-mix(in srgb, var(--navbar) 10%, transparent)',
          border: '1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)',
          borderRadius: 10, padding: 20, marginBottom: 20,
        }}>
          {/* Leaderboard type */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Leaderboard Type</label>
            <select
              className="heli-input"
              value={leaderboardType}
              onChange={e => setLeaderboardType(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select a leaderboard type…</option>
              {leaderboardTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Position pills + filters row */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Position pills */}
            <div>
              <label style={labelStyle}>Position</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.keys(POSITION_GROUPS).map(pos => {
                  const active = posFilter === pos;
                  const color = pos === 'Guard' ? '#3b82f6' : pos === 'Wing' ? '#059669' : pos === 'Forward' ? '#d97706' : null;
                  return (
                    <button
                      key={pos}
                      className="pos-pill"
                      onClick={() => setPosFilter(pos)}
                      style={{
                        padding: '5px 13px', borderRadius: 20, fontSize: 11,
                        fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                        border: active && color
                          ? `1.5px solid ${color}`
                          : '1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
                        background: active ? (color ? `${color}18` : 'var(--navbar)') : 'transparent',
                        color: active && color ? color : 'var(--foreground)',
                      }}
                    >{pos}</button>
                  );
                })}
              </div>
            </div>

            {/* Decision % filters */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, minWidth: 0 }}>
              {['good', 'great', 'bad', 'terrible'].map(type => (
                <div key={type}>
                  <label style={{ ...labelStyle, color: DECISION_COLORS[type] }}>
                    Min {type} %
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="heli-input"
                      type="number" min={0} max={100}
                      value={filters[type]}
                      onChange={e => setFilters(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                      style={{
                        ...inputStyle,
                        borderColor: filters[type] > 0
                          ? `${DECISION_COLORS[type]}88`
                          : 'color-mix(in srgb, var(--foreground) 20%, transparent)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result count */}
        {leaderboardType && !loading && (
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.4, marginBottom: 10 }}>
            {sortedData.length} player{sortedData.length !== 1 ? 's' : ''}
            {leaderboardData.length !== sortedData.length ? ` / ${leaderboardData.length} total` : ''}
          </div>
        )}

        {loading && (
          <div style={{ padding: 40, textAlign: 'center', opacity: 0.35, fontSize: 13 }}>
            Loading…
          </div>
        )}

        {/* Table */}
        {sortedData.length > 0 && (
          <div style={{
            borderRadius: 10,
            border: '1.5px solid color-mix(in srgb, var(--navbar) 50%, transparent)',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'color-mix(in srgb, var(--navbar) 25%, transparent)' }}>
                    {/* Rank */}
                    <th style={{ ...thStyle('rank'), width: 40, textAlign: 'center' }}>#</th>
                    {/* Headshot */}
                    <th style={{ ...thStyle(null), width: 52 }}></th>
                    {[
                      ['player_id',                   'Player'],
                      ['position',                    'Pos'],
                      ['total_shots',                 'Shots'],
                      ['decisions',                   'Decision Split'],
                      ['good_decision_pct',            'Good %'],
                      ['great_decision_pct',           'Great %'],
                      ['bad_decision_pct',             'Bad %'],
                      ['terrible_decision_pct',        'Terrible %'],
                      ['avg_heliocentric_value',       'Avg Helio'],
                      ['total_better_options',         'Better Opts'],
                      ['total_heliocentric_value',     'Total Helio'],
                      ['avg_shot_maker_difficulty',    'Avg Shot Maker'],
                      ['total_shot_maker_difficulty',  'Total Shot Maker'],
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        className="sort-th"
                        onClick={() => key !== 'decisions' && handleSort(key)}
                        style={{ ...thStyle(key), cursor: key === 'decisions' ? 'default' : 'pointer' }}
                      >
                        {label}
                        {sortConfig.key === key && (
                          <span style={{ marginLeft: 3, fontSize: 9 }}>
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((row, idx) => {
                    const player  = playerMap[row.player_id] || {};
                    const posColor = POSITION_COLORS[player.position] || '#94a3b8';
                    const avgHelio = Number(row.avg_heliocentric_value);
                    const isCatOnly = leaderboardType.toLowerCase().includes('categorical') && !leaderboardType.toLowerCase().includes('both');
                    const isBoth    = leaderboardType.toLowerCase().includes('both');

                    return (
                      <tr
                        key={row.player_id}
                        className="heli-row fade-in"
                        style={{
                          borderTop: '1px solid color-mix(in srgb, var(--foreground) 6%, transparent)',
                          animationDelay: `${Math.min(idx * 15, 300)}ms`,
                        }}
                      >
                        {/* Rank */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.35 }}>
                          {idx + 1}
                        </td>

                        {/* Headshot */}
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
                            border: `2px solid ${posColor}`,
                            background: 'color-mix(in srgb, var(--navbar) 30%, transparent)',
                          }}>
                            <img
                              src={player.headshot || '/default-headshot.png'}
                              alt={player.name || 'Player'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        </td>

                        {/* Name */}
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <Link
                            href={`/player/${row.player_id}`}
                            style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 600 }}
                          >
                            <span className="player-link">
                              {player.name || row.player_id}
                            </span>
                          </Link>
                        </td>

                        {/* Position */}
                        <td style={{ padding: '10px 12px' }}>
                          {player.position && (
                            <span style={{
                              background: `${posColor}18`, color: posColor,
                              border: `1px solid ${posColor}44`,
                              borderRadius: 5, padding: '2px 7px',
                              fontSize: 10, fontWeight: 700,
                              fontFamily: 'var(--font-mono)', letterSpacing: 1,
                              whiteSpace: 'nowrap',
                            }}>
                              {player.position}
                            </span>
                          )}
                        </td>

                        {/* Shots */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {row.total_shots}
                        </td>

                        {/* Decision bar */}
                        <td style={{ padding: '10px 12px' }}>
                          <DecisionBar
                            good={row.good_decision_pct}
                            great={row.great_decision_pct}
                            bad={row.bad_decision_pct}
                            terrible={row.terrible_decision_pct}
                          />
                        </td>

                        {/* Good % */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: DECISION_COLORS.good, fontWeight: 600 }}>
                          {Math.round(row.good_decision_pct * 100)}%
                        </td>

                        {/* Great % */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: DECISION_COLORS.great, fontWeight: 600 }}>
                          {Math.round(row.great_decision_pct * 100)}%
                        </td>

                        {/* Bad % */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: DECISION_COLORS.bad, fontWeight: 600 }}>
                          {Math.round(row.bad_decision_pct * 100)}%
                        </td>

                        {/* Terrible % */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: DECISION_COLORS.terrible, fontWeight: 600 }}>
                          {Math.round(row.terrible_decision_pct * 100)}%
                        </td>

                        {/* Avg Helio — colored by positive/negative */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
                          fontWeight: 700, color: helioColor(avgHelio) }}>
                          {avgHelio >= 0 ? '+' : ''}{avgHelio.toFixed(2)}
                        </td>

                        {/* Better Options */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.7 }}>
                          {row.total_better_options}
                        </td>

                        {/* Total Helio — colored */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
                          fontWeight: 700, color: helioColor(Number(row.total_heliocentric_value)) }}>
                          {Number(row.total_heliocentric_value) >= 0 ? '+' : ''}{row.total_heliocentric_value?.toFixed(2)}
                        </td>

                        {/* Avg Shot Maker */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.8 }}>
                          {isBoth
                            ? row.avg_shot_maker_difficulty
                            : isCatOnly
                              ? row.avg_shot_maker_difficulty_cat?.toFixed(2)
                              : row.avg_shot_maker_difficulty?.toFixed(2)}
                        </td>

                        {/* Total Shot Maker */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.8 }}>
                          {isBoth
                            ? row.total_shot_maker_difficulty
                            : isCatOnly
                              ? row.total_shot_maker_difficulty_cat?.toFixed(2)
                              : row.total_shot_maker_difficulty?.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && leaderboardType && sortedData.length === 0 && (
          <div style={{
            padding: 48, textAlign: 'center', opacity: 0.35, fontSize: 13,
            border: '1.5px dashed color-mix(in srgb, var(--foreground) 15%, transparent)',
            borderRadius: 10,
          }}>
            No players match the selected filters.
          </div>
        )}

        {/* Prompt to select */}
        {!leaderboardType && !loading && (
          <div style={{
            padding: 48, textAlign: 'center', opacity: 0.25, fontSize: 13,
            fontFamily: 'var(--font-mono)',
          }}>
            Select a leaderboard type above to load data.
          </div>
        )}
      </div>

      <style>{`
        .player-link {
          position: relative;
          display: inline-block;
        }
        .player-link::after {
          content: '';
          position: absolute;
          left: 0; bottom: -1px;
          width: 0; height: 1.5px;
          background: var(--foreground);
          transition: width 0.2s ease;
        }
        .player-link:hover::after { width: 100%; }
      `}</style>
    </>
  );
}