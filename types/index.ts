
export interface Event {
  id: string;
  title: string;
  color: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  quadrant: 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'neither';
  completed: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category?: string;
  createdAt: string;
}

export interface DailyGoalProgress {
  date: string; // YYYY-MM-DD format
  goalId: string;
  completed: boolean;
}

export interface GoalStats {
  goalId: string;
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}
