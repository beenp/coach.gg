import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Browse() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/public/games`);
        setGames(res.data);
      } catch (err) {
        console.error('Failed to load games catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGames();
  }, []);

  if (isLoading) return <div style={{ color: 'var(--text-main)', padding: '20px' }}>Loading catalog...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', color: 'var(--text-main)' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Browse Games</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1em' }}>
          Select a title below to find expert coaches for that game.
        </p>
      </div>

      {/* The Game Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
        gap: '25px', 
        marginBottom: '60px' 
      }}>
        {games.map(game => (
          <div 
            key={game.id} 
            // Clicking the card will navigate to a filtered view (we will build this route next)
            onClick={() => navigate(`/browse/game/${game.id}`)}
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              overflow: 'hidden', // Crucial for rounding the image corners
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* The Standardized Frame (aspect-ratio keeps it consistent) */}
            <div style={{ 
              width: '100%', 
              aspectRatio: '3 / 4', // Establishes a rigid vertical frame (box art style)
              backgroundColor: 'var(--bg-surface-hover)', // Fallback color
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {game.image_url ? (
                <img 
                  src={game.image_url} 
                  alt={`${game.name} cover`} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', // Ensures image fills frame without stretching
                    display: 'block' 
                  }} 
                />
              ) : (
                <span style={{ fontSize: '3em' }}>🎮</span> // Fallback icon
              )}
            </div>

            {/* Game Info Block */}
            <div style={{ padding: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '1em', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {game.name}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '1.2em' }}>🧑‍🏫</span> 
                {game.coach_count === "0" ? 'No coaches yet' : `${game.coach_count} Coaches`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}