import { useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import { useScanStore } from '@/store/scans';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export const useAIAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isPro } = useAuthStore();
  const { getTodayScans, incrementScan } = useScanStore();

  const analyzeMealImage = async (imageUri: string) => {
    console.log('[useAIAnalysis] Starting analysis for:', imageUri);
    
    if (!user) {
      console.log('[useAIAnalysis] No user, returning null');
      return;
    }

    // Restriction for Free Users
    const todayScans = getTodayScans();
    if (!isPro && todayScans >= 3) {
      const errorMsg = 'Límite de análisis alcanzado. Pásate a Pro para análisis ilimitados.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    setAnalyzing(true);
    setError(null);

    try {
      // 1. Upload image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      console.log('[useAIAnalysis] Uploading image:', fileName);
      
      // Fetch the image and convert to ArrayBuffer
      const imageResponse = await fetch(imageUri);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);
      console.log('[useAIAnalysis] Image bytes length:', imageBytes.length);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, imageBytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[useAIAnalysis] Upload error:', uploadError);
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName);
      
      const imageUrl = urlData.publicUrl;
      console.log('[useAIAnalysis] Image uploaded, URL:', imageUrl);

      // 2. Call Supabase Edge Function for AI Analysis
      console.log('[useAIAnalysis] Calling analyze-meal function...');
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-meal', {
        body: { imageUrl, userId: user.id },
      });

      if (analysisError) {
        console.error('[useAIAnalysis] Analysis error:', analysisError);
        throw new Error(`Error analyzing image: ${analysisError.message}`);
      }

      // If successful, increment scan counter
      incrementScan();
      console.log('[useAIAnalysis] Analysis result:', analysisData);
      return analysisData;
    } catch (err: any) {
      setError(err.message || 'Error al analizar la imagen');
      console.error('[useAIAnalysis] Error:', err);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  };

  const pickImage = async () => {
    console.log('[useAIAnalysis] Requesting media library permissions...');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('[useAIAnalysis] Media library status:', status);
    
    if (status !== 'granted') {
      setError('Permiso de galería denegado');
      console.log('[useAIAnalysis] Media library permission denied');
      return null;
    }

    console.log('[useAIAnalysis] Opening image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    console.log('[useAIAnalysis] Image picker result:', result);

    if (!result.canceled) {
      console.log('[useAIAnalysis] Image selected:', result.assets[0].uri);
      return result.assets[0].uri;
    }
    
    console.log('[useAIAnalysis] Image picker cancelled');
    return null;
  };

  const takePhoto = async () => {
    console.log('[useAIAnalysis] takePhoto called, Platform:', Platform.OS);
    
    // Web doesn't support camera well - show message
    if (Platform.OS === 'web') {
      setError('La cámara no está disponible en web. Usa la opción de Galería o un dispositivo móvil.');
      console.log('[useAIAnalysis] Camera not available on web');
      return null;
    }

    console.log('[useAIAnalysis] Requesting camera permissions...');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('[useAIAnalysis] Camera status:', status);
    
    if (status !== 'granted') {
      setError('Permiso de cámara denegado');
      console.log('[useAIAnalysis] Camera permission denied');
      return null;
    }

    console.log('[useAIAnalysis] Launching camera...');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    console.log('[useAIAnalysis] Camera result:', result);

    if (!result.canceled) {
      console.log('[useAIAnalysis] Photo captured:', result.assets[0].uri);
      return result.assets[0].uri;
    }
    
    console.log('[useAIAnalysis] Camera cancelled');
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
