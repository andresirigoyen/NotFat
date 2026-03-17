import { useState, useEffect } from 'react';
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
            .single();
          
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

  const processPrompt = async (message: string, profileData?: UserProfile): Promise<ProcessPromptResponse | null> => {
    console.log('🚀 processPrompt called with:', message);
    
    if (!message.trim()) {
      console.log('❌ Empty message, returning null');
      return null;
    }

    setLoading(true);
    setError(null);
    console.log('📡 Calling unified endpoint...');

    try {
      // Obtener usuario autenticado para enviar su ID al backend
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      // Usar perfil pasado o el del estado
      const profileToSend = profileData || userProfile;
      
      // Timeout de 25 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La IA está tardando demasiado en responder')), 25000);
      });

      const apiCall = fetch('https://jcfezqakxulmtdvioxbc.supabase.co/functions/v1/process-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          userId: user.id,
          userProfile: profileToSend 
        }),
      });

      const response = await Promise.race([apiCall, timeoutPromise]) as Response;

      console.log('📡 API call status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: ProcessPromptResponse = await response.json();
      console.log('📊 API response:', data);

      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al conectar con la IA';
      setError(errorMessage);
      console.error('❌ AI Chat Error:', err);
      
      // Devolver respuesta de error
      return {
        type: 'chat',
        response: `Lo siento, tuve un problema: ${errorMessage}. Por favor intenta de nuevo.`,
        recipeData: null
      };
    } finally {
      setLoading(false);
    }
  };

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
