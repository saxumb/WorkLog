
import React, { useState, useMemo } from 'react';
import { X, Check, Clock } from 'lucide-react';
import { Activity, Project, PredefinedActivity } from '../types';

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
  const [date, setDate] = useState(new Date(activity.startTime).toISOString().split('T')[0]);
  const [durationHours, setDurationHours] = useState(Math.round(activity.durationSeconds / 1800) / 2);

  const totalSeconds = useMemo(() => durationHours * 3600, [durationHours]);

  const handleSave = () => {
    if (!projectId || durationHours <= 0) return;
    const baseDate = new Date(date);
    baseDate.setHours(18, 0, 0); 
    const endTime = baseDate.toISOString();
    const startTime = new Date(baseDate.getTime() - totalSeconds * 1000).toISOString();
    onSave({ ...activity, projectId, activityCode: activityCode || "---", description: description.trim(), startTime, endTime, durationSeconds: totalSeconds });
  };

  const formatHoursDisplay = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    return hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} ore` : `${hours} ore ${minutes} min`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div><h2 className="text-xl font-bold text-slate-800">Modifica Attività</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Lavoro</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progetto / Commessa</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Codice Attività (Opzionale)</label>
            <select value={activityCode} onChange={(e) => setActivityCode(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 tracking-tight">
              <option value="">Nessuno</option>
              {predefinedActivities.map(pa => <option key={pa.id} value={pa.code}>{pa.code}</option>)}
              <option value="GENERIC">GENERIC</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrizione (Opzionale)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="Note extra..." />
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durata Sessione</span>
               <div className="text-right"><div className="text-2xl font-black text-indigo-600">{durationHours.toFixed(1)}h</div><div className="text-[9px] font-bold text-indigo-400 uppercase">{formatHoursDisplay(durationHours)}</div></div>
             </div>
             <input type="range" min="0.5" max="18" step="0.5" value={durationHours} onChange={(e) => setDurationHours(parseFloat(e.target.value))} className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
        </div>
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-white rounded-2xl transition-all">Annulla</button>
          <button onClick={handleSave} disabled={!projectId || durationHours <= 0} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"><Check size={18} /> Salva Modifiche</button>
        </div>
      </div>
    </div>
  );
};

export default EditActivityModal;
