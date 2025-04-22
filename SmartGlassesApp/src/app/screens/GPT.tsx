(global as any).global = global;

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useBluetooth } from '../../context/BluetoothContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const OCR_API_KEY = '';
const CHATGPT_API_KEY = ''; // Your ChatGPT API key
const COLORS = {
  primary: '#6C5CE7',
  primaryDark: '#5D4FFF',
  secondary: '#74B9FF',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  success: '#55EFC4',
  error: '#FF7675',
  yellow: '#FDCB6E',
  shadow: '#2D3436',
  inputBg: '#EFF3F6'
};

export default function GPTScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const { isConnected, sendData } = useBluetooth();
  

  const pickImageGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      performOCR(result.assets[0]);
    }
  };

  const pickImageCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      performOCR(result.assets[0]);
    }
  };

  const performOCR = async (file: ImagePicker.ImagePickerAsset) => {
    setLoading(true);
    setAnswer('');
    
    try {
      // Get base64 data
      const base64Data = file.base64;
      
      if (!base64Data) {
        setAnswer("Error: Could not get base64 data from image.");
        setLoading(false);
        return;
      }
      
      // OCR.space API accepts base64 images directly
      const formData = new FormData();
      formData.append('apikey', OCR_API_KEY);
      formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
      formData.append('language', 'eng');
      formData.append('OCREngine', '2'); // Use the more accurate engine
      
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log("OCR result:", result);
      
      if (result.IsErroredOnProcessing === false && result.ParsedResults && result.ParsedResults.length > 0) {
        const extractedText = result.ParsedResults[0].ParsedText;
        if (extractedText) {
          sendToChatGPT(extractedText);
        } else {
          setAnswer("No text was extracted from the image.");
          setLoading(false);
        }
      } else {
        setAnswer("Error extracting text: " + (result.ErrorMessage || "Unknown error"));
        setLoading(false);
      }
    } catch (error) {
      console.log("error", error);
      setAnswer("Error extracting text from image: " + (error instanceof Error ? error.message : String(error)));
      setLoading(false);
    }
  };

  const sendToChatGPT = async (extractedText: string) => {
    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: extractedText }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CHATGPT_API_KEY}`
          }
        }
      );
      const aiReply = res.data.choices[0].message.content;
      
      // Split the response into chunks of approximately 70 characters
      const CHUNK_SIZE = 50; // Approximately 12 words worth of characters
      const chunks = [];
      
      // Split the text into chunks by character count, trying to break at spaces when possible
      let startPos = 0;
      while (startPos < aiReply.length) {
        let endPos = Math.min(startPos + CHUNK_SIZE, aiReply.length);
        
        // Try to find a space or punctuation to break at if we're not at the end
        if (endPos < aiReply.length) {
          // Look backward from the calculated end position to find a good break point
          const breakChars = [' ', '.', ',', '!', '?', ';', ':', '\n'];
          let breakFound = false;
          
          // Search up to 15 characters back for a good break point
          for (let i = 0; i < 15 && endPos - i > startPos; i++) {
            if (breakChars.includes(aiReply[endPos - i])) {
              endPos = endPos - i + 1; // Include the break character
              breakFound = true;
              break;
            }
          }
          
          // If no good break point was found, just use the calculated end position
          if (!breakFound && endPos < aiReply.length) {
            // If we're in the middle of a word, try to include the whole word
            while (endPos < aiReply.length && aiReply[endPos] !== ' ') {
              endPos++;
            }
          }
        }
        
        chunks.push(aiReply.substring(startPos, endPos));
        startPos = endPos;
      }
      
      // Send the first chunk immediately
      if (chunks.length > 0 && isConnected) {
        console.log(`Sending chunk 1/${chunks.length} (${chunks[0].length} chars): ${chunks[0]}`);
        sendData(chunks[0]);
      }
      
      // Send remaining chunks with 6-second delays
      chunks.slice(1).forEach((chunk, index) => {
        setTimeout(() => {
          if (isConnected) {
            console.log(`Sending chunk ${index + 2}/${chunks.length} (${chunk.length} chars): ${chunk}`);
            sendData(chunk);
          }
        }, (index + 1) * 6000); // 6 seconds delay between chunks
      });
      
      setAnswer(aiReply);
    } catch (error) {
      console.error(error);
      setAnswer('Error getting response from ChatGPT.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="brain" size={28} color={COLORS.primary} />
          <Text style={styles.heading}>Smart Vision Assistant</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Take a photo of text and let AI respond
        </Text>

        {/* Image Area */}
        {image ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: image }}
              style={styles.image}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Analyzing...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialCommunityIcons
              name="file-image-outline"
              size={80}
              color={COLORS.textLight}
            />
            <Text style={styles.placeholderText}>
              Take a photo or select an image to analyze
            </Text>
          </View>
        )}
        
        {/* Button Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.galleryButton]}
            onPress={pickImageGallery}
            disabled={loading}
          >
            <Ionicons name="images" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.cameraButton]}
            onPress={pickImageCamera}
            disabled={loading}
          >
            <Ionicons name="camera" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
        </View>
        
        {/* Response */}
        {answer ? (
          <View style={styles.responseWrapper}>
            <View style={styles.responseHeader}>
              <Ionicons name="chatbox" size={20} color={COLORS.primaryDark} />
              <Text style={styles.responseTitle}>AI Response</Text>
              {isConnected && (
                <View style={styles.glassesStatus}>
                  <Ionicons name="glasses-outline" size={16} color={COLORS.success} />
                  <Text style={styles.glassesText}>Sent to Glasses</Text>
                </View>
              )}
            </View>
            <ScrollView
              style={styles.responseContainer}
              contentContainerStyle={styles.responseContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.response}>{answer}</Text>
            </ScrollView>
          </View>
        ) : loading ? null : (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <View style={styles.infoItem}>
              <Ionicons name="camera" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Take a photo of text or select an image</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="text-recognition" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>OCR extracts text from the image</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="brain" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>AI analyzes and responds to the text</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="glasses" size={20} color={COLORS.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Response is displayed and sent to your smart glasses</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 25,
  },
  placeholderContainer: {
    height: 220,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  placeholderText: {
    color: COLORS.textLight,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    maxWidth: '80%',
  },
  imageContainer: {
    position: 'relative',
    height: 220,
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  galleryButton: {
    backgroundColor: COLORS.secondary,
    marginRight: 10,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  responseWrapper: {
    flex: 1,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginLeft: 8,
  },
  glassesStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: 'rgba(85, 239, 196, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  glassesText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 4,
  },
  responseContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  responseContent: {
    padding: 20,
  },
  response: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  infoContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 30,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  loader: {
    marginVertical: 20,
  },
});
