
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, Category } from '../types';
import { ChevronLeft, Upload, CheckCircle2, AlertCircle, Loader2, FileType, Database, AlertTriangle, Layers, User, Hash } from 'lucide-react';

interface UploaderProps {
  onBack: () => void;
}

const UNITS = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

const Uploader: React.FC<UploaderProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [unitNo, setUnitNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string, isSchemaError?: boolean } | null>(null);

  useEffect(() => {
    if (!selectedCategory) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('category', selectedCategory)
        .order('name');
      if (error) console.error(error);
      else setSubjects(data || []);
    };
    fetchSubjects();
  }, [selectedCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setMessage({ type: 'error', text: 'Only PDF files are allowed' });
        setFile(null);
        e.target.value = '';
        return;
      }
      setFile(selected);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const needsUnit = selectedCategory === 'Assignments' || selectedCategory === 'Notes';
    if (!selectedSubjectId || !selectedCategory || !file || !studentName || !rollNo || (needsUnit && !unitNo)) {
      setMessage({ type: 'error', text: 'Please complete all fields' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedCategory}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('academic-files')
        .upload(filePath, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('academic-files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          subject_id: selectedSubjectId,
          category: selectedCategory,
          file_name: file.name,
          file_url: publicUrl,
          student_name: studentName,
          roll_no: rollNo,
          unit_no: needsUnit ? unitNo : null,
          uploaded_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setFile(null);
      setSelectedSubjectId('');
      // Keep category selected for easier bulk upload
      setUnitNo('');
      // Keep name/roll for session
    } catch (error: any) {
      console.error('Upload error:', error);
      const isSchemaCacheError = error.message?.includes('column') || error.message?.includes('cache');
      setMessage({ 
        type: 'error', 
        text: isSchemaCacheError ? 'Database needs updating. Run the setup SQL script provided in Dashboard.' : (error.message || 'Error uploading file'),
        isSchemaError: isSchemaCacheError
      });
    } finally {
      setUploading(false);
    }
  };

  const isUnitRequired = selectedCategory === 'Assignments' || selectedCategory === 'Notes';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Upload Content</h2>
          <p className="text-slate-500 text-sm">Contribute materials to the library</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="font-bold text-slate-700">Syncing with Repository...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-2 bg-amber-500 rounded-xl text-white">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-amber-900 font-black uppercase tracking-widest text-[10px] mb-1">Identity & Security</h4>
              <p className="text-amber-800 text-sm font-bold">
                Your name and roll number are recorded to ensure academic integrity. Intentional misinformation will lead to a system ban.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Roll Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 21BCE0001"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800"
                />
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as Category);
                  setSelectedSubjectId(''); // Reset subject when category changes
                }}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold"
              >
                <option value="">-- Choose Category First --</option>
                <option value="Assignments">Assignments</option>
                <option value="Notes">Notes</option>
                <option value="Lab Resources">Lab Resources</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedCategory}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold disabled:opacity-50 disabled:bg-slate-100"
              >
                <option value="">{selectedCategory ? '-- Choose Subject --' : '-- Waiting for Category --'}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isUnitRequired && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Unit / Module</label>
              <select
                value={unitNo}
                onChange={(e) => setUnitNo(e.target.value)}
                className="w-full px-5 py-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-indigo-900"
              >
                <option value="">-- Choose Unit --</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">PDF File</label>
            <div className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 hover:border-indigo-200'}`}>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-indigo-100 mb-3">
                      <FileType className="w-10 h-10 text-indigo-600" />
                    </div>
                    <p className="font-black text-indigo-700 text-lg tracking-tight">{file.name}</p>
                    <p className="text-xs text-indigo-400 mt-1 uppercase font-bold tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • READY</p>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3">
                      <Upload className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-500">Drag PDF here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-[0.2em]">MAX SIZE: 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-6 rounded-2xl border flex items-center gap-4 animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-lg shadow-emerald-50' : 'bg-red-50 border-red-100 text-red-700 shadow-lg shadow-red-50'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <span className="text-sm font-black leading-tight">{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file || !selectedSubjectId || !selectedCategory || !studentName || !rollNo || (isUnitRequired && !unitNo)}
            className="w-full bg-indigo-600 disabled:bg-slate-300 text-white font-black py-5 rounded-2xl hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100/50"
          >
            <Upload className="w-5 h-5" />
            Upload to Academic Library
          </button>
        </form>
      </div>
    </div>
  );
};

export default Uploader;
