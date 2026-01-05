// pages/dailymatchupviz.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SimulatorLive() {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
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
          .from("march_madness_sq_players")
          .select("TEAM")
          .range(start, start + batchSize - 1);

        if (error) {
          console.error("Error fetching teams:", error);
          return;
        }

        allRows = allRows.concat(data);
        if (data.length < batchSize) finished = true;
        start += batchSize;
      }

      // unique TEAM list
      const uniqueTeams = Array.from(new Set(allRows.map((d) => d.TEAM))).sort();

      setTeams(uniqueTeams);
      setTeam1(uniqueTeams[0] || "");
      setTeam2(uniqueTeams[1] || uniqueTeams[0] || "");
    }

    fetchTeams();
  }, []);

  const simulateMatchup = async () => {
    if (!team1 || !team2) return;

    setLoading(true);
    setResult(null);

    try {
      const url = new URL("https://march-madness-api.fly.dev/simulate_live");
      url.searchParams.append("team1", team1);
      url.searchParams.append("team2", team2);
      url.searchParams.append("year", "2026"); // optional, but explicit
      url.searchParams.append("num_simulations", "10000");

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
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        CBB (2025-26) Live Matchup Simulator
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Team 1 Dropdown */}
        <div>
          <label className="block font-medium mb-1 text-gray-700">Team 1</label>
          <select
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
            className="bg-white text-black border border-gray-300 px-3 py-2 w-full rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Team 2 Dropdown */}
        <div>
          <label className="block font-medium mb-1 text-gray-700">Team 2</label>
          <select
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
            className="bg-white text-black border border-gray-300 px-3 py-2 w-full rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={simulateMatchup}
        className="bg-blue-600 text-white font-semibold px-6 py-3 rounded shadow hover:bg-blue-700 transition"
      >
        {loading ? "Simulating..." : "Simulate Live Matchup"}
      </button>

      {result && !result.error && (
        <div className="mt-8 p-6 border rounded-lg bg-white shadow text-center text-lg">
          <p className="mb-2">
            <strong>{result.team1}</strong> win probability:{" "}
            <span className="text-blue-600 font-bold">
              {formatPercentage(result.team1_win_prob)}
            </span>
          </p>
          <p>
            <strong>{result.team2}</strong> win probability:{" "}
            <span className="text-red-600 font-bold">
              {formatPercentage(result.team2_win_prob)}
            </span>
          </p>
        </div>
      )}

      {result?.error && (
        <div className="mt-8 p-4 border rounded bg-white shadow text-center text-red-600">
          {result.error}
        </div>
      )}
    </div>
  );
}
