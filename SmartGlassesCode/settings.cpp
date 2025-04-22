#include "settings.h"

CalendarSettings calendarSettings = {
  .meetingReminders = true,
  .dailyAgenda = true,
  .locationBasedReminders = false
};

ContextSettings contextSettings = {
  .locationBasedMessages = true,
  .timeBasedMessages = true,
  .activityBasedAlerts = false
};

unsigned long startTime = 0;
int currentHour = 0;
int currentMinute = 0;

bool captureRequested;
bool deviceConnected;
bool oldDeviceConnected = false;


void initSettings(){
  calendarSettings.meetingReminders = true;
  calendarSettings.dailyAgenda = true;
  calendarSettings.locationBasedReminders = false;

  contextSettings.locationBasedMessages = true;
  contextSettings.timeBasedMessages = true;
  contextSettings.activityBasedAlerts = false;

  // Initialize display settings with defaults
  displaySettings.titleSize = "medium";
  displaySettings.messageSize = "medium";
  displaySettings.messageTimeout = DEFAULT_MESSAGE_TIMEOUT;
}