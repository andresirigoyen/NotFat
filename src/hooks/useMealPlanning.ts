import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

// Helper to verify user authentication
const verifyAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return user;
};

interface MealPlan {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  is_active: boolean;
  created_at: string;
  meal_plan_days: MealPlanDay[];
}

interface MealPlanDay {
  id: string;
  day_number: number;
  date: string;
  meals: PlannedMeal[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

interface PlannedMeal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_order: number;
  name: string;
  scheduled_time: string;
  items: PlannedMealItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  prep_instructions?: string;
}

interface PlannedMealItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode_number?: string;
  is_favorite?: boolean;
}

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  barcode_number?: string;
  notes?: string;
}

export const useMealPlans = (userId: string) => {
  return useQuery({
    queryKey: ['meal_plans', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_days(
            *,
            planned_meals(
              *,
              planned_meal_items(*)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MealPlan[];
    },
    enabled: !!userId,
  });
};

export const useActiveMealPlan = (userId: string) => {
  return useQuery({
    queryKey: ['active_meal_plan', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_days(
            *,
            planned_meals(
              *,
              planned_meal_items(*)
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MealPlan;
    },
    enabled: !!userId,
  });
};

export const useCreateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      planData 
    }: { 
      userId: string; 
      planData: {
        name: string;
        description?: string;
        start_date: string;
        end_date: string;
        target_calories: number;
        target_protein: number;
        target_carbs: number;
        target_fat: number;
      };
    }) => {
      // Verify user is authenticated
      const user = await verifyAuth();
      if (user.id !== userId) {
        throw new Error('No autorizado');
      }

      const totalDays = Math.ceil(
        (new Date(planData.end_date).getTime() - new Date(planData.start_date).getTime()) / 
        (1000 * 60 * 60 * 24)
      ) + 1;

      // Create meal plan
      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          ...planData,
          total_days: totalDays,
          is_active: false,
        })
        .select()
        .maybeSingle();

      if (planError) throw planError;

      // Create meal plan days
      const days = [];
      for (let i = 0; i < totalDays; i++) {
        const date = new Date(planData.start_date);
        date.setDate(date.getDate() + i);

        days.push({
          meal_plan_id: plan.id,
          day_number: i + 1,
          date: date.toISOString().split('T')[0],
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
        });
      }

      const { error: daysError } = await supabase
        .from('meal_plan_days')
        .insert(days);

      if (daysError) throw daysError;

      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] });
      queryClient.invalidateQueries({ queryKey: ['active_meal_plan'] });
    },
  });
};

export const useGenerateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      preferences 
    }: { 
      userId: string; 
      preferences: {
        name: string;
        start_date: string;
        end_date: string;
        target_calories: number;
        meal_preferences?: string[];
        allergies?: string[];
        cuisine_types?: string[];
      };
    }) => {
      const user = await verifyAuth();
      if (user.id !== userId) throw new Error('No autorizado');

      const { data: generatedPlan, error: fnError } = await supabase.functions.invoke('generate-meal-plan', {
        body: { userId, preferences },
      });

      if (fnError) throw fnError;
      return generatedPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] });
      queryClient.invalidateQueries({ queryKey: ['active_meal_plan'] });
    },
  });
};

export const useUpdatePlannedMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mealId, 
      updates 
    }: { 
      mealId: string; 
    updates: Partial<PlannedMeal>;
    }) => {
      const { data, error } = await supabase
        .from('planned_meals')
        .update(updates)
        .eq('id', mealId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as PlannedMeal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] });
      queryClient.invalidateQueries({ queryKey: ['active_meal_plan'] });
    },
  });
};

export const useAddPlannedMealItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mealId, 
      item 
    }: { 
      mealId: string; 
      item: Omit<PlannedMealItem, 'id'>;
    }) => {
      const { data, error } = await supabase
        .from('planned_meal_items')
        .insert({
          planned_meal_id: mealId,
          ...item,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as PlannedMealItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] });
      queryClient.invalidateQueries({ queryKey: ['active_meal_plan'] });
    },
  });
};

export const useShoppingList = (mealPlanId?: string) => {
  return useQuery({
    queryKey: ['shopping_list', mealPlanId],
    queryFn: async () => {
      if (!mealPlanId) return [];

      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('meal_plan_id', mealPlanId)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as ShoppingListItem[];
    },
    enabled: !!mealPlanId,
  });
};

export const useGenerateShoppingList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealPlanId }: { mealPlanId: string }) => {
      // Get all meal items from the meal plan
      const { data: mealPlan, error: planError } = await supabase
        .from('meal_plans')
        .select(`
          meal_plan_days(
            planned_meals(
              planned_meal_items(
                name,
                quantity,
                unit,
                barcode_number
              )
            )
          )
        `)
        .eq('id', mealPlanId)
        .maybeSingle();

      if (planError) throw planError;
      if (!mealPlan) throw new Error('Meal plan not found');

      // Aggregate items by name and calculate total quantities
      const itemMap = new Map<string, ShoppingListItem>();

      mealPlan.meal_plan_days?.forEach((day: any) => {
        day.planned_meals.forEach((meal: any) => {
          meal.planned_meal_items.forEach((item: any) => {
            const key = item.name.toLowerCase();
            const existing = itemMap.get(key);
            
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              itemMap.set(key, {
                id: '', // Will be generated by DB
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                category: categorizeItem(item.name),
                checked: false,
                barcode_number: item.barcode_number,
              });
            }
          });
        });
      });

      // Clear existing shopping list
      await supabase
        .from('shopping_list_items')
        .delete()
        .eq('meal_plan_id', mealPlanId);

      // Insert new shopping list items
      const items = Array.from(itemMap.values());
      const itemsWithPlanId = items.map(item => ({
        ...item,
        meal_plan_id: mealPlanId,
      }));

      if (itemsWithPlanId.length > 0) {
        const { error } = await supabase
          .from('shopping_list_items')
          .insert(itemsWithPlanId);

        if (error) throw error;
      }

      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list'] });
    },
  });
};

export const useUpdateShoppingListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      updates 
    }: { 
      itemId: string; 
      updates: Partial<ShoppingListItem>;
    }) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as ShoppingListItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list'] });
    },
  });
};

export const useMealPrepSchedule = (mealPlanId: string) => {
  return useQuery({
    queryKey: ['meal_prep_schedule', mealPlanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_prep_schedules')
        .select('*')
        .eq('meal_plan_id', mealPlanId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!mealPlanId,
  });
};

export const useCreateMealPrepSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mealPlanId, 
      schedules 
    }: { 
      mealPlanId: string; 
      schedules: Array<{
        meal_id: string;
        scheduled_date: string;
        prep_instructions: string;
        prep_time_minutes: number;
      }>;
    }) => {
      const schedulesWithPlanId = schedules.map(schedule => ({
        ...schedule,
        meal_plan_id: mealPlanId,
      }));

      const { data, error } = await supabase
        .from('meal_prep_schedules')
        .insert(schedulesWithPlanId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_prep_schedule'] });
    },
  });
};

// Helper function to categorize shopping items
function categorizeItem(itemName: string): string {
  const name = itemName.toLowerCase();
  
  if (name.includes('pollo') || name.includes('carne') || name.includes('pescado') || name.includes('cerdo')) {
    return 'Carnes y Proteínas';
  }
  
  if (name.includes('leche') || name.includes('queso') || name.includes('yogur') || name.includes('mantequilla')) {
    return 'Lácteos';
  }
  
  if (name.includes('pan') || name.includes('arroz') || name.includes('pasta') || name.includes('cereal')) {
    return 'Granos y Cereales';
  }
  
  if (name.includes('manzana') || name.includes('banana') || name.includes('naranja') || name.includes('fruta')) {
    return 'Frutas';
  }
  
  if (name.includes('zanahoria') || name.includes('brócoli') || name.includes('lechuga') || name.includes('tomate')) {
    return 'Vegetales';
  }
  
  if (name.includes('aceite') || name.includes('sal') || name.includes('azúcar') || name.includes('especia')) {
    return 'Condimentos y Aceites';
  }
  
  return 'Otros';
}
