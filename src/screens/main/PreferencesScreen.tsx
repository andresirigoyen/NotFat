import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [notifications, setNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
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
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferencias</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Preferences Sections */}
      {preferences.map((section, index) => (
        <View key={index} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon as any} size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>{item.label}</Text>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={item.value ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Account Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color="#6B7280" />
          <Text style={styles.sectionTitle}>Cuenta</Text>
        </View>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionLabel}>Cambiar Contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionLabel}>Exportar Datos</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionItem, styles.dangerAction]}>
            <Text style={[styles.actionLabel, styles.dangerText]}>Eliminar Cuenta</Text>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
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
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 4,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#374151',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  actionLabel: {
    fontSize: 16,
    color: '#374151',
  },
  dangerAction: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dangerText: {
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  version: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
