import { useState, useEffect } from 'react';

const TimelineSlider = ({ dates, currentIndex, onDateChange, isPrediction }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval;
    
    if (isPlaying && dates.length > 0) {
      interval = setInterval(() => {
        onDateChange((prevIndex) => {
          if (prevIndex >= dates.length - 1) {
            setIsPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, dates.length, onDateChange]);

  const handleSliderChange = (e) => {
    const newIndex = parseInt(e.target.value);
    onDateChange(newIndex);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onDateChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < dates.length - 1) {
      onDateChange(currentIndex + 1);
    }
  };

  if (!dates || dates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {isPrediction ? 'Timeline Prediksi' : 'Timeline Data Historis'}
        </h3>
        <div className="text-sm text-gray-600">
          {currentIndex + 1} / {dates.length}
        </div>
      </div>

      {/* Current Date Display */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-blue-600">
          {dates[currentIndex]}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {isPrediction ? 'Tanggal Prediksi' : 'Tanggal Pengukuran'}
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={dates.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentIndex / (dates.length - 1)) * 100}%, #e5e7eb ${(currentIndex / (dates.length - 1)) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={handlePlayPause}
          className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === dates.length - 1}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Date Range Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Awal: {dates[0]}</span>
          <span>Akhir: {dates[dates.length - 1]}</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;