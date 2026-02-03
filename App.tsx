
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FileViewer from './components/FileViewer';
import Uploader from './components/Uploader';
import { LogOut, GraduationCap, ShieldCheck, X } from 'lucide-react';

const ADMIN_ID = '78945612130';
const ADMIN_PASS = 'Kasi@2006';
const DEFAULT_USER: UserProfile = { id: 'guest', username: 'Student', role: 'User' };

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [currentView, setCurrentView] = useState<'home' | 'assignments' | 'notes' | 'lab-manual' | 'upload' | 'admin'>('home');
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  const handleLogin = (id: string, password?: string) => {
    // Check credentials for Admin
    if (id === ADMIN_ID && password === ADMIN_PASS) {
      const newUser: UserProfile = { id, username: 'Administrator', role: 'Admin' };
      // Update state and storage
      setUser(newUser);
      localStorage.setItem('academia_user', JSON.stringify(newUser));
      
      // Close modal and switch view immediately
      setIsLoginVisible(false);
      setCurrentView('admin');
    } else {
      alert("Invalid Admin Credentials. Please check your System ID and Password.");
    }
  };

  const handleLogout = () => {
    setUser(DEFAULT_USER);
    setCurrentView('home');
    localStorage.removeItem('academia_user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('academia_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // If the saved user is an admin, they might want to see the admin board by default if they were there
      // But for now, we land them on home unless they explicitly go to admin.
    }
  }, []);

  const renderContent = () => {
    // Double check role permissions for the 'admin' view
    if (currentView === 'admin') {
      return user.role === 'Admin' 
        ? <AdminDashboard onBack={() => setCurrentView('home')} /> 
        : <Dashboard role={user.role} onSelectView={setCurrentView} />;
    }

    switch (currentView) {
      case 'home':
        return <Dashboard role={user.role} onSelectView={setCurrentView} />;
      case 'assignments':
        return <FileViewer category="Assignments" onBack={() => setCurrentView('home')} />;
      case 'notes':
        return <FileViewer category="Notes" onBack={() => setCurrentView('home')} />;
      case 'lab-manual':
        return <FileViewer category="Lab Manual" onBack={() => setCurrentView('home')} />;
      case 'upload':
        return <Uploader onBack={() => setCurrentView('home')} />;
      default:
        return <Dashboard role={user.role} onSelectView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Admin Login Modal Overlay */}
      {isLoginVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsLoginVisible(false)}
              className="absolute -top-12 right-0 text-white hover:text-slate-200 p-2 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <Login onLogin={handleLogin} />
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => {
            if (user.role !== 'Admin') {
                setIsLoginVisible(true);
            } else {
                setCurrentView('home');
            }
          }}
          title={user.role === 'Admin' ? "Back to Home" : "Admin Access Gateway"}
        >
          <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-700 transition-colors">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">AcademiaHub</h1>
            <p className="text-xs text-slate-500 font-medium">Academic Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-sm font-semibold text-slate-700">{user.username}</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${user.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {user.role}
            </span>
          </div>
          
          {user.role === 'Admin' && (
            <>
              <button 
                onClick={() => setCurrentView('admin')}
                className={`p-2 rounded-full transition-colors ${currentView === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
        {renderContent()}
      </main>
      
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; 2024 AcademiaHub. All academic rights reserved.
      </footer>
    </div>
  );
};

export default App;
