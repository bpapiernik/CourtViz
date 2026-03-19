import { useState, useEffect } from 'react';

const API = 'https://march-madness-bracket-query.onrender.com';

const ROUND_OPTIONS = [
  { value: 'loss_r1', label: 'Loses R64' },
  { value: 'loss_r2', label: 'Loses R32' },
  { value: 'loss_r3', label: 'Loses Sweet 16' },
  { value: 'loss_r4', label: 'Loses Elite 8' },
  { value: 'loss_r5', label: 'Loses Final 4' },
  { value: 'loss_r6', label: 'Loses Championship' },
  { value: 'win_r1',  label: 'Wins R64' },
  { value: 'win_r2',  label: 'Wins R32' },
  { value: 'win_r3',  label: 'Wins Sweet 16' },
  { value: 'win_r4',  label: 'Wins Elite 8' },
  { value: 'win_r5',  label: 'Wins Final 4' },
  { value: 'champion',label: 'Wins Championship' },
];

const SEED_ORDER = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16'];
const REGIONS = ['W','X','Y','Z'];
const REGION_NAMES = { W: 'East', X: 'South', Y: 'West', Z: 'Midwest' };

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
  if (val === undefined || val === null || val === 0) return 'transparent';
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
  if (pct > 5)  return { bg: '#14532d', text: '#86efac' };
  if (pct > 2)  return { bg: '#166534', text: '#bbf7d0' };
  if (pct > 0.5)return { bg: '#15803d', text: '#dcfce7' };
  if (pct > 0)  return { bg: '#16a34a22', text: '#16a34a' };
  if (pct < -5) return { bg: '#7f1d1d', text: '#fca5a5' };
  if (pct < -2) return { bg: '#991b1b', text: '#fecaca' };
  if (pct < -0.5)return{ bg: '#dc262622', text: '#dc2626' };
  return { bg: '#dc262611', text: '#dc2626' };
}

function getSeedNum(seed) {
  return seed ? seed.slice(1) : '99';
}

