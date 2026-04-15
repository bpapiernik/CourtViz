import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

const POSITION_COLORS = {
  'Guard':          '#3b82f6',
  'Guard-Forward':  '#3b82f6',
  'Forward':        '#059669',
  'Forward-Guard':  '#059669',
  'Center':         '#d97706',
  'Center-Forward': '#d97706',
  'Forward-Center': '#d97706',
};

function PlayerCard({ player, index }) {
  const posColor = POSITION_COLORS[player.position] || '#94a3b8';

  return (
    <Link
      href={`/player/${player.player_id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        className="player-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 16px',
          borderRadius: 10,
          border: '1.5px solid color-mix(in srgb, var(--navbar) 45%, transparent)',
          background: 'color-mix(in srgb, var(--navbar) 8%, transparent)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          animation: 'cardIn 0.2s ease both',
          animationDelay: `${Math.min(index * 40, 300)}ms`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Headshot */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `2px solid ${posColor}`,
          background: 'color-mix(in srgb, var(--navbar) 30%, transparent)',
          flexShrink: 0,
        }}>
          {player.headshot ? (
            <img
              src={player.headshot}
              alt={player.player_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, opacity: 0.3,
            }}>
              👤
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {player.player_name}
            </span>
            {player.position && (
              <span style={{
                background: `${posColor}18`,
                color: posColor,
                border: `1px solid ${posColor}44`,
                borderRadius: 5,
                padding: '2px 7px',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
                flexShrink: 0,
              }}>
                {player.position}
              </span>
            )}
          </div>

          <div style={{
            display: 'flex', gap: 12, marginTop: 4,
            fontSize: 12, opacity: 0.5, flexWrap: 'wrap',
            fontFamily: 'var(--font-mono)',
          }}>
            {player.school && <span>{player.school}</span>}
          </div>
        </div>

        {/* Arrow — makes it crystal clear it's clickable */}
        <div className="card-arrow" style={{
          fontSize: 16,
          opacity: 0,
          transform: 'translateX(-4px)',
          transition: 'all 0.15s',
          flexShrink: 0,
          color: posColor,
        }}>
          →
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef                = useRef(null);
  const debounceRef             = useRef(null);

  // Focus input on `/` keypress anywhere
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Debounced search as you type
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const terms = query.toLowerCase().split(' ').filter(Boolean);

    // Search by name
    const { data: nameMatches, error: nameError } = await supabase
      .from('players')
      .select('player_id, player_name, position, school')
      .ilike('player_name', `%${query}%`);

    if (nameError) { console.error('Name search error:', nameError); setLoading(false); return; }

    const refinedNameMatches = nameMatches.filter(player =>
      terms.every(term => player.player_name.toLowerCase().includes(term))
    );

    // Search by player_id if numeric
    let idMatches = [];
    if (!isNaN(query)) {
      const { data: idData, error: idError } = await supabase
        .from('players')
        .select('player_id, player_name, position, school')
        .eq('player_id', query);
      if (!idError) idMatches = idData || [];
    }

    // Combine, dedup
    const combined = [
      ...idMatches,
      ...refinedNameMatches.filter(p => !idMatches.some(id => id.player_id === p.player_id)),
    ];

    // Fetch headshots for the result set
    if (combined.length > 0) {
      const ids = combined.map(p => p.player_id);
      const { data: headshotData } = await supabase
        .from('player_headshots')
        .select('player_id, headshot')
        .in('player_id', ids);

      const headshotMap = new Map((headshotData || []).map(h => [h.player_id, h.headshot]));
      setResults(combined.map(p => ({ ...p, headshot: headshotMap.get(p.player_id) || null })));
    } else {
      setResults([]);
    }

    setLoading(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .player-card:hover {
          border-color: color-mix(in srgb, var(--navbar) 80%, transparent) !important;
          background: color-mix(in srgb, var(--navbar) 18%, transparent) !important;
          transform: translateX(3px);
        }
        .player-card:hover .card-arrow {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--navbar) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--navbar) 25%, transparent);
        }
        .clear-btn:hover { opacity: 1 !important; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Search Players</h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.4 }}>
            Search by name or player ID · Click any result to view their stats page.
          </p>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          {/* Search icon */}
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, opacity: 0.35, pointerEvents: 'none',
          }}>
            🔍
          </span>

          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search by name or player ID…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: '1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
              borderRadius: 9,
              padding: '11px 40px 11px 36px',
              fontSize: 14,
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
              width: '100%',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />

          {/* Hint or clear */}
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {query ? (
              <button
                className="clear-btn"
                onClick={clearSearch}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--foreground)', cursor: 'pointer',
                  fontSize: 16, opacity: 0.4, lineHeight: 1, padding: 0,
                  transition: 'opacity 0.15s',
                }}
              >×</button>
            ) : (
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)',
                opacity: 0.25, letterSpacing: 1,
                border: '1px solid currentColor',
                borderRadius: 4, padding: '1px 5px',
              }}>/</span>
            )}
          </div>
        </div>

        {/* Status line */}
        {searched && !loading && (
          <div style={{
            fontSize: 12, fontFamily: 'var(--font-mono)',
            opacity: 0.4, marginBottom: 14,
          }}>
            {results.length === 0
              ? 'No players found'
              : `${results.length} player${results.length !== 1 ? 's' : ''} found`}
          </div>
        )}

        {loading && (
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.35, marginBottom: 14 }}>
            Searching…
          </div>
        )}

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((player, i) => (
            <PlayerCard key={player.player_id} player={player} index={i} />
          ))}
        </div>

        {/* Empty state */}
        {searched && !loading && results.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            border: '1.5px dashed color-mix(in srgb, var(--foreground) 15%, transparent)',
            borderRadius: 10, opacity: 0.5, fontSize: 13,
          }}>
            No players matched &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Initial prompt */}
        {!searched && !loading && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            opacity: 0.25, fontSize: 13, fontFamily: 'var(--font-mono)',
          }}>
            Start typing to search
          </div>
        )}
      </div>
    </>
  );
}
