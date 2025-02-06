# 🕶️ Smart Glasses
## Overview
This project is a wearable smart glasses system integrating an ESP32 MCU, CP2102 USB to UART convertor, OV2640 camera module, a HS096T01H13 display, a battery management system (BMS), and a mobile application for extended functionality.

ESP32: Handles display, camera, and wireless connectivity.
CP2102: Allows programming and debuging without the need of external tools.
OV2640 Camera Module: Captures real-time images/video for streaming or processing, the feed is directly sent to the mobile application. Modules used to power the cam: XC6206P282MR (2.8V), XC6206P122MR-G (1.2V)

Display (HS096T01H13): [LCSC link](https://www.lcsc.com/product-detail/LCD-Screen_HS-HS096T01H13_C18198246.html?s_z=n_HS096T01H13)
I would not recommend using this display. It has very poor documentation, no qunatities and is hard to get up and running.
However if you still want to test this display my wiriing is shown in the schematic. Pay attention to the resistors and diodes placed by the display power. Example code is also attached. 
This display uses the ST7735 driver and can easily be used with the Adafruit ST7735 library.

Battery Management System (BMS): Manages charging of the battery. It is implemented by TP4056, DW01A, FS8205, similarly to the small li-ion 18650 charging modules.
Mobile Application: The application is written in React Native. More info comming soon. 
