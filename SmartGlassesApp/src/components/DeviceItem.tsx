import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
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
      style={[styles.container, isConnected && styles.containerConnected]}
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
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerConnected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  deviceId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#10B981',
  },
  disconnected: {
    backgroundColor: '#9CA3AF',
  },
  rssiContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rssiText: {
    fontSize: 14,
    color: '#4B5563',
  },
  connectedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
});

export default DeviceItem; 