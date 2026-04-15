import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const POSITION_COLORS = {
  'Guard':          '#3b82f6',
  'Guard-Forward':  '#3b82f6',
  'Forward':        '#059669',
  'Forward-Guard':  '#059669',
  'Center':         '#d97706',
  'Center-Forward': '#d97706',
  'Forward-Center': '#d97706',
};

const TOOLS = [
  { href: '/player',         emoji: '👤', label: 'Players',          desc: 'Browse the full NBA roster with stats, position filters, and search.' },
  { href: '/finder',         emoji: '🔍', label: 'Player Finder',    desc: 'Filter players by percentile thresholds across tracking and synergy stats.' },
  { href: '/simulator',      emoji: '🏀', label: 'CBB Simulator',    desc: 'Simulate college basketball matchups across any season using 100k simulations.' },
  { href: '/dailymatchupviz',emoji: '📅', label: 'Daily MatchupViz', desc: 'Track today\'s games, model picks, official plays, and historic results.' },
  { href: '/heliocentric-leaderboard', emoji: '☀️', label: 'Heliocentric', desc: 'Evaluate offensive decision-making using the Heliocentric Shot Selection metric.' },
];

const TECH = ['Next.js', 'Supabase', 'Python', 'Fly.io', 'Plotly', 'R'];

const PROJECTS = [
  { label: 'March Madness Simulation Model', desc: 'Predicted tournament outcomes using ShotQuality, Torvik, and Elo-based features.', href: null },
  { label: 'MLB Pitch Clustering Project', desc: 'Used k-means to group pitch shapes and identify optimal pitch sequencing strategies.', href: null },
  { label: 'NBA Injury Prevention Model', desc: 'Leveraged tracking data and play context to detect movement patterns that increase injury risk.', href: null },
  { label: 'College Basketball Game Outcome Probabilities', desc: 'Modeled game win probabilities using Torvik and ShotQuality metrics, accounting for transfer portal impact.', href: null },
  { label: 'Heliocentric Snapshot Model', desc: 'Evaluated offensive decision-making by comparing shot outcomes with catch-and-shoot opportunities using tracking data.', href: '/heliocentric-leaderboard' },
];

