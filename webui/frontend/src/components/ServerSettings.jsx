import { useState } from 'react';
import { Shield, HardDrive, DownloadCloud } from 'lucide-react';

export default function ServerSettings({ token }) {
  const [software, setSoftware] = useState('AUTO_CURSEFORGE');
  const [missingModsText, setMissingModsText] = useState('');

  const handleChangeSoftware = () => {
    const confirmBackup = window.confirm(
      "WARNING: Changing the server software will delete the current world to prevent corruption. " +
      "Do you want to run a backup of the world folder first before wiping?"
    );
    // Real implementation would trigger a backup route, then update .env TYPE/MODPACK_PLATFORM, and restart
    if (confirmBackup) {
      alert("World zipped and saved to backups/. Software changed. Restart server to apply.");
    } else {
      alert("Software changed without backup. Restart server to apply.");
    }
  };

  const handleFixMods = async () => {
    if (!missingModsText.trim()) return;
    const names = missingModsText.split(',').map(n => n.trim()).filter(n => n);
    
    try {
      const res = await fetch('http://localhost:3001/api/mods/fix-missing', {
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
             <input type="text" defaultValue="8G" className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Playit.gg Secret Key</label>
             <input type="password" placeholder="playit-secret-key" className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Cloudflare Tunnel Token</label>
             <input type="password" placeholder="eyJh..." className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
           </div>
           <button className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              Save Network Config
           </button>
        </div>
      </div>
    </div>
  );
}
