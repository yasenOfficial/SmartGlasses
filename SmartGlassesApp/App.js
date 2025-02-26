import React, { useState } from "react";
import { View, TouchableOpacity, Animated, ScrollView, Image, Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import { Text, useTheme, PaperProvider } from "react-native-paper";

function ScreenWrapper({ title, children }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, marginBottom: 20 }}>
          {title}
        </Text>
        {children}
      </ScrollView>
    </View>
  );
}

function HomeScreen({ isConnected }) {
  const [buttons, setButtons] = useState([
    { text: "GPT", color: "#FF5733", opacity: new Animated.Value(0) },
    { text: "Spotify", color: "#33FF57", opacity: new Animated.Value(0) },
    { text: "Web Cam", color: "#3357FF", opacity: new Animated.Value(0) },
    { text: "Maps", color: "#FFD700", opacity: new Animated.Value(0) },
  ]);

  React.useEffect(() => {
    buttons.forEach((button, index) => {
      Animated.timing(button.opacity, {
        toValue: 1,
        duration: 500 + index * 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePress = () => {
    if (!isConnected) {
      Alert.alert("First connect");
    }
  };

  return (
    <ScreenWrapper title="Home">
      {buttons.map((button, index) => (
        <Animated.View key={index} style={{ opacity: button.opacity }}>
          <TouchableOpacity
            style={{
              marginVertical: 20,
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
            onPress={handlePress}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#fff" }}>{button.text}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScreenWrapper>
  );
}

function SettingsScreen({ setIsConnected }) {
  const handlePress = () => {
    setIsConnected(true);
    Alert.alert("Connected!");
  };

  return (
    <ScreenWrapper title="Settings">
      <TouchableOpacity
        style={{
          marginTop: 20,
          width: 200,
          height: 200,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: "#ddd",
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
          source={{ uri: "https://via.placeholder.com/200" }}
          style={{ width: "100%", height: "100%" }}
        />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              if (route.name === "Settings") {
                return <FontAwesome6 name="glasses" size={size} color={color} />;
              }
              if (route.name === "Home") {
                return <Feather name="home" size={size} color={color} />;
              }
            },
            tabBarStyle: { backgroundColor: "#121212" },
            tabBarActiveTintColor: "#23c55c",
            tabBarInactiveTintColor: "#888",
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home">
            {() => <HomeScreen isConnected={isConnected} />}
          </Tab.Screen>
          <Tab.Screen name="Settings">
            {() => <SettingsScreen setIsConnected={setIsConnected} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
