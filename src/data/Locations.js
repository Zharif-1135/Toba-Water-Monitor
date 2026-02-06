// Koordinat 8 titik sampling di Danau Toba
// Ini adalah default locations, tapi aplikasi akan otomatis membaca semua sheet yang ada
export const samplingLocations = {
  'KLHK11': { lat: 2.6502, lng: 98.8756, name: 'KLHK11' },
  'KLHK 11': { lat: 2.6502, lng: 98.8756, name: 'KLHK 11' },
  'KLHK13': { lat: 2.6234, lng: 98.9012, name: 'KLHK13' },
  'KLHK 13': { lat: 2.6234, lng: 98.9012, name: 'KLHK 13' },
  'KLHK74': { lat: 2.6891, lng: 98.8534, name: 'KLHK74' },
  'KLHK 74': { lat: 2.6891, lng: 98.8534, name: 'KLHK 74' },
  'KLHK75': { lat: 2.6423, lng: 98.7891, name: 'KLHK75' },
  'KLHK 75': { lat: 2.6423, lng: 98.7891, name: 'KLHK 75' },
  'KLHK76': { lat: 2.7156, lng: 98.8123, name: 'KLHK76' },
  'KLHK 76': { lat: 2.7156, lng: 98.8123, name: 'KLHK 76' },
  'KLHK229': { lat: 2.6789, lng: 98.9234, name: 'KLHK229' },
  'KLHK 229': { lat: 2.6789, lng: 98.9234, name: 'KLHK 229' },
  'KLHK230': { lat: 2.5987, lng: 98.8678, name: 'KLHK230' },
  'KLHK 230': { lat: 2.5987, lng: 98.8678, name: 'KLHK 230' },
  'SAMOSIR-1': { lat: 2.6645, lng: 98.8543, name: 'SAMOSIR-1' },
  'Samosir-1': { lat: 2.6645, lng: 98.8543, name: 'Samosir-1' },
  'Samosir': { lat: 2.6645, lng: 98.8543, name: 'Samosir' }
};

export const danauTobaCenter = { lat: 2.6845, lng: 98.8756 };

// Function to get location coordinates with fallback
export const getLocationCoordinates = (locationName) => {
  // Normalize location name (remove spaces, uppercase)
  const normalizedName = locationName.replace(/\s+/g, '').toUpperCase();
  
  // Try direct match first
  if (samplingLocations[locationName]) {
    return samplingLocations[locationName];
  }
  
  // Try normalized match
  const found = Object.entries(samplingLocations).find(([key]) => 
    key.replace(/\s+/g, '').toUpperCase() === normalizedName
  );
  
  if (found) {
    return found[1];
  }
  
  // Fallback: create default location near center
  console.warn(`Location "${locationName}" not found in predefined locations. Using default coordinates.`);
  return {
    lat: danauTobaCenter.lat + (Math.random() - 0.5) * 0.1,
    lng: danauTobaCenter.lng + (Math.random() - 0.5) * 0.1,
    name: locationName
  };
};

export const locationsList = Object.keys(samplingLocations);