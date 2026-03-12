import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Copy, Edit, Trash2, Flame, Heart, Plus, Search } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthStore } from '@/store';

const FavoritesScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [newFavoriteDescription, setNewFavoriteDescription] = useState('');
  
  const { 
    favorites, 
    loading, 
    error, 
    createFavorite, 
    updateFavorite, 
    deleteFavorite, 
    searchFavorites,
    duplicateFavorite 
  } = useFavorites();
  const { user } = useAuthStore();

  const filteredFavorites = searchFavorites(searchQuery);

  const handleCreateFavorite = async () => {
    if (!newFavoriteName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el favorito');
      return;
    }

    try {
      await createFavorite({
        name: newFavoriteName,
        description: newFavoriteDescription,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        items: []
      });

      setNewFavoriteName('');
      setNewFavoriteDescription('');
      setShowCreateForm(false);
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear el favorito');
    }
  };

  const handleDeleteFavorite = (favoriteId: string, favoriteName: string) => {
    Alert.alert(
      'Eliminar favorito',
      `¿Estás seguro de que quieres eliminar "${favoriteName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteFavorite(favoriteId)
        }
      ]
    );
  };

  const handleDuplicateFavorite = async (favoriteId: string) => {
    try {
      await duplicateFavorite(favoriteId);
    } catch (err) {
      Alert.alert('Error', 'No se pudo duplicar el favorito');
    }
  };

  const renderFavoriteCard = (favorite: any) => (
    <View key={favorite.id} style={styles.favoriteCard}>
      <View style={styles.favoriteHeader}>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteName}>{favorite.name}</Text>
          {favorite.description && (
            <Text style={styles.favoriteDescription}>{favorite.description}</Text>
          )}
        </View>
        <View style={styles.favoriteActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDuplicateFavorite(favorite.id)}
          >
            <Copy color="#64748b" size={16} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditFavorite', { favoriteId: favorite.id })}
          >
            <Edit color="#64748b" size={16} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteFavorite(favorite.id, favorite.name)}
          >
            <Trash2 color="#ef4444" size={16} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.favoriteStats}>
        <View style={styles.statItem}>
          <Flame color="#ef4444" size={16} />
          <Text style={styles.statValue}>{favorite.calories}</Text>
          <Text style={styles.statLabel}>cal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>{favorite.protein}g</Text>
          <Text style={styles.statLabel}>prot</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{favorite.carbs}g</Text>
          <Text style={styles.statLabel}>carb</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{favorite.fat}g</Text>
          <Text style={styles.statLabel}>grasa</Text>
        </View>
      </View>

      {favorite.favorite_meal_items && favorite.favorite_meal_items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Ingredientes ({favorite.favorite_meal_items.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.itemsList}>
              {favorite.favorite_meal_items.slice(0, 5).map((item: any) => (
                <View key={item.id} style={styles.itemChip}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemAmount}>{item.quantity} {item.unit}</Text>
                </View>
              ))}
              {favorite.favorite_meal_items.length > 5 && (
                <Text style={styles.moreItemsText}>+{favorite.favorite_meal_items.length - 5} más</Text>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      <TouchableOpacity 
        style={styles.useButton}
        onPress={() => navigation.navigate('MealLogger', { favoriteId: favorite.id })}
      >
        <Heart color="#ffffff" size={16} />
        <Text style={styles.useButtonText}>Usar esta comida</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateForm = () => (
    <View style={styles.createForm}>
      <Text style={styles.formTitle}>Crear nuevo favorito</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre *</Text>
        <TextInput
          style={styles.textInput}
          value={newFavoriteName}
          onChangeText={setNewFavoriteName}
          placeholder="Ej: Ensalada Cesar Favorita"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={newFavoriteDescription}
          onChangeText={setNewFavoriteDescription}
          placeholder="Añade una descripción..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formActions}>
        <Button
          title="Cancelar"
          variant="secondary"
          onPress={() => {
            setShowCreateForm(false);
            setNewFavoriteName('');
            setNewFavoriteDescription('');
          }}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title="Crear"
          onPress={handleCreateFavorite}
          loading={loading}
          disabled={!newFavoriteName.trim()}
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>
    </View>
  );

  if (showCreateForm) {
    return renderCreateForm();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Favoritos</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search color="#94a3b8" size={20} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar favoritos..."
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Empty State */}
        {favorites.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Heart color="#cbd5e1" size={64} />
            <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
            <Text style={styles.emptyDescription}>
              Guarda tus comidas favoritas para acceder rápidamente a ellas
            </Text>
            <Button
              title="Crear primer favorito"
              onPress={() => setShowCreateForm(true)}
              style={{ marginTop: 24 }}
            />
          </View>
        )}

        {/* Search Results Empty */}
        {filteredFavorites.length === 0 && searchQuery && favorites.length > 0 && (
          <View style={styles.emptyState}>
            <Search color="#cbd5e1" size={48} />
            <Text style={styles.emptyTitle}>No se encontraron resultados</Text>
            <Text style={styles.emptyDescription}>
              Intenta con otra búsqueda
            </Text>
          </View>
        )}

        {/* Favorites List */}
        {filteredFavorites.map(renderFavoriteCard)}

        {loading && (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Cargando favoritos...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  favoriteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  favoriteDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8e0',
  },
  favoriteStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f1f5f9',
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  itemsList: {
    flexDirection: 'row',
    gap: 8,
  },
  itemChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8e0',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemAmount: {
    fontSize: 10,
    color: '#64748b',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 12,
  },
  useButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  createForm: {
    flex: 1,
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 32,
  },
});

export default FavoritesScreen;
