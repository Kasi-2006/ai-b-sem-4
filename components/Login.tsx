
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (id: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      setError('Both System ID and Password are required');
      return;
    }
    onLogin(id, password);
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
            <label htmlFor="id" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Admin System ID
            </label>
            <input
              id="id"
              type="text"
              autoFocus
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter 11-digit ID"
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Secret Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            Unlock Admin Board
            <ArrowRight className="w-5 h-5" />
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
