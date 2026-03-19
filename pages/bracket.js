import { useState, useEffect } from 'react';

const API = 'https://march-madness-bracket-query.onrender.com';

const ROUND_OPTIONS = [
  { value: 'loss_r1',  label: 'Loses R64' },
  { value: 'loss_r2',  label: 'Loses R32' },
  { value: 'loss_r3',  label: 'Loses Sweet 16' },
  { value: 'loss_r4',  label: 'Loses Elite 8' },
  { value: 'loss_r5',  label: 'Loses Final 4' },
  { value: 'loss_r6',  label: 'Loses Championship' },
  { value: 'win_r1',   label: 'Wins R64' },
  { value: 'win_r2',   label: 'Wins R32' },
  { value: 'win_r3',   label: 'Wins Sweet 16' },
  { value: 'win_r4',   label: 'Wins Elite 8' },
  { value: 'win_r5',   label: 'Wins Final 4' },
  { value: 'champion', label: 'Wins Championship' },
];

const REGION_NAMES = { W: 'East', X: 'South', Y: 'West', Z: 'Midwest' };

function parseApiResponse(data) {
  if (typeof data === 'string') return JSON.parse(data);
  if (Array.isArray(data) && data.length === 1 && typeof data[0] === 'string') return JSON.parse(data[0]);
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') return data;
  return data;
}

function fmt(val) {
  if (val === undefined || val === null) return '—';
  const pct = val * 100;
  if (pct < 0.01) return '<0.01%';
  return pct.toFixed(2) + '%';
}

function fmtDelta(val) {
  if (val === undefined || val === null) return null;
  const pct = val * 100;
  if (Math.abs(pct) < 0.01) return null;
  return (pct > 0 ? '+' : '') + pct.toFixed(2) + '%';
}

function heatBlue(val) {
  if (!val || val === 0) return 'transparent';
  const pct = val * 100;
  if (pct >= 80) return '#1d4ed8';
  if (pct >= 60) return '#2563eb';
  if (pct >= 40) return '#3b82f6';
  if (pct >= 20) return '#93c5fd';
  if (pct >= 10) return '#bfdbfe';
  if (pct >= 1)  return '#dbeafe';
  return '#eff6ff';
}

function deltaColor(delta) {
  if (!delta || delta === 0) return { bg: 'transparent', text: '#6b7280' };
  const pct = delta * 100;
  if (pct > 5)    return { bg: '#14532d', text: '#86efac' };
  if (pct > 2)    return { bg: '#166534', text: '#bbf7d0' };
  if (pct > 0.5)  return { bg: '#15803d', text: '#dcfce7' };
  if (pct > 0)    return { bg: '#16a34a22', text: '#16a34a' };
  if (pct < -5)   return { bg: '#7f1d1d', text: '#fca5a5' };
  if (pct < -2)   return { bg: '#991b1b', text: '#fecaca' };
  if (pct < -0.5) return { bg: '#dc262622', text: '#dc2626' };
  return { bg: '#dc262611', text: '#dc2626' };
}

function getSeedNum(seed) {
  return seed ? seed.slice(1) : '99';
}

function getRegion(seed) {
  return seed ? REGION_NAMES[seed[0]] || seed[0] : '';
}

function displayName(name) {
  if (name === "State John's") return "St. John's";
  return name;
}

const COLS = [
  { key: 'round32',      label: 'Round 32 %',    delta: 'delta_round32' },
  { key: 'sweet16',      label: 'Sweet 16 %',    delta: 'delta_sweet16' },
  { key: 'elite8',       label: 'Elite Eight %', delta: 'delta_elite8' },
  { key: 'final4',       label: 'Final Four %',  delta: 'delta_final4' },
  { key: 'championship', label: 'Title Game %',  delta: 'delta_championship' },
  { key: 'winner',       label: 'Champ %',       delta: 'delta_winner' },
];

const PAGE_BG   = '#f5f0e6';
const CARD_BG   = '#ede8dc';
const BORDER    = '#c8bfaa';
const TEXT_MAIN = '#2c2416';
const TEXT_SUB  = '#7a6e5f';

