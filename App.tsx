
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, ViewState } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FileViewer from './components/FileViewer';
import Uploader from './components/Uploader';
import { LogOut, ShieldCheck, X, GraduationCap, Lock, User } from 'lucide-react';

const ADMIN_ID = '78945612130';
const ADMIN_PASS = 'Kasi@2006';

const App: React.FC = () => {
  // Default to Guest user if no session exists - DIRECT ACCESS
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('academia_user');
    return saved ? JSON.parse(saved) : { id: 'guest', username: 'Student', role: 'User' };
  });

  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Sync state with localStorage
  useEffect(() => {
    if (user.id !== 'guest') {
      localStorage.setItem('academia_user', JSON.stringify(user));
    }
  }, [user]);

  const handleAdminLogin = (id: string, password?: string) => {
    if (id === ADMIN_ID && password === ADMIN_PASS) {
      const adminUser: UserProfile = { id, username: 'System Admin', role: 'Admin' };
      setUser(adminUser);
      setShowAdminLogin(false);
      setCurrentView('admin');
    } else {
      alert("Access Denied: Invalid Admin Credentials.");
    }
  };

  const handleLogout = () => {
    // Reset to Guest Student instead of null
    const guestUser: UserProfile = { id: 'guest', username: 'Student', role: 'User' };
    setUser(guestUser);
    setCurrentView('home');
    localStorage.removeItem('academia_user');
  };

  // Authenticated View
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
        // Pass user, but Uploader will allow overriding details since we are Guest
        return <Uploader user={user} onBack={() => setCurrentView('home')} />;
      case 'home':
      default:
        return <Dashboard role={user.role} onSelectView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowAdminLogin(false)} 
              className="absolute -top-12 right-0 text-white/80 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors"
            >
              Close <X className="w-5 h-5" />
            </button>
            <Login onLogin={handleAdminLogin} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div 
          className="flex items-center gap-4 cursor-pointer group" 
          onClick={() => setCurrentView('home')}
          title="Go to Home"
        >
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 flex items-center justify-center p-1 border border-slate-100 group-hover:scale-110 group-hover:shadow-indigo-200/50 transition-all duration-300 overflow-hidden">
            <img 
              src="https://img.icons8.com/fluency/96/graduation-cap.png" 
              alt="AI B SEM 4 Logo" 
              className="w-10 h-10 object-contain"
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

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800">{user.username}</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${user.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {user.role}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {user.role === 'Admin' ? (
              <>
                <button 
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Console
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all"
                title="Admin Access"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
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