// Seed random by date so featured player is stable for the day
function getDailyRandom(max) {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // Simple LCG
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

export default function Home() {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    async function fetchFeatured() {
      // Get count first, then pick a daily-seeded random offset
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      if (!count) return;

      const offset = getDailyRandom(count);

      const { data: playerRows } = await supabase
        .from('players')
        .select('player_id, player_name, position, school')
        .range(offset, offset);

      if (!playerRows?.[0]) return;
      const player = playerRows[0];

      const { data: headshotRow } = await supabase
        .from('player_headshots')
        .select('headshot')
        .eq('player_id', player.player_id)
        .single();

      setFeatured({ ...player, headshot: headshotRow?.headshot || null });
    }
    fetchFeatured();
  }, []);

  const posColor = featured ? (POSITION_COLORS[featured.position] || '#94a3b8') : '#94a3b8';

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .tool-card:hover {
          border-color: color-mix(in srgb, var(--navbar) 80%, transparent) !important;
          background: color-mix(in srgb, var(--navbar) 18%, transparent) !important;
          transform: translateY(-2px);
        }
        .tool-card { transition: all 0.15s; }
        .resume-btn:hover { opacity: 0.85; }
        .featured-card:hover { border-color: color-mix(in srgb, var(--navbar) 70%, transparent) !important; }
        .featured-card { transition: border-color 0.15s; }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <img
            src="/CourtVizLogo.png"
            alt="CourtViz"
            style={{ height: 96, width: 'auto', marginBottom: 16 }}
          />
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px', letterSpacing: -0.5 }}>
            CourtViz
          </h1>
          <p style={{ fontSize: 16, opacity: 0.55, margin: 0, maxWidth: 480, marginInline: 'auto' }}>
            Full-stack NBA &amp; CBB analytics — from raw tracking data to interactive dashboards.
          </p>
        </div>

        {/* ── TOOL CARDS ────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 48 }} className="fade-up" >
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.4, marginBottom: 14 }}>
            Explore the Tools
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {TOOLS.map(tool => (
              <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="tool-card"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1.5px solid color-mix(in srgb, var(--navbar) 45%, transparent)',
                    background: 'color-mix(in srgb, var(--navbar) 8%, transparent)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{tool.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tool.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.5 }}>{tool.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FEATURED PLAYER ───────────────────────────────────────────── */}
        {featured && (
          <section style={{ marginBottom: 48 }} className="fade-up">
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.4, marginBottom: 14 }}>
              Player of the Day
            </div>
            <Link href={`/player/${featured.player_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="featured-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 10,
                  border: `1.5px solid ${posColor}44`,
                  background: `linear-gradient(135deg, ${posColor}0d 0%, color-mix(in srgb, var(--navbar) 10%, transparent) 100%)`,
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: posColor, borderRadius: '10px 0 0 10px' }} />
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${posColor}`, flexShrink: 0,
                  background: 'color-mix(in srgb, var(--navbar) 30%, transparent)',
                }}>
                  {featured.headshot ? (
                    <img src={featured.headshot} alt={featured.player_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, opacity: 0.3 }}>👤</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{featured.player_name}</span>
                    {featured.position && (
                      <span style={{
                        background: `${posColor}18`, color: posColor,
                        border: `1px solid ${posColor}44`,
                        borderRadius: 5, padding: '2px 7px',
                        fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 1,
                      }}>{featured.position}</span>
                    )}
                  </div>
                  {featured.school && (
                    <div style={{ fontSize: 12, opacity: 0.45, fontFamily: 'var(--font-mono)' }}>{featured.school}</div>
                  )}
                </div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', opacity: 0.5, flexShrink: 0 }}>
                  View Profile →
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ── ABOUT COURTVIZ ────────────────────────────────────────────── */}
        <section style={{ marginBottom: 48 }} className="fade-up">
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.4, marginBottom: 14 }}>
            About CourtViz
          </div>
          <div style={{
            padding: '20px 24px', borderRadius: 10,
            border: '1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)',
            background: 'color-mix(in srgb, var(--navbar) 8%, transparent)',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.8, opacity: 0.8 }}>
              CourtViz was created as a sports analytics project to deliver powerful insights across all levels of sports and competition.
              The first step was launching a full-stack website to showcase the entire analytics pipeline — from back-end data collection and storage to front-end interactive visuals.
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.8, opacity: 0.8 }}>
              Features include dynamic player dashboards and a Player Finder tool that helps identify undervalued players and uncover strengths and weaknesses based on data-driven metrics.
              The vision is to expand across multiple sports while refining tools that support performance analysis, roster construction, and scouting.
            </p>

            {/* Tech stack badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TECH.map(t => (
                <span key={t} style={{
                  background: 'color-mix(in srgb, var(--navbar) 25%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--navbar) 50%, transparent)',
                  borderRadius: 20, padding: '3px 12px',
                  fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  letterSpacing: 0.5,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT ME ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 48 }} className="fade-up">
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.4, marginBottom: 14 }}>
            About Me
          </div>
          <div style={{
            display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap',
            padding: '20px 24px', borderRadius: 10,
            border: '1.5px solid color-mix(in srgb, var(--navbar) 40%, transparent)',
            background: 'color-mix(in srgb, var(--navbar) 8%, transparent)',
          }}>
            <img
              src="/brian.png"
              alt="Brian Papiernik"
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid color-mix(in srgb, var(--navbar) 60%, transparent)', flexShrink: 0 }}
            />
            <div style={{ flex: '1 1 280px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.8, opacity: 0.8 }}>
                My name is <strong>Brian Papiernik</strong> — a sports data scientist with experience across baseball, basketball, and multi-sport performance analysis.
                I've worked as a Baseball Technology Operator for the <strong>Tampa Bay Rays</strong>, a Baseball Student Manager with <strong>Notre Dame Baseball</strong>,
                and hold a <strong>Master's degree in Sports Analytics from Notre Dame</strong>.
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.8, opacity: 0.8 }}>
                I specialize in building end-to-end analytics pipelines, predictive models, and interactive tools for evaluating players and strategies.
                CourtViz is where I bring together my passion for sports, data, and clean design.
              </p>
              {/* Resume button */}
              <a
                href="/Brian G Papiernik - 2025 Sports Resume.pdf"
                download
                className="resume-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--navbar)', color: 'var(--foreground)',
                  border: 'none', borderRadius: 7, padding: '8px 18px',
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  letterSpacing: 0.5, textDecoration: 'none', cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                ↓ Download Resume
              </a>
            </div>
          </div>
        </section>

        {/* ── FORMER PROJECTS ───────────────────────────────────────────── */}
        <section className="fade-up">
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.4, marginBottom: 14 }}>
            Former Portfolio Projects
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PROJECTS.map(p => (
              <div
                key={p.label}
                style={{
                  padding: '14px 16px', borderRadius: 9,
                  border: '1.5px solid color-mix(in srgb, var(--navbar) 35%, transparent)',
                  background: 'color-mix(in srgb, var(--navbar) 6%, transparent)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{p.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.6 }}>{p.desc}</div>
                </div>
                {p.href && (
                  <Link
                    href={p.href}
                    style={{
                      flexShrink: 0, fontSize: 11, fontFamily: 'var(--font-mono)',
                      fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none',
                      opacity: 0.5, whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}