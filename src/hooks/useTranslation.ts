import { useTranslation } from 'react-i18next';
import { languageService } from '@/services/i18n';

export const useTranslation = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (language: string) => {
    try {
      await languageService.changeLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  };

  const availableLanguages = languageService.getAvailableLanguages();
  const currentLanguage = i18n.language;
  const isRTL = languageService.isRTL();
  const direction = languageService.getLanguageDirection();

  // Helper functions for common translations
  const translate = (key: string, options?: any) => t(key, options);

  // Format helpers
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => 
    languageService.formatNumber(number, options);

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => 
    languageService.formatDate(date, options);

  const formatCurrency = (amount: number, currency: string = 'USD') => 
    languageService.formatCurrency(amount, currency);

  const getLocalizedUnits = () => languageService.getLocalizedUnits();

  return {
    t: translate,
    i18n,
    changeLanguage,
    availableLanguages,
    currentLanguage,
    isRTL,
    direction,
    formatNumber,
    formatDate,
    formatCurrency,
    getLocalizedUnits
  };
};
