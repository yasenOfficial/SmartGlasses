import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
// Import our fallback location module that handles the native module error
import Location, { LocationObject, LocationSubscription } from '../../utils/LocationFallback';
import { useBluetooth } from '../../context/BluetoothContext';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

// Log a startup message to confirm terminal logging is working
console.log('\n========== DIRECTIONS APP STARTED ==========');
console.log('Enter a destination to see directions in the terminal');

const ORS_API_KEY = '5b3ce3597851110001cf6248d1d1905d2b4c4a0a943c7cbbaadd0dc8a';

// Core data interfaces
interface Coords {
  latitude: number;
  longitude: number;
}

interface Step {
  instruction: string;
  way_points: number[];
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
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

// Direction Card component - displays a single direction step
const DirectionCard = ({ 
  instruction, 
  distance, 
  isActive, 
  isUpcoming,
  index 
}: { 
  instruction: string, 
  distance?: number, 
  isActive: boolean, 
  isUpcoming: boolean,
  index: number
}) => {
  // Choose icon based on the instruction text
  const getDirectionIcon = (text: string) => {
    if (text.includes('right')) return 'arrow-right';
    if (text.includes('left')) return 'arrow-left';
    if (text.includes('Continue')) return 'arrow-up';
    if (text.includes('destination')) return 'flag';
    if (text.includes('made it')) return 'flag-checkered';
    return 'directions';
  };
  
  const iconName = getDirectionIcon(instruction);
  
  return (
    <View style={[
      styles.directionCard,
      isActive && styles.activeDirectionCard,
      isUpcoming && styles.upcomingDirectionCard
    ]}>
      <View style={styles.directionIconContainer}>
        <View style={[
          styles.directionIconBackground,
          isActive && styles.activeIconBackground
        ]}>
          <MaterialCommunityIcons 
            name={iconName} 
            size={24} 
            color={isActive ? "#fff" : "#4A6572"} 
          />
        </View>
        {index > 0 && <View style={styles.connectorLine} />}
      </View>
      
      <View style={styles.directionContent}>
        <Text style={[
          styles.directionText,
          isActive && styles.activeDirectionText
        ]}>
          {instruction}
        </Text>
        
        {distance !== undefined && distance < 1000 && (
          <Text style={styles.distanceText}>
            {Math.round(distance)}m away
          </Text>
        )}
        
        {distance !== undefined && distance >= 1000 && (
          <Text style={styles.distanceText}>
            {(distance / 1000).toFixed(1)}km away
          </Text>
        )}
      </View>
      
      {isActive && (
        <View style={styles.activeIndicator}>
          <MaterialIcons name="navigation" size={18} color="#FF5722" />
        </View>
      )}
    </View>
  );
};

// Beautiful directions screen UI
const DirectionsUI = ({ 
  location, 
  destinationName,
  destinationCoords, 
  steps,
  currentInstructionIndex,
  upcomingInstructionIndex,
  distanceToNext,
  estimatedTime,
  estimatedDistance 
}: { 
  location: Coords | null,
  destinationName: string,
  destinationCoords: Coords | null,
  steps: Step[],
  currentInstructionIndex: number,
  upcomingInstructionIndex: number | null,
  distanceToNext: number | null,
  estimatedTime: number | null,
  estimatedDistance: number | null
}) => (
  <View style={styles.directionsContainer}>
    {/* Route summary info */}
    {steps.length > 0 && (
      <View style={[styles.headerBackground, { backgroundColor: '#344955' }]}>
        <View style={styles.destinationRow}>
          <MaterialIcons name="location-on" size={20} color="#F9AA33" />
          <Text style={styles.destinationText} numberOfLines={1}>
            {destinationName || "Selected Destination"}
          </Text>
        </View>
        
        {estimatedTime !== null && estimatedDistance !== null && (
          <View style={styles.routeMetrics}>
            <View style={styles.metricItem}>
              <MaterialIcons name="directions-walk" size={16} color="#FFFFFF" />
              <Text style={styles.metricText}>{(estimatedDistance / 1000).toFixed(1)} km</Text>
            </View>
            
            <View style={styles.metricDivider} />
            
            <View style={styles.metricItem}>
              <MaterialIcons name="access-time" size={16} color="#FFFFFF" />
              <Text style={styles.metricText}>{Math.round(estimatedTime / 60)} min</Text>
            </View>
          </View>
        )}
      </View>
    )}
    
    {/* Direction steps */}
    <ScrollView
      style={styles.directionsScrollview}
      contentContainerStyle={styles.directionsScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {steps.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <MaterialIcons name="map" size={80} color="#B0BEC5" />
          <Text style={styles.emptyStateText}>Enter a destination to start navigation</Text>
        </View>
      ) : (
        steps.map((step, index) => (
          <DirectionCard
            key={index}
            instruction={step.instruction}
            distance={index === currentInstructionIndex && distanceToNext ? distanceToNext : undefined}
            isActive={index === currentInstructionIndex}
            isUpcoming={index === upcomingInstructionIndex}
            index={index}
          />
        ))
      )}
    </ScrollView>
  </View>
);

export default function ORSWalkingNavigation() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [destination, setDestination] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [routeCoords, setRouteCoords] = useState<Coords[]>([]);
  const [remainingCoords, setRemainingCoords] = useState<Coords[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(null);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [showAllDirections, setShowAllDirections] = useState(false);
  const [startNavigation, setStartNavigation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // State for upcoming instruction and distance to next waypoint
  const [upcomingInstruction, setUpcomingInstruction] = useState<string | null>(null);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
  const [reachedWaypoint, setReachedWaypoint] = useState(false);
  const [upcomingInstructionIndex, setUpcomingInstructionIndex] = useState<number | null>(null);
  
  // Add a ref to track the last displayed direction
  const [lastDisplayedDirectionIndex, setLastDisplayedDirectionIndex] = useState<number>(-1);

  // Safely access location API
  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        Alert.alert('Permission denied', 'Location access is needed.');
        return;
      }
      
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      // Log once location is received
      console.log(`\nCurrent location: ${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
    } catch (error) {
      console.error("Location error:", error);
      setErrorMsg('Error accessing location services');
      Alert.alert('Location Error', 'Failed to access location services. Please try again.');
    }
  };

  useEffect(() => {
    // Call getLocation on component mount
    getLocation();
    
    // Extra terminal message to ensure logging is working
    console.log('App ready for navigation. Enter a destination to start.');
  }, []);

  useEffect(() => {
    let watch: Promise<LocationSubscription> | null = null;
    if (routeCoords.length > 0) {
      try {
        watch = Location.watchPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        }, (newLoc: LocationObject) => {
          const { latitude, longitude } = newLoc.coords;
          const currentLoc = { latitude, longitude };
          setLocation(currentLoc);
          updateRouteProgress(currentLoc);
        });
        
        // Log when location watching starts
        console.log('\nLocation tracking active - directions will update as you move');
      } catch (error) {
        console.error("Watch position error:", error);
        Alert.alert("Location Error", "Failed to track location. Please try again.");
      }
    }
    return () => {
      if (watch) {
        try {
          watch.then(subscription => subscription.remove()).catch(err => {
            console.error("Error removing location subscription:", err);
          });
        } catch (error) {
          console.error("Error removing location subscription:", error);
        }
      }
    };
  }, [routeCoords, steps, currentInstructionIndex]);

  // Update useEffect for steps to display the first direction
  useEffect(() => {
    if (steps.length > 0) {
      setCurrentInstruction(steps[0].instruction);
      
      // Display the first direction in the terminal when route is loaded
      if (lastDisplayedDirectionIndex !== 0) {
        console.log('\n=========== NAVIGATION STARTED ===========');
        console.log(`STEP 1 of ${steps.length}: ${steps[0].instruction}`);
        setLastDisplayedDirectionIndex(0);
      }
    }
  }, [steps]);

  // Add effect to display directions in terminal as they change
  useEffect(() => {
    if (steps.length > 0 && currentInstructionIndex !== lastDisplayedDirectionIndex) {
      // Log the current direction to the terminal when it changes
      console.log(`\nSTEP ${currentInstructionIndex + 1} of ${steps.length}: ${steps[currentInstructionIndex].instruction}`);
      
      // Update the last displayed direction index
      setLastDisplayedDirectionIndex(currentInstructionIndex);
      
      // When we reach the destination
      if (currentInstructionIndex === steps.length - 1) {
        console.log('\n=========== DESTINATION REACHED ===========');
      }
    }
  }, [currentInstructionIndex, steps, lastDisplayedDirectionIndex]);

  const getDistance = (coord1: Coords, coord2: Coords): number => {
    const toRad = (x: number): number => (x * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const updateRouteProgress = (currentLoc: Coords): void => {
    if (!steps.length || !routeCoords.length) return;

    const currentStep = steps[currentInstructionIndex];
    if (!currentStep) return;

    // Current waypoint target
    const targetIndex = currentStep.way_points[1];
    const targetCoord = routeCoords[targetIndex] ?? { latitude: 0, longitude: 0 };

    // Calculate distance to current waypoint target
    const dist = getDistance(currentLoc, targetCoord);
    setDistanceToNext(dist);

    // Prepare for next instruction when approaching a waypoint (within 50 meters)
    if (dist < 50 && dist > 15 && currentInstructionIndex < steps.length - 1) {
      setUpcomingInstructionIndex(currentInstructionIndex + 1);
      // Show upcoming instruction
      const nextInstruction = steps[currentInstructionIndex + 1].instruction;
      setUpcomingInstruction(`Coming up: ${nextInstruction}`);
      
      // Log upcoming instruction to terminal
      if (dist < 30 && lastDisplayedDirectionIndex === currentInstructionIndex) {
        console.log(`[Approaching: ${nextInstruction}]`);
      }
      
      // Visual indication that we're approaching the waypoint
      if (!reachedWaypoint) {
        setReachedWaypoint(true);
      }
    } else if (dist >= 50) {
      // Reset when we're far from the waypoint
      setUpcomingInstruction(null);
      setUpcomingInstructionIndex(null);
      setReachedWaypoint(false);
    }

    // When reached waypoint (within 15 meters)
    if (dist < 15) {
      // Automatically advance to next instruction
      if (currentInstructionIndex < steps.length - 1) {
        setCurrentInstructionIndex(currentInstructionIndex + 1);
        setCurrentInstruction(steps[currentInstructionIndex + 1].instruction);
        setUpcomingInstruction(null);
        setUpcomingInstructionIndex(null);
        setReachedWaypoint(false);
      } else {
        // Reached the final destination
        setCurrentInstruction("You made it to your destination! 🎉");
        setUpcomingInstruction(null);
        setUpcomingInstructionIndex(null);
      }
    }

    // Update the remaining route coords to show progress
    const remaining = remainingCoords.filter(coord => getDistance(coord, currentLoc) > 10);
    setRemainingCoords(remaining);
  };

  const fetchRouteORS = async () => {
    if (!destination.trim()) {
      Alert.alert('Please enter a destination');
      return;
    }

    console.log(`\nSearching for route to: ${destination}`);

    try {
      const geo = await Location.geocodeAsync(destination);
      if (!geo.length || !location) {
        Alert.alert('Destination not found or location unavailable');
        console.log('Destination not found or location unavailable');
        return;
      }

      const destCoords = {
        latitude: geo[0].latitude,
        longitude: geo[0].longitude,
      };

      console.log(`Destination coordinates: ${destCoords.latitude.toFixed(6)}, ${destCoords.longitude.toFixed(6)}`);
      setDestinationCoords(destCoords);

      setRegion({
        latitude: (location.latitude + destCoords.latitude) / 2,
        longitude: (location.longitude + destCoords.longitude) / 2,
        latitudeDelta: Math.abs(location.latitude - destCoords.latitude) * 1.5,
        longitudeDelta: Math.abs(location.longitude - destCoords.longitude) * 1.5,
      });

      try {
        console.log('Fetching route information...');
        const url = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
        const res = await fetch(
          url,
          {
            method: 'POST',
            headers: {
              'Authorization': ORS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              coordinates: [
                [location.longitude, location.latitude],
                [destCoords.longitude, destCoords.latitude]
              ]
            })
          }
        );
        
        if (!res.ok) {
          throw new Error(`Route API error: ${res.status}`);
        }
        
        const data = await res.json();
        const geometry = data.features[0].geometry.coordinates;
        const coords = geometry.map(([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon }));
        setRouteCoords(coords);
        setRemainingCoords(coords);

        const instructions = data.features[0].properties.segments[0].steps;
        console.log(`Found route with ${instructions.length} steps`);
        
        setSteps(instructions);
        setCurrentInstructionIndex(0);
        setCurrentInstruction(instructions[0].instruction);

        const totalDistance = geometry.reduce((acc: number, [lon1, lat1]: [number, number], index: number) => {
          if (index === geometry.length - 1) return acc;
          const [lon2, lat2] = geometry[index + 1];
          return acc + getDistance({ latitude: lat1, longitude: lon1 }, { latitude: lat2, longitude: lon2 });
        }, 0);

        const distanceInKm = totalDistance / 1000;
        setEstimatedDistance(distanceInKm);
        
        const estimatedTimeInHours = distanceInKm / 5;
        const estimatedTimeInMinutes = Math.round(estimatedTimeInHours * 60);
        setEstimatedTime(estimatedTimeInMinutes);
        
        console.log(`Route details: ${estimatedTimeInMinutes} min, ${distanceInKm.toFixed(2)} km`);
        
        // Automatically start navigation when route is loaded
        setStartNavigation(true);
      } catch (error) {
        console.error('Route API error:', error);
        console.log('Failed to fetch walking route. Please try again.');
        Alert.alert('Error', 'Failed to fetch walking route. Please try again.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      console.log('Failed to find the destination. Please try a different location.');
      Alert.alert('Error', 'Failed to find the destination. Please try a different location.');
    }
  };

  // Also add terminal output for manual navigation actions
  const manuallyNavigateNext = () => {
    if (currentInstructionIndex < steps.length - 1) {
      console.log('\n[User navigated to next step]');
      setCurrentInstructionIndex(prev => prev + 1);
      setCurrentInstruction(steps[currentInstructionIndex + 1].instruction);
      // Terminal output is handled by the useEffect
    }
  };

  const manuallyNavigatePrevious = () => {
    if (currentInstructionIndex > 0) {
      console.log('\n[User navigated to previous step]');
      setCurrentInstructionIndex(prev => prev - 1);
      setCurrentInstruction(steps[currentInstructionIndex - 1].instruction);
      // Terminal output is handled by the useEffect
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Maps"
        showPath={true}
        pathPrefix="Home" 
        iconColor={COLORS.primary}
        textColor={COLORS.text}
      />
      {/* Main directions UI */}
      <DirectionsUI 
        location={location}
        destinationName={destination}
        destinationCoords={destinationCoords}
        steps={steps}
        currentInstructionIndex={currentInstructionIndex}
        upcomingInstructionIndex={upcomingInstructionIndex}
        distanceToNext={distanceToNext}
        estimatedTime={estimatedTime}
        estimatedDistance={estimatedDistance}
      />

      {/* Bottom controls */}
      <View style={styles.controls}>
        {!startNavigation ? (
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Where do you want to go?"
              value={destination}
              onChangeText={setDestination}
              style={styles.input}
              placeholderTextColor="#8E98A2"
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={fetchRouteORS}
            >
              <MaterialIcons name="search" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.navigationControls}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => {
                manuallyNavigatePrevious();
              }}
              disabled={currentInstructionIndex === 0}
            >
              <MaterialIcons name="keyboard-arrow-left" size={28} color={currentInstructionIndex === 0 ? "#A0A0A0" : "#FFF"} />
            </TouchableOpacity>
            
            <View style={styles.currentStepCounter}>
              <Text style={styles.stepCounterText}>
                Step {currentInstructionIndex + 1} of {steps.length}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => {
                manuallyNavigateNext();
              }}
              disabled={currentInstructionIndex === steps.length - 1}
            >
              <MaterialIcons name="keyboard-arrow-right" size={28} color={currentInstructionIndex === steps.length - 1 ? "#A0A0A0" : "#FFF"} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Exit button during navigation */}
        {startNavigation && (
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => {
              console.log('\n=========== NAVIGATION ENDED ===========');
              setStartNavigation(false);
              setCurrentInstructionIndex(0);
              // Reset other navigation-related state if needed
            }}
          >
            <MaterialIcons name="close" size={20} color="#FFF" />
            <Text style={styles.exitButtonText}>End Navigation</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Styles for the beautiful new design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1',
  },
  directionsContainer: {
    flex: 1,
    paddingBottom: 70, // Add space for the bottom controls
  },
  headerContainer: {
    height: 140,
    width: '100%',
    overflow: 'hidden',
  },
  headerBackground: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  routeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 5,
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  directionsScrollview: {
    flex: 1,
  },
  directionsScrollContent: {
    paddingTop: 5,
    paddingBottom: 100,
  },
  directionCard: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  activeDirectionCard: {
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#4285F4',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  upcomingDirectionCard: {
    backgroundColor: '#FFFAF0',
    borderWidth: 1,
    borderColor: '#FFA726',
  },
  directionIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    height: '100%',
    position: 'relative',
  },
  directionIconBackground: {
    backgroundColor: '#F1F3F5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeIconBackground: {
    backgroundColor: '#4285F4',
  },
  connectorLine: {
    position: 'absolute',
    top: -20,
    width: 2,
    height: 40,
    backgroundColor: '#DDE3E9',
    zIndex: -1,
  },
  directionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  directionText: {
    fontSize: 16,
    color: '#37474F',
    marginBottom: 5,
  },
  activeDirectionText: {
    fontWeight: 'bold',
    color: '#1A73E8',
  },
  distanceText: {
    fontSize: 14,
    color: '#5F6B73',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  noDirectionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  noDirectionsText: {
    fontSize: 16,
    color: '#5F6B73',
    textAlign: 'center',
    marginTop: 15,
  },
  scrollPadding: {
    height: 50,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F7F9',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#37474F',
    borderWidth: 1,
    borderColor: '#DDE3E9',
  },
  searchButton: {
    backgroundColor: '#344955',
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#344955',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStepCounter: {
    flex: 1,
    alignItems: 'center',
  },
  stepCounterText: {
    fontSize: 15,
    color: '#37474F',
    fontWeight: '500',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    height: 45,
    borderRadius: 10,
    marginTop: 15,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#5F6B73',
    textAlign: 'center',
    marginTop: 15,
  },
});