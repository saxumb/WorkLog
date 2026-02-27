
export interface Project {
  id: string;
  name: string;
  client: string;
  color: string;
}

export interface PredefinedActivity {
  id: string;
  code: string;
  description: string;
}

export interface Activity {
  id: string;
  projectId: string;
  activityCode: string;
  description: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string or null if running
  durationSeconds: number; // calculated or manual
}

export type View = 'dashboard' | 'log' | 'projects' | 'options';

export interface WeeklyWorkHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}
