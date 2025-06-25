import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

export default function HeliocentricLeaderboard() {
  const [leaderboardType, setLeaderboardType] = useState('');
  const [leaderboardTypes, setLeaderboardTypes] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [playerMap, setPlayerMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    good: 0,
    great: 0,
    bad: 0,
    terrible: 0,
  });

  useEffect(() => {
    const fetchLeaderboardTypes = async () => {
      const { data, error } = await supabase
        .from('heliocentric_leaderboard')
        .select('leaderboard_type')
        .neq('leaderboard_type', '')
        .then(res => ({ data: [...new Set(res.data.map(d => d.leaderboard_type))] }));

      if (error) {
        console.error('Error fetching leaderboard types:', error);
        return;
      }
      setLeaderboardTypes(data);
    };

    fetchLeaderboardTypes();
  }, []);

  useEffect(() => {
    if (!leaderboardType) return;
    setLoading(true);

    const fetchData = async () => {
      const { data: leaderboardRows, error } = await supabase
        .from('heliocentric_leaderboard')
        .select('*')
        .eq('leaderboard_type', leaderboardType);

      if (error) {
        console.error('Error fetching leaderboard data:', error);
        setLoading(false);
        return;
      }

      const playerIds = leaderboardRows.map(row => row.player_id);

      const { data: players } = await supabase
        .from('players')
        .select('player_id, player_name')
        .in('player_id', playerIds);

      const { data: headshots } = await supabase
        .from('player_headshots')
        .select('player_id, headshot')
        .in('player_id', playerIds);

      const map = {};
      for (const row of players || []) {
        map[row.player_id] = { ...map[row.player_id], name: row.player_name };
      }
      for (const row of headshots || []) {
        map[row.player_id] = { ...map[row.player_id], headshot: row.headshot };
      }

      setPlayerMap(map);
      setLeaderboardData(leaderboardRows);
      setLoading(false);
    };

    fetchData();
  }, [leaderboardType]);

  const filteredData = leaderboardData.filter(row =>
    row.good_decision_pct * 100 >= filters.good &&
    row.great_decision_pct * 100 >= filters.great &&
    row.bad_decision_pct * 100 >= filters.bad &&
    row.terrible_decision_pct * 100 >= filters.terrible
  );

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-gray-700">
        This leaderboard highlights player decision-making based on my custom <strong>Heliocentric Shot Selection</strong> statistic — a metric that evaluates the expected value of a shot versus the best available teammate option on the floor. It measures how often players take good, great, bad, or terrible shots based on spatial tracking data. 
        <br />
        <span className="italic">Note: This leaderboard only includes data from the <strong>2015-16 NBA season</strong>.</span>
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
                setFilters((prev) => ({
                  ...prev,
                  [type]: Number(e.target.value)
                }))
              }
            />
          </div>
        ))}
      </div>

      {loading && <p>Loading...</p>}

      {filteredData.length > 0 && (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Player</th>
              <th className="border px-2 py-1">Shots</th>
              <th className="border px-2 py-1">Good %</th>
              <th className="border px-2 py-1">Great %</th>
              <th className="border px-2 py-1">Bad %</th>
              <th className="border px-2 py-1">Terrible %</th>
              <th className="border px-2 py-1">Avg Value</th>
              <th className="border px-2 py-1">Better Options</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(row => (
              <tr key={row.player_id} className="hover:bg-gray-50">
                <td className="border px-2 py-1 flex items-center gap-2">
                  {playerMap[row.player_id]?.headshot && (
                    <Image
                      src={playerMap[row.player_id].headshot}
                      alt={playerMap[row.player_id]?.name || 'Player'}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <Link href={`/player/${row.player_id}`} className="text-blue-700 underline">
                    {playerMap[row.player_id]?.name || row.player_id}
                  </Link>
                </td>
                <td className="border px-2 py-1 text-center">{row.total_shots}</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.good_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.great_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.bad_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{Math.round(row.terrible_decision_pct * 100)}%</td>
                <td className="border px-2 py-1 text-center">{row.avg_heliocentric_value.toFixed(2)}</td>
                <td className="border px-2 py-1 text-center">{row.total_better_options}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && leaderboardType && filteredData.length === 0 && (
        <p className="text-gray-500">No players match the selected filters.</p>
      )}
    </div>
  );
}
