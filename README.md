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

The mobile application is developed in React Native and connects to the ESP32 module via Bluetooth, providing extended functionality for the smart glasses system. It consists of four primary features designed for hands-free use and enhanced daily productivity:

ChatGPT Integration: Captures images through the OV2640 Camera Module and sends them to OpenAI’s ChatGPT API. The generated answer is then shown on the internal glasses display, providing real-time assistance based on visual input.

Navigation with Google Maps: Turn-by-turn navigation is handled through Google Maps. Directions are shown on the display shortly before each turn and are automatically removed once passed. This enables seamless pedestrian navigation without needing to check a phone.

Custom Calendar Reminders: A built-in calendar system allows the user to input events manually. A notification is shown on the glasses display 10 minutes before the event occurs, ensuring the user stays on schedule.

Notes: Users can save notes directly through the application, and each note is shown on the display. 

Custom Text Settings: Users can define custom text settings for the display content, enabling personalization of how and what is shown.

All content is projected to one eye through the glasses’ lens, enabling hands-free use that saves time, increases productivity, and helps the user stay on top of their schedule without needing to check a phone.
