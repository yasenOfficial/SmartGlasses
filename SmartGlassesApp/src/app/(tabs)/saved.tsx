import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileScreen() {
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
  const [stats, setStats] = useState({
    steps: 8432,
    distance: 6.2,
    calories: 342,
    time: '1h 23m'
  });

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
    setIsEditMode(false);
    Alert.alert("Success", "Profile updated successfully!");
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

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="footsteps" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{stats.steps}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="map" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{stats.distance}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{stats.calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{stats.time}</Text>
            <Text style={styles.statLabel}>Active Time</Text>
          </View>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditMode(true)}>
            <Ionicons name="person" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
          </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
    marginTop: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 15,
    marginTop: 0,
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
});
