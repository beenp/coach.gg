import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Settings() {
    const navigate = useNavigate();
    const [availability, setAvailability] = useState({});
    const [message, setMessage] = useState('');
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const [games, setGames] = useState([]);
    const [selectedGameId, setSelectedGameId] = useState('');
    const [hourlyRate, setHourlyRate] = useState(0);


    useEffect(() => {
        const fetchGames = async () => {
            const res = await axios.get('http://localhost:5000/api/public/games');
            setGames(res.data);
        };
        fetchGames();
    }, []);
    useEffect(() => {
        const fetchStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/');

            try {
                const res = await axios.get('http://localhost:5000/api/users/me/coach-status', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.data.isCoach) return navigate('/dashboard');

                // Load existing availability or setup default blank slate
                const saved = res.data.availability || {};
                if (res.data.timezone) setTimezone(res.data.timezone);
                const initial = {};
                DAYS.forEach(day => {
                    initial[day] = saved[day] || { active: false, start: '09:00', end: '17:00' };
                });
                setAvailability(initial);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStatus();
    }, [navigate]);

    const handleToggle = (day) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], active: !prev[day].active }
        }));
    };

    const handleTimeChange = (day, field, value) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/users/me/availability',
                { availability, timezone, gameId: selectedGameId, hourlyRate },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Settings saved!');
        } catch (err) {
            setMessage('Error saving settings.');
        }
    };

    if (Object.keys(availability).length === 0) return <div>Loading...</div>;

 return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '20px', 
      color: 'var(--text-main)' 
    }}>
        <div style={{ 
  padding: '20px', 
  backgroundColor: 'var(--bg-surface)', 
  borderRadius: '8px', 
  border: '1px solid var(--border-color)',
  marginBottom: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
}}>
  <h3>Profile Basics</h3>
  
  <div>
    <label style={{ display: 'block', marginBottom: '5px' }}>Primary Game</label>
    <select 
      value={selectedGameId} 
      onChange={(e) => setSelectedGameId(e.target.value)}
      style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
    >
      <option value="">-- Select Your Game --</option>
      {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
    </select>
  </div>

  <div>
    <label style={{ display: 'block', marginBottom: '5px' }}>Hourly Rate ($)</label>
    <input 
      type="number" 
      value={hourlyRate} 
      onChange={(e) => setHourlyRate(e.target.value)}
      style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
    />
  </div>
</div>
      <h2>Coach Settings: Availability</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Set your default weekly working hours.
      </p>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)',
          borderRadius: '8px' 
        }}>
          <strong>Your Detected Timezone:</strong> {timezone}
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: 'var(--text-muted)' }}>
            Your working hours below will be saved in this timezone. Students will automatically see these times converted to their own local timezone.
          </p>
        </div>

        {/* Days of the Week Loop */}
        {DAYS.map(day => (
          <div 
            key={day} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '15px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              backgroundColor: availability[day].active ? 'var(--bg-main)' : 'var(--bg-surface)' 
            }}
          >
            <div style={{ width: '120px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer', 
                textTransform: 'capitalize', 
                fontWeight: availability[day].active ? 'bold' : 'normal' 
              }}>
                <input 
                  type="checkbox" 
                  checked={availability[day].active} 
                  onChange={() => handleToggle(day)} 
                />
                {day}
              </label>
            </div>

            {availability[day].active ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="time" 
                  value={availability[day].start} 
                  onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                  style={{ 
                    padding: '5px', 
                    backgroundColor: 'var(--bg-surface)', 
                    color: 'var(--text-main)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                />
                <span>to</span>
                <input 
                  type="time" 
                  value={availability[day].end} 
                  onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                  style={{ 
                    padding: '5px', 
                    backgroundColor: 'var(--bg-surface)', 
                    color: 'var(--text-main)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                />
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave} 
        style={{ 
          marginTop: '20px', 
          padding: '12px 24px', 
          backgroundColor: 'var(--accent-primary)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer', 
          fontSize: '1.1em', 
          width: '100%',
          fontWeight: 'bold'
        }}
      >
        Save Schedule
      </button>
    </div>
  );}
