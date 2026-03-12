import { Linking, Alert } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { reportError } from './sentry';
import { analytics } from './analytics';

// Deep linking service
export class DeepLinkingService {
  private static instance: DeepLinkingService;
  private navigationRef: NavigationContainerRef<any> | null = null;

  static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  // Set navigation reference
  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  // Handle incoming URL
  async handleUrl(url: string): Promise<boolean> {
    try {
      console.log('Handling deep link URL:', url);

      // Parse URL
      const parsedUrl = this.parseUrl(url);
      if (!parsedUrl) {
        console.warn('Could not parse URL:', url);
        return false;
      }

      // Track deep link event
      analytics.trackCustomEvent('Deep Link Received', {
        url: url,
        path: parsedUrl.path,
        params: parsedUrl.params
      });

      // Handle different deep link types
      return await this.handleDeepLink(parsedUrl);
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_handle_url', url });
      return false;
    }
  }

  // Parse URL into components
  private parseUrl(url: string): { path: string; params: Record<string, string> } | null {
    try {
      // Handle different URL formats
      let cleanUrl = url;
      
      // Remove app scheme if present
      if (url.startsWith('notfat://')) {
        cleanUrl = url.replace('notfat://', '');
      } else if (url.startsWith('https://notfat.app/')) {
        cleanUrl = url.replace('https://notfat.app/', '');
      } else if (url.startsWith('https://www.notfat.app/')) {
        cleanUrl = url.replace('https://www.notfat.app/', '');
      }

      // Split path and params
      const [path, queryString] = cleanUrl.split('?');
      const params: Record<string, string> = {};

      if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        urlParams.forEach((value, key) => {
          params[key] = value;
        });
      }

      return { path, params };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  // Handle specific deep link routes
  private async handleDeepLink(parsedUrl: { path: string; params: Record<string, string> }): Promise<boolean> {
    if (!this.navigationRef) {
      console.warn('Navigation ref not set');
      return false;
    }

    const { path, params } = parsedUrl;

    switch (path) {
      case 'meal':
        return this.handleMealDeepLink(params);
      case 'water':
        return this.handleWaterDeepLink(params);
      case 'profile':
        return this.handleProfileDeepLink(params);
      case 'subscription':
        return this.handleSubscriptionDeepLink(params);
      case 'share':
        return this.handleShareDeepLink(params);
      case 'invite':
        return this.handleInviteDeepLink(params);
      case 'reset-password':
        return this.handlePasswordResetDeepLink(params);
      case 'verify-email':
        return this.handleEmailVerificationDeepLink(params);
      case 'notification':
        return this.handleNotificationDeepLink(params);
      default:
        return this.handleGenericDeepLink(path, params);
    }
  }

  // Handle meal-related deep links
  private async handleMealDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const mealId = params.id;
      const action = params.action; // 'view', 'edit', 'log'

      if (mealId) {
        // Navigate to specific meal
        this.navigationRef?.navigate('MealLogger', {
          screen: 'MealDetail',
          params: { mealId, action }
        });
      } else {
        // Navigate to meal logger
        this.navigationRef?.navigate('MealLogger');
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'meal',
        action: action || 'navigate',
        mealId
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_meal', params });
      return false;
    }
  }

  // Handle water-related deep links
  private async handleWaterDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const waterLogId = params.id;
      const action = params.action;

