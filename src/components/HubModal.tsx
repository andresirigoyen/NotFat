import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type HubModalProps = {
  visible: boolean;
  onClose: () => void;
};

const OPTIONS = [
  {
    icon: 'camera',
    label: 'Cámara',
    sub: 'Análisis IA',
    color: COLORS.primary.amber,
    bg: 'rgba(252,211,77,0.12)',
  },
  {
    icon: 'mic',
    label: 'Voz',
    sub: 'Dictado natural',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
  },
  {
    icon: 'barcode',
    label: 'Código de barras',
    sub: 'Escanear producto',
    color: COLORS.primary.sky,
    bg: 'rgba(56,189,248,0.12)',
  },
  {
    icon: 'search',
    label: 'Búsqueda',
    sub: 'Ingreso manual',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.12)',
  },
];

export default function HubModal({ visible, onClose }: HubModalProps) {
  // Option scales for press interaction
  const scale0 = useRef(new Animated.Value(1)).current;
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;
  const scales = [scale0, scale1, scale2, scale3];

  // Pan and opacity animations for gesture dismissal
  const panY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entry animation
      panY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      panY.setValue(0);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          handleDismiss();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  const handlePress = (index: number) => {
    Animated.sequence([
      Animated.timing(scales[index], { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scales[index], { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
            )}
          </Animated.View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: panY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleBar} />
          <Text style={styles.title}>Registrar alimento</Text>
          <Text style={styles.subtitle}>¿Cómo deseas agregar lo que comiste?</Text>

          <View style={styles.grid}>
            {OPTIONS.map((opt, i) => (
              <Animated.View key={opt.label} style={{ transform: [{ scale: scales[i] }], width: '48%' }}>
                <TouchableOpacity
                  style={[styles.optionCard, { backgroundColor: opt.bg, borderColor: opt.color + '33' }]}
                  onPress={() => handlePress(i)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: opt.color + '22' }]}>
                    <Ionicons name={opt.icon as any} size={32} color={opt.color} />
                  </View>
                  <Text style={[styles.optionLabel, { color: opt.color }]}>{opt.label}</Text>
                  <Text style={styles.optionSub}>{opt.sub}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss} activeOpacity={0.7}>
            <View style={styles.closeCircle}>
              <Ionicons name="close" size={26} color={COLORS.text.primary} />
            </View>
            <Text style={styles.closeLabel}>Cerrar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handleBar: {
    width: 44,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 130,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  optionSub: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  closeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  closeLabel: {
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
  },
});
