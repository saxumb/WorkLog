
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onConfirm}
              className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-100"
            >
              Elimina
            </button>
            <button 
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
