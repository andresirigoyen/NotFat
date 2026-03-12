import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { Database } from '@/types/database';

type Meal = Database['public']['Tables']['meals']['Row'];
type NewMeal = Database['public']['Tables']['meals']['Insert'];
type NewFoodItem = Database['public']['Tables']['food_items']['Insert'];

export const useMeals = (userId: string) => {
  return useQuery({
    queryKey: ['meals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          food_items (*)
        `)
        .eq('user_id', userId)
        .order('meal_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateMealWithItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meal, items }: { meal: Omit<NewMeal, 'user_id'>; items: Omit<NewFoodItem, 'meal_id'>[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 1. Create the meal
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert({
          ...meal,
          user_id: user.id,
          status: 'complete',
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // 2. Create food items
      if (items.length > 0) {
        const itemsWithMealId = items.map(item => ({
          ...item,
          meal_id: mealData.id,
        }));

        const { error: itemsError } = await supabase
          .from('food_items')
          .insert(itemsWithMealId);

        if (itemsError) throw itemsError;
      }

      return mealData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meals', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals', data.user_id] });
    },
  });
};

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, userId }: { mealId: string; userId: string }) => {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;
      return { mealId, userId };
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['meals', userId] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals', userId] });
    },
  });
};

export const useMealsByDate = (userId: string, date?: Date) => {
  return useQuery({
    queryKey: ['meals', 'date', userId, date?.toISOString().split('T')[0]],
    queryFn: async () => {
      const queryDate = date || new Date();
      const today = new Date(queryDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          food_items (*)
        `)
        .eq('user_id', userId)
        .gte('meal_at', today.toISOString())
        .lt('meal_at', tomorrow.toISOString())
        .order('meal_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useTodayMeals = (userId: string) => useMealsByDate(userId, new Date());
