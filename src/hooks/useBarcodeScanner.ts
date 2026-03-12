import { useState, useCallback } from 'react';
import { BarCodeScannerResult } from 'expo-barcode-scanner';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

  const addToMeal = (productData: any) => {
    // Navegar a la pantalla de agregar comida con los datos del producto
    // Esto se implementará cuando conectemos con el sistema de meals
    console.log('Adding to meal:', productData);
  };

  const requestContribution = (barcode: string) => {
    // Abrir cámara para contribuir con foto
    // Esto se implementará con la cámara existente
    console.log('Request contribution for:', barcode);
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
