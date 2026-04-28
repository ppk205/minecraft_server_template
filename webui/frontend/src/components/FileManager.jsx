import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Folder as FolderIcon, File as FileIcon, ArrowLeft, Save, X } from 'lucide-react';

export default function FileManager({ token }) {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFiles = async (p) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/files/list?path=${encodeURIComponent(p)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.list) {
        setFiles(data.list.sort((a,b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name)));
        setCurrentPath(p);
      }
    } catch (err) { }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles('/');
  }, []);

  const handleFileClick = async (file) => {
    if (file.isDirectory) {
      fetchFiles(file.path);
    } else {
      try {
        const res = await fetch(`http://localhost:3001/api/files/read?path=${encodeURIComponent(file.path)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.content !== undefined) {
          setEditingFile(file);
          setFileContent(data.content);
        }
      } catch (err) {
        alert("Cannot read file. It might be binary.");
      }
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`http://localhost:3001/api/files/write?path=${encodeURIComponent(editingFile.path)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: fileContent })
      });
      setEditingFile(null);
      alert("File saved! Server will restart to apply config if requested.");
    } catch(err) {
      alert("Failed to save file.");
    }
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const p = currentPath.split('/').slice(0, -1).join('/') || '/';
    fetchFiles(p);
  };

  if (editingFile) {
    return (
      <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditingFile(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-semibold text-slate-200">{editingFile.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditingFile(null)} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl text-slate-300 transition-colors">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all shadow-lg shadow-blue-500/20">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
        <textarea
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          className="flex-1 w-full bg-[#0a0c10] text-slate-300 p-6 font-mono text-sm focus:outline-none resize-none"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-black/20">
        <button onClick={goUp} disabled={currentPath === '/'} className="p-2 disabled:opacity-50 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/10 text-slate-300 font-mono text-sm tracking-wide">
          {currentPath}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-slate-400 mt-10">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <button 
                key={file.path} 
                onClick={() => handleFileClick(file)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
              >
                {file.isDirectory ? <FolderIcon className="w-8 h-8 text-blue-400" /> : <FileIcon className="w-8 h-8 text-slate-400" />}
                <span className="truncate text-slate-200">{file.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
