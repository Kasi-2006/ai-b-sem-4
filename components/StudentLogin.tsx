
import React, { useState } from 'react';
import { GraduationCap, ArrowRight, User, Mail, Hash } from 'lucide-react';
import { UserProfile } from '../types';

interface StudentLoginProps {
  onJoin: (profile: UserProfile) => void;
  onAdminRequest: () => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onJoin, onAdminRequest }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !rollNo.trim()) {
      setError('Please complete your student profile.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid university email.');
      return;
    }

    const studentProfile: UserProfile = {
      id: `student-${Date.now()}`,
      username: name.trim(),
      email: email.trim(),
      rollNo: rollNo.trim(),
      role: 'User'
    };
    
    onJoin(studentProfile);
  };

  return (
    <div className="w-full">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <GraduationCap className="w-40 h-40" />
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-3 shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Access</h2>
          <p className="mt-1 text-slate-500 text-sm font-medium">Identify yourself to access the academic library</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
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

          <div className="grid grid-cols-2 gap-4">
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
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 placeholder:font-normal"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 text-center animate-in fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            Enter Portal
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button 
            onClick={onAdminRequest}
            className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
          >
            Are you an Administrator?
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
