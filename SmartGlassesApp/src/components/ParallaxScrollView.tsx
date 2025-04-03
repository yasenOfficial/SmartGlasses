import React from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({ children, style }) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      bounces={true}
      scrollEventThrottle={16}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default ParallaxScrollView;
