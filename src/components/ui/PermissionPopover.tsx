import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PermissionPopoverProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onAllow: () => void;
  onDeny: () => void;
  primaryColor?: string;
}

const { width } = Dimensions.get('window');

export const PermissionPopover: React.FC<PermissionPopoverProps> = ({
  visible,
  onClose,
  title,
  description,
  icon,
  onAllow,
  onDeny,
  primaryColor = '#10B981',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}20` }]}>
              <Ionicons name={icon} size={48} color={primaryColor} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Description */}
            <Text style={styles.description}>{description}</Text>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.button, styles.denyButton]} 
                onPress={onDeny}
              >
                <Text style={styles.denyButtonText}>No, gracias</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.allowButton, { backgroundColor: primaryColor }]} 
                onPress={onAllow}
              >
                <Text style={styles.allowButtonText}>Permitir</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
              <Text style={styles.privacyText}>
                Respetamos tu privacidad. Solo usamos estos permisos para mejorar tu experiencia.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 0,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  denyButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  allowButton: {
    // backgroundColor will be set dynamically
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
    lineHeight: 16,
  },
});
