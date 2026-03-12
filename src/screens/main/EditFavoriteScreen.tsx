import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

// Tipos para la navegación
type EditFavoriteRouteProp = RouteProp<{
  EditFavorite: {
    favoriteId: string;
    favoriteData?: any;
  };
}, 'EditFavorite'>;

interface FavoriteMeal {
  id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_custom: boolean;
  created_at: string;
}

export default function EditFavoriteScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditFavoriteRouteProp>();
  const { favoriteId, favoriteData } = route.params;
  const { user } = useAuthStore();
  
  const [favorite, setFavorite] = useState<Partial<FavoriteMeal>>({
    name: '',
    description: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    image_url: '',
    meal_type: 'breakfast',
    is_custom: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; calories?: string }>({});

  // Cargar datos del favorito si existe
  useEffect(() => {
    if (favoriteData) {
      setFavorite(favoriteData);
    } else if (favoriteId) {
      // TODO: Cargar desde la base de datos
      loadFavoriteFromDB(favoriteId);
    }
  }, [favoriteId, favoriteData]);

  const loadFavoriteFromDB = async (id: string) => {
    try {
      // TODO: Implementar carga desde Supabase
      console.log('Loading favorite:', id);
    } catch (error) {
      console.error('Error loading favorite:', error);
      Alert.alert('Error', 'No pudimos cargar el favorito');
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors: { name?: string; calories?: string } = {};

    if (!favorite.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!favorite.calories || favorite.calories <= 0) {
      newErrors.calories = 'Las calorías deben ser mayores a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar favorito
  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      // TODO: Implementar guardado en Supabase
      const favoriteData = {
        ...favorite,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (favoriteId) {
        // Actualizar existente
        console.log('Updating favorite:', favoriteId, favoriteData);
      } else {
        // Crear nuevo
        console.log('Creating new favorite:', favoriteData);
      }

      Alert.alert('Éxito', 'Favorito guardado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving favorite:', error);
      Alert.alert('Error', 'No pudimos guardar el favorito');
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar favorito
  const handleDelete = () => {
    if (!favoriteId) return;

    Alert.alert(
      'Eliminar Favorito',
      '¿Estás seguro de que quieres eliminar este favorito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implementar eliminación en Supabase
              console.log('Deleting favorite:', favoriteId);
              Alert.alert('Éxito', 'Favorito eliminado', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting favorite:', error);
              Alert.alert('Error', 'No pudimos eliminar el favorito');
            }
          }
        }
      ]
    );
  };

  // Tipos de comida
  const mealTypes = [
    { id: 'breakfast', label: 'Desayuno', icon: 'sunny' },
    { id: 'lunch', label: 'Almuerzo', icon: 'restaurant' },
    { id: 'dinner', label: 'Cena', icon: 'moon' },
    { id: 'snack', label: 'Snack', icon: 'nutrition' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {favoriteId ? 'Editar Favorito' : 'Nuevo Favorito'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Personaliza tu comida favorita
            </Text>
          </View>

          {favoriteId && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color={COLORS.status.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Image Section */}
        <View style={styles.imageSection}>
          {favorite.image_url ? (
            <Image source={{ uri: favorite.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color={COLORS.text.muted} />
              <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
              <TouchableOpacity style={styles.addImageButton}>
                <Ionicons name="add" size={20} color={COLORS.text.primary} />
                <Text style={styles.addImageText}>Agregar foto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre del Plato</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={favorite.name || ''}
              onChangeText={(text) => setFavorite({ ...favorite, name: text })}
              placeholder="Ej: Ensalada César"
              placeholderTextColor={COLORS.text.muted}
              editable={!isLoading}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={favorite.description || ''}
              onChangeText={(text) => setFavorite({ ...favorite, description: text })}
              placeholder="Describe tu plato favorito..."
              placeholderTextColor={COLORS.text.muted}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          {/* Meal Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tipo de Comida</Text>
            <View style={styles.mealTypeGrid}>
              {mealTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.mealTypeButton,
                    favorite.meal_type === type.id && styles.mealTypeButtonSelected
                  ]}
                  onPress={() => setFavorite({ ...favorite, meal_type: type.id as any })}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={20} 
                    color={favorite.meal_type === type.id ? COLORS.text.primary : COLORS.text.secondary} 
                  />
                  <Text style={[
                    styles.mealTypeText,
                    favorite.meal_type === type.id && styles.mealTypeTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Nutrition Info */}
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>Información Nutricional</Text>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionIcon}>
                  <Ionicons name="flame" size={20} color={COLORS.status.error} />
                </View>
                <Text style={styles.nutritionLabel}>Calorías</Text>
                <TextInput
                  style={[styles.nutritionInput, errors.calories && styles.inputError]}
                  value={favorite.calories?.toString() || ''}
                  onChangeText={(text) => setFavorite({ ...favorite, calories: parseInt(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.nutritionItem}>
                <View style={styles.nutritionIcon}>
                  <Ionicons name="fitness" size={20} color={COLORS.primary.sky} />
                </View>
                <Text style={styles.nutritionLabel}>Proteína (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={favorite.protein?.toString() || ''}
                  onChangeText={(text) => setFavorite({ ...favorite, protein: parseInt(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.nutritionItem}>
                <View style={styles.nutritionIcon}>
                  <Ionicons name="nutrition" size={20} color={COLORS.primary.amber} />
                </View>
                <Text style={styles.nutritionLabel}>Carbohidratos (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={favorite.carbs?.toString() || ''}
                  onChangeText={(text) => setFavorite({ ...favorite, carbs: parseInt(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.nutritionItem}>
                <View style={styles.nutritionIcon}>
                  <Ionicons name="water" size={20} color={COLORS.status.success} />
                </View>
                <Text style={styles.nutritionLabel}>Grasas (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={favorite.fat?.toString() || ''}
                  onChangeText={(text) => setFavorite({ ...favorite, fat: parseInt(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
            </View>

            {errors.calories && (
              <Text style={styles.errorText}>{errors.calories}</Text>
            )}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[COLORS.primary.sky, '#0EA5E9']}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.text.primary} />
              ) : (
                <>
                  <Ionicons name="save" size={20} color={COLORS.text.primary} />
                  <Text style={styles.saveButtonText}>
                    {favoriteId ? 'Guardar Cambios' : 'Crear Favorito'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.xs,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.status.error,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.sky,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  addImageText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  formSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    ...SHADOWS.sm,
  },
  inputError: {
    borderColor: COLORS.status.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.status.error,
    fontFamily: FONTS.primary,
    marginTop: SPACING.xs,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    gap: SPACING.xs,
  },
  mealTypeButtonSelected: {
    backgroundColor: COLORS.primary.sky,
    borderColor: COLORS.primary.sky,
  },
  mealTypeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  mealTypeTextSelected: {
    color: COLORS.text.primary,
  },
  nutritionSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  nutritionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  nutritionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  nutritionInput: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
});
