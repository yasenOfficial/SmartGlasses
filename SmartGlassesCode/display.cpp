#include "display.h"

Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCLK, TFT_RST);

DisplaySettings displaySettings;
bool hasTemporaryMessage = false;
bool isShowingTime = false;
unsigned long temporaryMessageStartTime = 0;
unsigned long temporaryMessageDuration = 0;

void initDisplay(){
  tft.initR(INITR_BLACKTAB);  // ST7735S Initialization
  tft.fillScreen(ST7735_BLACK);
  tft.setRotation(1);  // Adjust orientation if needed

  displaySettings.titleSize = "medium";
  displaySettings.messageSize = "medium";
  displaySettings.messageTimeout = 5000;

  // Display welcome message
  showTemporaryMessage("Smart Glasses", "Ready to connect...", 10000);  // 10 seconds for welcome message
}

uint8_t getTitleTextSize() {
  if (displaySettings.titleSize == "small") return 1;
  if (displaySettings.titleSize == "large") return 2;
  return 1;  // medium (default)
}

uint8_t getMessageTextSize() {
  if (displaySettings.messageSize == "small") return 1;
  if (displaySettings.messageSize == "large") return 2;
  return 1;  // medium (default)
}

void showMessage(String title, String message) {
  showTemporaryMessage(title, message, displaySettings.messageTimeout);
}

// Show a temporary message with automatic timeout
void showTemporaryMessage(String title, String message, unsigned long duration) {
  tft.fillScreen(ST7735_BLACK);
  
  // Display title with increased top margin
  tft.setTextColor(ST7735_CYAN);
  tft.setTextSize(getTitleTextSize());
  tft.setCursor(0, TITLE_TOP_MARGIN);
  tft.println(title);
  
  // Calculate title height
  int titleTextHeight = getTitleTextSize() * 8;
  int titleBottom = TITLE_TOP_MARGIN + titleTextHeight;
  
  // Display horizontal line with spacing
  tft.drawFastHLine(0, titleBottom + TITLE_LINE_SPACING, tft.width(), ST7735_CYAN);
  
  // Display message with additional spacing
  tft.setTextColor(ST7735_WHITE);
  tft.setTextSize(getMessageTextSize());
  
  // Calculate starting Y position with more spacing
  int messageStartY = titleBottom + TITLE_LINE_SPACING + LINE_MESSAGE_SPACING;
  tft.setCursor(0, messageStartY);
  
  // Handle multiline messages with proper wrapping
  int lineHeight = getMessageTextSize() * 8; // height of text in pixels
  int maxLines = (tft.height() - messageStartY) / lineHeight; // max lines that fit on screen
  
  // Split the message by newline character
  int lastSpace = 0;
  int lineStart = 0;
  int currentLine = 0;
  
  // Calculate characters per line based on text size
  int charsPerLine = 21 / getMessageTextSize(); // Adjust this based on your display width
  
  for (int i = 0; i < message.length(); i++) {
    // Check if we've hit a natural line break
    if (message.charAt(i) == '\n') {
      tft.setCursor(0, messageStartY + currentLine * lineHeight);
      tft.println(message.substring(lineStart, i));
      lineStart = i + 1;
      currentLine++;
      lastSpace = lineStart;
      
      if (currentLine >= maxLines) break;
      continue;
    }
    
    // Remember the position of spaces for word wrapping
    if (message.charAt(i) == ' ') {
      lastSpace = i;
    }
    
    // Check if we need to wrap
    if (i - lineStart > charsPerLine) {
      // If we found a space to break at
      if (lastSpace > lineStart) {
        tft.setCursor(0, messageStartY + currentLine * lineHeight);
        tft.println(message.substring(lineStart, lastSpace));
        lineStart = lastSpace + 1;
      } else {
        // Hard break if no spaces
        tft.setCursor(0, messageStartY + currentLine * lineHeight);
        tft.println(message.substring(lineStart, i));
        lineStart = i;
      }
      currentLine++;
      
      if (currentLine >= maxLines) break;
    }
  }
  
  // Print any remaining text
  if (lineStart < message.length() && currentLine < maxLines) {
    tft.setCursor(0, messageStartY + currentLine * lineHeight);
    tft.println(message.substring(lineStart));
  }
  
  // Set timeout for message
  hasTemporaryMessage = true;
  temporaryMessageStartTime = millis();
  temporaryMessageDuration = duration;
  
  // Update display state
  isShowingTime = false;
}

