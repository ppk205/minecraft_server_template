import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Server, Folder, Settings, LogOut, Activity, Power, RotateCw, Square } from 'lucide-react';
import { useState, useEffect } from 'react';
import FileManager from './FileManager';
import ServerSettings from './ServerSettings';

function StatusOverview({ token }) {
  const [status, setStatus] = useState('unknown');
  const [logs, setLogs] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/docker/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStatus(data.status || 'unknown');
    } catch (err) {
      setStatus('error');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/docker/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || '');
    } catch (err) { }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const controlServer = async (action) => {
    try {
      await fetch(`/api/docker/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchStatus();
    } catch (err) {
      alert(`Failed to ${action} server`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Server Status</p>
              <h3 className="text-2xl font-bold uppercase tracking-wider">{status}</h3>
            </div>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex items-center gap-4">
           <button onClick={() => controlServer('start')} className="flex items-center gap-2 flex-1 justify-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20">
             <Power size={18} /> Start
           </button>
           <button onClick={() => controlServer('restart')} className="flex items-center gap-2 flex-1 justify-center py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20">
             <RotateCw size={18} /> Restart
           </button>
           <button onClick={() => controlServer('stop')} className="flex items-center gap-2 flex-1 justify-center py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg shadow-red-500/20">
             <Square size={18} /> Stop
           </button>
        </div>
      </div>
      
      <div className="bg-[#0a0c10] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-slate-300">Live Console</h3>
        </div>
        <div className="p-4 h-[400px] overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap">
          {logs || 'Loading logs...'}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ token, setToken }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const navItemClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
              <Server size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">MineGuard</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavLink end to="/" className={navItemClass}>
             <Activity size={18} /> Overview
          </NavLink>
          <NavLink to="/files" className={navItemClass}>
             <Folder size={18} /> File Explorer
          </NavLink>
          <NavLink to="/settings" className={navItemClass}>
             <Settings size={18} /> Settings
          </NavLink>
        </nav>
        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
             <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto p-8 relative">
         <Routes>
           <Route path="/" element={<StatusOverview token={token} />} />
           <Route path="/files/*" element={<FileManager token={token} />} />
           <Route path="/settings" element={<ServerSettings token={token} />} />
         </Routes>
      </main>
    </div>
  );
}
