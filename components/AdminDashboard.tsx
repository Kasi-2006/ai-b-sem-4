
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, AcademicFile, CheckoutLog } from '../types';
import { 
  ChevronLeft, Plus, Trash2, FileText, LayoutGrid, 
  Loader2, RefreshCcw, Search, ShieldAlert, CheckCircle2,
  Terminal, Copy, Check, X, Database, User, Hash, MoreVertical, Edit3,
  History, Sparkles, Layers
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
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFixModal, setShowFixModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Rename Logic State for Files
  const [editingFile, setEditingFile] = useState<AcademicFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  
  // Rename Logic State for Subjects
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeSubMenuId, setActiveSubMenuId] = useState<string | null>(null);
  
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  const FIX_SQL = `-- RUN THIS IN SUPABASE SQL EDITOR TO FIX PERMISSIONS AND STORAGE
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts DISABLE ROW LEVEL SECURITY;

-- Ensure unit_no column exists
ALTER TABLE files ADD COLUMN IF NOT EXISTS unit_no TEXT;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic-files', 'academic-files', true)
ON CONFLICT (id) DO NOTHING;

-- Reset and apply storage policy
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
    
    // Close menus when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        setActiveSubMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeedSubjects = async () => {
    setActionLoading(true);
    const sampleSubjects = [
      'Artificial Intelligence',
      'Data Structures & Algorithms',
      'Computer Networks',
      'Database Management Systems',
      'Operating Systems',
      'Software Engineering'
    ];

    try {
      const { error } = await supabase
        .from('subjects')
        .insert(sampleSubjects.map(name => ({ name })));
      
      if (error) throw error;
      setStatusMsg({ type: 'success', text: 'Sample subjects seeded successfully!' });
      await fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;

    setActionLoading(true);
    setStatusMsg(null);
    
    try {
      const { error } = await supabase.from('subjects').insert({ name });
      
      if (error) {
        if (error.message.toLowerCase().includes('row-level security') || error.code === '42501') {
          setStatusMsg({ type: 'error', text: 'Permission Denied: RLS is blocking this action.' });
          setShowFixModal(true);
          return;
        }
        throw error;
      }
      
      setStatusMsg({ type: 'success', text: `Subject "${name}" added!` });
      setNewSubjectName('');
      await fetchData(); 
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Failed: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenameFile = async () => {
    if (!editingFile || !newFileName.trim()) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('files')
        .update({ file_name: newFileName.trim() })
        .eq('id', editingFile.id);
      
      if (error) throw error;
      
      setStatusMsg({ type: 'success', text: 'File renamed successfully!' });
      setEditingFile(null);
      await fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Rename failed: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenameSubject = async () => {
    if (!editingSubject || !newSubName.trim()) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ name: newSubName.trim() })
        .eq('id', editingSubject.id);
      
      if (error) throw error;
      
      setStatusMsg({ type: 'success', text: 'Subject renamed successfully!' });
      setEditingSubject(null);
      await fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Rename failed: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFile = async (file: AcademicFile) => {
    if (confirm(`Are you sure you want to permanently delete "${file.file_name}"?`)) {
      setActionLoading(true);
      try {
        const { error } = await supabase.from('files').delete().eq('id', file.id);
        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'File deleted.' });
        await fetchData();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: `Delete failed: ${err.message}` });
      } finally {
        setActionLoading(false);
        setActiveMenuId(null);
      }
    }
  };

  const handleDeleteSubject = async (sub: Subject) => {
    if(confirm(`Are you sure? Deleting "${sub.name}" will also delete ALL associated assignments, notes, and resources.`)) {
      setActionLoading(true);
      try {
        const { error } = await supabase.from('subjects').delete().eq('id', sub.id);
        if (error) throw error;
        setStatusMsg({ type: 'success', text: `Subject "${sub.name}" and all contents deleted.` });
        await fetchData();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: `Delete failed: ${err.message}` });
      } finally {
        setActionLoading(false);
        setActiveSubMenuId(null);
      }
    }
  };

  const copyFixSql = () => {
    navigator.clipboard.writeText(FIX_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Rename File Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Rename File</h3>
            <p className="text-slate-500 font-medium mb-6 text-sm">Update the display name for this resource.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">New Filename</label>
                <input 
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                  placeholder="Enter new name..."
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingFile(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRenameFile}
                  disabled={actionLoading || !newFileName.trim()}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Name'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Rename Subject</h3>
            <p className="text-slate-500 font-medium mb-6 text-sm">Update the name of this academic module.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">New Module Name</label>
                <input 
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                  placeholder="e.g. Modern AI Systems"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRenameSubject}
                  disabled={actionLoading || !newSubName.trim()}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Module'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fix Permissions/Storage Modal */}
      {showFixModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <Database className="w-8 h-8" />
              </div>
              <button onClick={() => setShowFixModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Infrastructure Repair</h3>
            <p className="text-slate-500 font-medium mb-6 text-sm">Use this script to fix <strong>Permission Denied</strong> or <strong>Bucket not found</strong> errors.</p>
            
            <div className="bg-slate-900 rounded-2xl p-5 mb-6 relative">
              <button 
                onClick={copyFixSql}
                className="absolute top-4 right-4 text-indigo-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <pre className="text-xs font-mono text-indigo-200 whitespace-pre-wrap leading-relaxed">
                {FIX_SQL}
              </pre>
            </div>

            <button 
              onClick={() => setShowFixModal(false)}
              className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all"
            >
              Done, Close Window
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
                <img src="https://img.icons8.com/fluency/96/graduation-cap.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
             <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h2>
               <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-widest text-[10px]">Database Synchronized</p>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFixModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
          >
            <Terminal className="w-4 h-4" />
            Infrastructure Repair
          </button>
          <button onClick={fetchData} className="p-4 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all">
            <RefreshCcw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black tracking-wide transition-all ${activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          Subjects
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black tracking-wide transition-all ${activeTab === 'files' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <FileText className="w-4 h-4" />
          Files
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black tracking-wide transition-all ${activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <History className="w-4 h-4" />
          Logs
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl min-h-[500px] flex flex-col relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing...</p>
          </div>
        )}

        {statusMsg && (
          <div className={`m-8 p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            <div className="flex items-center gap-3">
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              <span className="text-sm font-black">{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)}><X className="w-4 h-4 opacity-40 hover:opacity-100" /></button>
          </div>
        )}

        {activeTab === 'subjects' ? (
          <div className="p-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="flex-1 max-w-2xl">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Plus className="w-6 h-6 text-indigo-600" />
                  Add New Subject
                </h3>
                <form onSubmit={handleAddSubject} className="flex gap-4">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Computer Networks"
                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newSubjectName.trim()}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Add'}
                  </button>
                </form>
              </div>

              {subjects.length === 0 && !loading && (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-500">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-amber-900 text-sm">Empty Database?</p>
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-4">Start with standard subjects</p>
                    <button 
                      onClick={handleSeedSubjects}
                      className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                    >
                      Seed Sample Modules
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all relative">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full shrink-0" />
                    <span className="font-bold text-slate-700 truncate">{sub.name}</span>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setActiveSubMenuId(activeSubMenuId === sub.id ? null : sub.id)}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {/* Subject Context Menu */}
                    {activeSubMenuId === sub.id && (
                      <div 
                        ref={subMenuRef}
                        className="absolute right-0 top-10 z-[50] w-44 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <button 
                          onClick={() => {
                            setEditingSubject(sub);
                            setNewSubName(sub.name);
                            setActiveSubMenuId(null);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-indigo-500" />
                          Rename
                        </button>
                        <button 
                          onClick={() => handleDeleteSubject(sub)}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'files' ? (
          <div className="p-8 flex-1">
             <div className="flex items-center gap-4 mb-8">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                  type="text" 
                  placeholder="Search files by name, student, or roll no..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>
             </div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 px-4">Filename</th>
                    <th className="pb-4 px-4">Unit</th>
                    <th className="pb-4 px-4">Contributor</th>
                    <th className="pb-4 px-4">Roll No</th>
                    <th className="pb-4 px-4">Category</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.filter(f => 
                    f.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    f.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((file) => (
                    <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-bold text-slate-800">{file.file_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {file.unit_no ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg w-fit">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{file.unit_no}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                           <User className="w-3.5 h-3.5 text-slate-300" />
                           <span className="text-sm font-medium text-slate-600">{file.student_name || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                           <Hash className="w-3.5 h-3.5 text-slate-300" />
                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{file.roll_no || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          file.category === 'Assignments' ? 'bg-blue-100 text-blue-700' :
                          file.category === 'Notes' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {file.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right relative">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* File Dropdown Menu */}
                        {activeMenuId === file.id && (
                          <div 
                            ref={fileMenuRef}
                            className="absolute right-4 top-12 z-[50] w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                          >
                            <button 
                              onClick={() => {
                                setEditingFile(file);
                                setNewFileName(file.file_name);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-indigo-500" />
                              Rename
                            </button>
                            <button 
                              onClick={() => handleDeleteFile(file)}
                              className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              Delete
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
          <div className="p-8 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 px-4">User Activity</th>
                    <th className="pb-4 px-4">Role</th>
                    <th className="pb-4 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {checkouts.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50">
                      <td className="py-4 px-4 text-sm font-bold text-slate-700">{log.file_name} accessed</td>
                      <td className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">{log.user_role}</td>
                      <td className="py-4 px-4 text-right text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
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
