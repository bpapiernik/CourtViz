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
  "CATCH_SHOOT_PTS_CatchShoot_pct": "Catch & Shoot Points (PTS)",
  "CATCH_SHOOT_FGM_CatchShoot_pct": "Catch & Shoot Field Goals Made (FGM)",
  "CATCH_SHOOT_FGA_CatchShoot_pct": "Catch & Shoot Field Goals Attempts (FGA)",
  "CATCH_SHOOT_FG_PCT_CatchShoot_pct": "Catch & Shoot Field Goal % (FG%)",
  "CATCH_SHOOT_FG3M_CatchShoot_pct": "Catch & Shoot 3 Pointer Made (3PM)",
  "CATCH_SHOOT_FG3A_CatchShoot_pct": "Catch & Shoot 3 Pointer Attempts (3PA)",
  "CATCH_SHOOT_FG3_PCT_CatchShoot_pct": "Catch & Shoot 3 Point % (3P%)",
  "CATCH_SHOOT_EFG_PCT_CatchShoot_pct": "Catch & Shoot eFG%",

  // Pull Up Shots
  "PULL_UP_PTS_PullUpShot_pct": "Pull Up Points (PTS)",
  "PULL_UP_FGM_PullUpShot_pct": "Pull Up Field Goals Made (FGM)",
  "PULL_UP_FGA_PullUpShot_pct": "Pull Up Field Goals Attempts (FGA)",
  "PULL_UP_FG_PCT_PullUpShot_pct": "Pull Up Field Goal % (FG%)",
  "PULL_UP_FG3M_PullUpShot_pct": "Pull Up 3 Pointer Made (3PM)",
  "PULL_UP_FG3A_PullUpShot_pct": "Pull Up 3 Pointer Attempts (3PA)",
  "PULL_UP_FG3_PCT_PullUpShot_pct": "Pull Up 3 Point % (3P%)",
  "PULL_UP_EFG_PCT_PullUpShot_pct": "Pull-Up eFG%",

  // Drives
  "DRIVES_Drives_pct": "Drives",
  "DRIVE_PTS_Drives_pct": "Drive Points (PTS)",
  "DRIVE_PTS_PCT_Drives_pct": "Drive Points % (PTS %)",
  "DRIVE_FGM_Drives_pct": "Drive Field Goals Made (FGM)",
  "DRIVE_FGA_Drives_pct": "Drive Field Goals Attempts (FGA)",
  "DRIVE_FG_PCT_Drives_pct": "Drive Field Goal % (FG%)",
  "DRIVE_FTA_Drives_pct": "Drive Free Throw Attempts (FTA)",
  "DRIVE_PASSES_PCT_Drives_pct": "Drive Pass %",
  "DRIVE_AST_PCT_Drives_pct": "Drive Assist %",
  "DRIVE_TOV_PCT_Drives_pct": "Drive Turnover %",
  "DRIVE_PF_PCT_Drives_pct": "Drive Personal Foul %",

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
  "ELBOW_TOUCH_PTS_ElbowTouch_pct": "Elbow Touch Points (PTS)",
  "ELBOW_TOUCH_PTS_PCT_ElbowTouch_pct": "Elbow Touch Points % (PTS %)",
  "ELBOW_TOUCH_FGM_ElbowTouch_pct": "Elbow Touch Field Goals Made (FGM)",
  "ELBOW_TOUCH_FGA_ElbowTouch_pct": "Elbow Touch Field Goals Attempts (FGA)",
  "ELBOW_TOUCH_FG_PCT_ElbowTouch_pct": "Elbow Touch Field Goal % (FG%)",
  "ELBOW_TOUCH_FTA_ElbowTouch_pct": "Elbow Touch Free Throw Attempts (FTA)",
  "ELBOW_TOUCH_AST_PCT_ElbowTouch_pct": "Elbow Touch Assist %",
  "ELBOW_TOUCH_PASSES_PCT_ElbowTouch_pct": "Elbow Touch Pass %",
  "ELBOW_TOUCH_TOV_PCT_ElbowTouch_pct": "Elbow Touch Turnover %",

  // Post Touches
  "POST_TOUCHES_PostTouch_pct": "Post Touches",
  "POST_TOUCH_PTS_PostTouch_pct": "Post Touch Points (PTS)",
  "POST_TOUCH_PTS_PCT_PostTouch_pct": "Post Touch Points % (PTS %)",
  "POST_TOUCH_FGM_PostTouch_pct": "Post Touch Field Goals Made (FGM)",
  "POST_TOUCH_FGA_PostTouch_pct": "Post Touch Field Goals Attempts (FGA)",
  "POST_TOUCH_FG_PCT_PostTouch_pct": "Post Touch Field Goal % (FG%)",
  "POST_TOUCH_FTA_PostTouch_pct": "Post Touch Free Throw Attempts (FTA)",
  "POST_TOUCH_AST_PCT_PostTouch_pct": "Post Touch Assist %",
  "POST_TOUCH_PASSES_PCT_PostTouch_pct": "Post Touch Pass %",
  "POST_TOUCH_TOV_PCT_PostTouch_pct":  "Post Touch Turnover %",

  // Paint Touches
  "PAINT_TOUCHES_PaintTouch_pct": "Paint Touches",
  "PAINT_TOUCH_PTS_PaintTouch_pct": "Paint Touch Points (PTS)",
  "PAINT_TOUCH_PTS_PCT_PaintTouch_pct": "Paint Touch Points % (PTS %)",
  "PAINT_TOUCH_FGM_PaintTouch_pct": "Paint Touch Field Goals Made (FGM)",
  "PAINT_TOUCH_FGA_PaintTouch_pct": "Paint Touch Field Goals Attempts (FGA)",
  "PAINT_TOUCH_FG_PCT_PaintTouch_pct": "Paint Touch Field Goal % (FG%)",
  "PAINT_TOUCH_FTA_PaintTouch_pct": "Paint Touch Free Throw Attempts (FTA)",
  "PAINT_TOUCH_AST_PCT_PaintTouch_pct": "Paint Touch Assist %",
  "PAINT_TOUCH_PASSES_PCT_PaintTouch_pct": "Paint Touch Pass %",
  "PAINT_TOUCH_TOV_PCT_PaintTouch_pct": "Paint Touch Turnover %"
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
  { type: 'defensive', playType: 'Spotup' }
];


