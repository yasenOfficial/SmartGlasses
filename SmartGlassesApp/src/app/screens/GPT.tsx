(global as any).global = global;

import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useBluetooth } from '../../context/BluetoothContext';
import { OPENAI_API_KEY, OCR_API_KEY } from '@env';

// Use imported environment variables
// Don't hardcode API keys in the source code

export default function App() {
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
    
    try {
      const base64Data = file.base64;
      
      if (!base64Data) {
        setAnswer("Error: Could not get base64 data from image.");
        setLoading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('apikey', OCR_API_KEY);
      formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
      formData.append('language', 'eng');
      formData.append('OCREngine', '2');
      
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
            Authorization: `Bearer ${OPENAI_API_KEY}`
          }
        }
      );
      const aiReply = res.data.choices[0].message.content;
      
      const CHUNK_SIZE = 50;
      const chunks = [];
      
      let startPos = 0;
      while (startPos < aiReply.length) {
        let endPos = Math.min(startPos + CHUNK_SIZE, aiReply.length);
        
        if (endPos < aiReply.length) {
          const breakChars = [' ', '.', ',', '!', '?', ';', ':', '\n'];
          let breakFound = false;
          
          for (let i = 0; i < 15 && endPos - i > startPos; i++) {
            if (breakChars.includes(aiReply[endPos - i])) {
              endPos = endPos - i + 1;
              breakFound = true;
              break;
            }
          }
          
          if (!breakFound && endPos < aiReply.length) {
            while (endPos < aiReply.length && aiReply[endPos] !== ' ') {
              endPos++;
            }
          }
        }
        
        chunks.push(aiReply.substring(startPos, endPos));
        startPos = endPos;
      }
      
      if (chunks.length > 0 && isConnected) {
        console.log(`Sending chunk 1/${chunks.length} (${chunks[0].length} chars): ${chunks[0]}`);
        sendData(chunks[0]);
      }
      
      chunks.slice(1).forEach((chunk, index) => {
        setTimeout(() => {
          if (isConnected) {
            console.log(`Sending chunk ${index + 2}/${chunks.length} (${chunk.length} chars): ${chunk}`);
            sendData(chunk);
          }
        }, (index + 1) * 6000);
      });
      
      setAnswer(aiReply);
    } catch (error) {
      console.error(error);
      setAnswer('Error getting response from ChatGPT.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Ask ChatGPT</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Pick from Gallery"
          onPress={pickImageGallery}
          disabled={loading}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Take Photo"
          onPress={pickImageCamera}
          disabled={loading}
        />
      </View>
      
      {image && (
        <Image
          source={{ uri: image }}
          style={styles.image}
        />
      )}
      
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <ScrollView style={styles.responseContainer}>
          <Text style={styles.response}>{answer}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  buttonSpacer: {
    width: 10,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
  },
  loader: {
    marginVertical: 20,
  },
  responseContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  response: {
    fontSize: 16,
    color: '#333',
  },

  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
