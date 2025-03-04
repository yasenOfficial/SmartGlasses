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

const EventItem = memo(({ item }) => {
  return (
    <TouchableOpacity>
      <Text>{item.name}</Text>
      <Text>{item.data}</Text>
    </TouchableOpacity>
  );
});

const EmptyDateComponent = memo(() => {
  return (
    <View>
      <Text>You don't have any tasks for this day</Text>
    </View>
  );
});

function App() {
  const [items, setItems] = useState({
    '2024-03-26': [{name: 'Meeting 1', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2024-03-28': [{name: 'Meeting 2', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2024-03-29': [{name: 'Meeting 3', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2024-03-30': [{name: 'Meeting 4', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2024-03-31': [{name: 'Meeting 5', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}],
    '2024-03-25': [{name: 'Meeting 6', data:'Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. '}]
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
    <SafeAreaView>
      <View>
        <Text>Calendar Events</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text>+ Add Event</Text>
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
        <View>
          <View>
            <Text>Add New Event</Text>
            
            <ScrollView>
              <Text>Event Name:</Text>
              <TextInput
                value={eventName}
                onChangeText={setEventName}
                placeholder="Enter event name"
              />
              
              <Text>Event Description:</Text>
              <TextInput
                value={eventData}
                onChangeText={setEventData}
                placeholder="Enter event description"
                multiline={true}
                numberOfLines={4}
              />
              
              <Text>Date:</Text>
              <TouchableOpacity onPress={() => setShowDateSelector(true)}>
                <Text>{selectedDate.toDateString()}</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={addEvent}>
                <Text>Save Event</Text>
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
          <View>
            <View>
              <Text>Select Date</Text>
              
              <View>
                <View>
                  <Text>Year</Text>
                  <ScrollView>
                    {years.map(year => (
                      <TouchableOpacity 
                        key={`year-${year}`}
                        onPress={() => setSelectorYear(year)}
                      >
                        <Text>{year}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View>
                  <Text>Month</Text>
                  <ScrollView>
                    {months.map(month => (
                      <TouchableOpacity 
                        key={`month-${month.index}`}
                        onPress={() => setSelectorMonth(month.index)}
                      >
                        <Text>{month.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <Text>Day</Text>
              <View>
                {days.map(day => (
                  <TouchableOpacity 
                    key={`day-${day}`}
                    onPress={() => selectDate(day)}
                  >
                    <Text>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View>
                <TouchableOpacity onPress={() => setShowDateSelector(false)}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

export default App; 