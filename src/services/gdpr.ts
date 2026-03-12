import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { reportError } from './sentry';

// GDPR compliance service
export class GDPRService {
  private static instance: GDPRService;
  private consentKey = 'gdpr_consent';
  private dataRetentionKey = 'data_retention_preferences';

  static getInstance(): GDPRService {
    if (!GDPRService.instance) {
      GDPRService.instance = new GDPRService();
    }
    return GDPRService.instance;
  }

  // Save user consent
  async saveConsent(consent: {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
    dataProcessing: boolean;
    analytics: boolean;
    version: string;
    timestamp: string;
  }) {
    try {
      await AsyncStorage.setItem(this.consentKey, JSON.stringify(consent));
      
      // Track consent in analytics (if consented)
      if (consent.analytics) {
        // Track consent event
        console.log('GDPR consent saved:', consent);
      }

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_save_consent' });
      return false;
    }
  }

  // Get user consent
  async getConsent() {
    try {
      const consentData = await AsyncStorage.getItem(this.consentKey);
      return consentData ? JSON.parse(consentData) : null;
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_get_consent' });
      return null;
    }
  }

  // Check if user has given consent for specific purpose
  async hasConsent(purpose: keyof Omit<GDPRConsent, 'version' | 'timestamp'>) {
    const consent = await this.getConsent();
    return consent?.[purpose] || false;
  }

  // Request data export (GDPR Article 20)
  async requestDataExport(userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { user_id: userId }
      });

      if (error) throw error;

      // Create data export record
      await supabase.from('data_export_requests').insert({
        user_id: userId,
        status: 'pending',
        requested_at: new Date().toISOString(),
        format: 'json'
      });

      return { success: true, exportId: data.export_id };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_data_export', userId });
      return { success: false, error: (error as Error).message };
    }
  }

  // Request data deletion (GDPR Article 17 - Right to be forgotten)
  async requestDataDeletion(userId: string, reason: string) {
    try {
      // Create deletion request record
      const { data, error } = await supabase.from('data_deletion_requests').insert({
        user_id: userId,
        reason,
        status: 'pending',
        requested_at: new Date().toISOString(),
        confirmation_token: this.generateConfirmationToken()
      }).select().single();

      if (error) throw error;

      // Send confirmation email
      await supabase.functions.invoke('send-deletion-confirmation', {
        body: { 
          user_id: userId,
          confirmation_token: data.confirmation_token,
          email: data.email
        }
      });

      return { 
        success: true, 
        requestId: data.id,
        message: 'Se ha enviado un correo de confirmación para eliminar tu cuenta.'
      };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_data_deletion', userId });
      return { success: false, error: (error as Error).message };
    }
  }

  // Confirm data deletion
  async confirmDataDeletion(confirmation_token: string) {
    try {
      // Get deletion request
      const { data: request, error } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('confirmation_token', confirmation_token)
        .eq('status', 'pending')
        .single();

      if (error || !request) {
        throw new Error('Token de confirmación inválido o expirado');
      }

      // Initiate deletion process
      const { error: deletionError } = await supabase.functions.invoke('delete-user-data', {
        body: { user_id: request.user_id }
      });

      if (deletionError) throw deletionError;

      // Update request status
      await supabase
        .from('data_deletion_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      return { success: true };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_confirm_deletion' });
      return { success: false, error: (error as Error).message };
    }
  }

  // Update data retention preferences
  async updateDataRetention(preferences: {
    mealDataRetention: number; // days
    healthDataRetention: number; // days
    analyticsDataRetention: number; // days
    autoDelete: boolean;
  }) {
    try {
      await AsyncStorage.setItem(this.dataRetentionKey, JSON.stringify(preferences));
      return true;
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_data_retention' });
      return false;
    }
  }

  // Get data retention preferences
  async getDataRetention() {
    try {
      const preferences = await AsyncStorage.getItem(this.dataRetentionKey);
      return preferences ? JSON.parse(preferences) : {
        mealDataRetention: 365,
        healthDataRetention: 730,
        analyticsDataRetention: 180,
        autoDelete: false
      };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_get_retention' });
      return null;
    }
  }

  // Anonymize user data (alternative to deletion)
  async anonymizeUserData(userId: string) {
    try {
      const { error } = await supabase.functions.invoke('anonymize-user-data', {
        body: { user_id: userId }
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_anonymize_data', userId });
      return { success: false, error: (error as Error).message };
    }
  }

  // Get data processing records
  async getDataProcessingRecords(userId: string) {
    try {
      const { data, error } = await supabase
        .from('data_processing_records')
        .select('*')
        .eq('user_id', userId)
        .order('processed_at', { ascending: false });

      if (error) throw error;

      return { success: true, records: data || [] };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_processing_records', userId });
      return { success: false, error: (error as Error).message };
    }
  }

  // Check if consent needs updating (new terms)
  async needsConsentUpdate(currentVersion: string) {
    try {
      const consent = await this.getConsent();
      return !consent || consent.version !== currentVersion;
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_consent_update_check' });
      return true; // Default to requiring consent if we can't check
    }
  }

  // Withdraw consent
  async withdrawConsent(userId: string, types: string[]) {
    try {
      // Update consent record
      const consent = await this.getConsent();
      if (consent) {
        const updatedConsent = { ...consent };
        types.forEach(type => {
          updatedConsent[type as keyof typeof consent] = false;
        });
        updatedConsent.timestamp = new Date().toISOString();
        
        await this.saveConsent(updatedConsent);
      }

      // Process withdrawal
      await supabase.functions.invoke('process-consent-withdrawal', {
        body: { 
          user_id: userId,
          withdrawn_types: types
        }
      });

      return { success: true };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_consent_withdrawal', userId });
      return { success: false, error: (error as Error).message };
    }
  }

  // Generate confirmation token for data operations
  private generateConfirmationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Log data access (for audit trail)
  async logDataAccess(userId: string, action: string, dataTypes: string[]) {
    try {
      await supabase.from('data_access_logs').insert({
        user_id: userId,
        action,
        data_types: dataTypes,
        accessed_at: new Date().toISOString(),
        ip_address: 'mobile_app' // Could be enhanced with actual IP
      });
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_data_access_log' });
    }
  }

  // Get user's data summary
  async getDataSummary(userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-data-summary', {
        body: { user_id: userId }
      });

      if (error) throw error;

      return { success: true, summary: data };
    } catch (error) {
      reportError(error as Error, { context: 'gdpr_data_summary', userId });
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const gdprService = GDPRService.getInstance();

// Types for GDPR operations
export interface GDPRConsent {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
  dataProcessing: boolean;
  analytics: boolean;
  version: string;
  timestamp: string;
}

export interface DataRetentionPreferences {
  mealDataRetention: number;
  healthDataRetention: number;
  analyticsDataRetention: number;
  autoDelete: boolean;
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  completed_at?: string;
  format: string;
  download_url?: string;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  requested_at: string;
  completed_at?: string;
  confirmation_token: string;
}
