import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBluetooth } from '../../context/BluetoothContext';

export default function ProfileScreen() {
  const { isConnected, sendData } = useBluetooth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    height: '',
    weight: '',
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
  
  // Toggle states for section expansion
  const [expandCalendar, setExpandCalendar] = useState(true);
  const [expandContext, setExpandContext] = useState(true);
  const [expandDisplay, setExpandDisplay] = useState(true);
  
  // Text size settings
  const [textSizeSettings, setTextSizeSettings] = useState({
    titleSize: 'medium', // small, medium, large
    messageSize: 'medium', // small, medium, large
    messageTimeout: 5000 // default 5 seconds (5000ms)
  });
  
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

  const handleAuth = () => {
    if (isLogin) {
      // Login logic
      if (!authData.email || !authData.password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      // Here you would typically make an API call to verify credentials
      setIsAuthenticated(true);
      setProfile(prev => ({ ...prev, email: authData.email }));
    } else {
      // Signup logic
      if (!authData.email || !authData.password || !authData.confirmPassword) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      if (authData.password !== authData.confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
      // Here you would typically make an API call to create account
      setIsAuthenticated(true);
      setProfile(prev => ({ ...prev, email: authData.email }));
    }
  };

  const renderAuthScreen = () => {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.authContainer}
      >
        <View style={styles.authContent}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.authLogo}
          />
          <Text style={styles.authTitle}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </Text>
          <Text style={styles.authSubtitle}>
            {isLogin ? "Sign in to continue " : "Sign up to get started "}
          </Text>

          <TextInput
            style={styles.authInput}
            placeholder="Email"
            value={authData.email}
            onChangeText={(text) => setAuthData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.authInput}
            placeholder="Password"
            value={authData.password}
            onChangeText={(text) => setAuthData(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />

          {!isLogin && (
            <TextInput
              style={styles.authInput}
              placeholder="Confirm Password"
              value={authData.confirmPassword}
              onChangeText={(text) => setAuthData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
            />
          )}

          <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
            <Text style={styles.authButtonText}>
              {isLogin ? "Login " : "Sign Up "}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.authToggle}
            onPress={() => {
              setIsLogin(!isLogin);
              setAuthData({ email: '', password: '', confirmPassword: '' });
            }}
          >
            <Text style={styles.authToggleText}>
              {isLogin ? "Don't have an account? Sign Up " : "Already have an account? Login "}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const handleAvatarPress = () => {
    Alert.alert(
      "Change Profile Picture",
      "This feature will be available in future updates",
      [{ text: "OK", onPress: () => console.log("OK Pressed") }]
    );
  };

  const handleSaveProfile = () => {
    if (!profile.name || !profile.email) {
      Alert.alert("Error", "Name and email are required!");
      return;
    }
    
    // Save all settings to local storage or your backend
    const allSettings = {
      profile,
      calendarSettings,
      contextSettings
    };
    
    // For demonstration, just logging the settings
    console.log('Saving settings:', allSettings);
    
    // You would typically save to AsyncStorage or your backend:
    // AsyncStorage.setItem('userSettings', JSON.stringify(allSettings));
    
    setIsEditMode(false);
    Alert.alert("Success", "Profile and notification settings updated successfully!");
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
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={profile.age}
                onChangeText={(text) => setProfile({ ...profile, age: text })}
                placeholder="Enter your age"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={profile.height}
                onChangeText={(text) => setProfile({ ...profile, height: text })}
                placeholder="Enter your height"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={profile.weight}
                onChangeText={(text) => setProfile({ ...profile, weight: text })}
                placeholder="Enter your weight"
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (!isAuthenticated) {
    return renderAuthScreen();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            <Image 
              source={require('../../assets/images/icon.png')} 
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
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={ () => router.push("/settings")}>
            <Ionicons name="bluetooth" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Connected Devices</Text>
            <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderEditProfileModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    minHeight: '80%',
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
  authContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  authContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authLogo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  authInput: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  authButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authToggle: {
    marginTop: 20,
  },
  authToggleText: {
    color: '#007AFF',
    fontSize: 14,
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
});

