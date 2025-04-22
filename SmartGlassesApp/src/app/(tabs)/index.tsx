import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Animated, ScrollView, Alert, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import Button from '../../components/Button';
import { useBluetooth } from '../../context/BluetoothContext';
import { Ionicons } from '@expo/vector-icons';

type ButtonType = {
  text: string;
  color: string;
  icon: string;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [IsBluetoothClicked, setIsBluetoothClicked] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<{
    opacities: Animated.Value[];
    scales: Animated.Value[];
  }>({ opacities: [], scales: [] });

  const [buttons] = useState<ButtonType[]>([
    { text: "GPT", color: "#5D4FFF", icon: "chatbubble-ellipses" },
    { text: "Calendar", color: "#FF5D8A", icon: "calendar" },
    { text: "Notes", color: "#4FBDFF", icon: "document-text" },
    { text: "Maps", color: "#60D889", icon: "map" },
  ]);

  const { isConnected, sendData } = useBluetooth();

  useEffect(() => {
    // Initialize animated values
    const opacities = buttons.map(() => new Animated.Value(0));
    const scales = buttons.map(() => new Animated.Value(0.9));
    
    setAnimatedValues({ opacities, scales });
    
    // Start animations
    buttons.forEach((_, index) => {
      Animated.sequence([
        Animated.delay(index * 150),
        Animated.parallel([
          Animated.timing(opacities[index], {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scales[index], {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          })
        ])
      ]).start();
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
        case "Maps":
          router.push("./screens/Maps");
          break;
        case "Calendar":
          router.push("./screens/To_do");
          break;
        case "Notes":
          router.push("./screens/StepTrac");
          break;
        default:
          break;
      }
    }
  };

  // If animations aren't ready yet, render a simple loading view
  if (animatedValues.opacities.length === 0 || animatedValues.scales.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Smart Glasses
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text 
          variant="headlineMedium" 
          style={styles.title}
        >
          Smart Glasses
        </Text>
        <Text 
          style={styles.subtitle}
        >
          Control your experience
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {buttons.map((button, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.cardContainer,
              { 
                opacity: animatedValues.opacities[index],
                transform: [{ scale: animatedValues.scales[index] }],
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: button.color }
              ]}
              activeOpacity={0.85}
              onPress={() => handlePress(button.text)}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name={button.icon as any} size={28} color="#fff" />
                </View>
                <Text style={styles.cardText}>
                  {button.text}
                </Text>
              </View>
              <View style={styles.cardGradient} />
            </TouchableOpacity>
          </Animated.View>
        ))}
        
        {isConnected && (
          <View style={[styles.cardContainer, { marginTop: 20 }]}>
            <Button
              title="Send Data"
              onPress={() => sendData("Test the glasses")}
              disabled={!isConnected}
              style={styles.sendButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1b1d',
    fontSize: 28,
  },
  subtitle: {
    color: '#6c757d',
    fontSize: 16,
    marginTop: 4,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 30,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginVertical: 10,
    borderRadius: 20,
  },
  card: {
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    height: '100%',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  cardGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 80,
    borderBottomLeftRadius: 10,
  },
  sendButton: {
    width: '100%',
  }
});