import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function DailyMatchupViz() {
  // -----------------------------
  // Simulator state
  // -----------------------------
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historicOdds, setHistoricOdds] = useState([]);

  // -----------------------------
  // Daily table state
  // -----------------------------
  const [view, setView] = useState("today"); // today | historic
  const [selectedDate, setSelectedDate] = useState("");
  const [games, setGames] = useState([]);

  // -----------------------------
  // Initial data load
  // -----------------------------
  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase
        .from("march_madness_sq_players")
        .select("TEAM");

      const uniqueTeams = Array.from(new Set(data.map(d => d.TEAM))).sort();
      setTeams(uniqueTeams);
      setTeam1(uniqueTeams[0] || "");
      setTeam2(uniqueTeams[1] || uniqueTeams[0] || "");
    }

    async function fetchHistoricOdds() {
      const { data, error } = await supabase
        .from("historic_odds")
        .select("Line,fav_win_per");

      if (!error) setHistoricOdds(data || []);
    }

    fetchTeams();
    fetchHistoricOdds();
  }, []);

  // -----------------------------
  // Fetch daily / historic games
  // -----------------------------
  useEffect(() => {
    if (!selectedDate) return;

    async function fetchGames() {
      const table = view === "today" ? "today_games" : "historic_games";

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("date", selectedDate)
        .order("home");

      if (!error) setGames(data || []);
    }

    fetchGames();
  }, [view, selectedDate]);

  // -----------------------------
  // Simulate matchup
  // -----------------------------
  const simulateMatchup = async () => {
    if (!team1 || !team2) return;

    setLoading(true);
    setResult(null);

    try {
      const url = new URL("https://march-madness-api.fly.dev/simulate_live");
      url.searchParams.append("team1", team1);
      url.searchParams.append("team2", team2);
      url.searchParams.append("year", "2026");
      url.searchParams.append("num_simulations", "10000");

      const res = await fetch(url.toString());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Expected spread (historic odds)
  // -----------------------------
  const getExpectedSpreadText = () => {
    if (!result || result.error || historicOdds.length === 0) return null;

    const t1p = Number(result.team1_win_prob);
    const t2p = Number(result.team2_win_prob);

    const favoriteTeam = t1p >= t2p ? result.team1 : result.team2;
    const favProb = Math.max(t1p, t2p);

    let best = null;
    let bestDiff = Infinity;

    for (const row of historicOdds) {
      const diff = Math.abs(row.fav_win_per - favProb);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = row;
      }
    }

    if (!best) return null;

    const line = Math.abs(best.Line);
    const lineText = Number.isInteger(line) ? line : line.toFixed(1);

    return `${favoriteTeam} is expected to win on a neutral court by ${lineText} points.`;
  };

  const expectedSpreadText = getExpectedSpreadText();

  // -----------------------------
  // Helpers
  // -----------------------------
  const pct = x => `${(x * 100).toFixed(2)}%`;

  const rowClass = row => {
    if (view !== "historic") return "";
    if (row.official_win === 1) return "bg-green-100";
    if (row.model_correct === 0) return "bg-red-100";
    return "";
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="p-10 bg-cream min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">
        CBB (2025–26) Live Matchup Simulator
      </h1>

      {/* Simulator */}
      <div className="flex gap-6 justify-center mb-6">
        <select value={team1} onChange={e => setTeam1(e.target.value)}>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>

        <select value={team2} onChange={e => setTeam2(e.target.value)}>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="text-center mb-6">
        <button
          onClick={simulateMatchup}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {loading ? "Simulating..." : "Simulate Live Matchup"}
        </button>
      </div>

      {result && !result.error && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded shadow text-center mb-10">
          <p><strong>{result.team1}</strong> win probability: <span className="text-blue-600">{pct(result.team1_win_prob)}</span></p>
          <p><strong>{result.team2}</strong> win probability: <span className="text-red-600">{pct(result.team2_win_prob)}</span></p>
          {expectedSpreadText && (
            <p className="mt-4 font-semibold">{expectedSpreadText}</p>
          )}
        </div>
      )}

      {/* Toggle + Date */}
      <div className="flex gap-4 justify-center mb-4">
        <select value={view} onChange={e => setView(e.target.value)}>
          <option value="today">Today Games</option>
          <option value="historic">Historic Games</option>
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Games Table */}
      {games.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2">Home</th>
                <th className="border px-2">Away</th>
                <th className="border px-2">Home Win %</th>
                <th className="border px-2">Spread</th>
                <th className="border px-2">Official Play</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr key={`${g.home}-${g.away}`} className={rowClass(g)}>
                  <td className="border px-2">{g.home}</td>
                  <td className="border px-2">{g.away}</td>
                  <td className="border px-2">{pct(g.home_win_prob)}</td>
                  <td className="border px-2">{g.vegas_line}</td>
                  <td className="border px-2">{g.official_play}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
