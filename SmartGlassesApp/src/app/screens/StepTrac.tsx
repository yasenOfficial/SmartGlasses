import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBluetooth } from '../../context/BluetoothContext';

const { width } = Dimensions.get('window');

// Define note interface
interface Note {
  id: string;
  title: string;
  content: string;
  date: string; // ISO string
  color: string;
  isPinned: boolean;
}

// Available note colors
const COLORS = {
  primary: '#6C5CE7',
  blue: '#74B9FF',
  green: '#55EFC4',
  yellow: '#FDCB6E',
  red: '#FF7675',
  purple: '#A29BFE',
  background: '#F8F9FA',
  text: '#2D3436',
  textLight: '#636E72',
  card: '#FFFFFF',
  inputBg: '#F1F2F6',
  shadow: '#2D3436'
};

// Note color options
const NOTE_COLORS = [
  COLORS.blue, 
  COLORS.green, 
  COLORS.yellow, 
  COLORS.red, 
  COLORS.purple, 
  COLORS.primary
];

const NotesScreen: React.FC = () => {
  const { isConnected, sendData } = useBluetooth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedNoteColor, setSelectedNoteColor] = useState(NOTE_COLORS[0]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  
  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Load notes from AsyncStorage
  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem('notes');
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
        // Set some example notes for first-time users
        const exampleNotes: Note[] = [
          {
            id: Date.now().toString(),
            title: 'Welcome to Notes!',
            content: 'Tap the + button to create a new note. You can edit or delete notes by tapping on them.',
            date: new Date().toISOString(),
            color: NOTE_COLORS[0],
            isPinned: true
          },
          {
            id: (Date.now() + 1).toString(),
            title: 'Smart Glasses Features',
            content: 'Your notes can be displayed on your smart glasses for quick reference.',
            date: new Date().toISOString(),
            color: NOTE_COLORS[2],
            isPinned: false
          }
        ];
        setNotes(exampleNotes);
        await AsyncStorage.setItem('notes', JSON.stringify(exampleNotes));
      }
    } catch (error) {
      console.error('Failed to load notes', error);
      Alert.alert('Error', 'Failed to load your notes.');
    }
  };

  // Save notes to AsyncStorage
  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Failed to save notes', error);
      Alert.alert('Error', 'Failed to save your notes.');
    }
  };

  // Create a new note
  const addNote = () => {
    if (!newNoteTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for your note.');
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      date: new Date().toISOString(),
      color: selectedNoteColor,
      isPinned: false
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    
    // Reset form
    setNewNoteTitle('');
    setNewNoteContent('');
    setSelectedNoteColor(NOTE_COLORS[0]);
    setModalVisible(false);
  };

  // Update an existing note
  const updateNote = () => {
    if (!currentNote) return;
    
    if (!newNoteTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for your note.');
      return;
    }

    const updatedNote = {
      ...currentNote,
      title: newNoteTitle,
      content: newNoteContent,
      color: selectedNoteColor,
      date: new Date().toISOString() // Update the modification date
    };

    const updatedNotes = notes.map(note => 
      note.id === currentNote.id ? updatedNote : note
    );

    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    
    // Reset form and close modal
    setNewNoteTitle('');
    setNewNoteContent('');
    setSelectedNoteColor(NOTE_COLORS[0]);
    setEditModalVisible(false);
    setCurrentNote(null);
  };

  // Delete a note
  const deleteNote = (id: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedNotes = notes.filter(note => note.id !== id);
            setNotes(updatedNotes);
            saveNotes(updatedNotes);
            if (editModalVisible) {
              setEditModalVisible(false);
              setCurrentNote(null);
            }
          }
        }
      ]
    );
  };

  // Toggle pin status of a note
  const togglePin = (id: string) => {
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        return {...note, isPinned: !note.isPinned};
      }
      return note;
    });
    
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  // Open edit modal with selected note
  const openEditModal = (note: Note) => {
    setCurrentNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setSelectedNoteColor(note.color);
    setEditModalVisible(true);
  };

  // Send note to smart glasses
  const sendNoteToGlasses = (note: Note) => {
    if (!isConnected) {
      Alert.alert(
        'Connection Required',
        'Please connect to your smart glasses first',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Send the note to the smart glasses
      sendData(JSON.stringify({
        type: 'note',
        title: note.title,
        content: note.content.substring(0, 200) // Limit content length
      }));
      
      Alert.alert('Note Sent', 'Your note has been sent to your smart glasses.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send note to your smart glasses.');
      console.error('Failed to send note:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort notes: pinned first, then by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notes</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Notes List */}
      <ScrollView style={styles.notesContainer} showsVerticalScrollIndicator={false}>
        {sortedNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No notes match your search' : 'No notes yet. Create your first note!'}
            </Text>
          </View>
        ) : (
          <View style={styles.notesGrid}>
            {sortedNotes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, { backgroundColor: note.color }]}
                onPress={() => openEditModal(note)}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {note.title}
                  </Text>
                  {note.isPinned && (
                    <Ionicons name="pin" size={16} color="#FFF" />
                  )}
                </View>
                <Text style={styles.noteContent} numberOfLines={5}>
                  {note.content}
                </Text>
                <View style={styles.noteFooter}>
                  <Text style={styles.noteDate}>
                    {formatDate(note.date)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={() => sendNoteToGlasses(note)}
                  >
                    <Ionicons name="glasses-outline" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setNewNoteTitle('');
          setNewNoteContent('');
          setSelectedNoteColor(NOTE_COLORS[0]);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* New Note Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
              placeholderTextColor={COLORS.textLight}
            />

            <TextInput
              style={styles.contentInput}
              placeholder="Note content..."
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.colorSelector}>
              <Text style={styles.colorSelectorLabel}>Color:</Text>
              <View style={styles.colorOptions}>
                {NOTE_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedNoteColor === color && styles.selectedColorOption
                    ]}
                    onPress={() => setSelectedNoteColor(color)}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={addNote}>
              <Text style={styles.saveButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Note</Text>
              <View style={styles.modalActions}>
                {currentNote && (
                  <TouchableOpacity 
                    style={styles.modalAction}
                    onPress={() => togglePin(currentNote.id)}
                  >
                    <Ionicons 
                      name={currentNote.isPinned ? "pin" : "pin-outline"} 
                      size={24} 
                      color={COLORS.text} 
                    />
                  </TouchableOpacity>
                )}
                {currentNote && (
                  <TouchableOpacity 
                    style={styles.modalAction}
                    onPress={() => deleteNote(currentNote.id)}
                  >
                    <Ionicons name="trash-outline" size={24} color={COLORS.red} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.modalAction}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
              placeholderTextColor={COLORS.textLight}
            />

            <TextInput
              style={styles.contentInput}
              placeholder="Note content..."
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.colorSelector}>
              <Text style={styles.colorSelectorLabel}>Color:</Text>
              <View style={styles.colorOptions}>
                {NOTE_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedNoteColor === color && styles.selectedColorOption
                    ]}
                    onPress={() => setSelectedNoteColor(color)}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={updateNote}>
              <Text style={styles.saveButtonText}>Update Note</Text>
            </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  notesContainer: {
    flex: 1,
    padding: 10,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noteCard: {
    width: (width - 50) / 2,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    minHeight: 150,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    flex: 1,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
  },
  sendButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '80%',
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
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAction: {
    marginLeft: 20,
  },
  titleInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  contentInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: COLORS.text,
    height: 200,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  colorSelector: {
    marginVertical: 15,
  },
  colorSelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#FFF',
    transform: [{ scale: 1.2 }],
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 80,
  },
});

export default NotesScreen;
