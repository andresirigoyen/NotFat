import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useCreateMealWithItems } from '@/hooks/useMeals';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const VoiceInputScreen = () => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const route = useRoute();
  const { mealType, mealDate } = route.params as { mealType: string; mealDate?: string };
  
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { isRecording, isProcessing: voiceProcessing, startRecording, stopRecording } = useVoiceInput();
  const { mutateAsync: createMeal } = useCreateMealWithItems();

  const handleVoiceInput = async () => {
    try {
      setIsProcessing(true);
      
      // Start recording
      await startRecording();
      
      // Simulate recording for demo (in real implementation, this would be handled by the hook)
      setTimeout(() => {
        stopRecording();
        
        // Mock transcript for demo - in real implementation this would come from voice processing
        const mockTranscript = "Una ensalada con pollo a la parrilla, arroz integral y vegetales";
        setTranscript(mockTranscript);
        setIsProcessing(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error in voice input:', error);
      Alert.alert('Error', 'No se pudo procesar el audio');
      setIsProcessing(false);
    }
  };

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
            {isRecording ? 'Grabando...' : isProcessing ? 'Procesando...' : 'Mantén presionado para hablar'}
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
    width: 120,
    height: 120,
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
