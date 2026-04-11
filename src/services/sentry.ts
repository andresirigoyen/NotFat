import { Platform } from 'react-native';

/**
 * MOCK DE SENTRY - SOLUCIÓN TEMPORAL PARA XCODE 16 / SDK 55
 * Este archivo simula la API de Sentry para que la aplicación funcione 
 * sin la dependencia nativa que bloquea la compilación.
 */

const filterSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'session', 'email'];
  const filtered = { ...data };
  Object.keys(filtered).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      filtered[key] = '[FILTERED]';
    } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  });
  return filtered;
};

// --- Mock de las funciones originales ---

export const reportError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.log('🔴 [Sentry Mock] Error reportado:', error.message);
    if (context) console.log('Contexto:', filterSensitiveData(context));
  }
};

export const reportMessage = (message: string, level: string = 'info', context?: Record<string, any>) => {
  if (__DEV__) console.log(`ℹ️ [Sentry Mock] (${level}):`, message);
};

export const startTransaction = (name: string, operation: string) => {
  if (__DEV__) console.log(`⏱️ [Sentry Mock] Iniciando transacción: ${name}`);
  return { setTag: () => { } }; // Objeto vacío para no romper llamadas
};

export const setTransactionContext = (transaction: any, context: Record<string, any>) => {
  // No hace nada en el mock
};

export const setUserContext = (user: { id: string; email: string; role?: string }) => {
  if (__DEV__) console.log('👤 [Sentry Mock] Usuario identificado:', user.email);
};

export const clearUserContext = () => {
  if (__DEV__) console.log('👤 [Sentry Mock] Usuario limpiado');
};

export const addBreadcrumb = (message: string, category: string, level?: string, data?: any) => {
  if (__DEV__) console.log(`🍞 [Breadcrumb]: [${category}] ${message}`);
};

export const trackFeatureUsage = (featureName: string, properties?: Record<string, any>) => {
  addBreadcrumb(`Feature used: ${featureName}`, 'feature', 'info', properties);
};

export const trackApiError = (endpoint: string, method: string, statusCode?: number, error?: Error) => {
  addBreadcrumb(`API Error: ${method} ${endpoint}`, 'api', 'error', { statusCode, error: error?.message });
  if (error) reportError(error, { api: { endpoint, method, statusCode } });
};

export const trackPerformance = (operation: string, duration: number, properties?: Record<string, any>) => {
  if (__DEV__) console.log(`⚡ [Performance] ${operation}: ${duration}ms`);
};

// Exportación por defecto para mantener compatibilidad
export default {
  reportError,
  reportMessage,
  startTransaction,
  setTransactionContext,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  trackFeatureUsage,
  trackApiError,
  trackPerformance,
};