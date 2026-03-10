
import React, { useState, useMemo } from 'react';
import { Trash2, FileText, Sparkles, Loader2, Pencil, Calendar, Clock, Zap, Printer } from 'lucide-react';
import { Activity, Project } from '../types';
import { summarizeWork } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('WorkLog AI - Registro Attività', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Filtro: ${filter === 'all' ? 'Tutto' : filter === 'week' ? 'Settimana' : 'Mese'}`, 14, 30);
    doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, 14, 36);

    const tableData = filteredActivities.map(a => {
      const project = projects.find(p => p.id === a.projectId);
      return [
        formatDateLabel(a.startTime),
        project?.name || 'N/A',
        a.activityCode || '---',
        a.description || '',
        formatDuration(a.durationSeconds)
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['Data', 'Progetto', 'Codice', 'Descrizione', 'Durata']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 },
    });

    doc.save(`worklog_log_${filter}.pdf`);
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
          <button onClick={handleExportPDF} disabled={filteredActivities.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl shadow-sm transition-all disabled:opacity-50 hover:bg-slate-50"><Printer size={16} /> PDF</button>
        </div>
      </div>

      {report && (
        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-start mb-4"><h3 className="text-indigo-900 font-bold flex items-center gap-2"><Sparkles className="text-indigo-500" size={18} /> Analisi Intelligente</h3><button onClick={() => setReport(null)} className="text-indigo-400 hover:text-indigo-600 text-sm font-medium">Chiudi</button></div>
          <div className="text-indigo-900 whitespace-pre-wrap leading-relaxed font-medium text-sm">{report}</div>
        </div>
      )}

      <div className="space-y-4">
        {groupedActivities.map((group) => (
          <div key={group.date} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
            <button 
              onClick={() => toggleDay(group.date)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black text-slate-800 uppercase">{formatDateLabel(group.date)}</span>
                </div>
                <div className="h-8 w-px bg-slate-100"></div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black text-indigo-600">{formatDuration(group.totalSeconds)}</span>
                </div>
              </div>
            </button>

            {expandedDays[group.date] && (
              <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <div className="h-px bg-slate-100 mb-4"></div>
                {group.activities.map((activity) => {
                  const project = projects.find(p => p.id === activity.projectId);
                  return (
                    <div key={activity.id} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><div className={`w-2 h-2 rounded-full ${project?.color || 'bg-slate-300'}`}></div><span className="text-xs font-black text-slate-700 truncate uppercase tracking-tight">{project?.name || 'Senza Commessa'}</span></div>
                        <div className="flex items-baseline gap-2 pl-3.5 border-l-2 border-slate-200">
                          <span className="text-[9px] font-black text-slate-500 shrink-0">
                            {activity.activityCode}
                          </span>
                          <p className="text-xs text-slate-500 italic truncate">
                            {activity.description || "Nessuna descrizione"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <span className="text-xs font-mono font-black text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-slate-100">{formatDuration(activity.durationSeconds)}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); onEdit(activity); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors" title="Modifica"><Pencil size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors" title="Elimina"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