      if (waterLogId) {
        // Navigate to specific water log
        this.navigationRef?.navigate('Hydration', {
          screen: 'WaterLogDetail',
          params: { waterLogId, action }
        });
      } else {
        // Navigate to hydration screen
        this.navigationRef?.navigate('Hydration');
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'water',
        action: action || 'navigate',
        waterLogId
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_water', params });
      return false;
    }
  }

  // Handle profile-related deep links
  private async handleProfileDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const section = params.section; // 'personal', 'goals', 'preferences'
      
      this.navigationRef?.navigate('Profile', {
        screen: section ? `Profile${section.charAt(0).toUpperCase() + section.slice(1)}` : 'ProfileMain',
        params
      });

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'profile',
        section
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_profile', params });
      return false;
    }
  }

  // Handle subscription-related deep links
  private async handleSubscriptionDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const plan = params.plan;
      const action = params.action; // 'upgrade', 'manage', 'cancel'

      this.navigationRef?.navigate('Subscription', {
        screen: action === 'manage' ? 'SubscriptionManage' : 'SubscriptionPlans',
        params: { plan, action }
      });

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'subscription',
        action,
        plan
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_subscription', params });
      return false;
    }
  }

  // Handle share-related deep links
  private async handleShareDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const type = params.type; // 'meal', 'progress', 'achievement'
      const id = params.id;

      if (type === 'meal' && id) {
        this.navigationRef?.navigate('Share', {
          screen: 'ShareMeal',
          params: { mealId: id }
        });
      } else if (type === 'progress') {
        this.navigationRef?.navigate('Share', {
          screen: 'ShareProgress'
        });
      } else {
        // Default share screen
        this.navigationRef?.navigate('Share');
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'share',
        shareType: type,
        id
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_share', params });
      return false;
    }
  }

  // Handle invite deep links
  private async handleInviteDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const inviteCode = params.code;
      const referrerId = params.referrer;

      if (inviteCode) {
        // Handle invite code acceptance
        this.navigationRef?.navigate('Invite', {
          screen: 'AcceptInvite',
          params: { inviteCode, referrerId }
        });
      } else {
        // Navigate to invite screen
        this.navigationRef?.navigate('Invite');
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'invite',
        inviteCode,
        referrerId
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_invite', params });
      return false;
    }
  }

  // Handle password reset deep links
  private async handlePasswordResetDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const token = params.token;
      const email = params.email;

      if (token && email) {
        this.navigationRef?.navigate('Auth', {
          screen: 'ResetPassword',
          params: { token, email }
        });
      } else {
        // Navigate to forgot password
        this.navigationRef?.navigate('Auth', {
          screen: 'ForgotPassword'
        });
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'password_reset',
        hasToken: !!token,
        hasEmail: !!email
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_password_reset', params });
      return false;
    }
  }

  // Handle email verification deep links
  private async handleEmailVerificationDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const token = params.token;
      const email = params.email;

      if (token && email) {
        this.navigationRef?.navigate('Auth', {
          screen: 'VerifyEmail',
          params: { token, email }
        });
      } else {
        // Show error message
        Alert.alert('Error', 'Invalid verification link');
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'email_verification',
        hasToken: !!token,
        hasEmail: !!email
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_email_verification', params });
      return false;
    }
  }

  // Handle notification deep links
  private async handleNotificationDeepLink(params: Record<string, string>): Promise<boolean> {
    try {
      const type = params.type; // 'meal_reminder', 'water_reminder', 'goal_achieved'
      const targetId = params.targetId;

      switch (type) {
        case 'meal_reminder':
          this.navigationRef?.navigate('MealLogger');
          break;
        case 'water_reminder':
          this.navigationRef?.navigate('Hydration');
          break;
        case 'goal_achieved':
          this.navigationRef?.navigate('Progress');
          break;
        default:
          // Navigate to notifications screen
          this.navigationRef?.navigate('Notifications');
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'notification',
        notificationType: type,
        targetId
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_notification', params });
      return false;
    }
  }

  // Handle generic deep links
  private async handleGenericDeepLink(path: string, params: Record<string, string>): Promise<boolean> {
    try {
      // Try to navigate to a screen with the same name as the path
      const screenName = path.charAt(0).toUpperCase() + path.slice(1);
      
      if (this.navigationRef?.canGoBack()) {
        this.navigationRef?.navigate(screenName, params);
      } else {
        // Navigate to main tab if can't navigate directly
        this.navigationRef?.navigate('Main', {
          screen: screenName,
          params
        });
      }

      analytics.trackCustomEvent('Deep Link Handled', {
        type: 'generic',
        path,
        screenName
      });

      return true;
    } catch (error) {
      reportError(error as Error, { context: 'deeplinking_generic', path, params });
      return false;
    }
  }

  // Generate deep link URL
  generateDeepLink(path: string, params?: Record<string, string>): string {
    const baseUrl = 'notfat://';
    const queryString = params ? 
      '?' + new URLSearchParams(params as any).toString() : '';
    
    return `${baseUrl}${path}${queryString}`;
  }

  // Generate web deep link URL
  generateWebDeepLink(path: string, params?: Record<string, string>): string {
    const baseUrl = 'https://notfat.app/';
    const queryString = params ? 
      '?' + new URLSearchParams(params as any).toString() : '';
    
    return `${baseUrl}${path}${queryString}`;
  }

  // Check if can handle URL
  canHandleUrl(url: string): boolean {
    return url.startsWith('notfat://') || 
           url.startsWith('https://notfat.app/') ||
           url.startsWith('https://www.notfat.app/');
  }
}

// Export singleton instance
export const deepLinkingService = DeepLinkingService.getInstance();

// React hook for deep linking
export const useDeepLinking = () => {
  const handleUrl = (url: string) => {
    return deepLinkingService.handleUrl(url);
  };

  const generateDeepLink = (path: string, params?: Record<string, string>) => {
    return deepLinkingService.generateDeepLink(path, params);
  };

  const generateWebDeepLink = (path: string, params?: Record<string, string>) => {
    return deepLinkingService.generateWebDeepLink(path, params);
  };

  return {
    handleUrl,
    generateDeepLink,
    generateWebDeepLink
  };
};
