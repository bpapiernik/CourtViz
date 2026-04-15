import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Simulator() {
  const [teams, setTeams]     = useState([]);
  const [team1, setTeam1]     = useState(null);
  const [team2, setTeam2]     = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      const batchSize = 1000;
      let start = 0, allRows = [], finished = false;
      while (!finished) {
        const { data, error } = await supabase
          .from('march_madness_sq')
          .select('TEAM,YEAR')
          .range(start, start + batchSize - 1);
        if (error) { console.error('Error fetching team-year combos:', error); return; }
        allRows = allRows.concat(data);
        if (data.length < batchSize) finished = true;
        start += batchSize;
      }
      const uniqueCombos = Array.from(new Set(allRows.map(d => `${d.TEAM}__${d.YEAR}`)))
        .map(combo => {
          const [team, year] = combo.split('__');
          return { team, year: parseInt(year) };
        })
        .sort((a, b) => a.team.localeCompare(b.team) || b.year - a.year);
      setTeams(uniqueCombos);
      setTeam1(uniqueCombos[0]);
      setTeam2(uniqueCombos[1] || uniqueCombos[0]);
    }
    fetchTeams();
  }, []);

  const simulateMatchup = async () => {
    if (!team1 || !team2) return;
    setLoading(true);
    setResult(null);
    setSearched(true);
    try {
      const url = new URL('https://march-madness-api.fly.dev/simulate');
      url.searchParams.append('team1', team1.team);
      url.searchParams.append('team1_year', team1.year);
      url.searchParams.append('team2', team2.team);
      url.searchParams.append('team2_year', team2.year);
      url.searchParams.append('num_simulations', 10000);
      const res  = await fetch(url.toString());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d) => `${(d * 100).toFixed(1)}%`;

  const t1prob = result ? result.team1_win_prob : 0.5;
  const t2prob = result ? result.team2_win_prob : 0.5;
  const winner = result
    ? (t1prob > t2prob ? result.team1 : result.team2)
    : null;

  const selectStyle = {
    background: 'transparent',
    border: '1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 14,
    color: 'var(--foreground)',
    fontFamily: 'var(--font-sans)',
    width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    cursor: 'pointer',
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.45,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <>
      <style>{`
        .sim-select:focus {
          outline: none;
          border-color: var(--navbar) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--navbar) 25%, transparent);
        }
        .sim-btn:hover { opacity: 0.85; }
        .sim-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { width: 0%; }
        }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .team-card:hover { 
          border-color: color-mix(in srgb, var(--navbar) 80%, transparent) !important;
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏀</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px' }}>
            CBB Matchup Simulator
          </h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.45 }}>
            Pick any two teams from any year and simulate 10,000 games.
          </p>
        </div>

        {/* Team selectors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 12,
          alignItems: 'end',
          marginBottom: 20,
        }}>
          {/* Team 1 */}
          <div
            className="team-card"
            style={{
              background: 'color-mix(in srgb, var(--navbar) 12%, transparent)',
              border: '1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)',
              borderRadius: 10,
              padding: 16,
              transition: 'border-color 0.15s',
            }}
          >
            <label style={labelStyle}>Team 1</label>
            <select
              className="sim-select"
              value={team1 ? `${team1.team}__${team1.year}` : ''}
              onChange={e => {
                const [t, y] = e.target.value.split('__');
                setTeam1({ team: t, year: parseInt(y) });
                setResult(null);
              }}
              style={selectStyle}
            >
              {teams.map(({ team, year }) => (
                <option key={`${team}__${year}`} value={`${team}__${year}`}>
                  {team} ({year})
                </option>
              ))}
            </select>
            {result && (
              <div style={{ marginTop: 12, textAlign: 'center' }} className="fade-up">
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: t1prob > t2prob ? '#059669' : '#dc2626',
                }}>
                  {fmt(t1prob)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.45, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  win probability
                </div>
              </div>
            )}
          </div>

          {/* VS divider */}
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            opacity: 0.35,
            letterSpacing: 2,
            paddingBottom: result ? 52 : 4,
            transition: 'padding-bottom 0.3s',
          }}>
            VS
          </div>

          {/* Team 2 */}
          <div
            className="team-card"
            style={{
              background: 'color-mix(in srgb, var(--navbar) 12%, transparent)',
              border: '1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)',
              borderRadius: 10,
              padding: 16,
              transition: 'border-color 0.15s',
            }}
          >
            <label style={labelStyle}>Team 2</label>
            <select
              className="sim-select"
              value={team2 ? `${team2.team}__${team2.year}` : ''}
              onChange={e => {
                const [t, y] = e.target.value.split('__');
                setTeam2({ team: t, year: parseInt(y) });
                setResult(null);
              }}
              style={selectStyle}
            >
              {teams.map(({ team, year }) => (
                <option key={`${team}__${year}`} value={`${team}__${year}`}>
                  {team} ({year})
                </option>
              ))}
            </select>
            {result && (
              <div style={{ marginTop: 12, textAlign: 'center' }} className="fade-up">
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: t2prob > t1prob ? '#059669' : '#dc2626',
                }}>
                  {fmt(t2prob)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.45, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  win probability
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simulate button */}
        <button
          className="sim-btn"
          onClick={simulateMatchup}
          disabled={loading || !team1 || !team2}
          style={{
            width: '100%',
            background: 'var(--navbar)',
            color: 'var(--foreground)',
            border: 'none',
            borderRadius: 8,
            padding: '12px 0',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            marginBottom: 24,
          }}
        >
          {loading ? 'Simulating 10,000 games…' : 'Simulate Matchup'}
        </button>

        {/* Result bar */}
        {result && !loading && (
          <div className="fade-up" style={{
            border: '1.5px solid color-mix(in srgb, var(--navbar) 50%, transparent)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            {/* Winner banner */}
            <div style={{
              background: 'color-mix(in srgb, var(--navbar) 25%, transparent)',
              padding: '14px 20px',
              textAlign: 'center',
              borderBottom: '1px solid color-mix(in srgb, var(--navbar) 40%, transparent)',
            }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.45, letterSpacing: 1, textTransform: 'uppercase' }}>
                Projected Winner
              </span>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                {winner} &nbsp;
                <span style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                  {fmt(Math.max(t1prob, t2prob))}
                </span>
              </div>
            </div>

            {/* Probability bar */}
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{result.team1} ({result.team1_year})</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{result.team2} ({result.team2_year})</span>
              </div>

              {/* Bar track */}
              <div style={{
                height: 10,
                borderRadius: 99,
                background: 'color-mix(in srgb, var(--foreground) 8%, transparent)',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  width: `${t1prob * 100}%`,
                  background: t1prob > t2prob ? '#059669' : '#dc2626',
                  borderRadius: 99,
                  animation: 'growBar 0.6s ease both',
                  transition: 'width 0.6s ease',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: t1prob > t2prob ? '#059669' : '#dc2626',
                }}>{fmt(t1prob)}</span>
                <span style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: t2prob > t1prob ? '#059669' : '#dc2626',
                }}>{fmt(t2prob)}</span>
              </div>

              <p style={{ margin: '14px 0 0', fontSize: 11, opacity: 0.35, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                Based on 10,000 simulated games
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
