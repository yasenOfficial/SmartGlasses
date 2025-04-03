import React, { createContext, useContext, useState } from 'react';
import { Device } from 'react-native-ble-plx';
import { Alert } from 'react-native';
import { Base64 } from 'js-base64';

const DATA_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

interface BluetoothContextType {
  connectedDevice: Device | null;
  setConnectedDevice: (device: Device | null) => void;
  sendData: (data: string) => Promise<void>;
  isConnected: boolean;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export function BluetoothProvider({ children }: { children: React.ReactNode }) {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const updateConnectedDevice = (device: Device | null) => {
    setConnectedDevice(device);
    setIsConnected(!!device);
  };

  const sendData = async (data: string) => {
    if (!connectedDevice || !isConnected) {
      Alert.alert("Error", "No device connected");
      return;
    }

    try {
      await connectedDevice.writeCharacteristicWithResponseForService(
        DATA_SERVICE_UUID,
        CHARACTERISTIC_UUID,
        Base64.encode(data)
      );
      Alert.alert("Success", "Data sent successfully");
    } catch (error) {
      console.error("Error sending data", error);
      Alert.alert("Error", "Failed to send data to device");
    }
  };

  return (
    <BluetoothContext.Provider 
      value={{ 
        connectedDevice, 
        setConnectedDevice: updateConnectedDevice, 
        sendData,
        isConnected 
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
}

export function useBluetooth() {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
} 