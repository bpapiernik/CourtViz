// pages/cbb_players.js  →  route: /cbb_players
//
// CBB player directory — visual card grid. Each card derives an archetype
// tag and a 6-spoke percentile radar from cbb_player_stats, and pulls the
// headshot + team logo from cbb_team_rosters. Cards link to the detail page.
//
// Detail page lives at: pages/cbbplayer/[id].js  → /cbbplayer/123
// Join: cbb_player_stats.player_id === cbb_team_rosters.athlete_id
//
// NOTE ON SCALES: pctile_* and off_usage in this data are stored 0–1, not
// 0–100. We detect the scale at load (PCT_SCALE / USG_SCALE) so the radar,
// the efficiency qualifier, and USG% all read correctly — and it self-heals
// if you ever rescale those columns to 0–100.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const PLAYER_ROUTE = (id) => `/cbbplayer/${id}`;
const BATCH = 48;

const STYLES = [
  { key: 'rim_attack',       label: 'Rim Attacker',     color: '#0d9488' },
  { key: 'attack_kick',      label: 'Driver & Kicker',  color: '#0d9488' },
  { key: 'transition',       label: 'Transition Threat',color: '#0d9488' },
  { key: 'perimeter_sniper', label: 'Movement Sniper',  color: '#2563eb' },
  { key: 'dribble_jumper',   label: 'Shot Creator',     color: '#2563eb' },
  { key: 'mid_range',        label: 'Mid-Range Scorer', color: '#2563eb' },
  { key: 'pnr_passer',       label: 'P&R Playmaker',    color: '#9333ea' },
  { key: 'post_kick',        label: 'Post Hub',         color: '#9333ea' },
  { key: 'hits_cutter',      label: 'Cutter Feeder',    color: '#9333ea' },
  { key: 'perimeter_cut',    label: 'Perimeter Cutter', color: '#d97706' },
  { key: 'big_cut_roll',     label: 'Roll Man',         color: '#d97706' },
  { key: 'post_up',          label: 'Post Scorer',      color: '#dc2626' },
  { key: 'pick_pop',         label: 'Pick & Pop',       color: '#dc2626' },
  { key: 'high_low',         label: 'High-Low Big',     color: '#dc2626' },
  { key: 'reb_scramble',     label: 'Putback Finisher', color: '#dc2626' },
].map((s) => ({ ...s, pctCol: `off_style_${s.key}_pct`, effCol: `pctile_off_style_${s.key}_ppp` }));

const POS_GROUPS = [
  { key: 'Guard',   color: '#2563eb', test: (p) => /(^|\b)(g|pg|sg|guard|combo|lead)/i.test(p) },
  { key: 'Wing',    color: '#0d9488', test: (p) => /(wing|sf|swing|forward-guard|guard-forward)/i.test(p) },
  { key: 'Forward', color: '#d97706', test: (p) => /(pf|f\b|stretch|forward)/i.test(p) },
  { key: 'Big',     color: '#dc2626', test: (p) => /(c\b|center|big|post)/i.test(p) },
];
const groupFor = (pos) =>
  (!pos ? null : POS_GROUPS.find((g) => g.test(String(pos)))) || { key: 'Other', color: '#64748b' };

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

const BASE_COLS = [
  'player_id', 'player_name', 'team', 'conf', 'season', '"posClass"',
  'transfer_src', 'transfer_dest',
  'off_usage', 'off_efg', 'off_poss', 'def_poss', 'adj_rapm_margin',
  'pctile_adj_rapm_margin', 'pctile_off_efg', 'pctile_off_threep',
  'pctile_off_assist', 'pctile_off_reb', 'pctile_def_reb',
  'pctile_def_stl', 'pctile_def_blk',
];
const STATS_SELECT = [...BASE_COLS, ...STYLES.flatMap((s) => [s.pctCol, s.effCol])].join(', ');

const pickKey = (sample, cands) => (sample ? cands.find((k) => k in sample) || null : null);

