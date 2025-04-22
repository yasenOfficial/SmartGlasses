#include "camera.h" 
#include "ble.h"      
        
#include <stdint.h>   // За uint8_t
#include <stddef.h>   // За size_t
#include <string.h>   // За memcpy
#include <stdlib.h>

uint8_t* imageBuffer = NULL;
size_t imageBufferSize = 0;
size_t currentImagePos = 0;
const size_t chunkSize = 200;

void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_DRAM;  // Using DRAM since no PSRAM
  config.jpeg_quality = 12;                // Higher quality (lower number)
  config.fb_count = 1;                     // Only one frame buffer
  config.frame_size = FRAMESIZE_QQVGA;     // 160x120 resolution

#if defined(CAMERA_MODEL_ESP_EYE)
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
#endif

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  sensor_t *s = esp_camera_sensor_get();
  s->set_framesize(s, FRAMESIZE_QQVGA);
  s->set_quality(s, 12);
  s->set_brightness(s, 1);
  s->set_contrast(s, 1);
  s->set_saturation(s, -1);
  s->set_special_effect(s, 0);

#if defined(CAMERA_MODEL_M5STACK_WIDE) || defined(CAMERA_MODEL_M5STACK_ESP32CAM)
  s->set_vflip(s, 1);
  s->set_hmirror(s, 1);
#endif

#if defined(LED_GPIO_NUM)
  pinMode(LED_GPIO_NUM, OUTPUT);
  digitalWrite(LED_GPIO_NUM, LOW);
#endif

  Serial.println("Camera setup complete");
}

bool captureImage() {
  if (ESP.getFreeHeap() < 20000) {  // Check available memory
    Serial.println("Warning: Low memory!");
    return false;
  }

  if (imageBuffer) {
    free(imageBuffer);
    imageBuffer = NULL;
  }

  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) return false;

  imageBufferSize = fb->len + 4;
  imageBuffer = (uint8_t*)malloc(imageBufferSize);
  if (!imageBuffer) {
    esp_camera_fb_return(fb);
    return false;
  }

  imageBuffer[0] = fb->len & 0xFF;
  imageBuffer[1] = (fb->len >> 8) & 0xFF;
  imageBuffer[2] = (fb->len >> 16) & 0xFF;
  imageBuffer[3] = (fb->len >> 24) & 0xFF;
  memcpy(imageBuffer + 4, fb->buf, fb->len);
  
  Serial.printf("Image captured. Size: %d bytes\n", fb->len);
  esp_camera_fb_return(fb);
  return true;
}

void sendNextImageChunk() {
  if (!imageBuffer || currentImagePos >= imageBufferSize) return;

  size_t chunk = my_min(chunkSize, imageBufferSize - currentImagePos);
  pImageCharacteristic->setValue(&imageBuffer[currentImagePos], chunk);
  pImageCharacteristic->notify();
  currentImagePos += chunk;
  
  delay(20); // Required for BLE stability
}