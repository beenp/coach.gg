import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <div>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>coach.gg</h1>
        
        {/* The Routes block handles swapping out the page content */}
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        
      </div>
    </BrowserRouter>
  );
}

export default App;