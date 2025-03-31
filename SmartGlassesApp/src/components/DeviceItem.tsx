import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
import theme from '@assets/styles/theme';
import Button from './Button';

interface DeviceItemProps {
  device: Device;
  onPress?: () => void;
  isConnected?: boolean;
  onConnectPress?: () => void;
  rssi?: number | null;
  showRssi?: boolean;
}

export const DeviceItem: React.FC<DeviceItemProps> = ({
  device,
  onPress,
  isConnected = false,
  onConnectPress,
  rssi,
  showRssi = true,
}) => {
  // Calculate the signal strength icon/indicator based on RSSI
  const getSignalStrength = () => {
    if (rssi === null || rssi === undefined) return null;
    
    if (rssi > -60) {
      return '📶 Strong';
    } else if (rssi > -80) {
      return '📶 Medium';
    } else {
      return '📶 Weak';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.deviceInfo}>
        <View style={styles.nameContainer}>
          <View style={[styles.statusIndicator, isConnected ? styles.connected : styles.disconnected]} />
          <Text style={styles.deviceName}>
            {device.name || 'Unnamed Device'}
          </Text>
        </View>
        <Text style={styles.deviceId}>{device.id}</Text>
        
        {showRssi && rssi && (
          <View style={styles.rssiContainer}>
            <Text style={styles.rssiText}>{getSignalStrength()} ({rssi} dBm)</Text>
          </View>
        )}
      </View>
      
      {onConnectPress && !isConnected && (
        <Button 
          title="Connect" 
          variant="primary"
          size="small"
          onPress={onConnectPress}
        />
      )}
      
      {isConnected && (
        <View style={styles.connectedBadge}>
          <Text style={styles.connectedText}>Connected</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.lightest,
    borderRadius: theme.borders.radius.md,
    ...theme.shadows.xs,
  },
  deviceInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  deviceName: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.neutral.darkest,
  },
  deviceId: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.neutral.darker,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  connected: {
    backgroundColor: theme.colors.bluetooth.connected,
  },
  disconnected: {
    backgroundColor: theme.colors.neutral.medium,
  },
  rssiContainer: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rssiText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.neutral.darkest,
  },
  connectedBadge: {
    backgroundColor: theme.colors.success.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borders.radius.sm,
  },
  connectedText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.success.dark,
  },
});

export default DeviceItem; 