import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBluetooth } from '../../context/BluetoothContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const { isConnected, sendData } = useBluetooth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: 'User',
    email: 'user@example.com',
    avatar: null as string | null,
  });
  
  // Calendar notification settings
  const [calendarSettings, setCalendarSettings] = useState({
    meetingReminders: true,
    dailyAgenda: true,
    locationBasedReminders: false
  });
  
  // Context-aware messaging settings
  const [contextSettings, setContextSettings] = useState({
    locationBasedMessages: true,
    timeBasedMessages: true,
    activityBasedAlerts: false
  });
  
  // Toggle states for section expansion - initialize all to false
  const [expandCalendar, setExpandCalendar] = useState(false);
  const [expandContext, setExpandContext] = useState(false);
  const [expandDisplay, setExpandDisplay] = useState(false);
  
  // Text size settings
  const [textSizeSettings, setTextSizeSettings] = useState({
    titleSize: 'medium', // small, medium, large
    messageSize: 'medium', // small, medium, large
    messageTimeout: 5000 // default 5 seconds (5000ms)
  });
  
  const [showImageMenu, setShowImageMenu] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const [emailError, setEmailError] = useState('');

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email.trim());
  };

  // Handle email change with validation
  const handleEmailChange = (text: string) => {
    setProfile({ ...profile, email: text });
    if (text.trim() === '') {
      setEmailError('Email is required');
    } else if (!isValidEmail(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };
  
  // Toggle handlers for calendar settings
  const toggleMeetingReminders = () => {
    setCalendarSettings(prev => ({
      ...prev,
      meetingReminders: !prev.meetingReminders
    }));
  };
  
  const toggleDailyAgenda = () => {
    setCalendarSettings(prev => ({
      ...prev,
      dailyAgenda: !prev.dailyAgenda
    }));
  };
  
  const toggleLocationReminders = () => {
    setCalendarSettings(prev => ({
      ...prev,
      locationBasedReminders: !prev.locationBasedReminders
    }));
  };
  
  // Toggle handlers for context settings
  const toggleLocationMessages = () => {
    setContextSettings(prev => ({
      ...prev,
      locationBasedMessages: !prev.locationBasedMessages
    }));
  };
  
  const toggleTimeMessages = () => {
    setContextSettings(prev => ({
      ...prev,
      timeBasedMessages: !prev.timeBasedMessages
    }));
  };
  
  const toggleActivityAlerts = () => {
    setContextSettings(prev => ({
      ...prev,
      activityBasedAlerts: !prev.activityBasedAlerts
    }));
  };

  const handleAvatarPress = () => {
    setShowImageMenu(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeImageMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowImageMenu(false);
    });
  };

  const handleImageOption = async (useCamera: boolean) => {
    closeImageMenu();
    // Add a small delay to let the menu close animation finish
    setTimeout(() => pickImage(useCamera), 300);
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permission first
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          `Please grant ${useCamera ? 'camera' : 'gallery'} access in your device settings to change profile picture.`
        );
        return;
      }

      // Launch camera or image picker
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });

      if (!result.canceled) {
        const newProfile = {
          ...profile,
          avatar: result.assets[0].uri
        };
        setProfile(newProfile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem('userProfile');
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    // Validate all fields before saving
    if (!profile.name.trim()) {
      Alert.alert("Error", "Name is required!");
      return;
    }

    if (!profile.email.trim()) {
      Alert.alert("Error", "Email is required!");
      return;
    }

    if (!isValidEmail(profile.email)) {
      Alert.alert("Error", "Please enter a valid email address!");
      return;
    }
    
    try {
      // Save all settings to AsyncStorage
      const allSettings = {
        profile,
        calendarSettings,
        contextSettings
      };
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      await AsyncStorage.setItem('userSettings', JSON.stringify(allSettings));
      
      setIsEditMode(false);
      Alert.alert("Success", "Profile and notification settings updated successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert("Error", "Failed to save profile settings. Please try again.");
    }
  };
  
  // Function to apply calendar settings to the device
  const applyCalendarSettings = () => {
    if (!isConnected) {
      Alert.alert(
        "Connection Required",
        "Please connect to your smart glasses first",
        [{ text: "Go to Settings", onPress: () => router.push("/settings") }]
      );
      return;
    }
    
    // Create a JSON string to send all calendar settings at once
    const settingsData = JSON.stringify({
      type: "calendar_settings",
      settings: calendarSettings
    });
    
    try {
      // Send the settings to the smart glasses
      sendData(settingsData);
      
      // Show confirmation to the user
      Alert.alert("Settings Applied", "Calendar settings have been sent to your smart glasses.");
    } catch (error) {
      Alert.alert("Error", "Failed to send settings to your smart glasses. Please try again.");
      console.error("Failed to send settings:", error);
    }
  };
  
  // Function to apply context-aware messaging settings
  const applyContextSettings = () => {
    if (!isConnected) {
      Alert.alert(
        "Connection Required",
        "Please connect to your smart glasses first",
        [{ text: "Go to Settings", onPress: () => router.push("/settings") }]
      );
      return;
    }
    
    // Create a JSON string to send all context settings at once
    const settingsData = JSON.stringify({
      type: "context_settings",
      settings: contextSettings
    });
    
    try {
      // Send the settings to the smart glasses
      sendData(settingsData);
      
      // Show confirmation to the user
      Alert.alert("Settings Applied", "Context-aware messaging settings have been sent to your smart glasses.");
    } catch (error) {
      Alert.alert("Error", "Failed to send settings to your smart glasses. Please try again.");
      console.error("Failed to send settings:", error);
    }
  };

  // Function to apply text size settings to the ESP device
  const applyTextSizeSettings = () => {
    if (!isConnected) {
      Alert.alert(
        "Connection Required",
        "Please connect to your smart glasses first",
        [{ text: "Go to Settings", onPress: () => router.push("/settings") }]
      );
      return;
    }
    
    // Create a JSON string to send text size settings
    const settingsData = JSON.stringify({
      type: "display_settings",
      settings: textSizeSettings
    });
    
    try {
      // Send the settings to the smart glasses
      sendData(settingsData);
      
      // Show confirmation to the user
      Alert.alert("Settings Applied", "Display settings have been sent to your smart glasses.");
    } catch (error) {
      Alert.alert("Error", "Failed to send settings to your smart glasses. Please try again.");
      console.error("Failed to send settings:", error);
    }
  };
  
  // Handler for changing text size settings
  const changeTextSize = (setting: 'titleSize' | 'messageSize', value: 'small' | 'medium' | 'large') => {
    setTextSizeSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Handler for changing message timeout
  const changeMessageTimeout = (timeout: number) => {
    setTextSizeSettings(prev => ({
      ...prev,
      messageTimeout: timeout
    }));
  };

  // Function to send a quick command to the glasses and navigate to home
  const sendQuickCommand = () => {
    if (isConnected) {
      // If connected, send data to glasses (without alert)
      sendData(JSON.stringify({
        type: "quick_command",
        command: "show_home",
        message: "Opening home view"
      }));
    }
    
    // Navigate to home page directly (just like Connected Devices button)
    router.push("/");
  };

  const renderEditProfileModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditMode}
        onRequestClose={() => setIsEditMode(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditMode(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                placeholder="Enter your name"
                autoCapitalize="words"
                autoComplete="name"
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={profile.email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  (!profile.name.trim() || !isValidEmail(profile.email)) && styles.saveButtonDisabled
                ]} 
                onPress={handleSaveProfile}
                disabled={!profile.name.trim() || !isValidEmail(profile.email)}
              >
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderImagePickerMenu = () => {
    return (
      <Modal
        visible={showImageMenu}
        transparent={true}
        animationType="none"
        onRequestClose={closeImageMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeImageMenu}
        >
          <Animated.View
            style={[
              styles.imageMenuContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.imageMenuHeader}>
              <Text style={styles.imageMenuTitle}>Change Profile Picture</Text>
              <TouchableOpacity onPress={closeImageMenu}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => handleImageOption(true)}
            >
              <View style={styles.imageOptionIcon}>
                <Ionicons name="camera" size={24} color="#007AFF" />
              </View>
              <View style={styles.imageOptionText}>
                <Text style={styles.imageOptionTitle}>Take Photo</Text>
                <Text style={styles.imageOptionDescription}>
                  Use your camera to take a new profile picture
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => handleImageOption(false)}
            >
              <View style={styles.imageOptionIcon}>
                <Ionicons name="images" size={24} color="#007AFF" />
              </View>
              <View style={styles.imageOptionText}>
                <Text style={styles.imageOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.imageOptionDescription}>
                  Select a photo from your device
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
            </TouchableOpacity>

            {profile.avatar && (
              <TouchableOpacity
                style={[styles.imageOption, styles.removeOption]}
                onPress={() => {
                  closeImageMenu();
                  setTimeout(() => {
                    Alert.alert(
                      "Remove Profile Picture",
                      "Are you sure you want to remove your profile picture?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: async () => {
                            const newProfile = { ...profile, avatar: null };
                            setProfile(newProfile);
                            await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
                          }
                        }
                      ]
                    );
                  }, 300);
                }}
              >
                <View style={[styles.imageOptionIcon, styles.removeIcon]}>
                  <Ionicons name="trash" size={24} color="#FF3B30" />
                </View>
                <View style={styles.imageOptionText}>
                  <Text style={[styles.imageOptionTitle, styles.removeText]}>
                    Remove Current Photo
                  </Text>
                  <Text style={styles.imageOptionDescription}>
                    Delete your profile picture
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            <Image 
              source={profile.avatar ? { uri: profile.avatar } : require('../../assets/images/icon.png')} 
              defaultSource={require('../../assets/images/icon.png')}
              style={styles.avatar} 
            />
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile.name || "Complete Your Profile"}</Text>
          <Text style={styles.subtitle}>{profile.email}</Text>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditMode(true)}>
            <Ionicons name="person" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
          </TouchableOpacity>
          
          {/* Calendar Notifications Section */}
          <TouchableOpacity 
            style={styles.settingSection} 
            onPress={() => setExpandCalendar(!expandCalendar)}
          >
            <View style={styles.settingSectionHeader}>
              <Ionicons name="calendar" size={24} color="#007AFF" />
              <Text style={styles.settingSectionTitle}>Calendar Notifications</Text>
              <Ionicons 
                name={expandCalendar ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#C7C7CC" 
              />
            </View>
          </TouchableOpacity>
          
          {expandCalendar && (
            <>
              <TouchableOpacity style={styles.settingSubItem} onPress={toggleMeetingReminders}>
                <Text style={styles.settingSubText}>Meeting Reminders</Text>
                <Text style={styles.settingDescription}>Show notices 15, 10, 5 minutes before meetings</Text>
                <Ionicons 
                  name={calendarSettings.meetingReminders ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={calendarSettings.meetingReminders ? "#007AFF" : "#C7C7CC"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingSubItem} onPress={toggleDailyAgenda}>
                <Text style={styles.settingSubText}>Daily Agenda</Text>
                <Text style={styles.settingDescription}>View summary of the day's events</Text>
                <Ionicons 
                  name={calendarSettings.dailyAgenda ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={calendarSettings.dailyAgenda ? "#007AFF" : "#C7C7CC"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingSubItem} onPress={toggleLocationReminders}>
                <Text style={styles.settingSubText}>Location-Based Reminders</Text>
                <Text style={styles.settingDescription}>Notify when to leave for appointments</Text>
                <Ionicons 
                  name={calendarSettings.locationBasedReminders ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={calendarSettings.locationBasedReminders ? "#007AFF" : "#C7C7CC"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.applyButton} onPress={applyCalendarSettings}>
                <Text style={styles.applyButtonText}>Apply Calendar Settings</Text>
              </TouchableOpacity>
            </>
          )}
          
          {/* Context-Aware Messaging Section */}
          <TouchableOpacity 
            style={styles.settingSection}
            onPress={() => setExpandContext(!expandContext)}
          >
            <View style={styles.settingSectionHeader}>
              <Ionicons name="navigate" size={24} color="#007AFF" />
              <Text style={styles.settingSectionTitle}>Context-Aware Messaging</Text>
              <Ionicons 
                name={expandContext ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#C7C7CC" 
              />
            </View>
          </TouchableOpacity>
          
          {expandContext && (
            <>
              <TouchableOpacity style={styles.settingSubItem} onPress={toggleLocationMessages}>
                <Text style={styles.settingSubText}>Location-Based Messages</Text>
                <Text style={styles.settingDescription}>Show info when in specific locations</Text>
                <Ionicons 
                  name={contextSettings.locationBasedMessages ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={contextSettings.locationBasedMessages ? "#007AFF" : "#C7C7CC"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingSubItem} onPress={toggleTimeMessages}>
                <Text style={styles.settingSubText}>Time-Based Messages</Text>
                <Text style={styles.settingDescription}>Schedule messages for specific times</Text>
                <Ionicons 
                  name={contextSettings.timeBasedMessages ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={contextSettings.timeBasedMessages ? "#007AFF" : "#C7C7CC"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingSubItem} onPress={toggleActivityAlerts}>
                <Text style={styles.settingSubText}>Activity-Based Alerts</Text>
                <Text style={styles.settingDescription}>Different messages based on your activity</Text>
                <Ionicons 
                  name={contextSettings.activityBasedAlerts ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={contextSettings.activityBasedAlerts ? "#007AFF" : "#C7C7CC"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.applyButton} onPress={applyContextSettings}>
                <Text style={styles.applyButtonText}>Apply Context Settings</Text>
              </TouchableOpacity>
            </>
          )}
          
          {/* Display Settings Section */}
          <TouchableOpacity 
            style={styles.settingSection}
            onPress={() => setExpandDisplay(!expandDisplay)}
          >
            <View style={styles.settingSectionHeader}>
              <Ionicons name="text" size={24} color="#007AFF" />
              <Text style={styles.settingSectionTitle}>Display Settings</Text>
              <Ionicons 
                name={expandDisplay ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#C7C7CC" 
              />
            </View>
          </TouchableOpacity>
          
          {expandDisplay && (
            <>
              <View style={styles.settingSubItem}>
                <Text style={styles.settingSubText}>Title Text Size</Text>
                <Text style={styles.settingDescription}>Size of title text displayed on your smart glasses</Text>
                
                <View style={styles.textSizeSelector}>
                  <TouchableOpacity 
                    style={[
                      styles.textSizeButton, 
                      textSizeSettings.titleSize === 'small' && styles.selectedTextSize
                    ]}
                    onPress={() => changeTextSize('titleSize', 'small')}
                  >
                    <Text style={[
                      styles.textSizeButtonText, 
                      textSizeSettings.titleSize === 'small' && styles.selectedTextSizeText,
                      { fontSize: 12 }
                    ]}>
                      Small
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.textSizeButton, 
                      textSizeSettings.titleSize === 'medium' && styles.selectedTextSize
                    ]}
                    onPress={() => changeTextSize('titleSize', 'medium')}
                  >
                    <Text style={[
                      styles.textSizeButtonText, 
                      textSizeSettings.titleSize === 'medium' && styles.selectedTextSizeText,
                      { fontSize: 14 }
                    ]}>
                      Medium
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.textSizeButton, 
                      textSizeSettings.titleSize === 'large' && styles.selectedTextSize
                    ]}
                    onPress={() => changeTextSize('titleSize', 'large')}
                  >
                    <Text style={[
                      styles.textSizeButtonText, 
                      textSizeSettings.titleSize === 'large' && styles.selectedTextSizeText,
                      { fontSize: 16 }
                    ]}>
                      Large
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.settingSubItem}>
                <Text style={styles.settingSubText}>Message Text Size</Text>
                <Text style={styles.settingDescription}>Size of message body text displayed on your smart glasses</Text>
                
                <View style={styles.textSizeSelector}>
                  <TouchableOpacity 
                    style={[
                      styles.textSizeButton, 
                      textSizeSettings.messageSize === 'small' && styles.selectedTextSize
                    ]}
                    onPress={() => changeTextSize('messageSize', 'small')}
                  >
                    <Text style={[
                      styles.textSizeButtonText, 
                      textSizeSettings.messageSize === 'small' && styles.selectedTextSizeText,
                      { fontSize: 12 }
                    ]}>
                      Small
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.textSizeButton, 
                      textSizeSettings.messageSize === 'medium' && styles.selectedTextSize
                    ]}
                    onPress={() => changeTextSize('messageSize', 'medium')}
                  >
                    <Text style={[
                      styles.textSizeButtonText, 
                      textSizeSettings.messageSize === 'medium' && styles.selectedTextSizeText,
                      { fontSize: 14 }
                    ]}>
                      Medium
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.textSizeButton, 
                      textSizeSettings.messageSize === 'large' && styles.selectedTextSize
                    ]}
                    onPress={() => changeTextSize('messageSize', 'large')}
                  >
                    <Text style={[
                      styles.textSizeButtonText, 
                      textSizeSettings.messageSize === 'large' && styles.selectedTextSizeText,
                      { fontSize: 16 }
                    ]}>
                      Large
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.settingSubItem}>
                <Text style={styles.settingSubText}>Message Display Duration</Text>
                <Text style={styles.settingDescription}>How long messages stay on screen before disappearing</Text>
                
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>3s</Text>
                  <View style={styles.slider}>
                    <TouchableOpacity 
                      style={[
                        styles.sliderOption,
                        textSizeSettings.messageTimeout === 3000 && styles.selectedSliderOption
                      ]}
                      onPress={() => changeMessageTimeout(3000)}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.sliderOption,
                        textSizeSettings.messageTimeout === 5000 && styles.selectedSliderOption
                      ]}
                      onPress={() => changeMessageTimeout(5000)}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.sliderOption,
                        textSizeSettings.messageTimeout === 8000 && styles.selectedSliderOption
                      ]}
                      onPress={() => changeMessageTimeout(8000)}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.sliderOption,
                        textSizeSettings.messageTimeout === 10000 && styles.selectedSliderOption
                      ]}
                      onPress={() => changeMessageTimeout(10000)}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.sliderOption,
                        textSizeSettings.messageTimeout === 15000 && styles.selectedSliderOption
                      ]}
                      onPress={() => changeMessageTimeout(15000)}
                    />
                  </View>
                  <Text style={styles.sliderLabel}>15s</Text>
                </View>
                <Text style={styles.timeoutValue}>
                  {(textSizeSettings.messageTimeout / 1000).toFixed(1)} seconds
                </Text>
              </View>
              
              <TouchableOpacity style={styles.applyButton} onPress={applyTextSizeSettings}>
                <Text style={styles.applyButtonText}>Apply Display Settings</Text>
              </TouchableOpacity>
            </>
          )}
          
          {/* Replace the Notifications item with GlassCommand button */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={sendQuickCommand}
          >
            <Ionicons name="home" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Home Screen</Text>
            <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={ () => router.push("/settings")}>
            <Ionicons name="bluetooth" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Connected Devices</Text>
            <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
        
        {/* Added spacer at the bottom to keep content above the nav bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      {renderEditProfileModal()}
      {renderImagePickerMenu()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollViewContent: {
    paddingBottom: 25, // Add padding at the bottom to ensure content is above the nav bar
  },
  bottomSpacer: {
    height: 60, // Additional space at the bottom
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '48%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  settingSectionTitle: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingSubItem: {
    flexDirection: 'column',
    padding: 15,
    paddingLeft: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingSubText: {
    fontSize: 16,
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 45,
    marginTop: 10,
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  textSizeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  textSizeButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedTextSize: {
    backgroundColor: '#007AFF',
  },
  textSizeButtonText: {
    color: '#666',
  },
  selectedTextSizeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  slider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    marginHorizontal: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    paddingHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  sliderOption: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C7C7CC',
  },
  selectedSliderOption: {
    backgroundColor: '#007AFF',
    transform: [{scale: 1.2}],
  },
  timeoutValue: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 8,
  },
  glassCommandItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF5D8A',
    backgroundColor: 'rgba(255, 93, 138, 0.05)',
  },
  goHomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goHomeText: {
    fontSize: 12,
    color: '#FF5D8A',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imageMenuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  imageMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  imageMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  imageOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  imageOptionText: {
    flex: 1,
  },
  imageOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  imageOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  removeOption: {
    marginTop: 10,
  },
  removeIcon: {
    backgroundColor: '#FFE5E5',
  },
  removeText: {
    color: '#FF3B30',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
});

