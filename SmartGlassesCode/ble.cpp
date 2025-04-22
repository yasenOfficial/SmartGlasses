#include "ble.h"
#include "camera.h"     // За captureRequested, sensor_t и FRAMESIZE_QQVGA
#include "settings.h"   // За calendarSettings, contextSettings, displaySettings и startTime
#include "display.h"    // За showMessage, showTemporaryMessage и други дисплей функции
#include <ArduinoJson.h>  // За DynamicJsonDocument

BLECharacteristic* pCharacteristic;

BLEServer* pServer = nullptr;
BLECharacteristic* pCommandCharacteristic = nullptr;
BLECharacteristic* pImageCharacteristic = nullptr;
BLECharacteristic* pStatusCharacteristic = nullptr;

// Implementation of MyCallbacks::onWrite
void MyCallbacks::onWrite(BLECharacteristic* pCharacteristic) {
  String value = pCharacteristic->getValue().c_str();
  size_t len = value.length();

  if (len == 1) {
    // Handle single-character commands
    char cmd = value[0];
    Serial.print("Command received: ");
    Serial.println(cmd);

    if (cmd == 'C') {
      Serial.println("Capture image");
      captureRequested = true;
    } else if (cmd == 'S') {
      Serial.println("Status request");
      pStatusCharacteristic->setValue("Camera Ready");
      pStatusCharacteristic->notify();
    } else if (cmd == 'R') {
      Serial.println("Reset request");
      sensor_t* s = esp_camera_sensor_get();
      s->set_framesize(s, FRAMESIZE_QQVGA);
      pStatusCharacteristic->setValue("Camera Reset Complete");
      pStatusCharacteristic->notify();
    }
  } else if (len > 1) {
    // Handle JSON-formatted messages
    Serial.println("*********");
    Serial.print("Received from phone: ");
    Serial.println(value.c_str());
    Serial.println("*********");

    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, value);

    if (!error && doc.containsKey("type")) {
      String msgType = doc["type"];

      if (msgType == "calendar_settings") {
        calendarSettings.meetingReminders = doc["settings"]["meetingReminders"];
        calendarSettings.dailyAgenda = doc["settings"]["dailyAgenda"];
        calendarSettings.locationBasedReminders = doc["settings"]["locationBasedReminders"];
        showMessage("Settings Updated", "Calendar notification settings applied successfully.");
        Serial.println("Calendar settings updated:");
        Serial.println(calendarSettings.meetingReminders ? "Meeting Reminders: ON" : "Meeting Reminders: OFF");
        Serial.println(calendarSettings.dailyAgenda ? "Daily Agenda: ON" : "Daily Agenda: OFF");
        Serial.println(calendarSettings.locationBasedReminders ? "Location Reminders: ON" : "Location Reminders: OFF");
      } else if (msgType == "context_settings") {
        contextSettings.locationBasedMessages = doc["settings"]["locationBasedMessages"];
        contextSettings.timeBasedMessages = doc["settings"]["timeBasedMessages"];
        contextSettings.activityBasedAlerts = doc["settings"]["activityBasedAlerts"];
        showMessage("Settings Updated", "Context-aware messaging settings applied successfully.");
        Serial.println("Context settings updated:");
        Serial.println(contextSettings.locationBasedMessages ? "Location Messages: ON" : "Location Messages: OFF");
        Serial.println(contextSettings.timeBasedMessages ? "Time Messages: ON" : "Time Messages: OFF");
        Serial.println(contextSettings.activityBasedAlerts ? "Activity Alerts: ON" : "Activity Alerts: OFF");
      } else if (msgType == "display_settings") {
        displaySettings.titleSize = doc["settings"]["titleSize"].as<String>();
        displaySettings.messageSize = doc["settings"]["messageSize"].as<String>();
        if (doc["settings"].containsKey("messageTimeout")) {
          displaySettings.messageTimeout = doc["settings"]["messageTimeout"];
          Serial.print("Message timeout set to: ");
          Serial.println(displaySettings.messageTimeout);
        }
        showMessage("Display Settings", "Text size settings updated.\nTitle: " + displaySettings.titleSize + "\nMessage: " + displaySettings.messageSize);
        Serial.println("Display settings updated:");
        Serial.println("Title Size: " + displaySettings.titleSize);
        Serial.println("Message Size: " + displaySettings.messageSize);
      } else if (msgType == "calendar_event") {
        String eventTitle = doc["title"];
        String eventTime = doc["time"];
        int minutesUntil = doc["minutesUntil"];
        String location = doc["location"];
        String message = "In " + String(minutesUntil) + " mins: " + eventTitle + " at " + eventTime;
        if (location.length() > 0) {
          message += "\nLocation: " + location;
        }
        showMessage("Upcoming Meeting", message);
      } else if (msgType == "location_message") {
        String location = doc["location"];
        String message = doc["message"];
        showMessage("At " + location, message);
      } else if (msgType == "set_time") {
        if (doc.containsKey("hour") && doc.containsKey("minute")) {
          currentHour = doc["hour"];
          currentMinute = doc["minute"];
          startTime = millis() - ((currentHour * 60L + currentMinute) * 60L * 1000L);
          showMessage("Time Updated", "Current time: " + getCurrentTimeString());
        }
      } else if (msgType == "daily_agenda") {
        String agendaMessage = doc["message"];
        showMessage("Today's Agenda", agendaMessage);
      } else if (msgType == "temporary_message") {
        String title = doc["title"];
        String message = doc["message"];
        unsigned long duration = doc["duration"];
        showTemporaryMessage(title, message, duration);
        Serial.print("Showing temporary message for ");
        Serial.print(duration);
        Serial.println(" ms");
      } else if (msgType == "urgent_alert") {
        String title = doc["title"];
        String message = doc["message"];
        showUrgentAlert(title, message);
        Serial.println("Showing urgent alert");
      } else if (msgType == "show_time") {
        showTimeDisplay();
        Serial.println("Showing time display");
      }
    } else {
      showMessage("Message", value);
    }
  }
}

// Implementation of ServerCallbacks methods
void ServerCallbacks::onConnect(BLEServer* pServer) {
  deviceConnected = true;
  Serial.println("Device connected");
}

void ServerCallbacks::onDisconnect(BLEServer* pServer) {
  deviceConnected = false;
  Serial.println("Device disconnected");
  if (imageBuffer != NULL) {
    free(imageBuffer);
    imageBuffer = NULL;
    imageBufferSize = 0;
  }
}