
import React, { useState, useMemo } from 'react';
import { Trash2, FileText, Sparkles, Loader2, Pencil, Calendar, Clock, Zap } from 'lucide-react';
import { Activity, Project } from '../types';
import { summarizeWork } from '../services/geminiService';

interface ActivityLogProps {
  activities: Activity[];
  projects: Project[];
  onDelete: (id: string) => void;
  onEdit: (activity: Activity) => void;
}

type FilterType = 'all' | 'week' | 'month';

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, projects, onDelete, onEdit }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const filteredActivities = useMemo(() => {
    let list = activities.filter(a => a.endTime);
    const now = new Date();
    if (filter === 'week') {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      list = list.filter(a => new Date(a.startTime) >= startOfWeek);
    } else if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter(a => new Date(a.startTime) >= startOfMonth);
    }
    return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [activities, filter]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    filteredActivities.forEach(activity => {
      const dateKey = activity.startTime.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({
      date,
      activities: groups[date],
      totalSeconds: groups[date].reduce((acc, curr) => acc + curr.durationSeconds, 0)
    }));
  }, [filteredActivities]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const result = await summarizeWork(filteredActivities, projects);
    setReport(result);
    setIsGenerating(false);
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Log Attività</h2>
          <p className="text-sm text-slate-500">Visualizza i tuoi lavori registrati</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex p-1 bg-slate-200/50 rounded-2xl">
            {['all', 'week', 'month'].map((f) => (
              <button key={f} onClick={() => setFilter(f as FilterType)} className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f === 'all' ? 'Tutto' : f === 'week' ? 'Settimana' : 'Mese'}</button>
            ))}
          </div>
          <button onClick={handleGenerateReport} disabled={isGenerating || filteredActivities.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} REPORT AI ({filteredActivities.length})</button>
        </div>
      </div>

      {report && (
        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-start mb-4"><h3 className="text-indigo-900 font-bold flex items-center gap-2"><Sparkles className="text-indigo-500" size={18} /> Analisi Intelligente</h3><button onClick={() => setReport(null)} className="text-indigo-400 hover:text-indigo-600 text-sm font-medium">Chiudi</button></div>
          <div className="text-indigo-900 whitespace-pre-wrap leading-relaxed font-medium text-sm">{report}</div>
        </div>
      )}

      <div className="space-y-10">
        {groupedActivities.map((group) => (
          <div key={group.date} className="space-y-4">
            <div className="flex items-center gap-4 px-2">
               <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Giornata</span><span className="text-sm font-black text-slate-800 uppercase">{formatDateLabel(group.date)}</span></div>
               <div className="h-8 w-px bg-slate-200"></div>
               <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tempo Totale</span><span className="text-sm font-black text-indigo-600">{formatDuration(group.totalSeconds)}</span></div>
            </div>
            <div className="grid gap-3">
              {group.activities.map((activity) => {
                const project = projects.find(p => p.id === activity.projectId);
                return (
                  <div key={activity.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5"><div className={`w-2.5 h-2.5 rounded-full ${project?.color || 'bg-slate-300'}`}></div><span className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{project?.name || 'Senza Commessa'}</span></div>
                      <div className="flex items-baseline gap-2 pl-4.5 border-l-2 border-slate-100">
                        <span className="text-[10px] font-black text-slate-800 shrink-0">
                          [{activity.activityCode}]
                        </span>
                        <p className="text-sm text-slate-500 italic leading-relaxed">
                          {activity.description || "Nessuna descrizione"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-center md:w-32 mt-4 md:mt-0">
                      <span className="text-sm font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl w-fit">{formatDuration(activity.durationSeconds)}</span>
                    </div>
                    <div className="flex items-center gap-2 md:pl-4 md:border-l border-slate-100 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
                      <button onClick={() => onEdit(activity)} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white rounded-xl border border-slate-100 shadow-sm" title="Modifica"><Pencil size={18} /></button>
                      <button onClick={() => onDelete(activity.id)} className="p-2.5 text-slate-400 hover:text-rose-500 bg-white rounded-xl border border-slate-100 shadow-sm" title="Elimina"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
