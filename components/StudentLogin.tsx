
import React, { useState } from 'react';
import { GraduationCap, ArrowRight, User, Mail, Hash, Lock, Loader2, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';

interface StudentLoginProps {
  onJoin: (profile: UserProfile) => void;
  onAdminRequest: () => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onJoin, onAdminRequest }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Email and Password are required.');
      return;
    }

    if (isSignUp) {
      if (!name.trim() || !rollNo.trim()) {
        setError('Please enter your Name and Roll Number for registration.');
        return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Register new student with metadata
        const { data, error: upError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: name.trim(),
              roll_no: rollNo.trim(),
              role: 'User' // Default role
            }
          }
        });

        if (upError) throw upError;

        // CRITICAL FIX: If Supabase returns a user but NO session, it usually means 
        // "Confirm Email" is enabled in Supabase dashboard. 
        // Or if disabled, sometimes it doesn't auto-log immediately in some client configs.
        // We try to sign in immediately to check if we can bypass.
        if (data.user && !data.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
             email,
             password
          });
          
          if (signInData.session) {
            // Success - App.tsx auth listener will handle the redirect
            return; 
          } else {
             // Still no session? It means email confirmation is strictly enforced or credentials issue.
             setLoading(false);
             setError('Account created! Please Sign In.');
             setIsSignUp(false);
             return;
          }
        }
      } else {
        // Sign In existing student
        const { error: inError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (inError) throw inError;
      }
      // App.tsx auth listener handles the redirection for successful sessions
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <GraduationCap className="w-40 h-40" />
        </div>

        <div className="text-center mb-6 relative z-10">
          <button 
            onClick={onAdminRequest}
            className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-3 shadow-sm hover:scale-110 hover:bg-indigo-200 transition-all cursor-pointer"
            title="Access Management System"
          >
            <GraduationCap className="w-8 h-8" />
          </button>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isSignUp ? 'Student Registration' : 'Student Login'}
          </h2>
          <p className="mt-1 text-slate-500 text-sm font-medium">Access your academic library resources</p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 relative z-10">
          <button 
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            New Student
          </button>
          <button 
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Returning
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 placeholder:font-normal"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Roll No</label>
                <div className="relative">
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="21BCE..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 placeholder:font-normal"
                  />
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </>
          )}

           <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 placeholder:font-normal"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 placeholder:font-normal"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 text-center animate-in fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                {isSignUp ? <ArrowRight className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
