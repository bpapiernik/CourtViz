// pages/cbbplayer/[id].js  →  route: /cbbplayer/123
//
// CBB per-player detail page. Pulls every column for the player via
// select('*'), so all ~250 stats are available; organizes them into a
// bio header, skill radar, scoring/shot diet, a play-type profile
// (frequency + PPP, the centerpiece), and a four-factors/defense block.
//
// Join: cbb_player_stats.player_id === cbb_team_rosters.athlete_id
// Back link points to /cbb_players.
//
// NOTE: the archetype engine + radar are copied from cbb_players.js so the
// two pages agree. If you'd rather not maintain two copies, lift STYLES /
// groupFor / features / ARCHES / archetypeOf / RADAR into lib/cbb.js and
// import them in both — say the word and I'll do that refactor.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const DEF_RATING_HIGHER_IS_BETTER = true; // mirror cbb_players.js

/* ── Play types (label + col helpers) ─────────────────────────────────── */
const PLAYTYPES = [
  { key: 'rim_attack',       label: 'Rim Attack',        short: 'Rim' },
  { key: 'attack_kick',      label: 'Attack & Kick',     short: 'A&K' },
  { key: 'transition',       label: 'Transition',        short: 'Trans' },
  { key: 'perimeter_sniper', label: 'Spot-Up / Sniper',  short: 'Spot' },
  { key: 'dribble_jumper',   label: 'Dribble Jumper',    short: 'DJ' },
  { key: 'mid_range',        label: 'Mid-Range',         short: 'Mid' },
  { key: 'pnr_passer',       label: 'P&R Passer',        short: 'PnR' },
  { key: 'post_kick',        label: 'Post & Kick',       short: 'P&K' },
  { key: 'hits_cutter',      label: 'Hits Cutter',       short: 'Cut+' },
  { key: 'perimeter_cut',    label: 'Perimeter Cut',     short: 'PCut' },
  { key: 'big_cut_roll',     label: 'Cut / Roll',        short: 'Roll' },
  { key: 'post_up',          label: 'Post-Up',           short: 'Post' },
  { key: 'pick_pop',         label: 'Pick & Pop',        short: 'Pop' },
  { key: 'high_low',         label: 'High-Low',          short: 'HiLo' },
  { key: 'reb_scramble',     label: 'Putback / Scramble',short: 'Scrm' },
].map((p) => ({ ...p,
  pctCol: `off_style_${p.key}_pct`, usgCol: `off_style_${p.key}_usg`, pppCol: `off_style_${p.key}_ppp`,
  pPctCol: `pctile_off_style_${p.key}_pct`, pUsgCol: `pctile_off_style_${p.key}_usg`, pPppCol: `pctile_off_style_${p.key}_ppp` }));

