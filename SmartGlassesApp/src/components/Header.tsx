import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  showPath?: boolean;
  pathPrefix?: string;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  onBackPress?: () => void;
};

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = true,
  showPath = true,
  pathPrefix = 'Home',
  backgroundColor = '#F8F9FA',
  textColor = '#333',
  iconColor = '#5D4FFF',
  onBackPress,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          {showPath && (
            <View style={styles.pathContainer}>
              <Text style={[styles.pathText, { color: iconColor }]}>{pathPrefix}</Text>
              <Ionicons name="chevron-forward" size={14} color={iconColor} style={styles.pathIcon} />
              <Text style={[styles.pathText, { color: iconColor }]}>{title}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pathText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pathIcon: {
    marginHorizontal: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Header; 