import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signUp } = useAuthStore();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [focused, setFocused] = React.useState<'name' | 'email' | 'password' | 'confirm' | null>(null);

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
      const { error } = await signUp(email.trim(), password, name.trim());
      if (error) {
        console.error('SignUp error:', error);
        Alert.alert('Error', error.message || 'No pudimos crear tu cuenta. Intenta nuevamente.');
        return;
      }
      Alert.alert(
        'Cuenta creada',
        'Te hemos enviado un correo de confirmación (si está configurado). Inicia sesión para continuar.',
        [
          {
            text: 'Ir a iniciar sesión',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background.primary, COLORS.background.secondary, COLORS.background.primary]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 12 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
            </TouchableOpacity>

            <View style={styles.brand}>
              <Text style={styles.brandEmoji}>🦦</Text>
              <Text style={styles.brandText}>NotFat</Text>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Ionicons name="log-in-outline" size={22} color={COLORS.text.primary} />
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
                <Ionicons name="person-outline" size={20} color={focused === 'name' ? COLORS.primary.amber : COLORS.text.muted} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={COLORS.text.muted}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrap, focused === 'email' && styles.inputWrapFocused]}>
                <Ionicons name="mail-outline" size={20} color={focused === 'email' ? COLORS.primary.amber : COLORS.text.muted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputWrap, focused === 'password' && styles.inputWrapFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={focused === 'password' ? COLORS.primary.amber : COLORS.text.muted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={COLORS.text.muted}
                  secureTextEntry
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[styles.inputWrap, focused === 'confirm' && styles.inputWrapFocused]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={focused === 'confirm' ? COLORS.primary.amber : COLORS.text.muted} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={COLORS.text.muted}
                  secureTextEntry
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Terms */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.termsRow}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms ? (
                  <Ionicons name="checkmark" size={16} color={COLORS.background.primary} />
                ) : null}
              </View>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.termsLink}>Términos</Text> y la{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, (!acceptTerms || isLoading) && styles.primaryBtnDisabled]}
            onPress={handleSignUp}
            disabled={!acceptTerms || isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.primary.amber, '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnInner}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.background.primary} />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Crear cuenta</Text>
                  <View style={styles.chevrons}>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.background.primary} />
                    <Ionicons name="chevron-forward" size={18} color={COLORS.background.primary} style={{ marginLeft: -10, opacity: 0.5 }} />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.secondaryBtnText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
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
    color: COLORS.text.primary,
    letterSpacing: -0.2,
  },
  header: { marginBottom: SPACING.xl },
  title: {
    fontSize: FONTS.sizes['4xl'],
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.extrabold,
    color: COLORS.text.primary,
    letterSpacing: -0.6,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
    color: COLORS.text.tertiary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.background.border,
    padding: SPACING.lg,
    ...SHADOWS.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  field: { marginBottom: SPACING.md },
  label: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  inputWrapFocused: {
    borderColor: 'rgba(252, 211, 77, 0.45)',
    backgroundColor: 'rgba(252, 211, 77, 0.06)',
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
    color: COLORS.text.primary,
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
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: SPACING.md,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary.amber,
    borderColor: COLORS.primary.amber,
  },
  termsText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    color: COLORS.text.tertiary,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary.amber,
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
  primaryBtnText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    color: COLORS.background.primary,
  },
  chevrons: { flexDirection: 'row', alignItems: 'center' },
  secondaryBtn: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
});
