import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { getLocationCoordinates, danauTobaCenter } from '../data/Locations';

// Component untuk update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

const MapView = ({ currentData, selectedDate, isPrediction = false }) => {
  // Determine color based on pollution category
  const getMarkerColor = (kategori) => {
    switch (kategori) {
      case 'Baik':
        return '#22c55e'; // Green
      case 'Sedang':
        return '#eab308'; // Yellow
      case 'Buruk':
        return '#ef4444'; // Red
      default:
        return '#9ca3af'; // Gray
    }
  };

  // Get marker size based on pollution index
  const getMarkerSize = (indeksPencemaran) => {
    if (indeksPencemaran <= 1.0) return 15;
    if (indeksPencemaran <= 5.0) return 20;
    return 25;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
        <h2 className="text-2xl font-bold">
          Peta Kualitas Air Danau Toba
        </h2>
        <p className="text-blue-100 mt-1">
          {isPrediction ? 'Prediksi ' : ''}Tanggal: {selectedDate || 'Belum ada data'}
        </p>
      </div>

      <div className="relative" style={{ height: '500px' }}>
        <MapContainer
          center={[danauTobaCenter.lat, danauTobaCenter.lng]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapUpdater 
            center={[danauTobaCenter.lat, danauTobaCenter.lng]} 
            zoom={11} 
          />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {Object.keys(currentData).map(locationName => {
            const location = getLocationCoordinates(locationName);
            const data = currentData[locationName];

            if (!data) return null;

            const color = getMarkerColor(data.Kategori);
            const radius = getMarkerSize(data.IndeksPencemaran || 0);

            return (
              <CircleMarker
                key={locationName}
                center={[location.lat, location.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.8,
                  color: '#fff',
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg mb-2 text-gray-800">
                      {locationName}
                    </h3>
                    
                    <div className="mb-2">
                      <span className="font-semibold">Status: </span>
                      <span 
                        className={`font-bold ${
                          data.Kategori === 'Baik' ? 'text-green-600' :
                          data.Kategori === 'Sedang' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}
                      >
                        {data.Kategori}
                      </span>
                    </div>

                    <div className="text-sm space-y-1 text-gray-700">
                      <div className="flex justify-between">
                        <span>Indeks Pencemaran:</span>
                        <span className="font-medium">
                          {data.IndeksPencemaran?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ammonia:</span>
                        <span className="font-medium">
                          {data.Ammonia?.toFixed(2) || '0.00'} mg/L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>BOD:</span>
                        <span className="font-medium">
                          {data.BOD?.toFixed(2) || '0.00'} mg/L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>COD:</span>
                        <span className="font-medium">
                          {data.COD?.toFixed(2) || '0.00'} mg/L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>DO:</span>
                        <span className="font-medium">
                          {data.DO?.toFixed(2) || '0.00'} mg/L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>pH:</span>
                        <span className="font-medium">
                          {data.pH?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>

                    {isPrediction && data.confidence && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-600">
                          Confidence: {(data.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Legenda:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-700">Baik (IP ≤ 1.0)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm text-gray-700">Sedang (1.0 &lt; IP ≤ 5.0)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-700">Buruk (IP &gt; 5.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;