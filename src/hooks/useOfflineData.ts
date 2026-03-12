import { useState, useEffect, useCallback } from 'react';
import { offlineQueryClient, offlineService } from '@/services/offline';
import { analytics } from '@/services/analytics';
import { reportError } from '@/services/sentry';
import { supabase } from '@/services/supabase';

export const useOfflineData = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnReconnect?: boolean;
    enabled?: boolean;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnReconnect = true,
    enabled = true
  } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await offlineQueryClient.query(key, fetchFn, {
        staleTime: forceRefresh ? 0 : staleTime,
        cacheTime,
        refetchOnReconnect
      });

      setData(result);
      
      // Check if data is stale
      const cached = await offlineService.getOfflineData(`query_${key}`);
      setIsStale(cached ? Date.now() - cached.timestamp > staleTime : false);
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      // Track errors
      analytics.trackError(error, {
        context: 'offline_data_hook',
        key,
        isOnline: offlineService.getNetworkStatus()
      });
      
      reportError(error, { context: 'offline_data_hook', key });
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, staleTime, cacheTime, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for network changes
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const unsubscribe = offlineService.addNetworkListener((isOnline) => {
      if (isOnline) {
        fetchData(true); // Force refresh when coming online
      }
    });

    return unsubscribe;
  }, [fetchData, refetchOnReconnect]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    await offlineQueryClient.invalidateCache(key);
    await fetchData(true);
  }, [fetchData, key]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch,
    invalidate,
    isOnline: offlineService.getNetworkStatus()
  };
};

export const useOfflineMutation = <T, Variables>(
  key: string,
  mutationFn: (variables: Variables) => Promise<T>,
  options: {
    onMutate?: (variables: Variables) => void | Promise<void>;
    onSuccess?: (data: T, variables: Variables) => void | Promise<void>;
    onError?: (error: Error, variables: Variables) => void | Promise<void>;
    optimisticUpdate?: (variables: Variables) => (data: T) => T;
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    onMutate,
    onSuccess,
    onError,
    optimisticUpdate
  } = options;

  const mutate = useCallback(async (variables: Variables) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call onMutate callback
      await onMutate?.(variables);

      // Perform optimistic update if provided
      if (optimisticUpdate) {
        const cached = await offlineService.getOfflineData(`query_${key}`);
        if (cached) {
          const updatedData = optimisticUpdate(variables)(cached.data);
          await offlineService.saveOfflineData(`query_${key}`, {
            data: updatedData,
            timestamp: Date.now()
          });
        }
      }

      // Execute mutation
      const result = await mutationFn(variables);

      // Update cache with result
      await offlineQueryClient.invalidateCache(key);

      // Call onSuccess callback
      await onSuccess?.(result, variables);

      // Track successful mutation
      analytics.trackCustomEvent('Offline Mutation Success', {
        key,
        variables_count: Object.keys(variables as any).length
      });

      return result;

    } catch (err) {
      const error = err as Error;
      setError(error);

      // Call onError callback
      await onError?.(error, variables);

      // Track error
      analytics.trackError(error, {
        context: 'offline_mutation_hook',
        key
      });

      reportError(error, { context: 'offline_mutation_hook', key });

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, mutationFn, onMutate, onSuccess, onError, optimisticUpdate]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    reset
  };
};

// Hook for offline meal logging
export const useOfflineMealLogging = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [pendingMeals, setPendingMeals] = useState(0);

  const logMeal = async (mealData: any) => {
    setIsLogging(true);
    
    try {
      if (offlineService.getNetworkStatus()) {
        // Online: directly log to server
        const { data, error } = await supabase
          .from('meals')
          .insert(mealData)
          .select()
          .single();

        if (error) throw error;

        analytics.trackMealLogged({
          meal_id: data.id,
          meal_type: mealData.meal_type,
          online: true
        });

        return data;
      } else {
        // Offline: queue for sync
        const operationId = await offlineService.queueOperation({
          type: 'create',
          table: 'meals',
          data: mealData
        });

        // Also save to local cache for immediate UI update
        await offlineService.saveOfflineData(`meal_${operationId}`, {
          data: mealData,
          timestamp: Date.now(),
          synced: false
        });

        setPendingMeals(prev => prev + 1);

        analytics.trackMealLogged({
          meal_type: mealData.meal_type,
          online: false,
          queued: true
        });

        return { ...mealData, id: operationId, synced: false };
      }
    } catch (error) {
      reportError(error as Error, { context: 'offline_meal_logging' });
      throw error;
    } finally {
      setIsLogging(false);
    }
  };

  const getPendingMeals = useCallback(async () => {
    const status = offlineService.getSyncQueueStatus();
    const mealOperations = status.operations.filter(op => op.table === 'meals');
    setPendingMeals(mealOperations.length);
    return mealOperations;
  }, []);

  useEffect(() => {
    getPendingMeals();

    const unsubscribe = offlineService.addNetworkListener((isOnline) => {
      if (isOnline) {
        getPendingMeals();
      }
    });

    return unsubscribe;
  }, [getPendingMeals]);

  return {
    logMeal,
    isLogging,
    pendingMeals,
    refreshPendingMeals: getPendingMeals
  };
};

// Hook for offline water logging
export const useOfflineWaterLogging = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [pendingLogs, setPendingLogs] = useState(0);

  const logWater = async (waterData: any) => {
    setIsLogging(true);
    
    try {
      if (offlineService.getNetworkStatus()) {
        // Online: directly log to server
        const { data, error } = await supabase
          .from('water_logs')
          .insert(waterData)
          .select()
          .single();

        if (error) throw error;

        analytics.trackCustomEvent('Water Logged', {
          water_log_id: data.id,
          volume: waterData.volume,
          online: true
        });

        return data;
      } else {
        // Offline: queue for sync
        const operationId = await offlineService.queueOperation({
          type: 'create',
          table: 'water_logs',
          data: waterData
        });

        // Also save to local cache
        await offlineService.saveOfflineData(`water_${operationId}`, {
          data: waterData,
          timestamp: Date.now(),
          synced: false
        });

        setPendingLogs(prev => prev + 1);

        analytics.trackCustomEvent('Water Logged', {
          volume: waterData.volume,
          online: false,
          queued: true
        });

        return { ...waterData, id: operationId, synced: false };
      }
    } catch (error) {
      reportError(error as Error, { context: 'offline_water_logging' });
      throw error;
    } finally {
      setIsLogging(false);
    }
  };

  const getPendingLogs = useCallback(async () => {
    const status = offlineService.getSyncQueueStatus();
    const waterOperations = status.operations.filter(op => op.table === 'water_logs');
    setPendingLogs(waterOperations.length);
    return waterOperations;
  }, []);

  useEffect(() => {
    getPendingLogs();

    const unsubscribe = offlineService.addNetworkListener((isOnline) => {
      if (isOnline) {
        getPendingLogs();
      }
    });

    return unsubscribe;
  }, [getPendingLogs]);

  return {
    logWater,
    isLogging,
    pendingLogs,
    refreshPendingLogs: getPendingLogs
  };
};
