import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { X, Zap, Info } from 'lucide-react-native';

const BarcodeScannerScreen = ({ navigation }: any) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      // Intentar obtener datos de OpenFoodFacts
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}.json`);
      const json = await response.json();

      if (json.status === 1) {
        const product = json.product;
        navigation.navigate('AnalysisResult', {
          analysis: {
            name: product.product_name || 'Producto Desconocido',
            calories: Math.round(product.nutriments['energy-kcal_100g'] || 0),
            macros: {
              protein: product.nutriments.proteins_100g || 0,
              carbs: product.nutriments.carbohydrates_100g || 0,
              fat: product.nutriments.fat_100g || 0,
            },
            ingredients: product.ingredients_text ? [product.ingredients_text] : [],
            imageUri: product.image_url || null,
            source: 'scanner',
            barcode: data
          }
        });
      } else {
        Alert.alert('Producto no encontrado', 'No pudimos encontrar este producto en la base de datos.');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al escanear el producto.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#7c2d12" /></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No tenemos acceso a la cámara</Text></View>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* UI Overlays */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <X color="#ffffff" size={28} />
        </TouchableOpacity>

        <View style={styles.scannerGuide}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <View style={styles.infoBox}>
          <Zap color="#f59e0b" size={20} fill="#f59e0b" />
          <Text style={styles.infoText}>Escanea el código de barras para ver los macros</Text>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Buscando producto...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF3ED',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 40,
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 20,
  },
  scannerGuide: {
    width: 280,
    height: 200,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#22c55e',
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#22c55e',
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#22c55e',
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#22c55e',
    borderBottomRightRadius: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default BarcodeScannerScreen;
