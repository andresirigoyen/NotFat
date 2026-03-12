import { useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import * as ImagePicker from 'expo-image-picker';

export const useAIAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const analyzeMealImage = async (imageUri: string) => {
    if (!user) return;
    
    setAnalyzing(true);
    setError(null);

    try {
      // 1. Upload image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'meal.jpg',
        type: 'image/jpeg',
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, formData);

      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage.from('meal-images').getPublicUrl(fileName).data.publicUrl;

      // 2. Call Supabase Edge Function for AI Analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-meal', {
        body: { imageUrl, userId: user.id },
      });

      if (analysisError) throw analysisError;

      return analysisData;
    } catch (err: any) {
      setError(err.message || 'Error al analizar la imagen');
      console.error('AI Analysis Error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Permiso de cámara denegado');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  return {
    analyzeMealImage,
    pickImage,
    takePhoto,
    analyzing,
    error,
  };
};
