
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
    <div className="min-h-screen bg-slate-50">
      {/* Unified Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className={`max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between ${!activeTimerId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center gap-6 py-1 md:py-2">
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as View)}
                  className={`px-4 py-1.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${
                    currentView === item.id 
                      ? 'bg-white text-indigo-700 shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {activeTimerId && (
              <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full animate-pulse border border-rose-200">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                <span className="text-[10px] font-bold uppercase tracking-tight">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden flex items-center justify-around p-1 bg-white border-t ${activeTimerId ? 'border-indigo-100' : 'border-slate-100'}`}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex-1 py-1.5 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                currentView === item.id 
                  ? 'text-indigo-700 bg-indigo-50/50' 
                  : 'text-slate-500 active:bg-slate-100'
              }`}
            >
              {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
              <span className={`text-[11px] font-black uppercase tracking-tight ${currentView === item.id ? 'opacity-100' : 'opacity-80'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
