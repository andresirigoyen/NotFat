import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';

interface ProcessPromptResponse {
  type: 'chat' | 'recipe';
  response: string;
  recipeData: {
    name: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
    };
    time: number;
    difficulty: string;
    servings?: number;
    dietaryTags?: string[];
    healthBenefits?: string[];
    allergens?: string[];
    mealTiming?: string;
    suggestedPairing?: string;
  } | null;
}

interface UserProfile {
  id: string;
  first_name?: string;
  diet_type?: string;
  nutrition_goal?: string;
  workout_frequency?: string;
  gender?: string;
  height_value?: number;
  weight_value?: number;
  height_unit?: string;
  weight_unit?: string;
}

export const useAIChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Obtener perfil del usuario al iniciar
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, diet_type, nutrition_goal, workout_frequency, gender, height_value, weight_value, height_unit, weight_unit')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profile) {
            setUserProfile(profile);
            console.log('👤 Perfil cargado:', profile);
          }
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // 🛡️ Candado síncrono para evitar colisiones en bucles rápidos
  const isProcessingRef = React.useRef(false);

  const processPrompt = React.useCallback(async (message: string, profileData?: UserProfile): Promise<ProcessPromptResponse | null> => {
    // 🛡️ BLOQUEO SÍNCRONO: Inmune a los retrasos de renderizado de React
    if (isProcessingRef.current) {
      console.warn('🛑 [Anti-Spam] El Coach ya está cocinando. Petición ignorada:', message.substring(0, 30));
      return null;
    }

    if (!message.trim()) return null;

    isProcessingRef.current = true;
    setLoading(true);
    setError(null);

    console.log('🚀 processPrompt called with:', message);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const profileToSend = profileData || userProfile;

      console.log('📤 Invoking process-prompt function with fresh auth...');
      
      // Forzar validación de sesión
      await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('Sesión expirada. Por favor, reinicia la app.');
      }

      const result = await supabase.functions.invoke('process-prompt', {
        body: { message, userId: user.id, userProfile: profileToSend },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { data, error: fnError } = result;
      
      if (fnError) {
        throw new Error(fnError.message || 'Error en la función del Chef');
      }
      if (!data) {
        throw new Error('Respuesta vacía de la IA');
      }

      return data as ProcessPromptResponse;
    } catch (err: any) {
      console.error('❌ AI Chat Error:', err);
      const errorMessage = err.message || 'Error al conectar con la IA';
      setError(errorMessage);
      return null;
    } finally {
      // 🌟 Abrimos la puerta de nuevo instantáneamente
      isProcessingRef.current = false;
      setLoading(false);
    }
  }, [userProfile]);

  // Mantener funciones legacy para compatibilidad (opcional)
  const sendMessage = async (message: string) => {
    const result = await processPrompt(message);
    return result?.response || null;
  };

  const generateRecipe = async (ingredients: string) => {
    const result = await processPrompt(`Quiero una receta con: ${ingredients}`);
    return result?.recipeData || null;
  };

  return {
    processPrompt,  // Nueva función unificada
    sendMessage,    // Legacy
    generateRecipe, // Legacy
    loading,
    error,
  };
};
