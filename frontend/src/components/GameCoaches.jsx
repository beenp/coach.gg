import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function GameCoaches() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [gameName, setGameName] = useState('');

  useEffect(() => {
    const fetchFilteredCoaches = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/public/games/${id}/coaches`);
        setCoaches(res.data);
        if (res.data.length > 0) setGameName(res.data[0].game_name);
      } catch (err) {
        console.error('Failed to load coaches:', err);
      }
    };
    fetchFilteredCoaches();
  }, [id]);

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', color: 'var(--text-main)' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link to="/browse" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9em' }}>
          ← Back to Catalog
        </Link>
        <h1 style={{ marginTop: '10px' }}>{gameName || 'Coaches'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{coaches.length} expert coaches available</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {coaches.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No coaches found for this game yet.</p>
        ) : (
          coaches.map(coach => (
            <div 
              key={coach.coach_id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '20px', 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px' 
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{coach.username}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  ⭐ <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{coach.rating}</span> ({coach.review_count} Reviews)
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1.2em' }}>${coach.hourly_rate}/hr</p>
                <button 
                  onClick={() => navigate(`/coach/${coach.coach_id}`)}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: 'var(--accent-primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}   