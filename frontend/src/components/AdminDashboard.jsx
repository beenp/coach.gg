import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
    const API_URL = import.meta.env.VITE_API_URL;
    const [stats, setStats] = useState(null);
    const [newGame, setNewGame] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [selectedCoaches, setSelectedCoaches] = useState([]);
    const [applications, setApplications] = useState([]);
    const [allCoaches, setAllCoaches  ] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const statsRes = await axios.get(`${API_URL}/api/admin/stats`, config);
                setStats(statsRes.data);

                const appsRes = await axios.get(`${API_URL}/api/admin/applications`, config);
                setApplications(appsRes.data);

            } catch (err) {
                console.error("Access Denied or Server Error", err);
            }
        };

        fetchAdminData();
    }, []);
        const fetchCoaches = async () => {
            try {
                const token = localStorage.getItem('token');
                // Ensure this endpoint exists on your backend!
                const res = await axios.get(`${API_URL}/api/admin/coaches`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAllCoaches(res.data);
            } catch (err) {
                console.error("Failed to fetch coaches:", err);
            }
        };

        fetchCoaches();

    const handleAddGame = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 2. Insert Game (Database)
    // .select().single () is crucial to get the ID for the next step
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert([{ 
        name: newGame, 
        description, 
      }])
      .select()
      .single();

    if (gameError) throw new Error(`Database: ${gameError.message}`);

    // 3. Map Coaches (Junction Table)
    // Batch insert all selected coaches linked to the new game ID
    if (selectedCoaches.length > 0) {
      const coachLinks = selectedCoaches.map(cId => ({
        game_id: gameData.id,
        coach_id: cId
      }));

      const { error: linkError } = await supabase
        .from('coaches')
        .insert(coachLinks);

      if (linkError) throw new Error(`Junction: ${linkError.message}`);
    }

    setMessage("Game successfully deployed to marketplace!");
  } catch (err) {
    setMessage(err.message);
  } finally {
    setLoading(false);
  }
};
    // Add this inside your AdminDashboard component
    const handleReview = async (appId, action) => {
        // action will be either 'approve' or 'reject'
        const confirmMessage = action === 'approve'
            ? 'Are you sure you want to approve this coach?'
            : 'Are you sure you want to reject this application?';

        if (!window.confirm(confirmMessage)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/admin/applications/${appId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove the processed application from the screen instantly
            setApplications(prevApps => prevApps.filter(app => app.id !== appId));

        } catch (err) {
            console.error('Failed to update application', err);
            alert('Error processing application. Please try again.');
        }
    };

    if (!stats) return (
        <div style={{ color: 'var(--text-main)', padding: '40px', textAlign: 'center' }}>
            <h2>Access Denied</h2>
            <p>You do not have permission to view this page.</p>
        </div>
    );

return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', color: 'var(--text-main)' }}>
        <h2 style={{ marginBottom: '30px' }}>Admin Control Center</h2>

        {/* 1. Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
                { label: 'Total Users', value: stats.users },
                { label: 'Total Coaches', value: stats.coaches },
                { label: 'Total Sessions', value: stats.sessions },
                { label: 'Platform Revenue', value: `$${stats.revenue}` }
            ].map(item => (
                <div key={item.label} style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9em', textTransform: 'uppercase' }}>{item.label}</p>
                    <h3 style={{ margin: '10px 0 0 0', fontSize: '1.8em' }}>{item.value}</h3>
                </div>
            ))}
        </div>

        {/* 2. Pending Applications Queue */}
        <div style={{ marginBottom: '40px', padding: '25px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginTop: 0 }}>Pending Coach Applications</h3>

            {applications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No pending applications.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {applications.map(app => (
                        <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0' }}>{app.username} ({app.email})</h4>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Applied for: <strong>{app.game_name}</strong></p>
                                <a href={app.certification_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', color: 'var(--accent-primary)' }}>
                                    View Certification Proof ↗
                                </a>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleReview(app.id, 'approve')}
                                    style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReview(app.id, 'reject')}
                                    style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* 3. Game Management Section */}
        <div className="admin-container" style={{ padding: '25px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <form onSubmit={handleAddGame} className="admin-form" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
                <h3 style={{ marginTop: 0 }}>Add New Marketplace Game</h3>
                
                <div className="form-group" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Game Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. League of Legends" 
                        value={newGame} 
                        onChange={(e) => setNewGame(e.target.value)} 
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                        required 
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Game Description</label>
                    <textarea 
                        placeholder="Enter a brief summary..." 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows="4"
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', resize: 'vertical' }}
                        required 
                    />
                </div>


                <div className="form-group" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Assign Coaches</label>
                    <div className="coaches-list" style={{ 
                        maxHeight: '150px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-color)',
                        padding: '10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-main)'
                    }}>
                        {allCoaches.map(coach => (
                            <label key={coach.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    value={coach.id}
                                    checked={selectedCoaches.includes(coach.id.toString())}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        if (e.target.checked) {
                                            setSelectedCoaches([...selectedCoaches, id]);
                                        } else {
                                            setSelectedCoaches(selectedCoaches.filter(item => item !== id));
                                        }
                                    }}
                                />
                                <span>{coach.username}</span>
                            </label>
                        ))}
                    </div>
                    <small style={{ marginTop: '5px', color: 'var(--text-muted)', fontSize: '0.8em' }}>Hold Ctrl (Cmd) to select multiple</small>
                </div>

                <button 
                    type="submit"
                    className="submit-btn"
                    disabled={loading} // Disables button during upload
                >
                    {loading ? 'Creating...' : 'Create Game'}
                </button>

                {message && (
                    <p style={{ marginTop: '15px', textAlign: 'center', color: message.includes('success') ? '#28a745' : '#dc3545' }}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    </div>
)};