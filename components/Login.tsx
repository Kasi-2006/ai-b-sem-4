
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, UserCog, Lock, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (id: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId || !password) {
      setError('Both Admin ID and Password are required');
      return;
    }
    
    setLoading(true);
    setError('');

    // Simulate network delay for effect
    setTimeout(() => {
      // Hardcoded Admin Credentials
      if (adminId === '78945612130' && password === 'Kasi@2006') {
        onLogin(adminId, password);
      } else {
        setError('Invalid Admin ID or Password');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="w-full">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl text-amber-600 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Gatekeeper</h2>
          <p className="mt-1 text-slate-500 text-sm font-medium">Enter secure credentials to manage portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Admin ID
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="789456..."
                className="w-full pl-10 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 font-mono font-bold"
              />
              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100 text-center animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Unlock Admin Board <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 leading-relaxed italic uppercase tracking-widest font-bold">
            Secure Administrator Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
