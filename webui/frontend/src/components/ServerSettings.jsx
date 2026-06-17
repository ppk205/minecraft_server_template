import { useState, useEffect } from 'react';
import { Shield, HardDrive, DownloadCloud } from 'lucide-react';

export default function ServerSettings({ token }) {
  const [software, setSoftware] = useState('AUTO_CURSEFORGE');
  const [missingModsText, setMissingModsText] = useState('');
  const [networkConfig, setNetworkConfig] = useState({
      MC_MEMORY: '8G',
      PLAYIT_KEY: '',
      CLOUDFLARED_TOKEN: '',
      NGROK_AUTHTOKEN: '',
      TAILSCALE_AUTHKEY: ''
  });

  useEffect(() => {
      const fetchSettings = async () => {
          try {
              const res = await fetch('/api/settings', {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data) {
                  setSoftware(data.MC_TYPE || 'AUTO_CURSEFORGE');
                  setNetworkConfig({
                      MC_MEMORY: data.MC_MEMORY || '8G',
                      PLAYIT_KEY: data.PLAYIT_KEY || '',
                      CLOUDFLARED_TOKEN: data.CLOUDFLARED_TOKEN || '',
                      NGROK_AUTHTOKEN: data.NGROK_AUTHTOKEN || '',
                      TAILSCALE_AUTHKEY: data.TAILSCALE_AUTHKEY || ''
                  });
              }
          } catch(err) {}
      };
      fetchSettings();
  }, [token]);

  const handleChangeSoftware = async () => {
    const confirmBackup = window.confirm(
      "WARNING: Changing the server software will delete the current world to prevent corruption. " +
      "Do you want to run a backup of the world folder first before wiping?"
    );
    try {
        await fetch('/api/software/change', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ software, backup: confirmBackup })
        });
        alert(confirmBackup ? "World zipped and saved to backups/. Software changed. Server is restarting." : "Software changed without backup. Server is restarting.");
    } catch(err) {
        alert("Failed to change software.");
    }
  };

  const handleSaveNetworkConfig = async () => {
      try {
          let profiles = [];
          if (networkConfig.PLAYIT_KEY) profiles.push('playit');
          if (networkConfig.CLOUDFLARED_TOKEN) profiles.push('cloudflared');
          if (networkConfig.NGROK_AUTHTOKEN) profiles.push('ngrok');
          if (networkConfig.TAILSCALE_AUTHKEY) profiles.push('tailscale');

          const finalConfig = {
              ...networkConfig,
              COMPOSE_PROFILES: profiles.join(',')
          };

          await fetch('/api/settings', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(finalConfig)
          });

          await fetch('/api/docker/up', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          alert("Network & System Config saved. Docker compose reloading.");
      } catch (err) {
          alert("Failed to save config.");
      }
  };

  const handleFixMods = async () => {
    if (!missingModsText.trim()) return;
    const names = missingModsText.split(',').map(n => n.trim()).filter(n => n);
    
    try {
      const res = await fetch('/api/mods/fix-missing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ missingNames: names })
      });
      const data = await res.json();
      alert(`Downloaded: ${data.downloaded.join(', ')}\nFailed: ${data.failed.join(', ')}`);
    } catch (err) {
      alert("Failed to fix mods.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Software & Modpack Engine</h2>
            <p className="text-slate-400 text-sm">Change server loader or install modpacks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Target Software</label>
            <select 
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              value={software}
              onChange={(e) => setSoftware(e.target.value)}
            >
              <option value="AUTO_CURSEFORGE">CurseForge Modpack</option>
              <option value="PAPER">PaperMC</option>
              <option value="FABRIC">Fabric</option>
              <option value="FORGE">Forge</option>
              <option value="VANILLA">Vanilla</option>
            </select>
            <button onClick={handleChangeSoftware} className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              Apply Changes
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">CF-to-Modrinth Fallback</label>
            <p className="text-xs text-slate-400">If Curseforge blocked a mod download, paste the project names here (comma-separated).</p>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              placeholder="e.g., sodium, lithium"
              value={missingModsText}
              onChange={(e) => setMissingModsText(e.target.value)}
            />
            <button onClick={handleFixMods} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all">
              <span className="flex items-center justify-center gap-2"><DownloadCloud size={18} /> Run Fallback Downloader</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System & Network Options</h2>
            <p className="text-slate-400 text-sm">Configure RAM, Ngrok, Playit, Cloudflared.</p>
          </div>
        </div>

        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Max RAM Allocation</label>
             <input type="text" value={networkConfig.MC_MEMORY} onChange={(e) => setNetworkConfig({...networkConfig, MC_MEMORY: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Playit.gg Secret Key</label>
             <input type="password" value={networkConfig.PLAYIT_KEY} onChange={(e) => setNetworkConfig({...networkConfig, PLAYIT_KEY: e.target.value})} placeholder="playit-secret-key" className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Cloudflare Tunnel Token</label>
             <input type="password" value={networkConfig.CLOUDFLARED_TOKEN} onChange={(e) => setNetworkConfig({...networkConfig, CLOUDFLARED_TOKEN: e.target.value})} placeholder="eyJh..." className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Ngrok Auth Token</label>
             <input type="password" value={networkConfig.NGROK_AUTHTOKEN} onChange={(e) => setNetworkConfig({...networkConfig, NGROK_AUTHTOKEN: e.target.value})} placeholder="ngrok-auth-token" className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Tailscale Auth Key</label>
             <input type="password" value={networkConfig.TAILSCALE_AUTHKEY} onChange={(e) => setNetworkConfig({...networkConfig, TAILSCALE_AUTHKEY: e.target.value})} placeholder="tskey-auth..." className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <button onClick={handleSaveNetworkConfig} className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              Save Network Config
           </button>
        </div>
      </div>
    </div>
  );
}
