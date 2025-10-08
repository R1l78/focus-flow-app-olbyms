
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
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
          body: '🕢 Pense à valider tes objectifs du jour dans FocusFlow Premium !',
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
