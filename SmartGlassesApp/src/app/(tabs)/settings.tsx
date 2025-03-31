import React, { useState } from "react";
import { View, TouchableOpacity, Image, Alert } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [isBluetoothClicked, setIsBluetoothClicked] = useState(false);
  

  const handlePress = () => {
    setIsBluetoothClicked(true);
    Alert.alert(
      "Bluetooth Activated", 
      "You can now access the GPT screen",
      [{ 
        text: "Go to Home", 
        onPress: () => {
          router.push("/");
        }
      }]
    );
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 50 
    }}>
      <Text 
        variant="headlineMedium" 
        style={{ 
          color: theme.colors.onBackground, 
          marginBottom: 20 
        }}
      >
        Settings
      </Text>
      <TouchableOpacity
        style={{
          width: 200,
          height: 200,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: isBluetoothClicked ? "#e0ffe0" : "#ddd",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5,
        }}
        onPress={handlePress}
      >
        <Image 
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/5248/5248981.png" }} 
          style={{ width: "100%", height: "100%" }} 
        />
      </TouchableOpacity>
      <Text style={{ marginTop: 20 }}>
        Bluetooth Status: {isBluetoothClicked ? "Activated" : "Not Activated"}
      </Text>
    </View>
  );
}