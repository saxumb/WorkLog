
import React, { useState, useRef, useMemo } from 'react';
import { Clock, ListTodo, Plus, Trash2, Tag, Download, Upload, ShieldCheck, Save, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react';
import { PredefinedActivity, Project, Activity, WeeklyWorkHours } from '../types';

interface SettingsManagerProps {
  weeklyWorkHours: WeeklyWorkHours;
  predefinedActivities: PredefinedActivity[];
  projects: Project[];
  activities: Activity[];
  companyLogo: string | null;
  companyHeader: string;
  onUpdateWeeklyHours: (hours: WeeklyWorkHours) => void;
  onUpdateLogo: (logo: string | null) => void;
  onUpdateHeader: (header: string) => void;
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
  weeklyWorkHours, predefinedActivities, projects, activities, companyLogo, companyHeader,
  onUpdateWeeklyHours, onUpdateLogo, onUpdateHeader, onAddPredefined, onDeletePredefined, onImportFullData, onManualExport
}) => {
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isWeeklyHoursOpen, setIsWeeklyHoursOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLogoOpen, setIsLogoOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onUpdateLogo(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors"><ListTodo size={20} /></div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Glossario Attività</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                  {isGlossaryOpen ? 'Modelli riutilizzabili' : `${predefinedActivities.length} modelli salvati`}
                </p>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-emerald-600 transition-colors">
              {isGlossaryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {isGlossaryOpen && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
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
          )}
        </div>

        {/* Local Backup Section */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setIsSecurityOpen(!isSecurityOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors"><ShieldCheck size={20} /></div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Sicurezza Dati</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                  Backup & Ripristino Locale
                </p>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-amber-600 transition-colors">
              {isSecurityOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {isSecurityOpen && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter px-2">Esporta un file .json sul computer per non perdere i lavori</p>
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
          )}
        </div>

        {/* Logo Section */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setIsLogoOpen(!isLogoOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors"><ImageIcon size={20} /></div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Personalizzazione PDF</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                  Logo Aziendale per i Report
                </p>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-rose-600 transition-colors">
              {isLogoOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {isLogoOpen && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="relative group">
                  <div className="w-32 h-32 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon size={32} className="text-slate-200" />
                    )}
                  </div>
                  {companyLogo && (
                    <button 
                      onClick={() => onUpdateLogo(null)}
                      className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h4 className="text-xs font-black text-slate-800 uppercase">Logo Aziendale</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                    Carica un'immagine (PNG/JPG) per personalizzare i tuoi report PDF. Verrà visualizzata in alto a destra.
                  </p>
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm"
                  >
                    {companyLogo ? 'Cambia Logo' : 'Seleziona Logo'}
                  </button>
                  <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <label className="text-xs font-black text-slate-800 uppercase ml-1 block">Intestazione Report (Dati Aziendali)</label>
                <textarea 
                  value={companyHeader}
                  onChange={(e) => onUpdateHeader(e.target.value)}
                  placeholder="Inserisci qui i dati della tua azienda, P.IVA, indirizzo, ecc. che appariranno in alto a sinistra nel PDF."
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all min-h-[100px] resize-none"
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter ml-1">
                  Questo testo apparirà nell'angolo in alto a sinistra del PDF esportato.
                </p>
              </div>
            </div>
          )}
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
