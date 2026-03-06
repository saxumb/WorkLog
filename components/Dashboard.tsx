
import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Project, WeeklyWorkHours } from '../types';
import { Zap, Pencil, Trash2, Sparkles, Loader2, Clock, History, ClipboardList, Target } from 'lucide-react';
import { summarizeWork } from '../services/geminiService';

interface DashboardProps {
  activities: Activity[];
  projects: Project[];
  weeklyWorkHours: WeeklyWorkHours;
  onDeleteActivity: (id: string) => void;
  onEditActivity: (activity: Activity) => void;
}

type RangePreset = 'today' | 'week' | '30days' | 'month' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ activities, projects, weeklyWorkHours, onDeleteActivity, onEditActivity }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    switch (preset) {
      case 'today': setStartDate(today); setEndDate(today); break;
      case 'week': { const d = new Date(); d.setDate(d.getDate() - 7); setStartDate(d.toISOString().split('T')[0]); setEndDate(today); break; }
      case '30days': { const d = new Date(); d.setDate(d.getDate() - 30); setStartDate(d.toISOString().split('T')[0]); setEndDate(today); break; }
      case 'month': { const firstDay = new Date(now.getFullYear(), now.getMonth(), 1); setStartDate(firstDay.toISOString().split('T')[0]); setEndDate(today); break; }
    }
  }, [preset]);

  const filteredActivities = useMemo(() => {
    let list = activities.filter(a => a.endTime);
    if (startDate) { const start = new Date(startDate); start.setHours(0, 0, 0, 0); list = list.filter(a => new Date(a.startTime) >= start); }
    if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); list = list.filter(a => new Date(a.startTime) <= end); }
    return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [activities, startDate, endDate]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    filteredActivities.forEach(activity => {
      const dateKey = activity.startTime.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => {
      const d = new Date(date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof WeeklyWorkHours;
      const requiredHours = weeklyWorkHours[dayName];
      const totalSeconds = groups[date].reduce((acc, curr) => acc + curr.durationSeconds, 0);
      const totalHours = totalSeconds / 3600;
      const missingHours = Math.max(0, requiredHours - totalHours);
      const overtimeHours = Math.max(0, totalHours - requiredHours);

      return {
        date,
        activities: groups[date],
        totalSeconds,
        requiredHours,
        missingHours,
        overtimeHours
      };
    });
  }, [filteredActivities, weeklyWorkHours]);

  const stats = useMemo(() => {
    const totalSeconds = filteredActivities.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const dayMap = new Map<string, number>();
    filteredActivities.forEach(a => {
      const date = a.startTime.split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + a.durationSeconds / 3600);
    });
    
    let overtime = 0;
    let totalMissingHours = 0;
    dayMap.forEach((hours, dateStr) => {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof WeeklyWorkHours;
      const limit = weeklyWorkHours[dayName];
      if (hours > limit) overtime += (hours - limit);
      else if (hours < limit) totalMissingHours += (limit - hours);
    });
    
    const uniqueProjectIds = new Set(filteredActivities.map(a => a.projectId).filter(Boolean));
    
    return { 
      totalHours: totalSeconds / 3600, 
      overtime, 
      totalMissingHours,
      projectsCount: uniqueProjectIds.size 
    };
  }, [filteredActivities, weeklyWorkHours]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const result = await summarizeWork(filteredActivities, projects);
    setReport(result);
    setIsGenerating(false);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-12 px-4 md:px-0">
      
      {/* Date Filter & Unified Stats Row */}
      <div className="flex flex-col gap-4">
        {/* Presets Row */}
        <div className="bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-center gap-1 w-fit mx-auto md:mx-0">
          {['today', 'week', '30days', 'month', 'custom'].map((id) => (
            <button key={id} onClick={() => setPreset(id as RangePreset)} className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase transition-all ${preset === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}>
              {id === 'today' ? 'Oggi' : id === 'week' ? '7 Giorni' : id === '30days' ? '30 Giorni' : id === 'month' ? 'Mese' : 'Personalizzato'}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 animate-in fade-in zoom-in-95 ml-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-indigo-900 outline-none" />
              <span className="text-indigo-300 text-[10px]">→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-indigo-900 outline-none" />
            </div>
          )}
        </div>

        {/* COMPACT UNIFIED STATS ROW */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
          
          {/* Stat Item 1 */}
          <div className="flex-1 flex items-center gap-4 px-8 py-5 group hover:bg-slate-50 transition-colors">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tempo Totale</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800">{Math.round(stats.totalHours * 10) / 10}</span>
                <span className="text-xs font-bold text-slate-400">h</span>
              </div>
            </div>
          </div>

          {/* Stat Item 2 */}
          <div className="flex-1 flex items-center gap-4 px-8 py-5 group hover:bg-slate-50 transition-colors">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Straordinari</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-500">{Math.round(stats.overtime * 10) / 10}</span>
                <span className="text-xs font-bold text-slate-400">h</span>
              </div>
            </div>
          </div>

          {/* Stat Item 3 */}
          <div className="flex-1 flex items-center gap-4 px-8 py-5 group hover:bg-slate-50 transition-colors">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
              <History size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ROL/FE</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-rose-500">{Math.round(stats.totalMissingHours * 10) / 10}</span>
                <span className="text-xs font-bold text-slate-400">h</span>
              </div>
            </div>
          </div>

          {/* Stat Item 4 */}
          <div className="flex-1 flex items-center gap-4 px-8 py-5 group hover:bg-slate-50 transition-colors">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Commesse</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800">{stats.projectsCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-tighter">Progetti</span>
              </div>
            </div>
          </div>

          {/* AI Report CTA in-line if screen is large enough */}
          <div className="p-5 flex items-center justify-center bg-slate-50/50">
            <button 
              onClick={handleGenerateReport} 
              disabled={isGenerating || filteredActivities.length === 0} 
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} 
              Analisi AI
            </button>
          </div>
        </div>
      </div>

      {/* AI Report Section */}
      {report && (
        <div className="p-8 bg-indigo-50/40 rounded-[2.5rem] border border-indigo-100 animate-in slide-in-from-top-4 duration-500 relative group">
          <button onClick={() => setReport(null)} className="absolute top-6 right-6 text-indigo-300 hover:text-indigo-600 transition-colors">
            <Trash2 size={16} />
          </button>
          <div className="flex items-center gap-3 mb-4 text-indigo-700">
            <Sparkles size={20} className="animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest">Report Generato da Gemini</h3>
          </div>
          <p className="text-sm text-indigo-900/80 leading-relaxed whitespace-pre-wrap font-medium">{report}</p>
        </div>
      )}

      {/* Main List Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-sm">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Registro Attività</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredActivities.length} record trovati</p>
            </div>
          </div>
          {filteredActivities.length > 0 && (
             <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                <Target size={12} />
                <span className="text-[10px] font-black uppercase">Filtrato</span>
             </div>
          )}
        </div>

        <div className="p-3 md:p-6 space-y-2">
          {groupedActivities.map((group) => (
            <div key={group.date} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => toggleDay(group.date)}
                className="w-full flex items-center justify-between p-2 md:p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 md:gap-8 flex-1">
                  <div className="flex flex-col items-center justify-center w-24 md:w-32">
                    <span className="text-[11px] md:text-xs font-black text-slate-800 uppercase truncate text-center">{formatDateLabel(group.date)}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                  <div className="flex flex-col items-center justify-center w-16 md:w-20">
                    <span className="text-[11px] md:text-xs font-black text-indigo-600 text-center">{formatDuration(group.totalSeconds)}</span>
                  </div>
                  {group.missingHours > 0 && (
                    <>
                      <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                      <div className="flex flex-col items-center justify-center w-16 md:w-20">
                        <span className="text-[11px] md:text-xs font-black text-rose-500 text-center">-{Math.round(group.missingHours * 10) / 10}h</span>
                      </div>
                    </>
                  )}
                  {group.overtimeHours > 0 && (
                    <>
                      <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                      <div className="flex flex-col items-center justify-center w-16 md:w-20">
                        <span className="text-[11px] md:text-xs font-black text-amber-500 text-center">+{Math.round(group.overtimeHours * 10) / 10}h</span>
                      </div>
                    </>
                  )}
                </div>
              </button>

              {expandedDays[group.date] && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="h-px bg-slate-50 mb-2"></div>
                  {group.activities.map((activity) => {
                    const project = projects.find(p => p.id === activity.projectId);
                    return (
                      <div key={activity.id} className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${project?.color || 'bg-slate-300'}`}></div>
                            <span className="text-[10px] font-black text-slate-700 truncate uppercase tracking-tight">{project?.name || 'Senza Commessa'}</span>
                          </div>
                          <div className="flex items-baseline gap-2 pl-3.5 border-l-2 border-slate-200">
                            <span className="text-[9px] font-black text-slate-500 shrink-0">
                              {activity.activityCode}
                            </span>
                            <p className="text-[11px] text-slate-500 italic truncate">
                              {activity.description || "Nessuna descrizione"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4">
                          <span className="text-[10px] font-mono font-black text-indigo-600 bg-white px-2 py-1 rounded-lg border border-slate-100">{formatDuration(activity.durationSeconds)}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); onEditActivity(activity); }} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"><Pencil size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteActivity(activity.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          
          {filteredActivities.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
              <History size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nessuna attività registrata nel periodo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
