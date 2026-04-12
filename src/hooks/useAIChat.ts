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

  const processPrompt = async (message: string, profileData?: UserProfile): Promise<ProcessPromptResponse | null> => {
    // 🛡️ BLOQUEO DE CONCURRENCIA: Si ya está pensando, ignoramos los clics extra o bucles
    if (loading) {
      console.warn('🛑 [Anti-Spam] El Coach ya está cocinando una respuesta. Petición ignorada:', message.substring(0, 30));
      return null;
    }

    console.log('🚀 processPrompt called with:', message);
    
    if (!message.trim()) {
      console.log('❌ Empty message, returning null');
      return null;
    }

    setLoading(true);
    setError(null);
    console.log('📡 Calling unified endpoint...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User:', user?.id);
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const profileToSend = profileData || userProfile;

      console.log('📤 Invoking process-prompt function with explicit auth...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        console.error('🛑 No se encontró un Token de Acceso en el frontend');
        throw new Error('La sesión ha expirado o es inválida. Por favor, reinicia la app.');
      }

      let result;
      try {
        result = await supabase.functions.invoke('process-prompt', {
          body: { message, userId: user.id, userProfile: profileToSend },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (invokeErr: any) {
        console.error('❌ Invoke caught error:', invokeErr);
        throw new Error(`Invoke failed: ${invokeErr.message || invokeErr.toString()}`);
      }

      const { data, error: fnError } = result;
      console.log('📥 Response:', data, 'Error:', fnError);
      
      if (fnError) {
        console.error('❌ Function error:', fnError);
        throw new Error(fnError.message || fnError.toString() || 'Error en la función');
      }
      if (!data) {
        console.error('❌ No data returned');
        throw new Error('Respuesta vacía de la IA');
      }

      return data as ProcessPromptResponse;
    } catch (err: any) {
      console.error('❌ AI Chat Error:', err);
      const errorMessage = err.message || err.toString() || 'Error al conectar con la IA';
      setError(errorMessage);
      console.log('📝 Error message:', errorMessage);
      
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