const POS_GROUPS = [
  { key: 'Guard',   color: '#2563eb', test: (p) => /(^|\b)(g|pg|sg|guard|combo|lead)/i.test(p) },
  { key: 'Wing',    color: '#0d9488', test: (p) => /(wing|sf|swing|forward-guard|guard-forward)/i.test(p) },
  { key: 'Forward', color: '#d97706', test: (p) => /(pf|f\b|stretch|forward)/i.test(p) },
  { key: 'Big',     color: '#dc2626', test: (p) => /(c\b|center|big|post)/i.test(p) },
];
const groupFor = (pos) =>
  (!pos ? null : POS_GROUPS.find((g) => g.test(String(pos)))) || { key: 'Other', color: '#64748b' };

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const avg = (...xs) => { const v = xs.map(Number).filter((x) => !Number.isNaN(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };

/* ── Archetype engine (kept in sync with cbb_players.js) ──────────────── */
const MIN_CONFIDENCE = 0.42;
function features(row, pctScale) {
  const P = (c) => clamp01((+row[c] || 0) * pctScale / 100);
  const cap = (v) => Math.min(1, v * 4);
  const raw = {}; let sum = 0;
  for (const s of PLAYTYPES) { const v = Math.max(0, +row[s.pctCol] || 0); raw[s.key] = v; sum += v; }
  const share = (k) => (sum > 0 ? raw[k] / sum : 0);
  return {
    usage: P('pctile_off_usage'), assist: P('pctile_off_assist'),
    threeRate: P('pctile_off_threepr'), threeMake: P('pctile_off_threep'),
    rimRate: P('pctile_off_twoprimr'), ftr: P('pctile_off_ftr'),
    orb: P('pctile_off_orb'), drb: P('pctile_def_reb'),
    stl: P('pctile_def_stl'), blk: P('pctile_def_blk'),
    efg: P('pctile_off_efg'), impact: P('pctile_adj_rapm_margin'),
    cPost: cap(share('post_up')), cSelf: cap(share('dribble_jumper')),
    cRim: cap(share('rim_attack')), cPnr: cap(share('pnr_passer')), cPickPop: cap(share('pick_pop')),
  };
}
const ARCHES = [
  { id: 'lead_guard', label: 'Lead Guard', color: '#2563eb', pos: { Guard: 1, Wing: 0.55, Forward: 0.3, Big: 0.1 }, f: (x) => 0.55 * x.assist + 0.35 * x.usage + 0.10 * x.cPnr },
  { id: 'shot_creator', label: 'Shot Creator', color: '#1d4ed8', pos: { Guard: 1, Wing: 0.9, Forward: 0.4, Big: 0.15 }, f: (x) => 0.5 * x.usage + 0.35 * x.cSelf + 0.15 * (1 - x.assist) },
  { id: 'sniper', label: 'Movement Sniper', color: '#3b82f6', pos: { Guard: 0.9, Wing: 1, Forward: 0.7, Big: 0.3 }, f: (x) => 0.4 * x.threeRate + 0.35 * x.threeMake + 0.25 * (1 - x.usage) },
  { id: 'three_d', label: '3-and-D Wing', color: '#0891b2', pos: { Guard: 0.7, Wing: 1, Forward: 0.8, Big: 0.3 }, f: (x) => 0.35 * x.threeMake + 0.40 * Math.max(x.stl, x.blk) + 0.25 * (1 - x.usage) },
  { id: 'slasher', label: 'Slasher', color: '#0d9488', pos: { Guard: 0.9, Wing: 1, Forward: 0.7, Big: 0.4 }, f: (x) => 0.4 * Math.max(x.rimRate, x.cRim) + 0.3 * x.ftr + 0.3 * (1 - x.threeRate) },
  { id: 'connector', label: 'Connector', color: '#16a34a', pos: { Guard: 0.6, Wing: 0.9, Forward: 1, Big: 0.5 }, f: (x) => 0.5 * x.assist + 0.3 * x.efg + 0.2 * (1 - x.usage) },
  { id: 'forward_hub', label: 'Forward Hub', color: '#ca8a04', pos: { Guard: 0.2, Wing: 0.6, Forward: 1, Big: 0.8 }, f: (x) => 0.4 * x.usage + 0.3 * Math.max(x.rimRate, x.cPost) + 0.15 * x.orb + 0.15 * x.assist },
  { id: 'stretch_big', label: 'Stretch Big', color: '#d97706', pos: { Guard: 0.1, Wing: 0.4, Forward: 0.8, Big: 1 }, f: (x) => 0.5 * x.threeRate + 0.5 * x.cPickPop },
  { id: 'rim_runner', label: 'Rim-Running Big', color: '#ea580c', pos: { Guard: 0.05, Wing: 0.2, Forward: 0.6, Big: 1 }, f: (x) => 0.4 * Math.max(x.rimRate, x.cRim) + 0.3 * x.orb + 0.3 * (1 - x.threeRate) },
  { id: 'post_hub', label: 'Post Hub', color: '#dc2626', pos: { Guard: 0.05, Wing: 0.2, Forward: 0.7, Big: 1 }, f: (x) => 0.55 * x.cPost + 0.25 * x.assist + 0.20 * x.usage },
  { id: 'glass_rim', label: 'Glass & Rim Protect', color: '#b91c1c', pos: { Guard: 0.05, Wing: 0.2, Forward: 0.6, Big: 1 }, f: (x) => 0.4 * Math.max(x.orb, x.drb) + 0.4 * x.blk + 0.2 * (1 - x.usage) },
];
function archetypeOf(row, pctScale) {
  const x = features(row, pctScale); const grp = groupFor(row.posClass);
  let best = null;
  for (const a of ARCHES) { const s = clamp01(a.f(x)) * (a.pos[grp.key] ?? 0.5); if (!best || s > best.s) best = { ...a, s }; }
  const imp = x.impact;
  const qualifier = imp >= 0.85 ? 'elite' : imp >= 0.65 ? 'strong' : imp >= 0.40 ? 'solid' : 'role';
  if (!best || best.s < MIN_CONFIDENCE) return { label: `Balanced ${grp.key}`, color: grp.color, qualifier };
  return { label: best.label, color: best.color, qualifier };
}

/* ── Radar (mirrors cbb_players.js) ───────────────────────────────────── */
const RADAR = [
  { key: 'Shoot',  get: (r) => +r.pctile_off_threep || 0 },
  { key: 'Finish', get: (r) => +r.pctile_off_twoprim || 0 },
  { key: 'Pass',   get: (r) => +r.pctile_off_assist || 0 },
  { key: 'Reb',    get: (r) => avg(r.pctile_off_reb, r.pctile_def_reb) },
  { key: 'Def',    get: (r) => +r.pctile_def_adj_rtg || 0, invert: !DEF_RATING_HIGHER_IS_BETTER },
  { key: 'Volume', get: (r) => +r.pctile_off_usage || 0 },
];

/* ── Scale + format helpers ───────────────────────────────────────────── */
function detectPctScale(rows) {
  let max = 0;
  for (const r of rows) for (const k in r) if (k.startsWith('pctile_')) { const v = +r[k]; if (!Number.isNaN(v)) max = Math.max(max, v); }
  return max <= 1.5 ? 100 : 1;
}
function detectRateScale(rows, col) {
  let max = 0; for (const r of rows) { const v = +r[col]; if (!Number.isNaN(v)) max = Math.max(max, v); }
  return max <= 1.5 ? 100 : 1;
}
const pctColor = (p) => (p >= 66 ? '#059669' : p >= 40 ? '#d97706' : '#dc2626');
const fmt = (v, d = 1) => (v === null || v === undefined || Number.isNaN(+v) ? '—' : (+v).toFixed(d));
function fmtHeight(h) {
  const n = +h; if (Number.isNaN(n) || !n) return null;
  let inches = n;
  if (n >= 150 && n <= 230) inches = n / 2.54; // cm → in
  if (inches < 60 || inches > 95) return `${n}`;
  return `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`;
}
const pickKey = (sample, cands) => (sample ? cands.find((k) => k in sample) || null : null);
async function fetchAll(buildQuery) {
  let rows = [], from = 0; const PAGE = 1000;
  for (;;) { const { data, error } = await buildQuery(from, from + PAGE - 1); if (error) { console.error('[cbbplayer]', error); break; } if (!data?.length) break; rows = rows.concat(data); if (data.length < PAGE) break; from += PAGE; }
  return rows;
}

/* ── Small UI atoms ───────────────────────────────────────────────────── */
function Radar({ row, color, scale, size = 200 }) {
  const c = size / 2, R = size / 2 - 26, n = RADAR.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [c + Math.cos(a) * r, c + Math.sin(a) * r]; };
  const vals = RADAR.map((m) => { let v = Math.max(0, Math.min(100, m.get(row) * scale)); if (m.invert) v = 100 - v; return v; });
  const poly = vals.map((v, i) => pt(i, (v / 100) * R).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((f, k) => <polygon key={k} points={RADAR.map((_, i) => pt(i, R * f).join(',')).join(' ')} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />)}
      {RADAR.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />; })}
      <polygon points={poly} fill={`${color}30`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => { const [x, y] = pt(i, (v / 100) * R); return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />; })}
      {RADAR.map((m, i) => { const [x, y] = pt(i, R + 13); return <text key={m.key} x={x} y={y} fontSize="10" fontWeight="700" fill="#6b7280" textAnchor="middle" dominantBaseline="middle" style={{ letterSpacing: 0.3, textTransform: 'uppercase' }}>{m.key}</text>; })}
    </svg>
  );
}
function Tile({ label, value, sub, color }) {
  return (
    <div style={S.tile}>
      <div style={{ ...S.tileVal, color: color || '#111827' }}>{value}</div>
      <div style={S.tileLabel}>{label}</div>
      {sub != null && <div style={S.tileSub}>{sub}</div>}
    </div>
  );
}
function PctBar({ label, pctile, value }) {
  const p = Math.max(0, Math.min(100, pctile));
  return (
    <div style={S.pbRow}>
      <span style={S.pbLabel}>{label}</span>
      <div style={S.pbTrack}><div style={{ ...S.pbFill, width: `${p}%`, background: pctColor(p) }} /></div>
      <span style={S.pbVal}>{value}</span>
      <span style={{ ...S.pbPct, color: pctColor(p) }}>{Math.round(p)}</span>
    </div>
  );
}

