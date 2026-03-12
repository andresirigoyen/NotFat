import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Initialize Sentry for both React Native and Expo
const initSentry = () => {
  // Sentry configuration only (Expo-specific removed)
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    debug: __DEV__,
    enableAutoSessionTracking: true,
    // Performance monitoring
    tracesSampleRate: __DEV__ ? 0 : 0.1,
    // Session replay
    _experiments: {
      // The sampling rate for session replay is relative to tracesSampleRate
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    },
    // Integrations
    integrations: [
      // Performance monitoring
      Sentry.reactNativeTracingIntegration(),
    ],
    beforeSend(event: any) {
      // Filter out sensitive data
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('Network request failed')) {
          // Don't send network errors that are expected
          return null;
        }
      }

      // Remove sensitive information from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => ({
          ...breadcrumb,
          data: breadcrumb.data ? filterSensitiveData(breadcrumb.data) : undefined,
        }));
      }

      // Remove sensitive information from extra data
      if (event.extra) {
        event.extra = filterSensitiveData(event.extra);
      }

      return event;
    },
  });
};

// Filter sensitive data from Sentry events
const filterSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'credit_card',
    'ssn',
    'email',
    'phone',
  ];

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

// Custom error reporting functions
export const reportError = (error: Error, context?: Record<string, any>) => {
  console.error('Sentry Error:', error);
  
  Sentry.withScope((scope: any) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }

    // Add user context if available
    const userContext = getUserContext();
    if (userContext) {
      scope.setUser(userContext);
    }

    // Add device context
    scope.setContext('device', {
      platform: Platform.OS,
      version: Platform.Version,
      isEmulator: __DEV__,
    });

    Sentry.captureException(error);
  });
};

export const reportMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  console.log('Sentry Message:', message, level);
  
  Sentry.withScope((scope: any) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }

    scope.addBreadcrumb({
      message,
      level,
      category: 'custom',
    });

    Sentry.captureMessage(message, level);
  });
};

// Performance monitoring
export const startTransaction = (name: string, operation: string) => {
  return Sentry.startSpan({ name, op: operation }, () => {});
};

export const setTransactionContext = (transaction: any, context: Record<string, any>) => {
  Object.keys(context).forEach(key => {
    transaction.setTag(key, String(context[key]));
  });
};

// User context management
export const setUserContext = (user: { id: string; email: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

const getUserContext = () => {
  // This would typically come from your auth store
  try {
    const userState = require('@/store').useAuthStore.getState();
    if (userState?.user) {
      return {
        id: userState.user.id,
        email: userState.user.email,
        role: userState.user.role,
      };
    }
  } catch (error) {
    console.warn('Could not get user context for Sentry:', error);
  }
  return null;
};

// Breadcrumb tracking
export const addBreadcrumb = (message: string, category: string, level?: Sentry.SeverityLevel, data?: any) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: level || 'info',
    data: filterSensitiveData(data),
  });
};

// Feature flag tracking
export const trackFeatureUsage = (featureName: string, properties?: Record<string, any>) => {
  addBreadcrumb(
    `Feature used: ${featureName}`,
    'feature',
    'info',
    { feature: featureName, ...properties }
  );
};

// API error tracking
export const trackApiError = (endpoint: string, method: string, statusCode?: number, error?: Error) => {
  addBreadcrumb(
    `API Error: ${method} ${endpoint}`,
    'api',
    'error',
    {
      endpoint,
      method,
      statusCode,
      error: error?.message,
    }
  );

  if (error) {
    reportError(error, {
      api: { endpoint, method, statusCode },
    });
  }
};

// Performance tracking
export const trackPerformance = (operation: string, duration: number, properties?: Record<string, any>) => {
  const transaction = startTransaction(operation, 'performance');
  
  if (properties) {
    setTransactionContext(transaction, properties);
  }

  // Transaction is automatically finished by Sentry
  addBreadcrumb(
    `Performance: ${operation} took ${duration}ms`,
    'performance',
    'info',
    { operation, duration, ...properties }
  );
};

// Initialize Sentry on import
initSentry();

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
