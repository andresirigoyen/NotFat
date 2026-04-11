/**
 * useTierPermissions — Hook centralizado de permisos Free vs Pro.
 *
 * Fuente única de verdad para TODOS los límites y capacidades del tier.
 * Cualquier pantalla debe importar este hook en lugar de leer isPro directamente
 * y duplicar lógica de negocio.
 */
import { useAuthStore } from '@/store';

export const FREE_LIMITS = {
  DAILY_AI_MESSAGES: 5,       // Chef IA mensajes por día
  DAILY_SCANS: 3,             // Escaneos + fotos IA por día
  AI_SUGGESTIONS_ON_LOAD: 1,  // Recetas sugeridas al cargar
  SAVED_RECIPES: 3,           // Recetas guardadas máximas
  MEAL_HISTORY_DAYS: 7,       // Días de historial de comidas visible
  COACH_STYLES: ['apoyo'] as const, // Solo estilo "apoyo"
} as const;

export const PRO_LIMITS = {
  DAILY_AI_MESSAGES: Infinity,
  DAILY_SCANS: Infinity,
  AI_SUGGESTIONS_ON_LOAD: 3,
  SAVED_RECIPES: Infinity,
  MEAL_HISTORY_DAYS: Infinity,
  COACH_STYLES: ['apoyo', 'reto', 'directo'] as const,
} as const;

export type CoachStyle = 'apoyo' | 'reto' | 'directo';

export const useTierPermissions = () => {
  const { isPro } = useAuthStore();
  const limits = isPro ? PRO_LIMITS : FREE_LIMITS;

  return {
    isPro,

    // Límites numéricos
    maxDailyMessages: limits.DAILY_AI_MESSAGES,
    maxDailyScans: limits.DAILY_SCANS,
    maxAiSuggestionsOnLoad: limits.AI_SUGGESTIONS_ON_LOAD,
    maxSavedRecipes: limits.SAVED_RECIPES,
    mealHistoryDays: limits.MEAL_HISTORY_DAYS,

    // Permisos booleanos derivados
    canRefreshAiSuggestions: isPro,
    canUseAggressiveCoach: isPro,
    canSeeFullHistory: isPro,
    canSaveMoreRecipes: (currentCount: number) =>
      isPro || currentCount < FREE_LIMITS.SAVED_RECIPES,

    // Estilos de coach disponibles para este tier
    availableCoachStyles: limits.COACH_STYLES as readonly CoachStyle[],

    // Fecha de corte para historial de comidas
    mealHistoryCutoffDate: isPro
      ? null
      : new Date(Date.now() - FREE_LIMITS.MEAL_HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
};
