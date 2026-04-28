import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('webui_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('webui_token', token);
    } else {
      localStorage.removeItem('webui_token');
    }
  }, [token]);

  return (
    <Router>
      <div className="min-h-screen bg-[#0f1115] text-[#f8fafc] font-sans selection:bg-blue-500/30">
        <Routes>
          <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} />
          <Route path="/*" element={token ? <Dashboard token={token} setToken={setToken} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
