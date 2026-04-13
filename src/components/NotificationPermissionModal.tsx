import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

const { width } = Dimensions.get('window');

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onAllow: () => void;
  goalReachDate?: string;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onClose,
  onAllow,
  goalReachDate = '27 ABR',
}) => {
  const { colors } = useThemeColors();

  // ✅ Optimización: Extraemos el día y mes dinámicamente de la propiedad
  const targetDay = React.useMemo(() => parseInt(goalReachDate.split(' ')[0], 10) || 27, [goalReachDate]);
  const targetMonth = React.useMemo(() => goalReachDate.split(' ')[1] || 'ABR', [goalReachDate]);

  // Generamos los 3 días anteriores y 3 posteriores dinámicamente
  const days = React.useMemo(() => Array.from({ length: 7 }, (_, i) => targetDay - 3 + i), [targetDay]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: '#2C3E50' }]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeIconBg}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Graphic Section */}
          <View style={styles.graphicContainer}>
            <View style={styles.blueCircle}>
              <View style={styles.phoneContainer}>
                {/* Phone Mockup */}
                <View style={[styles.phoneFrame, { backgroundColor: '#000' }]}>
                   <View style={styles.screen}>
                      <Text style={styles.timeText}>9:41</Text>
                      <View style={styles.fingerContainer}>
                         <Text style={{ fontSize: 40 }}>☝️</Text>
                      </View>
                   </View>
                </View>

                {/* Bubbles */}
                {/* ✅ Optimización: Eliminamos sombras pesadas de las burbujas para proteger el UI Thread */}
                <View style={[styles.bubble, styles.bubbleTopLeft]}>
                  <Text style={{ fontSize: 20 }}>📱</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleTopRight]}>
                  <Text style={{ fontSize: 20 }}>📅</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleBottomLeft]}>
                  <Text style={{ fontSize: 20 }}>👩‍⚕️</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleBottomRight]}>
                  <Text style={{ fontSize: 20 }}>🥇</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Text Section */}
          <View style={styles.content}>
            <Text style={styles.title}>Stay motivated!</Text>
            <Text style={styles.subtitle}>
              To increase your success, we would like to send regular tips and reminders to you.
            </Text>

            <Text style={styles.goalText}>You'll reach your goal by</Text>

            {/* Date Selector View */}
            <View style={styles.dateStrip}>
              {days.map((day) => {
                const isSelected = day === targetDay; // ✅ Dinámico
                return (
                  <View
                    key={day}
                    style={[
                      styles.dateItem,
                      isSelected && styles.dateItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    {isSelected && <Text style={styles.monthText}>{targetMonth}</Text>}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.allowButton, { backgroundColor: colors.primary.sky || '#00AEEF' }]}
              onPress={onAllow}
            >
              <Text style={styles.allowButtonText}>Allow coach tips</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  closeIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphicContainer: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  blueCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#00AEEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneContainer: {
    width: 120,
    height: 200,
    top: 10,
    alignItems: 'center',
  },
  phoneFrame: {
    width: 100,
    height: 180,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#333',
    padding: 2,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0056b3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    position: 'absolute',
    top: 30,
  },
  fingerContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    transform: [{ translateX: -10 }, { translateY: 5 }],
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#FFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleTopLeft: {
    top: 10,
    left: -20,
  },
  bubbleTopRight: {
    top: 20,
    right: -20,
  },
  bubbleBottomLeft: {
    bottom: 30,
    left: -30,
  },
  bubbleBottomRight: {
    bottom: 50,
    right: -30,
  },
  content: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  title: {
    fontFamily: FONTS.primary,
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FONTS.primary,
    fontSize: 15,
    color: '#CAD3DF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  goalText: {
    fontFamily: FONTS.primary,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  dateItem: {
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateItemSelected: {
    backgroundColor: '#FFFFFF',
    width: 65,
    height: 75,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00AEEF',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#CAD3DF',
  },
  dateTextSelected: {
    color: '#333333',
    fontSize: 22,
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    marginTop: 2,
  },
  footer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  allowButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
