import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useNotifications';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';

export default function OnboardingNotificationScreen() {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const { registerForPushNotificationsAsync } = useNotifications();

  const [meals, setMeals] = useState(true);
  const [water, setWater] = useState(true);
  const [motivation, setMotivation] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const allOff = !meals && !water && !motivation;

  const handleEnableSupport = async () => {
    setIsLoading(true);
    try {
      // Guardar preferencias en el store
      setOnboardingData({
        notification_settings: { meals, water, motivation },
        last_visited_step: 'OnboardingNotification'
      });

      // Si al menos una está activada, pedimos permiso nativo
      if (!allOff) {
        await registerForPushNotificationsAsync();
      }

      navigation.navigate('SignUp' as never);
    } catch (error) {
      console.error('Error requesting notifications:', error);
      navigation.navigate('SignUp' as never);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.progressWrapper}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: '95%' }]} />
          </View>
          <Text style={styles.progressLabel}>FINAL STEP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(800)}>
          <Text style={styles.title}>How should I support you?</Text>
          <Text style={styles.subtitle}>
            Enable reminders to stay on track. You can customize this later.
          </Text>
        </Animated.View>

        <View style={styles.settingsContainer}>
          <Animated.View entering={SlideInRight.delay(200)} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                <Ionicons name="restaurant-outline" size={20} color="#FBBF24" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Meal logging</Text>
                <Text style={styles.settingDesc}>Reminders for breakfast, lunch & dinner.</Text>
              </View>
            </View>
            <Switch 
              value={meals} 
              onValueChange={setMeals}
              trackColor={{ false: '#333', true: '#FBBF24' }}
              thumbColor="#FFF"
            />
          </Animated.View>

          <Animated.View entering={SlideInRight.delay(300)} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="water-outline" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Water tracking</Text>
                <Text style={styles.settingDesc}>Stay hydrated during the day.</Text>
              </View>
            </View>
            <Switch 
              value={water} 
              onValueChange={setWater}
              trackColor={{ false: '#333', true: '#FBBF24' }}
              thumbColor="#FFF"
            />
          </Animated.View>

          <Animated.View entering={SlideInRight.delay(400)} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="flash-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Motivational pushes</Text>
                <Text style={styles.settingDesc}>Custom hacks from your AI Coach.</Text>
              </View>
            </View>
            <Switch 
              value={motivation} 
              onValueChange={setMotivation}
              trackColor={{ false: '#333', true: '#FBBF24' }}
              thumbColor="#FFF"
            />
          </Animated.View>
        </View>

        {allOff && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.mascotAviso}>
            <View style={styles.mascotHeader}>
              <Ionicons name="alert-circle" size={24} color="#FBBF24" />
              <Text style={styles.mascotTitle}>Note from your Coach</Text>
            </View>
            <Text style={styles.mascotText}>
              "Respeto tu espacio, pero recuerda que el 70% de nuestros usuarios exitosos usan recordatorios."
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleEnableSupport}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#FBBF24', '#D97706']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>
              {allOff ? 'Continue anyway' : 'Enable Support'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    height: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrapper: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#111',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
  },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING['2xl'],
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: FONTS.primary,
    lineHeight: 22,
    marginBottom: SPACING['3xl'],
  },
  settingsContainer: {
    gap: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: '#222',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: FONTS.primary,
  },
  settingDesc: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.primary,
    marginTop: 2,
  },
  mascotAviso: {
    marginTop: SPACING['2xl'],
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  mascotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  mascotTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
  },
  mascotText: {
    fontSize: 15,
    color: '#FFF',
    fontFamily: FONTS.primary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  gradient: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontFamily: FONTS.primary,
  },
});
