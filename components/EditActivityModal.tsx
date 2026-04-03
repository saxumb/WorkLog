
import React, { useState, useMemo } from 'react';
import { X, Check, Clock, Plus, Minus } from 'lucide-react';
import { Activity, Project, PredefinedActivity } from '../types';
import { toLocalDateString } from '../services/utils';

interface EditActivityModalProps {
  activity: Activity;
  projects: Project[];
  predefinedActivities: PredefinedActivity[];
  onSave: (updated: Activity) => void;
  onClose: () => void;
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({ activity, projects, predefinedActivities, onSave, onClose }) => {
  const [projectId, setProjectId] = useState(activity.projectId);
  const [activityCode, setActivityCode] = useState(activity.activityCode);
  const [description, setDescription] = useState(activity.description);
  const [date, setDate] = useState(toLocalDateString(new Date(activity.startTime)));
  const [inputHours, setInputHours] = useState<number | string>(Math.floor(activity.durationSeconds / 3600));
  const [inputMinutes, setInputMinutes] = useState<number | string>(Math.round((activity.durationSeconds % 3600) / 60));

  const totalSeconds = useMemo(() => {
    const h = typeof inputHours === 'string' ? (parseInt(inputHours) || 0) : inputHours;
    const m = typeof inputMinutes === 'string' ? (parseInt(inputMinutes) || 0) : inputMinutes;
    return (h * 3600) + (m * 60);
  }, [inputHours, inputMinutes]);

  const handleSave = () => {
    if (!projectId || totalSeconds <= 0) return;
    const baseDate = new Date(date);
    baseDate.setHours(18, 0, 0); 
    const endTime = baseDate.toISOString();
    const startTime = new Date(baseDate.getTime() - totalSeconds * 1000).toISOString();
    onSave({ ...activity, projectId, activityCode: activityCode || "---", description: description.trim(), startTime, endTime, durationSeconds: totalSeconds });
  };

  const formatHoursDisplay = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div><h2 className="text-xl font-bold text-slate-800">Modifica Attività</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Data Lavoro</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold outline-none focus:border-indigo-500" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Commessa</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Codice Attività (Opzionale)</label>
              <select value={activityCode} onChange={(e) => setActivityCode(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all">
                <option value="">Nessuno</option>
                {predefinedActivities.map(pa => <option key={pa.id} value={pa.code}>{pa.code} - {pa.description}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Descrizione (Opzionale)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm italic outline-none focus:border-indigo-400" placeholder="Note extra..." />
            </div>
          </div>

          <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
             <div className="text-center">
               <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Durata</label>
               <div className="flex items-center justify-center gap-4 mb-2">
                  <button 
                    onClick={() => {
                      const totalMins = (typeof inputHours === 'string' ? parseInt(inputHours) || 0 : inputHours) * 60 + (typeof inputMinutes === 'string' ? parseInt(inputMinutes) || 0 : inputMinutes);
                      const newTotal = Math.max(0, totalMins - 30);
                      setInputHours(Math.floor(newTotal / 60));
                      setInputMinutes(newTotal % 60);
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex items-center justify-center bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        min="0" 
                        max="24"
                        placeholder="hh"
                        value={inputHours} 
                        onChange={(e) => setInputHours(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-10 text-2xl font-black text-indigo-600 bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xl font-black text-indigo-300 mx-1">:</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="59"
                        placeholder="mm"
                        value={inputMinutes} 
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.min(59, parseInt(e.target.value) || 0);
                          setInputMinutes(val);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-10 text-2xl font-black text-indigo-600 bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const totalMins = (typeof inputHours === 'string' ? parseInt(inputHours) || 0 : inputHours) * 60 + (typeof inputMinutes === 'string' ? parseInt(inputMinutes) || 0 : inputMinutes);
                      const newTotal = Math.min(1440, totalMins + 30);
                      setInputHours(Math.floor(newTotal / 60));
                      setInputMinutes(newTotal % 60);
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
               </div>
             </div>
             <input 
               type="range" 
               min="0.5" 
               max="18" 
               step="0.5" 
               value={totalSeconds / 3600} 
               onChange={(e) => {
                 const val = parseFloat(e.target.value);
                 setInputHours(Math.floor(val));
                 setInputMinutes(Math.round((val - Math.floor(val)) * 60));
               }} 
               className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
             />
          </div>
        </div>
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-white rounded-2xl transition-all">Annulla</button>
          <button onClick={handleSave} disabled={!projectId || totalSeconds <= 0} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"><Check size={18} /> Salva Modifiche</button>
        </div>
      </div>
    </div>
  );
};

export default EditActivityModal;
