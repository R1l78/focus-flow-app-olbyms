
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Task, Goal, DailyGoalProgress } from '../types';

const STORAGE_KEYS = {
  EVENTS: '@focusflow_events',
  TASKS: '@focusflow_tasks',
  GOALS: '@focusflow_goals',
  DAILY_PROGRESS: '@focusflow_daily_progress',
};

// Events Storage
export const saveEvents = async (events: Event[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    console.log('Events saved successfully');
  } catch (error) {
    console.error('Error saving events:', error);
  }
};

export const loadEvents = async (): Promise<Event[]> => {
  try {
    const eventsJson = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
    if (eventsJson) {
      const events = JSON.parse(eventsJson);
      console.log('Events loaded successfully:', events.length);
      return events;
    }
    return [];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
};

// Tasks Storage
export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    console.log('Tasks saved successfully');
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

export const loadTasks = async (): Promise<Task[]> => {
  try {
    const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    if (tasksJson) {
      const tasks = JSON.parse(tasksJson);
      console.log('Tasks loaded successfully:', tasks.length);
      return tasks;
    }
    return [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

// Goals Storage
export const saveGoals = async (goals: Goal[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    console.log('Goals saved successfully');
  } catch (error) {
    console.error('Error saving goals:', error);
  }
};

export const loadGoals = async (): Promise<Goal[]> => {
  try {
    const goalsJson = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    if (goalsJson) {
      const goals = JSON.parse(goalsJson);
      console.log('Goals loaded successfully:', goals.length);
      return goals;
    }
    return [];
  } catch (error) {
    console.error('Error loading goals:', error);
    return [];
  }
};

// Daily Progress Storage
export const saveDailyProgress = async (progress: DailyGoalProgress[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(progress));
    console.log('Daily progress saved successfully');
  } catch (error) {
    console.error('Error saving daily progress:', error);
  }
};

export const loadDailyProgress = async (): Promise<DailyGoalProgress[]> => {
  try {
    const progressJson = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    if (progressJson) {
      const progress = JSON.parse(progressJson);
      console.log('Daily progress loaded successfully:', progress.length);
      return progress;
    }
    return [];
  } catch (error) {
    console.error('Error loading daily progress:', error);
    return [];
  }
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};

export const parseDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(`${dateStr}T${timeStr}:00`);
};
