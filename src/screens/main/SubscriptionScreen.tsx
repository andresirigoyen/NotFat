import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SubscriptionScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" hidden={true} />
      
      <ImageBackground 
        source={require('../../../assets/images/premium1.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.overlay}>
            {/* Top Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Plan de Subscripcion</Text>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
              {/* Price & Benefits Section */}
              <View style={styles.priceSection}>
                <View style={styles.benefitsWrapper}>
                  <Text style={styles.priceMainText}>
                    1 Año de{"\n"}Subscripcion{"\n"}Pro $29.990
                  </Text>
                  
                  <View style={styles.subtitleContainer}>
                    <Text style={styles.offerParagraph}>Escaneo de alimentos ilimitado con IA</Text>
                    <Text style={styles.offerParagraph}>Planes nutricionales 100% personalizados</Text>
                    <Text style={styles.offerParagraph}>Seguimiento avanzado de macros y progreso</Text>
                  </View>

                  {/* Pay Button */}
                  <TouchableOpacity style={styles.payButton}>
                    <Text style={styles.payButtonText}>PAGAR</Text>
                  </TouchableOpacity>

                  {/* Pagination Indicator */}
                  <View style={styles.pagination}>
                    <View style={[styles.dot, styles.activeDot]} />
                    <View style={[styles.dot, styles.inactiveDot]} />
                    <View style={[styles.dot, styles.inactiveDot]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={20} color="#ffffff" />
                <Text style={styles.backText}>back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginTop: -40, // Offset to push content up slightly
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    position: 'absolute',
    top: 40,
    left: 0,
    zIndex: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    opacity: 0.9,
  },
  priceSection: {
    paddingLeft: '15%',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  priceMainText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'left',
    marginBottom: 30,
    lineHeight: 42,
    letterSpacing: 1,
  },
  benefitsWrapper: {
    alignItems: 'flex-start',
    width: '100%',
  },
  subtitleContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  offerParagraph: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
    marginBottom: 5,
    lineHeight: 22,
    fontFamily: 'System',
    opacity: 0.9,
    letterSpacing: 0.2,
    maxWidth: '90%',
  },
  payButton: {
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 25,
    alignSelf: 'flex-start',
  },
  payButtonText: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#ffffff',
  },
  inactiveDot: {
    backgroundColor: '#333333',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 6,
    textTransform: 'lowercase',
  },
});

export default SubscriptionScreen;
