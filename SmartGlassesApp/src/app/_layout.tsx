import { Stack } from "expo-router";
import { BluetoothProvider } from '../context/BluetoothContext';

export default function RootLayout() {
  return (
    <BluetoothProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="screens"
          options={{ headerShown: false }}
        />
      </Stack>
    </BluetoothProvider>
  );
}