// Show an urgent alert with visual effects
void showUrgentAlert(String title, String message) {
  // First display the message (without auto-timeout yet)
  tft.fillScreen(ST7735_BLACK);
  
  // Display title with increased top margin
  tft.setTextColor(ST7735_CYAN);
  tft.setTextSize(getTitleTextSize());
  tft.setCursor(0, TITLE_TOP_MARGIN);
  tft.println(title);
  
  // Calculate title height
  int titleTextHeight = getTitleTextSize() * 8;
  int titleBottom = TITLE_TOP_MARGIN + titleTextHeight;
  
  // Display horizontal line with spacing
  tft.drawFastHLine(0, titleBottom + TITLE_LINE_SPACING, tft.width(), ST7735_CYAN);
  
  // Display message with additional spacing
  tft.setTextColor(ST7735_WHITE);
  tft.setTextSize(getMessageTextSize());
  
  // Calculate starting Y position with more spacing
  int messageStartY = titleBottom + TITLE_LINE_SPACING + LINE_MESSAGE_SPACING;
  tft.setCursor(0, messageStartY);
  
  int lineHeight = getMessageTextSize() * 8;
  int maxLines = (tft.height() - messageStartY) / lineHeight;
  
  int lastSpace = 0;
  int lineStart = 0;
  int currentLine = 0;
  int charsPerLine = 21 / getMessageTextSize();
  
  for (int i = 0; i < message.length(); i++) {
    if (message.charAt(i) == '\n') {
      tft.setCursor(0, messageStartY + currentLine * lineHeight);
      tft.println(message.substring(lineStart, i));
      lineStart = i + 1;
      currentLine++;
      lastSpace = lineStart;
      if (currentLine >= maxLines) break;
      continue;
    }
    
    if (message.charAt(i) == ' ') {
      lastSpace = i;
    }
    
    if (i - lineStart > charsPerLine) {
      if (lastSpace > lineStart) {
        tft.setCursor(0, messageStartY + currentLine * lineHeight);
        tft.println(message.substring(lineStart, lastSpace));
        lineStart = lastSpace + 1;
      } else {
        tft.setCursor(0, messageStartY + currentLine * lineHeight);
        tft.println(message.substring(lineStart, i));
        lineStart = i;
      }
      currentLine++;
      if (currentLine >= maxLines) break;
    }
  }
  
  if (lineStart < message.length() && currentLine < maxLines) {
    tft.setCursor(0, messageStartY + currentLine * lineHeight);
    tft.println(message.substring(lineStart));
  }
  
  // Then add emphasis with a blinking border to draw attention
  for (int i = 0; i < 3; i++) {
    // Draw a red border
    for (int j = 0; j < 5; j++) {
      tft.drawRect(j, j, tft.width() - j*2, tft.height() - j*2, ST7735_RED);
    }
    delay(200);
    
    // Remove the border
    for (int j = 0; j < 5; j++) {
      tft.drawRect(j, j, tft.width() - j*2, tft.height() - j*2, ST7735_BLACK);
    }
    delay(200);
  }
  
  // Redraw the border in a different color to show it's persistent
  for (int j = 0; j < 5; j++) {
    tft.drawRect(j, j, tft.width() - j*2, tft.height() - j*2, ST7735_YELLOW);
  }
  
  // Use a longer timeout for urgent alerts (10 seconds)
  hasTemporaryMessage = true;
  temporaryMessageStartTime = millis();
  temporaryMessageDuration = displaySettings.messageTimeout * 2; // Double the normal timeout
  
  isShowingTime = false;
}

// Simple time utility functions to replace TimeLib
void updateCurrentTime() {
  // Calculate time elapsed since startup in milliseconds
  unsigned long timeElapsed = millis() - startTime;
  
  // Convert to minutes and hours
  unsigned long totalMinutes = timeElapsed / 60000;
  currentHour = (totalMinutes / 60) % 24;
  currentMinute = totalMinutes % 60;
}

String getCurrentTimeString() {
  updateCurrentTime();
  // Format time as HH:MM
  String hourStr = (currentHour < 10) ? "0" + String(currentHour) : String(currentHour);
  String minStr = (currentMinute < 10) ? "0" + String(currentMinute) : String(currentMinute);
  return hourStr + ":" + minStr;
}

// Display the time screen - adjusted for better positioning
void showTimeDisplay() {
  tft.fillScreen(ST7735_BLACK);
  tft.setTextColor(ST7735_WHITE);
  tft.setTextSize(2);
  tft.setCursor(0, TITLE_TOP_MARGIN); // Use consistent top margin
  tft.println("Current time:");
  tft.setCursor(30, TITLE_TOP_MARGIN + 30); // Add space between title and time
  tft.println(getCurrentTimeString());
  isShowingTime = true;
}