
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, AcademicFile, Category } from '../types';
import { ChevronLeft, Download, FileText, Search, Loader2 } from 'lucide-react';

interface FileViewerProps {
  category: Category;
  onBack: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ category, onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingFiles, setFetchingFiles] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching subjects:', error);
      } else {
        setSubjects(data || []);
      }
      setLoading(false);
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedSubjectId) {
        setFiles([]);
        return;
      }

      setFetchingFiles(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('subject_id', selectedSubjectId)
        .eq('category', category)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
      } else {
        setFiles(data || []);
      }
      setFetchingFiles(false);
    };

    fetchFiles();
  }, [selectedSubjectId, category]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{category}</h2>
          <p className="text-slate-500 text-sm">Browse academic resources by subject</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <label htmlFor="subject-select" className="block text-sm font-bold text-slate-700 mb-3">
          Select Subject
        </label>
        <div className="relative">
          <select
            id="subject-select"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none text-slate-800 font-medium"
          >
            <option value="">-- Choose a subject --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : selectedSubjectId ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 px-2">Available Resources</h3>
          {fetchingFiles ? (
             <div className="flex justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
             </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 line-clamp-1">{file.file_name}</h4>
                      <p className="text-xs text-slate-400">Uploaded on {new Date(file.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <a
                    href={file.file_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-xl transition-all shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No files found for this category and subject.</p>
              <p className="text-slate-400 text-sm">Be the first to upload one!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center">
           <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <p className="text-slate-400 font-medium">Please select a subject to view files.</p>
        </div>
      )}
    </div>
  );
};

export default FileViewer;
