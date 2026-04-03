
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
          <div className="flex items-center gap-6 py-2 md:py-4">
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as View)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    currentView === item.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
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
        <div className={`md:hidden flex items-center justify-around p-1 bg-slate-50/50 ${activeTimerId ? 'border-t' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                currentView === item.id ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
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
