import { useState, useCallback } from 'react';
import { BarCodeScannerResult } from 'expo-barcode-scanner';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/services/SupabaseContext';
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
  const [isScanning, setIsScanning] = useState(false);
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

  const handleBarCodeScanned = useCallback(async ({ data }: BarCodeScannerResult) => {
    if (lastScanned === data) return; // Evitar escaneos duplicados
    
    setLastScanned(data);
    setIsScanning(false);

    try {
      // 1. Registrar evento de escaneo
      const startTime = Date.now();
      await registerScanMutation.mutateAsync(data);

      // 2. Consultar producto
      const productData = await queryProductMutation.mutateAsync(data);
      const processingTime = Date.now() - startTime;

      if (productData.found) {
        // Producto encontrado - mostrar información
        Alert.alert(
          'Producto Encontrado',
          `${productData.product_name}\nCalorías: ${productData.calories || 'N/A'}`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Agregar a Comida', onPress: () => addToMeal(productData) }
          ]
        );
      } else {
        // Producto no encontrado - ofrecer contribuir
        Alert.alert(
          'Producto No Encontrado',
          '¿Deseas contribuir con una foto de este producto para nuestra base de datos?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Contribuir', onPress: () => requestContribution(data) }
          ]
        );
      }

      // Actualizar evento con resultado
      await supabase
        .from('scan_events')
        .update({
          result: productData.found ? 'found' : 'not_found',
          product_name: productData.product_name,
          processing_ms: processingTime,
          completed_at: new Date().toISOString(),
        })
        .eq('barcode', data);

    } catch (error) {
      console.error('Error scanning barcode:', error);
      Alert.alert('Error', 'No se pudo procesar el código de barras');
    }

    // Resetear lastScanned después de 2 segundos
    setTimeout(() => setLastScanned(null), 2000);
  }, [lastScanned, registerScanMutation, queryProductMutation]);

  const addToMeal = async (productData: any) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Crear meal con el producto escaneado
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: productData.product.name || 'Producto Escaneado',
          meal_type: 'snack', // Default, puede ser ajustado
          source_type: 'scanner',
          status: 'complete'
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Agregar food_item al meal
      const { error: itemError } = await supabase
        .from('food_items')
        .insert({
          meal_id: meal.id,
          name: productData.product.name,
          calories: productData.product.calories,
          protein: productData.product.protein,
          carbs: productData.product.carbs,
          fat: productData.product.fat,
          fiber: productData.product.fiber,
          sugar: productData.product.sugar,
          sodium: productData.product.sodium,
          nutriscore_grade: productData.product.nutriscore_grade,
          nova_group: productData.product.nova_group,
          barcode_number: productData.barcode,
          scanned: true,
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
