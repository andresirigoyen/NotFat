import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { FREE_LIMITS } from '@/hooks/useTierPermissions';

type Recipe = any;
type NewRecipe = any;
type RecipeItem = any;
type NewRecipeItem = any;

/**
 * useRecipes — fetches recipes for a user.
 * For Free users, pass a `cutoffDate` (ISO string) to filter to the last 7 days.
 * For Pro users, pass null to fetch all history.
 */
export const useRecipes = (userId: string, cutoffDate: string | null = null) => {
  return useQuery({
    queryKey: ['recipes', userId, cutoffDate],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select(`*, recipe_items (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // 🔒 Free tier: only show recipes from the last 7 days
      if (cutoffDate) {
        query = query.gte('created_at', cutoffDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recipe, 
      items,
      isPro = false,
      currentRecipeCount = 0,
    }: { 
      recipe: Omit<NewRecipe, 'user_id'>; 
      items: Omit<NewRecipeItem, 'recipe_id' | 'profilesId'>[]; 
      isPro?: boolean;
      currentRecipeCount?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 🔒 Free tier: enforce max 3 saved recipes
      if (!isPro && currentRecipeCount >= FREE_LIMITS.SAVED_RECIPES) {
        throw new Error(`LIMIT_REACHED:Puedes guardar hasta ${FREE_LIMITS.SAVED_RECIPES} recetas en el plan gratuito. Pásate a Pro para guardar ilimitadas.`);
      }

      // 1. Create the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({ ...recipe, user_id: user.id })
        .select()
        .maybeSingle();

      if (recipeError) throw recipeError;

      // 2. Create recipe items
      if (items.length > 0) {
        const itemsWithRecipeId = items.map(item => ({ ...item, recipe_id: recipeData.id }));
        const { error: itemsError } = await supabase.from('recipe_items').insert(itemsWithRecipeId);
        if (itemsError) throw itemsError;
      }

      return recipeData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', data.user_id] });
    },
  });
};

export const useRecommendationSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: {
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      available_ingredients?: string;
      remaining_calories?: number;
      remaining_protein?: number;
      remaining_carbs?: number;
      remaining_fat?: number;
      fridge_image_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('recommendation_sessions')
        .insert({
          ...sessionData,
          user_id: user.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendation_sessions'] });
    },
  });
};

export const useRecommendationSessions = (userId: string) => {
  return useQuery({
    queryKey: ['recommendation_sessions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendation_sessions')
        .select(`
          *,
          recipes (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
