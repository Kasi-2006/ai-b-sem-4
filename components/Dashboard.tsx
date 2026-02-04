
import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, FlaskConical, UploadCloud, ChevronRight, Loader2, RefreshCw, Wifi, WifiOff, AlertTriangle, Database, Terminal, Copy, Check, PartyPopper, Sparkles } from 'lucide-react';
import { UserRole, ViewState } from '../types';
import { supabase, checkSupabaseConnection } from '../services/supabaseClient';

interface DashboardProps {
  role: UserRole;
  onSelectView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ role, onSelectView }) => {
  const [stats, setStats] = useState({ subjects: 0, files: 0, checkouts: 0, loading: true });
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline' | 'needs-setup'>('checking');
  const [connError, setConnError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const SQL_SCHEMA = `-- 1. CREATE TABLES
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Assignments', 'Notes', 'Lab Resources')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  student_name TEXT,
  roll_no TEXT,
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

-- 2. DISABLE PERMISSION CHECKS (RLS) FOR DEVELOPMENT
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts DISABLE ROW LEVEL SECURITY;

-- 3. INITIALIZE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic-files', 'academic-files', true)
ON CONFLICT (id) DO NOTHING;

-- 4. ENABLE STORAGE POLICIES (Safe Re-creation)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'academic-files' ) WITH CHECK ( bucket_id = 'academic-files' );`;

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

      // Successful connection
      if (connectionStatus === 'needs-setup' || isManualRefresh) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }

      setConnectionStatus('online');
      
      const fetchCount = async (table: string) => {
        try {
          const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          if (error) return 0;
          return count || 0;
        } catch { return 0; }
      };

      const [subCount, fileCount, checkCount] = await Promise.all([
        fetchCount('subjects'),
        fetchCount('files'),
        fetchCount('checkouts')
      ]);

      setStats({
        subjects: subCount,
        files: fileCount,
        checkouts: checkCount,
        loading: false
      });
    } catch (error: any) {
      setConnectionStatus('offline');
      setConnError(error.message || 'Failed to sync with Supabase');
    } finally {
      setIsRefreshing(false);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleManualBypass = () => {
    localStorage.setItem('supabase_setup_confirmed', 'true');
    setConnectionStatus('online');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
    fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const options = [
    { id: 'assignments', title: 'Assignments', description: 'Course work & tasks', icon: <BookOpen />, color: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { id: 'notes', title: 'Notes', description: 'Lecture summaries', icon: <FileText />, color: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    { id: 'lab-resources', title: 'Lab Resources', description: 'Lab guides & data', icon: <FlaskConical />, color: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { id: 'upload', title: 'Upload Content', description: 'Contribute resources', icon: <UploadCloud />, color: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    { id: 'research', title: 'Alex your Assistant', description: 'Personal Academic AI', icon: <Sparkles />, color: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' }
  ];

  if (connectionStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Verifying Infrastructure...</p>
      </div>
    );
  }

  if (connectionStatus === 'offline') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-red-50 p-8 rounded-full mb-8 border border-red-100 shadow-xl shadow-red-50">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Database Connection Failed</h2>
        <p className="text-slate-500 max-w-md mb-8 font-medium">{connError}</p>
        <button 
          onClick={() => fetchStats(true)} 
          disabled={isRefreshing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isRefreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />} 
          Retry Connection
        </button>
      </div>
    );
  }

  if (connectionStatus === 'needs-setup') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Database className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <Terminal className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Infrastructure Setup Required</h2>
              <p className="text-slate-500 font-medium">Follow these steps to initialize the database and storage.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 relative group border border-slate-700 shadow-inner">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Master Setup SQL</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(SQL_SCHEMA);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy Full Script'}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto h-48 custom-scrollbar leading-relaxed">
                {SQL_SCHEMA}
              </pre>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
              <ol className="text-sm text-amber-800 space-y-2 list-decimal ml-4 font-medium">
                <li>Copy the SQL script above.</li>
                <li>In your <strong>Supabase Dashboard</strong>, click on <strong>SQL Editor</strong>.</li>
                <li>Create a <strong>New Query</strong>, paste the script, and click <strong>Run</strong>.</li>
              </ol>
            </div>

            <button 
              onClick={handleManualBypass}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100"
            >
              <Check className="w-5 h-5" />
              I have executed the code
            </button>
            <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Clicking this will unlock the dashboard immediately.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500 relative">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-12 duration-500">
          <PartyPopper className="w-6 h-6" />
          <div>
            <p className="font-black text-sm">System Ready!</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Sync Successful</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center p-2 border border-slate-100 shrink-0">
             <img src="https://img.icons8.com/fluency/96/graduation-cap.png" alt="Branding" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI B SEM 4</h2>
            <p className="text-slate-500 mt-1 font-medium">Academic Content Management & Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl">
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Active Connection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {option.id === 'research' ? 'Chat with Alex' : option.id === 'upload' ? 'Upload PDF' : 'Access Library'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl mt-12 relative overflow-hidden">
        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500" /> System Analytics
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
          <StatBox label="Modules" value={stats.subjects} loading={stats.loading} />
          <StatBox label="Files" value={stats.files} loading={stats.loading} />
          <StatBox label="Checkouts" value={stats.checkouts} loading={stats.loading} highlight />
          <StatBox label="Role" value={role} loading={false} isRole />
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
