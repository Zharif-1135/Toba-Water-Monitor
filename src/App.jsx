import { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import TimelineSlider from './components/TimelineSlider';
import PredictionPanel from './components/PredictionPanel';
import ExportData from './components/ExportData';
import StatisticsPanel from './components/StatisticsPanel';
import DebugPanel from './components/DebugPanel';
import { getDataByDate, getAllDates } from './utils/excelParser';

function App() {
  const [historicalData, setHistoricalData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentData, setCurrentData] = useState({});
  const [viewMode, setViewMode] = useState('historical'); // 'historical' or 'prediction'
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Handle Excel data loaded
  const handleDataLoaded = useCallback((parsedData) => {
    setHistoricalData(parsedData);
    
    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      window.historicalData = parsedData;
    }
    
    const dates = getAllDates(parsedData);
    setAvailableDates(dates);
    
    if (dates.length > 0) {
      setCurrentDateIndex(0);
      setSelectedDate(dates[0]);
      const dataForDate = getDataByDate(parsedData, dates[0]);
      setCurrentData(dataForDate);
    }
    
    // Set first location as selected
    const locations = Object.keys(parsedData);
    if (locations.length > 0) {
      setSelectedLocation(locations[0]);
    }
    
    setViewMode('historical');
    setPredictionData(null);
  }, []);

  // Handle date change from timeline slider
  const handleDateChange = useCallback((newIndex) => {
    if (viewMode === 'historical' && availableDates.length > 0) {
      const dates = availableDates;
      const date = dates[newIndex];
      setCurrentDateIndex(newIndex);
      setSelectedDate(date);
      const dataForDate = getDataByDate(historicalData, date);
      setCurrentData(dataForDate);
    } else if (viewMode === 'prediction' && predictionData) {
      const locations = Object.keys(predictionData);
      if (locations.length > 0) {
        const firstLocation = locations[0];
        const predictions = predictionData[firstLocation];
        
        if (predictions && predictions.length > newIndex) {
          const date = predictions[newIndex].dateString;
          setCurrentDateIndex(newIndex);
          setSelectedDate(date);
          
          // Get data for all locations at this date
          const dataForDate = {};
          locations.forEach(location => {
            dataForDate[location] = predictionData[location][newIndex];
          });
          setCurrentData(dataForDate);
        }
      }
    }
  }, [viewMode, availableDates, historicalData, predictionData]);

  // Handle prediction complete
  const handlePredictionComplete = useCallback((predictions) => {
    setPredictionData(predictions);
    
    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      window.predictionData = predictions;
    }
    
    setViewMode('prediction');
    
    // Get dates from first location's predictions
    const firstLocation = Object.keys(predictions)[0];
    const predictionDates = predictions[firstLocation].map(p => p.dateString);
    
    setAvailableDates(predictionDates);
    setCurrentDateIndex(0);
    setSelectedDate(predictionDates[0]);
    
    // Set initial data
    const initialData = {};
    Object.keys(predictions).forEach(location => {
      initialData[location] = predictions[location][0];
    });
    setCurrentData(initialData);
  }, []);

  // Switch between historical and prediction view
  const switchToHistorical = useCallback(() => {
    if (historicalData) {
      setViewMode('historical');
      const dates = getAllDates(historicalData);
      setAvailableDates(dates);
      setCurrentDateIndex(0);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        const dataForDate = getDataByDate(historicalData, dates[0]);
        setCurrentData(dataForDate);
      }
    }
  }, [historicalData]);

  const switchToPrediction = useCallback(() => {
    if (predictionData) {
      setViewMode('prediction');
      const firstLocation = Object.keys(predictionData)[0];
      const predictionDates = predictionData[firstLocation].map(p => p.dateString);
      setAvailableDates(predictionDates);
      setCurrentDateIndex(0);
      setSelectedDate(predictionDates[0]);
      
      const initialData = {};
      Object.keys(predictionData).forEach(location => {
        initialData[location] = predictionData[location][0];
      });
      setCurrentData(initialData);
    }
  }, [predictionData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Sistem Monitoring Kualitas Air Danau Toba
              </h1>
              <p className="text-blue-100">
                Visualisasi dan Prediksi Indeks Pencemaran Air
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.5 2a3.5 3.5 0 101.665 6.58L8.585 10l-1.42 1.42a3.5 3.5 0 101.414 1.414l8.128-8.127a1 1 0 00-1.414-1.414L10 8.586 8.58 7.165A3.5 3.5 0 005.5 2zM4 5.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
                <path d="M12.828 11.414a1 1 0 00-1.414 1.414l3.879 3.88a1 1 0 001.414-1.415l-3.879-3.879z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* File Upload */}
        <FileUpload onDataLoaded={handleDataLoaded} />

        {historicalData && (
          <>
            {/* View Mode Toggle */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow">
                <button
                  onClick={switchToHistorical}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'historical'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Data Historis
                </button>
                <button
                  onClick={switchToPrediction}
                  disabled={!predictionData}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'prediction'
                      ? 'bg-blue-600 text-white shadow'
                      : predictionData
                      ? 'text-gray-600 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Prediksi
                </button>
              </div>
            </div>

            {/* Timeline Slider */}
            {availableDates.length > 0 && (
              <TimelineSlider
                dates={availableDates}
                currentIndex={currentDateIndex}
                onDateChange={handleDateChange}
                isPrediction={viewMode === 'prediction'}
              />
            )}

            {/* Map View */}
            {Object.keys(currentData).length > 0 && (
              <div className="mb-6">
                <MapView
                  currentData={currentData}
                  selectedDate={selectedDate}
                  isPrediction={viewMode === 'prediction'}
                />
              </div>
            )}

            {/* Dashboard */}
            {Object.keys(currentData).length > 0 && (
              <Dashboard
                currentData={currentData}
                selectedDate={selectedDate}
                historicalData={historicalData}
                predictionData={predictionData}
                viewMode={viewMode}
              />
            )}

            {/* Statistics Panel */}
            {historicalData && (
              <StatisticsPanel
                historicalData={historicalData}
                predictionData={viewMode === 'prediction' ? predictionData : null}
                currentLocation={selectedLocation}
              />
            )}

            {/* Prediction Panel - Only show in historical mode */}
            {viewMode === 'historical' && (
              <div className="mt-6">
                <PredictionPanel
                  historicalData={historicalData}
                  onPredictionComplete={handlePredictionComplete}
                />
              </div>
            )}

            {/* Export Data Component */}
            <div className="mt-6">
              <ExportData
                currentData={currentData}
                allData={viewMode === 'historical' ? historicalData : predictionData}
                selectedDate={selectedDate}
                viewMode={viewMode}
              />
            </div>
          </>
        )}

        {/* Empty State */}
        {!historicalData && (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Belum Ada Data
            </h3>
            <p className="text-gray-500">
              Silakan upload file Excel untuk memulai visualisasi dan analisis data
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-gray-400">
              © 2026 Sistem Monitoring Danau Toba | Menggunakan Support Vector Machine untuk Prediksi
            </p>
          </div>
        </div>
      </footer>

      {/* Debug Panel - Floating Button */}
      <DebugPanel 
        historicalData={historicalData} 
        predictionData={predictionData} 
      />
    </div>
  );
}

export default App;