import { useEffect, useState } from 'react';
import { offlineService } from '@/services/offline';
import { analytics } from '@/services/analytics';
import { reportError } from '@/services/sentry';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
    // Initial status
    setIsOnline(offlineService.getNetworkStatus());
    updateSyncStatus();

    // Listen for network changes
    const unsubscribe = offlineService.addNetworkListener((online) => {
      setIsOnline(online);
      
      if (online) {
        // Start sync when coming online
        startSync();
      }
    });

    return unsubscribe;
  }, []);

  const updateSyncStatus = () => {
    const status = offlineService.getSyncQueueStatus();
    setPendingOperations(status.pendingOperations);
  };

  const startSync = async () => {
    setSyncStatus('syncing');
    
    try {
      const results = await offlineService.syncPendingOperations();
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      setSyncStatus('completed');
      updateSyncStatus();

      // Track sync results
      analytics.trackCustomEvent('Offline Sync Completed', {
        successful_operations: successful,
        failed_operations: failed,
        total_operations: results.length
      });

      // Auto-reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);

    } catch (error) {
      setSyncStatus('error');
      reportError(error as Error, { context: 'offline_sync_hook' });
      
      analytics.trackError(error as Error, {
        context: 'offline_sync_hook'
      });
    }
  };

  const clearOfflineData = async (pattern?: string) => {
    try {
      const success = await offlineService.clearOfflineData(pattern);
      
      if (success) {
        updateSyncStatus();
        analytics.trackCustomEvent('Offline Data Cleared', { pattern });
      }
      
      return success;
    } catch (error) {
      reportError(error as Error, { context: 'offline_clear_data_hook' });
      return false;
    }
  };

  return {
    isOnline,
    syncStatus,
    pendingOperations,
    startSync,
    clearOfflineData,
    refreshStatus: updateSyncStatus
  };
};
