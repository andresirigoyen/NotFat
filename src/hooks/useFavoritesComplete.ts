import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export const useFavoriteMeals = (userId: string) => {
  return useQuery({
    queryKey: ['favorite_meals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorite_meals')
        .select(`
          *,
          favorite_meal_items (*),
          meals (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateFavoriteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favoriteData: {
      name?: string;
      image_url?: string;
      meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      source_type?: 'camera' | 'gallery' | 'text' | 'scanner' | 'unknown' | 'voice';
      original_meal_id?: string;
      items: Array<{
        name: string;
        quantity?: number;
        unit?: 'g' | 'ml' | 'oz' | 'cup' | 'slice' | 'unit' | 'tbsp' | 'tsp' | 'scoop' | 'clove';
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        servings?: number;
        barcode_number?: string;
        scanned?: boolean;
        contributed?: boolean;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Create favorite meal
      const { data: favoriteMeal, error: favoriteError } = await supabase
        .from('favorite_meals')
        .insert({
          ...favoriteData,
          user_id: user.id,
        })
        .select()
        .maybeSingle();

      if (favoriteError) throw favoriteError;

      // Create favorite meal items
      if (favoriteData.items && favoriteData.items.length > 0) {
        const itemsWithFavoriteId = favoriteData.items.map(item => ({
          ...item,
          favorite_meal_id: favoriteMeal.id,
        }));

        const { error: itemsError } = await supabase
          .from('favorite_meal_items')
          .insert(itemsWithFavoriteId);

        if (itemsError) throw itemsError;
      }

      return favoriteMeal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['favorite_meals', data.user_id] });
    },
  });
};

export const useAddMealToFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mealId, 
      customName 
    }: { 
      mealId: string; 
      customName?: string; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get original meal with items
      const { data: originalMeal, error: mealError } = await supabase
        .from('meals')
        .select(`
          *,
          food_items (*)
        `)
        .eq('id', mealId)
        .maybeSingle();

      if (mealError) throw mealError;

      // Create favorite meal
      const { data: favoriteMeal, error: favoriteError } = await supabase
        .from('favorite_meals')
        .insert({
          name: customName || originalMeal.name,
          image_url: originalMeal.image_url,
          meal_type: originalMeal.meal_type,
          source_type: originalMeal.source_type,
          original_meal_id: mealId,
          user_id: user.id,
        })
        .select()
        .maybeSingle();

      if (favoriteError) throw favoriteError;

      // Create favorite meal items
      if (originalMeal.food_items && originalMeal.food_items.length > 0) {
        const favoriteItems = originalMeal.food_items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          servings: item.servings,
          barcode_number: item.barcode_number,
          scanned: item.scanned,
          contributed: item.contributed,
          favorite_meal_id: favoriteMeal.id,
        }));

        const { error: itemsError } = await supabase
          .from('favorite_meal_items')
          .insert(favoriteItems);

        if (itemsError) throw itemsError;
      }

      return favoriteMeal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['favorite_meals', data.user_id] });
    },
  });
};

export const useDeleteFavoriteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ favoriteMealId, userId }: { favoriteMealId: string; userId: string }) => {
      const { error } = await supabase
        .from('favorite_meals')
        .delete()
        .eq('id', favoriteMealId);

      if (error) throw error;
      return { favoriteMealId, userId };
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorite_meals', userId] });
    },
  });
};

export const useCreateMealFromFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      favoriteMealId, 
      mealType 
    }: { 
      favoriteMealId: string; 
      mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get favorite meal with items
      const { data: favoriteMeal, error: favoriteError } = await supabase
        .from('favorite_meals')
        .select(`
          *,
          favorite_meal_items (*)
        `)
        .eq('id', favoriteMealId)
        .maybeSingle();

      if (favoriteError) throw favoriteError;

      // Create new meal
      const { data: newMeal, error: mealError } = await supabase
        .from('meals')
        .insert({
          name: favoriteMeal.name,
          meal_type: mealType || favoriteMeal.meal_type,
          source_type: 'favorite',
          status: 'complete',
          is_from_favorite: true,
          user_id: user.id,
        })
        .select()
        .maybeSingle();

      if (mealError) throw mealError;

      // Create food items from favorite items
      if (favoriteMeal.favorite_meal_items && favoriteMeal.favorite_meal_items.length > 0) {
        const foodItems = favoriteMeal.favorite_meal_items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          servings: item.servings,
          barcode_number: item.barcode_number,
          scanned: item.scanned,
          contributed: item.contributed,
          meal_id: newMeal.id,
        }));

        const { error: itemsError } = await supabase
          .from('food_items')
          .insert(foodItems);

        if (itemsError) throw itemsError;
      }

      return newMeal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meals', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals', data.user_id] });
    },
  });
};
