import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { PremiumUpsellModal } from './PremiumUpsellModal';
import { COLORS } from '@/constants/theme';

interface PremiumGuardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
}

export const PremiumGuard = ({ children, style, blurIntensity = 15 }: PremiumGuardProps) => {
  const { isPro } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);

  if (isPro) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Content always visible but blurred */}
      <View style={styles.content} pointerEvents="none">
        {children}
      </View>
      
      {/* Blur Overlay */}
      <BlurView intensity={blurIntensity} style={StyleSheet.absoluteFill} tint="dark" />
      
      {/* Interaction Layer */}
      <TouchableOpacity 
        style={styles.lockOverlay} 
        activeOpacity={0.9} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.lockCircle}>
          <Ionicons name="lock-closed" size={24} color={COLORS.primary.amber} />
        </View>
      </TouchableOpacity>

      <PremiumUpsellModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    opacity: 0.8,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
});
