
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { loadGoals, loadDailyProgress, loadTasks, formatDate } from '@/utils/storage';
import { Goal, DailyGoalProgress, Task } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Widget Component for Home Screen
 * 
 * Note: Full home screen widget functionality requires native configuration
 * and platform-specific setup (iOS: WidgetKit, Android: App Widgets).
 * This component provides the UI structure that can be adapted for native widgets.
 * 
 * For Expo apps, consider using expo-widget-kit (when available) or
 * implementing native modules for full widget support.
 */

export default function Widget() {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyGoalProgress[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    loadWidgetData();
    
    // Refresh widget data every minute
    const interval = setInterval(loadWidgetData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadWidgetData = async () => {
    try {
      const [loadedGoals, loadedProgress, loadedTasks] = await Promise.all([
        loadGoals(),
        loadDailyProgress(),
        loadTasks(),
      ]);

      setGoals(loadedGoals);
      setDailyProgress(loadedProgress);
      setTasks(loadedTasks);

      // Calculate completion rate
      if (loadedGoals.length > 0) {
        const today = formatDate(new Date());
        const completedToday = loadedProgress.filter(
          p => p.date === today && p.completed
        ).length;
        const rate = Math.round((completedToday / loadedGoals.length) * 100);
        setCompletionRate(rate);
      }
    } catch (error) {
      console.error('Error loading widget data:', error);
    }
  };

  const getUrgentImportantTasks = (): Task[] => {
    return tasks
      .filter(t => t.quadrant === 'urgent-important' && !t.completed)
      .slice(0, 3);
  };

  const urgentTasks = getUrgentImportantTasks();

  return (
    <View style={[styles.widget, { backgroundColor: colors.bg }]}>
      {/* Progress Circle */}
      <View style={styles.progressSection}>
        <View style={[styles.progressCircle, { backgroundColor: colors.highlight }]}>
          <View
            style={[
              styles.progressFill,
              {
                borderColor: colors.primary,
                transform: [{ rotate: `${(completionRate / 100) * 360}deg` }],
              },
            ]}
          />
          <View style={[styles.progressInner, { backgroundColor: colors.bg }]}>
            <Text style={[styles.progressText, { color: colors.text }]}>{completionRate}%</Text>
          </View>
        </View>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Objectifs du jour</Text>
      </View>

      {/* Key Tasks */}
      <View style={styles.tasksSection}>
        <Text style={[styles.tasksTitle, { color: colors.text }]}>🔥 Priorités</Text>
        {urgentTasks.length > 0 ? (
          urgentTasks.map((task, index) => (
            <View key={task.id} style={styles.taskItem}>
              <Text style={[styles.taskBullet, { color: colors.primary }]}>•</Text>
              <Text style={[styles.taskText, { color: colors.text }]} numberOfLines={1}>
                {task.title}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>Aucune tâche urgente</Text>
        )}
      </View>

      <Text style={[styles.widgetFooter, { color: colors.textSecondary }]}>Ouvre FocusFlow →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  progressFill: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#26A69A',
    borderRightColor: '#26A69A',
  },
  progressInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
  },
  tasksSection: {
    marginBottom: 12,
  },
  tasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskBullet: {
    fontSize: 16,
    marginRight: 8,
  },
  taskText: {
    fontSize: 12,
    flex: 1,
  },
  noTasksText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  widgetFooter: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
});
