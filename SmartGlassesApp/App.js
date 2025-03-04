import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, Animated, ScrollView, Image, Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import { Text, useTheme, PaperProvider } from "react-native-paper";


import Box1Screen from "./screens/Box1Screen";
import Box2Screen from "./screens/Box2Screen";
import Box3Screen from "./screens/Box3Screen";
import Box4Screen from "./screens/Box4Screen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ScreenWrapper({ title, children }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, marginBottom: 20 }}>
          {title}
        </Text>
        {children}
      </ScrollView>
    </View>
  );
}

function HomeScreen({ isConnected, navigation }) {
  const [buttons, setButtons] = useState([
    { text: "GPT", color: "#FF5733", screen: "Box1" },
    { text: "Calendar", color: "#33FF57", screen: "Box2" },
    { text: "Web Cam", color: "#3357FF", screen: "Box3" },
    { text: "Maps", color: "#FFD700", screen: "Box4" },
  ]);

  React.useEffect(() => {
    buttons.forEach((button, index) => {
      button.opacity = new Animated.Value(0);
      Animated.timing(button.opacity, {
        toValue: 1,
        duration: 500 + index * 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePress = (screen) => {
    if (!isConnected) {
      Alert.alert("First connect");
    } else {
      navigation.navigate(screen);
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
            onPress={() => handlePress(button.screen)}
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
        <Image source={{ uri: "https://via.placeholder.com/200" }} style={{ width: "100%", height: "100%" }} />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

function HomeStack({ isConnected }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">
        {({ navigation }) => <HomeScreen isConnected={isConnected} navigation={navigation} />}
      </Stack.Screen>
      <Stack.Screen name="Box1" component={Box1Screen} />
      <Stack.Screen name="Box2" component={Box2Screen} />
      <Stack.Screen name="Box3" component={Box3Screen} />
      <Stack.Screen name="Box4" component={Box4Screen} />
    </Stack.Navigator>
  );
}

function AnimatedTabBar({ state, descriptors, navigation }) {
  const scaleAnimations = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const opacityAnimations = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const translateYAnimations = useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const index = state.index;
    opacityAnimations.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === index ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(translateYAnimations[i], {
        toValue: i === index ? 0 : 10,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Keep the scale for the selected tab
      Animated.timing(scaleAnimations[i], {
        toValue: i === index ? 1.2 : 1, // Stay bigger when focused
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={{
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      flexDirection: "row",
      height: 60,
      backgroundColor: "#121212",
      justifyContent: "space-around",
      alignItems: "center",
      borderRadius: 30,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const iconSize = 24;
        const isFocused = state.index === index;

        const scale = scaleAnimations[index];
        const opacity = opacityAnimations[index];
        const translateY = translateYAnimations[index];

        const IconComponent = route.name === "Settings" ? FontAwesome6 : Feather;
        const iconName = route.name === "Settings" ? "glasses" : "home";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
          >
            <Animated.View style={{
              transform: [{ scale }, { translateY }],
              opacity,
            }}>
              <IconComponent name={iconName} size={iconSize} color={isFocused ? "#23c55c" : "#888"} />
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator tabBar={(props) => <AnimatedTabBar {...props} />} screenOptions={{ headerShown: false }}>
          <Tab.Screen name="HomeStack">{() => <HomeStack isConnected={isConnected} />}</Tab.Screen>
          <Tab.Screen name="Settings">{() => <SettingsScreen setIsConnected={setIsConnected} />}</Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
