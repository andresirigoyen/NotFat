import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore, ThemeMode } from '@/store/themeStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Consumimos el estado global y los colores
  const { themeMode, setThemeMode } = useThemeStore();
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [notifications, setNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(true);

  // Helper para renderizar selectores personalizados en vez de un Switch simple
  const renderThemeSelector = () => (
    <View style={styles.themeSelectorContainer}>
      {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.themeOptionBtn,
            themeMode === mode && styles.themeOptionBtnActive,
          ]}
          onPress={() => setThemeMode(mode)}
        >
          <Text
            style={[
              styles.themeOptionText,
              themeMode === mode && styles.themeOptionTextActive,
            ]}
          >
            {mode === 'light' ? 'Claro' : mode === 'dark' ? 'Oscuro' : 'Auto'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const preferences = [
    {
      title: 'Notificaciones',
      icon: 'notifications',
      items: [
        { label: 'Notificaciones Push', value: notifications, onToggle: setNotifications },
        { label: 'Notificaciones por Email', value: emailNotifications, onToggle: setEmailNotifications },
      ]
    },
    {
      title: 'Apariencia',
      icon: 'color-palette',
      items: [
        { label: 'Tema de la Aplicación', customComponent: renderThemeSelector() },
      ]
    },
    {
      title: 'Privacidad',
      icon: 'lock-closed',
      items: [
        { label: 'Compartir Datos Anónimos', value: analytics, onToggle: setAnalytics },
      ]
    }
  ];

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferencias</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Preferences Sections */}
      {preferences.map((section, index) => (
        <View key={index} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon as any} size={20} color={colors.primary.amber} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.sectionContent}>
            {section.items.map((item: any, itemIndex: number) => (
              <View key={itemIndex} style={item.customComponent ? styles.preferenceItemColumn : styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>{item.label}</Text>
                
                {item.customComponent ? (
                  item.customComponent
                ) : (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: colors.background.border, true: colors.primary.amber }}
                    thumbColor={item.value ? colors.background.primary : colors.text.secondary}
                    ios_backgroundColor={colors.background.tertiary}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Account Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color={colors.primary.amber} />
          <Text style={styles.sectionTitle}>Cuenta</Text>
        </View>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionLabel}>Cambiar Contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionLabel}>Exportar Datos</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionItem, styles.dangerAction]}>
            <Text style={[styles.actionLabel, styles.dangerText]}>Eliminar Cuenta</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.version}>NotFat v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 NotFat Health</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  placeholder: {
    width: 24,
  },
  section: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.border,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    marginLeft: SPACING.sm,
    fontFamily: FONTS.primary,
  },
  sectionContent: {
    padding: SPACING.sm,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
  },
  preferenceItemColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
  },
  preferenceLabel: {
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginTop: SPACING.md,
    width: '100%',
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  themeOptionBtnActive: {
    backgroundColor: colors.background.card,
    ...SHADOWS.sm,
  },
  themeOptionText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.tertiary,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.medium,
  },
  themeOptionTextActive: {
    color: colors.primary.amber,
    fontWeight: FONTS.weights.bold,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
  },
  actionLabel: {
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  dangerAction: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: colors.status.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  version: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  copyright: {
    fontSize: FONTS.sizes.xs,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
  },
});
