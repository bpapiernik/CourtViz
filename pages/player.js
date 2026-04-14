import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

// Position groups matching your classification variables
const POSITION_GROUPS = {
  All:      null,
  Guard:    ['Guard', 'Guard-Forward'],
  Wing:     ['Forward', 'Forward-Guard'],
  Forward:  ['Center', 'Center-Forward', 'Forward-Center'],
};

const POSITIONS = Object.keys(POSITION_GROUPS);

const POSITION_COLORS = {
  Guard:    '#3b82f6',
  Wing:     '#059669',
  Forward:  '#d97706',
};

// Per-value badge colors
const VALUE_COLORS = {
  'Guard':           '#3b82f6',
  'Guard-Forward':   '#3b82f6',
  'Forward':         '#059669',
  'Forward-Guard':   '#059669',
  'Center':          '#d97706',
  'Center-Forward':  '#d97706',
  'Forward-Center':  '#d97706',
};

function StatChip({ label, value }) {
  return (
    <span style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'color-mix(in srgb, var(--navbar) 40%, transparent)',
      borderRadius: 6,
      padding: '3px 8px',
      opacity: value ? 1 : 0.4,
    }}>
      <span style={{
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 1,
        textTransform: 'uppercase',
        opacity: 0.55,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
      }}>
        {value ?? '—'}
      </span>
    </span>
  );
}

function PlayerRow({ player, index }) {
  const posColor = VALUE_COLORS[player.position] || '#64748b';

  return (
    <tr
      className="player-row"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)',
        animation: `fadeIn 0.25s ease both`,
        animationDelay: `${Math.min(index * 25, 400)}ms`,
      }}
    >
      {/* Headshot */}
      <td style={{ padding: '10px 16px', width: 52 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `2px solid ${posColor}`,
          background: 'var(--navbar)',
          flexShrink: 0,
        }}>
          <img
            src={player.headshot || '/default-headshot.png'}
            alt={player.player_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      </td>

      {/* Name + school */}
      <td style={{ padding: '10px 12px' }}>
        <Link
          href={`/player/${player.player_id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {player.player_name}
          </div>
          {player.school && (
            <div style={{ fontSize: 11, opacity: 0.45, marginTop: 1 }}>
              {player.school}
            </div>
          )}
        </Link>
      </td>

      {/* Position badge */}
      <td style={{ padding: '10px 12px' }}>
        <span style={{
          background: `${posColor}18`,
          color: posColor,
          border: `1px solid ${posColor}44`,
          borderRadius: 5,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
        }}>
          {player.position || '—'}
        </span>
      </td>

      {/* Height / Weight */}
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <StatChip label="HT" value={player.height} />
          <StatChip label="WT" value={player.weight} />
        </div>
      </td>

      {/* Draft */}
      <td style={{ padding: '10px 12px' }}>
        {player.draft_year ? (
          <div style={{ display: 'flex', gap: 5 }}>
            <StatChip label="YR" value={player.draft_year} />
            <StatChip label="RD" value={player.draft_round} />
            <StatChip label="PK" value={player.draft_number} />
          </div>
        ) : (
          <span style={{ fontSize: 12, opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
            Undrafted
          </span>
        )}
      </td>

      {/* DOB */}
      <td style={{
        padding: '10px 12px',
        fontSize: 12,
        opacity: 0.45,
        fontFamily: 'var(--font-mono)',
      }}>
        {player.birthdate || '—'}
      </td>
    </tr>
  );
}

export default function Players() {
  const [players, setPlayers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [sortKey, setSortKey]     = useState('player_name');
  const [sortAsc, setSortAsc]     = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('player_id, player_name, position, height, weight, school, birthdate, draft_year, draft_round, draft_number');

      const { data: headshotsData, error: headshotsError } = await supabase
        .from('player_headshots')
        .select('player_id, headshot');

      if (playersError || headshotsError) {
        console.error('Error:', playersError || headshotsError);
        setLoading(false);
        return;
      }

      const headshotMap = new Map(headshotsData.map(h => [h.player_id, h.headshot]));
      setPlayers(playersData.map(p => ({ ...p, headshot: headshotMap.get(p.player_id) || null })));
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  const filtered = useMemo(() => {
    let list = [...players];
    if (posFilter !== 'All') {
      const group = POSITION_GROUPS[posFilter];
      list = list.filter(p => group?.includes(p.position));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.player_name?.toLowerCase().includes(q) ||
        p.school?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [players, search, posFilter, sortKey, sortAsc]);

  function handleSort(key) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const SortIcon = ({ col }) => (
    <span style={{ marginLeft: 3, fontSize: 9, opacity: sortKey === col ? 0.85 : 0.2 }}>
      {sortKey === col ? (sortAsc ? '▲' : '▼') : '▲'}
    </span>
  );

  const thStyle = (col) => ({
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.5,
    cursor: col ? 'pointer' : 'default',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid color-mix(in srgb, var(--navbar) 70%, transparent)',
  });

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .player-row:hover {
          background: color-mix(in srgb, var(--navbar) 18%, transparent);
        }
        .search-input:focus {
          outline: none;
          border-color: var(--navbar) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--navbar) 25%, transparent);
        }
        .pos-pill { transition: all 0.15s; }
        .pos-pill:hover { opacity: 0.8; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Players</h1>
            <span style={{
              background: 'var(--navbar)',
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}>
              {filtered.length}{players.length !== filtered.length ? ` / ${players.length}` : ''}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.45 }}>
            Search, filter by position, or click a column to sort.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search name or school…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: '1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
              borderRadius: 7,
              padding: '7px 12px',
              fontSize: 13,
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
              width: 210,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {POSITIONS.map(pos => {
              const active = posFilter === pos;
              const color = POSITION_COLORS[pos];
              return (
                <button
                  key={pos}
                  className="pos-pill"
                  onClick={() => setPosFilter(pos)}
                  style={{
                    padding: '5px 13px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: 0.5,
                    cursor: 'pointer',
                    border: active && color
                      ? `1.5px solid ${color}`
                      : '1.5px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
                    background: active
                      ? (color ? `${color}18` : 'var(--navbar)')
                      : 'transparent',
                    color: active && color ? color : 'var(--foreground)',
                  }}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{
          borderRadius: 10,
          border: '1.5px solid color-mix(in srgb, var(--navbar) 60%, transparent)',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', opacity: 0.4, fontSize: 14 }}>
              Loading players…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', opacity: 0.4, fontSize: 14 }}>
              No players match your search.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr style={{ background: 'color-mix(in srgb, var(--navbar) 30%, transparent)' }}>
                    <th style={thStyle(null)}></th>
                    <th style={thStyle('player_name')} onClick={() => handleSort('player_name')}>
                      Name <SortIcon col="player_name" />
                    </th>
                    <th style={thStyle('position')} onClick={() => handleSort('position')}>
                      Pos <SortIcon col="position" />
                    </th>
                    <th style={thStyle(null)}>Size</th>
                    <th style={thStyle('draft_year')} onClick={() => handleSort('draft_year')}>
                      Draft <SortIcon col="draft_year" />
                    </th>
                    <th style={thStyle('birthdate')} onClick={() => handleSort('birthdate')}>
                      DOB <SortIcon col="birthdate" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((player, i) => (
                    <PlayerRow key={player.player_id} player={player} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
