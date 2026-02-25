
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Square, Check, Sparkles, Loader2, History, Mic, MicOff, AlertCircle, Tag, Clock, CheckCheck } from 'lucide-react';
import { Project, Activity, PredefinedActivity } from '../types';
import { parseActivityInput } from '../services/geminiService';

interface EntryPanelProps {
  projects: Project[];
  activeActivity: Activity | null;
  activities: Activity[];
  predefinedActivities: PredefinedActivity[];
  dailyWorkHours: number;
  onStart: (projectId: string, activityCode: string, description: string) => void;
  onStop: () => void;
  onManualAdd: (projectId: string, activityCode: string, description: string, date: string, durationSeconds: number) => void;
}

const EntryPanel: React.FC<EntryPanelProps> = ({ projects, activeActivity, activities, predefinedActivities, dailyWorkHours, onStart, onStop, onManualAdd }) => {
  const [mode, setMode] = useState<'manual' | 'smart' | 'timer'>('manual');
  const [projectId, setProjectId] = useState('');
  const [activityCode, setActivityCode] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationHours, setDurationHours] = useState(8); 
  const [smartInput, setSmartInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  const recentSuggestions = useMemo(() => {
    const completed = activities.filter(a => a.endTime);
    const unique = new Map();
    [...completed].reverse().forEach(a => {
      const key = `${a.projectId}-${a.activityCode}`;
      if (!unique.has(key) && unique.size < 5) {
        unique.set(key, a);
      }
    });
    return Array.from(unique.values());
  }, [activities]);

  useEffect(() => {
    let interval: any;
    if (activeActivity) {
      setMode('timer');
      const start = new Date(activeActivity.startTime).getTime();
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeActivity]);

  const totalManualSeconds = useMemo(() => {
    return durationHours * 3600;
  }, [durationHours]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser non supportato.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'it-IT';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) setSmartInput(prev => prev + (prev ? " " : "") + transcript);
    };
    try { recognition.start(); } catch (e) { setIsListening(false); }
  };

  const handleManualSubmit = () => {
    if (!projectId) return;
    onManualAdd(projectId, activityCode || "---", description, date, totalManualSeconds);
    
    // Reset di tutti i campi inclusa la commessa
    setProjectId('');
    setActivityCode('');
    setDescription('');
    setDurationHours(8);
    
    // Attiva animazione di successo
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleSmartSubmit = async () => {
    if (!smartInput.trim()) return;
    setIsParsing(true);
    const result = await parseActivityInput(smartInput, projects);
    if (result) {
      const finalDurationSeconds = Math.max(result.durationMinutes * 60, 900);
      onManualAdd(result.projectId, result.activityCode || "---", result.description, date, finalDurationSeconds);
      setSmartInput('');
      setMode('manual');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    setIsParsing(false);
  };

  const formatHoursDisplay = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} ore`;
    return `${hours} ore ${minutes} min`;
  };

  if (activeActivity) {
    const currentProject = projects.find(p => p.id === activeActivity.projectId);
    return (
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-indigo-100 flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${currentProject?.color || 'bg-slate-300'}`}></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentProject?.name}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-2">
            <span className="text-[11px] font-black text-slate-800 tracking-tight bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
              {activeActivity.activityCode}
            </span>
            <h3 className="text-lg font-medium text-slate-800">
              {activeActivity.description || "In corso..."}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-mono font-bold text-indigo-600">
            {new Date(elapsed * 1000).toISOString().substr(11, 8)}
          </div>
          <button onClick={onStop} className="w-12 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-rose-100">
            <Square fill="white" size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-[2rem] p-1 shadow-sm border transition-all duration-500 overflow-hidden ${showSuccess ? 'border-emerald-500 animate-success-glow' : 'border-slate-200'}`}>
      <div className="flex flex-wrap p-1 bg-slate-100 rounded-3xl w-fit mb-2 mx-4 mt-4 gap-1">
        <button onClick={() => setMode('manual')} className={`px-4 py-1.5 rounded-[20px] text-[11px] font-bold transition-all ${mode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          Rapido
        </button>
        <button onClick={() => setMode('smart')} className={`px-4 py-1.5 rounded-[20px] text-[11px] font-bold transition-all ${mode === 'smart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          Smart AI
        </button>
        <button onClick={() => setMode('timer')} className={`px-4 py-1.5 rounded-[20px] text-[11px] font-bold transition-all ${mode === 'timer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          Timer
        </button>
      </div>

      <div className="px-5 pb-5">
        {mode === 'smart' ? (
          <div className="space-y-3">
            <textarea
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="es: 'Ho fatto 3 ore di sviluppo su Progetto ACME'"
              className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm min-h-[120px] resize-none pr-14 ${isListening ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
            />
            <div className="flex justify-end gap-2">
                <button onClick={toggleListening} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-slate-500 border border-slate-200'}`}><Mic size={18} /></button>
                <button onClick={handleSmartSubmit} disabled={isParsing || !smartInput.trim()} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">{isParsing ? <Loader2 className="animate-spin" size={18} /> : <Check size={20} />}</button>
            </div>
          </div>
        ) : mode === 'manual' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-12 lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">1. Data Lavoro</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">2. Commessa</label>
                    <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all">
                      <option value="">Scegli Progetto...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">3. Codice Attività (Opzionale)</label>
                    <select 
                      value={activityCode} 
                      onChange={(e) => setActivityCode(e.target.value)} 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="">Seleziona Codice...</option>
                      {predefinedActivities.map(pa => (
                        <option key={pa.id} value={pa.code}>{pa.code} - {pa.description}</option>
                      ))}
                      <option value="GENERIC">GENERIC - Attività Generica</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">4. Descrizione (Opzionale)</label>
                    <input type="text" placeholder="Note aggiuntive..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm italic outline-none focus:border-indigo-400" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 lg:col-span-4 space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div className="text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">5. Durata (Step 30min)</label>
                  <div className="text-3xl font-black text-indigo-600 mb-2">{durationHours.toFixed(1)}<span className="text-sm ml-1 text-slate-400">h</span></div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">{formatHoursDisplay(durationHours)}</div>
                </div>
                <input type="range" min="0.5" max="18" step="0.5" value={durationHours} onChange={(e) => setDurationHours(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                
                <button 
                  onClick={handleManualSubmit} 
                  disabled={!projectId} 
                  className={`w-full h-[54px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg font-black text-xs uppercase ${showSuccess ? 'bg-emerald-500 scale-105' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200'} text-white`}
                >
                  {showSuccess ? (
                    <div className="flex items-center gap-2 animate-in zoom-in-50 duration-300">
                      <CheckCheck size={20} />
                      <span>REGISTRATO!</span>
                    </div>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>SALVA ATTIVITÀ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {recentSuggestions.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[9px] font-bold text-slate-300 uppercase flex items-center gap-1"><History size={10} /> Recenti:</span>
                {recentSuggestions.map((sug, i) => (
                  <button key={i} onClick={() => { setProjectId(sug.projectId); setActivityCode(sug.activityCode); setDescription(sug.description); }} className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-full text-[9px] font-bold text-slate-500 transition-colors border border-slate-100 tracking-tighter">
                    <span className="font-black mr-1">[{sug.activityCode}]</span> {sug.description || sug.projectId}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold outline-none" />
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                <option value="">Progetto...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={activityCode} onChange={(e) => setActivityCode(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                <option value="">Codice Attività (Opz.)...</option>
                {predefinedActivities.map(pa => <option key={pa.id} value={pa.code}>{pa.code}</option>)}
              </select>
              <input type="text" placeholder="Descrizione opzionale..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm italic" />
            </div>
            <button onClick={() => onStart(projectId, activityCode || "---", description)} disabled={!projectId} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl uppercase text-xs"><Play size={18} fill="white" /> AVVIA TIMER ORA</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntryPanel;
