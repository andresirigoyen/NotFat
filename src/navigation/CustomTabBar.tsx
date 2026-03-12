import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Define icons and labels based on route name
          let icon;
          let label;
          if (route.name === 'Dashboard') {
            icon = <Ionicons name="home" size={24} color={isFocused ? '#7c2d12' : '#94a3b8'} />;
            label = 'Inicio';
          } else if (route.name === 'Coach') {
            icon = <Ionicons name="sparkles" size={24} color={isFocused ? '#7c2d12' : '#94a3b8'} />;
            label = 'Nutria';
          } else if (route.name === 'NoFat') {
            icon = <Ionicons name="nutrition" size={24} color={isFocused ? '#7c2d12' : '#94a3b8'} />;
            label = 'NoFat';
          } else if (route.name === 'Pro') {
            icon = <Ionicons name="star" size={24} color={isFocused ? '#7c2d12' : '#94a3b8'} />;
            label = 'Pro';
          } else if (route.name === 'Profile') {
            icon = <Ionicons name="person" size={24} color={isFocused ? '#7c2d12' : '#94a3b8'} />;
            label = 'Mi Perfil';
          }

          // Skip rendering for Add button (handled separately)
          if (route.name === 'Add') {
            return null;
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              {icon}
              <Text style={[styles.tabLabel, { color: isFocused ? '#7c2d12' : '#94a3b8' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Center Button - Perfectly Centered */}
      <TouchableOpacity 
        style={styles.floatingButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MealLogger')}
      >
        <LinearGradient
          colors={['#7c2d12', '#451a03']}
          style={styles.gradient}
        >
          <Ionicons name="camera" color="#ffffff" size={32} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 90,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  floatingButton: {
    position: 'absolute',
    top: -28,
    left: width / 2 - 35,
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 100,
    shadowColor: '#7c2d12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  gradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
});
