#ifndef SETTINGS_H
#define SETTINGS_H

#include <Arduino.h>

#define DEFAULT_MESSAGE_TIMEOUT 5000

struct CalendarSettings {
  bool meetingReminders;
  bool dailyAgenda;
  bool locationBasedReminders;
};

struct ContextSettings {
  bool locationBasedMessages;
  bool timeBasedMessages;
  bool activityBasedAlerts;
};

struct DisplaySettings {
  String titleSize;
  String messageSize;
  unsigned long messageTimeout;
};

extern DisplaySettings displaySettings;
extern CalendarSettings calendarSettings;
extern ContextSettings contextSettings;

extern unsigned long startTime;
extern int currentHour;
extern int currentMinute;

extern bool captureRequested;
extern bool deviceConnected;
extern bool oldDeviceConnected;

void initSettings();

#endif