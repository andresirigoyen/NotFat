import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

type HydrationModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number) => void;
};

const OPTIONS = [
  { icon: 'water-outline', label: 'Vaso', amount: 250 },
  { icon: 'flask-outline', label: 'Botella S', amount: 500 },
  { icon: 'beer-outline', label: 'Botella L', amount: 1000 },
];

export default function HydrationModal({ visible, onClose, onAdd }: HydrationModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const fillAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60 }).start();
    } else {
      scaleAnim.setValue(0.85);
      setSelected(null);
      fillAnim.setValue(0);
    }
  }, [visible]);

  const selectOption = (index: number) => {
    setSelected(index);
    fillAnim.setValue(0);
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handleAdd = () => {
    if (selected === null) return;
    onAdd(OPTIONS[selected].amount);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="water" size={24} color={COLORS.primary.sky} />
            <Text style={styles.title}>Registrar agua</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.optionsRow}>
            {OPTIONS.map((opt, i) => {
              const isSelected = selected === i;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => selectOption(i)}
                  activeOpacity={0.8}
                >
                  {/* Water Fill Animation */}
                  <View style={styles.glassWrapper}>
                    <Animated.View
                      style={[
                        styles.waterFill,
                        isSelected && {
                          height: fillAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '60%'],
                          }),
                          backgroundColor: COLORS.primary.sky,
                        },
                      ]}
                    />
                    <Ionicons
                      name={opt.icon as any}
                      size={36}
                      color={isSelected ? COLORS.background.primary : COLORS.primary.sky}
                      style={styles.glassIcon}
                    />
                  </View>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionAmount, isSelected && styles.optionAmountSelected]}>
                    {opt.amount >= 1000 ? `${opt.amount / 1000}L` : `${opt.amount}ml`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, selected === null && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={selected === null}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={COLORS.background.primary} />
            <Text style={styles.addButtonText}>
              {selected !== null ? `Añadir ${OPTIONS[selected].amount >= 1000 ? `${OPTIONS[selected].amount / 1000}L` : `${OPTIONS[selected].amount}ml`}` : 'Selecciona una cantidad'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 28,
    padding: SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(56,189,248,0.05)',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: COLORS.primary.sky,
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  glassWrapper: {
    width: 52,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
    position: 'relative',
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
    borderRadius: BORDER_RADIUS.sm,
  },
  glassIcon: {
    position: 'relative',
    zIndex: 1,
  },
  optionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  optionLabelSelected: {
    color: COLORS.primary.sky,
  },
  optionAmount: {
    fontSize: FONTS.sizes.xs,
    color: '#555',
    fontFamily: FONTS.primary,
  },
  optionAmountSelected: {
    color: COLORS.primary.sky,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: COLORS.primary.sky,
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  addButtonDisabled: {
    backgroundColor: '#1E1E1E',
  },
  addButtonText: {
    color: COLORS.background.primary,
    fontFamily: FONTS.primary,
    fontWeight: '700',
    fontSize: FONTS.sizes.base,
  },
});
