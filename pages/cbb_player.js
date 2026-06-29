// pages/cbb_players.js  →  route: /cbb_players
//
// CBB player directory — visual card grid. Each card derives an archetype
// tag and a 6-spoke percentile radar from cbb_player_stats, and pulls the
// headshot + team logo from cbb_team_rosters. Cards link to the per-player
// page.
//
// ── ROUTING ───────────────────────────────────────────────────────────
// Save the detail page at  pages/cbbplayer/[id].js  → route /cbbplayer/123
// (Next.js won't accept a literal cbb_[id].js filename — a dynamic segment
// must be the whole path segment.) Change PLAYER_ROUTE to repoint.
//
// ── JOIN ──────────────────────────────────────────────────────────────
// You renamed the key to player_id, so the merge is clean:
//   cbb_player_stats.player_id === cbb_team_rosters.athlete_id
//
// ── ROSTER COLUMNS ────────────────────────────────────────────────────
// Headshot/logo field names were truncated in your schema view, so we
// fetch roster rows with select('*') and probe for them at runtime
// (see pickKey). Add candidates there if yours are named differently.
// ──────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const PLAYER_ROUTE = (id) => `/cbbplayer/${id}`;
const BATCH = 48; // cards rendered per "Load more"

/* ── Play-style taxonomy → scouting label + fingerprint color ──────────
   pctCol = share of offensive role; effCol = efficiency percentile.     */
const STYLES = [
  { key: 'rim_attack',       label: 'Rim Attacker',     color: '#10b981' },
  { key: 'attack_kick',      label: 'Driver & Kicker',  color: '#10b981' },
  { key: 'transition',       label: 'Transition Threat',color: '#10b981' },
  { key: 'perimeter_sniper', label: 'Movement Sniper',  color: '#3b82f6' },
  { key: 'dribble_jumper',   label: 'Shot Creator',     color: '#3b82f6' },
  { key: 'mid_range',        label: 'Mid-Range Scorer', color: '#3b82f6' },
  { key: 'pnr_passer',       label: 'P&R Playmaker',    color: '#a855f7' },
  { key: 'post_kick',        label: 'Post Hub',         color: '#a855f7' },
  { key: 'hits_cutter',      label: 'Cutter Feeder',    color: '#a855f7' },
  { key: 'perimeter_cut',    label: 'Perimeter Cutter', color: '#f59e0b' },
  { key: 'big_cut_roll',     label: 'Roll Man',         color: '#f59e0b' },
  { key: 'post_up',          label: 'Post Scorer',      color: '#ef4444' },
  { key: 'pick_pop',         label: 'Pick & Pop',       color: '#ef4444' },
  { key: 'high_low',         label: 'High-Low Big',     color: '#ef4444' },
  { key: 'reb_scramble',     label: 'Putback Finisher', color: '#ef4444' },
].map((s) => ({
  ...s,
  pctCol: `off_style_${s.key}_pct`,
  effCol: `pctile_off_style_${s.key}_ppp`,
}));

/* ── Coarse position group for the headshot ring + pills ──────────────── */
const POS_GROUPS = [
  { key: 'Guard',   color: '#3b82f6', test: (p) => /(^|\b)(g|pg|sg|guard|combo|lead)/i.test(p) },
  { key: 'Wing',    color: '#10b981', test: (p) => /(wing|sf|swing|forward-guard|guard-forward)/i.test(p) },
  { key: 'Forward', color: '#f59e0b', test: (p) => /(pf|f\b|stretch|forward)/i.test(p) },
  { key: 'Big',     color: '#ef4444', test: (p) => /(c\b|center|big|post)/i.test(p) },
];
const groupFor = (pos) =>
  (!pos ? null : POS_GROUPS.find((g) => g.test(String(pos)))) || { key: 'Other', color: '#64748b' };

