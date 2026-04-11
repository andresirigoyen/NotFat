import { usePreferencesStore } from '@/store/usePreferencesStore';
import { COACH_MESSAGES, CoachCategoryMessages } from '@/utils/coachMessages';
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook personalizado para obtener un mensaje motivacional del Coach con soporte para refrescar
 * y evitar repeticiones consecutivas.
 * @param category Categoría del mensaje ('hydration', 'steps', 'workout', 'nutrition', 'general')
 */
export const useCoachMessage = (category: string) => {
  const { coachMode } = usePreferencesStore();
  const [message, setMessage] = useState('');
  const lastIndexRef = useRef<number>(-1);

  const getNewMessage = useCallback(() => {
    const categoryData: CoachCategoryMessages = COACH_MESSAGES[category] || COACH_MESSAGES.general;
    
    let phrases: string[] = [];
    
    // Selección de conjunto de frases según modo
    if (coachMode === 'high') {
      phrases = categoryData.aggressive;
    }

    // Fallback a amigables
    if (phrases.length === 0) {
      phrases = categoryData.friendly || COACH_MESSAGES.general.friendly;
    }

    if (phrases.length > 0) {
      // Si solo hay una frase, no hay mucho que evitar
      if (phrases.length === 1) {
        setMessage(phrases[0]);
        return;
      }

      let randomIndex;
      // Intentamos obtener un índice distinto al anterior (máximo 5 intentos para evitar bucles infinitos en arrays pequeños)
      let attempts = 0;
      do {
        randomIndex = Math.floor(Math.random() * phrases.length);
        attempts++;
      } while (randomIndex === lastIndexRef.current && attempts < 5);

      lastIndexRef.current = randomIndex;
      setMessage(phrases[randomIndex]);
    }
  }, [category, coachMode]);

  // Inicialización y reactividad al cambio de modo/categoría
  useEffect(() => {
    // Resetear el índice si cambia la categoría o el modo para permitir la primera frase de la nueva lista
    lastIndexRef.current = -1;
    getNewMessage();
  }, [getNewMessage]);

  return { 
    message, 
    refresh: getNewMessage 
  };
};
