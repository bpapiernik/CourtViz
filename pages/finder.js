// pages/finder.js

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

const statNameMap = {
  "DIST_MILES_OFF_SpeedDistance_pct": "Distance Miles (Offense)",
  "DIST_MILES_DEF_SpeedDistance_pct": "Distance Miles (Defense)",
  "AVG_SPEED_SpeedDistance_pct": "Average Speed (Total)",
  "AVG_SPEED_OFF_SpeedDistance_pct": "Average Speed (Offense)",
  "AVG_SPEED_DEF_SpeedDistance_pct": "Average Speed (Defensive)",
  "OREB_Rebounding_pct": "OREB %",
  "OREB_CONTEST_Rebounding_pct": "Contested OREB",
  "OREB_CONTEST_PCT_Rebounding_pct": "Contested OREB %",
  "OREB_CHANCES_Rebounding_pct": "OREB Chances",
  "OREB_CHANCE_PCT_Rebounding_pct": "OREB Chance %",
  "OREB_UNCONTEST_Rebounding_pct": "Uncontested OREB",
  "AVG_OREB_DIST_Rebounding_pct": "Avg OREB Distance",
  "DREB_Rebounding_pct": "DREB %",
  "DREB_CONTEST_Rebounding_pct": "Contested DREB",
  "DREB_CONTEST_PCT_Rebounding_pct": "Contested DREB %",
  "DREB_CHANCES_Rebounding_pct": "DREB Chances",
  "DREB_CHANCE_PCT_Rebounding_pct": "DREB Chance %",
  "DREB_UNCONTEST_Rebounding_pct": "Uncontested DREB",
  "AVG_DREB_DIST_Rebounding_pct": "Avg DREB Distance",
  "CATCH_SHOOT_PTS_CatchShoot_pct": "Catch & Shoot PTS",
  "CATCH_SHOOT_FGM_CatchShoot_pct": "Catch & Shoot FGM",
  "CATCH_SHOOT_FGA_CatchShoot_pct": "Catch & Shoot FGA",
  "CATCH_SHOOT_FG_PCT_CatchShoot_pct": "Catch & Shoot FG%",
  "CATCH_SHOOT_FG3M_CatchShoot_pct": "Catch & Shoot 3PM",
  "CATCH_SHOOT_FG3A_CatchShoot_pct": "Catch & Shoot 3PA",
  "CATCH_SHOOT_FG3_PCT_CatchShoot_pct": "Catch & Shoot 3P%",
  "CATCH_SHOOT_EFG_PCT_CatchShoot_pct": "Catch & Shoot eFG%",
  "PULL_UP_PTS_PullUpShot_pct": "Pull Up PTS",
  "PULL_UP_FGM_PullUpShot_pct": "Pull Up FGM",
  "PULL_UP_FGA_PullUpShot_pct": "Pull Up FGA",
  "PULL_UP_FG_PCT_PullUpShot_pct": "Pull Up FG%",
  "PULL_UP_FG3M_PullUpShot_pct": "Pull Up 3PM",
  "PULL_UP_FG3A_PullUpShot_pct": "Pull Up 3PA",
  "PULL_UP_FG3_PCT_PullUpShot_pct": "Pull Up 3P%",
  "PULL_UP_EFG_PCT_PullUpShot_pct": "Pull-Up eFG%",
  "DRIVES_Drives_pct": "Drives",
  "DRIVE_PTS_Drives_pct": "Drive PTS",
  "DRIVE_PTS_PCT_Drives_pct": "Drive PTS %",
  "DRIVE_FGM_Drives_pct": "Drive FGM",
  "DRIVE_FGA_Drives_pct": "Drive FGA",
  "DRIVE_FG_PCT_Drives_pct": "Drive FG%",
  "DRIVE_FTA_Drives_pct": "Drive FTA",
  "DRIVE_PASSES_PCT_Drives_pct": "Drive Pass %",
  "DRIVE_AST_PCT_Drives_pct": "Drive AST %",
  "DRIVE_TOV_PCT_Drives_pct": "Drive TOV %",
  "DRIVE_PF_PCT_Drives_pct": "Drive PF %",
  "PASSES_MADE_Passing_pct": "Passes Made",
  "PASSES_RECEIVED_Passing_pct": "Passes Received",
  "AST_Passing_pct": "Assists",
  "SECONDARY_AST_Passing_pct": "Secondary AST",
  "POTENTIAL_AST_Passing_pct": "Potential AST",
  "FT_AST_Passing_pct": "FT Assists",
  "AST_POINTS_CREATED_Passing_pct": "AST Points Created",
  "AST_ADJ_Passing_pct": "Adjusted AST",
  "AST_TO_PASS_PCT_Passing_pct": "AST to Pass %",
  "ELBOW_TOUCHES_ElbowTouch_pct": "Elbow Touches",
  "ELBOW_TOUCH_PTS_ElbowTouch_pct": "Elbow Touch PTS",
  "ELBOW_TOUCH_PTS_PCT_ElbowTouch_pct": "Elbow Touch PTS %",
  "ELBOW_TOUCH_FGM_ElbowTouch_pct": "Elbow Touch FGM",
  "ELBOW_TOUCH_FGA_ElbowTouch_pct": "Elbow Touch FGA",
  "ELBOW_TOUCH_FG_PCT_ElbowTouch_pct": "Elbow Touch FG%",
  "ELBOW_TOUCH_FTA_ElbowTouch_pct": "Elbow Touch FTA",
  "ELBOW_TOUCH_AST_PCT_ElbowTouch_pct": "Elbow Touch AST %",
  "ELBOW_TOUCH_PASSES_PCT_ElbowTouch_pct": "Elbow Touch Pass %",
  "ELBOW_TOUCH_TOV_PCT_ElbowTouch_pct": "Elbow Touch TOV %",
  "POST_TOUCHES_PostTouch_pct": "Post Touches",
  "POST_TOUCH_PTS_PostTouch_pct": "Post Touch PTS",
  "POST_TOUCH_PTS_PCT_PostTouch_pct": "Post Touch PTS %",
  "POST_TOUCH_FGM_PostTouch_pct": "Post Touch FGM",
  "POST_TOUCH_FGA_PostTouch_pct": "Post Touch FGA",
  "POST_TOUCH_FG_PCT_PostTouch_pct": "Post Touch FG%",
  "POST_TOUCH_FTA_PostTouch_pct": "Post Touch FTA",
  "POST_TOUCH_AST_PCT_PostTouch_pct": "Post Touch AST %",
  "POST_TOUCH_PASSES_PCT_PostTouch_pct": "Post Touch Pass %",
  "POST_TOUCH_TOV_PCT_PostTouch_pct": "Post Touch TOV %",
  "PAINT_TOUCHES_PaintTouch_pct": "Paint Touches",
  "PAINT_TOUCH_PTS_PaintTouch_pct": "Paint Touch PTS",
  "PAINT_TOUCH_PTS_PCT_PaintTouch_pct": "Paint Touch PTS %",
  "PAINT_TOUCH_FGM_PaintTouch_pct": "Paint Touch FGM",
  "PAINT_TOUCH_FGA_PaintTouch_pct": "Paint Touch FGA",
  "PAINT_TOUCH_FG_PCT_PaintTouch_pct": "Paint Touch FG%",
  "PAINT_TOUCH_FTA_PaintTouch_pct": "Paint Touch FTA",
  "PAINT_TOUCH_AST_PCT_PaintTouch_pct": "Paint Touch AST %",
  "PAINT_TOUCH_PASSES_PCT_PaintTouch_pct": "Paint Touch Pass %",
  "PAINT_TOUCH_TOV_PCT_PaintTouch_pct": "Paint Touch TOV %",
};

