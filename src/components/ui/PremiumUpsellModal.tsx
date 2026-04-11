import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface PremiumUpsellModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumUpsellModal = ({ visible, onClose }: PremiumUpsellModalProps) => {
  const navigation = useNavigation();

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('Pro' as never);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        <Animated.View 
          entering={FadeInUp.springify()} 
          exiting={FadeOutDown}
          style={styles.modalContent}
        >
          <LinearGradient
            colors={['#1A1A1B', '#0A0A0B']}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={32} color={COLORS.primary.amber} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Nivel Insuficiente.</Text>
            
            <Text style={styles.description}>
              Estás intentando usar herramientas de élite con un compromiso de principiante. 
              El Coach no regala su mejor artillería. Desbloquea Pro o sigue adivinando tus macros.
            </Text>

            <TouchableOpacity 
              style={styles.upgradeButton} 
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary.amber, '#F59E0B']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Demostrar Compromiso (Upgrade)</Text>
                <Ionicons name="rocket" size={20} color="#000" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.maybeLater} onPress={onClose}>
              <Text style={styles.maybeLaterText}>Seguiré adivinando...</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: width - SPACING.xl * 2,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOWS.lg,
  },
  gradient: {
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.primary,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    color: '#9CA3AF',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    fontWeight: '700',
    color: '#000',
  },
  maybeLater: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  maybeLaterText: {
    color: '#4B5563',
    fontSize: 14,
    fontFamily: FONTS.primary,
  },
});
