// frontend/src/components/Dashboard.jsx
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

      // If there is no token, kick them back to the login page
      if (!token) {
        navigate('/');
        return;
      }

      try {
        // Here is where we attach the token to the header, just like in Postman!
        const response = await axios.get('http://localhost:5000/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Save the secure data to state so we can render it
        setUser(response.data);
      } catch (err) {
        console.error(err);
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token'); // Clear the bad token
        navigate('/'); // Kick them out
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Show a loading state while we wait for the backend to respond
  if (!user && !error) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading VIP data...</div>;

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
        onClick={handleLogout} 
        style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Logout
      </button>
    </div>
  );
}