/* ── Play-type frequency × efficiency scatter ─────────────────────────── */
function PlayScatter({ data, maxFreq }) {
  const W = 320, H = 300, padL = 36, padB = 34, padT = 14, padR = 14;
  const ix = (f) => padL + (f / (maxFreq || 1)) * (W - padL - padR);
  const iy = (p) => padT + (1 - p / 100) * (H - padT - padB);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 380 }}>
      <line x1={padL} y1={iy(50)} x2={W - padR} y2={iy(50)} stroke="rgba(0,0,0,0.10)" strokeDasharray="4 4" />
      <line x1={ix(maxFreq / 2)} y1={padT} x2={ix(maxFreq / 2)} y2={H - padB} stroke="rgba(0,0,0,0.10)" strokeDasharray="4 4" />
      <text x={W - padR} y={padT + 8} fontSize="8" fill="#059669" textAnchor="end" fontWeight="700">EFFICIENT ↑</text>
      <text x={W - padR} y={H - padB - 4} fontSize="8" fill="#dc2626" textAnchor="end" fontWeight="700">INEFFICIENT ↓</text>
      <text x={padL} y={H - 6} fontSize="9" fill="#9ca3af" textAnchor="start">← less used</text>
      <text x={W - padR} y={H - 6} fontSize="9" fill="#9ca3af" textAnchor="end">more used →</text>
      {data.map((d) => {
        const r = 4 + Math.min(10, (d.usg || 0) * 18);
        return (
          <g key={d.key}>
            <circle cx={ix(d.freq)} cy={iy(d.pppPct)} r={r} fill={`${pctColor(d.pppPct)}55`} stroke={pctColor(d.pppPct)} strokeWidth="1.25" />
            <text x={ix(d.freq)} y={iy(d.pppPct) - r - 2} fontSize="8" fontWeight="700" fill="#374151" textAnchor="middle">{d.short}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function CbbPlayer() {
  const router = useRouter();
  const { id } = router.query;

  const [rows, setRows] = useState([]);
  const [roster, setRoster] = useState([]);
  const [pctScale, setPctScale] = useState(1);
  const [usgScale, setUsgScale] = useState(1);
  const [season, setSeason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const [stats, ros] = await Promise.all([
        fetchAll((lo, hi) => supabase.from('cbb_player_stats').select('*').eq('player_id', id).range(lo, hi)),
        fetchAll((lo, hi) => supabase.from('cbb_team_rosters').select('*').eq('athlete_id', id).range(lo, hi)),
      ]);
      if (!alive) return;
      setPctScale(detectPctScale(stats));
      setUsgScale(detectRateScale(stats, 'off_usage'));
      setRows(stats);
      setRoster(ros);
      const seasonsSorted = [...new Set(stats.map((r) => r.season).filter(Boolean))].sort().reverse();
      setSeason(seasonsSorted[0] || '');
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  const seasons = useMemo(() => [...new Set(rows.map((r) => r.season).filter(Boolean))].sort().reverse(), [rows]);
  const row = useMemo(() => rows.find((r) => r.season === season) || rows[0] || null, [rows, season]);
  const bio = useMemo(() => roster.find((r) => r.season === season) || roster[0] || null, [roster, season]);

  const playData = useMemo(() => {
    if (!row) return { rows: [], maxFreq: 0 };
    const items = PLAYTYPES.map((pt) => ({
      key: pt.key, label: pt.label, short: pt.short,
      freq: Math.max(0, +row[pt.pctCol] || 0),
      usg: Math.max(0, +row[pt.usgCol] || 0),
      ppp: +row[pt.pppCol],
      pppPct: Math.max(0, Math.min(100, (+row[pt.pPppCol] || 0) * pctScale)),
    })).filter((d) => d.freq > 0.005);
    items.sort((a, b) => b.freq - a.freq);
    const maxFreq = items.reduce((m, d) => Math.max(m, d.freq), 0);
    return { rows: items, maxFreq };
  }, [row, pctScale]);

  if (loading) return <div style={S.page}><div style={S.shell}><div style={S.empty}>Loading…</div></div></div>;
  if (!row) return <div style={S.page}><div style={S.shell}><Link href="/cbb_players" style={S.back}>← Player Board</Link><div style={S.empty}>No stats found for this player.</div></div></div>;

  const g = groupFor(row.posClass);
  const arch = archetypeOf(row, pctScale);
  const head = pickKey(bio, ['athlete_headshot_href', 'athlete_headshot', 'headshot', 'athlete_headshot_url']);
  const logo = pickKey(bio, ['logo', 'team_logo']);
  const posKey = pickKey(bio, ['athlete_position_name', 'athlete_position_abbreviation', 'athlete_position']);
  const expKey = pickKey(bio, ['athlete_experience_displayValue', 'athlete_experience_abbreviation', 'athlete_experience_value', 'athlete_experience_years']);
  const cityKey = pickKey(bio, ['athlete_birth_place_city', 'athlete_birth_city']);
  const stateKey = pickKey(bio, ['athlete_birth_place_state', 'athlete_birth_state']);
  const heightKey = pickKey(bio, ['athlete_height']);
  const weightKey = pickKey(bio, ['athlete_weight']);
  const jerseyKey = pickKey(bio, ['athlete_jersey']);

  const ht = bio && heightKey ? fmtHeight(bio[heightKey]) : null;
  const wt = bio && weightKey && bio[weightKey] ? `${Math.round(+bio[weightKey])} lb` : null;
  const jersey = bio && jerseyKey && bio[jerseyKey] != null ? `#${Math.round(+bio[jerseyKey])}` : null;
  const exp = bio && expKey ? bio[expKey] : null;
  const home = bio && cityKey ? [bio[cityKey], stateKey ? bio[stateKey] : null].filter(Boolean).join(', ') : null;
  const chips = [jersey, ht, wt, exp, posKey && bio ? bio[posKey] : null, home].filter(Boolean);

  const pct = (c, d = 0) => fmt((+row[c] || 0) * pctScale, d);                 // percentile display
  const rate = (c, d = 1) => fmt((+row[c] || 0) * 100, d);                    // fraction → %
  const usage = fmt((+row.off_usage || 0) * usgScale, 1);

  return (
    <div style={S.page}>
      <div style={S.shell}>
        <Link href="/cbb_players" style={S.back}>← Player Board</Link>

        {/* Header */}
        <div style={S.headCard}>
          <div style={{ ...S.bigAvatar, borderColor: g.color }}>
            {head && bio[head] ? <img src={bio[head]} alt="" style={S.bigAvatarImg} /> : <span style={S.bigAvatarFallback}>{(row.player_name || '?')[0]}</span>}
            {logo && bio[logo] && <img src={bio[logo]} alt="" style={S.bigLogo} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.eyebrow}>{row.team} · {row.conf}</div>
            <h1 style={S.name}>{row.player_name}</h1>
            <div style={S.tagRow}>
              <span style={{ ...S.posBadge, color: g.color, borderColor: `${g.color}55` }}>{row.posClass || g.key}</span>
              <span style={{ ...S.archTag, color: arch.color, borderColor: `${arch.color}40`, background: `${arch.color}12` }}>
                {arch.label} <span style={{ color: '#6b7280', fontWeight: 600 }}>· {arch.qualifier}</span>
              </span>
              {seasons.length > 1 && (
                <select style={S.seasonSel} value={season} onChange={(e) => setSeason(e.target.value)}>
                  {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
            {chips.length > 0 && <div style={S.chips}>{chips.map((c, i) => <span key={i} style={S.chip}>{c}</span>)}</div>}
          </div>
        </div>

        {/* Headline strip */}
        <div style={S.strip}>
          <Tile label="RAPM±" value={(+row.adj_rapm_margin >= 0 ? '+' : '') + fmt(row.adj_rapm_margin, 2)} color={+row.adj_rapm_margin >= 0 ? '#059669' : '#dc2626'} />
          <Tile label="Off Rtg" value={fmt(row.off_adj_rtg, 1)} sub={`${pct('pctile_off_adj_rtg')} pct`} />
          <Tile label="Def Rtg" value={fmt(row.def_adj_rtg, 1)} sub={`${pct('pctile_def_adj_rtg')} pct`} />
          <Tile label="Usage" value={`${usage}%`} sub={`${pct('pctile_off_usage')} pct`} />
          <Tile label="eFG" value={`${rate('off_efg')}%`} sub={`${pct('pctile_off_efg')} pct`} />
          <Tile label="Poss" value={Math.round((+row.off_poss || 0) + (+row.def_poss || 0))} />
        </div>

        {/* Radar + scoring profile */}
        <div style={S.twoCol}>
          <section style={S.card}>
            <h2 style={S.h2}>Skill Profile</h2>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
              <Radar row={row} color={arch.color} scale={pctScale} />
            </div>
            <p style={S.note}>Percentile vs. all D-I players. Defense uses adjusted defensive rating.</p>
          </section>

          <section style={S.card}>
            <h2 style={S.h2}>Scoring Profile</h2>
            {/* shot diet */}
            <div style={S.diet}>
              {[
                { label: 'Rim', r: 'off_twoprimr', m: 'off_twoprim', a: 'off_twoprim_ast', c: '#dc2626' },
                { label: 'Mid', r: 'off_twopmidr', m: 'off_twopmid', a: 'off_twopmid_ast', c: '#d97706' },
                { label: '3PT', r: 'off_threepr', m: 'off_threep', a: 'off_threep_ast', c: '#2563eb' },
              ].map((s) => {
                const share = (+row[s.r] || 0) * 100;
                return (
                  <div key={s.label} style={S.dietRow}>
                    <span style={S.dietLabel}>{s.label}</span>
                    <div style={S.dietTrack}><div style={{ ...S.dietFill, width: `${Math.min(100, share)}%`, background: s.c }} /></div>
                    <span style={S.dietShare}>{fmt(share, 0)}%</span>
                    <span style={S.dietMake}>{rate(s.m, 1)}%</span>
                  </div>
                );
              })}
              <div style={S.dietHead}><span style={S.dietLabel} /><span style={{ flex: 1 }} /><span style={S.dietShareH}>FREQ</span><span style={S.dietMakeH}>FG%</span></div>
            </div>
            <div style={S.splitRow}>
              <Tile label="FT%" value={`${rate('off_ft')}%`} />
              <Tile label="FT Rate" value={rate('off_ftr', 0)} />
              <Tile label="AST%" value={pct('pctile_off_assist')} sub="pct" />
              <Tile label="TO%" value={pct('pctile_off_to')} sub="pct" />
            </div>
          </section>
        </div>

        {/* Play-type profile — the centerpiece */}
        <section style={S.card}>
          <h2 style={S.h2}>Play-Type Profile</h2>
          <p style={S.note}>Sorted by frequency. Bar = how often they run it; PPP color = efficiency percentile (green efficient → red not). The scatter plots frequency against efficiency — top-right is their bread and butter, bottom-right is where opponents want them.</p>
          <div style={S.playWrap}>
            <div style={{ flex: '1 1 380px', minWidth: 280 }}>
              {playData.rows.map((d) => (
                <div key={d.key} style={S.playRow}>
                  <span style={S.playLabel}>{d.label}</span>
                  <div style={S.playTrack}><div style={{ ...S.playFill, width: `${(d.freq / (playData.maxFreq || 1)) * 100}%`, background: pctColor(d.pppPct) }} /></div>
                  <span style={S.playFreq}>{fmt(d.freq * 100, 1)}%</span>
                  <span style={{ ...S.playPpp, color: pctColor(d.pppPct) }}>{Number.isNaN(d.ppp) ? '—' : (d.ppp).toFixed(2)}</span>
                  <span style={S.playPppPct}>{Math.round(d.pppPct)}</span>
                </div>
              ))}
              <div style={S.playHead}>
                <span style={{ ...S.playLabel, color: '#9ca3af' }}>PLAY TYPE</span>
                <span style={{ flex: 1 }} />
                <span style={S.playFreqH}>FREQ</span>
                <span style={S.playPppH}>PPP</span>
                <span style={S.playPppPctH}>%ILE</span>
              </div>
            </div>
            <div style={{ flex: '1 1 320px', minWidth: 260, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <PlayScatter data={playData.rows} maxFreq={playData.maxFreq} />
            </div>
          </div>
        </section>

        {/* Four factors + defense */}
        <div style={S.twoCol}>
          <section style={S.card}>
            <h2 style={S.h2}>Offense — Four Factors</h2>
            <PctBar label="eFG%" pctile={(+row.pctile_off_efg || 0) * pctScale} value={`${rate('off_efg')}%`} />
            <PctBar label="3PT%" pctile={(+row.pctile_off_threep || 0) * pctScale} value={`${rate('off_threep')}%`} />
            <PctBar label="Rim FG%" pctile={(+row.pctile_off_twoprim || 0) * pctScale} value={`${rate('off_twoprim')}%`} />
            <PctBar label="TO%" pctile={(+row.pctile_off_to || 0) * pctScale} value={rate('off_to', 1)} />
            <PctBar label="FT Rate" pctile={(+row.pctile_off_ftr || 0) * pctScale} value={rate('off_ftr', 0)} />
            <PctBar label="O-Reb%" pctile={(+row.pctile_off_orb || 0) * pctScale} value={rate('off_orb', 1)} />
            <PctBar label="Assist%" pctile={(+row.pctile_off_assist || 0) * pctScale} value={rate('off_assist', 1)} />
          </section>
          <section style={S.card}>
            <h2 style={S.h2}>Defense & Hustle</h2>
            <PctBar label="Def Rtg" pctile={DEF_RATING_HIGHER_IS_BETTER ? (+row.pctile_def_adj_rtg || 0) * pctScale : 100 - (+row.pctile_def_adj_rtg || 0) * pctScale} value={fmt(row.def_adj_rtg, 1)} />
            <PctBar label="Steal%" pctile={(+row.pctile_def_stl || 0) * pctScale} value={rate('def_stl', 1)} />
            <PctBar label="Block%" pctile={(+row.pctile_def_blk || 0) * pctScale} value={rate('def_blk', 1)} />
            <PctBar label="D-Reb%" pctile={(+row.pctile_def_reb || 0) * pctScale} value={rate('def_reb', 1)} />
            <PctBar label="Foul%" pctile={(+row.pctile_def_fc || 0) * pctScale} value={rate('def_fc', 1)} />
            <PctBar label="Def RAPM" pctile={(+row.pctile_def_adj_rapm || 0) * pctScale} value={fmt(row.def_adj_rapm, 2)} />
          </section>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--background, #f4f1ea)', color: 'var(--foreground, #1a1a1a)', fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' },
  shell: { maxWidth: 1080, margin: '0 auto', padding: '28px 20px 80px' },
  back: { display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#6b7280', textDecoration: 'none', marginBottom: 20, letterSpacing: 0.3 },
  empty: { padding: 80, textAlign: 'center', color: '#9ca3af' },
  headCard: { display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  bigAvatar: { position: 'relative', width: 96, height: 96, borderRadius: '50%', flexShrink: 0, border: '3px solid', background: '#e5e7eb', display: 'grid', placeItems: 'center' },
  bigAvatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  bigAvatarFallback: { fontSize: 34, fontWeight: 800, color: '#9ca3af' },
  bigLogo: { position: 'absolute', bottom: -4, right: -4, width: 36, height: 36, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' },
  eyebrow: { fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5 },
  name: { margin: '4px 0 8px', fontSize: 34, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 },
  tagRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  posBadge: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', padding: '2px 9px', border: '1px solid', borderRadius: 6 },
  archTag: { fontSize: 13, fontWeight: 800, padding: '3px 11px', border: '1px solid', borderRadius: 8 },
  seasonSel: { padding: '5px 10px', fontSize: 12, fontWeight: 700, background: '#fff', border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, cursor: 'pointer' },
  chips: { display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 },
  chip: { fontSize: 12, fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 7, padding: '3px 9px' },
  strip: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 },
  tile: { background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 12, padding: '12px 14px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
  tileVal: { fontFamily: 'var(--font-mono, monospace)', fontSize: 21, fontWeight: 800, lineHeight: 1 },
  tileLabel: { fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5 },
  tileSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 },
  card: { background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 16, padding: 18, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
  h2: { margin: '0 0 10px', fontSize: 15, fontWeight: 800, letterSpacing: -0.2 },
  note: { fontSize: 11.5, color: '#9ca3af', lineHeight: 1.5, margin: '4px 0 0' },
  diet: { margin: '4px 0 12px' },
  dietRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  dietHead: { display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 4 },
  dietLabel: { width: 34, fontSize: 12, fontWeight: 700, color: '#374151' },
  dietTrack: { flex: 1, height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  dietFill: { height: '100%', borderRadius: 4 },
  dietShare: { width: 38, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700 },
  dietMake: { width: 48, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: '#6b7280' },
  dietShareH: { width: 38, textAlign: 'right', fontSize: 9, color: '#9ca3af', letterSpacing: 1 },
  dietMakeH: { width: 48, textAlign: 'right', fontSize: 9, color: '#9ca3af', letterSpacing: 1 },
  splitRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  playWrap: { display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 12 },
  playRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' },
  playHead: { display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6, marginTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)' },
  playLabel: { width: 124, fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  playTrack: { flex: 1, minWidth: 40, height: 9, borderRadius: 5, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  playFill: { height: '100%', borderRadius: 5 },
  playFreq: { width: 42, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700 },
  playPpp: { width: 38, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 800 },
  playPppPct: { width: 26, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#9ca3af' },
  playFreqH: { width: 42, textAlign: 'right', fontSize: 9, color: '#9ca3af', letterSpacing: 1 },
  playPppH: { width: 38, textAlign: 'right', fontSize: 9, color: '#9ca3af', letterSpacing: 1 },
  playPppPctH: { width: 26, textAlign: 'right', fontSize: 9, color: '#9ca3af', letterSpacing: 1 },
  pbRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' },
  pbLabel: { width: 72, fontSize: 12, fontWeight: 600, color: '#374151' },
  pbTrack: { flex: 1, height: 9, borderRadius: 5, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  pbFill: { height: '100%', borderRadius: 5 },
  pbVal: { width: 52, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: '#374151' },
  pbPct: { width: 26, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 800 },
};