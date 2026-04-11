import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

const CustomTimeMealScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    
    // On Android, we need to hide the picker manually after selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    setDate(currentDate);
  };

  const { mealName = '', mealType } = route.params ?? {};

  const handleContinue = () => {
    navigation.navigate('MealLogger', { 
      mealDate: date.toISOString(),
      mealName,
      mealType
    });
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setMode(currentMode);
    setShowPicker(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Hora personalizada</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="time" size={48} color={colors.primary.amber} />
          </View>
        </View>

        <Text style={styles.subtitle}>¿Cuándo fue tu comida?</Text>
        <Text style={styles.description}>
          Selecciona la fecha y hora exacta para mantener un registro preciso de tu nutrición.
        </Text>

        <View style={styles.pickerWrapper}>
          {Platform.OS === 'ios' ? (
            <View style={styles.iosContainer}>
              <View style={styles.pickerRow}>
                <View style={styles.pickerLabelGroup}>
                  <Ionicons name="calendar-outline" size={20} color={colors.text.tertiary} />
                  <Text style={styles.pickerLabel}>Fecha</Text>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onChange}
                  maximumDate={new Date()}
                  themeVariant="dark"
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.pickerRow}>
                <View style={styles.pickerLabelGroup}>
                  <Ionicons name="time-outline" size={20} color={colors.text.tertiary} />
                  <Text style={styles.pickerLabel}>Hora</Text>
                </View>
                <DateTimePicker
                  value={date}
                  mode="time"
                  display="default"
                  onChange={onChange}
                  themeVariant="dark"
                />
              </View>
            </View>
          ) : (
            <View style={styles.androidContainer}>
              <TouchableOpacity 
                style={styles.androidButton} 
                onPress={() => showMode('date')}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary.amber} />
                <View style={styles.androidButtonInfo}>
                  <Text style={styles.androidButtonLabel}>Fecha</Text>
                  <Text style={styles.androidButtonValue}>
                    {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.androidButton} 
                onPress={() => showMode('time')}
              >
                <Ionicons name="time-outline" size={24} color={colors.primary.amber} />
                <View style={styles.androidButtonInfo}>
                  <Text style={styles.androidButtonLabel}>Hora</Text>
                  <Text style={styles.androidButtonValue}>
                    {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          )}

          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={date}
              mode={mode}
              is24Hour={true}
              display="default"
              onChange={onChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Continuar" 
          onPress={handleContinue}
          variant="primary"
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
};

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
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  illustrationContainer: {
    marginTop: SPACING['2xl'],
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: '25%',
    aspectRatio: 1,
    maxWidth: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(252,211,77,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.2)',
  },
  subtitle: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING['2xl'],
  },
  pickerWrapper: {
    width: '100%',
  },
  iosContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  pickerLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pickerLabel: {
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background.border,
    marginVertical: SPACING.xs,
  },
  androidContainer: {
    gap: SPACING.md,
  },
  androidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  androidButtonInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  androidButtonLabel: {
    fontSize: FONTS.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: FONTS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  androidButtonValue: {
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.xl,
  },
  continueButton: {
    height: 56,
    borderRadius: BORDER_RADIUS.full,
  },
});

export default CustomTimeMealScreen;
