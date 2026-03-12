import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/SupabaseContext';
import { useAuthStore } from '@/store';

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
  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
    audioUri: null,
    duration: 0,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
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
      
      // In React Native, fetch the blob from the local URI
      const response = await fetch(audioUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('audio-uploads')
        .upload(fileName, blob, {
          contentType: 'audio/m4a',
          upsert: true,
        });

      if (error) throw error;

      // Obtener URL pública
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
      // Solicitar permisos
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requieren permisos de audio para usar esta función');
        return;
      }

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Crear nueva grabación
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;

      setState(prev => ({
        ...prev,
        isRecording: true,
        audioUri: null,
        duration: 0,
      }));

      // Iniciar grabación
      await recording.startAsync();

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Detener grabación
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No se pudo obtener el URI del audio');
      }

      // Subir audio a Supabase Storage
      const audioUrl = await uploadAudioMutation.mutateAsync(uri);

      // Crear entrada en task_queue
      const task = await createTaskMutation.mutateAsync(audioUrl);

      // Procesar audio
      await processAudioMutation.mutateAsync(task.id);

      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        audioUri: uri,
      }));

      // Invalidar queries para actualizar UI
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals'] });

    } catch (error) {
      console.error('Error stopping recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
      }));
      Alert.alert('Error', 'No se pudo procesar el audio');
    }
  }, [uploadAudioMutation, createTaskMutation, processAudioMutation, queryClient]);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;

      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        audioUri: null,
      }));

    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    isLoading: uploadAudioMutation.isPending || 
              createTaskMutation.isPending || 
              processAudioMutation.isPending,
  };
}
