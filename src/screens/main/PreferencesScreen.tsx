import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [notifications, setNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(true);
  const [analytics, setAnalytics] = React.useState(true);

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
        { label: 'Modo Oscuro', value: darkMode, onToggle: setDarkMode },
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
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferencias</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Preferences Sections */}
      {preferences.map((section, index) => (
        <View key={index} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon as any} size={20} color={COLORS.primary.amber} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>{item.label}</Text>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: COLORS.background.border, true: COLORS.primary.amber }}
                  thumbColor={item.value ? COLORS.background.primary : COLORS.text.secondary}
                  ios_backgroundColor={COLORS.background.tertiary}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Account Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color={COLORS.primary.amber} />
          <Text style={styles.sectionTitle}>Cuenta</Text>
        </View>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionLabel}>Cambiar Contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionLabel}>Exportar Datos</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionItem, styles.dangerAction]}>
            <Text style={[styles.actionLabel, styles.dangerText]}>Eliminar Cuenta</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.status.error} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
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
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  placeholder: {
    width: 24,
  },
  section: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
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
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  preferenceLabel: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  actionLabel: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  dangerAction: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: COLORS.status.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  version: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  copyright: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
  },
});
