
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, Category, UserProfile } from '../types';
import { ChevronLeft, Upload, CheckCircle2, AlertCircle, Loader2, FileType, AlertTriangle, User, Hash, History, Layers, Type as TypeIcon } from 'lucide-react';

interface UploaderProps {
  user: UserProfile;
  onBack: () => void;
}

const UNITS = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];
const EXAM_TYPES = ['Mid', 'Sem']; 

const Uploader: React.FC<UploaderProps> = ({ user, onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [tagValue, setTagValue] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentName, setStudentName] = useState(user.id !== 'guest' ? user.username : '');
  const [rollNo, setRollNo] = useState(user.rollNo || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!selectedCategory) return;
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('*').eq('category', selectedCategory).order('name');
      setSubjects(data || []);
    };
    fetchSubjects();
  }, [selectedCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile && !displayName) {
      // Auto-fill display name with clean file name (remove extension and replace underscores/dashes)
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setDisplayName(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Logic for required tag
    const isPYQ = selectedCategory === 'Previous Year Question Papers';
    const isUnitRequired = selectedCategory === 'Assignments' || selectedCategory === 'Notes';
    const tagRequired = isPYQ || isUnitRequired;

    if (!selectedSubjectId || !selectedCategory || !file || !studentName || !rollNo || !displayName.trim() || (tagRequired && !tagValue)) {
      setMessage({ type: 'error', text: 'Please complete all required fields (Subject, Category, Name, Roll No, Display Name, and Tag)' });
      return;
    }

    setUploading(true);
    try {
      const filePath = `${selectedCategory}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { error: storageError } = await supabase.storage.from('academic-files').upload(filePath, file);
      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('academic-files').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from('files').insert({
        subject_id: selectedSubjectId,
        category: selectedCategory,
        file_name: displayName.trim(),
        file_url: publicUrl,
        student_name: studentName,
        roll_no: rollNo,
        unit_no: tagValue || null, 
        uploaded_at: new Date().toISOString()
      });
      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Resource uploaded successfully!' });
      setFile(null); setSelectedSubjectId(''); setTagValue(''); setDisplayName('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error uploading file' });
    } finally { setUploading(false); }
  };

  const isPYQ = selectedCategory === 'Previous Year Question Papers';
  const tagLabel = isPYQ ? 'Exam Type' : 'Unit Number';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-slate-200 shadow-sm">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Upload Content</h2>
          <p className="text-slate-500 text-sm">Contribute to the Academic Repository</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden">
        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="font-bold text-slate-700 animate-pulse">Processing your upload...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Full Name" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Roll Number</label>
              <input type="text" value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="University Roll No" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Category</label>
              <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value as Category); setTagValue(''); }} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none">
                <option value="">-- Choose Category --</option>
                <option value="Assignments">Assignments</option>
                <option value="Notes">Notes</option>
                <option value="Lab Resources">Lab Resources</option>
                <option value="Previous Year Question Papers">Previous Papers</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Subject</label>
              <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none">
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2 animate-in slide-in-from-top-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Display Name (Visible to Students)</label>
            <div className="relative">
              <input 
                type="text" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                placeholder="e.g. Unit 1 Cloud Computing Notes" 
                className="w-full pl-12 pr-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-900 focus:ring-4 focus:ring-indigo-500/10 outline-none" 
              />
              <TypeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
            </div>
          </div>

          {selectedCategory && selectedCategory !== 'Lab Resources' && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">{tagLabel}</label>
              <select value={tagValue} onChange={e => setTagValue(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                <option value="">-- Choose {tagLabel} --</option>
                {(isPYQ ? EXAM_TYPES : UNITS).map(t => <option key={t} value={t}>{t} {isPYQ ? 'Exam' : ''}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">PDF Document</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full p-6 border-2 border-dashed rounded-3xl bg-slate-50 text-slate-400 cursor-pointer hover:border-indigo-300 transition-colors" />
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
              <span className="text-sm font-bold">{message.text}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={uploading} 
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Upload to Academic Library
          </button>
        </form>
      </div>
    </div>
  );
};

export default Uploader;
