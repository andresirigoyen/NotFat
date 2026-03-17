import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

type Recipe = any;
type NewRecipe = any;
type RecipeItem = any;
type NewRecipeItem = any;

export const useRecipes = (userId: string) => {
  return useQuery({
    queryKey: ['recipes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
      items 
    }: { 
      recipe: Omit<NewRecipe, 'user_id'>; 
      items: Omit<NewRecipeItem, 'recipe_id' | 'profilesId'>[] 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 1. Create the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          ...recipe,
          user_id: user.id,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // 2. Create recipe items
      if (items.length > 0) {
        const itemsWithRecipeId = items.map(item => ({
          ...item,
          recipe_id: recipeData.id,
        }));

        const { error: itemsError } = await supabase
          .from('recipe_items')
          .insert(itemsWithRecipeId);

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
        .single();

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
