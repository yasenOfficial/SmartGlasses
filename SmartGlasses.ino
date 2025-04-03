#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>

// Define SPI Pins
#define TFT_CS    15  // Chip Select
#define TFT_RST   2  // Reset
#define TFT_DC    33 // Data/Command
#define TFT_MOSI  13 // MOSI (Master Out Slave In)
#define TFT_SCLK  14 // Clock (SCK)

// Initialize the display object
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCLK, TFT_RST);

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic *pCharacteristic;

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String value = pCharacteristic->getValue().c_str();
      if (value.length() > 0) {
        tft.fillScreen(ST7735_BLACK);
        Serial.println("*********");
        Serial.print("Received from phone: ");
        Serial.println(value.c_str());
        Serial.println("*********");

        tft.setTextColor(ST7735_WHITE);
        tft.setTextSize(2.3);
        tft.setCursor(0, 30);
        tft.println(value.c_str());
        // Process the received data here
        // No response will be sent back
      }
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Initializing Display...");

  tft.initR(INITR_BLACKTAB);  // ST7735S Initialization
  tft.fillScreen(ST7735_BLACK);
  tft.setRotation(1); // Adjust orientation if needed
  
  BLEDevice::init("MyESP32");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_WRITE // Only need WRITE now
  );

  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->setValue("Ready to receive");

  pService->start();
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->start();
}

void loop() {
  // Your normal loop code here
  delay(1000);
}

