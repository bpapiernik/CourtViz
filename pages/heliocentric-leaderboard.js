import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';

export default function HeliocentricLeaderboard() {
  const [leaderboardType, setLeaderboardType] = useState('');
  const [leaderboardTypes, setLeaderboardTypes] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [playerMap, setPlayerMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ good: 0, great: 0, bad: 0, terrible: 0 });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  useEffect(() => {
    const fetchLeaderboardTypes = async () => {
      const batchSize = 1000;
      let start = 0;
      let allRows = [];
      let finished = false;

      while (!finished) {
        const { data, error } = await supabase
          .from('heliocentric_leaderboard')
          .select('leaderboard_type')
          .neq('leaderboard_type', '')
          .range(start, start + batchSize - 1);

        if (error) {
          console.error('Error fetching leaderboard types:', error);
          return;
        }

        allRows = allRows.concat(data);
        if (data.length < batchSize) finished = true;
        start += batchSize;
      }

      const uniqueTypes = [...new Set(allRows.map(d => d.leaderboard_type))];
      setLeaderboardTypes(uniqueTypes);
    };

    fetchLeaderboardTypes();
  }, []);

  useEffect(() => {
    if (!leaderboardType) return;
    setLoading(true);

    const fetchData = async () => {
      let allRows = [];
      let start = 0;
      const batchSize = 1000;
      let finished = false;

      while (!finished) {
        const { data, error } = await supabase
          .from('heliocentric_leaderboard')
          .select('*')
          .eq('leaderboard_type', leaderboardType)
          .range(start, start + batchSize - 1);

        if (error) {
          console.error('Error fetching leaderboard data:', error);
          setLoading(false);
          return;
        }

        allRows = allRows.concat(data);
        if (data.length < batchSize) finished = true;
        start += batchSize;
      }

      const playerIds = allRows.map(row => row.player_id);

      const { data: players } = await supabase
        .from('players')
        .select('player_id, player_name, position')
        .in('player_id', playerIds);

      const { data: headshots } = await supabase
        .from('player_headshots')
        .select('player_id, headshot')
        .in('player_id', playerIds);

      const { data: shotMakers } = await supabase
        .from('shot_maker')
        .select('player_id, total_shots, avg_shot_maker_difficulty, total_shot_maker_difficulty, avg_shot_maker_difficulty_cat, total_shot_maker_difficulty_cat')
        .in('player_id', playerIds);

      const map = {};
      for (const row of players || []) {
        map[row.player_id] = {
          ...map[row.player_id],
          name: row.player_name,
          position: row.position,
        };
      }
      for (const row of headshots || []) {
        map[row.player_id] = { ...map[row.player_id], headshot: row.headshot };
      }

      const shotMakerMap = {};
      for (const row of shotMakers || []) {
        shotMakerMap[row.player_id] = row;
      }

      const isBoth = leaderboardType.toLowerCase() === "both_categorical";
      const isCat = leaderboardType.toLowerCase() === "categorical" || isBoth;

      const merged = allRows.map(row => {
        const shot = shotMakerMap[row.player_id] || {};
        return {
          ...row,
          avg_shot_maker_difficulty: isBoth ? `${shot.avg_shot_maker_difficulty?.toFixed(2)} / ${shot.avg_shot_maker_difficulty_cat?.toFixed(2)}` : isCat ? shot.avg_shot_maker_difficulty_cat : shot.avg_shot_maker_difficulty,
          total_shot_maker_difficulty: isBoth ? `${shot.total_shot_maker_difficulty} / ${shot.total_shot_maker_difficulty_cat}` : isCat ? shot.total_shot_maker_difficulty_cat : shot.total_shot_maker_difficulty,
          avg_shot_maker_difficulty_cat: shot.avg_shot_maker_difficulty_cat,
          total_shot_maker_difficulty_cat: shot.total_shot_maker_difficulty_cat
        };
      });

      setPlayerMap(map);
      setLeaderboardData(merged);
      setLoading(false);
    };

    fetchData();
  }, [leaderboardType]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  const filteredData = leaderboardData.filter(row =>
    row.good_decision_pct * 100 >= filters.good &&
    row.great_decision_pct * 100 >= filters.great &&
    row.bad_decision_pct * 100 >= filters.bad &&
    row.terrible_decision_pct * 100 >= filters.terrible
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    const aVal = a[key];
    const bVal = b[key];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return direction === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

 

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-gray-700">
        This leaderboard highlights player decision-making based on my custom <strong>Heliocentric Shot Selection</strong> statistic — a metric that evaluates the expected value of a shot versus the best available teammate option on the floor. It measures how often players take good, great, bad, or terrible shots based on spatial tracking data.
        <br />
        <span className="italic">Note: This leaderboard only includes data from the <strong>2015-16 NBA season</strong>.</span>
      </p>
      <Image
        src="/images/ep_snapshot.png"
        alt="EP Snapshot"
        width={600}
        height={300}
        className="rounded shadow-md mb-6"
      />

      <p className="text-sm text-gray-700 mb-6">
          In this EP Snapshot example, the shooter (triangle) took a shot worth <strong>0.97 expected points (EP)</strong>, while the best available teammate (square) had an EP of <strong>1.14</strong>. According to the <strong>Max Teammate EP</strong> benchmark, this shot falls into a neutral zone—it&apos;s not significantly better to be classified as a great or good decision, but also not low enough to be considered a bad or terrible one. Classifications are based on how the shooter&apos;s EP compares to the best available teammate&apos;s EP using thresholds defined in the benchmark table (shown in the Heliocentric section under Brian&apos;s Portfolio). The <strong>Heliocentric Value</strong> for this shot is calculated as <code>(0.97 − 1.14) + 0.20 = +0.03</code>, quantifying how much better or worse the decision was relative to the best available option with a buffer for turnovers, shot clock violation, etc.
      </p>
      <h2 className="text-2xl font-bold mb-4">Heliocentric Leaderboard</h2>

      <div className="mb-6">
        <label className="block font-semibold mb-1">Leaderboard Type:</label>
        <select
          className="border p-2 rounded w-full"
          value={leaderboardType}
          onChange={(e) => setLeaderboardType(e.target.value)}
        >
          <option value="">Select Leaderboard Type</option>
          {leaderboardTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {['good', 'great', 'bad', 'terrible'].map(type => (
          <div key={type}>
            <label className="block text-sm font-medium capitalize">Min {type} %</label>
            <input
              type="number"
              min={0}
              max={100}
              className="border p-1 rounded w-full"
              value={filters[type]}
              onChange={(e) =>
                setFilters(prev => ({
                  ...prev,
                  [type]: Number(e.target.value)
                }))
              }
            />
          </div>
        ))}
      </div>

      {loading && <p>Loading...</p>}

      {sortedData.length > 0 && (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Headshot</th>
              <th className="border px-2 py-1">Player</th>
              <th className="border px-2 py-1">Position</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('total_shots')}>Shots</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('good_decision_pct')}>Good %</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('great_decision_pct')}>Great %</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('bad_decision_pct')}>Bad %</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('terrible_decision_pct')}>Terrible %</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('avg_heliocentric_value')}>Avg Helio</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('total_better_options')}>Better Options</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('total_heliocentric_value')}>Total Helio</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('avg_shot_maker_difficulty')}>Avg Shot Maker Value</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('total_shot_maker_difficulty')}>Total Shot Maker Value</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(row => (
              <tr key={row.player_id} className="hover:bg-gray-50">
                <td className="border p-2 w-[60px]">
                  <img
                    src={playerMap[row.player_id]?.headshot || '/default-headshot.png'}
                    alt={playerMap[row.player_id]?.name || 'Player'}
                    className="w-10 h-10 object-cover rounded-full mx-auto"
                  />
                </td>
                <td className="border px-2 py-1">
                  <Link href={`/player/${row.player_id}`} className="text-blue-700 underline">
                    {playerMap[row.player_id]?.name || row.player_id}
                  </Link>
                </td>
                <td className="border px-2 py-1 text-center">{playerMap[row.player_id]?.position || '—'}</td>
                <td className="border px-2 py-1 text-center">{row.total_shots}</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.good_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.great_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.bad_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.terrible_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{row.avg_heliocentric_value.toFixed(2)}</td>
                <td className="border px-2 py-1 text-center">{row.total_better_options}</td>
                <td className="border px-2 py-1 text-center">{row.total_heliocentric_value?.toFixed(2)}</td>
                <td className="border px-2 py-1 text-center">
                  {(leaderboardType.toLowerCase().includes('categorical') && !leaderboardType.toLowerCase().includes('both'))
                    ? row.avg_shot_maker_difficulty_cat?.toFixed(2)
                    : (leaderboardType.toLowerCase().includes('both')
                        ? row.avg_shot_maker_difficulty
                        : row.avg_shot_maker_difficulty?.toFixed(2))}
                </td>
                <td className="border px-2 py-1 text-center">
                  {(leaderboardType.toLowerCase().includes('categorical') && !leaderboardType.toLowerCase().includes('both'))
                    ? row.total_shot_maker_difficulty_cat
                    : (leaderboardType.toLowerCase().includes('both')
                        ? row.total_shot_maker_difficulty
                        : row.total_shot_maker_difficulty?.toFixed(2))}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && leaderboardType && sortedData.length === 0 && (
        <p className="text-gray-500">No players match the selected filters.</p>
      )}
    </div>
  );
}