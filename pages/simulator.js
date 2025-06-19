import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Simulator() {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [team1Year, setTeam1Year] = useState(2024);
  const [team2Year, setTeam2Year] = useState(2025);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      const { data, error } = await supabase
        .from('march_madness_sq')
        .select('TEAM')
        .range(0, 1999)
        .order('TEAM', { ascending: true });

      if (error) {
        console.error("Error fetching teams:", error);
      } else {
        const uniqueTeams = [...new Set(data.map(d => d.TEAM))];
        setTeams(uniqueTeams);
        setTeam1(uniqueTeams[0]);
        setTeam2(uniqueTeams[1] || uniqueTeams[0]);
      }
    }

    fetchTeams();
  }, []);

  const simulateMatchup = async () => {
    setLoading(true);
    setResult(null);
    try {
      const url = new URL("https://march-madness-api.fly.dev/simulate");
      url.searchParams.append("team1", team1);
      url.searchParams.append("team2", team2);
      url.searchParams.append("team1_year", team1Year);
      url.searchParams.append("team2_year", team2Year);
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
        <div>
          <label className="block font-medium mb-1 text-gray-700">Team 1</label>
          <select value={team1} onChange={(e) => setTeam1(e.target.value)} className="border px-3 py-2 w-full rounded shadow-sm">
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <input
            type="number"
            value={team1Year}
            onChange={(e) => setTeam1Year(e.target.value)}
            className="border mt-2 px-3 py-2 w-full rounded shadow-sm"
            placeholder="Year"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">Team 2</label>
          <select value={team2} onChange={(e) => setTeam2(e.target.value)} className="border px-3 py-2 w-full rounded shadow-sm">
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <input
            type="number"
            value={team2Year}
            onChange={(e) => setTeam2Year(e.target.value)}
            className="border mt-2 px-3 py-2 w-full rounded shadow-sm"
            placeholder="Year"
          />
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
            <strong>{result.team1} ({result.team1_year})</strong> win probability: <span className="text-blue-600 font-bold">{formatPercentage(result.team1_win_prob)}</span>
          </p>
          <p>
            <strong>{result.team2} ({result.team2_year})</strong> win probability: <span className="text-red-600 font-bold">{formatPercentage(result.team2_win_prob)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
