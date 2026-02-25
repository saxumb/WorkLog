
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Project } from '../types';
import { COLORS } from '../constants';

interface ProjectManagerProps {
  projects: Project[];
  onAdd: (project: Omit<Project, 'id'>) => void;
  onDelete: (id: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onAdd, onDelete }) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !client) return;
    onAdd({ name, client, color: selectedColor });
    setName('');
    setClient('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Nuova Commessa</h2>
        <p className="text-xs text-slate-500">Crea e organizza i tuoi progetti di lavoro</p>
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

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Colore Identificativo</label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color} transition-all transform hover:scale-110 flex items-center justify-center ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-indigo-400 scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} />
            AGGIUNGI COMMESSA
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-[1.5rem] p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${project.color} shadow-sm`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.client}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{project.name}</h3>
            
            <button
              onClick={() => onDelete(project.id)}
              className="absolute top-5 right-5 p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
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
