import { useState, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type PermissionType = 'camera' | 'microphone' | 'mediaLibrary';

interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export const usePermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<Record<PermissionType, PermissionStatus>>({
    camera: { granted: false, canAskAgain: true, status: 'undetermined' },
    microphone: { granted: false, canAskAgain: true, status: 'undetermined' },
    mediaLibrary: { granted: false, canAskAgain: true, status: 'undetermined' },
  });

  const checkPermission = async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      let permission;
      
      switch (type) {
        case 'camera':
          permission = await ImagePicker.getCameraPermissionsAsync();
          break;
        case 'mediaLibrary':
          permission = await ImagePicker.getMediaLibraryPermissionsAsync();
          break;
        case 'microphone':
          // Para web, asumimos que el micrófono está disponible
          permission = Platform.OS === 'web' 
            ? { granted: true, canAskAgain: true, status: 'granted' as const }
            : { granted: false, canAskAgain: true, status: 'undetermined' as const };
          break;
        default:
          permission = { granted: false, canAskAgain: true, status: 'undetermined' as const };
      }

      const status: PermissionStatus = {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
        status: permission.granted ? 'granted' : permission.canAskAgain ? 'undetermined' : 'denied',
      };

      setPermissionStatus(prev => ({ ...prev, [type]: status }));
      return status;
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error);
      return { granted: false, canAskAgain: true, status: 'undetermined' };
    }
  };

  const requestPermission = async (type: PermissionType): Promise<boolean> => {
    try {
      let result;
      
      switch (type) {
        case 'camera':
          result = await ImagePicker.requestCameraPermissionsAsync();
          break;
        case 'mediaLibrary':
          result = await ImagePicker.requestMediaLibraryPermissionsAsync();
          break;
        case 'microphone':
          // Para web, asumimos que el micrófono está disponible
          result = Platform.OS === 'web' 
            ? { granted: true, canAskAgain: true, status: 'granted' as const }
            : { granted: false, canAskAgain: true, status: 'undetermined' as const };
          break;
        default:
          result = { granted: false, canAskAgain: true, status: 'undetermined' as const };
      }

      const status: PermissionStatus = {
        granted: result.granted,
        canAskAgain: result.canAskAgain,
        status: result.granted ? 'granted' : result.canAskAgain ? 'undetermined' : 'denied',
      };

      setPermissionStatus(prev => ({ ...prev, [type]: status }));
      return result.granted;
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return false;
    }
  };

  const showPermissionAlert = (type: PermissionType, onGrant?: () => void, onDeny?: () => void) => {
    const titles = {
      camera: 'Permiso de Cámara',
      microphone: 'Permiso de Micrófono',
      mediaLibrary: 'Permiso de Galería',
    };

    const messages = {
      camera: 'Necesitamos acceso a tu cámara para que puedas escanear comidas y registrar tu progreso nutricional.',
      microphone: 'Necesitamos acceso a tu micrófono para que puedas registrar comidas usando comandos de voz.',
      mediaLibrary: 'Necesitamos acceso a tu galería para que puedas seleccionar imágenes de comidas ya existentes.',
    };

    Alert.alert(
      titles[type],
      messages[type],
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: onDeny,
        },
        {
          text: 'Permitir',
          onPress: async () => {
            const granted = await requestPermission(type);
            if (granted) {
              onGrant?.();
            } else {
              onDeny?.();
            }
          },
        },
      ]
    );
  };

  const showSettingsAlert = (type: PermissionType) => {
    const titles = {
      camera: 'Cámara Bloqueada',
      microphone: 'Micrófono Bloqueado',
      mediaLibrary: 'Galería Bloqueada',
    };

    const messages = {
      camera: 'Has denegado permanentemente el acceso a la cámara. Para usar esta función, ve a Configuración y habilita el permiso.',
      microphone: 'Has denegado permanentemente el acceso al micrófono. Para usar esta función, ve a Configuración y habilita el permiso.',
      mediaLibrary: 'Has denegado permanentemente el acceso a la galería. Para usar esta función, ve a Configuración y habilita el permiso.',
    };

    Alert.alert(
      titles[type],
      messages[type],
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Abrir Configuración',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  const requestCameraAccess = async (): Promise<boolean> => {
    const status = await checkPermission('camera');
    
    if (status.granted) {
      return true;
    }
    
    if (status.status === 'denied' && !status.canAskAgain) {
      showSettingsAlert('camera');
      return false;
    }
    
    return new Promise((resolve) => {
      showPermissionAlert(
        'camera',
        () => resolve(true),
        () => resolve(false)
      );
    });
  };

  const requestMediaLibraryAccess = async (): Promise<boolean> => {
    const status = await checkPermission('mediaLibrary');
    
    if (status.granted) {
      return true;
    }
    
    if (status.status === 'denied' && !status.canAskAgain) {
      showSettingsAlert('mediaLibrary');
      return false;
    }
    
    return new Promise((resolve) => {
      showPermissionAlert(
        'mediaLibrary',
        () => resolve(true),
        () => resolve(false)
      );
    });
  };

  const requestMicrophoneAccess = async (): Promise<boolean> => {
    const status = await checkPermission('microphone');
    
    if (status.granted) {
      return true;
    }
    
    if (status.status === 'denied' && !status.canAskAgain) {
      showSettingsAlert('microphone');
      return false;
    }
    
    return new Promise((resolve) => {
      showPermissionAlert(
        'microphone',
        () => resolve(true),
        () => resolve(false)
      );
    });
  };

  // Check all permissions on mount
  useEffect(() => {
    checkPermission('camera');
    checkPermission('mediaLibrary');
    checkPermission('microphone');
  }, []);

  return {
    permissionStatus,
    checkPermission,
    requestPermission,
    requestCameraAccess,
    requestMediaLibraryAccess,
    requestMicrophoneAccess,
    showPermissionAlert,
    showSettingsAlert,
  };
};
