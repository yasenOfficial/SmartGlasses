import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  Alert,
  Animated,
  Easing,
  Image,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBluetooth } from '../../context/BluetoothContext';

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  time?: string;
  location?: string;
  reminderSent?: {
    fiveMinutes: boolean;
    tenMinutes: boolean;
    fifteenMinutes: boolean;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface CalendarSettings {
  meetingReminders: boolean;
  dailyAgenda: boolean;
  locationBasedReminders: boolean;
}

const COLORS = {
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  accent: '#00CEC9',
  background: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  error: '#FF7675',
  success: '#55EFC4',
  card: '#FFFFFF',
  inputBg: '#F1F2F6',
  shadow: '#2D3436'
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const To_do: React.FC = () => {
  const { isConnected, sendData } = useBluetooth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [monthCalendarDays, setMonthCalendarDays] = useState<CalendarDay[]>([]);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Task[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [editLocationInput, setEditLocationInput] = useState('');
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    meetingReminders: true,
    dailyAgenda: true,
    locationBasedReminders: false,
  });
  const checkEventsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUpcomingEventsRef = useRef<Task[]>([]);
  const alertedEventsRef = useRef<Set<string>>(new Set());

  const getCurrentTime = () => {
    const now = new Date();
    return {
      hour: now.getHours().toString().padStart(2, '0'),
      minute: now.getMinutes().toString().padStart(2, '0'),
      formatted: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    };
  };

  const initialTime = getCurrentTime();
  
  const [selectedTime, setSelectedTime] = useState(initialTime.formatted);
  const [timeInputHour, setTimeInputHour] = useState(initialTime.hour);
  const [timeInputMinute, setTimeInputMinute] = useState(initialTime.minute);

  // Load calendar settings
  useEffect(() => {
    const loadCalendarSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('calendarSettings');
        if (storedSettings) {
          setCalendarSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Failed to load calendar settings', error);
      }
    };
    
    loadCalendarSettings();
  }, []);

  useEffect(() => {
    generateCalendarDays(currentMonth);
  }, [currentMonth]);
  
  // Effect for checking reminders and sending to glasses
  useEffect(() => {
    if (isConnected && calendarSettings.meetingReminders) {
      const interval = setInterval(() => {
        checkAndSendReminders();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [isConnected, tasks, calendarSettings]);

  // Effect to send daily agenda to glasses
  useEffect(() => {
    if (isConnected && calendarSettings.dailyAgenda) {
      sendDailyAgenda();
    }
  }, [isConnected, tasks, calendarSettings]);

  // Check and send reminders for upcoming events
  const checkAndSendReminders = () => {
    if (!isConnected || !calendarSettings.meetingReminders) return;
    
    const now = new Date();
    const upcomingTasks = tasks.filter(task => {
      if (task.completed) return false;
      
      const taskDate = new Date(task.date);
      if (!isSameDate(taskDate, now)) return false;
      
      if (!task.time) return false;
      
      const [hours, minutes] = task.time.split(':').map(Number);
      const taskDateTime = new Date(taskDate);
      taskDateTime.setHours(hours, minutes, 0, 0);
      
      const diffInMinutes = Math.floor((taskDateTime.getTime() - now.getTime()) / (1000 * 60));
      
      // Send reminders at 15, 10, and 5 minutes before
      const shouldSendReminder = 
        (diffInMinutes === 15 && (!task.reminderSent?.fifteenMinutes)) ||
        (diffInMinutes === 10 && (!task.reminderSent?.tenMinutes)) ||
        (diffInMinutes === 5 && (!task.reminderSent?.fiveMinutes));
      
      if (shouldSendReminder) {
        sendReminderToGlasses(task, diffInMinutes);
        
        // Update the task to mark this reminder as sent
        const updatedTask = { ...task };
        if (!updatedTask.reminderSent) {
          updatedTask.reminderSent = {
            fiveMinutes: false,
            tenMinutes: false,
            fifteenMinutes: false
          };
        }
        
        if (diffInMinutes === 15) updatedTask.reminderSent.fifteenMinutes = true;
        else if (diffInMinutes === 10) updatedTask.reminderSent.tenMinutes = true;
        else if (diffInMinutes === 5) updatedTask.reminderSent.fiveMinutes = true;
        
        updateTaskInList(updatedTask);
      }
      
      return false;
    });
  };
  
  // Update a specific task in the tasks list
  const updateTaskInList = (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Send a reminder to the smart glasses
  const sendReminderToGlasses = (task: Task, minutesUntil: number) => {
    if (!isConnected) return;
    
    try {
      const reminderData = {
        type: "calendar_event",
        title: task.title,
        time: task.time,
        minutesUntil: minutesUntil,
        location: task.location || ""
      };
      
      sendData(JSON.stringify(reminderData));
      console.log(`Sent reminder to glasses: ${task.title} in ${minutesUntil} minutes`);
    } catch (error) {
      console.error('Failed to send reminder to glasses', error);
    }
  };

  // Original daily agenda function (for automatic updates)
  const sendDailyAgenda = () => {
    if (!isConnected || !calendarSettings.dailyAgenda) return;
    
    try {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      // Get today's tasks
      const todaysTasks = tasks.filter(task => 
        task.date === formattedDate && !task.completed
      );
      
      if (todaysTasks.length === 0) return;
      
      // Sort by time
      todaysTasks.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      
      // Prepare a summary message
      let message = `You have ${todaysTasks.length} events today:\n`;
      
      todaysTasks.forEach((task, index) => {
        if (index < 3) { // Limit to first 3 tasks to fit on display
          message += `${index + 1}. ${task.time || 'All day'} - ${task.title}\n`;
        }
      });
      
      if (todaysTasks.length > 3) {
        message += `... and ${todaysTasks.length - 3} more`;
      }
      
      const agendaData = {
        type: "daily_agenda",
        message: message
      };
      
      sendData(JSON.stringify(agendaData));
      console.log('Sent daily agenda to glasses');
    } catch (error) {
      console.error('Failed to send daily agenda to glasses', error);
    }
  };

  // Send today's agenda to the glasses with timeout for 6 seconds
  const sendDailyAgendaWithTimeout = () => {
    if (!isConnected || !calendarSettings.dailyAgenda) {
      Alert.alert(
        "Connection Required",
        "Please connect to your smart glasses first",
        [{ text: "Go to Settings", onPress: () => /* router.push("/settings") */ console.log("Navigate to settings") }]
      );
      return;
    }
    
    try {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      // Get today's tasks
      const todaysTasks = tasks.filter(task => 
        task.date === formattedDate && !task.completed
      );
      
      if (todaysTasks.length === 0) {
        Alert.alert("No Events", "You don't have any events scheduled for today.");
        return;
      }
      
      // Sort by time
      todaysTasks.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      
      // Prepare a summary message
      let message = `You have ${todaysTasks.length} events today:\n`;
      
      todaysTasks.forEach((task, index) => {
        if (index < 3) { // Limit to first 3 tasks to fit on display
          message += `${index + 1}. ${task.time || 'All day'} - ${task.title}\n`;
        }
      });
      
      if (todaysTasks.length > 3) {
        message += `... and ${todaysTasks.length - 3} more`;
      }
      
      // Send the agenda to display for 6 seconds
      const agendaData = {
        type: "temporary_message",
        title: "Today's Agenda",
        message: message,
        duration: 6000 // 6 seconds in milliseconds
      };
      
      sendData(JSON.stringify(agendaData));
      console.log('Sent daily agenda to glasses for 6 seconds');
      
      // Show confirmation to the user
      Alert.alert("Success", "Today's agenda has been sent to your smart glasses");
    } catch (error) {
      console.error('Failed to send daily agenda to glasses', error);
      Alert.alert("Error", "Failed to send agenda to glasses. Please try again.");
    }
  };

  // Send location-based reminder if enabled
  const sendLocationBasedReminder = (task: Task) => {
    if (!isConnected || !calendarSettings.locationBasedReminders || !task.location) return;
    
    try {
      const locationData = {
        type: "location_message",
        location: task.location,
        message: `You need to leave now for: ${task.title} at ${task.time}`
      };
      
      sendData(JSON.stringify(locationData));
      console.log(`Sent location reminder for ${task.title} at ${task.location}`);
    } catch (error) {
      console.error('Failed to send location reminder to glasses', error);
    }
  };

  // Button to manually sync today's events with glasses
  const syncWithGlasses = () => {
    sendDailyAgendaWithTimeout();
  };

  const generateCalendarDays = (month: Date) => {
    const days: CalendarDay[] = [];
    const today = new Date();
    
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    const prevMonth = new Date(month.getFullYear(), month.getMonth(), 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDate(date, today)
      });
    }
    
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(month.getFullYear(), month.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDate(date, today)
      });
    }
    
    const remainingDays = 42 - days.length;
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDate(date, today)
      });
    }
    
    setCalendarDays(days);
  };

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  useEffect(() => {
    loadTasks();
    Animated.timing(
      fadeAnim,
      {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }
    ).start();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Failed to load tasks', error);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Failed to save tasks', error);
    }
  };

  useEffect(() => {
    if (newTask === '') {
      const currentTime = getCurrentTime();
      setSelectedTime(currentTime.formatted);
    }
  }, [newTask]);

  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const timeToUse = selectedTime || getCurrentTime().formatted;
    
    const newTaskItem: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      date: formattedDate,
      time: timeToUse,
      location: locationInput.trim() || undefined,
      reminderSent: {
        fiveMinutes: false,
        tenMinutes: false,
        fifteenMinutes: false
      }
    };
    
    const updatedTasks = [...tasks, newTaskItem];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTask('');
    setLocationInput('');
    setSelectedTime(getCurrentTime().formatted);
  };

  const toggleTaskCompletion = (id: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            const updatedTasks = tasks.filter(task => task.id !== id);
            setTasks(updatedTasks);
            saveTasks(updatedTasks);
          }
        }
      ]
    );
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTaskText(task.title);
    setSelectedTime(task.time || '');
    
    if (task.time) {
      const amPmMatch = task.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (amPmMatch) {
        let hours = parseInt(amPmMatch[1], 10);
        const minutes = amPmMatch[2];
        const period = amPmMatch[3].toUpperCase();
        
        if (period === 'PM' && hours < 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        const convertedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        setSelectedTime(convertedTime);
        setTimeInputHour(hours.toString());
        setTimeInputMinute(minutes);
      } else {
        const [hours, minutes] = task.time.split(':');
        setTimeInputHour(hours);
        setTimeInputMinute(minutes);
      }
    } else {
      setTimePickerToCurrent();
    }
    
    setModalVisible(true);
  };

  const updateTask = () => {
    if (!editingTask || editTaskText.trim() === '') return;
    
    const updatedTask: Task = {
      ...editingTask,
      title: editTaskText,
      time: selectedTime,
      location: editLocationInput.trim() || undefined
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id ? updatedTask : task
    );
    
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setEditingTask(null);
    setModalVisible(false);
    setEditTaskText('');
    setEditLocationInput('');
  };

  const isSameDate = (date1: Date, date2: Date): boolean => {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isSelectedDate = (date: Date): boolean => {
    return isSameDate(date, selectedDate);
  };

  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const getYear = (date: Date): number => {
    return date.getFullYear();
  };

  const hasTasksOnDate = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.some(task => task.date === dateStr);
  };

  const filteredTasks = tasks.filter(task => {
    const taskDate = task.date;
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return taskDate === selectedDateStr;
  });

  const completedTasks = filteredTasks.filter(task => task.completed).length;
  const totalTasks = filteredTasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setCalendarModalVisible(false);
  };

  useEffect(() => {
    generateMonthCalendar(currentMonth);
  }, [currentMonth]);

  const generateMonthCalendar = (month: Date) => {
    const days: CalendarDay[] = [];
    const today = new Date();
    
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    const prevMonth = new Date(month.getFullYear(), month.getMonth(), 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDate(date, today)
      });
    }
    
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(month.getFullYear(), month.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDate(date, today)
      });
    }
    
    const remainingDays = 42 - days.length;
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDate(date, today)
      });
    }
    
    setMonthCalendarDays(days);
  };

  const renderCalendarItem = ({ item, index }: { item: CalendarDay, index: number }) => (
    <TouchableOpacity
      style={[
        styles.calendarGridItem,
        !item.isCurrentMonth && styles.calendarDayOutsideMonth,
        isSelectedDate(item.date) && styles.calendarSelectedDay,
      ]}
      onPress={() => {
        setSelectedDate(item.date);
        setCalendarModalVisible(false);
      }}
    >
      <Text style={[
        styles.calendarDayText,
        !item.isCurrentMonth && styles.calendarDayTextOutside,
        item.isToday && styles.todayText,
        isSelectedDate(item.date) && styles.selectedDayText,
      ]}>
        {item.date.getDate()}
      </Text>
      {hasTasksOnDate(item.date) && (
        <View style={[
          styles.taskIndicator,
          isSelectedDate(item.date) && styles.selectedTaskIndicator
        ]} />
      )}
    </TouchableOpacity>
  );

  const setTimePickerToCurrent = () => {
    const currentTime = getCurrentTime();
    setTimeInputHour(currentTime.hour);
    setTimeInputMinute(currentTime.minute);
  };

  const openTimePicker = () => {
    setTimePickerToCurrent();
    setTimePickerVisible(true);
  };

  const closeTimePicker = () => {
    setTimePickerVisible(false);
  };

  const setTime = () => {
    let hour = parseInt(timeInputHour, 10);
    const minute = timeInputMinute.padStart(2, '0');
    
    if (isNaN(hour) || hour < 0 || hour > 23) {
      hour = new Date().getHours();
    }
    
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute}`;
    setSelectedTime(formattedTime);
    setTimePickerVisible(false);
  };

  const clearTime = () => {
    setSelectedTime('');
    setTimePickerVisible(false);
  };

  const formatTimeDisplay = (time?: string) => {
    if (!time) return '';
    return time;
  };

  const getCurrentTimeFormatted = () => {
    return getCurrentTime().formatted;
  };
  
  // Check and send 10-minute reminder alerts to glasses
  const checkAndSendTenMinuteAlerts = () => {
    if (!isConnected) return;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Calculate tomorrow's date for checking tasks around midnight
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Get today's tasks
    const todayTasks = tasks.filter(task => 
      task.date === todayStr && task.time && !task.completed
    );
    
    // Also check tomorrow's tasks if we're close to midnight
    const isCloseToMidnight = now.getHours() === 23 && now.getMinutes() >= 50;
    const tomorrowTasks = isCloseToMidnight ? 
      tasks.filter(task => 
        task.date === tomorrowStr && task.time && !task.completed &&
        // Only include tasks within an hour of midnight
        task.time.startsWith('00:')
      ) : [];
    
    // Combined list of tasks to check
    const tasksToCheck = [...todayTasks, ...tomorrowTasks];
    
    tasksToCheck.forEach(task => {
      if (!task.time) return;
      
      const [hours, minutes] = task.time.split(':').map(Number);
      
      // For tomorrow's tasks near midnight
      if (task.date === tomorrowStr) {
        const taskDateTime = new Date(now);
        taskDateTime.setDate(taskDateTime.getDate() + 1);
        taskDateTime.setHours(hours, minutes, 0, 0);
        
        const diffMs = taskDateTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        // 9-11 minute window to avoid missing it
        if (diffMinutes >= 9 && diffMinutes <= 11) {
          if (!alertedEventsRef.current.has(task.id)) {
            sendTenMinuteAlertToGlasses(task);
            alertedEventsRef.current.add(task.id);
          }
        }
        return;
      }
      
      // For today's tasks
      const taskDateTime = new Date(now);
      taskDateTime.setHours(hours, minutes, 0, 0);
      
      const diffMs = taskDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      // If task is coming up in 10 minutes (9-11 minute window to avoid missing it)
      if (diffMinutes >= 9 && diffMinutes <= 11) {
        // Check if we've already sent an alert for this task
        if (!alertedEventsRef.current.has(task.id)) {
          // Send alert to glasses
          sendTenMinuteAlertToGlasses(task);
          // Mark as alerted
          alertedEventsRef.current.add(task.id);
        }
      }
    });
  };
  
  // Send a 10-minute alert to the smart glasses
  const sendTenMinuteAlertToGlasses = (task: Task) => {
    try {
      // Get the formatted date for display
      let dateText = '';
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      if (task.date === todayStr) {
        dateText = 'today';
      } else {
        // Format the date as "Jan 15" or similar
        const taskDate = new Date(task.date);
        dateText = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      const alertData = {
        type: "urgent_alert",
        title: "Event in 10 Minutes",
        message: `${task.title} at ${task.time} ${dateText}\n${task.location ? `Location: ${task.location}` : ''}`,
        priority: "high"
      };
      
      sendData(JSON.stringify(alertData));
      console.log(`Sent 10-minute alert to glasses: ${task.title}`);
    } catch (error) {
      console.error('Failed to send 10-minute alert to glasses', error);
    }
  };

  // Add effect for 10-minute alerts
  useEffect(() => {
    if (isConnected) {
      const alertInterval = setInterval(() => {
        checkAndSendTenMinuteAlerts();
      }, 60000); // Check every minute
      
      return () => clearInterval(alertInterval);
    }
  }, [isConnected, tasks]);

  // Update checkUpcomingEvents to also send to glasses
  const checkUpcomingEvents = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Calculate tomorrow's date
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Get incomplete tasks for today and tomorrow
    const todayTasks = tasks.filter(task => 
      task.date === todayStr && task.time && !task.completed
    );
    
    const tomorrowTasks = tasks.filter(task => 
      task.date === tomorrowStr && task.time && !task.completed
    );
    
    // Filter for upcoming events in the next 10 minutes
    const filterUpcoming = (taskList: Task[]) => {
      return taskList.filter(task => {
        if (!task.time) return false;
        
        const timeParts = task.time.split(':');
        if (timeParts.length !== 2) return false;
        
        const taskHour = parseInt(timeParts[0], 10);
        const taskMinute = parseInt(timeParts[1], 10);
        
        if (isNaN(taskHour) || isNaN(taskMinute)) return false;
        
        const taskTime = new Date(now);
        taskTime.setHours(taskHour, taskMinute, 0, 0);
        
        // For today's tasks
        if (task.date === todayStr) {
          const diffMs = taskTime.getTime() - now.getTime();
          const diffMinutes = diffMs / (1000 * 60);
          return diffMinutes >= 0 && diffMinutes <= 10;
        }
        
        // For tomorrow's tasks - early morning tasks (after midnight)
        // Check if it's within the next 10 minutes after midnight
        if (task.date === tomorrowStr) {
          // Only check if we're approaching midnight (in the last hour of the day)
          if (now.getHours() === 23) {
            const midnightToday = new Date(now);
            midnightToday.setHours(24, 0, 0, 0);  // Set to midnight
            
            const tomorrowTaskTime = new Date(now);
            tomorrowTaskTime.setDate(tomorrowTaskTime.getDate() + 1);
            tomorrowTaskTime.setHours(taskHour, taskMinute, 0, 0);
            
            const diffMs = tomorrowTaskTime.getTime() - now.getTime();
            const diffMinutes = diffMs / (1000 * 60);
            
            // If it's within 10 minutes after midnight and we're approaching midnight
            return diffMinutes >= 0 && diffMinutes <= 10;
          }
        }
        
        return false;
      });
    };
    
    const upcomingToday = filterUpcoming(todayTasks);
    const upcomingTomorrow = filterUpcoming(tomorrowTasks);
    
    // Combined upcoming events, but keeping track of which day they belong to
    const upcoming = [
      ...upcomingToday.map(task => ({ ...task, dayType: 'today' as const })),
      ...upcomingTomorrow.map(task => ({ ...task, dayType: 'tomorrow' as const }))
    ];
    
    const eventsNeedingAlert = upcoming.filter(event => {
      if (alertedEventsRef.current.has(event.id)) {
        return false;
      }
      
      const wasInPreviousList = previousUpcomingEventsRef.current.some(
        prevEvent => prevEvent.id === event.id
      );
      
      if (!wasInPreviousList) {
        alertedEventsRef.current.add(event.id);
        return true;
      }
      
      return false;
    });
    
    if (eventsNeedingAlert.length > 0) {
      // Group events by day
      const todayEvents = eventsNeedingAlert.filter(event => event.dayType === 'today');
      const tomorrowEvents = eventsNeedingAlert.filter(event => event.dayType === 'tomorrow');
      
      // Show alerts separately for today and tomorrow
      if (todayEvents.length > 0) {
        showEventAlert(todayEvents, 'today');
      }
      
      if (tomorrowEvents.length > 0) {
        showEventAlert(tomorrowEvents, 'tomorrow');
      }
      
      // Also send alerts to glasses for new upcoming events
      if (isConnected) {
        eventsNeedingAlert.forEach(event => {
          sendTenMinuteAlertToGlasses(event);
        });
      }
    }
    
    setUpcomingEvents(upcoming);
    previousUpcomingEventsRef.current = upcoming;
  };
  
  const showEventAlert = (events: Task[], dayType: 'today' | 'tomorrow') => {
    let title = "Upcoming Event";
    let message = "";
    const dayText = dayType === 'today' ? 'today' : 'tomorrow';
    
    if (events.length === 1) {
      const event = events[0];
      title = `Upcoming Event in 10 Minutes (${dayText})`;
      message = `"${event.title}" is scheduled for ${event.time} ${dayText}.`;
    } else {
      title = `Upcoming Events in 10 Minutes (${dayText})`;
      message = `You have these events coming up ${dayText}:\n\n` + 
        events.map(event => `• ${event.time} - ${event.title}`).join('\n');
    }
    
    Alert.alert(
      title,
      message,
      [
        { 
          text: "Snooze (5 min)",
          onPress: () => {
            events.forEach(event => {
              alertedEventsRef.current.delete(event.id);
            });
            
            setTimeout(() => {
              if (events.some(event => !tasks.find(t => t.id === event.id)?.completed)) {
                showEventAlert(events, dayType);
              }
            }, 5 * 60 * 1000);
          }
        },
        { 
          text: "OK", 
          style: "default" 
        }
      ],
      { cancelable: false }
    );
  };
  
  useEffect(() => {
    alertedEventsRef.current = new Set();
    
    checkUpcomingEvents();
    
    checkEventsIntervalRef.current = setInterval(checkUpcomingEvents, 60000);
    
    return () => {
      if (checkEventsIntervalRef.current) {
        clearInterval(checkEventsIntervalRef.current);
      }
    };
  }, [tasks]);
  
  useEffect(() => {
    checkUpcomingEvents();
  }, [selectedDate]);

  const completeTaskFromAlert = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    
    const updatedUpcoming = upcomingEvents.filter(event => event.id !== taskId);
    setUpcomingEvents(updatedUpcoming);
  };

  const incrementHour = () => {
    const currentHour = parseInt(timeInputHour, 10);
    if (isNaN(currentHour)) {
      setTimeInputHour('00');
      return;
    }
    
    const newHour = (currentHour + 1) % 24;
    setTimeInputHour(newHour.toString().padStart(2, '0'));
  };

  const decrementHour = () => {
    const currentHour = parseInt(timeInputHour, 10);
    if (isNaN(currentHour)) {
      setTimeInputHour('23');
      return;
    }
    
    const newHour = (currentHour - 1 + 24) % 24;
    setTimeInputHour(newHour.toString().padStart(2, '0'));
  };

  const incrementMinute = () => {
    const currentMinute = parseInt(timeInputMinute, 10);
    if (isNaN(currentMinute)) {
      setTimeInputMinute('00');
      return;
    }
    
    const newMinute = (currentMinute + 1) % 60;
    setTimeInputMinute(newMinute.toString().padStart(2, '0'));
  };

  const decrementMinute = () => {
    const currentMinute = parseInt(timeInputMinute, 10);
    if (isNaN(currentMinute)) {
      setTimeInputMinute('59');
      return;
    }
    
    const newMinute = (currentMinute - 1 + 60) % 60;
    setTimeInputMinute(newMinute.toString().padStart(2, '0'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Upcoming Events Alert Banner */}
      {upcomingEvents.length > 0 && (
        <Animated.View style={[styles.upcomingEventsContainer, { opacity: fadeAnim }]}>
          <View style={styles.upcomingEventsBadge}>
            <Text style={styles.upcomingEventsBadgeText}>{upcomingEvents.length}</Text>
          </View>
          <FontAwesome6 
            name="bell" 
            size={20} 
            color={COLORS.background} 
            style={styles.upcomingEventsIcon} 
          />
          <View style={styles.upcomingEventsTextContainer}>
            <Text style={styles.upcomingEventsTitle}>Upcoming events</Text>
            <Text style={styles.upcomingEventsSubtitle}>
              {upcomingEvents.length === 1 
                ? 'You have an event in the next 10 minutes' 
                : `You have ${upcomingEvents.length} events in the next 10 minutes`
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.upcomingEventsButton}
            onPress={() => {
              Alert.alert(
                "Upcoming Events",
                upcomingEvents.map(event => 
                  `• ${event.title} at ${event.time}`
                ).join('\n'),
                [
                  ...upcomingEvents.map(event => ({
                    text: `Complete "${event.title.substring(0, 20)}${event.title.length > 20 ? '...' : ''}"`,
                    onPress: () => completeTaskFromAlert(event.id)
                  })),
                  { text: "Close", style: "cancel" }
                ]
              );
            }}
          >
            <Text style={styles.upcomingEventsButtonText}>View</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.monthText}>{getMonthName(selectedDate)} {getYear(selectedDate)}</Text>
          <Text style={styles.headerTitle}>Tasks</Text>
        </View>
        
        {totalTasks > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${completionPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {completedTasks}/{totalTasks} completed
            </Text>
          </View>
        )}
      </Animated.View>
      
      {/* Calendar button */}
      <View style={styles.calendarButtonRow}>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => setCalendarModalVisible(true)}
        >
          <View style={styles.calendarButtonContent}>
            <Text style={styles.selectedDateText}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            <FontAwesome6 name="calendar-alt" size={18} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
        
        {/* Show on Glasses button */}
        <TouchableOpacity 
          style={styles.showOnGlassesButton}
          onPress={sendDailyAgendaWithTimeout}
        >
          <FontAwesome6 name="glasses" size={18} color="#FFFFFF" />
          <Text style={styles.showOnGlassesText}>Show on Glasses</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.dateHeader}>
        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      
      {/* Add Task Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add a new task..."
          placeholderTextColor={COLORS.textLight}
        />
        <TouchableOpacity 
          style={styles.timeButton} 
          onPress={openTimePicker}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="clock" size={20} color={selectedTime ? COLORS.primary : COLORS.textLight} />
          {selectedTime && <View style={styles.timeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={addTask}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Task List */}
      <ScrollView 
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="list-check" size={60} color={COLORS.secondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No tasks for today</Text>
            <Text style={styles.emptySubText}>Tap the + button to add your first task</Text>
          </View>
        ) : (
          filteredTasks.map((task, index) => (
            <Animated.View 
              key={task.id} 
              style={[
                styles.taskItem,
                { 
                  transform: [{ 
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }],
                  opacity: fadeAnim
                }
              ]}
            >
              <TouchableOpacity
                style={styles.taskCheckbox}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                {task.completed ? (
                  <View style={styles.checkedCircle}>
                    <FontAwesome6 name="check" size={14} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.uncheckedCircle} />
                )}
              </TouchableOpacity>
              
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.completed && styles.completedTask,
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                
                {task.time && (
                  <View style={styles.timeContainer}>
                    <FontAwesome6 name="clock" size={12} color={COLORS.textLight} style={styles.timeIcon} />
                    <Text style={styles.timeText}>{formatTimeDisplay(task.time)}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(task)}
                >
                  <FontAwesome6 name="pen" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTask(task.id)}
                >
                  <FontAwesome6 name="trash" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        )}
        
        {/* Add some space at the bottom for better UX */}
        <View style={styles.listFooter} />
      </ScrollView>
      
      {/* Edit Task Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Task</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <FontAwesome6 name="times" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={editTaskText}
              onChangeText={setEditTaskText}
              autoFocus
            />
            
            <TouchableOpacity 
              style={styles.timeSelector} 
              onPress={openTimePicker}
            >
              <FontAwesome6 name="clock" size={18} color={COLORS.primary} style={styles.timeSelectorIcon} />
              <Text style={styles.timeSelectorText}>
                {selectedTime ? selectedTime : 'Set time (optional)'}
              </Text>
              {selectedTime && (
                <TouchableOpacity 
                  style={styles.clearTimeButton} 
                  onPress={clearTime}
                >
                  <FontAwesome6 name="times-circle" size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateTask}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Time Picker Modal - updated with arrow controls */}
      <Modal
        visible={timePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeTimePicker}
      >
        <View style={styles.modalContainer}>
          <View style={styles.timePickerContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Time (24-hour)</Text>
              <TouchableOpacity 
                onPress={closeTimePicker}
                style={styles.closeButton}
              >
                <FontAwesome6 name="times" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeInputContainer}>
              {/* Hour input with arrows */}
              <View style={styles.timeInputWrapper}>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={incrementHour}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="chevron-up" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                
                <Text style={styles.timeInputLabel}>Hour (0-23)</Text>
                
                <TextInput
                  style={styles.timeInput}
                  value={timeInputHour}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9]/g, '');
                    if (filtered === '' || parseInt(filtered, 10) <= 23) {
                      setTimeInputHour(filtered);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                />
                
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={decrementHour}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="chevron-down" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.timeColon}>:</Text>
              
              {/* Minute input with arrows */}
              <View style={styles.timeInputWrapper}>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={incrementMinute}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="chevron-up" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                
                <Text style={styles.timeInputLabel}>Minute</Text>
                
                <TextInput
                  style={styles.timeInput}
                  value={timeInputMinute}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9]/g, '');
                    if (filtered === '' || parseInt(filtered, 10) <= 59) {
                      setTimeInputMinute(filtered);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                />
                
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={decrementMinute}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="chevron-down" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.timePickerButtons}>
              <TouchableOpacity
                style={[styles.timePickerButton, styles.clearTimePickerButton]}
                onPress={clearTime}
              >
                <Text style={styles.clearTimeText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.timePickerButton, styles.setTimeButton]}
                onPress={setTime}
              >
                <Text style={styles.setTimeText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Add the calendar modal */}
      <Modal
        visible={calendarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarModalHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
                <FontAwesome6 name="chevron-left" size={16} color={COLORS.text} />
              </TouchableOpacity>
              
              <Text style={styles.calendarModalTitle}>
                {getMonthName(currentMonth)} {getYear(currentMonth)}
              </Text>
              
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
                <FontAwesome6 name="chevron-right" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {/* Weekday headers */}
            <View style={styles.weekdayHeader}>
              {WEEKDAYS.map((day, index) => (
                <Text key={index} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>
            
            {/* Calendar grid */}
            <FlatList
              data={monthCalendarDays}
              renderItem={renderCalendarItem}
              keyExtractor={(item, index) => index.toString()}
              numColumns={7}
              scrollEnabled={false}
            />
            
            <View style={styles.calendarModalFooter}>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setCurrentMonth(today);
                  setCalendarModalVisible(false);
                }}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeCalendarButton}
                onPress={() => setCalendarModalVisible(false)}
              >
                <Text style={styles.closeCalendarText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  monthText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 5,
    marginBottom: 15,
  },
  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 5,
    textAlign: 'right',
  },
  calendarButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  calendarButton: {
    flex: 1,
    marginRight: 10,
  },
  calendarButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 10,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  calendarModalContent: {
    width: width - 40,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBg,
    paddingBottom: 10,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
    width: (width - 80) / 7,
    textAlign: 'center',
  },
  calendarGridItem: {
    width: (width - 80) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  calendarDayOutsideMonth: {
    opacity: 0.4,
  },
  calendarDayTextOutside: {
    color: COLORS.textLight,
  },
  calendarSelectedDay: {
    backgroundColor: COLORS.primary + '20',
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  taskIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    marginTop: 2,
  },
  selectedTaskIndicator: {
    backgroundColor: COLORS.primary,
  },
  calendarModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBg,
    paddingTop: 20,
  },
  todayButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
  },
  todayButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  closeCalendarButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  closeCalendarText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.text,
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timeButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  taskCheckbox: {
    marginRight: 15,
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  checkedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 16,
    color: COLORS.text,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: COLORS.textLight,
  },
  taskActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    marginBottom: 15,
    opacity: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textLight,
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width - 60,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 20,
    width: '48%',
  },
  cancelButton: {
    backgroundColor: COLORS.inputBg,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  listFooter: {
    height: 40,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  timeSelectorIcon: {
    marginRight: 10,
  },
  timeSelectorText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  clearTimeButton: {
    padding: 5,
  },
  timePickerContainer: {
    width: width - 60,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  timeInputWrapper: {
    alignItems: 'center',
  },
  timeArrowButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    marginVertical: 5,
  },
  timeInputLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  timeInput: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  timePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePickerButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 20,
    width: '48%',
  },
  clearTimePickerButton: {
    backgroundColor: COLORS.inputBg,
  },
  setTimeButton: {
    backgroundColor: COLORS.primary,
  },
  clearTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  setTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  upcomingEventsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 15,
    margin: 15,
    marginBottom: 0,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  upcomingEventsBadge: {
    backgroundColor: COLORS.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1,
  },
  upcomingEventsBadgeText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  upcomingEventsIcon: {
    marginRight: 15,
  },
  upcomingEventsTextContainer: {
    flex: 1,
  },
  upcomingEventsTitle: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  upcomingEventsSubtitle: {
    color: COLORS.background,
    opacity: 0.8,
    fontSize: 12,
  },
  upcomingEventsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  upcomingEventsButtonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 14,
  },
  showOnGlassesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  showOnGlassesText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default To_do;

