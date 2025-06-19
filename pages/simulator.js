import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Simulator() {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [team1Year, setTeam1Year] = useState(2023);
  const [team2Year, setTeam2Year] = useState(2024);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔄 Fetch unique team names from Supabase
  useEffect(() => {
    async function fetchTeams() {
      const { data, error } = await supabase
        .from('march_madness_sq')
        .select('TEAM')
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">March Madness Matchup Simulator</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Team 1</label>
          <select value={team1} onChange={(e) => setTeam1(e.target.value)} className="border px-2 py-1 w-full rounded">
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <input type="number" value={team1Year} onChange={(e) => setTeam1Year(e.target.value)} className="border mt-1 px-2 py-1 w-full rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">Team 2</label>
          <select value={team2} onChange={(e) => setTeam2(e.target.value)} className="border px-2 py-1 w-full rounded">
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <input type="number" value={team2Year} onChange={(e) => setTeam2Year(e.target.value)} className="border mt-1 px-2 py-1 w-full rounded" />
        </div>
      </div>

      <button onClick={simulateMatchup} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Simulating..." : "Simulate Matchup"}
      </button>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-100">
          <p><strong>{result.team1}</strong> win probability: {result.team1_win_prob}</p>
          <p><strong>{result.team2}</strong> win probability: {result.team2_win_prob}</p>
        </div>
      )}
    </div>
  );
}

