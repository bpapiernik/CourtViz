// pages/finder.js

// pages/finder.js

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

const statNameMap = {
  // Speed Distance
  "DIST_MILES_OFF_SpeedDistance_pct": "Distance Miles (Offense)",
  "DIST_MILES_DEF_SpeedDistance_pct": "Distance Miles (Defense)",
  "AVG_SPEED_SpeedDistance_pct": "Average Speed (Total)",
  "AVG_SPEED_OFF_SpeedDistance_pct": "Average Speed (Offense)",
  "AVG_SPEED_DEF_SpeedDistance_pct": "Average Speed (Defensive)",

  // Rebounding
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

  // Catch and Shoot
  "CATCH_SHOOT_PTS_CatchShoot_pct": "Points (PTS)",
  "CATCH_SHOOT_FGM_CatchShoot_pct": "Field Goals Made (FGM)",
  "CATCH_SHOOT_FGA_CatchShoot_pct": "Field Goals Attempts (FGA)",
  "CATCH_SHOOT_FG_PCT_CatchShoot_pct": "Field Goal % (FG%)",
  "CATCH_SHOOT_FG3M_CatchShoot_pct": "3 Pointer Made (3PM)",
  "CATCH_SHOOT_FG3A_CatchShoot_pct": "3 Pointer Attempts (3PA)",
  "CATCH_SHOOT_FG3_PCT_CatchShoot_pct": "3 Point % (3P%)",
  "CATCH_SHOOT_EFG_PCT_CatchShoot_pct": "Catch & Shoot eFG%",

  // Pull Up Shots
  "PULL_UP_PTS_PullUpShot_pct": "Points (PTS)",
  "PULL_UP_FGM_PullUpShot_pct": "Field Goals Made (FGM)",
  "PULL_UP_FGA_PullUpShot_pct": "Field Goals Attempts (FGA)",
  "PULL_UP_FG_PCT_PullUpShot_pct": "Field Goal % (FG%)",
  "PULL_UP_FG3M_PullUpShot_pct": "3 Pointer Made (3PM)",
  "PULL_UP_FG3A_PullUpShot_pct": "3 Pointer Attempts (3PA)",
  "PULL_UP_FG3_PCT_PullUpShot_pct": "3 Point % (3P%)",
  "PULL_UP_EFG_PCT_PullUpShot_pct": "Pull-Up eFG%",

  // Drives
  "DRIVES_Drives_pct": "Drives",
  "DRIVE_PTS_Drives_pct": "Points (PTS)",
  "DRIVE_PTS_PCT_Drives_pct": "Points % (PTS %)",
  "DRIVE_FGM_Drives_pct": "Field Goals Made (FGM)",
  "DRIVE_FGA_Drives_pct": "Field Goals Attempts (FGA)",
  "DRIVE_FG_PCT_Drives_pct": "Field Goal % (FG%)",
  "DRIVE_FTA_Drives_pct": "Free Throw Attempts (FTA)",
  "DRIVE_PASSES_PCT_Drives_pct": "Pass %",
  "DRIVE_AST_PCT_Drives_pct": "Assist %",
  "DRIVE_TOV_PCT_Drives_pct": "Turnover %",
  "DRIVE_PF_PCT_Drives_pct": "Personal Foul %",

  // Passing
  "PASSES_MADE_Passing_pct": "Passes Made",
  "PASSES_RECEIVED_Passing_pct": "Passes Received",
  "AST_Passing_pct": "Assists",
  "SECONDARY_AST_Passing_pct": "Secondary Assists",
  "POTENTIAL_AST_Passing_pct": "Potential Assists",
  "FT_AST_Passing_pct": "Free Throw Assists",
  "AST_POINTS_CREATED_Passing_pct": "Assist Point Created",
  "AST_ADJ_Passing_pct": "Adjusted Assists",
  "AST_TO_PASS_PCT_Passing_pct": "Assist to Pass %",

  // Elbow Touches
  "ELBOW_TOUCHES_ElbowTouch_pct": "Elbow Touches",
  "ELBOW_TOUCH_PTS_ElbowTouch_pct": "Points (PTS)",
  "ELBOW_TOUCH_PTS_PCT_ElbowTouch_pct": "Points % (PTS %)",
  "ELBOW_TOUCH_FGM_ElbowTouch_pct": "Field Goals Made (FGM)",
  "ELBOW_TOUCH_FGA_ElbowTouch_pct": "Field Goals Attempts (FGA)",
  "ELBOW_TOUCH_FG_PCT_ElbowTouch_pct": "Field Goal % (FG%)",
  "ELBOW_TOUCH_FTA_ElbowTouch_pct": "Free Throw Attempts (FTA)",
  "ELBOW_TOUCH_AST_PCT_ElbowTouch_pct": "Assist %",
  "ELBOW_TOUCH_PASSES_PCT_ElbowTouch_pct": "Pass %",
  "ELBOW_TOUCH_TOV_PCT_ElbowTouch_pct": "Turnover %",

  // Post Touches
  "POST_TOUCHES_PostTouch_pct": "Post Touches",
  "POST_TOUCH_PTS_PostTouch_pct": "Points (PTS)",
  "POST_TOUCH_PTS_PCT_PostTouch_pct": "Points % (PTS %)",
  "POST_TOUCH_FGM_PostTouch_pct": "Field Goals Made (FGM)",
  "POST_TOUCH_FGA_PostTouch_pct": "Field Goals Attempts (FGA)",
  "POST_TOUCH_FG_PCT_PostTouch_pct": "Field Goal % (FG%)",
  "POST_TOUCH_FTA_PostTouch_pct": "Free Throw Attempts (FTA)",
  "POST_TOUCH_AST_PCT_PostTouch_pct": "Assist %",
  "POST_TOUCH_PASSES_PCT_PostTouch_pct": "Pass %",
  "POST_TOUCH_TOV_PCT_PostTouch_pct":  "Turnover %",

  // Paint Touches
  "PAINT_TOUCHES_PaintTouch_pct": "Paint Touches",
  "PAINT_TOUCH_PTS_PaintTouch_pct": "Points (PTS)",
  "PAINT_TOUCH_PTS_PCT_PaintTouch_pct": "Points % (PTS %)",
  "PAINT_TOUCH_FGM_PaintTouch_pct": "Field Goals Made (FGM)",
  "PAINT_TOUCH_FGA_PaintTouch_pct": "Field Goals Attempts (FGA)",
  "PAINT_TOUCH_FG_PCT_PaintTouch_pct": "Field Goal % (FG%)",
  "PAINT_TOUCH_FTA_PaintTouch_pct": "Free Throw Attempts (FTA)",
  "PAINT_TOUCH_AST_PCT_PaintTouch_pct": "Assist %",
  "PAINT_TOUCH_PASSES_PCT_PaintTouch_pct": "Pass %",
  "PAINT_TOUCH_TOV_PCT_PaintTouch_pct": "Turnover %"
};