export default function BracketPage() {
  const [baseline, setBaseline]         = useState([]);
  const [scenarioData, setScenarioData] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [querying, setQuerying]         = useState(false);
  const [error, setError]               = useState(null);

  const [team1, setTeam1]   = useState('');
  const [round1, setRound1] = useState('');
  const [team2, setTeam2]   = useState('');
  const [round2, setRound2] = useState('');

  const [activeConditions, setActiveConditions] = useState([]);
  const [sortCol, setSortCol]   = useState('seed_num');
  const [sortDir, setSortDir]   = useState('asc');
  const [filterRegion, setFilterRegion] = useState('');

  useEffect(() => {
    fetch(`${API}/baseline`)
      .then(r => r.json())
      .then(data => {
        const arr = parseApiResponse(data);
        setBaseline(Array.isArray(arr) ? arr : []);
        setLoading(false);
      })
      .catch(e => {
        setError('Failed to load data: ' + e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeConditions.length === 0) {
      setScenarioData(null);
      return;
    }
    setQuerying(true);
    const conditions = {};
    activeConditions.forEach(c => { conditions[c.team] = c.round; });
    const encoded = encodeURIComponent(JSON.stringify(conditions));
    fetch(`${API}/query?conditions=${encoded}&sort_by=delta_winner`)
      .then(r => r.json())
      .then(data => {
        const arr = parseApiResponse(data);
        setScenarioData(Array.isArray(arr) ? arr : []);
        setQuerying(false);
      })
      .catch(() => setQuerying(false));
  }, [activeConditions]);

  const allTeams = [...baseline].map(t => t.teams).sort();

  function addCondition(team, round) {
    if (!team || !round) return;
    setActiveConditions(prev => {
      const exists = prev.find(c => c.team === team);
      if (exists) return prev.map(c => c.team === team ? { team, round } : c);
      return [...prev, { team, round }];
    });
    setTeam1(''); setRound1('');
    setTeam2(''); setRound2('');
  }

  function removeCondition(team) {
    setActiveConditions(prev => prev.filter(c => c.team !== team));
  }

  function sortedTeams(list) {
    return [...list].sort((a, b) => {
      if (sortCol === 'seed_num') {
        const aNum = parseInt(getSeedNum(a.seed));
        const bNum = parseInt(getSeedNum(b.seed));
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      if (sortCol === 'region') {
        const aR = getRegion(a.seed);
        const bR = getRegion(b.seed);
        const cmp = aR.localeCompare(bR);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      if (sortCol === 'teams') {
        const cmp = displayName(a.teams).localeCompare(displayName(b.teams));
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const av = a[sortCol] ?? 0;
      const bv = b[sortCol] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir(col === 'seed_num' ? 'asc' : 'desc'); }
  }

  function sortArrow(col) {
    if (sortCol !== col) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  const condTeamSet = new Set(activeConditions.map(c => c.team));

  const displayData = (() => {
    if (!scenarioData || activeConditions.length === 0) {
      return sortedTeams(baseline).map(t => ({ ...t, isScenario: false }));
    }
    const scenarioMap = {};
    scenarioData.forEach(t => { scenarioMap[t.teams] = t; });
    return sortedTeams(baseline).map(t => {
      if (condTeamSet.has(t.teams)) return { ...t, isConditioned: true };
      const s = scenarioMap[t.teams];
      if (s) return { ...t, ...s, isScenario: true };
      return { ...t, isScenario: false, notAffected: true };
    });
  })();

  // Apply region filter
  const filteredData = filterRegion
    ? displayData.filter(r => r.seed?.[0] === filterRegion)
    : displayData;

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', padding: '28px 24px', fontFamily: 'Georgia, serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT_MAIN, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
          March Madness 2026
        </h1>
        <p style={{ color: TEXT_SUB, fontSize: 13, margin: '4px 0 0', fontFamily: 'monospace' }}>
          100,000 simulation scenario checker — select conditions to see bracket impact
        </p>
      </div>

      {/* Scenario Builder */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ color: TEXT_SUB, fontSize: 11, fontWeight: 700, marginBottom: 14, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'monospace' }}>
          Scenario Builder
        </div>

        {[
          { team: team1, setTeam: setTeam1, round: round1, setRound: setRound1, label: 'Team A' },
          { team: team2, setTeam: setTeam2, round: round2, setRound: setRound2, label: 'Team B' },
        ].map((slot, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: TEXT_SUB, fontSize: 12, width: 52, fontFamily: 'monospace' }}>{slot.label}</span>
            <select
              value={slot.team}
              onChange={e => slot.setTeam(e.target.value)}
              style={{
                background: PAGE_BG, color: TEXT_MAIN, border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: '6px 10px', fontSize: 13, flex: 1, maxWidth: 220,
                fontFamily: 'Georgia, serif'
              }}
            >
              <option value="">Select team...</option>
              {allTeams.map(t => (
                <option key={t} value={t}>{displayName(t)}</option>
              ))}
            </select>

            <select
              value={slot.round}
              onChange={e => slot.setRound(e.target.value)}
              style={{
                background: PAGE_BG, color: TEXT_MAIN, border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: '6px 10px', fontSize: 13, flex: 1, maxWidth: 200,
                fontFamily: 'monospace'
              }}
            >
              <option value="">Select outcome...</option>
              {ROUND_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            <button
              onClick={() => addCondition(slot.team, slot.round)}
              disabled={!slot.team || !slot.round}
              style={{
                background: slot.team && slot.round ? '#1d4ed8' : BORDER,
                color: slot.team && slot.round ? '#fff' : TEXT_SUB,
                border: 'none', borderRadius: 6, padding: '6px 16px',
                fontSize: 13, cursor: slot.team && slot.round ? 'pointer' : 'default',
                fontFamily: 'monospace', fontWeight: 700,
              }}
            >
              Apply
            </button>
          </div>
        ))}

        {activeConditions.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeConditions.map(c => (
              <div key={c.team} style={{
                background: '#dbeafe', border: '1px solid #93c5fd',
                borderRadius: 20, padding: '4px 12px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ color: '#1e40af', fontSize: 13, fontFamily: 'monospace' }}>
                  {displayName(c.team)} → {ROUND_OPTIONS.find(r => r.value === c.round)?.label}
                </span>
                <button
                  onClick={() => removeCondition(c.team)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}
                >×</button>
              </div>
            ))}
            <button
              onClick={() => setActiveConditions([])}
              style={{
                background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                borderRadius: 20, padding: '4px 14px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'monospace'
              }}
            >Clear All</button>
          </div>
        )}

        {querying && (
          <div style={{ color: '#1d4ed8', fontSize: 12, marginTop: 10, fontFamily: 'monospace' }}>
            ⟳ Querying {activeConditions.map(c => displayName(c.team)).join(' + ')} scenario...
          </div>
        )}
      </div>

      {/* Legend */}
      {activeConditions.length > 0 && !querying && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { bg: '#14532d', text: '#86efac', label: 'Strong boost (>5%)' },
            { bg: '#15803d', text: '#dcfce7', label: 'Moderate boost' },
            { bg: '#16a34a22', text: '#16a34a', label: 'Small boost' },
            { bg: '#dc262611', text: '#dc2626', label: 'Small drop' },
            { bg: '#991b1b',   text: '#fecaca', label: 'Moderate drop' },
            { bg: '#7f1d1d',   text: '#fca5a5', label: 'Strong drop (>5%)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: `1px solid ${l.text}` }} />
              <span style={{ color: TEXT_SUB, fontSize: 11, fontFamily: 'monospace' }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Region Filter + Table */}
      {!loading && !error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ color: TEXT_SUB, fontSize: 12, fontFamily: 'monospace' }}>Filter by region:</span>
          {['', 'W', 'X', 'Y', 'Z'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRegion(r)}
              style={{
                background: filterRegion === r ? '#1d4ed8' : CARD_BG,
                color: filterRegion === r ? '#fff' : TEXT_MAIN,
                border: `1px solid ${filterRegion === r ? '#1d4ed8' : BORDER}`,
                borderRadius: 20, padding: '4px 14px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600,
                transition: 'all 0.15s'
              }}
            >
              {r === '' ? 'All' : REGION_NAMES[r]}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ color: TEXT_SUB, textAlign: 'center', padding: 60, fontFamily: 'monospace' }}>
          Loading simulation data...
        </div>
      ) : error ? (
        <div style={{ color: '#dc2626', textAlign: 'center', padding: 60 }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${BORDER}`, background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: CARD_BG, borderBottom: `2px solid ${BORDER}` }}>
                <th onClick={() => handleSort('teams')} style={{ ...thStyle, textAlign: 'left', paddingLeft: 16, color: TEXT_SUB }}>
                  Team{sortArrow('teams')}
                </th>
                <th onClick={() => handleSort('region')} style={{ ...thStyle, color: TEXT_SUB }}>
                  Region{sortArrow('region')}
                </th>
                <th onClick={() => handleSort('seed_num')} style={{ ...thStyle, color: TEXT_SUB }}>
                  Seed{sortArrow('seed_num')}
                </th>
                {COLS.map(c => (
                  <th key={c.key} onClick={() => handleSort(c.key)} style={{ ...thStyle, color: TEXT_SUB }}>
                    {c.label}{sortArrow(c.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const isConditioned = condTeamSet.has(row.teams);
                const isScenario    = row.isScenario;
                const notAffected   = row.notAffected;
                const rowBg = isConditioned
                  ? '#dbeafe'
                  : idx % 2 === 0 ? '#fff' : '#faf8f4';

                return (
                  <tr
                    key={row.teams}
                    style={{
                      background: rowBg,
                      borderBottom: `1px solid ${BORDER}`,
                      opacity: notAffected && activeConditions.length > 0 ? 0.35 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {/* Team */}
                    <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: 16, color: isConditioned ? '#1d4ed8' : TEXT_MAIN, fontWeight: isConditioned ? 700 : 400 }}>
                      {displayName(row.teams)}
                      {isConditioned && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: '#1d4ed8', fontFamily: 'monospace', background: '#eff6ff', padding: '1px 6px', borderRadius: 10, border: '1px solid #93c5fd' }}>
                          {ROUND_OPTIONS.find(r => r.value === activeConditions.find(c => c.team === row.teams)?.round)?.label}
                        </span>
                      )}
                    </td>

                    {/* Region */}
                    <td style={{ ...tdStyle, color: TEXT_SUB, fontFamily: 'monospace' }}>
                      {row.seed ? getRegion(row.seed) : '—'}
                    </td>

                    {/* Seed number */}
                    <td style={{ ...tdStyle, color: TEXT_SUB, fontFamily: 'monospace' }}>
                      {row.seed ? parseInt(getSeedNum(row.seed)) : '—'}
                    </td>

                    {/* Stat columns */}
                    {COLS.map(c => {
                      const val      = row[c.key];
                      const delta    = row[c.delta];
                      const hasDelta = isScenario && delta !== undefined && delta !== null && Math.abs(delta * 100) >= 0.01;
                      const dc       = hasDelta ? deltaColor(delta) : null;
                      const bg       = hasDelta ? dc.bg : heatBlue(val);
                      const textClr  = hasDelta ? dc.text : (val > 0.4 ? '#fff' : val > 0.1 ? '#1e3a8a' : TEXT_SUB);

                      return (
                        <td key={c.key} style={{
                          ...tdStyle,
                          background: bg,
                          color: textClr,
                          fontFamily: 'monospace',
                          fontWeight: hasDelta ? 700 : 400,
                          transition: 'background 0.3s, color 0.3s',
                        }}>
                          {isConditioned ? '—' : (
                            <>
                              {fmt(val)}
                              {hasDelta && (
                                <div style={{ fontSize: 10, opacity: 0.9 }}>{fmtDelta(delta)}</div>
                              )}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ color: TEXT_SUB, fontSize: 11, marginTop: 16, fontFamily: 'monospace', textAlign: 'right' }}>
        Based on 100,000 Monte Carlo simulations · CourtViz 2026
      </div>
    </div>
  );
}

const thStyle = {
  padding: '10px 12px',
  fontWeight: 700,
  fontSize: 11,
  textAlign: 'center',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontFamily: 'monospace',
  userSelect: 'none',
  cursor: 'pointer',
};

const tdStyle = {
  padding: '8px 12px',
  textAlign: 'center',
  fontSize: 13,
};