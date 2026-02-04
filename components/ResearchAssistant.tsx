
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { supabase } from '../services/supabaseClient';
import { ChevronLeft, Send, Sparkles, Globe, ExternalLink, Loader2, Bot, User, Trash2, Database, FileText, Download } from 'lucide-react';

interface ResearchAssistantProps {
  onBack: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; uri: string }[];
  files?: { id: string; name: string; url: string; unit?: string; category: string }[];
}

const ResearchAssistant: React.FC<ResearchAssistantProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am Alex, your Academic Assistant. I can search the web for research or check our library for notes, assignments, and lab resources. How can I help you today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const searchLibraryTool: FunctionDeclaration = {
    name: "search_library",
    description: "Search the internal academic database for specific files (PDFs). Use this when the user explicitly asks for notes, assignments, or lab manuals for a specific subject.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.STRING,
          description: "The name of the subject or module (e.g., 'Python', 'Cloud Computing')."
        },
        category: {
          type: Type.STRING,
          description: "The category to search: 'Assignments', 'Notes', or 'Lab Resources'."
        },
        unit: {
          type: Type.STRING,
          description: "The unit number if specified (e.g., 'Unit 1', 'Unit 2', 'Unit 3')."
        }
      },
      required: ["subject", "category"]
    }
  };

  const executeLibrarySearch = async (subject: string, category: string, unit?: string) => {
    try {
      // 1. Find matching subjects
      const { data: subjects, error: subError } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', `%${subject}%`)
        .eq('category', category);

      if (subError || !subjects || subjects.length === 0) {
        return [];
      }

      // 2. Find files for those subjects
      let query = supabase
        .from('files')
        .select('*')
        .in('subject_id', subjects.map(s => s.id))
        .eq('category', category);

      if (unit) {
        query = query.eq('unit_no', unit);
      }

      const { data: files } = await query.order('uploaded_at', { ascending: false });
      
      return files?.map(f => ({
        id: f.id,
        name: f.file_name,
        url: f.file_url,
        unit: f.unit_no,
        category: f.category
      })) || [];

    } catch (err) {
      console.error("Supabase Search Error:", err);
      return [];
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = "AIzaSyAhuNW3LCpEKEdw54HKSb_w0J8RxP25e7k";
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: userMessage,
        config: {
          tools: [
            { googleSearch: {} },
            { functionDeclarations: [searchLibraryTool] }
          ],
          systemInstruction: "You are Alex, an Academic Assistant. If the user asks for internal files (notes, units, assignments), use the search_library tool. If the tool returns files, present them clearly. If no files are found, apologize and offer to search the web instead. Always be helpful and scholarly."
        },
      });

      // Handle Function Calling
      const functionCall = response.functionCalls?.[0];
      
      if (functionCall && functionCall.name === 'search_library') {
        const args = functionCall.args as any;
        const foundFiles = await executeLibrarySearch(args.subject, args.category, args.unit);
        
        if (foundFiles.length > 0) {
          const unitText = args.unit ? ` for ${args.unit}` : '';
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `I found ${foundFiles.length} resource(s) in the library for **${args.subject}** (${args.category}${unitText}):`,
            files: foundFiles
          }]);
        } else {
           // If local search fails, maybe try to answer generally or just say not found
           setMessages(prev => [...prev, { 
             role: 'assistant', 
             content: `I searched the library for **${args.subject}** ${args.category}, but I couldn't find any uploaded files matching your criteria. \n\nWould you like me to search the web for external resources instead?` 
           }]);
        }
      } else {
        // Standard Text Response (Web Search or Chat)
        const text = response.text || "I couldn't process that request.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map((chunk: any) => chunk.web)
          .filter(Boolean) || [];

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: text,
          sources: sources.length > 0 ? sources : undefined
        }]);
      }

    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `System Message: ${error.message || "Failed to reach Alex service."}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all shadow-sm border border-slate-100">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-indigo-500" />
              Alex your Assistant
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Grounded Academic Intelligence</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
          title="Clear Conversation"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all">
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-600 border border-slate-200'
              }`}>
                {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              
              <div className={`max-w-[80%] space-y-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.content && (
                  <div className={`inline-block px-8 py-5 rounded-[2rem] text-base leading-relaxed font-medium shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                      : 'bg-slate-50 text-slate-800 border-slate-100 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                )}

                {/* Display Database Files */}
                {msg.files && msg.files.length > 0 && (
                  <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[2rem] space-y-3 animate-in fade-in duration-700 text-left">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Database className="w-3.5 h-3.5" /> Library Assets Found
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.files.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-50 shadow-sm hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{file.name}</p>
                              {file.unit && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{file.unit}</p>}
                            </div>
                          </div>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display Web Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="bg-emerald-50/40 border border-emerald-100 p-6 rounded-[2rem] space-y-3 animate-in fade-in duration-700 text-left">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <Globe className="w-3.5 h-3.5" /> Research References
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, sIdx) => (
                        <a 
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                        >
                          {source.title}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-[1.25rem] bg-slate-100 border border-slate-200 text-indigo-600 flex items-center justify-center animate-pulse">
                <Bot className="w-6 h-6" />
              </div>
              <div className="bg-slate-50 px-8 py-5 rounded-[2rem] rounded-tl-none border border-slate-100 flex items-center gap-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Alex is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <form onSubmit={handleSend} className="relative w-full">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Alex about course materials, e.g., 'Notes for Cloud Computing Unit 1'..."
              className="w-full pl-8 pr-24 py-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 font-medium text-lg placeholder:text-slate-300"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:bg-slate-400 shadow-xl shadow-indigo-100 group"
            >
              <Send className="w-7 h-7 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
          <div className="flex items-center justify-center gap-6 mt-4 opacity-40">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Web Grounding Active</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Library Sync Active</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gemini 3 Pro Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchAssistant;
