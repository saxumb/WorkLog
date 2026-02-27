
import React, { useState, useRef, useMemo } from 'react';
import { Clock, ListTodo, Plus, Trash2, Tag, Download, Upload, ShieldCheck, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { PredefinedActivity, Project, Activity, WeeklyWorkHours } from '../types';

interface SettingsManagerProps {
  weeklyWorkHours: WeeklyWorkHours;
  predefinedActivities: PredefinedActivity[];
  projects: Project[];
  activities: Activity[];
  onUpdateWeeklyHours: (hours: WeeklyWorkHours) => void;
  onAddPredefined: (pa: Omit<PredefinedActivity, 'id'>) => void;
  onDeletePredefined: (id: string) => void;
  onImportFullData: (data: any, confirm: boolean) => void;
  onManualExport: () => void;
}

const DAYS_OF_WEEK: { key: keyof WeeklyWorkHours; label: string }[] = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
];

const SettingsManager: React.FC<SettingsManagerProps> = ({ 
  weeklyWorkHours, predefinedActivities, projects, activities,
  onUpdateWeeklyHours, onAddPredefined, onDeletePredefined, onImportFullData, onManualExport
}) => {
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isWeeklyHoursOpen, setIsWeeklyHoursOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalWeeklyHours = useMemo(() => {
    return (Object.values(weeklyWorkHours) as number[]).reduce((acc, curr) => acc + curr, 0);
  }, [weeklyWorkHours]);

  const handleDayHoursChange = (day: keyof WeeklyWorkHours, val: string) => {
    const parsed = parseFloat(val);
    onUpdateWeeklyHours({
      ...weeklyWorkHours,
      [day]: isNaN(parsed) ? 0 : parsed
    });
  };

  const handleAddPredefined = () => {
    if (!newCode.trim() || !newDesc.trim()) return;
    onAddPredefined({ code: newCode.trim(), description: newDesc.trim() });
    setNewCode(''); setNewDesc('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { 
        const data = JSON.parse(event.target?.result as string); 
        onImportFullData(data, true);
      } catch (err) { 
        alert("File non valido."); 
      }
    };
    reader.readAsText(file); e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto pb-24 px-4 md:px-0">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Impostazioni</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configurazione & Backup Locale</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Weekly Threshold Section */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setIsWeeklyHoursOpen(!isWeeklyHoursOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors"><Clock size={20} /></div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Soglia Ore Settimanali</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                  {isWeeklyHoursOpen ? 'Limite ore per giorno' : `Totale settimanale: ${totalWeeklyHours}h`}
                </p>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
              {isWeeklyHoursOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
          
          {isWeeklyHoursOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 animate-in fade-in zoom-in-95 duration-200">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none truncate">{day.label.substring(0, 3)}</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      min="0" 
                      max="24" 
                      step="0.5" 
                      value={weeklyWorkHours[day.key]} 
                      onChange={(e) => handleDayHoursChange(day.key, e.target.value)} 
                      className="w-full p-1 bg-white border border-slate-200 rounded-lg text-right font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-[11px]"
                    />
                    <span className="text-[8px] font-black text-slate-400 uppercase">h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Predefined Activities */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ListTodo size={20} /></div>
            <div><h3 className="text-sm font-bold text-slate-800 uppercase">Glossario Attività</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Modelli riutilizzabili</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <input type="text" placeholder="Codice" value={newCode} onChange={(e) => setNewCode(e.target.value)} className="md:col-span-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none" />
            <input type="text" placeholder="Descrizione attività..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="md:col-span-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
            <button onClick={handleAddPredefined} disabled={!newCode || !newDesc} className="md:col-span-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-100"><Plus size={14} /> Aggiungi</button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {predefinedActivities.map((pa) => (
              <div key={pa.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 group transition-all">
                <div className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-[9px] font-black border border-slate-200 uppercase">{pa.code}</div>
                <p className="text-xs font-medium text-slate-700 flex-1">{pa.description}</p>
                <button onClick={() => onDeletePredefined(pa.id)} className="p-2 text-slate-400 md:text-slate-200 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
              </div>
            ))}
            {predefinedActivities.length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <Tag className="mx-auto text-slate-200 mb-2" size={24} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nessuna attività salvata</p>
              </div>
            )}
          </div>
        </div>

        {/* Local Backup Section */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ShieldCheck size={24} /></div>
             <div>
               <h4 className="text-sm font-black text-slate-800 uppercase">Sicurezza Dati</h4>
               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Esporta un file .json sul computer per non perdere i lavori</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={onManualExport} className="flex items-center justify-between p-6 bg-slate-800 hover:bg-slate-900 text-white rounded-[2rem] transition-all group">
              <div className="text-left">
                <span className="block text-xs font-black uppercase mb-1">Esporta Backup</span>
                <span className="block text-[10px] text-slate-400">Salva un file .json locale</span>
              </div>
              <Download size={24} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-6 bg-white border border-slate-200 hover:border-indigo-300 text-slate-800 rounded-[2rem] transition-all group">
              <div className="text-left">
                <span className="block text-xs font-black uppercase mb-1">Importa Backup</span>
                <span className="block text-[10px] text-slate-400">Ripristina da un file locale</span>
              </div>
              <Upload size={24} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-4">
        <Save size={14} className="text-indigo-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tutte le modifiche vengono salvate nel browser</p>
      </div>
    </div>
  );
};

export default SettingsManager;
