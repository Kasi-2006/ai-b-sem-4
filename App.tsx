
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, ViewState } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FileViewer from './components/FileViewer';
import Uploader from './components/Uploader';
import ResearchAssistant from './components/ResearchAssistant';
import { LogOut, ShieldCheck, X, Sparkles, GraduationCap } from 'lucide-react';

const ADMIN_ID = '78945612130';
const ADMIN_PASS = 'Kasi@2006';
const DEFAULT_USER: UserProfile = { id: 'guest', username: 'Student', role: 'User' };

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  // Sync state with localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('academia_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('academia_user');
      }
    }
  }, []);

  const handleLogin = (id: string, password?: string) => {
    if (id === ADMIN_ID && password === ADMIN_PASS) {
      const adminUser: UserProfile = { id, username: 'System Admin', role: 'Admin' };
      setUser(adminUser);
      localStorage.setItem('academia_user', JSON.stringify(adminUser));
      setIsLoginVisible(false);
      setCurrentView('admin');
    } else {
      alert("Access Denied: Invalid Admin Credentials.");
    }
  };

  const handleLogout = () => {
    setUser(DEFAULT_USER);
    setCurrentView('home');
    localStorage.removeItem('academia_user');
  };

  const renderContent = () => {
    if (currentView === 'admin' && user.role === 'Admin') {
      return <AdminDashboard onBack={() => setCurrentView('home')} />;
    }

    switch (currentView) {
      case 'assignments':
        return <FileViewer category="Assignments" onBack={() => setCurrentView('home')} />;
      case 'notes':
        return <FileViewer category="Notes" onBack={() => setCurrentView('home')} />;
      case 'lab-resources':
        return <FileViewer category="Lab Resources" onBack={() => setCurrentView('home')} />;
      case 'upload':
        return <Uploader onBack={() => setCurrentView('home')} />;
      case 'research':
        return <ResearchAssistant onBack={() => setCurrentView('home')} />;
      case 'home':
      default:
        return <Dashboard role={user.role} onSelectView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Login Modal */}
      {isLoginVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setIsLoginVisible(false)}
              className="absolute -top-12 right-0 text-white hover:text-slate-200 transition-colors bg-white/10 p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <Login onLogin={handleLogin} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div 
          className="flex items-center gap-4 cursor-pointer group" 
          onClick={() => {
            if (user.role === 'Admin') {
              setCurrentView('home');
            } else {
              setIsLoginVisible(true);
            }
          }}
          title={user.role === 'Admin' ? "Go to Home" : "Admin Login"}
        >
          {/* Custom Logo Image Container */}
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 flex items-center justify-center p-1 border border-slate-100 group-hover:scale-110 group-hover:shadow-indigo-200/50 transition-all duration-300 overflow-hidden">
            <img 
              src="https://img.icons8.com/fluency/96/graduation-cap.png" 
              alt="AI B SEM 4 Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fail-safe: If image doesn't load, show a styled GraduationCap icon
                const target = e.currentTarget;
                const parent = target.parentElement;
                if (parent) {
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'text-indigo-600';
                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">AI B SEM 4</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {user.role === 'Admin' ? 'Management Active' : 'Control Center'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button 
            onClick={() => setCurrentView('research')}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black tracking-wide transition-all ${
              currentView === 'research' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Alex Assistant
          </button>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800">{user.username}</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${user.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {user.role}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {user.role === 'Admin' && (
              <>
                <button 
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Dashboard
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-20">
        {renderContent()}
      </main>
      
      <footer className="py-10 border-t border-slate-100 bg-white/50 text-center">
        <p className="text-slate-400 text-sm font-medium">AI B SEM 4 Management System &copy; 2024</p>
      </footer>
    </div>
  );
};

export default App;