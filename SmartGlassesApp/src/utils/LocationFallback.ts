// LocationFallback.ts - Fallback implementation for expo-location
// This provides a mock implementation if the native module fails to load

// Define interfaces for typing
export interface LocationObject {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface LocationSubscription {
  remove: () => void;
}

export interface LocationPermissionResponse {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
  expires?: 'never' | number;
}

export interface LocationOptions {
  accuracy?: number;
  timeInterval?: number;
  distanceInterval?: number;
}

// Default mock implementation
const mockLocation = {
  requestForegroundPermissionsAsync: async (): Promise<LocationPermissionResponse> => ({ status: 'granted' }),
  getCurrentPositionAsync: async (): Promise<LocationObject> => ({
    coords: {
      latitude: 42.6977,  // Default location 
      longitude: 23.3219, // Sofia, Bulgaria
      altitude: 0,
      accuracy: 5,
      altitudeAccuracy: 5,
      heading: 0,
      speed: 0
    },
    timestamp: Date.now()
  }),
  watchPositionAsync: async (options: LocationOptions, callback: (location: LocationObject) => void): Promise<LocationSubscription> => {
    // Return a mock subscription that does nothing
    return Promise.resolve({
      remove: () => {}
    });
  },
  geocodeAsync: async (address: string) => {
    // Default mock implementation for geocoding
    // Returns Sofia, Bulgaria with a slight offset from the default position
    // to simulate a destination
    return [
      {
        latitude: 42.7000,  // Slightly offset from default
        longitude: 23.3300, // to simulate a different location
        altitude: 0,
        accuracy: 5
      }
    ];
  },
  // Add other necessary methods as needed
  Accuracy: {
    Balanced: 3,
    High: 4,
    Highest: 5,
    Low: 1,
    Lowest: 0
  }
};

// Try to import the real module, fall back to mock if it fails
let Location: any;
try {
  Location = require('expo-location');
  // Test if the module is properly loaded
  Location.getCurrentPositionAsync({}).catch(() => {
    console.warn('Using Location mock implementation due to native module error');
    Location = mockLocation;
  });
} catch (error) {
  console.warn('Failed to load expo-location, using mock implementation');
  Location = mockLocation;
}

export default Location; 