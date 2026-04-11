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
import { Audio } from 'expo-av';

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
  const [permissionStatus, setPermissionStatus] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionStatus(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

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

  const startRecording = useCallback(async () => {
    try {
      if (!permissionStatus) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Se requieren permisos de audio para usar esta función');
          return;
        }
        setPermissionStatus(true);
      }

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Crear nueva grabación
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      console.log('Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  }, [permissionStatus]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recording) {
      console.log('No active recording to stop');
      return null;
    }

    try {
      setIsProcessing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);

      if (!uri) {
        throw new Error('No se pudo obtener el URI del audio');
      }

      console.log('Recording stopped, URI:', uri);

      // Subir audio y crear tarea
      const audioUrl = await uploadAudioMutation.mutateAsync(uri);
      const task = await createTaskMutation.mutateAsync(audioUrl);

      console.log('Task created:', task.id);
      return task.id;
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
      throw error;
    }
  }, [recording, uploadAudioMutation, createTaskMutation]);

const cancelRecording = useCallback(async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      setIsProcessing(false);

    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  }, [recording]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording: recording !== null,
    isProcessing,
    audioUri: recording?.getURI() || null,
    duration: 0,
    startRecording,
    stopRecording,
    cancelRecording,
    isLoading: uploadAudioMutation.isPending || 
              createTaskMutation.isPending || 
              isProcessing,
  };
}

