import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOnboardingStore } from '@/store/onboarding-store';
import { supabase } from '@/services/SupabaseContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

export default function SignUpScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signUp } = useAuthStore();
  const { data: onboardingData, reset: resetOnboarding } = useOnboardingStore();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [focused, setFocused] = React.useState<'name' | 'email' | 'password' | 'confirm' | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Correo inválido');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[SignUp] Attempting to create account for:', email.trim());

      const { error, session, user } = await signUp(email.trim(), password, name.trim());

      if (error) {
        console.error('[SignUp] Error de Supabase:', error);
        Alert.alert('Error de Registro', error.message || 'Error desconocido al crear la cuenta.');
        return;
      }

      console.log('[SignUp] Account created successfully. Session exists:', !!session);

      // Si Supabase devuelve sesión (confirmación desactivada), guardamos perfil y vamos a Home
      if (session) {
        try {
          console.log('[SignUp] Saving captured onboarding data to profile...');
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: email.trim(),
              full_name: name.trim(),
              first_name: name.trim().split(' ')[0],
              last_name: name.trim().split(' ').slice(1).join(' '),
              ...onboardingData,
              onboarding_completed: true,
              onboarding_step: 'completed',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

          if (profileError) {
             console.error('[SignUp] Error saving profile data:', profileError);
          } else {
             console.log('[SignUp] Profile data synced successfully');
             resetOnboarding();
          }

          // Marcamos la identidad del usuario para seguimiento
          const { analytics } = await import('@/services/analytics');
          analytics.identify(session.user.id);
          analytics.trackOnboardingStep('signup_completed_with_data', {
            id: session.user.id,
            email: session.user.email,
            has_onboarding_data: !!onboardingData.gender
          });
        } catch (analyticsError) {
          console.warn('[SignUp] Post-signup logic error (ignored):', analyticsError);
        }

        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'OnboardingGeneratingPlan' }],
        });
      } else {
        // Si requiere confirmación (session es null), mostramos el aviso habitual
        console.log('[SignUp] Email confirmation required (session is null)');
        Alert.alert(
          'Email de Confirmación',
          'Tu cuenta se creó pero necesitas confirmarla. Revisa tu bandeja de entrada (o SPAM) antes de iniciar sesión.',
          [
            {
              text: 'OK, ir a Login',
              onPress: () => (navigation.navigate as any)('Login'),
            },
          ]
        );
      }
    } catch (e: any) {
      console.error('[SignUp] Unexpected error:', e);
      Alert.alert('Error Inesperado', e.message || 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 12 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.brand}>
              <Image 
                source={require('../../../assets/icon.png')} 
                style={{ width: 22, height: 22 }} 
                resizeMode="contain" 
              />
              <Text style={styles.brandText}>NotFat</Text>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Ionicons name="log-in-outline" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Empecemos con lo básico. Te toma menos de un minuto.
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tus datos</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <View style={[styles.inputWrap, focused === 'name' && styles.inputWrapFocused]}>
                <Ionicons name="person-outline" size={20} color={focused === 'name' ? colors.primary.amber : colors.text.muted} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Juan Pérez"
                  placeholderTextColor={colors.text.muted}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputWrap, focused === 'email' && styles.inputWrapFocused]}>
                <Ionicons name="mail-outline" size={20} color={focused === 'email' ? colors.primary.amber : colors.text.muted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputWrap, focused === 'password' && styles.inputWrapFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={focused === 'password' ? colors.primary.amber : colors.text.muted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.text.muted} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[styles.inputWrap, focused === 'confirm' && styles.inputWrapFocused]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={focused === 'confirm' ? colors.primary.amber : colors.text.muted} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.text.muted} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.termsRow}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms ? (
                  <Ionicons name="checkmark" size={16} color={colors.background.primary} />
                ) : null}
              </View>
              <Text style={styles.termsText}>
                {'Acepto los '}
                <Text style={styles.termsLink}>Términos</Text>
                {' y la '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
                {'.'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!acceptTerms || isLoading) && styles.primaryBtnDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={acceptTerms ? [colors.primary.amber, '#F59E0B'] : [colors.interactive.disabled, colors.interactive.disabled]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnInner}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.background.primary} />
              ) : (
                <View style={styles.primaryBtnContent}>
                  <Text style={styles.primaryBtnText}>
                    {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Text>
                  <View style={styles.chevrons}>
                    <Ionicons name="chevron-forward" size={20} color={colors.background.primary} style={{ opacity: 0.6 }} />
                    <Ionicons name="chevron-forward" size={20} color={colors.background.primary} style={{ marginLeft: -12 }} />
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.secondaryBtnText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
          
          <View style={styles.footerInfo}>
            <Ionicons name="shield-checkmark" size={24} color={colors.text.secondary} style={{ marginRight: SPACING.md }} />
            <View style={styles.footerInfoTextWrap}>
              <Text style={styles.footerInfoTitle}>Protección garantizada</Text>
              <Text style={styles.footerInfoDesc}>Tus datos son encriptados de extremo a extremo y nunca son compartidos con terceros.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboard: { flex: 1 },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['3xl'],
    paddingTop: SPACING.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandEmoji: { fontSize: 18 },
  brandText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  header: { marginBottom: SPACING.xl },
  title: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.6,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
    color: colors.text.tertiary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1,
    borderColor: colors.background.border,
    padding: SPACING.lg,
    ...SHADOWS.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    marginBottom: SPACING.lg,
  },
  field: { marginBottom: SPACING.md },
  label: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.secondary,
    marginBottom: SPACING.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  inputWrapFocused: {
    borderColor: colors.primary.amber,
    backgroundColor: isDark ? 'rgba(252, 211, 77, 0.08)' : 'rgba(217, 119, 6, 0.05)',
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
    color: colors.text.primary,
  },
  eyeIcon: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: SPACING.md,
  },
  checkboxChecked: {
    backgroundColor: colors.primary.amber,
    borderColor: colors.primary.amber,
  },
  termsText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary.amber,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  primaryBtn: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  primaryBtnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBtnText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    color: '#FFF', // Texto del botón primario siempre blanco o contrastante
  },
  chevrons: { flexDirection: 'row', alignItems: 'center' },
  secondaryBtn: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.1)',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
  },
  footerInfo: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  footerInfoTextWrap: {
    flex: 1,
  },
  footerInfoTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  footerInfoDesc: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.primary,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
});
