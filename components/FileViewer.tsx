
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Subject, AcademicFile, Category } from '../types';
import { 
  ChevronLeft, Download, FileText, Search, Loader2, 
  CheckCircle, AlertCircle, Eye, X, Layers, Filter
} from 'lucide-react';

interface FileViewerProps {
  category: Category;
  onBack: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ category, onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [selectedUnitNo, setSelectedUnitNo] = useState<string>('all');
  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ id: string, type: 'view' | 'download' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<AcademicFile | null>(null);

  const isUnitApplicable = category === 'Assignments' || category === 'Notes';

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to load subjects. Check Supabase connection.');
      } else {
        setSubjects(data || []);
      }
      setLoading(false);
    };

    fetchSubjects();
  }, []);

  // Fetch unique units for the selected subject and category
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedSubjectId || !isUnitApplicable) {
        setAvailableUnits([]);
        setSelectedUnitNo('all');
        return;
      }

      const { data, error } = await supabase
        .from('files')
        .select('unit_no')
        .eq('subject_id', selectedSubjectId)
        .eq('category', category)
        .not('unit_no', 'is', null);

      if (error) {
        console.error('Error fetching units:', error);
      } else {
        const uniqueUnits = Array.from(new Set(data.map(item => item.unit_no))).sort();
        setAvailableUnits(uniqueUnits as string[]);
        setSelectedUnitNo('all');
      }
    };

    fetchUnits();
  }, [selectedSubjectId, category]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedSubjectId) {
        setFiles([]);
        return;
      }

      setFetchingFiles(true);
      let query = supabase
        .from('files')
        .select('*')
        .eq('subject_id', selectedSubjectId)
        .eq('category', category);

      if (isUnitApplicable && selectedUnitNo !== 'all') {
        query = query.eq('unit_no', selectedUnitNo);
      }

      const { data, error } = await query
        .order('unit_no', { ascending: true })
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
      } else {
        setFiles(data || []);
      }
      setFetchingFiles(false);
    };

    fetchFiles();
  }, [selectedSubjectId, category, selectedUnitNo]);

  const logActivity = async (file: AcademicFile, type: string) => {
    try {
      await supabase.from('checkouts').insert({
        file_id: file.id,
        file_name: file.file_name,
        category: file.category,
        timestamp: new Date().toISOString(),
        user_role: 'Student (' + type + ')'
      });
    } catch (err) {
      console.warn('Logging failed:', err);
    }
  };

  const handleDownload = async (file: AcademicFile) => {
    setActionStatus({ id: file.id, type: 'download' });
    await logActivity(file, 'Download');
    
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed, opening in tab instead:', err);
      window.open(file.file_url, '_blank');
    }
    
    setTimeout(() => setActionStatus(null), 2000);
  };

  const handleView = async (file: AcademicFile) => {
    setViewingFile(file);
    await logActivity(file, 'View');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      {/* PDF Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4 bg-white/10 p-4 rounded-3xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-white font-black truncate max-w-[200px] md:max-w-md">{viewingFile.file_name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleDownload(viewingFile)}
                className="p-3 text-white hover:bg-white/10 rounded-2xl transition-all"
                title="Download"
              >
                <Download className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setViewingFile(null)}
                className="p-3 bg-white/20 text-white hover:bg-red-500 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-[2rem] overflow-hidden shadow-2xl relative">
            <iframe 
              src={`${viewingFile.file_url}#toolbar=0`} 
              className="w-full h-full border-none"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 shadow-sm"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{category} Library</h2>
          <p className="text-slate-500 text-sm font-medium">Browse and filter academic resources</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Selection */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg">
          <label htmlFor="subject-select" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
            Academic Subject
          </label>
          <div className="relative">
            <select
              id="subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all appearance-none text-slate-800 font-black"
            >
              <option value="">-- Choose Module --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Unit Selection (Conditionally shown) */}
        {isUnitApplicable && selectedSubjectId && (
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg animate-in slide-in-from-right-4 duration-300">
            <label htmlFor="unit-select" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
              Select Unit / Module
            </label>
            <div className="relative">
              <select
                id="unit-select"
                value={selectedUnitNo}
                onChange={(e) => setSelectedUnitNo(e.target.value)}
                className="w-full pl-6 pr-12 py-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all appearance-none text-indigo-900 font-black"
              >
                <option value="all">Show All Units</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Layers className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 opacity-20" />
        </div>
      ) : selectedSubjectId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {selectedUnitNo === 'all' ? 'All Resources' : `Resources for ${selectedUnitNo}`}
              </h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                {files.length} Found
              </span>
            </div>
            {fetchingFiles && <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />}
          </div>
          
          {fetchingFiles ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse"></div>
                ))}
             </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 truncate text-base tracking-tight group-hover:text-indigo-600 transition-colors">
                          {file.file_name}
                        </h4>
                        {file.unit_no && (
                          <span className="shrink-0 px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5" /> {file.unit_no}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        PDF • {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(file)}
                      className="p-3 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm border border-slate-100"
                      title="View PDF"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDownload(file)}
                      className={`p-3 rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                        actionStatus?.id === file.id && actionStatus.type === 'download'
                          ? 'bg-emerald-500 text-white scale-110 shadow-emerald-200' 
                          : 'bg-indigo-600 hover:bg-slate-900 text-white shadow-indigo-100'
                      }`}
                      title="Download PDF"
                    >
                      {actionStatus?.id === file.id && actionStatus.type === 'download' ? (
                        <CheckCircle className="w-5 h-5 animate-in zoom-in duration-300" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-100 rounded-[2.5rem] border-4 border-dashed border-white p-20 text-center">
              <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl text-slate-200">
                <FileText className="w-10 h-10" />
              </div>
              <p className="text-slate-500 font-black text-xl tracking-tight">Empty Module</p>
              <p className="text-slate-400 font-medium text-sm mt-1">No files found for the current selection.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/50 rounded-[2.5rem] border border-slate-200 border-dashed p-24 text-center">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
             <Search className="w-10 h-10 text-slate-200" />
           </div>
           <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Awaiting Subject Selection</p>
        </div>
      )}
    </div>
  );
};

export default FileViewer;
