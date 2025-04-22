#ifndef DISPLAY_H
#define DISPLAY_H

#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Arduino.h>
#include "settings.h"

#define TFT_CS 15    // Chip Select
#define TFT_RST 2    // Reset
#define TFT_DC 33    // Data/Command
#define TFT_MOSI 13  // MOSI (Master Out Slave In)
#define TFT_SCLK 14  // Clock (SCK)

// Default message display time in milliseconds (5 seconds)

// Display margins and positioning
#define TITLE_TOP_MARGIN 15      // Increase top margin for title
#define TITLE_LINE_SPACING 5     // Space between title and line
#define LINE_MESSAGE_SPACING 10  // Space between line and message start

void initDisplay();
void showMessage(String title, String message);
void showTemporaryMessage(String title, String message, unsigned long duration);
void showUrgentAlert(String title, String message);
void showTimeDisplay();
String getCurrentTimeString();
void updateCurrentTime();
uint8_t getTitleTextSize();
uint8_t getMessageTextSize();


#endif