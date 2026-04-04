
import React, { useState, useMemo, useEffect } from 'react';
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
  const [type, setType] = useState<'work' | 'vacation' | 'sick'>(activity.type || 'work');
  const [inputHours, setInputHours] = useState<number | string>(Math.floor(activity.durationSeconds / 3600));
  const [inputMinutes, setInputMinutes] = useState<number | string>(Math.round((activity.durationSeconds % 3600) / 60));

  // Update defaults when type changes
  useEffect(() => {
    if (type === 'vacation') {
      setActivityCode('FERIE');
      setDescription('Ferie');
      setProjectId('');
    } else if (type === 'sick') {
      setActivityCode('MALATTIA');
      setDescription('Malattia');
      setProjectId('');
    } else if (type === 'work' && activity.type !== 'work') {
      setActivityCode('');
      setDescription('');
    }
  }, [type, activity.type]);

  const totalSeconds = useMemo(() => {
    const h = typeof inputHours === 'string' ? (parseInt(inputHours) || 0) : inputHours;
    const m = typeof inputMinutes === 'string' ? (parseInt(inputMinutes) || 0) : inputMinutes;
    return (h * 3600) + (m * 60);
  }, [inputHours, inputMinutes]);

  const handleSave = () => {
    // For work activities, we need a project. For vacation/sick, it can be empty.
    if (type === 'work' && !projectId) return;
    
    // Ensure we have at least 1 minute if it's a work activity
    const finalSeconds = Math.max(totalSeconds, 0);
    
    const baseDate = new Date(date);
    baseDate.setHours(18, 0, 0); 
    const endTime = baseDate.toISOString();
    const startTime = new Date(baseDate.getTime() - finalSeconds * 1000).toISOString();
    
    onSave({ 
      ...activity, 
      projectId: type === 'work' ? projectId : '', 
      activityCode: activityCode || (type === 'vacation' ? 'FERIE' : type === 'sick' ? 'MALATTIA' : '---'), 
      description: (description || "").trim(), 
      startTime, 
      endTime, 
      durationSeconds: finalSeconds,
      type
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Modifica Attività</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Aggiorna i dettagli della registrazione</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-rose-500 hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Tipo Attività</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
              {[
                { id: 'work', label: 'Lavoro', color: 'text-indigo-600' },
                { id: 'vacation', label: 'Ferie', color: 'text-emerald-600' },
                { id: 'sick', label: 'Malattia', color: 'text-purple-600' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as any)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === t.id ? 'bg-white shadow-sm ' + t.color : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Data Lavoro</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Commessa</label>
              <select 
                value={projectId} 
                disabled={type !== 'work'}
                onChange={(e) => setProjectId(e.target.value)} 
                className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all ${type !== 'work' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="" disabled>Seleziona Progetto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Codice Attività</label>
              <select 
                value={activityCode} 
                disabled={type !== 'work'}
                onChange={(e) => setActivityCode(e.target.value)} 
                className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all ${type !== 'work' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">Nessuno</option>
                {predefinedActivities.map(pa => <option key={pa.id} value={pa.code}>{pa.code} - {pa.description}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Note / Descrizione</label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" 
                placeholder="Cosa hai fatto?..." 
              />
            </div>
          </div>

          <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
            <div className="text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Durata</label>
              <div className="flex items-center justify-center gap-4 mb-2">
                <button 
                  type="button"
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
                  type="button"
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

        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-white rounded-2xl transition-all"
          >
            Annulla
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={type === 'work' && !projectId} 
            className="flex-[2] h-[54px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:bg-slate-200 disabled:opacity-100 disabled:cursor-not-allowed disabled:shadow-none group"
          >
            <Check size={20} className="group-hover:scale-110 transition-transform" /> 
            Salva Modifiche
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditActivityModal;
