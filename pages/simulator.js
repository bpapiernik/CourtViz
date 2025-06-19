import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Simulator() {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  async function fetchTeams() {
    const batchSize = 1000;
    let start = 0;
    let allRows = [];
    let finished = false;

    while (!finished) {
      const { data, error } = await supabase
        .from('march_madness_sq')
        .select('TEAM,YEAR')
        .range(start, start + batchSize - 1);

      if (error) {
        console.error("Error fetching team-year combos:", error);
        return;
      }

      allRows = allRows.concat(data);
      if (data.length < batchSize) finished = true;
      start += batchSize;
    }

    // Remove duplicates like "Duke__2023"
    const uniqueCombos = Array.from(new Set(allRows.map(d => `${d.TEAM}__${d.YEAR}`)))
      .map(combo => {
        const [team, year] = combo.split('__');
        return { team, year: parseInt(year) };
      });

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
    try {
      const url = new URL("https://march-madness-api.fly.dev/simulate");
      url.searchParams.append("team1", team1.team);
      url.searchParams.append("team1_year", team1.year);
      url.searchParams.append("team2", team2.team);
      url.searchParams.append("team2_year", team2.year);
      url.searchParams.append("num_simulations", 10000);

      const res = await fetch(url.toString());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  return (
    <div className="p-8 max-w-xl mx-auto bg-cream min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">🏀 March Madness Matchup Simulator</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Team 1 Dropdown */}
        <div>
          <label className="block font-medium mb-1 text-gray-700">Team 1</label>
          <select
            value={team1 ? `${team1.team}__${team1.year}` : ''}
            onChange={(e) => {
              const [t, y] = e.target.value.split('__');
              setTeam1({ team: t, year: parseInt(y) });
            }}
            className="border px-3 py-2 w-full rounded shadow-sm"
          >
            {teams.map(({ team, year }) => (
              <option key={`${team}__${year}`} value={`${team}__${year}`}>
                {team} ({year})
              </option>
            ))}
          </select>
        </div>

        {/* Team 2 Dropdown */}
        <div>
          <label className="block font-medium mb-1 text-gray-700">Team 2</label>
          <select
            value={team2 ? `${team2.team}__${team2.year}` : ''}
            onChange={(e) => {
              const [t, y] = e.target.value.split('__');
              setTeam2({ team: t, year: parseInt(y) });
            }}
            className="border px-3 py-2 w-full rounded shadow-sm"
          >
            {teams.map(({ team, year }) => (
              <option key={`${team}__${year}`} value={`${team}__${year}`}>
                {team} ({year})
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={simulateMatchup}
        className="bg-blue-600 text-white font-semibold px-6 py-3 rounded shadow hover:bg-blue-700 transition"
      >
        {loading ? "Simulating..." : "Simulate Matchup"}
      </button>

      {result && (
        <div className="mt-8 p-6 border rounded-lg bg-white shadow text-center text-lg">
          <p className="mb-2">
            <strong>{result.team1} ({result.team1_year})</strong> win probability:{" "}
            <span className="text-blue-600 font-bold">{formatPercentage(result.team1_win_prob)}</span>
          </p>
          <p>
            <strong>{result.team2} ({result.team2_year})</strong> win probability:{" "}
            <span className="text-red-600 font-bold">{formatPercentage(result.team2_win_prob)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
