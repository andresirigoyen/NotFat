import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { reportError } from './sentry';

// Offline storage service
export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private syncQueue: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    table: string;
    data: any;
    timestamp: number;
  }> = [];
  private listeners: Array<(isOnline: boolean) => void> = [];

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load sync queue from storage
    await this.loadSyncQueue();
    
    // Set initial online status (simplified)
    this.isOnline = true;
  }

  // Add network status listener
  addNetworkListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get current network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // Save data to offline storage
  async saveOfflineData(key: string, data: any) {
    try {
      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        synced: false
      }));
      return true;
    } catch (error) {
      reportError(error as Error, { context: 'offline_save_data', key });
      return false;
    }
  }

  // Get data from offline storage
  async getOfflineData(key: string) {
    try {
      const stored = await AsyncStorage.getItem(`offline_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      reportError(error as Error, { context: 'offline_get_data', key });
      return null;
    }
  }

  // Queue operation for sync
  async queueOperation(operation: {
    type: 'create' | 'update' | 'delete';
    table: string;
    data: any;
  }) {
    const queuedOp = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.syncQueue.push(queuedOp);
    await this.saveSyncQueue();
    return queuedOp.id;
  }

  // Sync pending operations
  async syncPendingOperations() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const operationsToSync = [...this.syncQueue];
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const operation of operationsToSync) {
      try {
        await this.executeOperation(operation);
        results.push({ id: operation.id, success: true });
        
        // Remove from queue
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
      } catch (error) {
        results.push({ 
          id: operation.id, 
          success: false, 
          error: (error as Error).message 
        });
        reportError(error as Error, { context: 'offline_sync_operation', operation });
      }
    }

    await this.saveSyncQueue();
    return results;
  }

  // Execute individual operation
  private async executeOperation(operation: any) {
    switch (operation.type) {
      case 'create': {
        const { data, error: createError } = await supabase
          .from(operation.table)
          .insert(operation.data);
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { data: updateData, error: updateError } = await supabase
          .from(operation.table)
          .update(operation.data)
          .eq('id', operation.data.id);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(operation.table)
          .delete()
          .eq('id', operation.data.id);
        if (deleteError) throw deleteError;
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Load sync queue from storage
  private async loadSyncQueue() {
    try {
      const stored = await AsyncStorage.getItem('sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      reportError(error as Error, { context: 'offline_load_sync_queue' });
      this.syncQueue = [];
    }
  }

  // Save sync queue to storage
  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      reportError(error as Error, { context: 'offline_save_sync_queue' });
    }
  }

  // Clear offline data
  async clearOfflineData(pattern?: string) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => {
        if (pattern) {
          return key.startsWith(`offline_${pattern}`);
        }
        return key.startsWith('offline_');
      });
      
      // Remove keys individually
      for (const key of keysToRemove) {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      reportError(error as Error, { context: 'offline_clear_data', pattern });
      return false;
    }
  }

  // Get sync queue status
  getSyncQueueStatus() {
    return {
      pendingOperations: this.syncQueue.length,
      operations: this.syncQueue.map(op => ({
        id: op.id,
        type: op.type,
        table: op.table,
        timestamp: op.timestamp
      }))
    };
  }
}

// TanStack Query offline adapter
export class OfflineQueryClient {
  private offlineService: OfflineService;
  private queryCache: Map<string, any> = new Map();

  constructor() {
    this.offlineService = OfflineService.getInstance();
  }

  // Query with offline support
  async query<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: {
      staleTime?: number;
      cacheTime?: number;
      refetchOnReconnect?: boolean;
    } = {}
  ): Promise<T> {
    const cacheKey = `query_${key}`;
    
    // Try to get from cache first
    const cached = await this.offlineService.getOfflineData(cacheKey);
    if (cached && !this.isDataStale(cached.timestamp, options.staleTime)) {
      return cached.data;
    }

    // If online, fetch fresh data
    if (this.offlineService.getNetworkStatus()) {
      try {
        const data = await queryFn();
        
        // Cache the result
        await this.offlineService.saveOfflineData(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        return data;
      } catch (error) {
        // If fetch fails, return cached data if available
        if (cached) {
          return cached.data;
        }
        throw error;
      }
    }

    // If offline and no cache, throw error
    if (!cached) {
      throw new Error('No cached data available and offline');
    }

    return cached.data;
  }

  // Mutation with offline support
  async mutate<T>(
    key: string,
    mutationFn: () => Promise<T>,
    optimisticUpdate?: (data: T) => void
  ): Promise<T> {
    const cacheKey = `query_${key}`;
    
    // Optimistic update
    if (optimisticUpdate) {
      const cached = await this.offlineService.getOfflineData(cacheKey);
      if (cached) {
        optimisticUpdate(cached.data);
        await this.offlineService.saveOfflineData(cacheKey, {
          data: cached.data,
          timestamp: Date.now()
        });
      }
    }

    if (this.offlineService.getNetworkStatus()) {
      const result = await mutationFn();
      
      // Invalidate cache
      await this.offlineService.saveOfflineData(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } else {
      // Queue mutation for later sync
      await this.offlineService.queueOperation({
        type: 'update',
        table: this.extractTableFromKey(key),
        data: { key, mutation: 'mutate' }
      });
      
      // Return cached data or throw
      const cached = await this.offlineService.getOfflineData(cacheKey);
      if (cached) {
        return cached.data;
      }
      
      throw new Error('Offline - mutation queued');
    }
  }

  // Invalidate cache
  async invalidateCache(key?: string) {
    if (key) {
      await this.offlineService.clearOfflineData(key);
    } else {
      await this.offlineService.clearOfflineData('query_');
    }
  }

  // Check if data is stale
  private isDataStale(timestamp: number, staleTime?: number): boolean {
    if (!staleTime) return false;
    return Date.now() - timestamp > staleTime;
  }

  // Extract table name from query key (simplified)
  private extractTableFromKey(key: string): string {
    return key.split('_')[0] || 'unknown';
  }
}

// Export the offline service instance
export const offlineService = OfflineService.getInstance();
export const offlineQueryClient = new OfflineQueryClient();
