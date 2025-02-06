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

void setup() {
  Serial.begin(115200);
  Serial.println("Initializing Display...");

  tft.initR(INITR_BLACKTAB);  // ST7735S Initialization
  tft.fillScreen(ST7735_BLACK);
  tft.setRotation(1); // Adjust orientation if needed

  // Test display
  tft.setTextColor(ST7735_WHITE);
  tft.setTextSize(2.4);
  tft.setCursor(0, 30);
  tft.println("Cveto e");
  tft.setCursor(0, 60);
  tft.println("arabin");



}

void loop() {
  // Color test loop
  // tft.fillScreen(ST7735_RED);
  // delay(500);
  // tft.fillScreen(ST7735_GREEN);
  // delay(500);
  // tft.fillScreen(ST7735_BLUE);
  // delay(500);
}
