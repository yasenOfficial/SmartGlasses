import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, Animated, ScrollView, Alert } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

type ButtonType = {
  text: string;
  color: string;
  opacity?: Animated.Value;
};

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [IsBluetoothClicked, setIsBluetoothClicked] = useState(false);

  const [buttons, setButtons] = useState<ButtonType[]>([
    { text: "GPT", color: "#FF5733" },
    { text: "Calendar", color: "#33FF57" },
    { text: "Step Tracker", color: "#3357FF" },
    { text: "Maps", color: "#FFD700" },
  ]);

  React.useEffect(() => {
    buttons.forEach((button, index) => {
      button.opacity = new Animated.Value(0);
      Animated.timing(button.opacity!, {
        toValue: 1,
        duration: 500 + index * 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePress = (buttonText: string) => {

      if (IsBluetoothClicked == true) {
        Alert.alert(
          "Navigation Blocked", 
          "Please click the Bluetooth button in Settings first",
          [{ text: "Go to Settings", onPress: () => router.push("/settings") }]
        );
      } else {
        switch(buttonText) {
          case "GPT":
            router.push("./screens/GPT");
            break;
          default:
            Alert.alert("Button Pressed", `You pressed the ${buttonText} button`);
            break;
        }
      }
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.colors.background,
      paddingTop: 50 
    }}>
      <ScrollView contentContainerStyle={{ 
        alignItems: "center", 
        paddingVertical: 20 
      }}>
        <Text 
          variant="headlineMedium" 
          style={{ 
            color: theme.colors.onBackground, 
            marginBottom: 20 
          }}
        >
          Home
        </Text>
        {buttons.map((button, index) => (
          <Animated.View 
            key={index} 
            style={{ 
              opacity: button.opacity,
              marginVertical: 10,
            }}
          >
            <TouchableOpacity
              style={{
                paddingVertical: 30,
                width: 250,
                backgroundColor: button.color,
                borderRadius: 15,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 5,
              }}
              onPress={() => handlePress(button.text)}
            >
              <Text style={{ 
                fontSize: 18, 
                fontWeight: "bold", 
                color: "#fff" 
              }}>
                {button.text}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}