async function fetchAll(buildQuery) {
  let rows = [], from = 0; const PAGE = 1000;
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

// Detect whether a set of columns is stored 0–1 (return 100) or 0–100 (return 1).
function detectScale(rows, cols) {
  let max = 0;
  for (const r of rows) for (const c of cols) {
    const v = +r[c];
    if (!Number.isNaN(v)) max = Math.max(max, v);
  }
  return max <= 1.5 ? 100 : 1;
}

function archetypeOf(row, pctScale) {
  let best = null;
  for (const s of STYLES) {
    const pct = +row[s.pctCol];
    if (!Number.isNaN(pct) && (best === null || pct > best.pct)) {
      best = { ...s, pct, eff: +row[s.effCol] };
    }
  }
  if (!best || !(best.pct > 0)) return { label: 'Role Player', color: '#64748b', qualifier: '' };
  const e = best.eff * pctScale;
  const qualifier = Number.isNaN(e) ? '' : e >= 80 ? 'elite' : e >= 62 ? 'efficient' : e >= 40 ? 'solid' : 'low-eff';
  return { label: best.label, color: best.color, qualifier };
}

// Should we show the transfer badge? Only for a real, different source school.
function transferSource(p) {
  const src = (p.transfer_src ?? '').toString().trim();
  if (!src || ['0', 'none', 'null', 'na'].includes(src.toLowerCase())) return null;
  if (p.team && src.toLowerCase() === String(p.team).toLowerCase()) return null;
  return src;
}

function Radar({ row, color, scale, size = 132 }) {
  const c = size / 2, R = size / 2 - 18, n = RADAR.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  const vals = RADAR.map((m) => Math.max(0, Math.min(100, m.get(row) * scale)));
  const poly = vals.map((v, i) => pt(i, (v / 100) * R).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map((f, k) => (
        <polygon key={k} points={RADAR.map((_, i) => pt(i, R * f).join(',')).join(' ')}
          fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      ))}
      {RADAR.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill={`${color}33`} stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
      {RADAR.map((m, i) => {
        const [x, y] = pt(i, R + 9);
        return (
          <text key={m.key} x={x} y={y} fontSize="8" fontWeight="700" fill="#9ca3af"
            textAnchor="middle" dominantBaseline="middle" style={{ letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {m.key}
          </text>
        );
      })}
    </svg>
  );
}

function PlayerCard({ p, pctScale, usgScale }) {
  const g = groupFor(p.posClass);
  const arch = archetypeOf(p, pctScale);
  const rapm = +p.adj_rapm_margin;
  const src = transferSource(p);
  const usg = p.off_usage != null ? (+p.off_usage * usgScale).toFixed(1) : '—';
  return (
    <Link href={p.player_id ? PLAYER_ROUTE(p.player_id) : '#'} style={S.cardLink}>
      <div style={S.card}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${arch.color}66`; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.10)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}>
        {src && <span style={S.transferTag}>↪ {src}</span>}

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

        <div style={S.radarWrap}><Radar row={p} color={arch.color} scale={pctScale} /></div>

        <div style={S.statRow}>
          <div style={S.stat}>
            <span style={{ ...S.statVal, color: rapm >= 0 ? '#059669' : '#dc2626' }}>
              {(rapm >= 0 ? '+' : '') + (Number.isNaN(rapm) ? '—' : rapm.toFixed(2))}
            </span>
            <span style={S.statLabel}>RAPM±</span>
          </div>
          <div style={S.stat}>
            <span style={S.statVal}>{usg}</span>
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

export default function CbbPlayers() {
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState('');
  const [rows, setRows] = useState([]);
  const [scales, setScales] = useState({ pct: 1, usg: 1 });
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
        fetchAll((lo, hi) => supabase.from('cbb_player_stats').select(STATS_SELECT).eq('season', season).range(lo, hi)),
        fetchAll((lo, hi) => supabase.from('cbb_team_rosters').select('*').eq('season', season).range(lo, hi)),
      ]);
      if (!alive) return;

      const sample = rosters[0] || null;
      const headKey = pickKey(sample, ['athlete_headshot_href', 'athlete_headshot', 'headshot', 'athlete_headshot_url']);
      const logoKey = pickKey(sample, ['logo', 'team_logo']);
      const byId = new Map();
      for (const r of rosters) if (r.athlete_id != null) byId.set(String(r.athlete_id), r);

      const pct = detectScale(stats, ['pctile_adj_rapm_margin', 'pctile_off_efg', 'pctile_off_assist', 'pctile_off_style_post_up_ppp']);
      const usg = detectScale(stats, ['off_usage']);
      setScales({ pct, usg });

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
    () => ['All', ...[...new Set(rows.map((r) => r.conf).filter(Boolean))].sort()], [rows]);
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
      return (+b.adj_rapm_margin || -99) - (+a.adj_rapm_margin || -99);
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
          <input style={S.search} placeholder="Search player or team…" value={query} onChange={(e) => setQuery(e.target.value)} />
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
                <PlayerCard key={p.player_id || p.player_name} p={p} pctScale={scales.pct} usgScale={scales.usg} />
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
  page: { minHeight: '100vh', background: 'var(--background, #f4f1ea)', color: 'var(--foreground, #1a1a1a)', fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' },
  shell: { maxWidth: 1180, margin: '0 auto', padding: '40px 20px 80px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 26 },
  eyebrow: { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#d97706', marginBottom: 8 },
  title: { margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: -1, lineHeight: 1 },
  sub: { margin: '12px 0 0', fontSize: 13, lineHeight: 1.6, color: '#6b7280', maxWidth: 480 },
  countWrap: { textAlign: 'right', flexShrink: 0 },
  count: { fontFamily: 'var(--font-mono, monospace)', fontSize: 30, fontWeight: 700 },
  countLabel: { display: 'block', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5 },
  controls: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 },
  search: { flex: '1 1 220px', minWidth: 160, padding: '11px 14px', fontSize: 14, background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, color: 'inherit', outline: 'none' },
  select: { padding: '11px 14px', fontSize: 14, background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, color: 'inherit', outline: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(244px, 1fr))', gap: 16 },
  cardLink: { textDecoration: 'none', color: 'inherit' },
  card: { position: 'relative', background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 16, padding: 16, transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s', height: '100%', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
  transferTag: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, letterSpacing: 0.3, color: '#b45309', background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.30)', borderRadius: 5, padding: '2px 6px' },
  cardTop: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  avatar: { position: 'relative', width: 52, height: 52, borderRadius: '50%', flexShrink: 0, border: '2px solid', background: '#e5e7eb', display: 'grid', placeItems: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  avatarFallback: { fontSize: 18, fontWeight: 700, color: '#9ca3af' },
  logoBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 1, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' },
  name: { fontSize: 15, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  teamLine: { fontSize: 12, color: '#6b7280', margin: '3px 0 5px' },
  posBadge: { display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', padding: '1px 7px', border: '1px solid', borderRadius: 5 },
  archetype: { fontSize: 12.5, padding: '7px 11px', border: '1px solid', borderRadius: 9, marginBottom: 10, display: 'flex', gap: 5, alignItems: 'baseline', flexWrap: 'wrap' },
  qualifier: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 },
  radarWrap: { display: 'flex', justifyContent: 'center', margin: '4px 0 12px' },
  statRow: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 11 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 },
  statVal: { fontFamily: 'var(--font-mono, monospace)', fontSize: 14, fontWeight: 700, color: '#111827' },
  statLabel: { fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  empty: { padding: 64, textAlign: 'center', color: '#9ca3af', fontSize: 14 },
  loadMore: { padding: '11px 22px', fontSize: 13, fontWeight: 700, color: '#111827', background: '#fff', border: '1px solid rgba(0,0,0,0.14)', borderRadius: 10, cursor: 'pointer' },
};