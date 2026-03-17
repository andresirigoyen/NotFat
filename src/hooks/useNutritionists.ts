import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

export interface Nutritionist {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  gender?: 'male' | 'female' | 'non_binary' | 'other';
  institution_id?: string;
  created_at: string;
  auth_id?: string;
  profile_image_url?: string;
  clicks_ig?: number;
  clicks_wtp?: number;
  instagram_url?: string;
  long_description?: string;
  phone?: string;
  short_description?: string;
  specialties?: string[];
  visible_in_app?: boolean;
}

export interface Institution {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  creator_id?: string;
}

export interface NutritionGuideline {
  id: string;
  user_id?: string;
  nutritionist_id?: string;
  name: string;
  status?: string;
  allergies?: string[];
  pathologies?: string[];
  food_aversions?: string[];
  cooking_time?: string;
  supplementation?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  source?: 'algorithm' | 'ia' | 'manual' | null;
}

export interface ProfileNutritionist {
  id: string;
  created_at: string;
  profile_id: string;
  nutritionist_id: string;
  nutrition_guidelines_id?: string;
}

export interface GuidelineDay {
  id: string;
  guideline_id: string;
  day_name: string;
  day_order: number;
  context?: string;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  notes?: string;
  created_at: string;
}

export interface GuidelineMeal {
  id: string;
  guideline_day_id: string;
  meal_order: number;
  meal_type: string;
  meal_name: string;
  scheduled_time?: string;
  created_at: string;
}

export interface GuidelineMealItem {
  id: string;
  guideline_meal_id: string;
  item_order: number;
  name: string;
  quantity?: number;
  unit?: 'g' | 'ml' | 'oz' | 'cup' | 'slice' | 'unit' | 'tbsp' | 'tsp' | 'scoop' | 'clove';
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servings?: number;
  created_at: string;
  updated_at: string;
}

// Hooks para Nutricionistas
export const useNutritionists = () => {
  return useQuery({
    queryKey: ['nutritionists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutritionists')
        .select(`
          *,
          institutions (*)
        `)
        .eq('visible_in_app', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Nutritionist & { institutions: Institution | null })[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useInstitutions = () => {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Institution[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Hooks para Guidelines del Usuario
export const useUserNutritionGuidelines = (userId: string) => {
  return useQuery({
    queryKey: ['nutrition_guidelines', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_guidelines')
        .select(`
          *,
          nutritionists (*),
          guideline_days (
            *,
            guideline_meals (
              *,
              guideline_meal_items (*)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateNutritionGuideline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guidelineData: {
      name: string;
      allergies?: string[];
      pathologies?: string[];
      food_aversions?: string[];
      cooking_time?: string;
      supplementation?: boolean;
      notes?: string;
      nutritionist_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('nutrition_guidelines')
        .insert({
          ...guidelineData,
          user_id: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_guidelines', data.user_id] });
    },
  });
};

// Hook para conectar usuario con nutricionista
export const useConnectWithNutritionist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nutritionistId, guidelineId }: { 
      nutritionistId: string; 
      guidelineId?: string; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('profile_nutritionists')
        .insert({
          profile_id: user.id,
          nutritionist_id: nutritionistId,
          nutrition_guidelines_id: guidelineId,
        })
        .select(`
          *,
          nutritionists (*),
          nutrition_guidelines (*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile_nutritionists'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition_guidelines'] });
    },
  });
};

// Hook para obtener las conexiones del usuario
export const useUserNutritionistConnections = (userId: string) => {
  return useQuery({
    queryKey: ['profile_nutritionists', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_nutritionists')
        .select(`
          *,
          nutritionists (*),
          nutrition_guidelines (
            *,
            guideline_days (
              *,
              guideline_meals (
                *,
                guideline_meal_items (*)
              )
            )
          )
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Hook para crear días de guideline
export const useCreateGuidelineDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dayData: {
      guideline_id: string;
      day_name: string;
      day_order: number;
      context?: string;
      total_calories?: number;
      total_protein?: number;
      total_carbs?: number;
      total_fat?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('guideline_days')
        .insert(dayData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_guidelines'] });
      queryClient.invalidateQueries({ queryKey: ['guideline_days', data.guideline_id] });
    },
  });
};

// Hook para crear comidas de guideline
export const useCreateGuidelineMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealData: {
      guideline_day_id: string;
      meal_order: number;
      meal_type: string;
      meal_name: string;
      scheduled_time?: string;
    }) => {
      const { data, error } = await supabase
        .from('guideline_meals')
        .insert(mealData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_guidelines'] });
      queryClient.invalidateQueries({ queryKey: ['guideline_meals', data.guideline_day_id] });
    },
  });
};

// Hook para crear items de comida de guideline
export const useCreateGuidelineMealItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: {
      guideline_meal_id: string;
      item_order: number;
      name: string;
      quantity?: number;
      unit?: 'g' | 'ml' | 'oz' | 'cup' | 'slice' | 'unit' | 'tbsp' | 'tsp' | 'scoop' | 'clove';
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      servings?: number;
    }) => {
      const { data, error } = await supabase
        .from('guideline_meal_items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_guidelines'] });
      queryClient.invalidateQueries({ queryKey: ['guideline_meal_items', data.guideline_meal_id] });
    },
  });
};

// Hook para registrar clicks en nutricionistas
export const useTrackNutritionistClick = () => {
  return useMutation({
    mutationFn: async ({ nutritionistId, type }: { 
      nutritionistId: string; 
      type: 'instagram' | 'whatsapp'; 
    }) => {
      const field = type === 'instagram' ? 'clicks_ig' : 'clicks_wtp';
      
      const { data, error } = await supabase.rpc('increment_nutritionist_clicks', {
        nutritionist_id: nutritionistId,
        click_type: type
      });

      if (error) throw error;
      return data;
    },
  });
};

// Hook para feedback
export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (feedbackData: {
      message: string;
      note?: string;
      user_type?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          ...feedbackData,
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};
