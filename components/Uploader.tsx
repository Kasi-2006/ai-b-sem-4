
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, Category } from '../types';
import { ChevronLeft, Upload, CheckCircle2, AlertCircle, Loader2, FileType, Database, User, Hash } from 'lucide-react';

interface UploaderProps {
  onBack: () => void;
}

const Uploader: React.FC<UploaderProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string, isBucketError?: boolean } | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      if (error) console.error(error);
      else setSubjects(data || []);
    };
    fetchSubjects();
  }, []);

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
    if (!selectedSubjectId || !selectedCategory || !file || !studentName || !rollNo) {
      setMessage({ type: 'error', text: 'Please complete all fields (including name and roll number)' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // 1. Upload file to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedCategory}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('academic-files')
        .upload(filePath, file);

      if (storageError) {
        if (storageError.message.toLowerCase().includes('bucket not found')) {
          setMessage({ 
            type: 'error', 
            text: 'Bucket "academic-files" does not exist in Supabase Storage.',
            isBucketError: true 
          });
          setUploading(false);
          return;
        }
        throw storageError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('academic-files')
        .getPublicUrl(filePath);

      // 3. Save metadata to DB
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          subject_id: selectedSubjectId,
          category: selectedCategory,
          file_name: file.name,
          file_url: publicUrl,
          student_name: studentName,
          roll_no: rollNo,
          uploaded_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setFile(null);
      setSelectedSubjectId('');
      setSelectedCategory('');
      setStudentName('');
      setRollNo('');
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Error uploading file' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Upload Content</h2>
          <p className="text-slate-500 text-sm">Contribute to the academic repository</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="font-bold text-slate-700">Processing upload...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Metadata Section */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <User className="w-4 h-4" /> Contributor Details
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Roll Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 21CS001"
                      className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                    />
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Category)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
              >
                <option value="">-- Select Category --</option>
                <option value="Assignments">Assignments</option>
                <option value="Notes">Notes</option>
                <option value="Lab Resources">Lab Resources</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">PDF Document</label>
            <div className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg mb-4">
                      <FileType className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-indigo-700">{file.name}</p>
                    <p className="text-xs text-indigo-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-200 p-4 rounded-2xl text-slate-500 mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-600">Drag & drop or click to upload</p>
                    <p className="text-xs text-slate-400 mt-1">Only PDF files are supported</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className={`flex flex-col gap-3 p-6 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <div className="flex items-center gap-3">
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm font-bold">{message.text}</span>
              </div>
              {message.isBucketError && (
                <div className="mt-2 p-4 bg-white/50 rounded-xl border border-red-200 text-xs">
                  <div className="flex items-center gap-2 mb-2 text-red-900 font-black uppercase tracking-widest">
                    <Database className="w-4 h-4" /> Solution:
                  </div>
                  <p className="mb-3 font-medium text-red-800">The "academic-files" storage bucket hasn't been created yet.</p>
                  <button 
                    onClick={onBack}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all uppercase tracking-widest"
                  >
                    Go back & Run Setup Script
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file || !selectedSubjectId || !selectedCategory || !studentName || !rollNo}
            className="w-full bg-indigo-600 disabled:bg-slate-300 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3"
          >
            <Upload className="w-5 h-5" />
            Upload to Academic Repository
          </button>
        </form>
      </div>
    </div>
  );
};

export default Uploader;