export default function BracketPage() {
  const [baseline, setBaseline] = useState([]);
  const [scenarioData, setScenarioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState(null);

  const [team1, setTeam1] = useState('');
  const [round1, setRound1] = useState('');
  const [team2, setTeam2] = useState('');
  const [round2, setRound2] = useState('');

  const [activeConditions, setActiveConditions] = useState([]);
  const [sortCol, setSortCol] = useState('seed');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    fetch(`${API}/baseline`)
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const arr = Array.isArray(parsed) ? parsed : JSON.parse(parsed[0] || parsed);
        setBaseline(arr);
        setLoading(false);
      })
      .catch(e => {
        setError('Failed to load baseline data');
        setLoading(false);
      });
  }, []);

  const allTeams = baseline.map(t => t.teams).sort();

  function addCondition(team, round) {
    if (!team || !round) return;
    const exists = activeConditions.find(c => c.team === team);
    if (exists) {
      setActiveConditions(prev => prev.map(c => c.team === team ? { team, round } : c));
    } else {
      setActiveConditions(prev => [...prev, { team, round }]);
    }
    setTeam1(''); setRound1('');
    setTeam2(''); setRound2('');
  }

  function removeCondition(team) {
    setActiveConditions(prev => prev.filter(c => c.team !== team));
  }

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
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const arr = Array.isArray(parsed) ? parsed : JSON.parse(parsed[0] || parsed);
        setScenarioData(arr);
        setQuerying(false);
      })
      .catch(() => setQuerying(false));
  }, [activeConditions]);

  function sortedTeams(teamList) {
    return [...teamList].sort((a, b) => {
      let av, bv;
      if (sortCol === 'seed') {
        const aRegion = a.seed ? a.seed[0] : 'Z';
        const bRegion = b.seed ? b.seed[0] : 'Z';
        const aNum = parseInt(getSeedNum(a.seed));
        const bNum = parseInt(getSeedNum(b.seed));
        if (aNum !== bNum) return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
        return aRegion.localeCompare(bRegion);
      }
      av = a[sortCol] ?? 0;
      bv = b[sortCol] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  // Build display rows — merge baseline with scenario
  const displayData = (() => {
    if (!scenarioData || activeConditions.length === 0) {
      return sortedTeams(baseline).map(t => ({ ...t, isScenario: false }));
    }
    // Show all baseline teams, merge scenario deltas
    const scenarioMap = {};
    scenarioData.forEach(t => { scenarioMap[t.teams] = t; });
    const condTeams = activeConditions.map(c => c.team);
    return sortedTeams(baseline).map(t => {
      const s = scenarioMap[t.teams];
      if (condTeams.includes(t.teams)) return { ...t, isConditioned: true };
      if (s) return { ...t, ...s, isScenario: true };
      return { ...t, isScenario: false, notAffected: true };
    });
  })();

  const cols = [
    { key: 'round32',      label: 'Round 32 %' },
    { key: 'sweet16',      label: 'Sweet 16 %' },
    { key: 'elite8',       label: 'Elite Eight %' },
    { key: 'final4',       label: 'Final Four %' },
    { key: 'championship', label: 'Title Game %' },
    { key: 'winner',       label: 'Champ %' },
  ];

  const deltaKeys = {
    round32: 'delta_round32',
    sweet16: 'delta_sweet16',
    elite8: 'delta_elite8',
    final4: 'delta_final4',
    championship: 'delta_championship',
    winner: 'delta_winner',
  };

  const condTeamSet = new Set(activeConditions.map(c => c.team));

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: '#0f172a', minHeight: '100vh', padding: '24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#f8fafc', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
          March Madness 2026
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0', fontFamily: 'monospace' }}>
          100,000 simulation scenario checker — select conditions to see bracket impact
        </p>
      </div>

      {/* Condition Builder */}
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
      }}>
        <div style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'monospace' }}>
          Scenario Builder
        </div>

        {/* Two toggle rows */}
        {[
          { team: team1, setTeam: setTeam1, round: round1, setRound: setRound1, label: 'Team A' },
          { team: team2, setTeam: setTeam2, round: round2, setRound: setRound2, label: 'Team B' },
        ].map((slot, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#64748b', fontSize: 12, width: 52, fontFamily: 'monospace' }}>{slot.label}</span>
            <select
              value={slot.team}
              onChange={e => slot.setTeam(e.target.value)}
              style={{
                background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569',
                borderRadius: 6, padding: '6px 10px', fontSize: 13, flex: 1, maxWidth: 220,
                fontFamily: 'Georgia, serif'
              }}
            >
              <option value="">Select team...</option>
              {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={slot.round}
              onChange={e => slot.setRound(e.target.value)}
              style={{
                background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569',
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
                background: slot.team && slot.round ? '#2563eb' : '#1e3a5f',
                color: slot.team && slot.round ? '#fff' : '#475569',
                border: 'none', borderRadius: 6, padding: '6px 16px',
                fontSize: 13, cursor: slot.team && slot.round ? 'pointer' : 'default',
                fontFamily: 'monospace', fontWeight: 600, transition: 'background 0.2s'
              }}
            >
              Apply
            </button>
          </div>
        ))}

        {/* Active conditions */}
        {activeConditions.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeConditions.map(c => (
              <div key={c.team} style={{
                background: '#0f172a', border: '1px solid #2563eb',
                borderRadius: 20, padding: '4px 12px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ color: '#93c5fd', fontSize: 13, fontFamily: 'monospace' }}>
                  {c.team} → {ROUND_OPTIONS.find(r => r.value === c.round)?.label}
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
                background: '#7f1d1d', color: '#fca5a5', border: 'none',
                borderRadius: 20, padding: '4px 14px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'monospace'
              }}
            >Clear All</button>
          </div>
        )}

        {querying && (
          <div style={{ color: '#60a5fa', fontSize: 12, marginTop: 10, fontFamily: 'monospace' }}>
            ⟳ Querying {activeConditions[0]?.team ? `${activeConditions.map(c=>c.team).join(' + ')} scenario...` : ''}
          </div>
        )}
      </div>

      {/* Legend */}
      {activeConditions.length > 0 && !querying && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#14532d', text: '#86efac', label: 'Strong boost (>5%)' },
            { color: '#15803d', text: '#dcfce7', label: 'Moderate boost' },
            { color: '#16a34a22', text: '#16a34a', label: 'Small boost' },
            { color: '#dc262611', text: '#dc2626', label: 'Small drop' },
            { color: '#991b1b', text: '#fecaca', label: 'Moderate drop' },
            { color: '#7f1d1d', text: '#fca5a5', label: 'Strong drop (>5%)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: l.color, border: `1px solid ${l.text}` }} />
              <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ color: '#60a5fa', textAlign: 'center', padding: 60, fontFamily: 'monospace' }}>
          Loading simulation data...
        </div>
      ) : error ? (
        <div style={{ color: '#f87171', textAlign: 'center', padding: 60 }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1e3a5f' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '2px solid #1e3a5f' }}>
                <th
                  onClick={() => handleSort('teams')}
                  style={{ ...thStyle, textAlign: 'left', cursor: 'pointer', paddingLeft: 16 }}
                >
                  Team {sortCol === 'teams' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('seed')}
                  style={{ ...thStyle, cursor: 'pointer' }}
                >
                  Seed {sortCol === 'seed' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                {cols.map(c => (
                  <th
                    key={c.key}
                    onClick={() => handleSort(c.key)}
                    style={{ ...thStyle, cursor: 'pointer' }}
                  >
                    {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, idx) => {
                const isConditioned = condTeamSet.has(row.teams);
                const isScenario = row.isScenario;
                const notAffected = row.notAffected;
                const rowBg = isConditioned
                  ? '#1e3a5f'
                  : idx % 2 === 0 ? '#0f172a' : '#111827';

                return (
                  <tr
                    key={row.teams}
                    style={{
                      background: rowBg,
                      borderBottom: '1px solid #1e293b',
                      opacity: notAffected && activeConditions.length > 0 ? 0.4 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {/* Team name */}
                    <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: 16, color: isConditioned ? '#60a5fa' : '#e2e8f0', fontWeight: isConditioned ? 700 : 400 }}>
                      {row.teams === "State John's" ? "St. John's" : row.teams}
                      {isConditioned && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: '#3b82f6', fontFamily: 'monospace', background: '#1e3a5f', padding: '1px 6px', borderRadius: 10, border: '1px solid #2563eb' }}>
                          {ROUND_OPTIONS.find(r => r.value === activeConditions.find(c => c.team === row.teams)?.round)?.label}
                        </span>
                      )}
                    </td>

                    {/* Seed */}
                    <td style={{ ...tdStyle, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {row.seed ? `${REGION_NAMES[row.seed[0]]} ${parseInt(getSeedNum(row.seed))}` : '—'}
                    </td>

                    {/* Stats columns */}
                    {cols.map(c => {
                      const val = row[c.key];
                      const deltaKey = deltaKeys[c.key];
                      const delta = row[deltaKey];
                      const hasDelta = isScenario && delta !== undefined && delta !== null && Math.abs(delta * 100) >= 0.01;
                      const dc = hasDelta ? deltaColor(delta) : null;
                      const bg = hasDelta ? dc.bg : heatBlue(val);
                      const textColor = hasDelta ? dc.text : (val > 0.2 ? '#fff' : val > 0.05 ? '#1e3a8a' : '#64748b');

                      return (
                        <td
                          key={c.key}
                          style={{
                            ...tdStyle,
                            background: bg,
                            color: textColor,
                            fontFamily: 'monospace',
                            fontWeight: hasDelta ? 700 : 400,
                            transition: 'background 0.3s, color 0.3s',
                          }}
                        >
                          {isConditioned ? '—' : (
                            <>
                              {fmt(val)}
                              {hasDelta && (
                                <div style={{ fontSize: 10, opacity: 0.9 }}>
                                  {fmtDelta(delta)}
                                </div>
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

      {/* Footer note */}
      <div style={{ color: '#334155', fontSize: 11, marginTop: 16, fontFamily: 'monospace', textAlign: 'right' }}>
        Based on 100,000 Monte Carlo simulations · CourtViz 2026
      </div>
    </div>
  );
}

const thStyle = {
  padding: '10px 12px',
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: 12,
  textAlign: 'center',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  fontFamily: 'monospace',
  userSelect: 'none',
};

const tdStyle = {
  padding: '8px 12px',
  textAlign: 'center',
  fontSize: 13,
};