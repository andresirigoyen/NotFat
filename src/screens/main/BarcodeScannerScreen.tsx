import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { SPACING } from '@/constants/theme';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import CustomText from '@/components/CustomText';

const { width, height } = Dimensions.get('window');

const BarcodeScannerScreen = ({ navigation }: any) => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [permission, requestPermission] = useCameraPermissions();
  const {
    isScanning,
    startScanning,
    stopScanning,
    handleBarCodeScanned,
    isLoading,
  } = useBarcodeScanner();
  
  const [torch, setTorch] = useState<FlashMode>('off');
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission?.granted && isScanning) {
      startScanning();
      
      // Iniciar animación del láser
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [permission, isScanning, startScanning, laserAnim]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomText variant="regular" style={styles.text}>Solicitando permiso de cámara...</CustomText>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomText variant="medium" style={styles.text}>No se tiene acceso a la cámara o el permiso fue denegado.</CustomText>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <CustomText variant="bold" style={styles.buttonText}>Cerrar</CustomText>
        </TouchableOpacity>
        {!permission.canAskAgain && (
          <TouchableOpacity 
            style={[styles.button, { marginTop: 10, backgroundColor: '#444' }]} 
            onPress={() => requestPermission()}
          >
            <CustomText variant="bold" style={[styles.buttonText, { color: '#fff' }]}>Intentar de nuevo</CustomText>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const handleScan = ({ data }: { data: string }) => {
    Vibration.vibrate();
    stopScanning();
    handleBarCodeScanned({ data } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <CustomText variant="bold" style={styles.title}>Escáner de Códigos</CustomText>
        <TouchableOpacity 
          style={[styles.closeButton, torch === 'on' && { backgroundColor: colors.primary.amber }]} 
          onPress={() => setTorch(prev => prev === 'off' ? 'on' : 'off')}
        >
          <Ionicons name={torch === 'on' ? "flashlight" : "flashlight-outline"} size={22} color={torch === 'on' ? "#000" : "#fff"} />
        </TouchableOpacity>
      </View>

      {/* Scanner */}
      <View style={{ flex: 1, width: '100%' }}>
        <CameraView
          onBarcodeScanned={isScanning ? handleScan : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
          }}
          enableTorch={torch === 'on'}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleOverlay}>
            <View style={styles.sideOverlay} />
            <View style={styles.scannerFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderLeftWidth: 0, borderRightWidth: 3 }]} />
              <View style={[styles.corner, { bottom: 0, left: 0, borderTopWidth: 0, borderLeftWidth: 3, borderBottomWidth: 3 }]} />
              <View style={[styles.corner, { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 3, borderBottomWidth: 3 }]} />
              
              {isScanning && (
                <Animated.View 
                  style={[
                    styles.laserLine,
                    {
                      transform: [
                        { 
                          translateY: laserAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [15, width * 0.7 - 15]
                          }) 
                        }
                      ]
                    }
                  ]} 
                />
              )}
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <CustomText variant="regular" style={styles.instructionText}>
              {isLoading ? 'Procesando...' : 'Centra el código de barras en el marco'}
            </CustomText>
            {!isScanning && (
              <TouchableOpacity style={styles.resumeButton} onPress={startScanning}>
                <CustomText variant="bold" style={styles.resumeButtonText}>Reanudar Escaneo</CustomText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary.amber} />
            <CustomText variant="medium" style={styles.loadingText}>Buscando producto...</CustomText>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.md, 
    paddingTop: SPACING.lg, 
    paddingBottom: SPACING.md, 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    zIndex: 10,
    width: '100%'
  },
  closeButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { color: '#ffffff', fontSize: 18 },
  placeholder: { width: 40 },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  middleOverlay: { flexDirection: 'row', flex: 2 },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  scannerFrame: { width: width * 0.7, height: width * 0.7, position: 'relative' },
  corner: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: 25, 
    height: 25, 
    borderTopWidth: 3, 
    borderLeftWidth: 3, 
    borderColor: colors.primary.amber,
    borderRadius: 2,
  },
  laserLine: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    height: 3,
    backgroundColor: colors.primary.amber,
    borderRadius: 2,
    shadowColor: colors.primary.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.xl 
  },
  instructionText: { color: '#ffffff', textAlign: 'center', marginBottom: SPACING.md },
  resumeButton: { 
    backgroundColor: colors.primary.amber, 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.sm, 
    borderRadius: 25 
  },
  resumeButtonText: { color: '#000000' },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingCard: { 
    backgroundColor: '#ffffff', 
    paddingHorizontal: SPACING.xl, 
    paddingVertical: SPACING.lg, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  loadingText: { color: '#000000', marginTop: SPACING.sm },
  text: { color: '#ffffff', textAlign: 'center', paddingHorizontal: 20 },
  button: { 
    backgroundColor: colors.primary.amber, 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.sm, 
    borderRadius: 25, 
    marginTop: SPACING.md 
  },
  buttonText: { color: '#000000' },
});

export default BarcodeScannerScreen;