// pages/dailymatchupviz.js
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function DailyMatchupViz() {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [result, setResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [historicOdds, setHistoricOdds] = useState([]);

  const [source, setSource] = useState("Today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [homeContains, setHomeContains] = useState("");
  const [awayContains, setAwayContains] = useState("");
  const [officialPlayFilter, setOfficialPlayFilter] = useState("All");
  const [modelCorrectFilter, setModelCorrectFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [matchupsLoading, setMatchupsLoading] = useState(false);
  const [matchups, setMatchups] = useState([]);
  const [sortKey, setSortKey] = useState("official_play");
  const [sortDir, setSortDir] = useState("desc");
  const [officialRecord, setOfficialRecord] = useState({ wins: 0, losses: 0, pushes: 0, winPct: null });
  const [yesterdayRecord, setYesterdayRecord] = useState({ wins: 0, losses: 0, pushes: 0, winPct: null });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getTodayCTIso = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === "year")?.value;
    const m = parts.find(p => p.type === "month")?.value;
    const d = parts.find(p => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  };

  const formatPct = (decimal) => `${(Number(decimal) * 100).toFixed(2)}%`;
  const fmtLine = (num) => {
    const x = Number(num);
    if (!Number.isFinite(x)) return "";
    return Number.isInteger(x) ? `${x}` : `${x.toFixed(1)}`;
  };

  const getOfficialPickDisplay = (r) => {
    if (String(r.official_play).toUpperCase() !== "YES") return "";
    const vegas = Number(r.vegas_line);
    const diff = Number(r.spread_diff);
    if (!Number.isFinite(vegas) || !Number.isFinite(diff)) return "";
    const homeFavored = vegas < 0;
    const absLine = Math.abs(vegas);
    const lineText = Number.isInteger(absLine) ? absLine : absLine.toFixed(1);
    if (homeFavored) {
      return diff < 0 ? `${r.home} -${lineText}` : `${r.away} +${lineText}`;
    }
    return diff > 0 ? `${r.away} -${lineText}` : `${r.home} +${lineText}`;
  };

  // ── Fetch teams + historic odds ───────────────────────────────────────────
  useEffect(() => {
    async function fetchTeams() {
      const batchSize = 1000;
      let start = 0, allRows = [], finished = false;
      while (!finished) {
        const { data, error } = await supabase
          .from("march_madness_sq_players").select("TEAM").range(start, start + batchSize - 1);
        if (error) { console.error("Error fetching teams:", error); return; }
        allRows = allRows.concat(data || []);
        if (!data || data.length < batchSize) finished = true;
        start += batchSize;
      }
      const uniqueTeams = Array.from(new Set(allRows.map(d => d.TEAM))).sort();
      setTeams(uniqueTeams);
      setTeam1(uniqueTeams[0] || "");
      setTeam2(uniqueTeams[1] || uniqueTeams[0] || "");
    }
    async function fetchHistoricOdds() {
      const { data, error } = await supabase.from("historic_odds").select("Line,fav_win_per");
      if (error) { console.error("Error fetching historic odds:", error); return; }
      setHistoricOdds(data || []);
    }
    fetchTeams();
    fetchHistoricOdds();
  }, []);

  // ── Default date range ────────────────────────────────────────────────────
  useEffect(() => {
    const todayCT = getTodayCTIso();
    const dt = new Date(`${todayCT}T00:00:00`);
    const from = new Date(dt);
    from.setDate(from.getDate() - 2);
    const fromIso = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
    setFromDate(fromIso);
    setToDate(todayCT);
  }, []);

  useEffect(() => {
    if (source === "Today") {
      const todayCT = getTodayCTIso();
      setFromDate(todayCT);
      setToDate(todayCT);
    }
  }, [source]);

  // ── Expected spread text ──────────────────────────────────────────────────
  const expectedSpreadText = useMemo(() => {
    if (!result || result.error) return null;
    if (!historicOdds || historicOdds.length === 0) return null;
    const t1p = Number(result.team1_win_prob);
    const t2p = Number(result.team2_win_prob);
    const favoriteTeam = t1p >= t2p ? result.team1 : result.team2;
    const favProb = Math.max(t1p, t2p);
    let best = null, bestDiff = Infinity;
    for (const row of historicOdds) {
      const p = Number(row.fav_win_per);
      const diff = Math.abs(p - favProb);
      if (diff < bestDiff) { bestDiff = diff; best = row; }
    }
    if (!best) return null;
    const line = Math.abs(Number(best.Line));
    const lineText = Number.isInteger(line) ? `${line}` : `${line.toFixed(1)}`;
    return { team: favoriteTeam, line: lineText };
  }, [result, historicOdds]);

  // ── Simulate ──────────────────────────────────────────────────────────────
  const simulateLiveMatchup = async () => {
    if (!team1 || !team2) return;
    setSimLoading(true);
    setResult(null);
    try {
      const url = new URL("https://march-madness-api.fly.dev/simulate_live");
      url.searchParams.append("team1", team1);
      url.searchParams.append("team2", team2);
      url.searchParams.append("year", "2026");
      url.searchParams.append("num_simulations", "100000");
      const res = await fetch(url.toString());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimLoading(false);
    }
  };

  // ── Fetch matchups ────────────────────────────────────────────────────────
  const fetchMatchups = async () => {
    setMatchupsLoading(true);
    setMatchups([]);
    try {
      const todayCT = getTodayCTIso();
      if (source === "Today") {
        const { data, error } = await supabase
          .from("today_games")
          .select(["date","home","away","home_win_prob","away_win_prob","vegas_line","vegas_ou","suggested_odds","spread_diff","official_play","model_favorite","percentage_to_match","suggested_spread_raw","suggested_spread_adj"].join(","))
          .eq("date", todayCT).order("date", { ascending: true }).order("home", { ascending: true });
        if (error) { console.error("Error fetching today_games:", error); return; }
        setMatchups((data || []).map(r => ({ source: "TODAY", ...r, score: null, home_margin_actual: null, model_pick: null, model_correct: null, official_pick: null, official_win: null, official_push: null })));
      } else {
        if (!fromDate || !toDate) return;
        let allRows = [], from = 0;
        const pageSize = 1000;
        while (true) {
          const { data, error } = await supabase
            .from("historic_games")
            .select(["date","home","away","home_win_prob","away_win_prob","vegas_line","vegas_ou","suggested_odds","spread_diff","official_play","score","home_margin_actual","model_pick","model_correct","official_pick","official_win","official_push"].join(","))
            .gte("date", fromDate).lte("date", toDate)
            .order("date", { ascending: true }).order("home", { ascending: true })
            .range(from, from + pageSize - 1);
          if (error) { console.error("Error fetching historic_games:", error); return; }
          allRows = allRows.concat(data || []);
          if (!data || data.length < pageSize) break;
          from += pageSize;
        }
        setMatchups(allRows.map(r => ({ source: "HISTORIC", ...r })));
      }
    } finally {
      setMatchupsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) fetchMatchups();
  }, [fromDate, toDate, source]);

  // ── Official record ───────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchOfficialRecord() {
      const todayCT = getTodayCTIso();
      let allRows = [], from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("historic_games")
          .select("official_win,official_push,official_pick,official_play,date")
          .gte("date", "2025-11-01").lte("date", todayCT).range(from, from + 999);
        if (error) { console.error(error); return; }
        allRows = allRows.concat(data || []);
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      const isOfficialPlay = r => {
        const op = String(r.official_play || "").toUpperCase();
        const ok = String(r.official_pick || "").toUpperCase();
        return (op && op !== "NO") || (ok && ok !== "NO_PLAY");
      };
      let wins = 0, losses = 0, pushes = 0;
      for (const r of allRows) {
        if (!isOfficialPlay(r)) continue;
        const w = Number(r.official_win), p = Number(r.official_push);
        if (p === 1) pushes++; else if (w === 1) wins++; else if (w === 0) losses++;
      }
      const denom = wins + losses;
      setOfficialRecord({ wins, losses, pushes, winPct: denom > 0 ? wins / denom : null });
    }
    fetchOfficialRecord();
  }, []);

  useEffect(() => {
    async function fetchYesterdayRecord() {
      const todayCT = getTodayCTIso();
      const dt = new Date(`${todayCT}T00:00:00`);
      dt.setDate(dt.getDate() - 1);
      const yIso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      const { data, error } = await supabase
        .from("historic_games").select("official_win,official_push,official_pick,official_play,date").eq("date", yIso);
      if (error) { console.error(error); return; }
      const isOfficialPlay = r => {
        const op = String(r.official_play || "").toUpperCase();
        const ok = String(r.official_pick || "").toUpperCase();
        return (op && op !== "NO") || (ok && ok !== "NO_PLAY");
      };
      let wins = 0, losses = 0, pushes = 0;
      for (const r of (data || [])) {
        if (!isOfficialPlay(r)) continue;
        const w = Number(r.official_win), p = Number(r.official_push);
        if (p === 1) pushes++; else if (w === 1) wins++; else if (w === 0) losses++;
      }
      const denom = wins + losses;
      setYesterdayRecord({ wins, losses, pushes, winPct: denom > 0 ? wins / denom : null });
    }
    fetchYesterdayRecord();
  }, []);

  // ── Filters + sort ────────────────────────────────────────────────────────
  const filteredMatchups = useMemo(() => {
    const s = searchText.trim().toLowerCase();
    const h = homeContains.trim().toLowerCase();
    const a = awayContains.trim().toLowerCase();
    return (matchups || []).filter(r => {
      if (h && !String(r.home || "").toLowerCase().includes(h)) return false;
      if (a && !String(r.away || "").toLowerCase().includes(a)) return false;
      if (officialPlayFilter !== "All") {
        const op = String(r.official_play || "").toUpperCase();
        const ok = String(r.official_pick || "").toUpperCase();
        const isPlay = (op && op !== "NO") || (ok && ok !== "NO_PLAY");
        if (officialPlayFilter === "Yes" && !isPlay) return false;
        if (officialPlayFilter === "No" && isPlay) return false;
      }
      if (modelCorrectFilter !== "All") {
        const isCorrect = Number(r.model_correct) === 1;
        const isIncorrect = Number(r.model_correct) === 0;
        if (modelCorrectFilter === "Correct" && !isCorrect) return false;
        if (modelCorrectFilter === "Incorrect" && !isIncorrect) return false;
      }
      if (s) {
        const blob = [r.source, r.date, r.home, r.away, r.model_pick, r.official_pick, r.official_play, r.score].filter(Boolean).join(" | ").toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [matchups, homeContains, awayContains, officialPlayFilter, modelCorrectFilter, searchText]);

  const sortedMatchups = useMemo(() => {
    const rows = [...filteredMatchups];
    const getVal = r => {
      const v = r?.[sortKey];
      if (["home_win_prob","away_win_prob","vegas_line","vegas_ou","suggested_odds","spread_diff","model_correct","home_margin_actual"].includes(sortKey)) return Number(v);
      return v ?? "";
    };
    rows.sort((ra, rb) => {
      const a = getVal(ra), b = getVal(rb);
      const aNull = a === null || a === undefined || a === "";
      const bNull = b === null || b === undefined || b === "";
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });
    if (sortDir === "desc") rows.reverse();
    return rows;
  }, [filteredMatchups, sortKey, sortDir]);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Derived sim values ────────────────────────────────────────────────────
  const t1prob = result ? Number(result.team1_win_prob) : null;
  const t2prob = result ? Number(result.team2_win_prob) : null;
  const winner = result && t1prob != null && t2prob != null
    ? (t1prob >= t2prob ? result.team1 : result.team2) : null;

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle = {
    background: "transparent",
    border: "1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)",
    borderRadius: 7,
    padding: "7px 10px",
    fontSize: 13,
    color: "var(--foreground)",
    fontFamily: "var(--font-sans)",
    width: "100%",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.45,
    marginBottom: 5,
    display: "block",
  };

  const thStyle = key => ({
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.5,
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    borderBottom: "2px solid color-mix(in srgb, var(--navbar) 70%, transparent)",
  });

  const COLUMNS = [
    ["date", "Date"],
    ["home", "Home"],
    ["away", "Away"],
    ["home_win_prob", "Home Win%"],
    ["away_win_prob", "Away Win%"],
    ["vegas_line", "Vegas Line"],
    ["vegas_ou", "Vegas O/U"],
    ["suggested_odds", "Sugg. Odds"],
    ["spread_diff", "Spread Diff"],
    ["official_play", "Official Play"],
    ["official_side", "Official Side"],
    ["score", "Final"],
    ["home_margin_actual", "Margin"],
    ["model_pick", "Model Pick"],
    ["model_correct", "Model ✓"],
    ["official_pick", "Official Pick"],
    ["source", "Source"],
  ];

  return (
    <>
      <style>{`
        .dmv-input:focus {
          outline: none;
          border-color: var(--navbar) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--navbar) 25%, transparent);
        }
        .sim-btn:hover { opacity: 0.85; }
        .sim-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .team-card { transition: border-color 0.15s; }
        .team-card:hover { border-color: color-mix(in srgb, var(--navbar) 80%, transparent) !important; }
        .matchup-row:hover { background: color-mix(in srgb, var(--navbar) 12%, transparent); }
        .sort-th:hover { opacity: 0.8 !important; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar { from { width: 0%; } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>

        {/* ── SIMULATOR ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 700, margin: "0 auto 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🏀</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
              CBB Live Matchup Simulator
            </h1>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.4 }}>
              2025–26 season · 100,000 simulations per matchup
            </p>
          </div>

          {/* Team cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end", marginBottom: 16 }}>
            {/* Team 1 */}
            <div className="team-card" style={{
              background: "color-mix(in srgb, var(--navbar) 12%, transparent)",
              border: "1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)",
              borderRadius: 10, padding: 16,
            }}>
              <label style={labelStyle}>Team 1</label>
              <select
                className="dmv-input"
                value={team1}
                onChange={e => { setTeam1(e.target.value); setResult(null); }}
                style={inputStyle}
              >
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {result && !result.error && (
                <div className="fade-up" style={{ marginTop: 12, textAlign: "center" }}>
                  <div style={{
                    fontSize: 30, fontWeight: 700, fontFamily: "var(--font-mono)",
                    color: t1prob >= t2prob ? "#059669" : "#dc2626",
                  }}>
                    {formatPct(t1prob)}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.4, fontFamily: "var(--font-mono)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
                    win probability
                  </div>
                </div>
              )}
            </div>

            {/* VS */}
            <div style={{
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
              opacity: 0.3, letterSpacing: 2,
              paddingBottom: result && !result.error ? 56 : 4,
              transition: "padding-bottom 0.3s",
            }}>VS</div>

            {/* Team 2 */}
            <div className="team-card" style={{
              background: "color-mix(in srgb, var(--navbar) 12%, transparent)",
              border: "1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)",
              borderRadius: 10, padding: 16,
            }}>
              <label style={labelStyle}>Team 2</label>
              <select
                className="dmv-input"
                value={team2}
                onChange={e => { setTeam2(e.target.value); setResult(null); }}
                style={inputStyle}
              >
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {result && !result.error && (
                <div className="fade-up" style={{ marginTop: 12, textAlign: "center" }}>
                  <div style={{
                    fontSize: 30, fontWeight: 700, fontFamily: "var(--font-mono)",
                    color: t2prob > t1prob ? "#059669" : "#dc2626",
                  }}>
                    {formatPct(t2prob)}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.4, fontFamily: "var(--font-mono)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
                    win probability
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simulate button */}
          <button
            className="sim-btn"
            onClick={simulateLiveMatchup}
            disabled={simLoading || !team1 || !team2}
            style={{
              width: "100%", background: "var(--navbar)", color: "var(--foreground)",
              border: "none", borderRadius: 8, padding: "12px 0",
              fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)",
              letterSpacing: 1, cursor: "pointer", transition: "opacity 0.15s",
              marginBottom: 16,
            }}
          >
            {simLoading ? "Simulating 100,000 games…" : "Simulate Live Matchup"}
          </button>

          {/* Result card */}
          {result && !result.error && (
            <div className="fade-up" style={{
              border: "1.5px solid color-mix(in srgb, var(--navbar) 50%, transparent)",
              borderRadius: 10, overflow: "hidden",
            }}>
              {/* Winner banner */}
              <div style={{
                background: "color-mix(in srgb, var(--navbar) 25%, transparent)",
                padding: "14px 20px", textAlign: "center",
                borderBottom: "1px solid color-mix(in srgb, var(--navbar) 35%, transparent)",
              }}>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", opacity: 0.4, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Projected Winner (Neutral Court)
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {winner}&nbsp;
                  <span style={{ color: "#059669", fontFamily: "var(--font-mono)" }}>
                    {formatPct(Math.max(t1prob, t2prob))}
                  </span>
                </div>
                {expectedSpreadText && (
                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>
                    Expected to win by <strong>{expectedSpreadText.line}</strong> points
                  </div>
                )}
              </div>

              {/* Probability bar */}
              <div style={{ padding: "18px 20px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
                  <span>{result.team1}</span>
                  <span>{result.team2}</span>
                </div>
                <div style={{
                  height: 10, borderRadius: 99,
                  background: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${t1prob * 100}%`,
                    background: t1prob >= t2prob ? "#059669" : "#dc2626",
                    borderRadius: 99,
                    animation: "growBar 0.6s ease both",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: t1prob >= t2prob ? "#059669" : "#dc2626" }}>
                    {formatPct(t1prob)}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: t2prob > t1prob ? "#059669" : "#dc2626" }}>
                    {formatPct(t2prob)}
                  </span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.3, textAlign: "center", marginTop: 10, fontFamily: "var(--font-mono)", letterSpacing: 1 }}>
                  BASED ON 100,000 SIMULATED GAMES
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="fade-up" style={{
              border: "1.5px solid #dc262644", borderRadius: 10,
              padding: "14px 20px", textAlign: "center", color: "#dc2626", fontSize: 13,
            }}>
              {result.error}
            </div>
          )}
        </div>

        {/* ── DAILY MATCHUPS ────────────────────────────────────────────── */}
        <div>
          {/* Section header + record badges */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Daily Matchups</h2>

              {/* Season record badge */}
              <span style={{
                background: "color-mix(in srgb, var(--navbar) 30%, transparent)",
                border: "1.5px solid color-mix(in srgb, var(--navbar) 50%, transparent)",
                borderRadius: 20, padding: "4px 12px",
                fontSize: 12, fontFamily: "var(--font-mono)",
                display: "inline-flex", gap: 6, alignItems: "center",
              }}>
                <span style={{ opacity: 0.5, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Season</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>{officialRecord.wins}W</span>
                <span style={{ opacity: 0.3 }}>–</span>
                <span style={{ color: "#dc2626", fontWeight: 700 }}>{officialRecord.losses}L</span>
                <span style={{ opacity: 0.3 }}>–</span>
                <span style={{ opacity: 0.6 }}>{officialRecord.pushes}P</span>
                {officialRecord.winPct !== null && (
                  <span style={{ opacity: 0.6 }}>· {(officialRecord.winPct * 100).toFixed(1)}%</span>
                )}
              </span>

              {/* Yesterday badge */}
              <span style={{
                background: "color-mix(in srgb, var(--navbar) 15%, transparent)",
                border: "1.5px solid color-mix(in srgb, var(--navbar) 35%, transparent)",
                borderRadius: 20, padding: "4px 12px",
                fontSize: 12, fontFamily: "var(--font-mono)",
                display: "inline-flex", gap: 6, alignItems: "center",
              }}>
                <span style={{ opacity: 0.5, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Yesterday</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>{yesterdayRecord.wins}W</span>
                <span style={{ opacity: 0.3 }}>–</span>
                <span style={{ color: "#dc2626", fontWeight: 700 }}>{yesterdayRecord.losses}L</span>
                <span style={{ opacity: 0.3 }}>–</span>
                <span style={{ opacity: 0.6 }}>{yesterdayRecord.pushes}P</span>
                {yesterdayRecord.winPct !== null && (
                  <span style={{ opacity: 0.6 }}>· {(yesterdayRecord.winPct * 100).toFixed(1)}%</span>
                )}
              </span>
            </div>

            {/* Definition notes */}
            <div style={{
              background: "color-mix(in srgb, var(--navbar) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--navbar) 30%, transparent)",
              borderRadius: 8, padding: "10px 14px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              {[
                ["Official Play", "Model's flagged bet where abs(vegas_line) ≤ 18 and abs(spread_diff) ≥ 5. *Changed from ≥ 4 on 1/9/2026*"],
                ["Home / Away Win %", "Each team's expected probability of winning on a neutral court."],
                ["Suggested Odds", "Neutral-court projection adjusted by a standard 3-point home-court advantage."],
              ].map(([term, def]) => (
                <div key={term} style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 11 }}>{term}</span>
                  <span style={{ opacity: 0.55 }}> — {def}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 14 }}>
            <div style={{ flex: "0 0 auto" }}>
              <label style={labelStyle}>From</label>
              <input
                className="dmv-input" type="date" value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                disabled={source === "Today"}
                style={{ ...inputStyle, width: "auto", opacity: source === "Today" ? 0.4 : 1 }}
              />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <label style={labelStyle}>To</label>
              <input
                className="dmv-input" type="date" value={toDate}
                onChange={e => setToDate(e.target.value)}
                disabled={source === "Today"}
                style={{ ...inputStyle, width: "auto", opacity: source === "Today" ? 0.4 : 1 }}
              />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <label style={labelStyle}>Show</label>
              <select
                className="dmv-input" value={source}
                onChange={e => setSource(e.target.value)}
                style={{ ...inputStyle, width: "auto" }}
              >
                <option value="Today">Today (CT)</option>
                <option value="Historic">Historic</option>
              </select>
            </div>
            <button
              className="sim-btn"
              onClick={fetchMatchups}
              style={{
                background: "var(--navbar)", color: "var(--foreground)",
                border: "none", borderRadius: 7, padding: "8px 20px",
                fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                letterSpacing: 0.5, cursor: "pointer", transition: "opacity 0.15s",
                alignSelf: "flex-end",
              }}
            >
              {matchupsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {/* Filters row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
            {[
              ["Home contains", homeContains, setHomeContains, "e.g. Duke"],
              ["Away contains", awayContains, setAwayContains, "e.g. Kentucky"],
            ].map(([label, val, setter, ph]) => (
              <div key={label}>
                <label style={labelStyle}>{label}</label>
                <input
                  className="dmv-input" value={val}
                  onChange={e => setter(e.target.value)}
                  placeholder={ph} style={inputStyle}
                />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Official Play</label>
              <select className="dmv-input" value={officialPlayFilter} onChange={e => setOfficialPlayFilter(e.target.value)} style={inputStyle}>
                <option value="All">All</option>
                <option value="Yes">Official Only</option>
                <option value="No">Non-Official</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Model Correct</label>
              <select className="dmv-input" value={modelCorrectFilter} onChange={e => setModelCorrectFilter(e.target.value)} style={inputStyle}>
                <option value="All">All</option>
                <option value="Correct">Correct</option>
                <option value="Incorrect">Incorrect</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Search</label>
              <input
                className="dmv-input" value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search date / teams / picks…" style={inputStyle}
              />
            </div>
          </div>

          {/* Row count */}
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", opacity: 0.4, marginBottom: 8 }}>
            {sortedMatchups.length} game{sortedMatchups.length !== 1 ? "s" : ""}
            {matchups.length !== sortedMatchups.length ? ` / ${matchups.length} total` : ""}
          </div>

          {/* Table */}
          <div style={{
            borderRadius: 10,
            border: "1.5px solid color-mix(in srgb, var(--navbar) 50%, transparent)",
            overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1400, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "color-mix(in srgb, var(--navbar) 25%, transparent)" }}>
                    {COLUMNS.map(([key, label]) => (
                      <th
                        key={key}
                        className="sort-th"
                        onClick={() => toggleSort(key)}
                        style={thStyle(key)}
                      >
                        {label}
                        {sortKey === key && (
                          <span style={{ marginLeft: 3, fontSize: 9 }}>{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedMatchups.map((r, idx) => {
                    const isHistoric = r.source === "HISTORIC";
                    const mc = Number(r.model_correct);
                    const op = String(r.official_play || "").toUpperCase();
                    const ok = String(r.official_pick || "").toUpperCase();
                    const isOfficialPlay = (op && op !== "NO") || (ok && ok !== "NO_PLAY");
                    const ow = Number(r.official_win);
                    const push = Number(r.official_push);
                    let rowBg = "transparent";
                    if (isHistoric && isOfficialPlay && push !== 1) {
                      if (ow === 1) rowBg = "color-mix(in srgb, #05966920, transparent)";
                      if (ow === 0) rowBg = "color-mix(in srgb, #dc262620, transparent)";
                    }

                    return (
                      <tr
                        key={`${r.source}-${r.date}-${r.home}-${r.away}-${idx}`}
                        className="matchup-row"
                        style={{
                          borderTop: "1px solid color-mix(in srgb, var(--foreground) 6%, transparent)",
                          background: rowBg,
                          animation: `fadeIn 0.2s ease both`,
                          animationDelay: `${Math.min(idx * 15, 300)}ms`,
                        }}
                      >
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.6 }}>{r.date}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontWeight: 600 }}>{r.home}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontWeight: 600 }}>{r.away}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", textAlign: "right" }}>
                          {r.home_win_prob != null ? formatPct(r.home_win_prob) : ""}
                        </td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", textAlign: "right" }}>
                          {r.away_win_prob != null ? formatPct(r.away_win_prob) : ""}
                        </td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", textAlign: "right" }}>{fmtLine(r.vegas_line)}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", textAlign: "right" }}>{fmtLine(r.vegas_ou)}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", textAlign: "right" }}>{fmtLine(r.suggested_odds)}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", textAlign: "right" }}>{fmtLine(r.spread_diff)}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                          {String(r.official_play || "").toUpperCase() === "YES" ? (
                            <span style={{
                              background: "color-mix(in srgb, #059669 18%, transparent)",
                              color: "#059669",
                              border: "1px solid #05966944",
                              borderRadius: 5, padding: "2px 8px",
                              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                            }}>YES</span>
                          ) : (r.official_play ?? "")}
                        </td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontWeight: 600, color: "var(--navbar)" }}>
                          {getOfficialPickDisplay(r)}
                        </td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>{r.score ?? ""}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", textAlign: "right" }}>{r.home_margin_actual ?? ""}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{r.model_pick ?? ""}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap", textAlign: "center" }}>
                          {r.model_correct === 1 || r.model_correct === "1" ? (
                            <span style={{ color: "#059669", fontWeight: 700 }}>✓</span>
                          ) : r.model_correct === 0 || r.model_correct === "0" ? (
                            <span style={{ color: "#dc2626", fontWeight: 700 }}>✗</span>
                          ) : ""}
                        </td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{r.official_pick ?? ""}</td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                          <span style={{
                            fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: 0.5,
                            opacity: 0.5, textTransform: "uppercase",
                          }}>{r.source}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {!matchupsLoading && sortedMatchups.length === 0 && (
                    <tr>
                      <td colSpan={17} style={{ padding: "40px 20px", textAlign: "center", opacity: 0.35, fontSize: 13 }}>
                        No games found for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}