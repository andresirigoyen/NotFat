import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationPreference {
  meal_reminders: boolean;
  hydration_reminders: boolean;
  daily_summary: boolean;
  weekly_progress: boolean;
  achievement_alerts: boolean;
}

export const useNotifications = () => {
  const { user } = useAuthStore();

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
      });

      // Create specific channels for different notification types
      await Notifications.setNotificationChannelAsync('meal-reminders', {
        name: 'Recordatorios de Comidas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
        lightColor: '#f59e0b',
      });

      await Notifications.setNotificationChannelAsync('hydration-reminders', {
        name: 'Recordatorios de Hidratación',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100],
        lightColor: '#3b82f6',
      });

      await Notifications.setNotificationChannelAsync('achievements', {
        name: 'Logros',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      })).data;

      if (user && token) {
        await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', user.id);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const scheduleMealReminder = async (mealType: string, time: string) => {
    const trigger = new Date();
    const [hours, minutes] = time.split(':');
    trigger.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Schedule for today and future days
    for (let i = 0; i < 7; i++) {
      const scheduledTime = new Date(trigger);
      scheduledTime.setDate(scheduledTime.getDate() + i);

      if (scheduledTime > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `¡Hora de ${mealType}! 🍽️`,
            body: `No olvides registrar tu ${mealType} en NotFat`,
            data: { type: 'meal_reminder', mealType },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledTime,
          },
          identifier: `meal-${mealType}-${scheduledTime.toDateString()}`,
        });
      }
    }
  };

  const scheduleHydrationReminder = async (frequency: 'hourly' | '2hours' | '3hours' | '4hours') => {
    const interval = frequency === 'hourly' ? 1 : frequency === '2hours' ? 2 : frequency === '3hours' ? 3 : 4;
    
    // Schedule reminders throughout the day
    for (let hour = 8; hour <= 20; hour += interval) {
      const trigger = new Date();
      trigger.setHours(hour, 0, 0, 0);

      if (trigger > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Hidrátate',
            body: 'Es hora de tomar agua. Mantente hidratado durante el día.',
            data: { type: 'hydration_reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
          identifier: `hydration-${hour}`,
        });
      }
    }
  };

  const scheduleDailySummary = async (time: string = '20:00') => {
    const trigger = new Date();
    const [hours, minutes] = time.split(':');
    trigger.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Schedule daily at specified time
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Resumen del día',
        body: 'Revisa tu progreso nutricional y de hidratación de hoy.',
        data: { type: 'daily_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parseInt(hours),
        minute: parseInt(minutes),
      },
      identifier: 'daily-summary',
    });
  };

  const sendAchievementNotification = async (achievement: {
    title: string;
    description: string;
    type: string;
  }) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ¡Logro desbloqueado!`,
        body: achievement.description,
        data: { 
          type: 'achievement',
          achievementType: achievement.type 
        },
      },
      trigger: null, // Immediate notification
      identifier: `achievement-${Date.now()}`,
    });
  };

  const sendWeeklyProgressNotification = async (stats: {
    mealsLogged: number;
    hydrationGoal: number;
    hydrationAchieved: number;
    caloriesAvg: number;
  }) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📈 Progreso semanal',
        body: `Registraste ${stats.mealsLogged} comidas y alcanzaste ${Math.round((stats.hydrationAchieved / stats.hydrationGoal) * 100)}% de tu meta de hidratación.`,
        data: { type: 'weekly_progress' },
      },
      trigger: null,
      identifier: `weekly-progress-${Date.now()}`,
    });
  };

  const cancelNotification = async (identifier: string) => {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const getNotificationPreferences = async (): Promise<NotificationPreference> => {
    if (!user) return {
      meal_reminders: true,
      hydration_reminders: true,
      daily_summary: true,
      weekly_progress: true,
      achievement_alerts: true,
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return {
        meal_reminders: true,
        hydration_reminders: true,
        daily_summary: true,
        weekly_progress: true,
        achievement_alerts: true,
      };
    }

    return {
      meal_reminders: data.meal_reminders,
      hydration_reminders: data.hydration_reminders,
      daily_summary: data.daily_summary,
      weekly_progress: data.weekly_progress,
      achievement_alerts: data.achievement_alerts,
    };
  };

  const updateNotificationPreferences = async (preferences: Partial<NotificationPreference>) => {
    if (!user) return;

    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
      });
  };

  const setupAllNotifications = async () => {
    // ✅ FIX #15: Cancelar todas las notificaciones existentes antes de reprogramar.
    // Sin esto, cada llamada acumula notificaciones (límite iOS: 64 notificaciones programadas).
    await Notifications.cancelAllScheduledNotificationsAsync();

    const preferences = await getNotificationPreferences();

    if (preferences.meal_reminders) {
      await scheduleMealReminder('desayuno', '08:00');
      await scheduleMealReminder('almuerzo', '13:00');
      await scheduleMealReminder('cena', '20:00');
    }

    if (preferences.hydration_reminders) {
      await scheduleHydrationReminder('2hours');
    }

    if (preferences.daily_summary) {
      await scheduleDailySummary('20:00');
    }
  };

  return {
    registerForPushNotificationsAsync,
    scheduleMealReminder,
    scheduleHydrationReminder,
    scheduleDailySummary,
    sendAchievementNotification,
    sendWeeklyProgressNotification,
    cancelNotification,
    cancelAllNotifications,
    getNotificationPreferences,
    updateNotificationPreferences,
    schedulePushNotification: async (title: string, body: string, seconds: number) => {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { type: 'retention_nudge' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds,
        },
      });
    },
    setupAllNotifications,
  };
};

// Additional hooks for notification preferences and logs
export const useNotificationPreferences = (userId: string) => {
  return useQuery({
    queryKey: ['notification_preferences', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateNotificationPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferenceData: {
      hour: number;
      minute: number;
      meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      enabled?: boolean;
      is_custom?: boolean;
      label?: string;
      message?: string;
      icon?: string;
      predefined_type?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          ...preferenceData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification_preferences', data.user_id] });
    },
  });
};

export const useNotificationLogs = (userId: string) => {
  return useQuery({
    queryKey: ['notification_logs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_logs')
        .select(`
          *,
          notification_preferences (*)
        `)
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useLogNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logData: {
      notification_type: 'simple_reminder';
      reminder_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('notification_logs')
        .insert({
          ...logData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification_logs', data.user_id] });
    },
  });
};
