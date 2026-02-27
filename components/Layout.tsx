
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  activeTimerId: string | null;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, activeTimerId }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Mobile Header - Semplificato */}
      <header className="md:hidden bg-white border-b px-4 py-2.5 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-lg font-bold text-indigo-600">WorkLog AI</h1>
        {activeTimerId && (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full animate-pulse border border-rose-200">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            <span className="text-[10px] font-bold uppercase tracking-tight">Live</span>
          </div>
        )}
      </header>

      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600">WorkLog AI</h1>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Timesheet Manager</p>
        </div>
        <div className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
