import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CoachProfile() {
    const { id } = useParams(); // Grabs the coach ID from the URL
    const navigate = useNavigate();

    const [coach, setCoach] = useState(null);
    const [games, setGames] = useState([]);
    const [reviews, setReviews] = useState([]);

    // Form State
    const [selectedGame, setSelectedGame] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [error, setError] = useState('');

    const [availableSlots, setAvailableSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [coachRes, gamesRes, reviewsRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/public/coaches/${id}`),
                    axios.get('http://localhost:5000/api/public/games'),
                    axios.get(`http://localhost:5000/api/reviews/coach/${id}`)
                ]);

                setCoach(coachRes.data);
                setGames(gamesRes.data);
                setReviews(reviewsRes.data.reviews);
            } catch (err) {
                console.error(err);
                setError('Failed to load profile.');
            }
        };
        fetchProfileData();
    }, [id]);
    useEffect(() => {
        if (!selectedDate) return;

        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            setAvailableSlots([]);
            setSelectedTime(''); // Reset time when date changes

            try {
                const res = await axios.get(`http://localhost:5000/api/public/coaches/${id}/availability?date=${selectedDate}`);
                setAvailableSlots(res.data);
            } catch (err) {
                console.error('Failed to fetch availability', err);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDate, id]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!selectedGame || !selectedDate || !selectedTime) {
            return setError('Please select a game, date, and time.');
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/');

            // Add 1 hour to the selected UTC slot
            const startDateTime = new Date(selectedTime);
            const endDateTime = new Date(startDateTime.getTime() + 3600000);

            const response = await axios.post('http://localhost:5000/api/stripe/create-checkout-session', {
                coachId: id,
                gameId: selectedGame,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            window.location.href = response.data.url;
        } catch (err) {
            setError('Checkout failed. Make sure you are logged in.');
        }
    };

    if (!coach) return <div>Loading...</div>;

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '40px auto', 
      padding: '20px', 
      color: 'var(--text-main)' 
    }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        borderBottom: `2px solid var(--border-color)`, 
        paddingBottom: '20px', 
        marginBottom: '20px' 
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0' }}>{coach.username}</h1>
          <p style={{ margin: 0, fontSize: '1.2em' }}>
            ⭐ {coach.rating} ({coach.review_count} Reviews)
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>${coach.hourly_rate} / hr</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Left Side: Booking Form */}
        <div style={{ 
          flex: 1, 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginTop: 0 }}>Book a Session</h3>
          {error && <p style={{ color: '#dc3545', fontWeight: 'bold' }}>{error}</p>}
          
          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Select Game</label>
              <select 
                value={selectedGame} 
                onChange={(e) => setSelectedGame(e.target.value)} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--bg-main)', 
                  color: 'var(--text-main)', 
                  border: '1px solid var(--border-color)' 
                }}
              >
                <option value="">-- Choose a Game --</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Select Date</label>
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--bg-main)', 
                  color: 'var(--text-main)', 
                  border: '1px solid var(--border-color)' 
                }} 
              />
            </div>

            {selectedDate && (
              <div>
                <label style={{ display: 'block', marginBottom: '10px' }}>Select Time (Your Local Time)</label>
                {isLoadingSlots ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading available slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No availability on this date.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {availableSlots.map((slotIso) => {
                      const localTime = new Date(slotIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isSelected = selectedTime === slotIso;

                      return (
                        <button
                          key={slotIso}
                          type="button"
                          onClick={() => setSelectedTime(slotIso)}
                          style={{
                            padding: '10px',
                            border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-main)',
                            color: isSelected ? 'white' : 'var(--text-main)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {localTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              style={{ 
                padding: '14px', 
                backgroundColor: 'var(--accent-primary)', 
                color: 'var(--text-main)', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',  
                fontSize: '1.1em', 
                marginTop: '10px',
                fontWeight: 'bold'
              }}
            >
              Proceed to Payment
            </button>
          </form>
        </div>

        {/* Right Side: Reviews */}
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Recent Reviews</h3>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {reviews.map((r, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    backgroundColor: 'var(--bg-surface)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{r.username}</strong>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>⭐ {r.rating}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.4' }}>"{r.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )};