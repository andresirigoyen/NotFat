import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

interface FavoriteMeal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  image_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
  updated_at: string;
  favorite_meal_items?: FavoriteMealItem[];
}

interface FavoriteMealItem {
  id: string;
  favorite_meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode_number?: string;
  scanned: boolean;
  servings: number;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('favorite_meals')
        .select(`
          *,
          favorite_meal_items (
            id,
            name,
            quantity,
            unit,
            calories,
            protein,
            carbs,
            fat,
            barcode_number,
            scanned,
            servings
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar favoritos');
      console.error('Fetch favorites error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFavorite = async (mealData: {
    name: string;
    description?: string;
    image_url?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    items: Omit<FavoriteMealItem, 'id' | 'favorite_meal_id'>[];
  }) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Create the favorite meal
      const { data: favorite, error: favoriteError } = await supabase
        .from('favorite_meals')
        .insert({
          user_id: user.id,
          name: mealData.name,
          description: mealData.description,
          image_url: mealData.image_url,
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat
        })
        .select()
        .single();

      if (favoriteError) throw favoriteError;

      // Create the meal items
      if (mealData.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('favorite_meal_items')
          .insert(
            mealData.items.map(item => ({
              ...item,
              favorite_meal_id: favorite.id
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Refresh favorites list
      await fetchFavorites();
      return favorite;
    } catch (err: any) {
      setError(err.message || 'Error al crear favorito');
      console.error('Create favorite error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFavorite = async (favoriteId: string, updates: Partial<FavoriteMeal>) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('favorite_meals')
        .update(updates)
        .eq('id', favoriteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(prev => prev.map(fav => 
        fav.id === favoriteId ? { ...fav, ...updates } : fav
      ));
    } catch (err: any) {
      setError(err.message || 'Error al actualizar favorito');
      console.error('Update favorite error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFavorite = async (favoriteId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Delete meal items first (due to foreign key constraint)
      await supabase
        .from('favorite_meal_items')
        .delete()
        .eq('favorite_meal_id', favoriteId);

      // Delete the favorite meal
      const { error } = await supabase
        .from('favorite_meals')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar favorito');
      console.error('Delete favorite error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFavoriteById = (favoriteId: string) => {
    return favorites.find(fav => fav.id === favoriteId);
  };

  const searchFavorites = (query: string) => {
    if (!query.trim()) return favorites;
    
    const lowercaseQuery = query.toLowerCase();
    return favorites.filter(fav => 
      fav.name.toLowerCase().includes(lowercaseQuery) ||
      fav.description?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getFavoritesByCalories = (minCalories?: number, maxCalories?: number) => {
    return favorites.filter(fav => {
      if (minCalories !== undefined && fav.calories < minCalories) return false;
      if (maxCalories !== undefined && fav.calories > maxCalories) return false;
      return true;
    });
  };

  const getTopFavorites = (limit: number = 5) => {
    // This would typically be based on usage frequency, but for now we'll return the most recent
    return favorites.slice(0, limit);
  };

  const duplicateFavorite = async (favoriteId: string, newName?: string) => {
    const favorite = getFavoriteById(favoriteId);
    if (!favorite) return;

    const newFavorite = await createFavorite({
      name: newName || `${favorite.name} (copia)`,
      description: favorite.description,
      image_url: favorite.image_url,
      calories: favorite.calories,
      protein: favorite.protein,
      carbs: favorite.carbs,
      fat: favorite.fat,
      items: favorite.favorite_meal_items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        barcode_number: item.barcode_number,
        scanned: item.scanned,
        servings: item.servings
      })) || []
    });

    return newFavorite;
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    createFavorite,
    updateFavorite,
    deleteFavorite,
    getFavoriteById,
    searchFavorites,
    getFavoritesByCalories,
    getTopFavorites,
    duplicateFavorite
  };
};
