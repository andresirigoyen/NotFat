import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
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
  button: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
};

const { width, height } = Dimensions.get('window');

const BarcodeScannerScreen = ({ navigation }: any) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const {
    isScanning,
    startScanning,
    stopScanning,
    handleBarCodeScanned,
    isLoading,
  } = useBarcodeScanner();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (hasPermission && isScanning) {
      startScanning();
    }
  }, [hasPermission, isScanning, startScanning]);

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Solicitando permiso de cámara...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>No se tiene acceso a la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleScan = (data: any) => {
    Vibration.vibrate();
    stopScanning();
    handleBarCodeScanned(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Escáner de Códigos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={isScanning ? handleScan : undefined}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleOverlay}>
            <View style={styles.sideOverlay} />
            <View style={styles.scannerFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, { top: 0, right: 0 }]} />
              <View style={[styles.corner, { bottom: 0, left: 0 }]} />
              <View style={[styles.corner, { bottom: 0, right: 0 }]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>
              {isLoading ? 'Procesando...' : 'Centra el código de barras en el marco'}
            </Text>
            {!isScanning && (
              <TouchableOpacity style={styles.resumeButton} onPress={startScanning}>
                <Text style={styles.resumeButtonText}>Reanudar Escaneo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary.amber} />
            <Text style={styles.loadingText}>Buscando producto...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: '#ffffff',
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  middleOverlay: {
    flexDirection: 'row',
    flex: 2,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scannerFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.primary.amber,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  instructionText: {
    ...TYPOGRAPHY.body,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  resumeButton: {
    backgroundColor: COLORS.primary.amber,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 25,
  },
  resumeButtonText: {
    ...TYPOGRAPHY.button,
    color: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: '#000000',
    marginTop: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.body,
    color: '#ffffff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary.amber,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 25,
    marginTop: SPACING.md,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: '#000000',
  },
});

export default BarcodeScannerScreen;
