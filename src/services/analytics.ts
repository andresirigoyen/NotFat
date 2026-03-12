import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Analytics configuration
const ANALYTICS_CONFIG = {
  mixpanel: {
    token: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
    apiHost: process.env.NODE_ENV === 'development' ? 'api-eu.mixpanel.com' : 'api.mixpanel.com',
  },
  amplitude: {
    apiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
    serverUrl: process.env.NODE_ENV === 'development' 
      ? 'https://api.eu.amplitude.com' 
      : 'https://api2.amplitude.com',
  },
};

// User properties
interface UserProperties {
  id: string;
  email?: string;
  role?: string;
  age?: number;
  gender?: string;
  subscription_status?: string;
  created_at?: string;
  platform?: string;
}

// Event properties
interface EventProperties {
  [key: string]: any;
}

// Mixpanel integration
class MixpanelAnalytics {
  private static instance: MixpanelAnalytics;
  private isInitialized = false;
  private distinctId: string | null = null;

  static getInstance(): MixpanelAnalytics {
    if (!MixpanelAnalytics.instance) {
      MixpanelAnalytics.instance = new MixpanelAnalytics();
    }
    return MixpanelAnalytics.instance;
  }

  async initialize() {
    if (this.isInitialized || !ANALYTICS_CONFIG.mixpanel.token) {
      return;
    }

    try {
      // Get or create distinct ID
      this.distinctId = await AsyncStorage.getItem('mixpanel_distinct_id') || 
                       this.generateDistinctId();
      
      await AsyncStorage.setItem('mixpanel_distinct_id', this.distinctId);

      // Initialize Mixpanel
      const Mixpanel = require('mixpanel-browser');
      this.mixpanel = Mixpanel.init(ANALYTICS_CONFIG.mixpanel.token, {
        debug: __DEV__,
        api_host: ANALYTICS_CONFIG.mixpanel.apiHost,
        persistence: 'localStorage',
        loaded: (mixpanel) => {
          console.log('Mixpanel initialized');
          mixpanel.identify(this.distinctId);
          this.isInitialized = true;
        },
      });
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }

  private generateDistinctId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  track(eventName: string, properties?: EventProperties) {
    if (!this.isInitialized) {
      console.warn('Mixpanel not initialized');
      return;
    }

    try {
      const enrichedProperties = {
        ...properties,
        platform: Platform.OS,
        app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      };

      this.mixpanel.track(eventName, enrichedProperties);
    } catch (error) {
      console.error('Failed to track Mixpanel event:', error);
    }
  }

  identify(userId: string) {
    if (!this.isInitialized) {
      console.warn('Mixpanel not initialized');
      return;
    }

    try {
      this.distinctId = userId;
      this.mixpanel.identify(userId);
      AsyncStorage.setItem('mixpanel_distinct_id', userId);
    } catch (error) {
      console.error('Failed to identify Mixpanel user:', error);
    }
  }

  setUserProperties(properties: Partial<UserProperties>) {
    if (!this.isInitialized) {
      console.warn('Mixpanel not initialized');
      return;
    }

    try {
      this.mixpanel.people.set(properties);
    } catch (error) {
      console.error('Failed to set Mixpanel user properties:', error);
    }
  }

  increment(property: string, value: number = 1) {
    if (!this.isInitialized) {
      console.warn('Mixpanel not initialized');
      return;
    }

    try {
      this.mixpanel.people.increment(property, value);
    } catch (error) {
      console.error('Failed to increment Mixpanel property:', error);
    }
  }

  trackRevenue(amount: number, properties?: EventProperties) {
    if (!this.isInitialized) {
      console.warn('Mixpanel not initialized');
      return;
    }

    try {
      this.mixpanel.people.track_charge(amount, {
        ...properties,
        currency: 'USD',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track Mixpanel revenue:', error);
    }
  }

  private mixpanel: any;
}

// Amplitude integration
class AmplitudeAnalytics {
  private static instance: AmplitudeAnalytics;
  private isInitialized = false;
  private userId: string | null = null;

  static getInstance(): AmplitudeAnalytics {
    if (!AmplitudeAnalytics.instance) {
      AmplitudeAnalytics.instance = new AmplitudeAnalytics();
    }
    return AmplitudeAnalytics.instance;
  }

  async initialize() {
    if (this.isInitialized || !ANALYTICS_CONFIG.amplitude.apiKey) {
      return;
    }

    try {
      const { AmplitudeClient } = require('@amplitude/analytics-browser');
      
      this.amplitude = new AmplitudeClient();
      await this.amplitude.init(ANALYTICS_CONFIG.amplitude.apiKey, undefined, {
        serverUrl: ANALYTICS_CONFIG.amplitude.serverUrl,
        trackingOptions: {
          context: {
            app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
            os_name: Platform.OS,
            os_version: Platform.Version,
            device_model: Platform.select({
              ios: 'iOS',
              android: 'Android',
              default: 'Unknown',
            }),
          },
        },
      }).promise;

      console.log('Amplitude initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Amplitude:', error);
    }
  }

  track(eventName: string, properties?: EventProperties) {
    if (!this.isInitialized) {
      console.warn('Amplitude not initialized');
      return;
    }

    try {
      const enrichedProperties = {
        ...properties,
        platform: Platform.OS,
        app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      };

      this.amplitude.track(eventName, enrichedProperties);
    } catch (error) {
      console.error('Failed to track Amplitude event:', error);
    }
  }

  identify(userId: string) {
    if (!this.isInitialized) {
      console.warn('Amplitude not initialized');
      return;
    }

    try {
      this.userId = userId;
      this.amplitude.setUserId(userId);
    } catch (error) {
      console.error('Failed to identify Amplitude user:', error);
    }
  }

  setUserProperties(properties: Partial<UserProperties>) {
    if (!this.isInitialized) {
      console.warn('Amplitude not initialized');
      return;
    }

    try {
      this.amplitude.setUserProperties(properties);
    } catch (error) {
      console.error('Failed to set Amplitude user properties:', error);
    }
  }

  revenue(amount: number, productId: string, properties?: EventProperties) {
    if (!this.isInitialized) {
      console.warn('Amplitude not initialized');
      return;
    }

    try {
      this.amplitude.revenue({
        price: amount,
        productId,
        quantity: 1,
        revenueType: 'purchase',
        ...properties,
      });
    } catch (error) {
      console.error('Failed to track Amplitude revenue:', error);
    }
  }

  private amplitude: any;
}

// Unified Analytics Service
class AnalyticsService {
  private mixpanel: MixpanelAnalytics;
  private amplitude: AmplitudeAnalytics;

  constructor() {
    this.mixpanel = MixpanelAnalytics.getInstance();
    this.amplitude = AmplitudeAnalytics.getInstance();
  }

  async initialize() {
    await Promise.all([
      this.mixpanel.initialize(),
      this.amplitude.initialize(),
    ]);
  }

  // User identification
  identify(userId: string) {
    this.mixpanel.identify(userId);
    this.amplitude.identify(userId);
  }

  // User properties
  setUserProperties(properties: Partial<UserProperties>) {
    this.mixpanel.setUserProperties(properties);
    this.amplitude.setUserProperties(properties);
  }

  // Event tracking
  track(eventName: string, properties?: EventProperties) {
    // Track to both platforms
    this.mixpanel.track(eventName, properties);
    this.amplitude.track(eventName, properties);
  }

  // Funnel events
  trackOnboardingStep(step: string, properties?: EventProperties) {
    this.track('Onboarding Step Completed', {
      step,
      funnel: 'onboarding',
      ...properties,
    });
  }

  trackMealLogged(properties: EventProperties) {
    this.track('Meal Logged', {
      funnel: 'core_features',
      ...properties,
    });
  }

  trackSubscriptionStarted(properties: EventProperties) {
    this.track('Subscription Started', {
      funnel: 'monetization',
      ...properties,
    });

    // Track revenue
    if (properties.amount) {
      this.mixpanel.trackRevenue(properties.amount, properties);
      this.amplitude.revenue(properties.amount, properties.plan_id || 'premium', properties);
    }
  }

  trackPaymentAttempt(properties: EventProperties) {
    this.track('Payment Attempted', {
      funnel: 'monetization',
      ...properties,
    });
  }

  trackPaymentFailed(properties: EventProperties) {
    this.track('Payment Failed', {
      funnel: 'monetization',
      ...properties,
    });
  }

  trackFeatureUsage(feature: string, properties?: EventProperties) {
    this.track('Feature Used', {
      feature,
      funnel: 'engagement',
      ...properties,
    });
  }

  trackScreenView(screenName: string, properties?: EventProperties) {
    this.track('Screen Viewed', {
      screen_name: screenName,
      ...properties,
    });
  }

  trackError(error: Error, context?: EventProperties) {
    this.track('Error Occurred', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  // Conversion events
  trackConversion(event: string, properties?: EventProperties) {
    this.track(`Conversion: ${event}`, {
      funnel: 'conversion',
      ...properties,
    });
  }

  // Retention events
  trackDailyActive(properties?: EventProperties) {
    this.track('Daily Active', {
      funnel: 'retention',
      ...properties,
    });
  }

  trackWeeklyActive(properties?: EventProperties) {
    this.track('Weekly Active', {
      funnel: 'retention',
      ...properties,
    });
  }

  // Custom events
  trackCustomEvent(eventName: string, properties?: EventProperties) {
    this.track(eventName, properties);
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export types
export type { UserProperties, EventProperties };

// Initialize on import
analytics.initialize();
