import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/services/supabase';

// Tipos sincronizados con Prisma
export interface OnboardingData {
  // Sincronizado con Prisma: profiles.gender (gender_enum)
  gender: 'male' | 'female' | 'non_binary' | 'other';
  
  // Sincronizado con Prisma: profiles.birth_date (DateTime)
  birth_date: string;
  
  // Sincronizado con Prisma: profiles.nutrition_goal (String @db.VarChar(255))
  nutrition_goal: string;
  
  // Sincronizado con Prisma: profiles.achievement_goal (String @db.VarChar(255))
  achievement_goal: string;
  
  // Sincronizado con Prisma: profiles.diet_type (String @default("Balanced"))
  diet_type: string;
  
  // Sincronizado con Prisma: profiles.first_name, profiles.last_name (String?)
  first_name: string;
  last_name: string;
  
  // Sincronizado con Prisma: profiles.height_value, profiles.height_unit (Float?, height_unit_enum)
  height_value: number;
  height_unit: 'cm' | 'm' | 'in';
  
  // Sincronizado con Prisma: profiles.weight_value, profiles.weight_unit (Float?, weight_unit_enum)
  weight_value: number;
  weight_unit: 'kg' | 'lb';
  
  // Sincronizado con Prisma: profiles.workout_frequency (String?)
  workout_frequency: string;
  
  // Sincronizado con Prisma: profiles.steps_goal (Int @default(10000))
  steps_goal: number;
  
  // Sincronizado con Prisma: profiles.preferred_bottle_size, profiles.preferred_bottle_unit (Int, water_unit_enum)
  preferred_bottle_size: number;
  preferred_bottle_unit: 'ml' | 'oz';
  
  // Sincronizado con Prisma: profiles.show_calories, profiles.show_hydration (Boolean @default(true))
  show_calories: boolean;
  show_hydration: boolean;
  
  // Sincronizado con Prisma: profiles.timezone (String?)
  timezone: string;
  
  // Sincronizado con Prisma: profiles.onboarding_step (String?)
  onboarding_step: string;
  
  // Sincronizado con Prisma: profiles.onboarding_completed (Boolean?)
  onboarding_completed: boolean;
}

export interface OnboardingStep {
  step: string;
  title: string;
  subtitle: string;
  completed: boolean;
}

