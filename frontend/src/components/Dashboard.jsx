import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // This function runs automatically when the Dashboard loads
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/');
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/api/users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setUser(response.data);
            } catch (err) {
                console.error(err);
                setError('Session expired. Please log in again.');
                localStorage.removeItem('token'); 
                navigate('/'); //Kicks the user out of dashboard
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

            // Redirect the browser entirely to Google's servers
            window.location.href = response.data.url;
        } catch (err) {
            console.error('Error getting calendar URL:', err);
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
            
            <button
                onClick={handleConnectCalendar}
                style={{ padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', marginBottom: '20px' }}
            >
                Connect Google Calendar
            </button>

            <button
                onClick={handleLogout}
                style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Logout
            </button>
        </div>
    );
}