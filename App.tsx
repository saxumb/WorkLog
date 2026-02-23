
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import EntryPanel from './components/EntryPanel';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import ProjectManager from './components/ProjectManager';
import SettingsManager from './components/SettingsManager';
import EditActivityModal from './components/EditActivityModal';
import { Activity, Project, View, PredefinedActivity } from './types';
import { NAV_ITEMS } from './constants';

const INITIAL_PROJECTS: Project[] = [
  { id: '1', name: 'Sviluppo Web Interno', client: 'Azienda X', color: 'bg-blue-500' },
  { id: '2', name: 'Manutenzione Server', client: 'Cloud Service', color: 'bg-emerald-500' }
];

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
  const [dailyWorkHours, setDailyWorkHours] = useState<number>(() => {
    const saved = localStorage.getItem('wl_daily_hours');
    return saved ? parseFloat(saved) : 8;
  });

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Persistence
  useEffect(() => localStorage.setItem('wl_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('wl_activities', JSON.stringify(activities)), [activities]);
  useEffect(() => localStorage.setItem('wl_predefined', JSON.stringify(predefinedActivities)), [predefinedActivities]);
  useEffect(() => localStorage.setItem('wl_daily_hours', dailyWorkHours.toString()), [dailyWorkHours]);

  // Actions
  const addProject = (p: Omit<Project, 'id'>) => setProjects(prev => [...prev, { ...p, id: Date.now().toString() }]);
  const deleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));
  const addPredefined = (pa: Omit<PredefinedActivity, 'id'>) => setPredefinedActivities(prev => [...prev, { ...pa, id: Date.now().toString() }]);
  const deletePredefined = (id: string) => setPredefinedActivities(prev => prev.filter(pa => pa.id !== id));

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

  const importFullData = (data: any) => {
    if (data.projects) localStorage.setItem('wl_projects', JSON.stringify(data.projects));
    if (data.activities) localStorage.setItem('wl_activities', JSON.stringify(data.activities));
    if (data.predefined) localStorage.setItem('wl_predefined', JSON.stringify(data.predefined));
    if (data.dailyHours !== undefined) localStorage.setItem('wl_daily_hours', data.dailyHours.toString());
    window.location.reload();
  };

  const activeActivity = activities.find(a => !a.endTime) || null;

  return (
    <Layout currentView={view} setView={setView} activeTimerId={activeActivity?.id || null}>
      <div className="space-y-6">
        <div className="flex p-1.5 bg-slate-200/60 rounded-[20px] w-full">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setView(item.id as View)} className={`flex-1 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-wider transition-all duration-200 ${view === item.id ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50' : 'text-slate-500 hover:text-slate-700'}`}>{item.label}</button>
          ))}
        </div>

        {(activeActivity || view === 'log') && (
          <EntryPanel projects={projects} activeActivity={activeActivity} activities={activities} predefinedActivities={predefinedActivities} dailyWorkHours={dailyWorkHours} onStart={startTimer} onStop={stopTimer} onManualAdd={addManualActivity} />
        )}

        {view === 'dashboard' && <Dashboard activities={activities} projects={projects} dailyWorkHours={dailyWorkHours} onDeleteActivity={(id) => setActivities(prev => prev.filter(a => a.id !== id))} onEditActivity={(a) => setEditingActivity(a)} />}
        {view === 'projects' && <ProjectManager projects={projects} onAdd={addProject} onDelete={deleteProject} />}
        {view === 'options' && (
          <SettingsManager 
            dailyWorkHours={dailyWorkHours} 
            predefinedActivities={predefinedActivities} 
            projects={projects} 
            activities={activities} 
            onUpdateDailyHours={setDailyWorkHours} 
            onAddPredefined={addPredefined} 
            onDeletePredefined={deletePredefined} 
            onImportFullData={importFullData} 
            onManualExport={() => { const d = { projects, activities, predefined: predefinedActivities, dailyHours: dailyWorkHours }; const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'worklog_backup.json'; link.click(); }}
          />
        )}
      </div>
      {editingActivity && <EditActivityModal activity={editingActivity} projects={projects} predefinedActivities={predefinedActivities} onSave={(updated) => { setActivities(prev => prev.map(a => a.id === updated.id ? updated : a)); setEditingActivity(null); }} onClose={() => setEditingActivity(null)} />}
    </Layout>
  );
};

export default App;