export const useOnboarding = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile, profile } = useProfile();
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [isLoading, setIsLoading] = useState(false);

  // Pasos del onboarding sincronizados con Prisma
  const onboardingSteps: OnboardingStep[] = [
    {
      step: 'welcome',
      title: 'Bienvenido a NotFat',
      subtitle: 'Tu compañero inteligente para una vida más saludable',
      completed: false,
    },
    {
      step: 'gender',
      title: '¿Cuál es tu género?',
      subtitle: 'Esta información nos ayuda a personalizar tus metas nutricionales',
      completed: !!profile?.gender,
    },
    {
      step: 'birth_date',
      title: '¿Cuándo es tu cumpleaños?',
      subtitle: 'Esto nos ayuda a calcular tus necesidades calóricas',
      completed: !!profile?.birth_date,
    },
    {
      step: 'goals',
      title: '¿Cuáles son tus metas?',
      subtitle: 'Personalizamos tu experiencia según tus objetivos',
      completed: !!profile?.nutrition_goal,
    },
    {
      step: 'profile',
      title: 'Cuéntanos sobre ti',
      subtitle: 'Tu información física nos ayuda a crear metas personalizadas',
      completed: !!(profile?.first_name && profile?.height_value && profile?.weight_value),
    },
    {
      step: 'activity',
      title: '¿Cuál es tu nivel de actividad?',
      subtitle: 'Esto nos ayuda a ajustar tus metas calóricas y de pasos',
      completed: !!profile?.workout_frequency,
    },
    {
      step: 'preferences',
      title: 'Preferencias Finales',
      subtitle: 'Personaliza tu experiencia con estas configuraciones',
      completed: !!(profile?.preferred_bottle_size && profile?.show_calories !== undefined),
    },
  ];

  // Validar edad mínima (13 años)
  const validateAge = (birthDate: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 13;
    }
    
    return age >= 13;
  };

  // Validar edad máxima (120 años)
  const validateMaxAge = (birthDate: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 <= 120;
    }
    
    return age <= 120;
  };

  // Actualizar paso actual del onboarding
  const updateOnboardingStep = async (step: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: profiles.onboarding_step
      await updateProfile.mutateAsync({
        onboarding_step: step,
      });
      
      setCurrentStep(step);
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar género (sincronizado con Prisma)
  const saveGender = async (gender: OnboardingData['gender']) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: profiles.gender (gender_enum)
      await updateProfile.mutateAsync({
        gender: gender as any,
        onboarding_step: 'birth_date',
      });

      setCurrentStep('birth_date');
      navigation.navigate('OnboardingBirthDate' as never);
    } catch (error) {
      console.error('Error saving gender:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar fecha de nacimiento (sincronizado con Prisma)
  const saveBirthDate = async (birthDate: Date) => {
    if (!user) return;

    // Validaciones
    if (!validateAge(birthDate)) {
      throw new Error('Debes tener al menos 13 años para usar NotFat');
    }

    if (!validateMaxAge(birthDate)) {
      throw new Error('Por favor ingresa una fecha de nacimiento válida');
    }

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: profiles.birth_date (DateTime)
      await updateProfile.mutateAsync({
        birth_date: birthDate.toISOString(),
        onboarding_step: 'goals',
      });

      setCurrentStep('goals');
      navigation.navigate('OnboardingGoals' as never);
    } catch (error) {
      console.error('Error saving birth date:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar objetivos (sincronizado con Prisma)
  const saveGoals = async (data: {
    nutrition_goal: string;
    achievement_goal: string;
    diet_type: string;
  }) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: múltiples campos
      await updateProfile.mutateAsync({
        nutrition_goal: data.nutrition_goal, // String @db.VarChar(255)
        achievement_goal: data.achievement_goal, // String @db.VarChar(255)
        diet_type: data.diet_type, // String @default("Balanced")
        onboarding_step: 'completed',
        onboarding_completed: true, // Boolean?
      });

      setCurrentStep('completed');
      
      // Navegar a la pantalla principal
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Error saving goals:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Completar onboarding
  const completeOnboarding = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: onboarding_completed
      await updateProfile.mutateAsync({
        onboarding_step: 'completed',
        onboarding_completed: true,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Generar metas con IA (sincronizado con Prisma: nutrition_goals)
  const generateAIGoals = async (profileData: any) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Llamar a Edge Function generate-ai-goals
      const { data, error } = await supabase.functions.invoke('generate-ai-goals', {
        body: { 
          userId: user.id,
          profileData: {
            age: profileData.age,
            gender: profileData.gender,
            height: profileData.height,
            weight: profileData.weight,
            workoutFrequency: profileData.workoutFrequency,
            nutritionGoal: profileData.nutritionGoal,
            dietType: profileData.dietType,
          }
        },
      });

      if (error) throw error;

      // Actualizar perfil con metas generadas
      await updateProfile.mutateAsync({
        onboarding_step: 'completed',
        onboarding_completed: true,
      });

      setCurrentStep('completed');
      
      // Navegar a la pantalla principal
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });

      return data;
    } catch (error) {
      console.error('Error generating AI goals:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener progreso del onboarding
  const getProgress = (): number => {
    const completedSteps = onboardingSteps.filter(step => step.completed).length;
    return (completedSteps / onboardingSteps.length) * 100;
  };

  // Obtener siguiente paso
  const getNextStep = (): OnboardingStep | null => {
    const currentIndex = onboardingSteps.findIndex(step => step.step === currentStep);
    return onboardingSteps[currentIndex + 1] || null;
  };

  // Obtener paso anterior
  const getPreviousStep = (): OnboardingStep | null => {
    const currentIndex = onboardingSteps.findIndex(step => step.step === currentStep);
    return onboardingSteps[currentIndex - 1] || null;
  };

  // Reiniciar onboarding
  const resetOnboarding = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateProfile.mutateAsync({
        gender: undefined,
        birth_date: undefined,
        onboarding_step: 'welcome',
        onboarding_completed: false,
      });
      setCurrentStep('welcome');
      navigation.navigate('Welcome' as never);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Estado
    currentStep,
    isLoading,
    onboardingSteps,
    progress: getProgress(),
    
    // Acciones
    updateOnboardingStep,
    saveGender,
    saveBirthDate,
    saveGoals,
    generateAIGoals,
    completeOnboarding,
    resetOnboarding,
    
    // Navegación
    getNextStep,
    getPreviousStep,
    
    // Datos del perfil
    profile,
    user,
  };
};
