import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, User, Mail, Calendar, ChevronRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation }: any) => {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [birthDate, setBirthDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [dietType, setDietType] = React.useState('');
  const [workoutFrequency, setWorkoutFrequency] = React.useState('');
  const [heightValue, setHeightValue] = React.useState('');
  const [weightValue, setWeightValue] = React.useState('');

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || '');
      if (profile.birth_date) {
        setBirthDate(new Date(profile.birth_date));
      }
      setDietType(profile.diet_type || '');
      setWorkoutFrequency(profile.workout_frequency || '');
      setHeightValue(profile.height_value ? String(profile.height_value) : '');
      setWeightValue(profile.weight_value ? String(profile.weight_value) : '');
    }
  }, [profile]);

  const getInitials = () => {
    const a = (firstName || '').trim().charAt(0);
    const b = (lastName || '').trim().charAt(0);
    const initials = `${a}${b}`.toUpperCase();
    return initials || 'NF';
  };

  const pickAvatarFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) return result.assets[0].uri;
    return null;
  };

  const takeAvatarPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos permiso de cámara para tomar tu foto.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) return result.assets[0].uri;
    return null;
  };

  const handleChangeAvatar = async () => {
    if (!profile) return;

    Alert.alert(
      'Cambiar foto',
      'Elige una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar foto',
          onPress: async () => {
            try {
              const uri = await takeAvatarPhoto();
              if (!uri) return;
              await uploadAvatar.mutateAsync(uri);
              Alert.alert('Éxito', 'Tu foto de perfil fue actualizada.');
            } catch (e) {
              Alert.alert('Error', 'No se pudo actualizar la foto.');
            }
          },
        },
        {
          text: 'Elegir de galería',
          onPress: async () => {
            try {
              const uri = await pickAvatarFromLibrary();
              if (!uri) return;
              await uploadAvatar.mutateAsync(uri);
              Alert.alert('Éxito', 'Tu foto de perfil fue actualizada.');
            } catch (e) {
              Alert.alert('Error', 'No se pudo actualizar la foto.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate.toISOString(),
        diet_type: dietType || null,
        workout_frequency: workoutFrequency || null,
        height_value: heightValue ? Number(heightValue) : null,
        weight_value: weightValue ? Number(weightValue) : null,
      });
      Alert.alert('Éxito', 'Tu perfil ha sido actualizado correctamente.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setBirthDate(currentDate);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary.amber} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={28} color={COLORS.primary.amber} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Avatar Edit Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarInitials}>
                      {getInitials()}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleChangeAvatar}
                  disabled={uploadAvatar.isPending}
                  activeOpacity={0.85}
                >
                  {uploadAvatar.isPending ? (
                    <ActivityIndicator color={COLORS.background.primary} size="small" />
                  ) : (
                    <Camera size={20} color={COLORS.background.primary} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.changePhotoText}>Cambiar foto de perfil</Text>
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={COLORS.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Tu nombre"
                    placeholderTextColor={COLORS.text.secondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellidos</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={COLORS.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Tus apellidos"
                    placeholderTextColor={COLORS.text.secondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de dieta</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={COLORS.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={dietType}
                    onChangeText={setDietType}
                    placeholder="Ej: Balanced"
                    placeholderTextColor={COLORS.text.secondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Frecuencia de entrenamiento</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={COLORS.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={workoutFrequency}
                    onChangeText={setWorkoutFrequency}
                    placeholder="Ej: 3x por semana"
                    placeholderTextColor={COLORS.text.secondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Altura</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={COLORS.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={heightValue}
                    onChangeText={setHeightValue}
                    placeholder="Ej: 170"
                    placeholderTextColor={COLORS.text.secondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Peso</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={COLORS.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={weightValue}
                    onChangeText={setWeightValue}
                    placeholder="Ej: 70"
                    placeholderTextColor={COLORS.text.secondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color={COLORS.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={COLORS.text.secondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={false}
                    readOnly={true}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha de nacimiento</Text>
                <TouchableOpacity 
                  style={styles.inputContainer} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color={COLORS.text.secondary} />
                  <Text style={styles.dateText}>
                    {birthDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                  <ChevronRight size={20} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.footer}>
              <Button
                title={updateProfile.isPending ? "Guardando..." : "Guardar Cambios"}
                onPress={handleSave}
                style={styles.saveBtn}
                disabled={updateProfile.isPending || uploadAvatar.isPending}
              />
              <TouchableOpacity 
                style={styles.cancelLink}
                onPress={() => navigation.goBack()}
                disabled={updateProfile.isPending}
              >
                <Text style={styles.cancelText}>Descartar cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  sectionContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    fontFamily: FONTS.primary,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary.amber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarInitials: {
    color: COLORS.background.primary,
    fontSize: 48,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary.amber,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background.secondary,
  },
  changePhotoText: {
    marginTop: SPACING.md,
    color: COLORS.primary.amber,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    height: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  dateText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  footer: {
    gap: SPACING.md,
  },
  saveBtn: {
    height: 64,
    borderRadius: BORDER_RADIUS['2xl'],
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    fontFamily: FONTS.primary,
  },
});

export default EditProfileScreen;
