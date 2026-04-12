import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface Device {
  id: string;
  device_type: 'fitbit' | 'garmin' | 'whoop' | 'oura' | 'apple_watch' | 'samsung_health';
  device_name: string;
  is_connected: boolean;
  last_sync_at?: string;
  auth_data?: any;
  user_id: string;
}

interface WearableData {
  date: string;
  steps: number;
  calories_burned: number;
  active_minutes: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  sleep_hours?: number;
  sleep_quality?: number;
  stress_level?: number;
  oxygen_saturation?: number;
  body_temperature?: number;
}

interface WorkoutSession {
  id: string;
  device_type: string;
  workout_type: string;
  duration_minutes: number;
  calories_burned: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  distance_meters?: number;
  avg_pace?: number;
  started_at: string;
  ended_at: string;
}

export const useConnectedDevices = (userId: string) => {
  return useQuery({
    queryKey: ['connected_devices', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wearable_devices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Device[];
    },
    enabled: !!userId,
  });
};

export const useConnectDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      deviceType, 
      deviceName, 
      authData 
    }: { 
      userId: string; 
      deviceType: Device['device_type']; 
      deviceName: string; 
      authData: any;
    }) => {
      const { data, error } = await supabase
        .from('wearable_devices')
        .insert({
          user_id: userId,
          device_type: deviceType,
          device_name: deviceName,
          is_connected: true,
          auth_data: authData,
          last_sync_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as Device;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected_devices'] });
    },
  });
};

export const useDisconnectDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceId }: { deviceId: string }) => {
      const { error } = await supabase
        .from('wearable_devices')
        .update({ 
          is_connected: false,
          auth_data: null 
        })
        .eq('id', deviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected_devices'] });
    },
  });
};

export const useSyncDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceId }: { deviceId: string }) => {
      // This would call the device-specific API to sync data
      // For now, simulate a sync
      const { error } = await supabase
        .from('wearable_devices')
        .update({ 
          last_sync_at: new Date().toISOString() 
        })
        .eq('id', deviceId);

      if (error) throw error;
      
      // Trigger actual sync process
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected_devices'] });
      queryClient.invalidateQueries({ queryKey: ['wearable_data'] });
    },
  });
};

export const useWearableData = (userId: string, startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['wearable_data', userId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('wearable_data')
        .select('*')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data as WearableData[];
    },
    enabled: !!userId,
  });
};

export const useWorkoutSessions = (userId: string, limit = 10) => {
  return useQuery({
    queryKey: ['workout_sessions', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as WorkoutSession[];
    },
    enabled: !!userId,
  });
};

export const useImportWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      session 
    }: { 
      userId: string; 
      session: Omit<WorkoutSession, 'id'>;
    }) => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          ...session,
          user_id: userId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as WorkoutSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['wearable_data'] });
    },
  });
};

// Device-specific integration functions
export const useFitbitIntegration = () => {
  const connectDevice = useConnectDevice();
  
  const connectFitbit = async (userId: string, accessToken: string, refreshToken: string) => {
    return connectDevice.mutateAsync({
      userId,
      deviceType: 'fitbit',
      deviceName: 'Fitbit Device',
      authData: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 3600,
      },
    });
  };

  const syncFitbitData = async (userId: string, deviceId: string) => {
    // This would call Fitbit API
    try {
      // Get today's data
      const today = new Date().toISOString().split('T')[0];
      
      // Mock data for now
      const mockData = {
        steps: Math.floor(Math.random() * 5000) + 5000,
        calories_burned: Math.floor(Math.random() * 500) + 1800,
        active_minutes: Math.floor(Math.random() * 60) + 20,
        heart_rate_avg: Math.floor(Math.random() * 30) + 60,
        sleep_hours: Math.random() * 3 + 6,
        sleep_quality: Math.floor(Math.random() * 40) + 60,
      };

      // Save to database
      await supabase
        .from('wearable_data')
        .upsert({
          user_id: userId,
          date: today,
          device_type: 'fitbit',
          ...mockData,
        }, {
          onConflict: 'user_id,date,device_type'
        });

      return mockData;
    } catch (error) {
      console.error('Fitbit sync error:', error);
      throw error;
    }
  };

  return {
    connectFitbit,
    syncFitbitData,
  };
};

export const useGarminIntegration = () => {
  const connectDevice = useConnectDevice();
  
  const connectGarmin = async (userId: string, accessToken: string, refreshToken: string) => {
    return connectDevice.mutateAsync({
      userId,
      deviceType: 'garmin',
      deviceName: 'Garmin Device',
      authData: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  };

  const syncGarminData = async (userId: string, deviceId: string) => {
    // Garmin Connect API integration
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const mockData = {
        steps: Math.floor(Math.random() * 6000) + 8000,
        calories_burned: Math.floor(Math.random() * 600) + 2200,
        active_minutes: Math.floor(Math.random() * 80) + 30,
        heart_rate_avg: Math.floor(Math.random() * 25) + 55,
        stress_level: Math.floor(Math.random() * 100),
        oxygen_saturation: Math.random() * 5 + 95,
      };

      await supabase
        .from('wearable_data')
        .upsert({
          user_id: userId,
          date: today,
          device_type: 'garmin',
          ...mockData,
        }, {
          onConflict: 'user_id,date,device_type'
        });

      return mockData;
    } catch (error) {
      console.error('Garmin sync error:', error);
      throw error;
    }
  };

  return {
    connectGarmin,
    syncGarminData,
  };
};

export const useWhoopIntegration = () => {
  const connectDevice = useConnectDevice();
  
  const connectWhoop = async (userId: string, accessToken: string) => {
    return connectDevice.mutateAsync({
      userId,
      deviceType: 'whoop',
      deviceName: 'WHOOP Strap',
      authData: {
        access_token: accessToken,
      },
    });
  };

  const syncWhoopData = async (userId: string, deviceId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const mockData = {
        calories_burned: Math.floor(Math.random() * 400) + 2000,
        heart_rate_avg: Math.floor(Math.random() * 20) + 50,
        heart_rate_max: Math.floor(Math.random() * 50) + 120,
        sleep_hours: Math.random() * 2 + 7,
        sleep_quality: Math.floor(Math.random() * 30) + 70,
        recovery_score: Math.floor(Math.random() * 40) + 60,
        strain: Math.floor(Math.random() * 20) + 5,
      };

      await supabase
        .from('wearable_data')
        .upsert({
          user_id: userId,
          date: today,
          device_type: 'whoop',
          ...mockData,
        }, {
          onConflict: 'user_id,date,device_type'
        });

      return mockData;
    } catch (error) {
      console.error('WHOOP sync error:', error);
      throw error;
    }
  };

  return {
    connectWhoop,
    syncWhoopData,
  };
};

// Auto-sync functionality
export const useAutoSync = (userId: string) => {
  const { data: devices } = useConnectedDevices(userId);
  const syncDevice = useSyncDevice();

  const syncAllDevices = async () => {
    const connectedDevices = devices?.filter(d => d.is_connected) || [];
    
    const syncPromises = connectedDevices.map(device => 
      syncDevice.mutateAsync({ deviceId: device.id })
    );

    try {
      await Promise.all(syncPromises);
      return { success: true, synced: connectedDevices.length };
    } catch (error) {
      console.error('Auto-sync error:', error);
      return { success: false, error };
    }
  };

  return {
    syncAllDevices,
    hasConnectedDevices: (devices?.filter(d => d.is_connected).length || 0) > 0,
  };
};
