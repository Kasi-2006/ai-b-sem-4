
import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, FlaskConical, ChevronRight, Loader2, RefreshCw, Wifi, AlertTriangle, Database, Terminal, Copy, Check, PartyPopper, Flag, X, Send, History } from 'lucide-react';
import { UserProfile, ViewState } from '../types';
import { supabase, checkSupabaseConnection } from '../services/supabaseClient';
import { APP_LOGO, APP_NAME } from '../constants';

interface DashboardProps {
  user: UserProfile;
  onSelectView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSelectView }) => {
  const [stats, setStats] = useState({ subjects: 0, files: 0, checkouts: 0, loading: true });
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline' | 'needs-setup'>('checking');
  const [connError, setConnError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Report Problem State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setConnError(null);
    try {
      const conn = await checkSupabaseConnection();
      if (!conn.connected) {
        setConnectionStatus('offline');
        setConnError(conn.error || 'Unknown connection error');
        return;
      }
      if (conn.needsSetup) {
        setConnectionStatus('needs-setup');
        return;
      }
      setConnectionStatus('online');
      
      const fetchCount = async (table: string) => {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        return error ? 0 : count || 0;
      };
      
      const [subCount, fileCount, checkCount] = await Promise.all([
        fetchCount('subjects'),
        fetchCount('files'),
        fetchCount('checkouts')
      ]);
      setStats({ subjects: subCount, files: fileCount, checkouts: checkCount, loading: false });
    } catch (error: any) {
      setConnectionStatus('offline');
    } finally {
      setIsRefreshing(false);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim() || isReporting) return;

    setIsReporting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        description: reportText.trim(),
        reported_by: user.username || 'Guest Student',
        user_id: user.id,
        status: 'Open'
      });

      if (error) throw error;

      setReportSuccess(true);
      setReportText('');
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
      }, 2000);
    } catch (err: any) {
      alert("Error reporting issue: " + err.message);
    } finally {
      setIsReporting(false);
    }
  };

  const options = [
    { id: 'assignments', title: 'Assignments', description: 'Course work & tasks', icon: <BookOpen />, color: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { id: 'notes', title: 'Notes', description: 'Lecture summaries', icon: <FileText />, color: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    { id: 'lab-resources', title: 'Lab Resources', description: 'Lab guides & data', icon: <FlaskConical />, color: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { id: 'prev-year-qs', title: 'Previous Papers', description: 'PYQ for Mid & Sem', icon: <History />, color: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  ];

  if (connectionStatus === 'checking') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Verifying Infrastructure...</p>
    </div>
  );

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500 relative">
      {/* Report Problem Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 relative">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Flag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Report a Problem</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Found a bug or missing content? Let us know.</p>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center animate-in zoom-in">
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800">Report Submitted!</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <textarea
                  autoFocus
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe the issue (e.g., 'Unit 2 notes link is broken')..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-800 resize-none mb-4"
                />
                <button
                  type="submit"
                  disabled={isReporting || !reportText.trim()}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center p-2 border border-slate-100 shrink-0">
             <img src={APP_LOGO} alt="Branding" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{APP_NAME}</h2>
            <p className="text-slate-500 mt-1 font-medium">Academic Content Management & Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl shadow-sm">
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Active Connection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelectView(option.id as any)}
            className={`group text-left p-8 rounded-[2rem] border-2 ${option.border} ${option.light} hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden`}
          >
            <div className={`inline-flex p-4 rounded-2xl ${option.color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {React.cloneElement(option.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
            </div>
            <h3 className={`text-2xl font-black ${option.text} mb-2 tracking-tight`}>{option.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">{option.description}</p>
            <div className={`flex items-center gap-1 text-sm font-black uppercase tracking-wider ${option.text}`}>
               Access Library <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button 
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100 transition-all shadow-sm"
        >
          <Flag className="w-4 h-4" /> Report a Problem
        </button>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl mt-8 relative overflow-hidden">
        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500" /> System Analytics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
          <StatBox label="Modules" value={stats.subjects} loading={stats.loading} />
          <StatBox label="Files" value={stats.files} loading={stats.loading} />
          <StatBox label="Checkouts" value={stats.checkouts} loading={stats.loading} highlight />
          <StatBox label="Role" value={user.role} loading={false} isRole />
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, loading, highlight = false, isRole = false }: any) => (
  <div className="space-y-1">
    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
    <div className={`${isRole ? 'text-xl' : 'text-4xl'} font-black tracking-tighter ${highlight ? 'text-indigo-600' : 'text-slate-900'} flex items-center gap-2`}>
      {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-200" /> : value}
    </div>
  </div>
);

export default Dashboard;
