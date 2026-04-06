import Browse from './components/Browse';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CoachProfile from './components/CoachProfile';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import GameCoaches from './components/GameCoaches';
import ApplyCoach from './components/ApplyCoach';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>coach.gg</h1>
        
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/coach/:id" element={<CoachProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/browse/game/:id" element={<GameCoaches />} />
          <Route path="/apply" element={<ApplyCoach />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;