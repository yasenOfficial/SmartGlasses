import React, { useState, useCallback, memo } from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Agenda } from 'react-native-calendars';
import styles from './Box2Screen.styles';

const EventItem = memo(({ item }) => {
  return (
    <TouchableOpacity style={styles.item}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.itemText}>{item.data}</Text>
    </TouchableOpacity>
  );
});

const EmptyDateComponent = memo(() => {
  return (
    <View style={styles.emptyDate}>
      <Text style={styles.emptyDateText}>You don't have any tasks for this day</Text>
    </View>
  );
});

function App() {
  const [items, setItems] = useState({
    '2025-03-04': [{name: 'Meeting 1', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2025-03-28': [{name: 'Meeting 2', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2025-03-29': [{name: 'Meeting 3', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2025-03-30': [{name: 'Meeting 4', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2025-03-31': [{name: 'Meeting 5', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2025-03-25': [{name: 'Meeting 6', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}]
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventData, setEventData] = useState('');
  
  const currentDate = new Date();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthName = (monthIndex) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const addEvent = () => {
    if (eventName.trim() === '') {
      alert('Please enter an event name');
      return;
    }

    const formattedDate = formatDate(selectedDate);
    
    const updatedItems = {...items};
    
    if (updatedItems[formattedDate]) {
      updatedItems[formattedDate] = [
        ...updatedItems[formattedDate],
        { name: eventName, data: eventData }
      ];
    } else {
      updatedItems[formattedDate] = [{ name: eventName, data: eventData }];
    }
    
    setItems(updatedItems);
    
    setEventName('');
    setEventData('');
    setModalVisible(false);
  };

  const generateDaysForMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectorYear, setSelectorYear] = useState(currentDate.getFullYear());
  const [selectorMonth, setSelectorMonth] = useState(currentDate.getMonth());
  
  const years = Array.from(
    { length: 10 }, 
    (_, i) => currentDate.getFullYear() - 5 + i
  );
  
  const months = Array.from(
    { length: 12 }, 
    (_, i) => ({ index: i, name: getMonthName(i) })
  );
  
  const days = generateDaysForMonth(selectorYear, selectorMonth);

  const selectDate = (day) => {
    const newDate = new Date(selectorYear, selectorMonth, day);
    setSelectedDate(newDate);
    setShowDateSelector(false);
  };

  const renderItem = useCallback((item, isFirst) => {
    return <EventItem item={item} />;
  }, []);

  const renderEmptyDate = useCallback(() => {
    return <EmptyDateComponent />;
  }, []);

  const loadItems = useCallback((day) => {
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar Events</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Event</Text>
        </TouchableOpacity>
      </View>

      <Agenda
        items={items}
        renderItem={renderItem}
        renderEmptyDate={renderEmptyDate}
        loadItemsForMonth={loadItems}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
        showClosingKnob={true}
        hideExtraDays={true}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add New Event</Text>
            
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Event Name:</Text>
              <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="Enter event name"
              />
              
              <Text style={styles.label}>Event Description:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={eventData}
                onChangeText={setEventData}
                placeholder="Enter event description"
                multiline={true}
                numberOfLines={4}
              />
              
              <Text style={styles.label}>Date:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDateSelector(true)}
              >
                <Text>{selectedDate.toDateString()}</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={addEvent}
              >
                <Text style={styles.buttonText}>Save Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {modalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showDateSelector}
          onRequestClose={() => setShowDateSelector(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.dateSelectorModal}>
              <Text style={styles.modalTitle}>Select Date</Text>
              
              <View style={styles.dateSelectors}>
                <View style={styles.selectorContainer}>
                  <Text style={styles.selectorLabel}>Year</Text>
                  <ScrollView style={styles.selector}>
                    {years.map(year => (
                      <TouchableOpacity 
                        key={`year-${year}`}
                        style={[
                          styles.selectorItem, 
                          selectorYear === year && styles.selectedItem
                        ]}
                        onPress={() => setSelectorYear(year)}
                      >
                        <Text 
                          style={selectorYear === year ? styles.selectedItemText : null}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.selectorContainer}>
                  <Text style={styles.selectorLabel}>Month</Text>
                  <ScrollView style={styles.selector}>
                    {months.map(month => (
                      <TouchableOpacity 
                        key={`month-${month.index}`}
                        style={[
                          styles.selectorItem, 
                          selectorMonth === month.index && styles.selectedItem
                        ]}
                        onPress={() => setSelectorMonth(month.index)}
                      >
                        <Text 
                          style={selectorMonth === month.index ? styles.selectedItemText : null}
                        >
                          {month.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <Text style={styles.selectorLabel}>Day</Text>
              <View style={styles.daysContainer}>
                {days.map(day => (
                  <TouchableOpacity 
                    key={`day-${day}`}
                    style={[
                      styles.dayItem,
                      selectedDate.getDate() === day && 
                      selectedDate.getMonth() === selectorMonth && 
                      selectedDate.getFullYear() === selectorYear && 
                      styles.selectedDayItem
                    ]}
                    onPress={() => selectDate(day)}
                  >
                    <Text 
                      style={
                        selectedDate.getDate() === day && 
                        selectedDate.getMonth() === selectorMonth && 
                        selectedDate.getFullYear() === selectorYear ? 
                        styles.selectedItemText : null
                      }
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.datePickerButtonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setShowDateSelector(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default App;