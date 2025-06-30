import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query) return;

    const terms = query.toLowerCase().split(' ').filter(Boolean);

    // First: search names with ilike
    const { data: nameMatches, error: nameError } = await supabase
      .from('players')
      .select('player_id, player_name, position')
      .ilike('player_name', `%${query}%`);

    if (nameError) {
      console.error('Name search error:', nameError);
      return;
    }

    // Refine: ensure each word in query is found somewhere in player_name
    const refinedNameMatches = nameMatches.filter(player =>
      terms.every(term =>
        player.player_name.toLowerCase().includes(term)
      )
    );

    // Second: search by exact player_id (if numeric)
    let idMatches = [];
    if (!isNaN(query)) {
      const { data: idData, error: idError } = await supabase
        .from('players')
        .select('player_id, player_name, position')
        .eq('player_id', query);

      if (idError) {
        console.error('ID search error:', idError);
      } else {
        idMatches = idData;
      }
    }

    // Combine, removing duplicates
    const combined = [
      ...idMatches,
      ...refinedNameMatches.filter(p => !idMatches.some(id => id.player_id === p.player_id))
    ];

    setResults(combined);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Players</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="bg-white text-black border border-gray-300 px-3 py-2 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Search by name or player ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Search
        </button>
      </div>

      <ul className="mt-6 space-y-2">
        {results.map((player) => (
          <li key={player.player_id}>
            <Link href={`/player/${player.player_id}`} className="text-blue-700 underline">
              {player.player_name} ({player.position})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

