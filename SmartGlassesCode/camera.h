#ifndef CAMERA_H
#define CAMERA_H

#include <Arduino.h>
#include <esp_camera.h>       
#include <stdint.h>           // for uint8_t
#include <stddef.h>           // for size_t
#include <string.h>           // for memcpy
#include <stdlib.h>           // for malloc, free

#define PWDN_GPIO_NUM  -1
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM  4  // CSI_MCLK
#define SIOD_GPIO_NUM  26 // TWI_SDA 
#define SIOC_GPIO_NUM  27 // TWI_SCL

#define Y9_GPIO_NUM    35 // CSI_D7
#define Y8_GPIO_NUM    34 // CSI_D6
#define Y7_GPIO_NUM    39 // CSI_D5
#define Y6_GPIO_NUM    36 // CSI_D4
#define Y5_GPIO_NUM    21 // CSI_D3
#define Y4_GPIO_NUM    19 // CSI_D2
#define Y3_GPIO_NUM    18 // CSI_D1
#define Y2_GPIO_NUM    5 // CSI_D0
#define VSYNC_GPIO_NUM 25  // CSI_VSYNC
#define HREF_GPIO_NUM  23 // CSI_HSYNC
#define PCLK_GPIO_NUM  22 // CSI_PCLK

#ifndef CUSTOM_MIN_DEFINED
#define CUSTOM_MIN_DEFINED
  #define my_min(a, b) ((a) < (b) ? (a) : (b))
#endif

extern uint8_t* imageBuffer;
extern size_t imageBufferSize;
extern size_t currentImagePos;
extern const size_t chunkSize;

void setupCamera();
bool captureImage();
void sendNextImageChunk();



#endif