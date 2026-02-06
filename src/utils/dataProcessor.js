// Utility functions for data processing

// Calculate statistics for a parameter across all locations
export const calculateStatistics = (data, parameter) => {
  const values = Object.values(data)
    .map(locationData => locationData[parameter])
    .filter(val => val !== null && val !== undefined && val !== 0);

  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  return { min, max, avg, median };
};

// Get pollution category distribution
export const getCategoryDistribution = (data) => {
  const distribution = {
    Baik: 0,
    Sedang: 0,
    Buruk: 0
  };

  Object.values(data).forEach(locationData => {
    const kategori = locationData.Kategori || 'Baik';
    if (distribution[kategori] !== undefined) {
      distribution[kategori]++;
    }
  });

  return distribution;
};

// Calculate pollution index based on parameters
export const calculatePollutionIndex = (params) => {
  const { Ammonia, BOD, COD, DO, Nitrat, pH, TDS, TSS } = params;
  
  let score = 0;
  
  // Ammonia scoring
  if (Ammonia > 1.5) score += 3;
  else if (Ammonia > 0.5) score += 1.5;
  else score += Ammonia;
  
  // BOD scoring
  if (BOD > 6) score += 3;
  else if (BOD > 2) score += 1.5;
  else score += BOD / 2;
  
  // COD scoring
  if (COD > 25) score += 3;
  else if (COD > 10) score += 1.5;
  else score += COD / 10;
  
  // DO scoring (inverse)
  if (DO < 4) score += 3;
  else if (DO < 6) score += 1.5;
  else score += Math.max(0, (8 - DO) / 2);
  
  // Nitrat scoring
  if (Nitrat > 20) score += 3;
  else if (Nitrat > 10) score += 1.5;
  else score += Nitrat / 10;
  
  // pH scoring
  if (pH < 6.0 || pH > 9.0) score += 3;
  else if (pH < 6.5 || pH > 8.5) score += 1.5;
  else score += Math.abs(7.5 - pH) / 2;
  
  // TDS scoring
  if (TDS > 1000) score += 3;
  else if (TDS > 500) score += 1.5;
  else score += TDS / 500;
  
  // TSS scoring
  if (TSS > 50) score += 3;
  else if (TSS > 25) score += 1.5;
  else score += TSS / 25;
  
  return score / 8;
};

// Determine category from pollution index
export const getCategoryFromIndex = (index) => {
  if (index <= 1.0) return 'Baik';
  if (index <= 5.0) return 'Sedang';
  return 'Buruk';
};

// Format number with locale
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return value.toFixed(decimals);
};

// Format date for display
export const formatDateDisplay = (dateString) => {
  try {
    const [month, day, year] = dateString.split('/');
    const date = new Date(year, month - 1, day);
    
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('id-ID', options);
  } catch (error) {
    return dateString;
  }
};

// Get color for pollution index
export const getIndexColor = (index) => {
  if (index <= 1.0) return '#22c55e'; // green
  if (index <= 5.0) return '#eab308'; // yellow
  return '#ef4444'; // red
};

// Get text color for category
export const getCategoryTextColor = (kategori) => {
  switch (kategori) {
    case 'Baik':
      return 'text-green-600';
    case 'Sedang':
      return 'text-yellow-600';
    case 'Buruk':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

// Get background color for category
export const getCategoryBgColor = (kategori) => {
  switch (kategori) {
    case 'Baik':
      return 'bg-green-50';
    case 'Sedang':
      return 'bg-yellow-50';
    case 'Buruk':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
};

// Get border color for category
export const getCategoryBorderColor = (kategori) => {
  switch (kategori) {
    case 'Baik':
      return 'border-green-200';
    case 'Sedang':
      return 'border-yellow-200';
    case 'Buruk':
      return 'border-red-200';
    default:
      return 'border-gray-200';
  }
};

// Export summary data for download
export const exportSummaryData = (data, filename = 'summary.json') => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Calculate trend (increasing, decreasing, stable)
export const calculateTrend = (values) => {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  const threshold = firstAvg * 0.1; // 10% threshold
  
  if (difference > threshold) return 'increasing';
  if (difference < -threshold) return 'decreasing';
  return 'stable';
};

// Validate data completeness
export const validateDataCompleteness = (data) => {
  const requiredParams = ['Ammonia', 'BOD', 'COD', 'DO', 'Nitrat', 'pH', 'TDS', 'TSS'];
  const locations = Object.keys(data);
  
  const completeness = {};
  
  locations.forEach(location => {
    const locationData = data[location];
    let validCount = 0;
    
    requiredParams.forEach(param => {
      if (locationData[param] && locationData[param] !== 0) {
        validCount++;
      }
    });
    
    completeness[location] = {
      percentage: (validCount / requiredParams.length) * 100,
      missingParams: requiredParams.filter(param => !locationData[param] || locationData[param] === 0)
    };
  });
  
  return completeness;
};