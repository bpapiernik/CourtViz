// pages/dailymatchupviz.js
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function DailyMatchupViz() {
  // ----------------------------
  // Live simulator (team dropdowns)
  // ----------------------------
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [result, setResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Historic odds (spread mapping)
  const [historicOdds, setHistoricOdds] = useState([]);

  // ----------------------------
  // Daily matchups table
  // ----------------------------
  const [source, setSource] = useState("Today"); // "Today" | "Historic" (NO "Both")
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [homeContains, setHomeContains] = useState("");
  const [awayContains, setAwayContains] = useState("");
  const [officialPlayFilter, setOfficialPlayFilter] = useState("All"); // All | Yes | No
  const [modelCorrectFilter, setModelCorrectFilter] = useState("All"); // All | Correct | Incorrect
  const [searchText, setSearchText] = useState("");

  const [matchupsLoading, setMatchupsLoading] = useState(false);
  const [matchups, setMatchups] = useState([]);

  // Sorting
  const [sortKey, setSortKey] = useState("date"); // default
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  // Official play record (historic_games)
  const [officialRecord, setOfficialRecord] = useState({
    wins: 0,
    losses: 0,
    pushes: 0,
    winPct: null,
  });

  // ----------------------------
  // Helpers: Central Time "today"
  // ----------------------------
  const getTodayCTIso = () => {
    // reliable "today in America/Chicago" without bringing in moment/dayjs
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`; // YYYY-MM-DD
  };

  const formatPct = (decimal) => `${(Number(decimal) * 100).toFixed(2)}%`;

  const fmtLine = (num) => {
    const x = Number(num);
    if (!Number.isFinite(x)) return "";
    return Number.isInteger(x) ? `${x}` : `${x.toFixed(1)}`;
  };

  // ----------------------------
  // Fetch Teams + Historic Odds once
  // ----------------------------
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

        allRows = allRows.concat(data || []);
        if (!data || data.length < batchSize) finished = true;
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

  // ----------------------------
  // Default date range on load (CT)
  // ----------------------------
  useEffect(() => {
    const todayCT = getTodayCTIso();
    // initialize range to last 3 days through today (or whatever you like)
    // but keep it simple: default from = today-2, to = today
    const dt = new Date(`${todayCT}T00:00:00`);
    const from = new Date(dt);
    from.setDate(from.getDate() - 2);

    const toIso = todayCT;
    const fromIso = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(
      from.getDate()
    ).padStart(2, "0")}`;

    setFromDate(fromIso);
    setToDate(toIso);
  }, []);

  // If user switches to Today source, force dates to CT-today
  useEffect(() => {
    if (source === "Today") {
      const todayCT = getTodayCTIso();
      setFromDate(todayCT);
      setToDate(todayCT);
    }
  }, [source]);

  // ----------------------------
  // Simulator: expected spread text via historic_odds
  // ----------------------------
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

  // ----------------------------
  // Simulator call
  // ----------------------------
  const simulateLiveMatchup = async () => {
    if (!team1 || !team2) return;

    setSimLoading(true);
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
      console.error("Simulation error:", err);
    } finally {
      setSimLoading(false);
    }
  };

  // ----------------------------
  // Fetch matchups from Supabase
  //   - source === Today => ONLY today_games for CT-today (no duplicates)
  //   - source === Historic => historic_games by range
  // ----------------------------
  const fetchMatchups = async () => {
    setMatchupsLoading(true);
    setMatchups([]);

    try {
      const todayCT = getTodayCTIso();

      if (source === "Today") {
        const { data, error } = await supabase
          .from("today_games")
          .select(
            [
              "date",
              "home",
              "away",
              "home_win_prob",
              "away_win_prob",
              "vegas_line",
              "vegas_ou",
              "suggested_odds",
              "spread_diff",
              "official_play",
              "model_favorite",
              "percentage_to_match",
              "suggested_spread_raw",
              "suggested_spread_adj",
            ].join(",")
          )
          .eq("date", todayCT)
          .order("date", { ascending: true })
          .order("home", { ascending: true });

        if (error) {
          console.error("Error fetching today_games:", error);
          return;
        }

        const rows = (data || []).map((r) => ({
          source: "TODAY",
          date: r.date,
          home: r.home,
          away: r.away,
          home_win_prob: r.home_win_prob,
          away_win_prob: r.away_win_prob,
          vegas_line: r.vegas_line,
          vegas_ou: r.vegas_ou,
          suggested_odds: r.suggested_odds,
          spread_diff: r.spread_diff,
          official_play: r.official_play,
          // not in today_games
          score: null,
          home_margin_actual: null,
          model_pick: null,
          model_correct: null,
          official_pick: null,
          official_win: null,
          official_push: null,
        }));

        setMatchups(rows);
      } else {
        // Historic range
        if (!fromDate || !toDate) return;

        const { data, error } = await supabase
          .from("historic_games")
          .select(
            [
              "date",
              "home",
              "away",
              "home_win_prob",
              "away_win_prob",
              "vegas_line",
              "vegas_ou",
              "suggested_odds",
              "spread_diff",
              "official_play",
              "score",
              "home_margin_actual",
              "model_pick",
              "model_correct",
              "official_pick",
              "official_win",
              "official_push",
            ].join(",")
          )
          .gte("date", fromDate)
          .lte("date", toDate)
          .order("date", { ascending: true })
          .order("home", { ascending: true });

        if (error) {
          console.error("Error fetching historic_games:", error);
          return;
        }

        const rows = (data || []).map((r) => ({
          source: "HISTORIC",
          ...r,
        }));

        setMatchups(rows);
      }
    } finally {
      setMatchupsLoading(false);
    }
  };

  // initial fetch
  useEffect(() => {
    if (fromDate && toDate) fetchMatchups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, source]);

  // ----------------------------
  // Official Play record (for 2025-26 season)
  // ----------------------------
  useEffect(() => {
    async function fetchOfficialRecord() {
      // season is 2025-26; you can tighten these bounds however you want
      // Here: from Nov 1 2025 through today CT
      const todayCT = getTodayCTIso();
      const seasonStart = "2025-11-01";

      const { data, error } = await supabase
        .from("historic_games")
        .select("official_win,official_push,official_pick,official_play,date")
        .gte("date", seasonStart)
        .lte("date", todayCT);

      if (error) {
        console.error("Error fetching official record:", error);
        return;
      }

      const rows = data || [];

      // treat "official play" as anything not NO/NO_PLAY
      const isOfficialPlay = (r) => {
        const op = String(r.official_play || "").toUpperCase();
        const ok = String(r.official_pick || "").toUpperCase();
        if (op && op !== "NO") return true;
        if (ok && ok !== "NO_PLAY") return true;
        return false;
      };

      let wins = 0;
      let losses = 0;
      let pushes = 0;

      for (const r of rows) {
        if (!isOfficialPlay(r)) continue;

        const w = Number(r.official_win);
        const p = Number(r.official_push);

        if (p === 1) pushes += 1;
        else if (w === 1) wins += 1;
        else if (w === 0) losses += 1;
      }

      const denom = wins + losses;
      const winPct = denom > 0 ? wins / denom : null;

      setOfficialRecord({ wins, losses, pushes, winPct });
    }

    fetchOfficialRecord();
  }, []);

  // ----------------------------
  // Filters + sorting (client-side)
  // ----------------------------
  const filteredMatchups = useMemo(() => {
    const s = searchText.trim().toLowerCase();
    const h = homeContains.trim().toLowerCase();
    const a = awayContains.trim().toLowerCase();

    return (matchups || []).filter((r) => {
      if (h && !String(r.home || "").toLowerCase().includes(h)) return false;
      if (a && !String(r.away || "").toLowerCase().includes(a)) return false;

      // official play dropdown
      if (officialPlayFilter !== "All") {
        const op = String(r.official_play || "").toUpperCase();
        const ok = String(r.official_pick || "").toUpperCase();
        const isPlay = (op && op !== "NO") || (ok && ok !== "NO_PLAY");
        if (officialPlayFilter === "Yes" && !isPlay) return false;
        if (officialPlayFilter === "No" && isPlay) return false;
      }

      // model correct dropdown (only meaningful for historic)
      if (modelCorrectFilter !== "All") {
        const mc = r.model_correct;
        const isCorrect = Number(mc) === 1;
        const isIncorrect = Number(mc) === 0;
        if (modelCorrectFilter === "Correct" && !isCorrect) return false;
        if (modelCorrectFilter === "Incorrect" && !isIncorrect) return false;
      }

      // global search
      if (s) {
        const blob = [
          r.source,
          r.date,
          r.home,
          r.away,
          r.model_pick,
          r.official_pick,
          r.official_play,
          r.score,
        ]
          .filter(Boolean)
          .join(" | ")
          .toLowerCase();

        if (!blob.includes(s)) return false;
      }

      return true;
    });
  }, [matchups, homeContains, awayContains, officialPlayFilter, modelCorrectFilter, searchText]);

  const sortedMatchups = useMemo(() => {
    const rows = [...filteredMatchups];

    const getVal = (r) => {
      const v = r?.[sortKey];
      // normalize some derived sorting
      if (sortKey === "home_win_prob" || sortKey === "away_win_prob") return Number(v);
      if (sortKey === "vegas_line" || sortKey === "vegas_ou" || sortKey === "suggested_odds" || sortKey === "spread_diff")
        return Number(v);
      if (sortKey === "model_correct") return Number(v);
      if (sortKey === "home_margin_actual") return Number(v);
      return v ?? "";
    };

    rows.sort((ra, rb) => {
      const a = getVal(ra);
      const b = getVal(rb);

      const aNull = a === null || a === undefined || a === "";
      const bNull = b === null || b === undefined || b === "";

      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;

      // dates sort well as YYYY-MM-DD strings
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });

    if (sortDir === "desc") rows.reverse();
    return rows;
  }, [filteredMatchups, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ----------------------------
  // Row styling: green/red on historic based on model_correct
  // ----------------------------
  const getRowClass = (r) => {
    if (r.source !== "HISTORIC") return "";
    const mc = Number(r.model_correct);
    if (mc === 1) return "bg-green-50";
    if (mc === 0) return "bg-red-50";
    return "";
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="p-8 max-w-6xl mx-auto bg-cream min-h-screen">
      {/* ------------------- Live Simulator ------------------- */}
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

      <div className="flex justify-center mb-6">
        <button
          onClick={simulateLiveMatchup}
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded shadow hover:bg-blue-700 transition"
        >
          {simLoading ? "Simulating..." : "Simulate Live Matchup"}
        </button>
      </div>

      {result && !result.error && (
        <div className="max-w-xl mx-auto mb-12 p-6 border rounded-lg bg-white shadow text-center text-lg">
          <p className="mb-2">
            <strong>{result.team1}</strong> win probability:{" "}
            <span className="text-blue-600 font-bold">{formatPct(result.team1_win_prob)}</span>
          </p>
          <p className="mb-4">
            <strong>{result.team2}</strong> win probability:{" "}
            <span className="text-red-600 font-bold">{formatPct(result.team2_win_prob)}</span>
          </p>

          {expectedSpreadText && (
            <p className="text-gray-800 font-semibold">{expectedSpreadText}</p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="max-w-xl mx-auto mb-12 p-4 border rounded bg-white shadow text-center text-red-600">
          {result.error}
        </div>
      )}

      {/* ------------------- Daily Matchups ------------------- */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Daily Matchups</h2>

        <div className="mt-2 text-gray-800 font-semibold">
          2025-26 Official Play Record:{" "}
          <span className="text-green-700">{officialRecord.wins}W</span> -{" "}
          <span className="text-red-700">{officialRecord.losses}L</span> -{" "}
          <span className="text-gray-700">{officialRecord.pushes}P</span>
          {officialRecord.winPct !== null && (
            <span className="text-gray-700">
              {" "}
              ({(officialRecord.winPct * 100).toFixed(1)}%)
            </span>
          )}
        </div>

        <div className="text-sm text-gray-700 mt-1">
          <strong>Official Play</strong> = the model&apos;s flagged bet for a game where{" "}
          <code>abs(vegas_line)</code> ≤ 18 and <code>abs(spread_diff)</code> ≥ 4.
      </div>
    </div>

      {/* Controls */}
      <div className="mt-4 mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block font-medium mb-1 text-gray-700">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={source === "Today"}
            className="bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            disabled={source === "Today"}
            className="bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">Show</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          >
            <option value="Today">Today Games (CT)</option>
            <option value="Historic">Historic Games</option>
          </select>
        </div>

        <button
          onClick={fetchMatchups}
          className="bg-gray-900 text-white font-semibold px-6 py-2 rounded shadow hover:bg-black transition"
        >
          {matchupsLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Filters row */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Home contains</label>
          <input
            value={homeContains}
            onChange={(e) => setHomeContains(e.target.value)}
            placeholder="e.g. Notre Dame"
            className="w-full bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Away contains</label>
          <input
            value={awayContains}
            onChange={(e) => setAwayContains(e.target.value)}
            placeholder="e.g. Duke"
            className="w-full bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Official Play</label>
          <select
            value={officialPlayFilter}
            onChange={(e) => setOfficialPlayFilter(e.target.value)}
            className="w-full bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          >
            <option value="All">All</option>
            <option value="Yes">Official Only</option>
            <option value="No">Non-Official</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Model Correct</label>
          <select
            value={modelCorrectFilter}
            onChange={(e) => setModelCorrectFilter(e.target.value)}
            className="w-full bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          >
            <option value="All">All</option>
            <option value="Correct">Correct</option>
            <option value="Incorrect">Incorrect</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search date / teams / picks / source..."
            className="w-full bg-white text-black border border-gray-300 px-3 py-2 rounded shadow-sm"
          />
        </div>
      </div>

      {/* Table wrapper: wider + scroll */}
      <div className="w-full overflow-x-auto border rounded bg-white shadow">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              {[
                ["date", "Date"],
                ["home", "Home"],
                ["away", "Away"],
                ["home_win_prob", "Home Win%"],
                ["away_win_prob", "Away Win%"],
                ["vegas_line", "Vegas Line"],
                ["vegas_ou", "Vegas O/U"],
                ["suggested_odds", "Suggested Odds"],
                ["spread_diff", "Spread Diff"],
                ["official_play", "Official Play"],
                ["score", "Final"],
                ["home_margin_actual", "Margin"],
                ["model_pick", "Model Pick"],
                ["model_correct", "Model ✓"],
                ["official_pick", "Official Pick"],
                ["source", "Source"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-3 py-2 cursor-pointer select-none whitespace-nowrap border-b border-gray-200"
                  title="Click to sort"
                >
                  {label}{" "}
                  {sortKey === key && (
                    <span className="text-gray-600">{sortDir === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedMatchups.map((r, idx) => (
              <tr key={`${r.source}-${r.date}-${r.home}-${r.away}-${idx}`} className={`${getRowClass(r)} border-t`}>
                <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.home}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.away}</td>

                <td className="px-3 py-2 whitespace-nowrap">
                  {r.home_win_prob != null ? formatPct(r.home_win_prob) : ""}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.away_win_prob != null ? formatPct(r.away_win_prob) : ""}
                </td>

                <td className="px-3 py-2 whitespace-nowrap">{fmtLine(r.vegas_line)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtLine(r.vegas_ou)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtLine(r.suggested_odds)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtLine(r.spread_diff)}</td>

                <td className="px-3 py-2 whitespace-nowrap">{r.official_play ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.score ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.home_margin_actual ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.model_pick ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.model_correct ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.official_pick ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.source}</td>
              </tr>
            ))}

            {!matchupsLoading && sortedMatchups.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-600" colSpan={16}>
                  No games found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
