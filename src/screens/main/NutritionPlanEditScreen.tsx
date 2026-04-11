import { useThemeColors } from '@/hooks/useThemeColors';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

type RouteParams = {
  guidelineId: string;
};

export default function NutritionPlanEditScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const route = useRoute();
  const navigation = useNavigation();
  const { guidelineId } = route.params as RouteParams;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.infoTitle}>Edición avanzada en desarrollo</Text>
          <Text style={styles.infoText}>
            El plan con ID:
          </Text>
          <Text style={styles.idText}>{guidelineId}</Text>
          <Text style={styles.infoText}>
            ya está creado correctamente en base a tu esquema. En esta pantalla se podrá ajustar
            día por día y comida por comida, pero por ahora la dejamos sin acciones para que la
            navegación no falle.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  infoTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  idText: {
    fontSize: FONTS.sizes.sm,
    color: colors.primary.amber,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
});

