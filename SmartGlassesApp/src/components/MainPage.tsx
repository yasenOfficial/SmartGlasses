import { useState } from "react";
import { View, StyleSheet, Alert, Image, TouchableOpacity } from "react-native";
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
    devices.findIndex((device) => device && nextDevice && device.id === nextDevice.id) > -1;

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
      stopScanning(); // Stop scanning when connecting
      const deviceConnection = await bleManager.connectToDevice(device.id);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      setConnectedDevice(deviceConnection);
      setAllDevices([]); // Clear the devices list
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

  if (connectedDevice) {
    return (
      <View style={styles.containerConnected}>
        <View style={styles.connectedContent}>
          <TouchableOpacity
            style={styles.deviceImageContainer}
            onPress={() => sendData("Yasen ne se kupe")}
          >
            <Image 
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/5248/5248981.png" }} 
              style={styles.deviceImage} 
            />
          </TouchableOpacity>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{connectedDevice.name || 'Unknown Device'}</Text>
            <Text style={styles.deviceId}>{connectedDevice.id}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={() => {
              bleManager.cancelDeviceConnection(connectedDevice.id);
              setConnectedDevice(null);
            }}
          >
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
                    isConnected={connectedDevice && device ? (connectedDevice as Device).id === device.id : false}
                  />
                );
              }
              return null;
            })
          )}
        </View>
      </ParallaxScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerConnected: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: 16,
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
  connectedContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: '#E5E7EB',
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  deviceImage: {
    width: "100%",
    height: "100%",
  },
  deviceInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  deviceId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  disconnectButton: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  disconnectText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
});
