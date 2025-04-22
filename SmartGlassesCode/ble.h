#ifndef BLE_H
#define BLE_H

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <BLECharacteristic.h>
#include <Arduino.h>

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define COMMAND_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define IMAGE_CHAR_UUID "5a87b4ef-3bfa-4eb2-9be0-219c844ea3c0"
#define STATUS_CHAR_UUID "62962aa9-efe5-49b3-a189-159e8228cdab"

// Full class definitions instead of forward declarations
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) override;
};

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override;
  void onDisconnect(BLEServer* pServer) override;
};

extern BLEServer* pServer;
extern BLECharacteristic* pCommandCharacteristic;
extern BLECharacteristic* pImageCharacteristic;
extern BLECharacteristic* pStatusCharacteristic;

// Global variables needed for BLE operations
extern bool deviceConnected;
extern bool oldDeviceConnected;
extern bool captureRequested;
extern uint8_t* imageBuffer;
extern size_t imageBufferSize;
extern size_t currentImagePos;

#endif