import { Stack } from "expo-router";
import { BluetoothProvider } from '../context/BluetoothContext';

export default function RootLayout() {
  return (
    <BluetoothProvider>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      </Stack>
    </BluetoothProvider>
  );
}
