import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [reviewData, setReviewData] = useState({ sessionId: null, rating: 5, comment: '' });
    const [user, setUser] = useState(null);
    const [coachStatus, setCoachStatus] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState('');
    const [hourlyRate, setHourlyRate] = useState(25);
    const navigate = useNavigate();

    useEffect(() => {
        // This function runs automatically when the Dashboard loads
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/');

            try {
                // Fetch User Data
                const userRes = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);

                // Fetch Coach / Calendar Status
                const statusRes = await axios.get('http://localhost:5000/api/users/me/coach-status', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCoachStatus(statusRes.data); // Save it to state
                
                const sessionRes = await axios.get('http://localhost:5000/api/sessions/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSessions(sessionRes.data);

            } catch (err) {
                console.error(err);
                setError('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/');
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (!user && !error) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading VIP data...</div>;

    const handleConnectCalendar = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/calendar/connect', {
                headers: { Authorization: `Bearer ${token}` }
            });

            window.location.href = response.data.url;
        } catch (err) {
            console.error('Error getting calendar URL:', err);
        }
    };

    
    const handleReviewSubmit = async (e, coachId) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/reviews', {
                sessionId: reviewData.sessionId,
                coachId: coachId,
                rating: reviewData.rating,
                comment: reviewData.comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Review submitted successfully!');
            setReviewData({ sessionId: null, rating: 5, comment: '' }); // Reset form
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit review');
        }
    };
    const handleBecomeCoach = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users/become-coach', 
        { hourlyRate }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload(); // Refresh the page to load new coach UI
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upgrade account');
    }
  };
    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Welcome to your Dashboard, {user?.username}!</h2>
            <hr style={{ margin: '20px 0' }} />

            <div style={{ marginBottom: '20px' }}>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account Role:</strong> {user?.role}</p>
                <p><strong>Member Since:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
            </div>

            <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                <h3>Integrations</h3>
                {coachStatus?.isCalendarConnected ? (
                    <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Google Calendar Connected</p>
                ) : (
                    <button onClick={handleConnectCalendar} style={{ padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Connect Google Calendar
                    </button>
                )}
            </div>
        
            
            
            <h3>Upcoming Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                {sessions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No sessions found.</p>
                ) : (
                    sessions.map((session) => (
                        <div key={session.id} style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                            <p style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>
                                <strong>{new Date(session.start_time).toLocaleString()}</strong>
                            </p>
                            <p style={{ margin: '5px 0', color: 'var(--text-main)' }}>Game: {session.game_name || 'General Coaching'}</p>

                            {/* Show the other person's name depending on who is logged in */}
                            <p style={{ margin: '5px 0', color: 'var(--text-main)' }}>
                                {user?.username === session.coach_name
                                    ? `Student: ${session.client_name}`
                                    : `Coach: ${session.coach_name}`}
                            </p>

                            {/* YOUR SNIPPET GOES RIGHT HERE */}
                            {new Date(session.end_time) < new Date() ? (
                              // Past Session: Show Review Form (Only if logged-in user is the client)
                              user?.username !== session.coach_name && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                  {reviewData.sessionId === session.id ? (
                                    <form onSubmit={(e) => handleReviewSubmit(e, session.coach_id)}>
                                      <select 
                                        value={reviewData.rating} 
                                        onChange={(e) => setReviewData({...reviewData, rating: Number(e.target.value)})}
                                        style={{ marginRight: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }}
                                      >
                                        {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                                      </select>
                                      <input 
                                        type="text" 
                                        placeholder="Leave a comment..." 
                                        value={reviewData.comment}
                                        onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                                        required
                                        style={{ marginRight: '10px', padding: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                      />
                                      <button type="submit" style={{ padding: '5px 10px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit</button>
                                      <button type="button" onClick={() => setReviewData({ sessionId: null })} style={{ marginLeft: '10px', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'var(--text-muted)' }}>Cancel</button>
                                    </form>
                                  ) : (
                                    <button onClick={() => setReviewData({ sessionId: session.id, rating: 5, comment: '' })} style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                      Leave a Review
                                    </button>
                                  )}
                                </div>
                              )
                            ) : (
                              // Upcoming Session: Show Meet Link
                              session.meet_link ? (
                                <a href={session.meet_link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', padding: '8px 12px', backgroundColor: '#0f9d58', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                                  Join Google Meet
                                </a>
                              ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>Link generating...</p>
                              )
                            )}
                            
                        </div>
                    ))
                )}
            </div>

            {coachStatus?.isCoach && (
                <button
                    onClick={() => navigate('/settings')}
                    style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', marginRight: '10px' }}
                >
                    Manage Availability
                </button>
            )}

            <button
                onClick={handleLogout}
                style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Logout
            </button>
        </div>
    );
}