
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { Project } from '../types';

interface ProjectManagerProps {
  projects: Project[];
  onAdd: (project: Omit<Project, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (project: Project) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onAdd, onDelete, onUpdate }) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !client) return;
    
    if (editingId) {
      const existing = projects.find(p => p.id === editingId);
      if (existing) {
        onUpdate({ ...existing, name, client });
      }
      setEditingId(null);
    } else {
      onAdd({ name, client, color: '' }); // Color is handled randomly in App.tsx
    }
    
    setName('');
    setClient('');
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setName(project.name);
    setClient(project.client);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setClient('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Modifica Commessa' : 'Nuova Commessa'}</h2>
          <p className="text-xs text-slate-500">Crea e organizza i tuoi progetti di lavoro</p>
        </div>
        {editingId && (
          <button onClick={cancelEdit} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Progetto</label>
              <input
                type="text"
                placeholder="es: Sviluppo App Mobile"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cliente / Committente</label>
              <input
                type="text"
                placeholder="es: ACME Corp"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full md:w-auto px-8 py-3.5 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm`}
          >
            {editingId ? <Check size={18} /> : <Plus size={18} />}
            {editingId ? 'SALVA MODIFICHE' : 'AGGIUNGI COMMESSA'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className={`bg-white rounded-[1.5rem] p-5 border ${editingId === project.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all relative group`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${project.color} shadow-sm`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.client}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight pr-12">{project.name}</h3>
            
            <div className="absolute top-5 right-5 flex items-center gap-1">
              <button
                onClick={() => startEdit(project)}
                className="p-1.5 text-slate-400 md:text-slate-300 hover:text-indigo-600 transition-colors md:opacity-0 md:group-hover:opacity-100"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(project.id)}
                className="p-1.5 text-slate-400 md:text-slate-300 hover:text-rose-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
            <p className="text-sm">Nessuna commessa presente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;
