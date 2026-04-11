import { useCallback, useState, useEffect, useRef } from 'react';
import { Vibration, Platform } from 'react-native';
import { useProfile } from './useProfile';
import { COACH_MESSAGES, CoachCategoryMessages } from '@/utils/coachMessages';

export type ActionType = 'hydration' | 'steps' | 'workout' | 'nutrition' | 'general' | 'registration' | 'failure';

export const useCoachMessage = (initialCategory: ActionType = 'general') => {
  const { profile } = useProfile();
  const [message, setMessage] = useState('');
  const lastIndexRef = useRef<number>(-1);
  
  // Map hard/soft to disruptive/friendly
  const coachMode = profile?.coach_mode || 'soft';
  const isFriendly = coachMode === 'soft' || coachMode === 'friendly';

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'web') return;
    
    if (isFriendly) {
      // Light vibration for friendly mode
      Vibration.vibrate(10);
    } else {
      // Stronger vibration for disruptive mode
      Vibration.vibrate([0, 50, 20, 50]);
    }
  }, [isFriendly]);

  const getNewMessage = useCallback((category: ActionType = initialCategory) => {
    const categoryData: CoachCategoryMessages = COACH_MESSAGES[category] || COACH_MESSAGES.general;
    
    const phrases = isFriendly 
      ? categoryData.friendly 
      : categoryData.aggressive;

    if (phrases && phrases.length > 0) {
      let randomIndex;
      let attempts = 0;
      do {
        randomIndex = Math.floor(Math.random() * phrases.length);
        attempts++;
      } while (randomIndex === lastIndexRef.current && attempts < 5 && phrases.length > 1);

      lastIndexRef.current = randomIndex;
      const newMessage = phrases[randomIndex];
      setMessage(newMessage);
      return newMessage;
    }
    return '';
  }, [isFriendly, initialCategory]);

  useEffect(() => {
    getNewMessage();
  }, [getNewMessage]);

  const say = (category: ActionType) => {
    const msg = getNewMessage(category);
    triggerHaptic();
    return msg;
  };

  return {
    message,
    coachMode,
    isFriendly,
    refresh: getNewMessage,
    say,
    triggerHaptic
  };
};
