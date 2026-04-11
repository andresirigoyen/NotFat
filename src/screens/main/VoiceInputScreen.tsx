import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useCreateMealWithItems } from '@/hooks/useMeals';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/SupabaseContext';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const VoiceInputScreen = () => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const route = useRoute();
  const { mealType, mealDate } = route.params as { mealType: string; mealDate?: string };
  
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  
  const { isRecording, isProcessing: voiceProcessing, startRecording, stopRecording, audioUri } = useVoiceInput();
  const { mutateAsync: createMeal } = useCreateMealWithItems();

  // Monitor task status when we have a taskId
  const { data: taskData } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data } = await supabase
        .from('task_queue')
        .select('status, metadata, error_message')
        .eq('id', taskId)
        .single();
      return data;
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'error') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  // When task completes, get the result
  useEffect(() => {
    if (taskData?.status === 'completed' && taskData.metadata) {
      const transcription = taskData.metadata?.transcription || taskData.metadata?.analysis?.transcription;
      const mealName = taskData.metadata?.analysis?.name;
      
      if (transcription) {
        setTranscript(transcription);
      } else if (mealName) {
        setTranscript(mealName);
      }
      setIsProcessing(false);
      setTaskId(null);
    } else if (taskData?.status === 'error') {
      Alert.alert('Error', taskData.error_message || 'No se pudo procesar el audio');
      setIsProcessing(false);
      setTaskId(null);
    }
  }, [taskData]);

  console.log('[VoiceInput] isRecording:', isRecording, 'voiceProcessing:', voiceProcessing, 'taskId:', taskId, 'taskData:', taskData);

  const handleVoiceInput = async () => {
    console.log('[VoiceInput] handleVoiceInput called, Platform:', Platform.OS);
    
    if (isWeb) {
      Alert.alert('Disponible en móvil', 'La entrada de voz no está disponible en web.');
      return;
    }

    try {
      setIsProcessing(true);
      setTranscript(''); // Clear previous transcript
      console.log('[VoiceInput] Starting recording...');
      await startRecording();
      console.log('[VoiceInput] Recording started successfully');
    } catch (error: any) {
      console.error('[VoiceInput] Error starting recording:', error);
      Alert.alert('Error', `No se pudo iniciar la grabación: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleStopRecording = async () => {
    console.log('[VoiceInput] handleStopRecording called');
    try {
      console.log('[VoiceInput] Stopping recording...');
      const capturedTaskId = await stopRecording();
      console.log('[VoiceInput] Recording stopped, taskId:', capturedTaskId);
      
      if (capturedTaskId) {
        setTaskId(capturedTaskId);
        console.log('[VoiceInput] Monitoring task:', capturedTaskId);
      } else {
        console.log('[VoiceInput] No taskId returned, audio may not have been processed');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('[VoiceInput] Error stopping recording:', error);
      Alert.alert('Error', `No se pudo procesar el audio: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Show message if on web
  if (isWeb) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.instructionCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="mic-off" size={40} color={colors.text.muted} />
          </View>
          <Text style={[styles.instructionTitle, { textAlign: 'center' }]}>Entrada de voz</Text>
          <Text style={[styles.instructionText, { textAlign: 'center', color: colors.text.secondary }]}>
            La entrada por voz no está disponible en versión web.{'\n'}
            Por favor usa la app en un dispositivo móvil o simulador.
          </Text>
          <TouchableOpacity 
            style={[styles.voiceButton, { backgroundColor: colors.primary.amber, marginTop: SPACING.xl }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.voiceButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveMeal = async () => {
    if (!transcript.trim()) {
      Alert.alert('Error', 'No hay transcripción para guardar');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create meal with voice transcript
      await createMeal({
        meal: {
          name: transcript,
          meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
          source_type: 'voice',
          status: 'complete',
          meal_at: (mealDate && mealDate !== 'before') ? mealDate : new Date().toISOString(),
          image_url: null,
          recorded_timezone: null,
          llm_used: null,
          modified: false,
          is_from_favorite: false,
          image_url_aux: null,
          feedback: null,
          recommendation: null,
          api_time_ms: null,
          processing_time_ms: null,
          prompt_version: null,
        },
        items: [{
          name: transcript,
          quantity: 1,
          unit: 'unit',
          calories: 350,
          protein: 25,
          carbs: 30,
          fat: 12,
          barcode_number: null,
          scanned: false,
          servings: 1,
          contributed: false,
          nutriscore_grade: null,
          nova_group: null,
          notfat_score: null,
          labels_tags: null,
          additives_tags: null,
          notfat_score_breakdown: null,
          additives_details: null,
          is_alcoholic: false,
          has_ingredients_data: false,
        }],
      });
      
      Alert.alert('Éxito', 'Comida guardada correctamente');
      navigation.navigate('Home' as never);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comida');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Entrada por Voz</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="mic" size={48} color={colors.primary.amber} />
          </View>
          <Text style={styles.instructionTitle}>Describe tu comida</Text>
          <Text style={styles.instructionText}>
            Mantén presionado el botón y describe lo que comiste. Ej: "Pollo con arroz y ensalada"
          </Text>
        </View>

        {/* Voice Input Button */}
        <View style={styles.voiceContainer}>
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonRecording,
              (isProcessing || voiceProcessing) && styles.voiceButtonDisabled
            ]}
            onPressIn={handleVoiceInput}
            onPressOut={handleStopRecording}
            disabled={isProcessing || voiceProcessing}
            activeOpacity={0.8}
          >
            {(isProcessing || voiceProcessing) ? (
              <ActivityIndicator size="large" color={colors.background.primary} />
            ) : (
              <Ionicons 
                name="mic" 
                size={48} 
                color={isRecording ? colors.background.primary : colors.primary.amber} 
              />
            )}
          </TouchableOpacity>
          
          <Text style={styles.voiceButtonText}>
            {isRecording ? 'Suelta para terminar' : isProcessing ? 'Procesando...' : 'Mantén presionado para hablar'}
          </Text>
        </View>

        {/* Transcript Display */}
        {transcript ? (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptTitle}>Transcripción:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveMeal}
              disabled={isProcessing}
            >
              <Text style={styles.saveButtonText}>
                {isProcessing ? 'Guardando...' : 'Guardar Comida'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  instructionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(252,211,77,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  instructionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  voiceContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  voiceButton: {
    width: '30%',
    aspectRatio: 1,
    maxWidth: 120,
    borderRadius: 60,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary.amber,
    marginBottom: SPACING.md,
  },
  voiceButtonRecording: {
    backgroundColor: colors.primary.amber,
    transform: [{ scale: 1.05 }],
  },
  voiceButtonDisabled: {
    opacity: 0.6,
    borderColor: colors.text.secondary,
  },
  voiceButtonText: {
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  transcriptCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  transcriptTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  transcriptText: {
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  saveButton: {
    backgroundColor: colors.primary.amber,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: colors.background.primary,
    fontFamily: FONTS.primary,
  },
});

export default VoiceInputScreen;