/* ── Radar spokes (all 0–100 percentiles) ─────────────────────────────── */
const avg = (...xs) => {
  const v = xs.map(Number).filter((x) => !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};
const RADAR = [
  { key: 'Score',  get: (r) => +r.pctile_off_efg || 0 },
  { key: 'Shoot',  get: (r) => +r.pctile_off_threep || 0 },
  { key: 'Pass',   get: (r) => +r.pctile_off_assist || 0 },
  { key: 'Reb',    get: (r) => avg(r.pctile_off_reb, r.pctile_def_reb) },
  { key: 'Def',    get: (r) => avg(r.pctile_def_stl, r.pctile_def_blk) },
  { key: 'Impact', get: (r) => +r.pctile_adj_rapm_margin || 0 },
];

/* ── Column set: identity + radar pctiles + style cols (built from STYLES) */
const BASE_COLS = [
  'player_id', 'player_name', 'team', 'conf', 'season', '"posClass"',
  'transfer_src', 'transfer_dest',
  'off_usage', 'off_efg', 'off_poss', 'def_poss', 'adj_rapm_margin',
  'pctile_adj_rapm_margin', 'pctile_off_efg', 'pctile_off_threep',
  'pctile_off_assist', 'pctile_off_reb', 'pctile_def_reb',
  'pctile_def_stl', 'pctile_def_blk',
];
const STATS_SELECT = [
  ...BASE_COLS,
  ...STYLES.flatMap((s) => [s.pctCol, s.effCol]),
].join(', ');

const pickKey = (sample, cands) => (sample ? cands.find((k) => k in sample) || null : null);

async function fetchAll(buildQuery) {
  let rows = [], from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await buildQuery(from, from + PAGE - 1);
    if (error) { console.error('[cbb_players]', error); break; }
    if (!data?.length) break;
    rows = rows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

function archetypeOf(row) {
  let best = null;
  for (const s of STYLES) {
    const pct = +row[s.pctCol];
    if (!Number.isNaN(pct) && (best === null || pct > best.pct)) {
      best = { ...s, pct, eff: +row[s.effCol] };
    }
  }
  if (!best || !(best.pct > 0)) return { label: 'Role Player', color: '#64748b', qualifier: '' };
  const e = best.eff;
  const qualifier =
    Number.isNaN(e) ? '' :
    e >= 80 ? 'elite' : e >= 62 ? 'efficient' : e >= 40 ? 'solid' : 'volume';
  return { label: best.label, color: best.color, qualifier };
}

/* ── Mini radar SVG ───────────────────────────────────────────────────── */
function Radar({ row, color, size = 132 }) {
  const c = size / 2, R = size / 2 - 18, n = RADAR.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  const vals = RADAR.map((m) => Math.max(0, Math.min(100, m.get(row))));
  const poly = vals.map((v, i) => pt(i, (v / 100) * R).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map((f, k) => (
        <polygon key={k}
          points={RADAR.map((_, i) => pt(i, R * f).join(',')).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {RADAR.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill={`${color}33`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {RADAR.map((m, i) => {
        const [x, y] = pt(i, R + 9);
        return (
          <text key={m.key} x={x} y={y} fontSize="8" fontWeight="700"
            fill="#64748b" textAnchor="middle" dominantBaseline="middle"
            style={{ letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {m.key}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Player card ──────────────────────────────────────────────────────── */
function PlayerCard({ p }) {
  const g = groupFor(p.posClass);
  const arch = archetypeOf(p);
  const rapm = +p.adj_rapm_margin;
  const isTransfer = !!p.transfer_dest;
  return (
    <Link href={p.player_id ? PLAYER_ROUTE(p.player_id) : '#'} style={S.cardLink}>
      <div style={S.card}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${arch.color}66`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}>
        {isTransfer && <span style={S.transferTag}>↪ {p.transfer_src || 'Transfer'}</span>}

        <div style={S.cardTop}>
          <div style={{ ...S.avatar, borderColor: g.color }}>
            {p.headshot
              ? <img src={p.headshot} alt="" style={S.avatarImg} />
              : <span style={S.avatarFallback}>{(p.player_name || '?')[0]}</span>}
            {p.logo && <img src={p.logo} alt="" style={S.logoBadge} />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={S.name}>{p.player_name || 'Unknown'}</div>
            <div style={S.teamLine}>{p.team || '—'} · {p.conf || '—'}</div>
            <span style={{ ...S.posBadge, color: g.color, borderColor: `${g.color}55` }}>
              {p.posClass || g.key}
            </span>
          </div>
        </div>

        <div style={{ ...S.archetype, borderColor: `${arch.color}40`, background: `${arch.color}12` }}>
          <span style={{ color: arch.color, fontWeight: 800 }}>{arch.label}</span>
          {arch.qualifier && <span style={S.qualifier}>· {arch.qualifier}</span>}
        </div>

        <div style={S.radarWrap}><Radar row={p} color={arch.color} /></div>

        <div style={S.statRow}>
          <div style={S.stat}>
            <span style={{ ...S.statVal, color: rapm >= 0 ? '#34d399' : '#f87171' }}>
              {(rapm >= 0 ? '+' : '') + (Number.isNaN(rapm) ? '—' : rapm.toFixed(2))}
            </span>
            <span style={S.statLabel}>RAPM±</span>
          </div>
          <div style={S.stat}>
            <span style={S.statVal}>{p.off_usage != null ? (+p.off_usage).toFixed(1) : '—'}</span>
            <span style={S.statLabel}>USG%</span>
          </div>
          <div style={S.stat}>
            <span style={S.statVal}>{p.poss ? Math.round(p.poss) : '—'}</span>
            <span style={S.statLabel}>Poss</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function CbbPlayers() {
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [conf, setConf] = useState('All');
  const [team, setTeam] = useState('All');
  const [sort, setSort] = useState('name');
  const [visible, setVisible] = useState(BATCH);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await fetchAll((lo, hi) =>
        supabase.from('cbb_player_stats').select('season').range(lo, hi));
      if (!alive) return;
      const uniq = [...new Set(all.map((r) => r.season).filter(Boolean))].sort().reverse();
      setSeasons(uniq);
      setSeason((prev) => prev || uniq[0] || '');
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!season) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const [stats, rosters] = await Promise.all([
        fetchAll((lo, hi) =>
          supabase.from('cbb_player_stats').select(STATS_SELECT).eq('season', season).range(lo, hi)),
        fetchAll((lo, hi) =>
          supabase.from('cbb_team_rosters').select('*').eq('season', season).range(lo, hi)),
      ]);
      if (!alive) return;

      const sample = rosters[0] || null;
      const headKey = pickKey(sample, ['athlete_headshot_href', 'athlete_headshot', 'headshot', 'athlete_headshot_url']);
      const logoKey = pickKey(sample, ['logo', 'team_logo']);
      const byId = new Map();
      for (const r of rosters) if (r.athlete_id != null) byId.set(String(r.athlete_id), r);

      setRows(stats.map((s) => {
        const id = s.player_id != null ? String(Math.trunc(+s.player_id)) : null;
        const r = id ? byId.get(id) : null;
        return {
          ...s,
          player_id: id,
          headshot: r && headKey ? r[headKey] : null,
          logo: r && logoKey ? r[logoKey] : null,
          poss: (+s.off_poss || 0) + (+s.def_poss || 0),
        };
      }));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [season]);

  const conferences = useMemo(
    () => ['All', ...[...new Set(rows.map((r) => r.conf).filter(Boolean))].sort()],
    [rows]
  );
  const teams = useMemo(() => {
    const pool = conf === 'All' ? rows : rows.filter((r) => r.conf === conf);
    return ['All', ...[...new Set(pool.map((r) => r.team).filter(Boolean))].sort()];
  }, [rows, conf]);

  useEffect(() => { setVisible(BATCH); }, [query, conf, team, sort, season]);
  useEffect(() => { setTeam('All'); }, [conf]);

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let out = rows.filter((r) => {
      if (conf !== 'All' && r.conf !== conf) return false;
      if (team !== 'All' && r.team !== team) return false;
      if (terms.length) {
        const hay = `${r.player_name ?? ''} ${r.team ?? ''}`.toLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    out.sort((a, b) => {
      if (sort === 'name') return (a.player_name || '').localeCompare(b.player_name || '');
      if (sort === 'usage') return (+b.off_usage || 0) - (+a.off_usage || 0);
      if (sort === 'poss') return (b.poss || 0) - (a.poss || 0);
      return (+b.adj_rapm_margin || -99) - (+a.adj_rapm_margin || -99); // impact
    });
    return out;
  }, [rows, query, conf, team, sort]);

  return (
    <div style={S.page}>
      <div style={S.shell}>
        <header style={S.header}>
          <div>
            <div style={S.eyebrow}>NCAA · Division I</div>
            <h1 style={S.title}>Player Board</h1>
            <p style={S.sub}>
              Every player carries an archetype and a six-spoke percentile profile.
              Filter by conference and team, then open a card for the full sheet.
            </p>
          </div>
          <div style={S.countWrap}>
            <span style={S.count}>{filtered.length}</span>
            <span style={S.countLabel}>{filtered.length === rows.length ? 'players' : `of ${rows.length}`}</span>
          </div>
        </header>

        <div style={S.controls}>
          <input style={S.search} placeholder="Search player or team…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <select style={S.select} value={season} onChange={(e) => setSeason(e.target.value)}>
            {seasons.length === 0 && <option>Loading…</option>}
            {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={S.select} value={conf} onChange={(e) => setConf(e.target.value)}>
            {conferences.map((c) => <option key={c} value={c}>{c === 'All' ? 'All conferences' : c}</option>)}
          </select>
          <select style={S.select} value={team} onChange={(e) => setTeam(e.target.value)}>
            {teams.map((t) => <option key={t} value={t}>{t === 'All' ? 'All teams' : t}</option>)}
          </select>
          <select style={S.select} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Sort: A–Z</option>
            <option value="impact">Sort: Impact</option>
            <option value="usage">Sort: Usage</option>
            <option value="poss">Sort: Possessions</option>
          </select>
        </div>

        {loading ? (
          <div style={S.empty}>Loading {season} players…</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>No players match those filters.</div>
        ) : (
          <>
            <div style={S.grid}>
              {filtered.slice(0, visible).map((p) => (
                <PlayerCard key={p.player_id || p.player_name} p={p} />
              ))}
            </div>
            {visible < filtered.length && (
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <button style={S.loadMore} onClick={() => setVisible((v) => v + BATCH)}>
                  Load more ({filtered.length - visible} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--background, #0a0e17)', color: 'var(--foreground, #e2e8f0)', fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' },
  shell: { maxWidth: 1180, margin: '0 auto', padding: '40px 20px 80px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 26 },
  eyebrow: { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#f59e0b', marginBottom: 8 },
  title: { margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: -1, lineHeight: 1 },
  sub: { margin: '12px 0 0', fontSize: 13, lineHeight: 1.6, color: '#94a3b8', maxWidth: 480 },
  countWrap: { textAlign: 'right', flexShrink: 0 },
  count: { fontFamily: 'var(--font-mono, monospace)', fontSize: 30, fontWeight: 700 },
  countLabel: { display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5 },
  controls: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 },
  search: { flex: '1 1 220px', minWidth: 160, padding: '11px 14px', fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, color: 'var(--foreground, #e2e8f0)', outline: 'none' },
  select: { padding: '11px 14px', fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, color: 'var(--foreground, #e2e8f0)', outline: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(244px, 1fr))', gap: 16 },
  cardLink: { textDecoration: 'none', color: 'inherit' },
  card: { position: 'relative', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, transition: 'border-color 0.15s, transform 0.15s', height: '100%', boxSizing: 'border-box' },
  transferTag: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, letterSpacing: 0.3, color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 5, padding: '2px 6px' },
  cardTop: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  avatar: { position: 'relative', width: 52, height: 52, borderRadius: '50%', flexShrink: 0, border: '2px solid', background: '#1a2233', display: 'grid', placeItems: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  avatarFallback: { fontSize: 18, fontWeight: 700, color: '#64748b' },
  logoBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, objectFit: 'contain', background: '#0a0e17', borderRadius: '50%', padding: 1 },
  name: { fontSize: 15, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  teamLine: { fontSize: 12, color: '#94a3b8', margin: '3px 0 5px' },
  posBadge: { display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', padding: '1px 7px', border: '1px solid', borderRadius: 5 },
  archetype: { fontSize: 12.5, padding: '7px 11px', border: '1px solid', borderRadius: 9, marginBottom: 10, display: 'flex', gap: 5, alignItems: 'baseline', flexWrap: 'wrap' },
  qualifier: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 },
  radarWrap: { display: 'flex', justifyContent: 'center', margin: '4px 0 12px' },
  statRow: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 11 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 },
  statVal: { fontFamily: 'var(--font-mono, monospace)', fontSize: 14, fontWeight: 700, color: '#e2e8f0' },
  statLabel: { fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  empty: { padding: 64, textAlign: 'center', color: '#64748b', fontSize: 14 },
  loadMore: { padding: '11px 22px', fontSize: 13, fontWeight: 700, color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer' },
};