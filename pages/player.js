import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function Players() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    async function fetchPlayers() {
      // Fetch players table
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('player_id, player_name, position');

      // Fetch headshots table
      const { data: headshotsData, error: headshotsError } = await supabase
        .from('player_headshots')
        .select('player_id, headshot');

      // Handle errors
      if (playersError || headshotsError) {
        console.error('Error fetching players or headshots:', playersError || headshotsError);
        return;
      }

      // Merge players with headshots
      const headshotMap = new Map();
      headshotsData.forEach(h => headshotMap.set(h.player_id, h.headshot));

      const merged = playersData.map(player => ({
        ...player,
        headshot: headshotMap.get(player.player_id) || null,
      }));

      setPlayers(merged);
    }

    fetchPlayers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Players</h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2 w-[60px]">Headshot</th>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Position</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.player_id}>
              <td className="border p-2 w-[60px]">
                <img
                  src={player.headshot || '/default-headshot.png'}
                  alt={player.player_name}
                  className="w-10 h-10 object-cover rounded-full mx-auto"
                />
              </td>
              <td className="border p-2">
                <Link href={`/player/${player.player_id}`} className="text-blue-600 underline">
                  {player.player_id}
                </Link>
              </td>
              <td className="border p-2">{player.player_name}</td>
              <td className="border p-2">{player.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