const availableStats = [
  ...Object.entries(statNameMap).map(([key, label]) => ({ key, label, source: 'playtype' })),
  ...synergyPlaytypes.map(({ type, playType }) => ({
    key: `synergy:${type}:${playType}`,
    label: `Synergy (${type[0].toUpperCase() + type.slice(1)}) – ${playType}`,
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

    async function fetchAllSynergyRows(season) {
      const batchSize = 1000;
      let start = 0;
      let allRows = [];
      let finished = false;

      while (!finished) {
        const { data, error } = await supabase
          .from('synergy')
          .select('PLAYER_ID, PLAY_TYPE, TYPE_GROUPING, PPP, SEASON, PERCENTILE')
          .eq('SEASON', season)
          .order('PLAYER_ID', { ascending: true })
          .range(start, start + batchSize - 1);

        if (error) {
          return { data: null, error }; // return early if there's an error
        }

        if (data.length > 0) {
          allRows = allRows.concat(data);
          start += batchSize;
        }

        if (data.length < batchSize) {
          finished = true;
        }
      }

      return { data: allRows, error: null };
    }
    const { data: synergyAll, error: synergyAllError } = await fetchAllSynergyRows(season);

    if (synergyAllError) {
      console.error("SynergyAll error:", synergyAllError);
      setLoading(false);
      return;
    }


    // Build PLAYER_ID → AGE map from merged (which already contains age)
    const ageLookup = new Map();
    merged.forEach(player => {
      ageLookup.set(player.PLAYER_ID, player.AGE);
    });

    // Combine synergyAll rows and inject AGE from ageLookup
    const allSynergyRows = (synergyAll || []).map(row => ({
      ...row,
      AGE: ageLookup.get(row.PLAYER_ID) ?? null
    }));


    // Group synergy rows by PLAYER_ID
    const synergyMap = new Map();
    allSynergyRows.forEach(row => {
      if (!synergyMap.has(row.PLAYER_ID)) synergyMap.set(row.PLAYER_ID, []);
      synergyMap.get(row.PLAYER_ID).push(row);
    });

    // Filter merged based on AGE and synergy stats
    const filtered = merged.filter(player => {
      const synergyRows = synergyMap.get(player.PLAYER_ID) || [];

      // Use player.AGE from merged or fallback to AGE in synergyRows
      const age = player.AGE ?? (synergyRows[0]?.AGE ?? null);
      if (!age || age > ageMax || age < ageMin) return false;

      return statFilters.every(filter => {
        if (filter.stat.startsWith('synergy:')) {
          const [_prefix, typeGroup, playType] = filter.stat.split(':');
          const matching = synergyRows.find(
            s => s.TYPE_GROUPING === typeGroup && s.PLAY_TYPE === playType
          );
          return (matching?.PERCENTILE  || 0) >= filter.min / 100;
        } else {
          return (player[filter.stat] || 0) >= (filter.min / 100);
        }
      });
    });

    // Attach synergy rows to each player
    const enriched = filtered.map(player => ({
      ...player,
      synergy: synergyMap.get(player.PLAYER_ID) || []
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
          <select className="bg-white text-black border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500" value={season} onChange={(e) => setSeason(e.target.value)}>
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
          <input type="number" className="bg-white text-black border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} />
        </div>

        <div>
          <label className="block font-semibold mb-1">Max Age:</label>
          <input type="number" className="bg-white text-black border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} />
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
            className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
