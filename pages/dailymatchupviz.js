// pages/dailymatchupviz.js
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function DailyMatchupViz() {
  // -----------------------------
  // Simulator (Live) state
  // -----------------------------
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [result, setResult] = useState(null);
  const [expectedSpreadText, setExpectedSpreadText] = useState("");
  const [loadingSim, setLoadingSim] = useState(false);

  // -----------------------------
  // Daily table state
  // -----------------------------
  const todayISO = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(todayISO);
  const [dateTo, setDateTo] = useState(todayISO);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableRows, setTableRows] = useState([]);

  // today | historic | both
  const [sourceFilter, setSourceFilter] = useState("both");

  // -----------------------------
  // Helpers
  // -----------------------------
  const formatPercentage = (decimal) =>
    decimal == null ? "" : `${(Number(decimal) * 100).toFixed(2)}%`;

  const num1 = (x) => (x == null ? "" : Number(x).toFixed(1));
  const num2 = (x) => (x == null ? "" : Number(x).toFixed(2));

  // -----------------------------
  // Fetch teams for simulator dropdowns
  // -----------------------------
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

      const uniqueTeams = Array.from(new Set(allRows.map((d) => d.TEAM))).sort();

      setTeams(uniqueTeams);
      setTeam1(uniqueTeams[0] || "");
      setTeam2(uniqueTeams[1] || uniqueTeams[0] || "");
    }

    fetchTeams();
  }, []);

  // -----------------------------
  // Simulator call
  // -----------------------------
  const simulateMatchup = async () => {
    if (!team1 || !team2) return;

    setLoadingSim(true);
    setResult(null);
    setExpectedSpreadText("");

    try {
      const url = new URL("https://march-madness-api.fly.dev/simulate_live");
      url.searchParams.append("team1", team1);
      url.searchParams.append("team2", team2);
      url.searchParams.append("year", "2026");
      url.searchParams.append("num_simulations", "10000");

      const res = await fetch(url.toString());
      const data = await res.json();
      setResult(data);

      // If your API returns something like:
      // { expected_spread_points: 9.5, expected_winner: "Abilene Christian" }
      // OR { expected_spread_text: "..." }
      // We’ll support either.
      if (data?.expected_spread_text) {
        setExpectedSpreadText(data.expected_spread_text);
      } else if (data?.expected_winner && data?.expected_spread_points != null) {
        setExpectedSpreadText(
          `${data.expected_winner} is expected to win on a neutral court by ${Number(
            data.expected_spread_points
          ).toFixed(1)} points.`
        );
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoadingSim(false);
    }
  };

  // -----------------------------
  // Fetch table rows (today_games + historic_games)
  // -----------------------------
  const loadGames = async () => {
    setLoadingTable(true);

    try {
      // today_games
      const { data: todayData, error: todayErr } = await supabase
        .from("today_games")
        .select(`
          date,home,away,
          home_win_prob,away_win_prob,
          vegas_line,vegas_ou,
          suggested_odds,spread_diff,official_play,
          percentage_to_match, suggested_spread_raw, suggested_spread_adj
        `)
        .gte("date", dateFrom)
        .lte("date", dateTo);

      if (todayErr) {
        console.error("today_games error:", todayErr);
      }

      // historic_games
      const { data: histData, error: histErr } = await supabase
        .from("historic_games")
        .select(`
          date,home,away,
          home_win_prob,away_win_prob,
          vegas_line,vegas_ou,
          suggested_odds,spread_diff,official_play,
          score,home_margin_actual,
          model_pick,model_correct,
          official_pick,official_win,official_push
        `)
        .gte("date", dateFrom)
        .lte("date", dateTo);

      if (histErr) {
        console.error("historic_games error:", histErr);
      }

      const t = (todayData || []).map((r) => ({ ...r, source: "today_games" }));
      const h = (histData || []).map((r) => ({ ...r, source: "historic_games" }));

      const combined = [...t, ...h].sort((a, b) => {
        // Sort by date, then home, then away
        const da = String(a.date || "");
        const db = String(b.date || "");
        if (da !== db) return da.localeCompare(db);
        const ha = String(a.home || "");
        const hb = String(b.home || "");
        if (ha !== hb) return ha.localeCompare(hb);
        return String(a.away || "").localeCompare(String(b.away || ""));
      });

      setTableRows(combined);
    } catch (e) {
      console.error("loadGames exception:", e);
    } finally {
      setLoadingTable(false);
    }
  };

  // auto reload when date range changes
  useEffect(() => {
    loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // -----------------------------
  // Filtered rows (dropdown)
  // -----------------------------
  const filteredRows = useMemo(() => {
    if (sourceFilter === "today") return tableRows.filter((r) => r.source === "today_games");
    if (sourceFilter === "historic") return tableRows.filter((r) => r.source === "historic_games");
    return tableRows;
  }, [tableRows, sourceFilter]);

  // -----------------------------
  // Row styling (historic model_correct)
  // -----------------------------
  const rowClass = (g) => {
    if (g.source !== "historic_games") return "odd:bg-white even:bg-gray-50";
    if (g.model_correct === 1) return "bg-green-50";
    if (g.model_correct === 0) return "bg-red-50";
    return "bg-gray-50";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto bg-cream min-h-screen">
      {/* -----------------------------
          SIMULATOR
      ----------------------------- */}
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        CBB (2025-26) Live Matchup Simulator
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 max-w-xl mx-auto">
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

      <div className="flex justify-center mb-8">
        <button
          onClick={simulateMatchup}
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded shadow hover:bg-blue-700 transition"
        >
          {loadingSim ? "Simulating..." : "Simulate Live Matchup"}
        </button>
      </div>

      {result && !result.error && (
        <div className="max-w-xl mx-auto mt-2 mb-12 p-6 border rounded-lg bg-white shadow text-center text-lg">
          <p className="mb-2">
            <strong>{result.team1}</strong> win probability:{" "}
            <span className="text-blue-600 font-bold">
              {formatPercentage(result.team1_win_prob)}
            </span>
          </p>
          <p className="mb-4">
            <strong>{result.team2}</strong> win probability:{" "}
            <span className="text-red-600 font-bold">
              {formatPercentage(result.team2_win_prob)}
            </span>
          </p>

          {/* Expected spread line (already how you liked it) */}
          {expectedSpreadText && (
            <p className="text-gray-800 font-semibold">{expectedSpreadText}</p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="max-w-xl mx-auto mt-2 mb-12 p-4 border rounded bg-white shadow text-center text-red-600">
          {result.error}
        </div>
      )}

      {/* -----------------------------
          DAILY TABLE
      ----------------------------- */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Daily Matchups</h2>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end mb-4">
        <div>
          <label className="block font-medium mb-1 text-gray-700">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">Show</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm"
          >
            <option value="both">Both</option>
            <option value="today">Today Games</option>
            <option value="historic">Historic Games</option>
          </select>
        </div>

        <button
          onClick={loadGames}
          className="bg-gray-800 text-white font-semibold px-5 py-2 rounded shadow hover:bg-gray-900 transition"
        >
          {loadingTable ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto bg-white border rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2 border-b">Date</th>
              <th className="text-left px-3 py-2 border-b">Home</th>
              <th className="text-left px-3 py-2 border-b">Away</th>

              <th className="text-right px-3 py-2 border-b">Home Win%</th>
              <th className="text-right px-3 py-2 border-b">Away Win%</th>

              <th className="text-right px-3 py-2 border-b">Vegas Line</th>
              <th className="text-right px-3 py-2 border-b">Vegas O/U</th>

              <th className="text-right px-3 py-2 border-b">Suggested Odds</th>
              <th className="text-right px-3 py-2 border-b">Spread Diff</th>
              <th className="text-left px-3 py-2 border-b">Official Play</th>

              {/* Historic-only */}
              <th className="text-left px-3 py-2 border-b">Final</th>
              <th className="text-right px-3 py-2 border-b">Margin</th>

              <th className="text-left px-3 py-2 border-b">Model Pick</th>
              <th className="text-right px-3 py-2 border-b">Model ✓</th>

              <th className="text-left px-3 py-2 border-b">Official Pick</th>
              <th className="text-right px-3 py-2 border-b">W</th>
              <th className="text-right px-3 py-2 border-b">P</th>

              <th className="text-left px-3 py-2 border-b">Source</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={18}>
                  No games found for that date range / filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((g, idx) => {
                const isHistoric = g.source === "historic_games";

                return (
                  <tr
                    key={`${g.source}-${g.date}-${g.home}-${g.away}-${idx}`}
                    className={rowClass(g)}
                  >
                    <td className="px-3 py-2 border-b">{String(g.date || "")}</td>
                    <td className="px-3 py-2 border-b">{g.home}</td>
                    <td className="px-3 py-2 border-b">{g.away}</td>

                    <td className="px-3 py-2 border-b text-right">
                      {formatPercentage(g.home_win_prob)}
                    </td>
                    <td className="px-3 py-2 border-b text-right">
                      {formatPercentage(g.away_win_prob)}
                    </td>

                    <td className="px-3 py-2 border-b text-right">{num1(g.vegas_line)}</td>
                    <td className="px-3 py-2 border-b text-right">{num1(g.vegas_ou)}</td>

                    <td className="px-3 py-2 border-b text-right">{num2(g.suggested_odds)}</td>
                    <td className="px-3 py-2 border-b text-right">{num1(g.spread_diff)}</td>
                    <td className="px-3 py-2 border-b">{g.official_play || ""}</td>

                    <td className="px-3 py-2 border-b">{isHistoric ? g.score || "" : ""}</td>
                    <td className="px-3 py-2 border-b text-right">
                      {isHistoric && g.home_margin_actual != null ? g.home_margin_actual : ""}
                    </td>

                    <td className="px-3 py-2 border-b">{isHistoric ? g.model_pick || "" : ""}</td>
                    <td className="px-3 py-2 border-b text-right">
                      {isHistoric && g.model_correct != null ? g.model_correct : ""}
                    </td>

                    <td className="px-3 py-2 border-b">
                      {isHistoric ? g.official_pick || "" : ""}
                    </td>
                    <td className="px-3 py-2 border-b text-right">
                      {isHistoric && g.official_win != null ? g.official_win : ""}
                    </td>
                    <td className="px-3 py-2 border-b text-right">
                      {isHistoric && g.official_push != null ? g.official_push : ""}
                    </td>

                    <td className="px-3 py-2 border-b">{g.source}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* legend */}
      <div className="mt-3 text-sm text-gray-600">
        <span className="inline-block px-2 py-1 bg-green-50 border rounded mr-2">
          Historic: Model correct
        </span>
        <span className="inline-block px-2 py-1 bg-red-50 border rounded mr-2">
          Historic: Model incorrect
        </span>
        <span className="inline-block px-2 py-1 bg-gray-50 border rounded">
          Today / ungraded
        </span>
      </div>
    </div>
  );
}
