import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');
  const [coachStatus, setCoachStatus] = useState(null);

  // Fetch the user's role and username whenever the token changes
  useEffect(() => {
    if (token) {
      const fetchUser = async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/users/me/coach-status', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data); // This gives us { username, role, isCoach, etc }
        } catch (err) {
          console.error("Session expired or invalid token");
          localStorage.removeItem('token');
          setUser(null);
        }
      };
      fetchUser();
    } else {
      setUser(null);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 20px', 
      backgroundColor: 'var(--bg-surface)', 
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '20px'
    }}>
      {/* Left Side: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5em' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)' }}>coach.gg</Link>
        </h1>
        <Link to="/browse" style={{ textDecoration: 'none', color: 'var(--text-main)', opacity: 0.8 }}>Browse</Link>
      </div>

      {/* Right Side: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <ThemeToggle />
        

        {token ? (
          <>
            {/* BECOME A COACH BUTTON */}
            {!user?.isCoach && user?.role !== 'admin' && (
              <Link 
                to="/apply" 
                style={{ 
                  textDecoration: 'none', 
                  color: 'var(--accent-primary)', 
                  fontWeight: 'bold',
                  border: '1px solid var(--accent-primary)',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
              >
                Become a Coach
              </Link>
            )}

            {/* ADMIN DASHBOARD */}
            {user?.role === 'admin' && (
              <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                🛡️ Admin
              </Link>
            )}

            {/* 3. STANDARD LINKS */}
            <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-main)' }}>Dashboard</Link>
            
            <button onClick={handleLogout} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/" style={{ padding: '8px 12px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}