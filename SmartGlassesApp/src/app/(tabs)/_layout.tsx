// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          height: 60,
          backgroundColor: "#121212",
          borderRadius: 30,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5,
        },
        tabBarActiveTintColor: "#23c55c",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="glasses" size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="saved" 
        options={{
          title: "Saved",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="car" size={24} color={color} />
          )
        }} 
      />      
    </Tabs>
  );
}