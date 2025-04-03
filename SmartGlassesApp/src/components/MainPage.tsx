import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text } from "react-native-paper";
import { BleManager, Device } from "react-native-ble-plx";
import { useRouter } from "expo-router";
import ParallaxScrollView from "./ParallaxScrollView";
import DeviceItem from "./DeviceItem";
import Button from "./Button";
import { useBluetooth } from "../context/BluetoothContext";

export const bleManager = new BleManager();

export default function MainPage() {
  const router = useRouter();
  const { connectedDevice, setConnectedDevice, sendData } = useBluetooth();
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showNameless, setShowNameless] = useState(false);

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  function scanForPeripherals() {
    setIsScanning(true);
    setAllDevices([]);
    
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        Alert.alert("Scanning Error", error.message);
        setIsScanning(false);
        return;
      }
      if (device) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  }

  function stopScanning() {
    bleManager.stopDeviceScan();
    setIsScanning(false);
  }

  async function connectToDevice(device: Device) {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      setConnectedDevice(deviceConnection);
      Alert.alert(
        "Success", 
        `Connected to ${device.name || 'device'}. You can now navigate to other pages and send data.`,
        [
          {
            text: "Go to Home",
            onPress: () => router.push("/"),
          }
        ]
      );
    } catch (e) {
      console.error("FAILED TO CONNECT", e);
      Alert.alert("Connection Error", "Failed to connect to device");
    }
  }

  return (
    <View style={styles.container}>
      <ParallaxScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Bluetooth Devices</Text>
          <Text style={styles.subtitle}>
            {isScanning ? "Scanning for devices..." : "Available devices"}
          </Text>
        </View>

        <View style={styles.controlsContainer}>
          <Button
            title={isScanning ? "Stop Scan" : "Start Scan"}
            onPress={isScanning ? stopScanning : scanForPeripherals}
            variant={isScanning ? "secondary" : "primary"}
          />
          <Button
            title="Clear"
            variant="outline"
            onPress={() => setAllDevices([])}
          />
          <Button
            title={showNameless ? "Hide Nameless" : "Show Nameless"}
            variant="outline"
            onPress={() => setShowNameless(!showNameless)}
          />
        </View>

        <View style={styles.devicesContainer}>
          {allDevices.length === 0 ? (
            <Text style={styles.emptyText}>
              {isScanning ? "Searching for devices..." : "No devices found"}
            </Text>
          ) : (
            allDevices.map((device) => {
              if (showNameless || device.name) {
                return (
                  <DeviceItem
                    key={device.id}
                    device={device}
                    onConnectPress={() => connectToDevice(device)}
                    isConnected={connectedDevice?.id === device.id}
                  />
                );
              }
              return null;
            })
          )}
        </View>
      </ParallaxScrollView>

      {connectedDevice && (
        <View style={styles.connectedDeviceContainer}>
          <Text style={styles.connectedTitle}>Connected Device</Text>
          <DeviceItem
            device={connectedDevice}
            isConnected={true}
            showRssi={false}
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Send Test Data"
              onPress={() => sendData("Yasen ne se kupe")}
              variant="primary"
              size="large"
              style={styles.sendButton}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  devicesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 24,
  },
  connectedDeviceContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  connectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  sendButton: {
    width: '100%',
  },
});
