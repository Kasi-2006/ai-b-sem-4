
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, AcademicFile, CheckoutLog } from '../types';
import { 
  ChevronLeft, Plus, Trash2, FileText, LayoutGrid, 
  Loader2, RefreshCcw, Search, ShieldAlert, CheckCircle2,
  Terminal, Copy, Check, X, Database, History, User, Hash, MoreVertical, Edit2, Eye
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutLog[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'subjects' | 'files' | 'logs'>('subjects');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFixModal, setShowFixModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null);
  const [activeSubjectMenu, setActiveSubjectMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const subjectMenuRef = useRef<HTMLDivElement>(null);

  const FIX_SQL = `-- 1. DROP OLD TABLES (FRESH INSTALL)
DROP TABLE IF EXISTS checkouts;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS subjects;

-- 2. CREATE NEW STRUCTURE
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Assignments', 'Notes', 'Lab Resources')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  student_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  unit_no TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  category TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_role TEXT NOT NULL
);

-- 3. DISABLE RLS
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts DISABLE ROW LEVEL SECURITY;

-- 4. STORAGE
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic-files', 'academic-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'academic-files' ) WITH CHECK ( bucket_id = 'academic-files' );`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, fileRes, logRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('files').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('checkouts').select('*').order('timestamp', { ascending: false }).limit(100)
      ]);
      
      if (subRes.error) throw subRes.error;
      
      setSubjects(subRes.data || []);
      setFiles(fileRes.data || []);
      setCheckouts(logRes.data || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveFileMenu(null);
      }
      if (subjectMenuRef.current && !subjectMenuRef.current.contains(event.target as Node)) {
        setActiveSubjectMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;
    try {
      const { error } = await supabase.from('subjects').insert({ name });
      if (error) throw error;
      setStatusMsg({ type: 'success', text: `Subject "${name}" added!` });
      setNewSubjectName('');
      await fetchData(); 
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
      if (err.message.includes('column') || err.message.includes('cache')) setShowFixModal(true);
    }
  };

  const handleRenameSubject = async (subject: Subject) => {
    const newName = prompt("Enter new subject name:", subject.name);
    if (!newName || newName === subject.name) {
      setActiveSubjectMenu(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .update({ name: newName })
        .eq('id', subject.id);
      
      if (error) throw error;
      setStatusMsg({ type: 'success', text: 'Subject renamed successfully.' });
      await fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
    setActiveSubjectMenu(null);
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (confirm(`Permanent Delete Subject: "${subject.name}"? This will delete ALL associated files.`)) {
      try {
        const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'Subject and associated files purged.' });
        await fetchData();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message });
      }
    }
    setActiveSubjectMenu(null);
  };

  const handleRenameFile = async (file: AcademicFile) => {
    const newName = prompt("Enter new filename:", file.file_name);
    if (!newName || newName === file.file_name) {
      setActiveFileMenu(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('files')
        .update({ file_name: newName })
        .eq('id', file.id);
      
      if (error) throw error;
      setStatusMsg({ type: 'success', text: 'File renamed successfully.' });
      await fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
    setActiveFileMenu(null);
  };

  const handleDeleteFile = async (file: AcademicFile) => {
    if (confirm(`Permanent Delete: "${file.file_name}"?`)) {
      try {
        const { error } = await supabase.from('files').delete().eq('id', file.id);
        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'Resource purged from database.' });
        await fetchData();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message });
      }
    }
    setActiveFileMenu(null);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {showFixModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 p-8">
            <div className="flex justify-between items-start mb-6">
              <ShieldAlert className="w-10 h-10 text-red-500" />
              <button onClick={() => setShowFixModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">System Re-installation</h3>
            <p className="text-slate-500 mb-6 text-sm font-medium">This will delete ALL data and recreate the tracking schema from scratch.</p>
            <div className="bg-slate-900 rounded-2xl p-5 mb-6 relative">
              <button onClick={() => {navigator.clipboard.writeText(FIX_SQL); setCopied(true); setTimeout(()=>setCopied(false), 2000);}} className="absolute top-4 right-4 text-indigo-400 hover:text-white transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="text-[10px] font-mono text-indigo-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">{FIX_SQL}</pre>
            </div>
            <button onClick={() => setShowFixModal(false)} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100">Close Window</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><ChevronLeft /></button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowFixModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all">
            <Database className="w-4 h-4" /> Fresh Install SQL
          </button>
          <button onClick={fetchData} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCcw className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      <div className="flex gap-3 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('subjects')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Modules</button>
        <button onClick={() => setActiveTab('files')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'files' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Files</button>
        <button onClick={() => setActiveTab('logs')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Audit Logs</button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
        {statusMsg && <div className={`m-8 p-4 rounded-xl border flex items-center justify-between animate-in slide-in-from-top-4 ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          <div className="flex items-center gap-3 font-black text-sm"><CheckCircle2 className="w-5 h-5" /><span>{statusMsg.text}</span></div>
          <button onClick={() => setStatusMsg(null)}><X className="w-4 h-4" /></button>
        </div>}

        {activeTab === 'subjects' ? (
          <div className="p-8 space-y-12">
            <div className="max-w-2xl bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><Plus className="w-6 h-6 text-indigo-600" />Add Subject</h3>
              <form onSubmit={handleAddSubject} className="flex gap-4">
                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Subject Code/Name" className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm" />
                <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100">Add</button>
              </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border-l-4 hover:border-l-indigo-500 relative">
                  <span className="font-bold text-slate-700 truncate mr-8">{sub.name}</span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveSubjectMenu(activeSubjectMenu === sub.id ? null : sub.id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-all rounded-lg hover:bg-slate-100"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeSubjectMenu === sub.id && (
                      <div 
                        ref={subjectMenuRef}
                        className="absolute right-6 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                      >
                        <button 
                          onClick={() => handleRenameSubject(sub)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" /> Rename
                        </button>
                        <div className="h-px bg-slate-50 mx-2"></div>
                        <button 
                          onClick={() => handleDeleteSubject(sub)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}

                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'files' ? (
          <div className="p-8">
            <div className="relative mb-8"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Search by name, category or contributor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none shadow-inner" /></div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="pb-4 px-4">Document</th>
                    <th className="pb-4 px-4">Type</th>
                    <th className="pb-4 px-4">Contributor</th>
                    <th className="pb-4 px-4">Roll No</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {files.filter(f => 
                    f.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    f.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="py-4 px-4 text-sm font-bold text-slate-800 tracking-tight">{file.file_name}</td>
                      <td className="py-4 px-4"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${file.category === 'Assignments' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{file.category}</span></td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-700">{file.student_name}</td>
                      <td className="py-4 px-4"><span className="text-[10px] font-black text-slate-400 font-mono">{file.roll_no}</span></td>
                      <td className="py-4 px-4 text-right relative">
                        <button 
                          onClick={() => setActiveFileMenu(activeFileMenu === file.id ? null : file.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-all rounded-lg hover:bg-white"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {activeFileMenu === file.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                          >
                            <button 
                              onClick={() => { window.open(file.file_url, '_blank'); setActiveFileMenu(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button 
                              onClick={() => handleRenameFile(file)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" /> Rename
                            </button>
                            <div className="h-px bg-slate-50 mx-2"></div>
                            <button 
                              onClick={() => handleDeleteFile(file)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr><th className="pb-4 px-4">Access History</th><th className="pb-4 px-4 text-right">Audit Time</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {checkouts.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50"><td className="py-4 px-4 text-sm font-bold text-slate-700">{log.file_name} <span className="text-[10px] font-black text-slate-400 uppercase mx-2 tracking-widest">({log.user_role})</span></td><td className="py-4 px-4 text-right text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
