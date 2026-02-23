
import React from 'react';
import { LayoutDashboard, ClipboardList, Briefcase, Settings } from 'lucide-react';

export const COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
  'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 
  'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'
];

export const CHART_COLORS = [
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', 
  '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#06b6d4'
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'log', label: 'Attività', icon: <ClipboardList size={20} /> },
  { id: 'projects', label: 'Commesse', icon: <Briefcase size={20} /> },
  { id: 'options', label: 'Opzioni', icon: <Settings size={20} /> },
];
