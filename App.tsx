
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import EntryPanel from './components/EntryPanel';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import ProjectManager from './components/ProjectManager';
import SettingsManager from './components/SettingsManager';
import EditActivityModal from './components/EditActivityModal';
import ConfirmModal from './components/ConfirmModal';
import { Activity, Project, View, PredefinedActivity, WeeklyWorkHours } from './types';
import { NAV_ITEMS, COLORS } from './constants';

const INITIAL_PROJECTS: Project[] = [
  { id: '1', name: 'Sviluppo Web Interno', client: 'Azienda X', color: 'bg-blue-500' },
  { id: '2', name: 'Manutenzione Server', client: 'Cloud Service', color: 'bg-emerald-500' }
];

const DEFAULT_WEEKLY_HOURS: WeeklyWorkHours = {
  monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  
  // Data State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('wl_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('wl_activities');
    return saved ? JSON.parse(saved) : [];
  });
  const [predefinedActivities, setPredefinedActivities] = useState<PredefinedActivity[]>(() => {
    const saved = localStorage.getItem('wl_predefined');
    return saved ? JSON.parse(saved) : [];
  });
  const [weeklyWorkHours, setWeeklyWorkHours] = useState<WeeklyWorkHours>(() => {
    const saved = localStorage.getItem('wl_weekly_hours');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    // Fallback for migration from old dailyWorkHours
    const oldDaily = localStorage.getItem('wl_daily_hours');
    if (oldDaily) {
      const hours = parseFloat(oldDaily);
      return { ...DEFAULT_WEEKLY_HOURS, monday: hours, tuesday: hours, wednesday: hours, thursday: hours, friday: hours };
    }
    return DEFAULT_WEEKLY_HOURS;
  });

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Persistence
  useEffect(() => localStorage.setItem('wl_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('wl_activities', JSON.stringify(activities)), [activities]);
  useEffect(() => localStorage.setItem('wl_predefined', JSON.stringify(predefinedActivities)), [predefinedActivities]);
  useEffect(() => localStorage.setItem('wl_weekly_hours', JSON.stringify(weeklyWorkHours)), [weeklyWorkHours]);

  // Actions
  const addProject = (p: Omit<Project, 'id'>) => {
    const lastColor = projects.length > 0 ? projects[projects.length - 1].color : null;
    const availableColors = COLORS.filter(c => c !== lastColor);
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    setProjects(prev => [...prev, { ...p, id: Date.now().toString(), color: randomColor }]);
  };

  const updateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProject = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Elimina Commessa',
      message: 'Sei sicuro di voler eliminare questa commessa? Tutte le attività associate rimarranno ma non avranno più un riferimento al progetto.',
      onConfirm: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addPredefined = (pa: Omit<PredefinedActivity, 'id'>) => setPredefinedActivities(prev => [...prev, { ...pa, id: Date.now().toString() }]);
  
  const deletePredefined = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Elimina dal Glossario',
      message: 'Sei sicuro di voler eliminare questa attività dal glossario? Non potrai più selezionarla rapidamente.',
      onConfirm: () => {
        setPredefinedActivities(prev => prev.filter(pa => pa.id !== id));
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteActivity = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Elimina Attività',
      message: 'Sei sicuro di voler eliminare questa attività dal registro? Questa azione non può essere annullata.',
      onConfirm: () => {
        setActivities(prev => prev.filter(a => a.id !== id));
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const startTimer = (projectId: string, activityCode: string, description: string) => {
    const newActivity: Activity = { id: Date.now().toString(), projectId, activityCode, description: description || "", startTime: new Date().toISOString(), endTime: null, durationSeconds: 0 };
    setActivities(prev => [...prev, newActivity]);
  };

  const stopTimer = () => {
    setActivities(prev => prev.map(a => {
      if (!a.endTime) {
        const end = new Date();
        const start = new Date(a.startTime);
        const diff = Math.max(Math.floor((end.getTime() - start.getTime()) / 1000), 900);
        return { ...a, endTime: end.toISOString(), durationSeconds: diff };
      }
      return a;
    }));
  };

  const addManualActivity = (projectId: string, activityCode: string, description: string, dateStr: string, durationSeconds: number) => {
    const date = new Date(dateStr); date.setHours(18, 0, 0);
    const endTime = date.toISOString();
    const startTime = new Date(date.getTime() - durationSeconds * 1000).toISOString();
    const newActivity: Activity = { id: Date.now().toString(), projectId, activityCode, description, startTime, endTime, durationSeconds };
    setActivities(prev => [...prev, newActivity]);
  };

  const importFullData = (data: any, shouldConfirm: boolean) => {
    const performImport = () => {
      if (data.projects) localStorage.setItem('wl_projects', JSON.stringify(data.projects));
      if (data.activities) localStorage.setItem('wl_activities', JSON.stringify(data.activities));
      if (data.predefined) localStorage.setItem('wl_predefined', JSON.stringify(data.predefined));
      if (data.weeklyHours) localStorage.setItem('wl_weekly_hours', JSON.stringify(data.weeklyHours));
      window.location.reload();
    };

    if (shouldConfirm) {
      setConfirmConfig({
        isOpen: true,
        title: 'Ripristina Backup',
        message: 'Sei sicuro di voler ripristinare i dati dal file di backup? Questa operazione sovrascriverà tutti i dati correnti e ricaricherà la pagina.',
        onConfirm: performImport
      });
    } else {
      performImport();
    }
  };

  const activeActivity = activities.find(a => !a.endTime) || null;

  return (
    <Layout currentView={view} setView={setView} activeTimerId={activeActivity?.id || null}>
      <div className="space-y-6">
        <div className="flex p-1.5 bg-slate-200/60 rounded-[20px] w-full">
          {NAV_ITEMS.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id as View)} 
              className={`flex-1 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                view === item.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(activeActivity || view === 'log') && (
          <EntryPanel projects={projects} activeActivity={activeActivity} activities={activities} predefinedActivities={predefinedActivities} weeklyWorkHours={weeklyWorkHours} onStart={startTimer} onStop={stopTimer} onManualAdd={addManualActivity} />
        )}

        {view === 'dashboard' && <Dashboard activities={activities} projects={projects} weeklyWorkHours={weeklyWorkHours} onDeleteActivity={deleteActivity} onEditActivity={(a) => setEditingActivity(a)} />}
        {view === 'projects' && <ProjectManager projects={projects} onAdd={addProject} onDelete={deleteProject} onUpdate={updateProject} />}
        {view === 'options' && (
          <SettingsManager 
            weeklyWorkHours={weeklyWorkHours} 
            predefinedActivities={predefinedActivities} 
            projects={projects} 
            activities={activities} 
            onUpdateWeeklyHours={setWeeklyWorkHours} 
            onAddPredefined={addPredefined} 
            onDeletePredefined={deletePredefined} 
            onImportFullData={importFullData} 
            onManualExport={() => { const d = { projects, activities, predefined: predefinedActivities, weeklyHours: weeklyWorkHours }; const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'worklog_backup.json'; link.click(); }}
          />
        )}
      </div>
      {editingActivity && <EditActivityModal activity={editingActivity} projects={projects} predefinedActivities={predefinedActivities} onSave={(updated) => { setActivities(prev => prev.map(a => a.id === updated.id ? updated : a)); setEditingActivity(null); }} onClose={() => setEditingActivity(null)} />}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </Layout>
  );
};

export default App;
