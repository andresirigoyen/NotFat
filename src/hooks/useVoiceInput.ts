import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/SupabaseContext';
import { useAuthStore } from '@/store';
import { useMicrophonePermissions } from 'expo-camera';
import { useAudioRecorder, RecordingOptions, RecordingPresets } from 'expo-audio';

interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  audioUri: string | null;
  duration: number;
}

interface TaskQueue {
  id: string;
  audio_url: string;
  text_description?: string;
  task_type: 'voice';
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
}

export function useVoiceInput() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionResponse, requestPermission] = useMicrophonePermissions();
  // ✅ FIX #4: Ref para el intervalo de monitoreo — permite limpiarlo si el componente se desmonta
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Crear entrada en task_queue
  const createTaskMutation = useMutation({
    mutationFn: async (audioUrl: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const taskData = {
        audio_url: audioUrl,
        task_type: 'voice' as const,
        user_id: user.id,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('task_queue')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data as TaskQueue;
    },
  });

  // Subir audio a Supabase Storage
  const uploadAudioMutation = useMutation({
    mutationFn: async (audioUri: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const fileName = `voice-input/${user.id}/${Date.now()}.m4a`;
      
      const response = await fetch(audioUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('audio-uploads')
        .upload(fileName, blob, {
          contentType: 'audio/m4a',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-uploads')
        .getPublicUrl(fileName);

      return publicUrl;
    },
  });

  // Procesar audio con Edge Function
  const processAudioMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase.functions.invoke('process-voice-input', {
        body: { taskId },
      });

      if (error) throw error;
      return data;
    },
  });

  const startRecording = useCallback(async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          Alert.alert('Error', 'Se requieren permisos de audio para usar esta función');
          return;
        }
      }

      const { Audio } = require('expo-audio');
      if (Audio && Audio.setAudioModeAsync) {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
      }

      await recorder.record();

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  }, [permissionResponse, requestPermission, recorder]);

  const stopRecording = useCallback(async () => {
    if (!recorder.isRecording) return;

    try {
      setIsProcessing(true);

      await recorder.stop();
      const uri = recorder.uri;

      if (!uri) {
        throw new Error('No se pudo obtener el URI del audio');
      }

      const audioUrl = await uploadAudioMutation.mutateAsync(uri);
      const task = await createTaskMutation.mutateAsync(audioUrl);

      const monitorProcessing = () => {
        let attempts = 0;
        const maxAttempts = 30;

        // ✅ FIX #4: Guardar referencia del intervalo para poder cancelarlo
        monitorIntervalRef.current = setInterval(async () => {
          attempts++;

          try {
            const { data: status } = await supabase
              .from('task_queue')
              .select('status, error_message')
              .eq('id', task.id)
              .single();

            if (!status) return;

            if (status.status === 'completed') {
              if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
              monitorIntervalRef.current = null;
              setIsProcessing(false);
              queryClient.invalidateQueries({ queryKey: ['meals'] });

              Alert.alert(
                '¡Listo!',
                'Tu entrada de voz ha sido procesada correctamente',
                [{ text: 'OK' }]
              );

            } else if (status.status === 'error') {
              if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
              monitorIntervalRef.current = null;
              setIsProcessing(false);
              Alert.alert(
                'Error',
                'No se pudo procesar tu audio. Intenta nuevamente.',
                [{ text: 'OK' }]
              );

            } else if (attempts >= maxAttempts) {
              if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
              monitorIntervalRef.current = null;
              setIsProcessing(false);
              Alert.alert(
                'Tiempo agotado',
                'El procesamiento está tomando más tiempo de lo esperado. Revisa más tarde.',
                [{ text: 'OK' }]
              );
            }
          } catch (error) {
            console.error('Error checking task status:', error);
          }
        }, 10000);
      };

      monitorProcessing();

    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'No se pudo procesar el audio');
    }
  }, [recorder, uploadAudioMutation, createTaskMutation, queryClient]);

  const cancelRecording = useCallback(async () => {
    if (!recorder.isRecording) return;

    try {
      await recorder.stop();
      // ✅ FIX #4: Limpiar el intervalo si se cancela durante el monitoreo
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      setIsProcessing(false);

    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  }, [recorder]);

  // ✅ FIX #4: Cleanup al desmontar — evita setState sobre componente desmontado
  useEffect(() => {
    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    };
  }, []);

  return {
    isRecording: recorder.isRecording,
    isProcessing,
    audioUri: recorder.uri,
    duration: recorder.currentTime,
    startRecording,
    stopRecording,
    cancelRecording,
    isLoading: uploadAudioMutation.isPending || 
              createTaskMutation.isPending || 
              processAudioMutation.isPending ||
              isProcessing,
  };
}

