
import React from 'react';
import { BookOpen, FileText, FlaskConical, UploadCloud, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';

interface DashboardProps {
  role: UserRole;
  onSelectView: (view: 'home' | 'assignments' | 'notes' | 'lab-manual' | 'upload' | 'admin') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectView }) => {
  const options = [
    {
      id: 'assignments',
      title: 'Assignments',
      description: 'View and download course assignments',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Access lecture notes and summaries',
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700'
    },
    {
      id: 'lab-manual',
      title: 'Lab Manual',
      description: 'Instructional guides for laboratory work',
      icon: <FlaskConical className="w-8 h-8" />,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      id: 'upload',
      title: 'Upload',
      description: 'Contribute academic resources',
      icon: <UploadCloud className="w-8 h-8" />,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700'
    }
  ];

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Home Dashboard</h2>
          <p className="text-slate-500 mt-1">Select a category to manage your academic resources</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelectView(option.id as any)}
            className={`group text-left p-8 rounded-3xl border-2 ${option.borderColor} ${option.lightColor} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
          >
            <div className={`inline-flex p-4 rounded-2xl ${option.color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {option.icon}
            </div>
            <h3 className={`text-2xl font-bold ${option.textColor} mb-2`}>{option.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{option.description}</p>
            <div className={`flex items-center gap-1 text-sm font-bold ${option.textColor}`}>
              Open Category
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-12">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Active Subjects</p>
            <p className="text-2xl font-black text-slate-800">12</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Files</p>
            <p className="text-2xl font-black text-slate-800">128</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Your Uploads</p>
            <p className="text-2xl font-black text-slate-800">4</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Recent Updates</p>
            <p className="text-2xl font-black text-slate-800">24h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
