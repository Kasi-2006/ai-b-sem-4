
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, AcademicFile, CheckoutLog, Category, UserProfile, Report, Announcement } from '../types';
import Uploader from './Uploader';
import { 
  ChevronLeft, Plus, Trash2, Loader2, RefreshCcw, Search, ShieldAlert, CheckCircle2,
  Copy, Check, X, Database, Edit2, Eye, MoreVertical, Save, AlertTriangle, Layers, FileText, Mail, Flag, Megaphone
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserProfile;
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState<Category>('Assignments');
  const [activeTab, setActiveTab] = useState<'subjects' | 'files' | 'logs' | 'upload' | 'reports'>('subjects');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFixModal, setShowFixModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Announcement State
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [updatingAnnouncement, setUpdatingAnnouncement] = useState(false);

  // Menu & Modal State (Subjects)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean, subject: Subject | null, newName: string }>({ 
    isOpen: false, 
    subject: null, 
    newName: '' 
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, subject: Subject | null }>({
    isOpen: false,
    subject: null
  });

  // Modal State (Files)
  const [fileRenameModal, setFileRenameModal] = useState<{ isOpen: boolean, file: AcademicFile | null, newName: string }>({ 
    isOpen: false, 
    file: null, 
    newName: '' 
  });
  const [fileDeleteModal, setFileDeleteModal] = useState<{ isOpen: boolean, file: AcademicFile | null }>({
    isOpen: false,
    file: null
  });

  // Modal State (Reports)
  const [reportDeleteModal, setReportDeleteModal] = useState<{ isOpen: boolean, reportId: string | null }>({
    isOpen: false,
    reportId: null
  });

  const FIX_SQL = `-- Infrastructure Update (Safe Mode)
-- This script adds missing tables (like reports) without deleting existing data.

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Assignments', 'Notes', 'Lab Resources')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Assignments', 'Notes', 'Lab Resources')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  student_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  user_email TEXT,
  unit_no TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  category TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  status TEXT DEFAULT 'Open',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Policies (Re-apply safe)
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic-files', 'academic-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'academic-files' ) WITH CHECK ( bucket_id = 'academic-files' );`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, fileRes, logRes, reportRes, announceRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('files').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('checkouts').select('*').order('timestamp', { ascending: false }).limit(100),
        supabase.from('reports').select('*').order('timestamp', { ascending: false }),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single()
      ]);
      
      if (subRes.error) throw subRes.error;
      if (fileRes.error) throw fileRes.error;
      if (logRes.error) throw logRes.error;
      
      setSubjects(subRes.data || []);
      setFiles(fileRes.data || []);
      setCheckouts(logRes.data || []);
      setReports(reportRes.data || []);
      
      if (announceRes.data) {
        setActiveAnnouncement(announceRes.data);
      } else {
        setActiveAnnouncement(null);
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      // Don't error out completely if reports table doesn't exist yet (for older setups)
      if (err.message && !err.message.includes('reports')) {
        setStatusMsg({ type: 'error', text: 'Sync Error: ' + err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]); // Refetch when switching tabs (e.g. after upload)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('subjects').insert({ 
        name,
        category: newSubjectCategory
      });
      if (error) throw error;
      setStatusMsg({ type: 'success', text: `Module "${name}" added to ${newSubjectCategory}.` });
      setNewSubjectName('');
      await fetchData(); 
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  // --- ANNOUNCEMENT MANAGEMENT ---
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    
    setUpdatingAnnouncement(true);
    try {
      // Deactivate all previous announcements first (optional but good for cleanup)
      await supabase.from('announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to allow update all

      const { data, error } = await supabase.from('announcements').insert({
        message: announcementMsg.trim(),
        is_active: true
      }).select().single();

      if (error) throw error;

      setActiveAnnouncement(data);
      setAnnouncementMsg('');
      setStatusMsg({ type: 'success', text: 'Announcement posted.' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to post announcement.' });
    } finally {
      setUpdatingAnnouncement(false);
    }
  };

  const handleClearAnnouncement = async () => {
    if (!activeAnnouncement) return;
    setUpdatingAnnouncement(true);
    try {
       await supabase.from('announcements').update({ is_active: false }).eq('id', activeAnnouncement.id);
       setActiveAnnouncement(null);
       setStatusMsg({ type: 'success', text: 'Announcement cleared.' });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAnnouncement(false);
    }
  };

  // --- REPORT MANAGEMENT ---
  const handleResolveReport = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Open' ? 'Resolved' : 'Open';
    try {
      await supabase.from('reports').update({ status: newStatus }).eq('id', id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setReportDeleteModal({ isOpen: true, reportId: id });
  };

  const confirmDeleteReport = async () => {
    const { reportId } = reportDeleteModal;
    if (!reportId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('reports').delete().eq('id', reportId);
      if (error) throw error;
      
      setReports(prev => prev.filter(r => r.id !== reportId));
      setStatusMsg({ type: 'success', text: 'Report deleted permanently.' });
      setReportDeleteModal({ isOpen: false, reportId: null });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to delete report: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- SUBJECT RENAME LOGIC ---

  const openRenameModal = (e: React.MouseEvent, subject: Subject) => {
    e.preventDefault();
    e.stopPropagation(); 
    setOpenMenuId(null); 
    setRenameModal({ isOpen: true, subject, newName: subject.name });
  };

  const closeRenameModal = () => {
    setRenameModal({ isOpen: false, subject: null, newName: '' });
  };

  const confirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    const { subject, newName } = renameModal;
    
    if (!subject || !newName.trim()) {
      closeRenameModal();
      return;
    }

    if (newName.trim() === subject.name) {
      closeRenameModal();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ name: newName.trim() })
        .eq('id', subject.id);
      
      if (error) throw error;
      
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, name: newName.trim() } : s));
      setStatusMsg({ type: 'success', text: 'Module renamed successfully.' });
      closeRenameModal();
    } catch (err: any) {
      console.error('Rename error:', err);
      setStatusMsg({ type: 'error', text: 'Rename failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- SUBJECT DELETE LOGIC ---

  const handleDeleteSubject = (e: React.MouseEvent, subject: Subject) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setDeleteModal({ isOpen: true, subject });
  };

  const confirmDeleteSubject = async () => {
    const { subject } = deleteModal;
    if (!subject) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      if (error) throw error;
      
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
      setFiles(prev => prev.filter(f => f.subject_id !== subject.id));
      setStatusMsg({ type: 'success', text: 'Module and linked assets deleted.' });
      setDeleteModal({ isOpen: false, subject: null });
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatusMsg({ type: 'error', text: 'Database Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- FILE ACTIONS ---

  const handleRenameFile = (e: React.MouseEvent, file: AcademicFile) => {
    e.preventDefault();
    e.stopPropagation();
    setFileRenameModal({ isOpen: true, file, newName: file.file_name });
  };

  const confirmRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { file, newName } = fileRenameModal;
    
    if (!file || !newName.trim()) {
      setFileRenameModal({ isOpen: false, file: null, newName: '' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('files')
        .update({ file_name: newName.trim() })
        .eq('id', file.id);
      
      if (error) throw error;
      
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, file_name: newName.trim() } : f));
      setStatusMsg({ type: 'success', text: 'File renamed successfully.' });
      setFileRenameModal({ isOpen: false, file: null, newName: '' });
    } catch (err: any) {
      console.error('File rename error:', err);
      setStatusMsg({ type: 'error', text: 'Database Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = (e: React.MouseEvent, file: AcademicFile) => {
    e.preventDefault();
    e.stopPropagation();
    setFileDeleteModal({ isOpen: true, file });
  };

  const confirmDeleteFile = async () => {
    const { file } = fileDeleteModal;
    if (!file) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('files').delete().eq('id', file.id);
      if (error) throw error;
      
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setStatusMsg({ type: 'success', text: 'Resource deleted from database.' });
      setFileDeleteModal({ isOpen: false, file: null });
    } catch (err: any) {
      console.error('File delete error:', err);
      setStatusMsg({ type: 'error', text: 'Database Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Assignments': return 'bg-blue-100 text-blue-700';
      case 'Notes': return 'bg-emerald-100 text-emerald-700';
      case 'Lab Resources': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Subject Rename Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-2">Rename Module</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">Update the display name for this subject.</p>
            
            <form onSubmit={confirmRename}>
              <input 
                autoFocus
                type="text" 
                value={renameModal.newName}
                onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all mb-6"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={closeRenameModal}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !renameModal.newName.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                   Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.subject && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4 border border-red-100">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Permanently?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                You are about to delete <span className="text-slate-900 font-bold">"{deleteModal.subject.name}"</span>.
                <br/>This action cannot be undone and will remove all associated files.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, subject: null })}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteSubject}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE Rename Modal */}
      {fileRenameModal.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-2">Rename File</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">Update the title for this resource.</p>
            
            <form onSubmit={confirmRenameFile}>
              <input 
                autoFocus
                type="text" 
                value={fileRenameModal.newName}
                onChange={(e) => setFileRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all mb-6"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setFileRenameModal({ isOpen: false, file: null, newName: '' })}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !fileRenameModal.newName.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                   Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE Delete Confirmation Modal */}
      {fileDeleteModal.isOpen && fileDeleteModal.file && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4 border border-red-100">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Resource?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                You are about to delete <span className="text-slate-900 font-bold">"{fileDeleteModal.file.file_name}"</span>.
                <br/>This will permanently remove the file from the database.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setFileDeleteModal({ isOpen: false, file: null })}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteFile}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT Delete Confirmation Modal */}
      {reportDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4 border border-red-100">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Report?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Are you sure you want to permanently delete this report?
                <br/>This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setReportDeleteModal({ isOpen: false, reportId: null })}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteReport}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showFixModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 p-8">
            <div className="flex justify-between items-start mb-6">
              <ShieldAlert className="w-10 h-10 text-red-500" />
              <button onClick={() => setShowFixModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Infrastructure Setup</h3>
            <p className="text-slate-500 mb-6 text-sm font-medium">Use this script in Supabase SQL Editor if you encounter database errors.</p>
            <div className="bg-slate-900 rounded-2xl p-5 mb-6 relative">
              <button onClick={() => {navigator.clipboard.writeText(FIX_SQL); setCopied(true); setTimeout(()=>setCopied(false), 2000);}} className="absolute top-4 right-4 text-indigo-400 hover:text-white transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              </button>
              <pre className="text-[10px] font-mono text-indigo-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">{FIX_SQL}</pre>
            </div>
            <button onClick={() => setShowFixModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg">Done</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><ChevronLeft /></button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Admin</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowFixModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all">
            <Database className="w-4 h-4" /> SQL Editor
          </button>
          <button onClick={fetchData} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : <RefreshCcw className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ANNOUNCEMENT CENTER */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-white/10 rounded-lg text-white">
                 <Megaphone className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-black text-white">Broadcast Center</h3>
             </div>
             <p className="text-indigo-200 text-sm font-medium mb-4 max-w-md">
               Post an announcement to the top of the student dashboard. Only one message can be active at a time.
             </p>
             {activeAnnouncement && (
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold uppercase tracking-widest border border-emerald-500/30 mb-4">
                 <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                 Active: "{activeAnnouncement.message}"
               </div>
             )}
          </div>
          
          <div className="flex-1 w-full">
            <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-3">
              <input 
                type="text" 
                value={announcementMsg} 
                onChange={(e) => setAnnouncementMsg(e.target.value)} 
                placeholder="Type your announcement here..." 
                className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-white/30 focus:bg-white/20 transition-all"
              />
              <div className="flex gap-3">
                 <button 
                  type="button" 
                  onClick={handleClearAnnouncement}
                  disabled={!activeAnnouncement || updatingAnnouncement}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                 >
                   Clear Active
                 </button>
                 <button 
                  type="submit" 
                  disabled={!announcementMsg.trim() || updatingAnnouncement}
                  className="flex-1 px-6 py-3 bg-white text-indigo-900 font-black rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {updatingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                   Broadcast
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-1.5 bg-slate-200/50 rounded-2xl w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('subjects')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Modules</button>
        <button onClick={() => setActiveTab('files')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'files' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Files</button>
        <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>History</button>
        <button onClick={() => setActiveTab('reports')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Reports</button>
        <button onClick={() => setActiveTab('upload')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Upload</button>
      </div>

      {activeTab === 'upload' ? (
        <div className="mt-8">
          <Uploader user={user} onBack={() => setActiveTab('subjects')} />
        </div>
      ) : (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl min-h-[500px]">
        {statusMsg && (
          <div className={`m-8 p-4 rounded-xl border flex items-center justify-between animate-in slide-in-from-top-4 ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            <div className="flex items-center gap-3 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {activeTab === 'subjects' ? (
          <div className="p-8 space-y-12">
            <div className="max-w-3xl bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><Plus className="w-6 h-6 text-indigo-600" />New Module</h3>
              <form onSubmit={handleAddSubject} className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  value={newSubjectName} 
                  onChange={(e) => setNewSubjectName(e.target.value)} 
                  placeholder="Module Name (e.g. Distributed Computing)" 
                  className="flex-[2] px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-indigo-400" 
                />
                <div className="flex-1 relative">
                  <select
                    value={newSubjectCategory}
                    onChange={(e) => setNewSubjectCategory(e.target.value as Category)}
                    className="w-full h-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-indigo-400 appearance-none text-slate-700"
                  >
                    <option value="Assignments">Assignments</option>
                    <option value="Notes">Notes</option>
                    <option value="Lab Resources">Lab Resources</option>
                  </select>
                  <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-900 disabled:opacity-50 transition-all">Add</button>
              </form>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => (
                <div key={sub.id} className="group relative p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between hover:bg-white hover:shadow-xl transition-all border-l-4 border-l-transparent hover:border-l-indigo-500">
                  <div className="flex flex-col gap-1 overflow-hidden mr-4">
                    <span className="font-bold text-slate-800 truncate">{sub.name}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg w-fit ${getCategoryColor(sub.category || 'Assignments')}`}>
                      {sub.category || 'Assignments'}
                    </span>
                  </div>
                  
                  {/* 3-Dot Menu */}
                  <div className="relative shrink-0">
                    <button 
                      onClick={(e) => toggleMenu(e, sub.id)}
                      className={`p-2 rounded-xl transition-all ${openMenuId === sub.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openMenuId === sub.id && (
                      <div 
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={(e) => openRenameModal(e, sub)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all text-left"
                        >
                          <Edit2 className="w-4 h-4" /> Rename
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSubject(e, sub)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-left"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {subjects.length === 0 && !loading && (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">No modules registered</div>
              )}
            </div>
          </div>
        ) : activeTab === 'files' ? (
          <div className="p-8">
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none shadow-inner" 
              />
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="pb-4 px-4">Document</th>
                    <th className="pb-4 px-4">Category</th>
                    <th className="pb-4 px-4">Uploaded By</th>
                    <th className="pb-4 px-4">Roll</th>
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
                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {file.file_name}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          file.category === 'Assignments' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {file.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-bold text-slate-700">{file.student_name}</div>
                        {file.user_email && (
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {file.user_email}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[10px] font-black text-slate-400 font-mono">{file.roll_no}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => window.open(file.file_url, '_blank')}
                            title="Preview"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleRenameFile(e, file)}
                            title="Rename"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteFile(e, file)}
                            title="Delete"
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {files.length === 0 && !loading && (
                <div className="py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs">No files available</div>
              )}
            </div>
          </div>
        ) : activeTab === 'reports' ? (
          <div className="p-8">
             <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4">Issue Description</th>
                    <th className="pb-4 px-4">Reported By</th>
                    <th className="pb-4 px-4">Date</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 max-w-md">
                        <p className="text-sm font-bold text-slate-700 line-clamp-2">{report.description}</p>
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-600">
                        {report.reported_by}
                      </td>
                      <td className="py-4 px-4 text-[10px] text-slate-400 font-medium">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => handleResolveReport(report.id, report.status)}
                            title={report.status === 'Open' ? "Mark Resolved" : "Mark Open"}
                            className={`p-2 rounded-xl transition-all ${
                              report.status === 'Open' 
                                ? 'text-emerald-500 hover:bg-emerald-50' 
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteReport(e, report.id)}
                            title="Delete Report"
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && !loading && (
                <div className="py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs">No reports found</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr><th className="pb-4 px-4">Event Activity</th><th className="pb-4 px-4 text-right">Timestamp</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {checkouts.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 text-sm font-bold text-slate-700">
                        {log.file_name} <span className="text-[10px] font-black text-slate-400 uppercase mx-2 tracking-widest">({log.user_role})</span>
                      </td>
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
      )}
    </div>
  );
};

export default AdminDashboard;
