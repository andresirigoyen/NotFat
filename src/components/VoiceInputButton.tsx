import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { COLORS, SPACING, FONTS } from '@/constants/theme';

const TYPOGRAPHY = {
  heading: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
  body: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
  caption: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
  button: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
};

interface VoiceInputButtonProps {
  onMealCreated?: (mealData: any) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onMealCreated,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceInput();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPressed && isRecording) {
      // Mostrar duración de grabación
      timer = setTimeout(() => {
        // Auto-stop después de 30 segundos
        if (isRecording) {
          stopRecording();
          setIsPressed(false);
        }
      }, 30000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPressed, isRecording, stopRecording]);

  const handlePressIn = () => {
    if (disabled || isProcessing) return;
    
    Vibration.vibrate(50); // Vibración corta al iniciar
    setIsPressed(true);
    startRecording();
  };

  const handlePressOut = () => {
    if (!isPressed || !isRecording) return;
    
    setIsPressed(false);
    stopRecording();
  };

  const handleCancel = () => {
    if (!isRecording) return;
    
    setIsPressed(false);
    Vibration.vibrate([100, 50, 100]); // Vibración de cancelación
    cancelRecording();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isPressed && styles.recordButtonPressed,
          (isProcessing || disabled) && styles.recordButtonDisabled,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isProcessing || disabled}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={24}
              color="#ffffff"
            />
          )}
        </View>
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, { backgroundColor: '#FF4444' }]} />
          <Text style={styles.recordingText}>Grabando...</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {isProcessing && (
        <View style={styles.processingIndicator}>
          <ActivityIndicator size="small" color={COLORS.primary.amber} />
          <Text style={styles.processingText}>Procesando audio...</Text>
        </View>
      )}

      <Text style={styles.helperText}>
        {isRecording 
          ? 'Mantén presionado para grabar' 
          : 'Mantén presionado para hablar'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary.amber,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonPressed: {
    backgroundColor: '#FF4444',
    transform: [{ scale: 1.1 }],
  },
  recordButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  recordingText: {
    ...TYPOGRAPHY.caption,
    color: '#FF4444',
    marginRight: SPACING.md,
  },
  cancelButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 12,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.caption,
    color: '#FF4444',
    fontSize: 12,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 20,
  },
  processingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary.amber,
    marginLeft: SPACING.sm,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: '#666666',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

export default VoiceInputButton;
