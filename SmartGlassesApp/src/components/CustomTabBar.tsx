import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

const { width } = Dimensions.get('window');

const CustomTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - 40) / state.routes.length;
  const indicatorWidth = tabWidth * 0.5; // Make indicator 70% of tab width
  const indicatorOffset = (tabWidth - indicatorWidth) / 2; // Center the indicator

  useEffect(() => {
    // Animate the line when the active tab changes
    Animated.spring(translateX, {
      toValue: tabWidth * state.index + indicatorOffset,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.tabBar}>
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
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

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {options.tabBarIcon?.({ 
                focused: isFocused, 
                color: isFocused ? '#23c55c' : '#888',
                size: 24 
              })}
              <Text style={[
                styles.label,
                { color: isFocused ? '#23c55c' : '#888' }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <Animated.View 
        style={[
          styles.indicator,
          {
            width: indicatorWidth,
            transform: [{ translateX }],
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: '#121212',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    bottom: 3,
    height: 4.5,
    backgroundColor: '#23c55c',
    borderRadius: 3,
  },
});

export default CustomTabBar; 