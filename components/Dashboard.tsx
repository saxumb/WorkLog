
import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Project, WeeklyWorkHours, PredefinedActivity } from '../types';
import { Zap, Pencil, Trash2, Clock, History, ClipboardList, Target, Printer, Plus, ChevronDown, ChevronUp, Filter, Search, X, FileSpreadsheet, Heart, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toLocalDateString } from '../services/utils';

interface DashboardProps {
  activities: Activity[];
  projects: Project[];
  predefinedActivities: PredefinedActivity[];
  weeklyWorkHours: WeeklyWorkHours;
  companyLogo: string | null;
  companyHeader: string;
  onDeleteActivity: (id: string) => void;
  onEditActivity: (activity: Activity) => void;
  onNavigateToEntry: () => void;
}

type RangePreset = 'today' | 'week' | '30days' | 'month' | 'prevMonth' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ 
  activities, projects, predefinedActivities, weeklyWorkHours, companyLogo, companyHeader,
  onDeleteActivity, onEditActivity, onNavigateToEntry 
}) => {
  const [preset, setPreset] = useState<RangePreset>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedActivityCode, setSelectedActivityCode] = useState<string>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [pendingExport, setPendingExport] = useState<'pdf' | 'excel' | null>(null);

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  useEffect(() => {
    const now = new Date();
    const today = toLocalDateString(now);
    switch (preset) {
      case 'today': setStartDate(today); setEndDate(today); break;
      case 'week': { const d = new Date(); d.setDate(d.getDate() - 7); setStartDate(toLocalDateString(d)); setEndDate(today); break; }
      case '30days': { const d = new Date(); d.setDate(d.getDate() - 30); setStartDate(toLocalDateString(d)); setEndDate(today); break; }
      case 'month': { const firstDay = new Date(now.getFullYear(), now.getMonth(), 1); setStartDate(toLocalDateString(firstDay)); setEndDate(today); break; }
      case 'prevMonth': { 
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1); 
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(toLocalDateString(firstDay)); 
        setEndDate(toLocalDateString(lastDay)); 
        break; 
      }
    }
  }, [preset]);

  const filteredActivities = useMemo(() => {
    let list = activities.filter(a => a.endTime);
    if (startDate) { const start = new Date(startDate); start.setHours(0, 0, 0, 0); list = list.filter(a => new Date(a.startTime) >= start); }
    if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); list = list.filter(a => new Date(a.startTime) <= end); }
    if (selectedProjectId !== 'all') {
      list = list.filter(a => a.projectId === selectedProjectId);
    }
    if (selectedActivityCode !== 'all') {
      list = list.filter(a => a.activityCode === selectedActivityCode);
    }
    return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [activities, startDate, endDate, selectedProjectId, selectedActivityCode]);

  const groupedActivities = useMemo(() => {
    const isFiltered = selectedProjectId !== 'all' || selectedActivityCode !== 'all';
    const groups: Record<string, Activity[]> = {};
    filteredActivities.forEach(activity => {
      const dateKey = toLocalDateString(new Date(activity.startTime));
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => {
      const d = new Date(date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof WeeklyWorkHours;
      const requiredHours = weeklyWorkHours[dayName];
      const totalSeconds = groups[date].reduce((acc, curr) => acc + curr.durationSeconds, 0);
      const totalHours = totalSeconds / 3600;
      
      // If filtered by project or activity, we don't calculate missing hours (ROL/FE)
      const missingHours = isFiltered ? 0 : Math.max(0, requiredHours - totalHours);
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
  }, [filteredActivities, weeklyWorkHours, selectedProjectId, selectedActivityCode]);

  const stats = useMemo(() => {
    const isFiltered = selectedProjectId !== 'all' || selectedActivityCode !== 'all';
    const totalSeconds = filteredActivities.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const dayMap = new Map<string, number>();
    filteredActivities.forEach(a => {
      const date = toLocalDateString(new Date(a.startTime));
      dayMap.set(date, (dayMap.get(date) || 0) + a.durationSeconds / 3600);
    });
    
    let overtime = 0;
    let totalMissingHours = 0;
    dayMap.forEach((hours, dateStr) => {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof WeeklyWorkHours;
      const limit = weeklyWorkHours[dayName];
      if (hours > limit) overtime += (hours - limit);
      else if (!isFiltered && hours < limit) totalMissingHours += (limit - hours);
    });
    
    const uniqueProjectIds = new Set(filteredActivities.map(a => a.projectId).filter(Boolean));
    
    return { 
      totalHours: totalSeconds / 3600, 
      overtime, 
      totalMissingHours,
      projectsCount: uniqueProjectIds.size 
    };
  }, [filteredActivities, weeklyWorkHours, selectedProjectId, selectedActivityCode]);

  const handleExportPDF = () => {
    setPendingExport('pdf');
    setShowDonationModal(true);
  };

  const formatHHMM = (hours: number) => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    return `${hours < 0 ? '-' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const executeExportPDF = () => {
    const doc = new jsPDF();
    
    // Header with Logo
    if (companyLogo) {
      try {
        // Add logo at top right
        doc.addImage(companyLogo, 'PNG', 160, 10, 35, 35, undefined, 'FAST');
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }

    doc.setFontSize(18);
    doc.text('WorkLog - Report Attività', 14, 22);
    
    // Company Header Text
    if (companyHeader) {
      doc.setFontSize(8);
      doc.setTextColor(120);
      const headerLines = doc.splitTextToSize(companyHeader, 80);
      doc.text(headerLines, 14, 30);
    }

    doc.setFontSize(11);
    doc.setTextColor(100);
    const startY = companyHeader ? 30 + (doc.splitTextToSize(companyHeader, 80).length * 4) + 5 : 30;
    doc.text(`Periodo: ${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`, 14, startY);
    doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, 14, startY + 6);

    // Stats
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Riepilogo:', 14, startY + 18);
    doc.setFontSize(10);
    doc.text(`Ore Totali: ${formatHHMM(stats.totalHours)}`, 14, startY + 26);
    doc.text(`Straordinari: ${formatHHMM(stats.overtime)}`, 14, startY + 32);
    doc.text(`ROL/FE: ${formatHHMM(stats.totalMissingHours)}`, 14, startY + 38);
    doc.text(`Progetti: ${stats.projectsCount}`, 14, startY + 44);

    const tableData = filteredActivities.map(a => {
      const project = projects.find(p => p.id === a.projectId);
      const predefined = predefinedActivities.find(pa => pa.code === a.activityCode);
      const activityLabel = predefined ? `${a.activityCode} - ${predefined.description}` : (a.activityCode || '---');
      
      return [
        formatDateLabel(a.startTime),
        project?.name || 'N/A',
        activityLabel,
        a.description || '',
        formatDuration(a.durationSeconds)
      ];
    });

    autoTable(doc, {
      startY: startY + 56,
      head: [['Data', 'Progetto', 'Codice', 'Descrizione', 'Durata']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 },
    });

    doc.save(`worklog_report_${startDate}_${endDate}.pdf`);
  };

  const handleExportExcel = () => {
    setPendingExport('excel');
    setShowDonationModal(true);
  };

  const executeExportExcel = () => {
    const data = filteredActivities.map(a => {
      const project = projects.find(p => p.id === a.projectId);
      const predefined = predefinedActivities.find(pa => pa.code === a.activityCode);
      return {
        'Data': formatDateLabel(a.startTime),
        'Progetto': project?.name || 'N/A',
        'Cliente': project?.client || 'N/A',
        'Codice Attività': a.activityCode || '---',
        'Descrizione Codice': predefined?.description || '',
        'Note': a.description || '',
        'Durata': formatDuration(a.durationSeconds),
        'Secondi': a.durationSeconds
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attività');
    XLSX.writeFile(workbook, `worklog_export_${startDate}_${endDate}.xlsx`);
  };

  const handleConfirmExport = () => {
    if (pendingExport === 'pdf') {
      executeExportPDF();
    } else if (pendingExport === 'excel') {
      executeExportExcel();
    }
    setShowDonationModal(false);
    setPendingExport(null);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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
      
      {/* New Activity Button */}
      <button 
        onClick={onNavigateToEntry}
        className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] shadow-xl shadow-indigo-100 flex items-center justify-center gap-4 transition-all group overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus size={28} strokeWidth={3} />
        </div>
        <div className="text-left">
          <span className="block text-xs font-black uppercase tracking-[0.2em] opacity-80">Nuova Registrazione</span>
          <span className="block text-xl font-black uppercase tracking-tight">Inserisci Attività</span>
        </div>
      </button>

      {/* Collapsible Filters Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Filter size={18} />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Filtri Ricerca</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Personalizza la visualizzazione</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(selectedProjectId !== 'all' || selectedActivityCode !== 'all' || preset !== 'month') && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                <span className="text-[9px] font-black uppercase tracking-tighter">Filtri Attivi</span>
              </div>
            )}
            <div className="text-slate-400">
              {isFiltersOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </button>

        {isFiltersOpen && (
          <div className="px-8 pb-8 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Periodo Temporale</label>
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                  {['today', 'week', '30days', 'month', 'prevMonth', 'custom'].map((id) => (
                    <button 
                      key={id} 
                      onClick={() => setPreset(id as RangePreset)} 
                      className={`flex-1 px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${preset === id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {id === 'today' ? 'Oggi' : id === 'week' ? '7g' : id === '30days' ? '30g' : id === 'month' ? 'Mese' : id === 'prevMonth' ? 'Mese Prec.' : 'Custom'}
                    </button>
                  ))}
                </div>
                {preset === 'custom' && (
                  <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in fade-in zoom-in-95">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-indigo-900 outline-none w-full" />
                    <span className="text-indigo-300 text-[10px]">→</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-indigo-900 outline-none w-full" />
                  </div>
                )}
              </div>

              {/* Project Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtra per Commessa</label>
                <select 
                  value={selectedProjectId} 
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Tutte le Commesse</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Activity Code Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtra per Attività</label>
                <select 
                  value={selectedActivityCode} 
                  onChange={(e) => setSelectedActivityCode(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Tutte le Attività</option>
                  {predefinedActivities.map(pa => (
                    <option key={pa.id} value={pa.code}>{pa.code} - {pa.description}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => {
                  setPreset('month');
                  setSelectedProjectId('all');
                  setSelectedActivityCode('all');
                }}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={14} />
                Reset Filtri
              </button>
            </div>
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
                <span className="text-2xl font-black text-slate-800">{formatHHMM(stats.totalHours)}</span>
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
                <span className="text-2xl font-black text-amber-500">{formatHHMM(stats.overtime)}</span>
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
                <span className="text-2xl font-black text-rose-500">{formatHHMM(stats.totalMissingHours)}</span>
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

          {/* Report CTA in-line if screen is large enough */}
          <div className="p-5 flex flex-wrap items-center justify-center bg-slate-50/50 gap-2">
            <button 
              onClick={handleExportPDF} 
              disabled={filteredActivities.length === 0} 
              className="flex-1 md:flex-none flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase rounded-2xl shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Printer size={14} /> 
              Esporta PDF
            </button>
            <button 
              onClick={handleExportExcel} 
              disabled={filteredActivities.length === 0} 
              className="flex-1 md:flex-none flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase rounded-2xl shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" /> 
              Esporta Excel
            </button>
          </div>
        </div>

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
                        <span className="text-[11px] md:text-xs font-black text-rose-500 text-center">-{formatHHMM(group.missingHours)}</span>
                      </div>
                    </>
                  )}
                  {group.overtimeHours > 0 && (
                    <>
                      <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                      <div className="flex flex-col items-center justify-center w-16 md:w-20">
                        <span className="text-[11px] md:text-xs font-black text-amber-500 text-center">+{formatHHMM(group.overtimeHours)}</span>
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
                    const predefined = predefinedActivities.find(pa => pa.code === activity.activityCode);
                    return (
                      <div key={activity.id} className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${project?.color || 'bg-slate-300'}`}></div>
                            <span className="text-[10px] font-black text-slate-700 truncate uppercase tracking-tight">{project?.name || 'Senza Commessa'}</span>
                          </div>
                          <div className="flex items-center gap-2 pl-3.5 border-l-2 border-slate-200">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-600 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {activity.activityCode}
                                </span>
                                {predefined && (
                                  <span className="text-[10px] font-bold text-indigo-500 uppercase">
                                    {predefined.description}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {activity.description || "Nessuna nota"}
                              </span>
                            </div>
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

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-indigo-600 text-white text-center relative">
              <button 
                onClick={() => setShowDonationModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Heart size={40} fill="currentColor" className="text-white" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Supporta il Progetto</h3>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2">Aiutaci a mantenere l'app gratuita</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed text-center">
                  Spero che questa funzione ti sia utile! Gestire questo strumento richiede tempo. Se apprezzi il mio lavoro, considera di offrirmi un caffè.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <a 
                  href="https://www.paypal.me/saxumb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <ExternalLink size={16} />
                  Fai una Donazione
                </a>
                
                <button 
                  onClick={handleConfirmExport}
                  className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-100 transition-all"
                >
                  Continua con l'esportazione
                </button>
              </div>
              
              <p className="text-[9px] text-slate-400 text-center uppercase font-bold tracking-widest">
                Grazie per il tuo supporto! ❤️
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
