#include "esp_camera.h"
#include "camera.h"
#include "display.h"
#include "ble.h"
#include "settings.h"

// Display state tracking variables
unsigned long lastUpdateTime = 0;
extern bool hasTemporaryMessage;
extern unsigned long temporaryMessageStartTime;
extern unsigned long temporaryMessageDuration;
extern bool isShowingTime;
extern Adafruit_ST7735 tft;  // Reference to tft object from display.cpp

void setup() {
  Serial.begin(115200);
  Serial.println("Initializing Smart Glasses...");

  // Initialize settings with defaults
  initSettings();

  // Initialize display and show welcome message
  initDisplay();

  // Initialize BLE
  BLEDevice::init("SmartGlasses");
  pServer = BLEDevice::createServer();
  BLEService* pService = pServer->createService(SERVICE_UUID);

  // Using callbacks directly from ble.cpp since they're already defined there
  pServer->setCallbacks(new ServerCallbacks());

  pCommandCharacteristic = pService->createCharacteristic(
                       COMMAND_CHAR_UUID,
                       BLECharacteristic::PROPERTY_WRITE |
                       BLECharacteristic::PROPERTY_NOTIFY
                     );
  pCommandCharacteristic->setCallbacks(new MyCallbacks());
  pCommandCharacteristic->addDescriptor(new BLE2902());

  pImageCharacteristic = pService->createCharacteristic(
                       IMAGE_CHAR_UUID,
                       BLECharacteristic::PROPERTY_READ |
                       BLECharacteristic::PROPERTY_NOTIFY |
                       BLECharacteristic::PROPERTY_INDICATE
                     );
  pImageCharacteristic->addDescriptor(new BLE2902());

  pStatusCharacteristic = pService->createCharacteristic(
                       STATUS_CHAR_UUID,
                       BLECharacteristic::PROPERTY_READ |
                       BLECharacteristic::PROPERTY_NOTIFY
                     );
  pStatusCharacteristic->addDescriptor(new BLE2902());

  pService->start();
  BLEAdvertising* pAdvertising = pServer->getAdvertising();

  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  pAdvertising->start();

  Serial.println("Bluetooth service started");

  // Initialize camera
  setupCamera();

  // Update current time setup
  updateCurrentTime();

  Serial.println("Smart Glasses initialization complete");
  
  // Show a startup message
  showMessage("Smart Glasses", "System initialized successfully");
}

void loop() {
  // Check if we need to clear a temporary message
  if (hasTemporaryMessage) {
    unsigned long currentTime = millis();
    if (currentTime - temporaryMessageStartTime >= temporaryMessageDuration) {
      hasTemporaryMessage = false;

      // Clear the screen after the message times out but don't show time display
      tft.fillScreen(ST7735_BLACK);
      isShowingTime = false;
    }
  }

  static uint32_t last_mem_check = 0;
  if (millis() - last_mem_check > 2000) {
    last_mem_check = millis();
    // Optional: Add memory usage monitoring here
  }

  // Handle camera capture requests
  if (deviceConnected && captureRequested) {
    captureRequested = false;
    if (captureImage()) {
      currentImagePos = 0;
      sendNextImageChunk();
    } else {
      pStatusCharacteristic->setValue("Capture Failed");
      pStatusCharacteristic->notify();
      
      // Show error message on display
      showUrgentAlert("Camera Error", "Failed to capture image");
    }
  }
  
  // Continue sending image chunks if available
  if (deviceConnected && imageBuffer != NULL && currentImagePos < imageBufferSize) {
    sendNextImageChunk();
    delay(20);
  }
  
  // Handle device disconnection
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("Restarting advertising");
    oldDeviceConnected = deviceConnected;
    if (imageBuffer != NULL) {
      free(imageBuffer);
      imageBuffer = NULL;
      imageBufferSize = 0;
    }
    
    // Show disconnection message
    showTemporaryMessage("Disconnected", "Waiting for connection...", 3000);
  }
  
  // Handle new connection
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
    showTemporaryMessage("Connected", "Device connected successfully", 3000);
  }
  
  // Update time display periodically
  unsigned long currentTime = millis();
  if (currentTime - lastUpdateTime > 5000) {
    lastUpdateTime = currentTime;
    
    // Update current time
    updateCurrentTime();

    // Only update the time if we're already showing it
    if (isShowingTime) {
      showTimeDisplay();
    }
  }

  delay(100);
}
