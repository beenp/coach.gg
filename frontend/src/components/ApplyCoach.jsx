import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export default function ApplyCoach() {
  const [games, setGames] = useState([]);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [file, setFile] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();

  

  useEffect(() => {
    axios.get('http://localhost:5000/api/public/games').then(res => setGames(res.data));
    
    // check Application Status
    const checkStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await axios.get('http://localhost:5000/api/users/me/coach-status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.hasPendingApplication) {
          setAlreadyApplied(true);
        }
      }
    };
    checkStatus();
  }, []);


  useEffect(() => {
    axios.get('http://localhost:5000/api/public/games').then(res => setGames(res.data));
  }, []);

const isAllowedType = (file) => {
  // Define what you want to accept (Images and PDFs are standard for certs)
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  return file && allowed.includes(file.type);
};

const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic Validation
    if (!file || !selectedGame || !fullName || !email || !phone) {
        alert("Please fill in all fields and upload a certification.");
        return;
    }

    try {
        // Set status to submitting immediately to show loading state during upload
        setStatus('submitting');

        // 2. Handle Supabase Storage Upload
        const fileExt = file.name.split('.').pop().toLowerCase();
        const secureFileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('certifications')
            .upload(secureFileName, file);

        if (uploadError) throw uploadError;

        // 3. Retrieve the Public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
            .from('certifications')
            .getPublicUrl(secureFileName);
        
        // 4. Send the application data to your Express Backend
        const token = localStorage.getItem('token');
        
        await axios.post('http://localhost:5000/api/users/apply', {
            gameId: selectedGame,
            certificationUrl: publicUrlData.publicUrl,
            fullName,
            email,
            phone
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 5. Success!
        setStatus('success');

    } catch (err) {
        console.error("Submission error:", err);
        
        // Handle specific Axios errors if available, otherwise show generic message
        const errorMessage = err.response?.data?.error || 'Application failed. You may already have a pending application.';
        alert(errorMessage);
        
        // Reset status so the user can try again if it wasn't a "already applied" error
        setStatus('idle');
    }
};
  

    if (alreadyApplied) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-main)', backgroundColor: 'var(--bg-surface)', maxWidth: '600px', margin: '40px auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h2>Application Under Review ⏳</h2>
        <p style={{ color: 'var(--text-muted)' }}>You already have an application in our system. Our admins will review it shortly. Please keep an eye on your email.</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px' }}>Back to Dashboard</button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-main)' }}>
        <h2>Application Submitted! 🎉</h2>
        <p>Our admins will review your identification and certification shortly.</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px' }}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
      <h2 style={{ marginTop: 0 }}>Apply to be a Coach</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>
        Please provide valid identification and proof of your rank to ensure the safety and quality of our marketplace.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Identification Section */}
        <div style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-main)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em' }}>Identification</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Legal Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }} />
            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }} />
            <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }} />
          </div>
        </div>

        {/* Gaming Credential Section */}
        <div style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-main)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em' }}>Gaming Credentials</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-muted)' }}>Primary Game</label>
              <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)} required style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <option value="">-- Choose Game --</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-muted)' }}>Proof of Rank (Image/Video)</label>
              <input type="file" accept="image/jpeg, image/png, image/webp, video/mp4, video/webm" onChange={(e) => setFile(e.target.files[0])} required style={{ width: '100%', color: 'var(--text-main)' }} />
            </div>
          </div>
        </div>

        <button disabled={status !== 'idle'} type="submit" style={{ padding: '14px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: status !== 'idle' ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1em' }}>
          {status === 'idle' ? 'Submit Application' : 'Uploading & Processing...'}
        </button>
      </form>
    </div>
  );}
