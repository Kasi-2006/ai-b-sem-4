
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, AcademicFile, Category, UserProfile, Report, Announcement, CheckoutLog } from '../types';
import Uploader from './Uploader';
import { 
  ChevronLeft, Plus, Trash2, Loader2, RefreshCcw, Search, ShieldAlert, CheckCircle2,
  Copy, Check, X, Database, Edit2, Eye, MoreVertical, Layers, FileText, Mail, Flag, Megaphone, Clock, AlertTriangle, Eraser
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserProfile;
  onBack: () => void;
}

type ModalType = 'none' | 'rename-subject' | 'rename-file' | 'delete-confirm-subject' | 'delete-confirm-file';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutLog[]>([]);
  const [activeTab, setActiveTab] = useState<'subjects' | 'files' | 'logs' | 'upload' | 'reports'>('subjects');
  const [loading, setLoading] = useState(true);
  
  // Menu & Modal States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [showFixModal, setShowFixModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState<Category>('Assignments');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, fileRes, reportRes, announceRes, checkRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('files').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('reports').select('*').order('timestamp', { ascending: false }),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('checkouts').select('*').order('timestamp', { ascending: false }).limit(100)
      ]);
      
      setSubjects(subRes.data || []);
      setFiles(fileRes.data || []);
      setReports(reportRes.data || []);
      setActiveAnnouncement(announceRes.data || null);
      setCheckouts(checkRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    
    // Deactivate others
    await supabase.from('announcements').update({ is_active: false }).eq('is_active', true);
    
    // Post new one
    const { error } = await supabase.from('announcements').insert({ 
      message: announcementMsg.trim(), 
      is_active: true,
      type: 'info'
    });

    if (!error) {
      setAnnouncementMsg('');
      fetchData();
    }
  };

  const handleClearAnnouncement = async () => {
    if (!activeAnnouncement) return;
    const { error } = await supabase.from('announcements').update({ is_active: false }).eq('id', activeAnnouncement.id);
    if (!error) fetchData();
  };

  const handleRename = async () => {
    if (!renameValue.trim() || !selectedItem) return;
    setIsProcessing(true);
    const table = modalType === 'rename-subject' ? 'subjects' : 'files';
    const column = modalType === 'rename-subject' ? 'name' : 'file_name';
    
    const { error } = await supabase.from(table).update({ [column]: renameValue.trim() }).eq('id', selectedItem.id);
    
    if (!error) {
      setModalType('none');
      fetchData();
    } else {
      alert(error.message);
    }
    setIsProcessing(false);
  };

  const handleDeletePermanent = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    const table = modalType === 'delete-confirm-subject' ? 'subjects' : 'files';
    
    const { error } = await supabase.from(table).delete().eq('id', selectedItem.id);
    
    if (!error) {
      setModalType('none');
      fetchData();
    } else {
      alert(error.message);
    }
    setIsProcessing(false);
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Assignments': return 'bg-blue-100 text-blue-700';
      case 'Notes': return 'bg-emerald-100 text-emerald-700';
      case 'Lab Resources': return 'bg-purple-100 text-purple-700';
      case 'Previous Year Question Papers': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const ActionMenu = ({ item, type }: { item: any, type: 'subject' | 'file' }) => (
    <div className="relative" ref={activeMenuId === item.id ? menuRef : null}>
      <button 
        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
        className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {activeMenuId === item.id && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in zoom-in-95 duration-100">
          {type === 'file' && (
            <button 
              onClick={() => {
                window.open(item.file_url, '_blank');
                setActiveMenuId(null);
              }}
              className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
            >
              <Eye className="w-4 h-4 text-indigo-500" /> View
            </button>
          )}
          <button 
            onClick={() => {
              setSelectedItem(item);
              setRenameValue(type === 'subject' ? item.name : item.file_name);
              setModalType(type === 'subject' ? 'rename-subject' : 'rename-file');
              setActiveMenuId(null);
            }}
            className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <Edit2 className="w-4 h-4 text-amber-500" /> Rename
          </button>
          <div className="h-px bg-slate-100 my-1"></div>
          <button 
            onClick={() => {
              setSelectedItem(item);
              setModalType(type === 'subject' ? 'delete-confirm-subject' : 'delete-confirm-file');
              setActiveMenuId(null);
            }}
            className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Dynamic Action Modals */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border p-8 animate-in zoom-in-95">
            {modalType.startsWith('rename') ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                    <Edit2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Rename Item</h3>
                </div>
                <p className="text-slate-500 mb-6 font-medium text-sm">Enter the new name for this academic resource.</p>
                <input 
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold mb-8 outline-none focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="New name..."
                />
                <div className="flex gap-4">
                  <button onClick={() => setModalType('none')} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                  <button 
                    disabled={isProcessing || !renameValue.trim()}
                    onClick={handleRename}
                    className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Rename'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Delete Permanently?</h3>
                </div>
                <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                  Are you sure you want to delete <span className="font-black text-slate-900">"{selectedItem?.name || selectedItem?.file_name}"</span>? 
                  This action cannot be undone and will remove all associated data.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setModalType('none')} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                  <button 
                    disabled={isProcessing}
                    onClick={handleDeletePermanent}
                    className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"><ChevronLeft /></button>
          <h2 className="text-3xl font-black text-slate-900">System Admin</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowFixModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100">
            <Database className="w-4 h-4" /> Fix SQL
          </button>
          <button onClick={() => fetchData()} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
            {loading ? <Loader2 className="animate-spin text-indigo-600" /> : <RefreshCcw />}
          </button>
        </div>
      </div>

      {/* Broadcast Center */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="text-indigo-400" />
            <h3 className="text-xl font-bold">Broadcast Center</h3>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Notifications</p>
        </div>

        <form onSubmit={handlePostAnnouncement} className="flex gap-4">
          <input 
            value={announcementMsg} 
            onChange={e => setAnnouncementMsg(e.target.value)} 
            placeholder="Post an update for all students..." 
            className="flex-1 bg-white/10 p-4 rounded-xl border border-white/10 outline-none focus:bg-white/20 transition-all placeholder:text-slate-500" 
          />
          <button className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
            Post
          </button>
        </form>

        {activeAnnouncement && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Currently Active
              </span>
              <button 
                onClick={handleClearAnnouncement}
                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear Broadcast
              </button>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed italic">
              "{activeAnnouncement.message}"
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-4">
              Published: {new Date(activeAnnouncement.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto p-1 bg-slate-100 rounded-2xl w-fit">
        {['subjects', 'files', 'reports', 'logs', 'upload'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)} 
            className={`px-6 py-3 rounded-xl font-bold capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'logs' ? 'History' : tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-xl p-8 min-h-[450px]">
        {activeTab === 'upload' ? (
          <Uploader user={user} onBack={() => setActiveTab('subjects')} />
        ) : activeTab === 'subjects' ? (
          <div className="space-y-8">
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newSubjectName.trim()) return;
              await supabase.from('subjects').insert({ name: newSubjectName, category: newSubjectCategory });
              setNewSubjectName(''); fetchData();
            }} className="flex gap-4 bg-white p-6 rounded-2xl border shadow-sm">
              <input 
                value={newSubjectName} 
                onChange={e => setNewSubjectName(e.target.value)} 
                placeholder="Subject Name (e.g. Data Structures)" 
                className="flex-1 p-4 rounded-xl border focus:outline-none focus:border-indigo-500 font-bold shadow-sm bg-white text-slate-900" 
              />
              <select 
                value={newSubjectCategory} 
                onChange={e => setNewSubjectCategory(e.target.value as Category)} 
                className="p-4 rounded-xl border font-bold bg-white text-slate-900"
              >
                <option value="Assignments">Assignments</option>
                <option value="Notes">Notes</option>
                <option value="Lab Resources">Lab Resources</option>
                <option value="Previous Year Question Papers">Previous Papers</option>
              </select>
              <button className="bg-indigo-600 text-white px-8 rounded-xl font-bold hover:bg-slate-900 transition-colors">Add Subject</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjects.map(sub => (
                <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-center hover:bg-white hover:shadow-md transition-all">
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 truncate">{sub.name}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${getCategoryColor(sub.category)}`}>{sub.category}</span>
                  </div>
                  <ActionMenu item={sub} type="subject" />
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'files' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b text-xs text-slate-400 font-black tracking-widest"><th>FILE</th><th>CATEGORY</th><th>STUDENT</th><th className="text-right">ACTIONS</th></tr></thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-bold text-sm text-slate-700">{f.file_name}</td>
                    <td className="py-4"><span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${getCategoryColor(f.category)}`}>{f.category}</span></td>
                    <td className="py-4 text-xs font-bold text-slate-400 uppercase">{f.student_name}</td>
                    <td className="py-4 text-right">
                      <ActionMenu item={f} type="file" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'logs' ? (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Checkout History</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last 100 activities</span>
            </div>
            <table className="w-full text-left">
              <thead><tr className="border-b text-xs text-slate-400 font-black tracking-widest"><th className="pb-4">RESOURCE</th><th className="pb-4">ACTION BY</th><th className="pb-4">TIMESTAMP</th><th className="pb-4 text-right">ACTIONS</th></tr></thead>
              <tbody>
                {checkouts.map(log => (
                  <tr key={log.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-4"><div className="flex flex-col"><span className="font-bold text-slate-700 text-sm">{log.file_name}</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.category}</span></div></td>
                    <td className="py-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-600 uppercase">{log.user_role}</span></td>
                    <td className="py-4 text-xs font-medium text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-4 text-right"><button onClick={async () => { await supabase.from('checkouts').delete().eq('id', log.id); fetchData(); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b text-xs text-slate-400 font-black tracking-widest"><th>STATUS</th><th>ISSUE</th><th>REPORTED BY</th><th className="text-right">ACTIONS</th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-4"><span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td>
                    <td className="py-4 font-medium text-slate-700">{r.description}</td>
                    <td className="py-4 text-xs font-bold text-slate-400 uppercase">{r.reported_by}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={async () => { await supabase.from('reports').update({ status: r.status === 'Open' ? 'Resolved' : 'Open' }).eq('id', r.id); fetchData(); }} className={`p-2 rounded-lg ${r.status === 'Open' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300'}`}><CheckCircle2 className="w-4 h-4" /></button>
                        <button onClick={async () => { await supabase.from('reports').delete().eq('id', r.id); fetchData(); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