const synergyOffensiveMap = [
  'Cut',
  'Handoff',
  'Isolation',
  'Misc',
  'PRBallHandler',
  'Spotup',
  'Postup',
  'Transition',
  'OffScreen',
  'OffRebound',
  'PRRollman'
];

const synergyDefensiveMap = [
  'Postup',
  'Isolation',
  'PRRollman',
  'Handoff',
  'PRBallHandler',
  'OffScreen',
  'Spotup'
];


const availableStats = [
  ...Object.entries(statNameMap).map(([key, label]) => ({ key, label, source: 'playtype' })),
  ...synergyOffensiveMap.map(playType => ({
    key: `synergy:offensive:${playType}`,
    label: `Synergy (Offensive) – ${playType}`,
    source: 'synergy'
  })),
  ...synergyDefensiveMap.map(playType => ({
    key: `synergy:defensive:${playType}`,
    label: `Synergy (Defensive) – ${playType}`,
    source: 'synergy'
  }))
];

export default function Finder() {
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(25);
  const [season, setSeason] = useState('2024-25');
  const [statFilters, setStatFilters] = useState([
    { stat: 'CATCH_SHOOT_EFG_PCT_CatchShoot_pct', min: 50 }
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    // Step 1: Fetch playtype data for the selected season
    const { data: baseData, error: baseError } = await supabase
      .from('playtype_percentiles')
      .select('*')
      .eq('season', season);

    if (baseError) {
      console.error("Base data error:", baseError);
      setLoading(false);
      return;
    }

    // Step 2: Fetch age data and filter to selected season
    const { data: ageData, error: ageError } = await supabase
      .from('playtype_percentiles_age')
      .select('PLAYER_ID, season, age')
      .eq('season', season);

    if (ageError) {
      console.error("Age data error:", ageError);
      setLoading(false);
      return;
    }

    const seasonAgeMap = new Map(
      (ageData || []).map(p => [p.PLAYER_ID, p.age])
    );

    const merged = (baseData || []).map(player => ({
      ...player,
      AGE: seasonAgeMap.get(player.PLAYER_ID) ?? null
    }));

    const { data: synergyOff, error: synergyOffError } = await supabase
    .from('synergy')
    .select('PLAYER_ID, PLAY_TYPE, TYPE_GROUPING, PPP, SEASON')
    .eq('SEASON', season)
    .eq('TYPE_GROUPING', 'offensive');

  const { data: synergyDef, error: synergyDefError } = await supabase
    .from('synergy')
    .select('PLAYER_ID, PLAY_TYPE, TYPE_GROUPING, PPP, SEASON')
    .eq('SEASON', season)
    .eq('TYPE_GROUPING', 'defensive');

  if (synergyOffError || synergyDefError) {
    console.error("Synergy errors:", synergyOffError, synergyDefError);
    setLoading(false);
    return;
  }

  // Build a composite synergy map with keys like "201942-defensive-Spotup"
  const synergyMap = new Map();
  [...(synergyOff || []), ...(synergyDef || [])].forEach(row => {
    const key = `${String(row.PLAYER_ID)}-${row.TYPE_GROUPING}-${row.PLAY_TYPE}`;
    synergyMap.set(key, row.PPP);
  });

  // Filter players
  const filtered = merged.filter(player => {
    if (!player.AGE || player.AGE > ageMax || player.AGE < ageMin) return false;

    return statFilters.every(filter => {
      if (filter.stat.startsWith('synergy:')) {
        const [_prefix, typeGroup, playType] = filter.stat.split(':');
        const key = `${String(player.PLAYER_ID)}-${typeGroup}-${playType}`;
        const ppp = synergyMap.get(key) || 0;
        return ppp >= filter.min / 100;
      } else {
        return (player[filter.stat] || 0) >= (filter.min / 100);
      }
    });
  });

  // Enrich with synergy entries (optional)
  const enriched = filtered.map(player => ({
    ...player,
    synergy: synergyMap  // Optional, not used directly anymore
  }));

  setResults(enriched);
  setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Custom Player Finder</h2>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block font-semibold mb-1">Season:</label>
          <select className="border p-2 rounded w-full" value={season} onChange={(e) => setSeason(e.target.value)}>
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
            <option value="2021-22">2021-22</option>
            <option value="2020-21">2020-21</option>
            <option value="2019-20">2019-20</option>
            <option value="2018-19">2018-19</option>
            <option value="2017-18">2017-18</option>
            <option value="2016-17">2016-17</option>
            <option value="2015-16">2015-16</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Min Age:</label>
          <input type="number" className="border p-2 rounded w-full" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} />
        </div>

        <div>
          <label className="block font-semibold mb-1">Max Age:</label>
          <input type="number" className="border p-2 rounded w-full" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">Stat Filters (Percentiles):</h3>
      {statFilters.map((filter, index) => (
        <div key={index} className="flex gap-4 items-center mb-2">
          <select
            value={filter.stat}
            onChange={(e) => {
              const newFilters = [...statFilters];
              newFilters[index].stat = e.target.value;
              setStatFilters(newFilters);
            }}
            className="border px-2 py-1 rounded"
          >
            {availableStats.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={filter.min}
            onChange={(e) => {
              const newFilters = [...statFilters];
              newFilters[index].min = Number(e.target.value);
              setStatFilters(newFilters);
            }}
            className="border px-2 py-1 rounded w-24"
            placeholder="Min %"
          />
          <button
            onClick={() => setStatFilters(statFilters.filter((_, i) => i !== index))}
            className="text-red-500 font-bold"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        onClick={() => setStatFilters([...statFilters, { stat: availableStats[0].key, min: 50 }])}
        className="text-sm text-blue-600 mt-2 mb-6"
      >
        + Add Another Stat Filter
      </button>

      <button onClick={handleSearch} className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700">
        Find Players
      </button>

      {loading && <p className="mt-4">Loading...</p>}

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Results:</h3>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Player Name</th>
                
                {statFilters.map((filter, idx) => (
                  <th key={idx} className="border px-2 py-1">
                    {availableStats.find(s => s.key === filter.stat)?.label || filter.stat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(player => (
                <tr key={player.PLAYER_ID} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-blue-700 underline">
                    <Link href={`/player/${player.PLAYER_ID}`}>{player.PLAYER_NAME}</Link>
                  </td>
                  
                  {statFilters.map((filter, idx) => {
                    if (filter.stat.startsWith('synergy:')) {
                      const [_prefix, typeGroup, playType] = filter.stat.split(':');
                      const matching = (player.synergy || []).find(s => s.TYPE_GROUPING === typeGroup && s.PLAY_TYPE === playType);
                      return <td key={idx} className="border px-2 py-1">{matching?.PPP?.toFixed(2) || '—'}</td>;
                    }
                    return <td key={idx} className="border px-2 py-1">{Math.round((player[filter.stat] || 0) * 100)}%</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
