
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, AcademicFile } from '../types';
import { ChevronLeft, Plus, Trash2, FileText, LayoutGrid, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'subjects' | 'files'>('subjects');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const [subRes, fileRes] = await Promise.all([
          supabase.from('subjects').select('*').order('name'),
          supabase.from('files').select('*').order('uploaded_at', { ascending: false })
        ]);
        
        if (subRes.error) throw subRes.error;
        if (fileRes.error) throw fileRes.error;

        setSubjects(subRes.data || []);
        setFiles(fileRes.data || []);
    } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError(err.message || 'Failed to load data from database.');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    setActionLoading(true);
    try {
        const { error } = await supabase
          .from('subjects')
          .insert({ name: newSubjectName.trim() });
        
        if (error) throw error;
        
        setNewSubjectName('');
        await fetchData();
    } catch (err: any) {
        alert(err.message || 'Error adding subject');
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure? Deleting a subject will permanently remove all associated files.')) return;

    setActionLoading(true);
    try {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchData();
    } catch (err: any) {
        alert(err.message || 'Error deleting subject');
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Delete this file permanently?')) return;

    setActionLoading(true);
    try {
        const { error } = await supabase
          .from('files')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchData();
    } catch (err: any) {
        alert(err.message || 'Error deleting file');
    } finally {
        setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Admin Control Panel</h2>
            <p className="text-slate-500 text-sm">Manage academic structure and content</p>
          </div>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
          title="Refresh Data"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 p-1.5 bg-slate-200 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          Subjects
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'files' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <FileText className="w-4 h-4" />
          All Files
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="text-slate-400 font-medium">Synchronizing with database...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-20 text-center">
            <div className="bg-red-50 p-4 rounded-full text-red-500 mb-2">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Connection Error</h3>
            <p className="text-slate-500 max-w-md">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : activeTab === 'subjects' ? (
          <div className="p-8">
            <div className="mb-10">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Subject</h3>
              <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Advanced Calculus"
                  disabled={actionLoading}
                  className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !newSubjectName.trim()}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Add Subject
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Existing Subjects ({subjects.length})</h3>
              {subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-red-200 transition-all">
                      <span className="font-bold text-slate-700">{subject.name}</span>
                      <button
                        onClick={() => handleDeleteSubject(subject.id)}
                        disabled={actionLoading}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">No subjects found. Add one above to get started.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Uploaded Content ({files.length})</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-xs font-bold uppercase">
                <AlertTriangle className="w-3.5 h-3.5" />
                Moderation Mode
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-4 px-2 text-nowrap">File Name</th>
                    <th className="pb-4 px-2 text-nowrap">Subject</th>
                    <th className="pb-4 px-2 text-nowrap">Category</th>
                    <th className="pb-4 px-2 text-nowrap">Date</th>
                    <th className="pb-4 px-2 text-right text-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map((file) => (
                    <tr key={file.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2 text-sm font-semibold text-slate-700 truncate max-w-[200px]" title={file.file_name}>
                        {file.file_name}
                      </td>
                      <td className="py-4 px-2 text-xs text-slate-500">
                        {subjects.find(s => s.id === file.subject_id)?.name || 'Unknown Subject'}
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {file.category}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-xs text-slate-400">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={actionLoading}
                          className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {files.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 italic">No files have been uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
