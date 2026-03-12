import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deepLinkingService } from './deeplinking';
import { analytics } from './analytics';
import { reportError } from './sentry';

// Notification service
export class NotificationService {
  private static instance: NotificationService;
  private notificationHandlers: Map<string, (notification: Notifications.Notification) => void> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notifications
  async initialize(): Promise<boolean> {
    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      const permission = await this.requestPermissions();
      if (!permission) {
        console.warn('Notification permissions denied');
        return false;
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        await this.savePushToken(token);
      }

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'notification_initialize' });
      return false;
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        return status === 'granted';
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      reportError(error as Error, { context: 'notification_permissions' });
      return false;
    }
  }

  // Get push token
  async getPushToken(): Promise<string | null> {
    try {
      const { data } = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      return data;
    } catch (error) {
      reportError(error as Error, { context: 'notification_get_token' });
      return null;
    }
  }

  // Save push token to storage and backend
  private async savePushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('push_token', token);
      
      // Here you would also send the token to your backend
      // await updateUserPushToken(token);
      
      console.log('Push token saved:', token);
    } catch (error) {
      reportError(error as Error, { context: 'notification_save_token' });
    }
  }

  // Set up notification listeners
  private setupNotificationListeners(): void {
    // Handle notification received when app is in foreground
    Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationResponse(response);
    });

    // Handle notification received when app is in background
    Notifications.addNotificationReceivedListener(notification => {
      this.handleNotificationReceived(notification);
    });
  }

  // Handle notification response (user taps notification)
  private async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const { notification } = response;
      const data = notification.request.content.data;

      console.log('Notification tapped:', data);

      // Track notification interaction
      analytics.trackCustomEvent('Notification Tapped', {
        title: notification.request.content.title,
        data: data
      });

      // Handle deep linking from notification
      if (data && (data as any).deepLink) {
        await deepLinkingService.handleUrl((data as any).deepLink);
      }
      
      // Call custom handler if registered
      const type = (data as any).type || 'default';
      const handler = this.notificationHandlers.get(type);
      if (handler) {
        handler(notification);
      }
    } catch (error) {
      reportError(error as Error, { context: 'notification_response' });
    }
  }

  // Handle notification received in background
  private async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    try {
      const data = notification.request.content.data;

      console.log('Notification received:', data);

      // Track notification received
      analytics.trackCustomEvent('Notification Received', {
        title: notification.request.content.title,
        data: data
      });
    } catch (error) {
      reportError(error as Error, { context: 'notification_received' });
    }
  }

  // Schedule local notification
  async scheduleNotification(options: {
    title: string;
    body: string;
    data?: any;
    trigger?: Notifications.NotificationTriggerInput;
    channelId?: string;
  }): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
        },
        trigger: options.trigger || null,
      });

      console.log('Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      reportError(error as Error, { context: 'notification_schedule', options });
      return null;
    }
  }

  // Schedule meal reminder
  async scheduleMealReminder(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    time: Date,
    userId: string
  ): Promise<string | null> {
    try {
      const titles = {
        breakfast: '¡Hora del desayuno! 🍳',
        lunch: '¡Hora del almuerzo! 🥗',
        dinner: '¡Hora de la cena! 🍽️',
        snack: '¡Hora del snack! 🍎'
      };

      const bodies = {
        breakfast: 'Registra tu desayuno para empezar el día con energía',
        lunch: 'No olvides registrar tu almuerzo',
        dinner: 'Es hora de registrar tu cena',
        snack: 'Un snack saludable para mantener tu energía'
      };

      return await this.scheduleNotification({
        title: titles[mealType],
        body: bodies[mealType],
        data: {
          type: 'meal_reminder',
          mealType,
          userId,
          deepLink: `notfat://meal?action=log`
        },
        trigger: {
          hour: time.getHours(),
          minute: time.getMinutes(),
          repeats: true,
        } as Notifications.NotificationTriggerInput,
        channelId: 'meal_reminders'
      });
    } catch (error) {
      reportError(error as Error, { context: 'notification_meal_reminder', mealType, time });
      return null;
    }
  }

  // Schedule water reminder
  async scheduleWaterReminder(time: Date, userId: string): Promise<string | null> {
    try {
      return await this.scheduleNotification({
        title: '¡Recuerda hidratarte! 💧',
        body: 'Es momento de registrar tu consumo de agua',
        data: {
          type: 'water_reminder',
          userId,
          deepLink: `notfat://water?action=log`
        },
        trigger: {
          hour: time.getHours(),
          minute: time.getMinutes(),
          repeats: true,
        } as Notifications.NotificationTriggerInput,
        channelId: 'water_reminders'
      });
    } catch (error) {
      reportError(error as Error, { context: 'notification_water_reminder', time });
      return null;
    }
  }

  // Schedule goal achievement notification
  async scheduleGoalAchievement(
    goalType: string,
    achievement: string,
    userId: string
  ): Promise<string | null> {
    try {
      return await this.scheduleNotification({
        title: '¡Meta alcanzada! 🎉',
        body: achievement,
        data: {
          type: 'goal_achieved',
          goalType,
          userId,
          deepLink: `notfat://progress`
        },
        channelId: 'achievements'
      });
    } catch (error) {
      reportError(error as Error, { context: 'notification_goal_achievement', goalType });
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
      return true;
    } catch (error) {
      reportError(error as Error, { context: 'notification_cancel', notificationId });
      return false;
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
      return true;
    } catch (error) {
      reportError(error as Error, { context: 'notification_cancel_all' });
      return false;
    }
  }

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      reportError(error as Error, { context: 'notification_get_scheduled' });
      return [];
    }
  }

  // Get notification badge count
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      reportError(error as Error, { context: 'notification_get_badge' });
      return 0;
    }
  }

  // Set notification badge count
  async setBadgeCount(count: number): Promise<boolean> {
    try {
      await Notifications.setBadgeCountAsync(count);
      return true;
    } catch (error) {
      reportError(error as Error, { context: 'notification_set_badge', count });
      return false;
    }
  }

  // Clear notification badge
  async clearBadge(): Promise<boolean> {
    try {
      await Notifications.setBadgeCountAsync(0);
      return true;
    } catch (error) {
      reportError(error as Error, { context: 'notification_clear_badge' });
      return false;
    }
  }

  // Register custom notification handler
  registerNotificationHandler(
    type: string,
    handler: (notification: Notifications.Notification) => void
  ): void {
    this.notificationHandlers.set(type, handler);
  }

  // Unregister notification handler
  unregisterNotificationHandler(type: string): void {
    this.notificationHandlers.delete(type);
  }

  // Create notification channels (Android)
  async createNotificationChannels(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meal_reminders', {
          name: 'Meal Reminders',
          description: 'Reminders for logging your meals',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('water_reminders', {
          name: 'Water Reminders',
          description: 'Reminders for staying hydrated',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          enableVibrate: false,
        });

        await Notifications.setNotificationChannelAsync('achievements', {
          name: 'Achievements',
          description: 'Notifications for goal achievements',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('updates', {
          name: 'App Updates',
          description: 'Notifications about app updates and new features',
          importance: Notifications.AndroidImportance.LOW,
          sound: 'default',
          enableVibrate: false,
        });
      }
    } catch (error) {
      reportError(error as Error, { context: 'notification_channels' });
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// React hook for notifications
export const useNotifications = () => {
  const scheduleMealReminder = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    time: Date,
    userId: string
  ): Promise<string | null> => {
    return await notificationService.scheduleMealReminder(mealType, time, userId);
  };

  const scheduleWaterReminder = async (
    time: Date,
    userId: string
  ): Promise<string | null> => {
    return await notificationService.scheduleWaterReminder(time, userId);
  };

  const cancelNotification = async (notificationId: string): Promise<boolean> => {
    return await notificationService.cancelNotification(notificationId);
  };

  const cancelAllNotifications = async (): Promise<boolean> => {
    return await notificationService.cancelAllNotifications();
  };

  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    return await notificationService.getScheduledNotifications();
  };

  const getBadgeCount = async (): Promise<number> => {
    return await notificationService.getBadgeCount();
  };

  const setBadgeCount = async (count: number): Promise<boolean> => {
    return await notificationService.setBadgeCount(count);
  };

  const clearBadge = async (): Promise<boolean> => {
    return await notificationService.clearBadge();
  };

  return {
    scheduleMealReminder,
    scheduleWaterReminder,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
    getBadgeCount,
    setBadgeCount,
    clearBadge
  };
};
