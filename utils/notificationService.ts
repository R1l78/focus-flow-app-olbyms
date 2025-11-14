
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { loadTasks, loadGoals, loadDailyProgress, formatDate } from '@/utils/storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldSetBadge: false,
    shouldPlaySound: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // For Android, create notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('focusflow-reminders', {
          name: 'FocusFlow Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ADD8E6',
        });

        await Notifications.setNotificationChannelAsync('focusflow-goals', {
          name: 'FocusFlow Daily Goals',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#26A69A',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async updateDailyGoalsNotification(): Promise<void> {
    try {
      const goals = await loadGoals();
      const dailyProgress = await loadDailyProgress();
      const today = formatDate(new Date());

      if (goals.length === 0) {
        // Cancel notification if no goals
        await this.cancelNotification('daily-goals-progress');
        return;
      }

      // Get unfinished goals for today
      const unfinishedGoals = goals.filter(goal => {
        const progress = dailyProgress.find(
          p => p.goalId === goal.id && p.date === today && p.completed
        );
        return !progress;
      });

      let title = '📋 Objectifs du jour';
      let body = '';

      if (unfinishedGoals.length === 0) {
        title = '✅ Bravo !';
        body = 'Tous tes objectifs du jour sont accomplis !';
      } else {
        const goalTitles = unfinishedGoals.slice(0, 3).map(g => g.title).join(', ');
        body = `À faire : ${goalTitles}${unfinishedGoals.length > 3 ? '...' : ''}`;
      }

      // Schedule or update the notification
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-goals-progress',
        content: {
          title,
          body,
          data: { type: 'daily-goals-progress' },
          sticky: true,
        },
        trigger: null, // Show immediately
      });

      console.log('Daily goals notification updated');
    } catch (error) {
      console.error('Error updating daily goals notification:', error);
    }
  }

  static async scheduleDailyGoalsReminder(): Promise<void> {
    try {
      // Cancel existing daily reminder
      await this.cancelNotification('daily-goals-reminder');

      // Schedule daily notification at 8:30 PM
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-goals-reminder',
        content: {
          title: 'FocusFlow Premium',
          body: '🕢 Pense à valider tes objectifs du jour dans FocusFlow !',
          data: { type: 'daily-goals' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 30,
          repeats: true,
        },
      });

      console.log('Daily goals reminder scheduled for 8:30 PM');
    } catch (error) {
      console.error('Error scheduling daily goals reminder:', error);
    }
  }

  static async scheduleWeeklyReminders(): Promise<void> {
    try {
      // Cancel existing weekly reminders
      await this.cancelNotification('weekly-planning-reminder');
      await this.cancelNotification('weekly-priorities-reminder');

      // Saturday 6:00 PM - Planning reminder
      await Notifications.scheduleNotificationAsync({
        identifier: 'weekly-planning-reminder',
        content: {
          title: 'FocusFlow Premium',
          body: '🗓️ Planifie ta semaine dans ton emploi du temps.',
          data: { type: 'weekly-planning' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 7, // Saturday (1 = Sunday, 7 = Saturday)
          hour: 18,
          minute: 0,
          repeats: true,
        },
      });

      // Sunday 6:30 PM - Priorities reminder
      await Notifications.scheduleNotificationAsync({
        identifier: 'weekly-priorities-reminder',
        content: {
          title: 'FocusFlow Premium',
          body: '💡 Mets à jour ta matrice de priorités pour bien commencer la semaine.',
          data: { type: 'weekly-priorities' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday
          hour: 18,
          minute: 30,
          repeats: true,
        },
      });

      console.log('Weekly reminders scheduled');
    } catch (error) {
      console.error('Error scheduling weekly reminders:', error);
    }
  }

  static async schedulePrioritiesReminders(): Promise<void> {
    try {
      const allTasks = await loadTasks();
      if (!allTasks || allTasks.length === 0) return;

      // Filter by quadrants
      const urgentImportant = allTasks.filter(t => t.quadrant === 'urgent-important' && !t.completed);
      const importantNotUrgent = allTasks.filter(t => t.quadrant === 'important-not-urgent' && !t.completed);
      const urgentNotImportant = allTasks.filter(t => t.quadrant === 'urgent-not-important' && !t.completed);

      // Morning reminder - urgent & important task
      if (urgentImportant.length > 0) {
        const randomTask = urgentImportant[Math.floor(Math.random() * urgentImportant.length)];
        await Notifications.scheduleNotificationAsync({
          identifier: 'priority-urgent-important',
          content: {
            title: '🔥 Rappel prioritaire',
            body: `Pense à "${randomTask.title}" — c'est urgent et important !`,
            data: { type: 'urgent-important' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 9,
            minute: 0,
            repeats: true,
          },
        });
      }

      // Noon reminder - important but not urgent task
      if (importantNotUrgent.length > 0) {
        const randomTask = importantNotUrgent[Math.floor(Math.random() * importantNotUrgent.length)];
        await Notifications.scheduleNotificationAsync({
          identifier: 'priority-important-not-urgent',
          content: {
            title: '📋 Temps pour avancer',
            body: `As-tu pensé à "${randomTask.title}" ? C'est important pour ton futur !`,
            data: { type: 'important-not-urgent' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 13,
            minute: 0,
            repeats: true,
          },
        });
      }

      // Evening reminder - urgent but not important task
      if (urgentNotImportant.length > 0) {
        const randomTask = urgentNotImportant[Math.floor(Math.random() * urgentNotImportant.length)];
        await Notifications.scheduleNotificationAsync({
          identifier: 'priority-urgent-not-important',
          content: {
            title: '⚡ Petit rappel',
            body: `Prends un peu de temps pour "${randomTask.title}" avant la fin de la journée.`,
            data: { type: 'urgent-not-important' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 18,
            minute: 30,
            repeats: true,
          },
        });
      }

      console.log('Priority reminders scheduled');
    } catch (error) {
      console.error('Error scheduling priority reminders:', error);
    }
  }

  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error(`Error canceling notification ${identifier}:`, error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications canceled');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  static async initializeNotifications(): Promise<void> {
    try {
      const hasPermissions = await this.requestPermissions();
      
      if (hasPermissions) {
        await this.scheduleDailyGoalsReminder();
        await this.scheduleWeeklyReminders();
        await this.schedulePrioritiesReminders();
        await this.updateDailyGoalsNotification();
        console.log('All notifications initialized successfully');
      } else {
        console.log('Notifications not initialized - permissions not granted');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}
