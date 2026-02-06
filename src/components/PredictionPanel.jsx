import { useState } from 'react';
import { predictNextMonth } from '../utils/svmPredictor';

const PredictionPanel = ({ historicalData, onPredictionComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictionStatus, setPredictionStatus] = useState('');

  const handlePredict = async () => {
    setIsLoading(true);
    setError('');
    setPredictionStatus('Memulai analisis data historis...');

    try {
      const predictions = {};
      const locations = Object.keys(historicalData);

      console.log('Starting predictions for locations:', locations);

      // Predict for each location
      for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        setPredictionStatus(`Menganalisis ${location}... (${i + 1}/${locations.length})`);
        
        console.log(`Predicting for ${location}...`);
        const locationPredictions = await predictNextMonth(historicalData, location);
        predictions[location] = locationPredictions;
        
        console.log(`Completed prediction for ${location}:`, locationPredictions.length, 'days');
        
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log('All predictions completed:', Object.keys(predictions));
      setPredictionStatus('Prediksi selesai! Klik tab "Prediksi Januari 2026" untuk melihat hasil.');
      onPredictionComplete(predictions);
      
      setTimeout(() => {
        setPredictionStatus('');
      }, 3000);

    } catch (err) {
      console.error('Prediction error:', err);
      setError(`Error saat prediksi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Prediksi Kualitas Air
          </h3>
          <p className="text-sm text-gray-600">
            Menggunakan metode Support Vector Machine (SVM) untuk memprediksi kondisi kualitas air 
            di 8 titik Danau Toba
          </p>
        </div>
        <div className="ml-4">
          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-800 mb-1">Cara Kerja Prediksi:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Menganalisis trend dari data historis Anda (30-90 hari terakhir)</li>
              <li>Memprediksi nilai 8 parameter: Ammonia, BOD, COD, DO, Nitrat, pH, TDS, TSS</li>
              <li>Menghitung Indeks Pencemaran dari parameter yang diprediksi</li>
              <li>Mengklasifikasikan hasil: Baik, Sedang, atau Buruk</li>
              <li>Mempertimbangkan faktor musiman (seasonal adjustment)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Prediction Button */}
      <button
        onClick={handlePredict}
        disabled={isLoading || !historicalData || Object.keys(historicalData).length === 0}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
          isLoading || !historicalData || Object.keys(historicalData).length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses Prediksi...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Mulai Prediksi 
          </div>
        )}
      </button>

      {/* Status Message */}
      {predictionStatus && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-700 font-medium">{predictionStatus}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Note */}
      {!historicalData || Object.keys(historicalData).length === 0 ? (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-700 text-sm">
              Silakan upload file Excel terlebih dahulu untuk melakukan prediksi.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PredictionPanel;