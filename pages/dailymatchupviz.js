// pages/dailymatchupviz.js
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// ---------- Central Time (America/Chicago) helpers ----------
function toISODateCentral(d = new Date()) {
  // returns YYYY-MM-DD in America/Chicago (no UTC rollover issues)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

export default function DailyMatchupViz() {
  // -----------------------------
  // Simulator (Live) state
  // -----------------------------
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [result, setResult] = useState(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // Expected spread (client-side using historic_odds)
  const [historicOdds, setHistoricOdds] = useState([]);

  // -----------------------------
  // Daily table state
  // -----------------------------
  const todayISOCT = useMemo(() => toISODateCentral(new Date()), []);
  const [dateFrom, setDateFrom] = useState(todayISOCT);
  const [dateTo, setDateTo] = useState(todayISOCT);

  const [loadingTable, setLoadingTable] = useState(false);
  const [tableRows, setTableRows] = useState([]);

  // today | historic | both
  const [sourceFilter, setSourceFilter] = useState("both");

  // Column filters (simple + useful)
  const [homeFilter, setHomeFilter] = useState("");
  const [awayFilter, setAwayFilter] = useState("");
  const [officialPlayFilter, setOfficialPlayFilter] = useState("all"); // all | YES | NO
  const [modelCorrectFilter, setModelCorrectFilter] = useState("all"); // all | 1 | 0
  const [globalSearch, setGlobalSearch] = useState("");

  // Official Play record (season-to-date)
  const [officialRecord, setOfficialRecord] = useState({ wins: 0, losses: 0, pushes: 0 });

  // -----------------------------
  // Helpers
  // -----------------------------
  const formatPercentage = (decimal) =>
    decimal == null ? "" : `${(Number(decimal) * 100).toFixed(2)}%`;

  const num1 = (x) => (x == null ? "" : Number(x).toFixed(1));
  const num2 = (x) => (x == null ? "" : Number(x).toFixed(2));

  const normalizeYesNo = (v) => {
    if (v == null) return "";
    const s = String(v).trim().toUpperCase();
    if (s === "Y") return "YES";
    if (s === "N") return "NO";
    return s;
  };

  // -----------------------------
  // Fetch teams + historic odds
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

    async function fetchHistoricOdds() {
      // table is small (~48 rows) so one pull is fine
      const { data, error } = await supabase
        .from("historic_odds")
        .select("Line,fav_win_per");

      if (error) {
        console.error("Error fetching historic odds:", error);
        return;
      }

      setHistoricOdds(data || []);
    }

    fetchTeams();
    fetchHistoricOdds();
  }, []);

  // -----------------------------
  // Simulator call
  // -----------------------------
  const simulateMatchup = async () => {
    if (!team1 || !team2) return;

    setLoadingSim(true);
    setResult(null);

    try {
      const url = new URL("https://march-madness-api.fly.dev/simulate_live");
      url.searchParams.append("team1", team1);
      url.searchParams.append("team2", team2);
      url.searchParams.append("year", "2026"); // optional but explicit
      url.searchParams.append("num_simulations", "10000");

      const res = await fetch(url.toString());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoadingSim(false);
    }
  };

  // -----------------------------
  // Expected spread text (client-side, back to your preferred approach)
  // -----------------------------
  const expectedSpreadText = useMemo(() => {
    if (!result || result.error) return null;
    if (!historicOdds || historicOdds.length === 0) return null;

    const t1p = Number(result.team1_win_prob);
    const t2p = Number(result.team2_win_prob);

    const favoriteTeam = t1p >= t2p ? result.team1 : result.team2;
    const favProb = Math.max(t1p, t2p);

    // find closest fav_win_per
    let best = null;
    let bestDiff = Infinity;

    for (const row of historicOdds) {
      const p = Number(row.fav_win_per);
      const diff = Math.abs(p - favProb);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = row;
      }
    }

    if (!best) return null;

    // Line is negative for favorite; remove minus by abs()
    const line = Math.abs(Number(best.Line));
    const lineText = Number.isInteger(line) ? `${line}` : `${line.toFixed(1)}`;

    return `${favoriteTeam} is expected to win on a neutral court by ${lineText} points.`;
  }, [result, historicOdds]);

  // -----------------------------
  // Fetch table rows (today_games + historic_games)
  // -----------------------------
  const loadGames = async () => {
    setLoadingTable(true);

    try {
      // today_games
      const { data: todayData, error: todayErr } = await supabase
        .from("today_games")
        .select(
          `
          date,home,away,
          home_win_prob,away_win_prob,
          vegas_line,vegas_ou,
          suggested_odds,spread_diff,official_play
        `
        )
        .gte("date", dateFrom)
        .lte("date", dateTo);

      if (todayErr) console.error("today_games error:", todayErr);

      // historic_games
      const { data: histData, error: histErr } = await supabase
        .from("historic_games")
        .select(
          `
          date,home,away,
          home_win_prob,away_win_prob,
          vegas_line,vegas_ou,
          suggested_odds,spread_diff,official_play,
          score,home_margin_actual,
          model_pick,model_correct,
          official_pick,official_win,official_push
        `
        )
        .gte("date", dateFrom)
        .lte("date", dateTo);

      if (histErr) console.error("historic_games error:", histErr);

      const t = (todayData || []).map((r) => ({ ...r, source: "today_games" }));
      const h = (histData || []).map((r) => ({ ...r, source: "historic_games" }));

      const combined = [...t, ...h].sort((a, b) => {
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

  // If user toggles “Today Games”, auto snap date range to *today in CT*
  useEffect(() => {
    if (sourceFilter === "today") {
      setDateFrom(todayISOCT);
      setDateTo(todayISOCT);
    }
  }, [sourceFilter, todayISOCT]);

  // -----------------------------
  // Official Play record (season-to-date) from historic_games
  // -----------------------------
  useEffect(() => {
    async function loadOfficialRecord() {
      // Season start guess for 2025-26 (adjust if you want)
      const seasonStart = "2025-11-01";
      const seasonEnd = todayISOCT;

      const { data, error } = await supabase
        .from("historic_games")
        .select("official_play,official_win,official_push,date")
        .gte("date", seasonStart)
        .lte("date", seasonEnd);

      if (error) {
        console.error("official record fetch error:", error);
        return;
      }

      const rows = data || [];
      const plays = rows.filter((r) => normalizeYesNo(r.official_play) === "YES");

      const wins = plays.reduce((acc, r) => acc + (Number(r.official_win) === 1 ? 1 : 0), 0);
      const pushes = plays.reduce((acc, r) => acc + (Number(r.official_push) === 1 ? 1 : 0), 0);
      const losses = Math.max(0, plays.length - wins - pushes);

      setOfficialRecord({ wins, losses, pushes });
    }

    loadOfficialRecord();
  }, [todayISOCT]);

  // -----------------------------
  // Filtered rows (dropdown + column filters)
  // -----------------------------
  const filteredRows = useMemo(() => {
    let rows = tableRows;

    // source
    if (sourceFilter === "today") rows = rows.filter((r) => r.source === "today_games");
    if (sourceFilter === "historic") rows = rows.filter((r) => r.source === "historic_games");

    // column filters
    const hf = homeFilter.trim().toLowerCase();
    const af = awayFilter.trim().toLowerCase();
    const gs = globalSearch.trim().toLowerCase();

    if (hf) rows = rows.filter((r) => String(r.home || "").toLowerCase().includes(hf));
    if (af) rows = rows.filter((r) => String(r.away || "").toLowerCase().includes(af));

    if (officialPlayFilter !== "all") {
      rows = rows.filter((r) => normalizeYesNo(r.official_play) === officialPlayFilter);
    }

    if (modelCorrectFilter !== "all") {
      rows = rows.filter((r) => String(r.model_correct) === modelCorrectFilter);
    }

    if (gs) {
      rows = rows.filter((r) => {
        const blob = [
          r.date,
          r.home,
          r.away,
          r.model_pick,
          r.official_pick,
          r.official_play,
          r.source,
        ]
          .map((x) => String(x ?? ""))
          .join(" ")
          .toLowerCase();
        return blob.includes(gs);
      });
    }

    return rows;
  }, [
    tableRows,
    sourceFilter,
    homeFilter,
    awayFilter,
    officialPlayFilter,
    modelCorrectFilter,
    globalSearch,
  ]);

  // -----------------------------
  // Row styling (green/red for historic correctness)
  // -----------------------------
  const rowClass = (g) => {
    if (g.source !== "historic_games") return "odd:bg-white even:bg-gray-50";
    if (g.model_correct === 1) return "bg-green-50";
    if (g.model_correct === 0) return "bg-red-50";
    return "bg-gray-50";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-cream min-h-screen">
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

          {/* Expected spread line (client-side, using historic_odds) */}
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
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Daily Matchups</h2>
      </div>

      {/* Official Play explainer + record */}
      <div className="mb-4">
        <div className="text-gray-800 font-semibold">
          2025-26 Official Play Record:{" "}
          <span className="text-green-700">{officialRecord.wins}W</span> -{" "}
          <span className="text-red-700">{officialRecord.losses}L</span> -{" "}
          <span className="text-gray-700">{officialRecord.pushes}P</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-semibold">Official Play</span> = the model’s flagged bet for that game
          (tracked in <span className="font-mono">historic_games</span> with win/loss/push outcomes).
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end mb-4">
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

        <div className="flex gap-2">
          <button
            onClick={() => {
              setDateFrom(todayISOCT);
              setDateTo(todayISOCT);
            }}
            className="bg-white border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded shadow hover:bg-gray-50 transition"
            title="Set date range to today (Central Time)"
          >
            Today (CT)
          </button>

          <button
            onClick={loadGames}
            className="bg-gray-800 text-white font-semibold px-5 py-2 rounded shadow hover:bg-gray-900 transition"
          >
            {loadingTable ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-end mb-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Home contains</label>
          <input
            value={homeFilter}
            onChange={(e) => setHomeFilter(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm w-64"
            placeholder="e.g. Notre Dame"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Away contains</label>
          <input
            value={awayFilter}
            onChange={(e) => setAwayFilter(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm w-64"
            placeholder="e.g. Duke"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Official Play</label>
          <select
            value={officialPlayFilter}
            onChange={(e) => setOfficialPlayFilter(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm w-40"
          >
            <option value="all">All</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Model Correct</label>
          <select
            value={modelCorrectFilter}
            onChange={(e) => setModelCorrectFilter(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm w-40"
          >
            <option value="all">All</option>
            <option value="1">1</option>
            <option value="0">0</option>
          </select>
        </div>

        <div className="flex-1 min-w-[260px]">
          <label className="block text-sm font-medium mb-1 text-gray-700">Search</label>
          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow-sm w-full"
            placeholder="Search date / teams / picks / source…"
          />
        </div>
      </div>

      {/* Wider table container */}
      <div className="overflow-x-auto bg-white border rounded shadow">
        <table className="min-w-[1400px] w-full text-sm">
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
                    <td className="px-3 py-2 border-b">{normalizeYesNo(g.official_play)}</td>

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
