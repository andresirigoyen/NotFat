import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import translation files
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

// Language detection
const getDeviceLanguage = (): string => {
  const deviceLanguage = Platform.select({
    ios: 'en', // iOS would need additional setup
    android: 'en', // Android would need additional setup
    default: 'en'
  });

  // Fallback to supported languages
  const supportedLanguages = ['es', 'en'];
  return supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
};

// Resources
const resources = {
  es: { translation: esTranslations },
  en: { translation: enTranslations }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    react: {
      useSuspense: false // Disable suspense mode for React Native
    },
    
    // Debug mode (disable in production)
    debug: __DEV__,
    
    // Save missing keys
    saveMissing: __DEV__,
    missingKeyHandler: __DEV__ ? (lng: any, ns: any, key: any) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
    } : undefined,
    
    // Pluralization
    pluralSeparator: '_',
    
    // Context separator
    contextSeparator: '_',
    
    // Default namespace
    defaultNS: 'translation',
    
    // Load strategy
    load: 'languageOnly',
    
    // Preload
    preload: ['es', 'en'],
    
    // Simplified language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

// Language persistence
export class LanguageService {
  private static instance: LanguageService;
  private storageKey = 'selected_language';

  static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  // Get saved language
  async getSavedLanguage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to get saved language:', error);
      return null;
    }
  }

  // Save language preference
  async saveLanguage(language: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.storageKey, language);
      return true;
    } catch (error) {
      console.warn('Failed to save language:', error);
      return false;
    }
  }

  // Change language
  async changeLanguage(language: string): Promise<void> {
    try {
      await i18n.changeLanguage(language);
      await this.saveLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  }

  // Get available languages
  getAvailableLanguages(): Array<{
    code: string;
    name: string;
    nativeName: string;
  }> {
    return [
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español'
      },
      {
        code: 'en',
        name: 'English',
        nativeName: 'English'
      }
    ];
  }

  // Get current language
  getCurrentLanguage(): string {
    return i18n.language;
  }

  // Check if RTL language
  isRTL(language?: string): boolean {
    const lang = language || i18n.language;
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(lang);
  }

  // Get language direction
  getLanguageDirection(language?: string): 'ltr' | 'rtl' {
    return this.isRTL(language) ? 'rtl' : 'ltr';
  }

  // Format number with locale
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(i18n.language, options).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  // Format date with locale
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(i18n.language, options).format(date);
    } catch (error) {
      return date.toString();
    }
  }

  // Format currency with locale
  formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount}`;
    }
  }

  // Get localized units
  getLocalizedUnits(): {
    weight: { kg: string; lb: string };
    height: { cm: string; in: string };
    volume: { ml: string; oz: string };
    energy: { kcal: string; kj: string };
  } {
    return {
      weight: {
        kg: i18n.t('units.weight.kg'),
        lb: i18n.t('units.weight.lb')
      },
      height: {
        cm: i18n.t('units.height.cm'),
        in: i18n.t('units.height.in')
      },
      volume: {
        ml: i18n.t('units.volume.ml'),
        oz: i18n.t('units.volume.oz')
      },
      energy: {
        kcal: i18n.t('units.energy.kcal'),
        kj: i18n.t('units.energy.kj')
      }
    };
  }

  // Initialize language from storage
  async initialize(): Promise<void> {
    try {
      const savedLanguage = await this.getSavedLanguage();
      if (savedLanguage && savedLanguage !== i18n.language) {
        await i18n.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.warn('Failed to initialize language:', error);
    }
  }
}

// Export singleton instance
export const languageService = LanguageService.getInstance();

// Initialize on import
languageService.initialize();

// Export i18n instance
export default i18n;

// Export types
export type LanguageCode = 'es' | 'en';
export type TranslationKey = keyof typeof esTranslations;
