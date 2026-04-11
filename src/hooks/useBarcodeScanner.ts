import { useState, useCallback } from 'react';
import { ScanningResult } from 'expo-camera';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

interface ScanEvent {
  id: string;
  barcode: string;
  origin: string;
  result?: string;
  product_name?: string;
  processing_ms?: number;
  created_at: string;
  completed_at?: string;
}

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const navigation = useNavigation();

  // Registrar evento de escaneo
  const registerScanMutation = useMutation({
    mutationFn: async (barcode: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const scanData = {
        barcode,
        origin: 'mobile_app',
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('scan_events')
        .insert(scanData)
        .select()
        .single();

      if (error) throw error;
      return data as ScanEvent;
    },
  });

  // Consultar producto mediante Edge Function
  const queryProductMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const { data, error } = await supabase.functions.invoke('query-product', {
        body: { barcode },
      });

      if (error) throw error;
      return data;
    },
  });

  // Contribuir con foto del producto
  const contributeProductMutation = useMutation({
    mutationFn: async ({ barcode, imageUrl }: { barcode: string; imageUrl: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const contributionData = {
        barcode,
        front_image_url: imageUrl,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('contribution_queue')
        .insert(contributionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleBarCodeScanned = useCallback(async ({ data }: ScanningResult) => {
    if (!isScanning || lastScanned === data) return; // Evitar escaneos duplicados o si no está activo
    
    setLastScanned(data);
    setIsScanning(false);

    try {
      // 1. Registrar evento de escaneo
      const startTime = Date.now();
      const scanEvent = await registerScanMutation.mutateAsync(data);

      // 2. Consultar producto
      const productData = await queryProductMutation.mutateAsync(data);
      const processingTime = Date.now() - startTime;

      if (productData.found) {
        // Producto encontrado - mostrar información
        Alert.alert(
          'Producto Encontrado',
          `${productData.product.name}\nCalorías: ${productData.product.calories || 'N/A'}`,
          [
            { text: 'Cancelar', onPress: () => setIsScanning(true), style: 'cancel' },
            { text: 'Agregar a Comida', onPress: () => addToMeal(productData) }
          ]
        );
      } else {
        // Producto no encontrado - ofrecer contribuir
        Alert.alert(
          'Producto No Encontrado',
          '¿Deseas contribuir con una foto de este producto para nuestra base de datos?',
          [
            { text: 'No', onPress: () => setIsScanning(true), style: 'cancel' },
            { text: 'Contribuir', onPress: () => requestContribution(data) }
          ]
        );
      }

      // Actualizar evento con resultado (usando el ID del evento)
      await supabase
        .from('scan_events')
        .update({
          result: productData.found ? 'found' : 'not_found',
          product_name: productData.product?.name || 'Unknown',
          processing_ms: processingTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanEvent.id);

    } catch (error) {
      console.error('Error scanning barcode:', error);
      Alert.alert('Error', 'No se pudo procesar el código de barras');
      setIsScanning(true);
    }

    // Resetear lastScanned después de 5 segundos para permitir mismo producto
    setTimeout(() => setLastScanned(null), 5000);
  }, [isScanning, lastScanned, registerScanMutation, queryProductMutation]);

  const addToMeal = async (productData: any) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Crear meal con el producto escaneado
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: productData.product.name || 'Producto Escaneado',
          meal_type: 'snack',
          source_type: 'scanner',
          status: 'complete',
          meal_at: new Date().toISOString(),
          image_url: null,
          recorded_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          llm_used: 'open-food-facts',
          modified: false,
          is_from_favorite: false,
          image_url_aux: null,
          feedback: null,
          recommendation: null,
          api_time_ms: productData.processing_ms || null,
          processing_time_ms: productData.processing_ms || null,
          prompt_version: '1.0',
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Agregar food_item al meal
      const { error: itemError } = await supabase
        .from('food_items')
        .insert({
          meal_id: meal.id,
          user_id: user.id,
          name: productData.product.name,
          quantity: productData.product.quantity || 100,
          unit: 'g',
          calories: Number(productData.product.calories) || 0,
          protein: Number(productData.product.protein) || 0,
          carbs: Number(productData.product.carbs) || 0,
          fat: Number(productData.product.fat) || 0,
          fiber: Number(productData.product.fiber) || 0,
          sugar: Number(productData.product.sugar) || 0,
          sodium: Number(productData.product.sodium) || 0,
          nutriscore_grade: productData.product.nutriscore_grade,
          nova_group: productData.product.nova_group,
          notfat_score: null,
          labels_tags: productData.product.labels_tags || null,
          additives_tags: productData.product.additives_tags || null,
          notfat_score_breakdown: null,
          additives_details: productData.product.additives_details || null,
          is_alcoholic: productData.product.is_alcoholic || false,
          has_ingredients_data: productData.product.ingredients ? true : false,
          barcode_number: productData.barcode,
          scanned: true,
          servings: 1,
          contributed: false
        });

      if (itemError) throw itemError;

      Alert.alert(
        'Éxito',
        'Producto agregado a tu comida',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );

      // Invalidar queries para refrescar dashboard
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary'] });

    } catch (error) {
      console.error('Error adding to meal:', error);
      Alert.alert('Error', 'No se pudo agregar el producto a tu comida');
    }
  };

  const requestContribution = async (barcode: string) => {
    try {
      // Abrir cámara para tomar foto
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Subir imagen a Supabase Storage
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const fileName = `contribution-${barcode}-${Date.now()}.jpg`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contributions')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('contributions')
          .getPublicUrl(fileName);

        // Crear entrada en contribution_queue
        await contributeProductMutation.mutateAsync({
          barcode,
          imageUrl: publicUrl
        });

        Alert.alert(
          '¡Gracias!',
          'Tu contribución ha sido enviada. Ayudas a mejorar NotFat para todos.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error requesting contribution:', error);
      Alert.alert('Error', 'No se pudo procesar tu contribución');
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setLastScanned(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  return {
    isScanning,
    startScanning,
    stopScanning,
    handleBarCodeScanned,
    lastScanned,
    isLoading: registerScanMutation.isPending || queryProductMutation.isPending,
  };
}