const synergyPlaytypes = [
  { type: 'offensive', playType: 'Cut' },
  { type: 'offensive', playType: 'Handoff' },
  { type: 'offensive', playType: 'Isolation' },
  { type: 'offensive', playType: 'Misc' },
  { type: 'offensive', playType: 'PRBallHandler' },
  { type: 'offensive', playType: 'Spotup' },
  { type: 'offensive', playType: 'Postup' },
  { type: 'offensive', playType: 'Transition' },
  { type: 'offensive', playType: 'OffScreen' },
  { type: 'offensive', playType: 'OffRebound' },
  { type: 'offensive', playType: 'PRRollman' },
  { type: 'defensive', playType: 'Postup' },
  { type: 'defensive', playType: 'Isolation' },
  { type: 'defensive', playType: 'PRRollman' },
  { type: 'defensive', playType: 'Handoff' },
  { type: 'defensive', playType: 'PRBallHandler' },
  { type: 'defensive', playType: 'OffScreen' },
  { type: 'defensive', playType: 'Spotup' },
];

const availableStats = [
  ...Object.entries(statNameMap).map(([key, label]) => ({ key, label, source: 'playtype' })),
  ...synergyPlaytypes.map(({ type, playType }) => ({
    key: `synergy:${type}:${playType}`,
    label: `Synergy (${type[0].toUpperCase() + type.slice(1)}) – ${playType}`,
    source: 'synergy',
  })),
];

