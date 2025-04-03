// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import CustomTabBar from "../../components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          title: "Home ",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{
          title: "Settings ",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="glasses" size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="saved" 
        options={{
          title: "My Profile ",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="car" size={24} color={color} />
          )
        }} 
      />      
    </Tabs>
  );
}