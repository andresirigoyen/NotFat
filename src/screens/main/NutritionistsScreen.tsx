import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  useNutritionists, 
  useInstitutions, 
  useConnectWithNutritionist,
  useTrackNutritionistClick,
  useUserNutritionistConnections
} from '@/hooks/useNutritionists';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const SPECIALTIES = [
  'Deportología',
  'Nutrición Clínica',
  'Vegetariana/Vegana',
  'Pediatría',
  'Geriatría',
  'Embarazo',
  'Diabetes',
  'Enfermedades Cardiovasculares',
  'Salud Mental',
  'Oncología',
];

export default function NutritionistsScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const { data: nutritionists, isLoading } = useNutritionists();
  const { data: institutions } = useInstitutions();
  const { data: userConnections } = useUserNutritionistConnections(profile?.id || '');
  
  const { mutate: connectWithNutritionist } = useConnectWithNutritionist();
  const { mutate: trackClick } = useTrackNutritionistClick();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredNutritionists = nutritionists?.filter(nutritionist => {
    const matchesSearch = !searchQuery || 
      nutritionist.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nutritionist.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nutritionist.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = !selectedSpecialty || 
      nutritionist.specialties?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  }) || [];

  const handleConnect = async (nutritionistId: string) => {
    try {
      await connectWithNutritionist({ nutritionistId });
      Alert.alert('¡Conectado!', 'Ahora puedes contactar directamente con el nutricionista');
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el nutricionista');
    }
  };

  const handleInstagramPress = async (nutritionist: any) => {
    if (nutritionist.instagram_url) {
      await trackClick({ nutritionistId: nutritionist.id, type: 'instagram' });
      // Open Instagram URL
    }
  };

  const handleWhatsAppPress = async (nutritionist: any) => {
    if (nutritionist.phone) {
      await trackClick({ nutritionistId: nutritionist.id, type: 'whatsapp' });
      // Open WhatsApp
    }
  };

  const renderNutritionistCard = (nutritionist: any) => {
    const isConnected = userConnections?.some(conn => conn.nutritionist_id === nutritionist.id);
    const institution = institutions?.find(inst => inst.id === nutritionist.institution_id);

    return (
      <View key={nutritionist.id} style={styles.nutritionistCard}>
        <View style={styles.cardHeader}>
          <View style={styles.profileInfo}>
            {nutritionist.profile_image_url ? (
              <Image source={{ uri: nutritionist.profile_image_url }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={24} color={COLORS.text.secondary} />
              </View>
            )}
            <View style={styles.nameSection}>
              <Text style={styles.nutritionistName}>
                {nutritionist.first_name} {nutritionist.last_name}
              </Text>
              {institution && (
                <Text style={styles.institutionName}>{institution.name}</Text>
              )}
              <View style={styles.specialtiesContainer}>
                {nutritionist.specialties?.slice(0, 2).map((specialty: string, index: number) => (
                  <View key={index} style={styles.specialtyChip}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          {isConnected && (
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.status.success} />
              <Text style={styles.connectedText}>Conectado</Text>
            </View>
          )}
        </View>

        {nutritionist.short_description && (
          <Text style={styles.description}>{nutritionist.short_description}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="logo-instagram" size={16} color={COLORS.text.secondary} />
            <Text style={styles.statText}>{nutritionist.clicks_ig || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="logo-whatsapp" size={16} color={COLORS.text.secondary} />
            <Text style={styles.statText}>{nutritionist.clicks_wtp || 0}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.instagramButton]}
            onPress={() => handleInstagramPress(nutritionist)}
            disabled={!nutritionist.instagram_url}
          >
            <Ionicons name="logo-instagram" size={20} color={COLORS.background.primary} />
            <Text style={styles.actionButtonText}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={() => handleWhatsAppPress(nutritionist)}
            disabled={!nutritionist.phone}
          >
            <Ionicons name="logo-whatsapp" size={20} color={COLORS.background.primary} />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          {!isConnected && (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton]}
              onPress={() => handleConnect(nutritionist.id)}
            >
              <Ionicons name="person-add" size={20} color={COLORS.background.primary} />
              <Text style={styles.actionButtonText}>Conectar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Nutricionistas</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="options" size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar nutricionista..."
            placeholderTextColor={COLORS.text.secondary}
          />
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <Text style={styles.filterTitle}>Especialidades</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtiesScroll}>
            <TouchableOpacity
              style={[
                styles.specialtyFilter,
                !selectedSpecialty && styles.specialtyFilterActive
              ]}
              onPress={() => setSelectedSpecialty('')}
            >
              <Text style={[
                styles.specialtyFilterText,
                !selectedSpecialty && styles.specialtyFilterTextActive
              ]}>
                Todas
              </Text>
            </TouchableOpacity>
            {SPECIALTIES.map((specialty) => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.specialtyFilter,
                  selectedSpecialty === specialty && styles.specialtyFilterActive
                ]}
                onPress={() => setSelectedSpecialty(specialty)}
              >
                <Text style={[
                  styles.specialtyFilterText,
                  selectedSpecialty === specialty && styles.specialtyFilterTextActive
                ]}>
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Nutritionists List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando nutricionistas...</Text>
          </View>
        ) : filteredNutritionists.length > 0 ? (
          filteredNutritionists.map(renderNutritionistCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color={COLORS.text.muted} />
            <Text style={styles.emptyText}>No se encontraron nutricionistas</Text>
            <Text style={styles.emptySub}>Intenta ajustar los filtros de búsqueda</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  filterBtn: {
    padding: SPACING.sm,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    paddingVertical: SPACING.sm,
  },
  filtersSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  specialtiesScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  specialtyFilter: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  specialtyFilterActive: {
    backgroundColor: COLORS.primary.amber,
    borderColor: COLORS.primary.amber,
  },
  specialtyFilterText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  specialtyFilterTextActive: {
    color: COLORS.background.primary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  nutritionistCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  profileInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: SPACING.md,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background.tertiary,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    flex: 1,
  },
  nutritionistName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  institutionName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  specialtyChip: {
    backgroundColor: 'rgba(252,211,77,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  specialtyText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  connectedText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.status.success,
    fontFamily: FONTS.primary,
  },
  description: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  instagramButton: {
    backgroundColor: '#E4405F',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  connectButton: {
    backgroundColor: COLORS.primary.amber,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.background.primary,
    fontFamily: FONTS.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg * 2,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
});