const SEASONS = [
  '2025-26','2024-25','2023-24','2022-23','2021-22','2020-21',
  '2019-20','2018-19','2017-18','2016-17','2015-16',
];

// Percentile → color
function pctColor(val) {
  if (val >= 80) return '#059669';
  if (val >= 60) return '#d97706';
  if (val >= 40) return 'var(--foreground)';
  return '#dc2626';
}

export default function Finder() {
  const [ageMin, setAgeMin]       = useState(18);
  const [ageMax, setAgeMax]       = useState(25);
  const [season, setSeason]       = useState('2024-25');
  const [statFilters, setStatFilters] = useState([
    { stat: 'CATCH_SHOOT_EFG_PCT_CatchShoot_pct', min: 50 },
  ]);
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);

    const { data: baseData, error: baseError } = await supabase
      .from('playtype_percentiles')
      .select('*')
      .eq('season', season);

    if (baseError) { console.error(baseError); setLoading(false); return; }

    const { data: ageData, error: ageError } = await supabase
      .from('playtype_percentiles_age')
      .select('PLAYER_ID, season, age')
      .eq('season', season);

    if (ageError) { console.error(ageError); setLoading(false); return; }

    const seasonAgeMap = new Map((ageData || []).map(p => [p.PLAYER_ID, p.age]));
    const merged = (baseData || []).map(player => ({
      ...player,
      AGE: seasonAgeMap.get(player.PLAYER_ID) ?? null,
    }));

    // Paginate synergy
    async function fetchAllSynergyRows(season) {
      const batchSize = 1000;
      let start = 0, allRows = [];
      while (true) {
        const { data, error } = await supabase
          .from('synergy')
          .select('PLAYER_ID, PLAY_TYPE, TYPE_GROUPING, PPP, SEASON, PERCENTILE')
          .eq('SEASON', season)
          .order('PLAYER_ID', { ascending: true })
          .range(start, start + batchSize - 1);
        if (error) return { data: null, error };
        allRows = allRows.concat(data);
        if (data.length < batchSize) break;
        start += batchSize;
      }
      return { data: allRows, error: null };
    }

    const { data: synergyAll, error: synergyAllError } = await fetchAllSynergyRows(season);
    if (synergyAllError) { console.error(synergyAllError); setLoading(false); return; }

    const ageLookup = new Map(merged.map(p => [p.PLAYER_ID, p.AGE]));
    const allSynergyRows = (synergyAll || []).map(row => ({
      ...row,
      AGE: ageLookup.get(row.PLAYER_ID) ?? null,
    }));

    const synergyMap = new Map();
    allSynergyRows.forEach(row => {
      if (!synergyMap.has(row.PLAYER_ID)) synergyMap.set(row.PLAYER_ID, []);
      synergyMap.get(row.PLAYER_ID).push(row);
    });

    const filtered = merged.filter(player => {
      const synergyRows = synergyMap.get(player.PLAYER_ID) || [];
      const age = player.AGE ?? (synergyRows[0]?.AGE ?? null);
      if (!age || age > ageMax || age < ageMin) return false;
      return statFilters.every(filter => {
        if (filter.stat.startsWith('synergy:')) {
          const [, typeGroup, playType] = filter.stat.split(':');
          const match = synergyRows.find(s => s.TYPE_GROUPING === typeGroup && s.PLAY_TYPE === playType);
          return (match?.PERCENTILE || 0) >= filter.min / 100;
        }
        return (player[filter.stat] || 0) >= filter.min / 100;
      });
    });

    setResults(filtered.map(player => ({
      ...player,
      synergy: synergyMap.get(player.PLAYER_ID) || [],
    })));
    setLoading(false);
  };

  const addFilter = () =>
    setStatFilters([...statFilters, { stat: availableStats[0].key, min: 50 }]);

  const removeFilter = (i) =>
    setStatFilters(statFilters.filter((_, idx) => idx !== i));

  const updateFilter = (i, field, value) => {
    const next = [...statFilters];
    next[i] = { ...next[i], [field]: value };
    setStatFilters(next);
  };

  // Shared input style
  const inputStyle = {
    background: 'transparent',
    border: '1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
    borderRadius: 7,
    padding: '7px 10px',
    fontSize: 13,
    color: 'var(--foreground)',
    fontFamily: 'var(--font-sans)',
    width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.5,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <>
      <style>{`
        .finder-input:focus {
          outline: none;
          border-color: var(--navbar) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--navbar) 25%, transparent);
        }
        .result-row:hover {
          background: color-mix(in srgb, var(--navbar) 18%, transparent);
        }
        .remove-btn:hover { opacity: 1 !important; }
        .search-btn:hover { opacity: 0.88; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.25s ease both; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Player Finder</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.45 }}>
            Filter players by age, season, and percentile thresholds across tracking and synergy stats.
          </p>
        </div>

        {/* Controls card */}
        <div style={{
          background: 'color-mix(in srgb, var(--navbar) 15%, transparent)',
          border: '1.5px solid color-mix(in srgb, var(--navbar) 50%, transparent)',
          borderRadius: 12,
          padding: '24px',
          marginBottom: 24,
        }}>

          {/* Row 1: Season + Age */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={labelStyle}>Season</label>
              <select
                className="finder-input"
                value={season}
                onChange={e => setSeason(e.target.value)}
                style={inputStyle}
              >
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={labelStyle}>Min Age</label>
              <input
                className="finder-input"
                type="number"
                value={ageMin}
                onChange={e => setAgeMin(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={labelStyle}>Max Age</label>
              <input
                className="finder-input"
                type="number"
                value={ageMax}
                onChange={e => setAgeMax(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Stat filters */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Stat Filters — Minimum Percentile</label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {statFilters.map((filter, i) => (
                <div key={i} className="fade-in" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Stat selector */}
                  <select
                    className="finder-input"
                    value={filter.stat}
                    onChange={e => updateFilter(i, 'stat', e.target.value)}
                    style={{ ...inputStyle, flex: '1 1 280px', width: 'auto' }}
                  >
                    <optgroup label="Tracking Stats">
                      {availableStats.filter(s => s.source === 'playtype').map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Synergy">
                      {availableStats.filter(s => s.source === 'synergy').map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Min percentile input + bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
                    <span style={{ fontSize: 11, opacity: 0.45, fontFamily: 'var(--font-mono)' }}>≥</span>
                    <input
                      className="finder-input"
                      type="number"
                      min={0}
                      max={100}
                      value={filter.min}
                      onChange={e => updateFilter(i, 'min', Number(e.target.value))}
                      style={{ ...inputStyle, width: 64, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 11, opacity: 0.45, fontFamily: 'var(--font-mono)' }}>%ile</span>
                  </div>

                  {/* Remove */}
                  <button
                    className="remove-btn"
                    onClick={() => removeFilter(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: 18,
                      lineHeight: 1,
                      padding: '0 4px',
                      opacity: 0.6,
                      transition: 'opacity 0.15s',
                    }}
                  >×</button>
                </div>
              ))}
            </div>

            <button
              onClick={addFilter}
              style={{
                marginTop: 12,
                background: 'none',
                border: '1.5px dashed color-mix(in srgb, var(--foreground) 20%, transparent)',
                borderRadius: 7,
                padding: '6px 16px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--foreground)',
                opacity: 0.6,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                width: '100%',
              }}
              onMouseEnter={e => e.target.style.opacity = 1}
              onMouseLeave={e => e.target.style.opacity = 0.6}
            >
              + Add Stat Filter
            </button>
          </div>

          {/* Search button */}
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={loading}
            style={{
              background: 'var(--navbar)',
              color: 'var(--foreground)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 28px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Searching…' : 'Find Players'}
          </button>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Results</h2>
              <span style={{
                background: 'var(--navbar)',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>
                {results.length} player{results.length !== 1 ? 's' : ''}
              </span>
            </div>

            {results.length === 0 ? (
              <div style={{
                padding: 40,
                textAlign: 'center',
                opacity: 0.4,
                fontSize: 14,
                border: '1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)',
                borderRadius: 10,
              }}>
                No players matched your filters.
              </div>
            ) : (
              <div style={{
                borderRadius: 10,
                border: '1.5px solid color-mix(in srgb, var(--navbar) 60%, transparent)',
                overflow: 'hidden',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                    <thead>
                      <tr style={{ background: 'color-mix(in srgb, var(--navbar) 30%, transparent)' }}>
                        <th style={{
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          opacity: 0.5,
                          borderBottom: '2px solid color-mix(in srgb, var(--navbar) 70%, transparent)',
                          whiteSpace: 'nowrap',
                        }}>
                          Player
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          opacity: 0.5,
                          borderBottom: '2px solid color-mix(in srgb, var(--navbar) 70%, transparent)',
                        }}>
                          Age
                        </th>
                        {statFilters.map((filter, idx) => (
                          <th key={idx} style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            opacity: 0.5,
                            borderBottom: '2px solid color-mix(in srgb, var(--navbar) 70%, transparent)',
                            whiteSpace: 'nowrap',
                            maxWidth: 140,
                          }}>
                            {availableStats.find(s => s.key === filter.stat)?.label || filter.stat}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((player, rowIdx) => (
                        <tr
                          key={player.PLAYER_ID}
                          className="result-row"
                          style={{
                            borderBottom: '1px solid color-mix(in srgb, var(--foreground) 6%, transparent)',
                            animation: `fadeIn 0.2s ease both`,
                            animationDelay: `${Math.min(rowIdx * 20, 400)}ms`,
                          }}
                        >
                          <td style={{ padding: '10px 16px' }}>
                            <Link
                              href={`/player/${player.PLAYER_ID}`}
                              style={{
                                color: 'var(--foreground)',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: 14,
                              }}
                            >
                              {player.PLAYER_NAME}
                            </Link>
                          </td>
                          <td style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            opacity: 0.6,
                          }}>
                            {player.AGE ?? '—'}
                          </td>
                          {statFilters.map((filter, idx) => {
                            let displayVal, pct;

                            if (filter.stat.startsWith('synergy:')) {
                              const [, typeGroup, playType] = filter.stat.split(':');
                              const match = (player.synergy || []).find(
                                s => s.TYPE_GROUPING === typeGroup && s.PLAY_TYPE === playType
                              );
                              displayVal = match?.PPP != null ? match.PPP.toFixed(2) : '—';
                              pct = match?.PERCENTILE != null ? Math.round(match.PERCENTILE * 100) : null;
                            } else {
                              pct = Math.round((player[filter.stat] || 0) * 100);
                              displayVal = `${pct}%`;
                            }

                            return (
                              <td key={idx} style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: pct != null ? pctColor(pct) : 'var(--foreground)',
                                }}>
                                  {displayVal}
                                </span>
                                {pct != null && (
                                  <div style={{
                                    fontSize: 9,
                                    fontFamily: 'var(--font-mono)',
                                    opacity: 0.4,
                                    marginTop: 1,
                                  }}>
                                    {pct}%ile
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
