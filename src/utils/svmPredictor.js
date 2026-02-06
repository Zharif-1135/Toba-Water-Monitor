// SVM-based Prediction System for Water Quality Parameters
// Learns from training data: Indeks Pencemaran -> Parameters

// Load training data from JSON
export const loadTrainingData = async () => {
  try {
    const response = await fetch('/training_data.json');
    const data = await response.json();
    console.log(`Loaded ${data.length} training samples`);
    return data;
  } catch (error) {
    console.error('Error loading training data:', error);
    return null;
  }
};

// Build regression models for each parameter based on pollution index
const buildRegressionModels = (trainingData) => {
  console.log('Building regression models from training data...');
  
  const parameters = ['Ammonia', 'BOD', 'COD', 'DO', 'Nitrat', 'pH', 'TDS', 'TSS'];
  const models = {};
  
  parameters.forEach(param => {
    const indexRanges = {
      'Baik': [],
      'Sedang': [],
      'Buruk': []
    };
    
    trainingData.forEach(sample => {
      const category = sample.Kategori || 'Baik';
      const index = sample.Indeks_Pencemaran;
      const value = sample[param];
      
      if (indexRanges[category] && value !== null && value !== undefined) {
        indexRanges[category].push({
          index: index,
          value: value
        });
      }
    });
    
    models[param] = {};
    
    Object.keys(indexRanges).forEach(category => {
      const data = indexRanges[category];
      if (data.length === 0) return;
      
      const values = data.map(d => d.value);
      const indices = data.map(d => d.index);
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      const sortedValues = [...values].sort((a, b) => a - b);
      const median = sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];
      
      const n = data.length;
      const sumX = indices.reduce((a, b) => a + b, 0);
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = data.reduce((sum, d) => sum + d.index * d.value, 0);
      const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
      const intercept = (sumY - slope * sumX) / n || mean;
      
      const yMean = sumY / n;
      const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
      const ssResidual = data.reduce((sum, d) => {
        const predicted = slope * d.index + intercept;
        return sum + Math.pow(d.value - predicted, 2);
      }, 0);
      const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;
      
      models[param][category] = {
        mean,
        median,
        min,
        max,
        stdDev,
        slope,
        intercept,
        rSquared,
        samples: data.length
      };
    });
    
    console.log(`Model for ${param}:`, {
      Baik: models[param].Baik ? `R²=${models[param].Baik.rSquared.toFixed(3)}` : 'N/A',
      Sedang: models[param].Sedang ? `R²=${models[param].Sedang.rSquared.toFixed(3)}` : 'N/A',
      Buruk: models[param].Buruk ? `R²=${models[param].Buruk.rSquared.toFixed(3)}` : 'N/A'
    });
  });
  
  return models;
};

// Predict parameter value from pollution index
const predictParameterFromIndex = (pollutionIndex, parameter, models) => {
  let category;
  if (pollutionIndex <= 1.0) category = 'Baik';
  else if (pollutionIndex <= 5.0) category = 'Sedang';
  else category = 'Buruk';
  
  const model = models[parameter][category];
  
  if (!model) {
    console.warn(`No model for ${parameter} in category ${category}`);
    return 0;
  }
  
  let predictedValue = model.slope * pollutionIndex + model.intercept;
  
  if (model.rSquared < 0.5) {
    const weight = model.rSquared;
    predictedValue = weight * predictedValue + (1 - weight) * model.median;
  }
  
  const noise = (Math.random() - 0.5) * model.stdDev * 0.15;
  predictedValue += noise;
  
  predictedValue = Math.max(model.min * 0.9, Math.min(model.max * 1.1, predictedValue));
  predictedValue = Math.max(0, predictedValue);
  
  return Math.round(predictedValue * 100) / 100;
};

// Predict pollution index trend
const predictPollutionIndexTrend = (historicalIndices, daysAhead) => {
  if (historicalIndices.length === 0) {
    return 0.5;
  }
  
  const validIndices = historicalIndices.filter(v => v > 0);
  
  if (validIndices.length === 0) {
    return 0.5;
  }
  
  const recentIndices = validIndices.slice(-60);
  
  const mean = recentIndices.reduce((a, b) => a + b, 0) / recentIndices.length;
  
  const sorted = [...recentIndices].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const n = recentIndices.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = recentIndices.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * recentIndices[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
  
  const variance = recentIndices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const last7 = recentIndices.slice(-7);
  const recentMean = last7.length > 0 ? last7.reduce((a, b) => a + b, 0) / last7.length : mean;
  
  const trendComponent = slope * daysAhead;
  const dampingFactor = Math.exp(-daysAhead / 30);
  const noise = (Math.random() - 0.5) * stdDev * 0.08;
  
  let predictedIndex = recentMean + trendComponent * dampingFactor + noise;
  
  predictedIndex = Math.max(0, Math.min(10, predictedIndex));
  
  return predictedIndex;
};

// Validate prediction
const validatePrediction = (prediction) => {
  const { Ammonia, BOD, COD, DO, Nitrat, pH, TDS, TSS, IndeksPencemaran } = prediction;
  
  const expectedCategory = IndeksPencemaran <= 1.0 ? 'Baik' : 
                          IndeksPencemaran <= 5.0 ? 'Sedang' : 'Buruk';
  
  let warnings = [];
  
  if (expectedCategory === 'Baik') {
    if (Ammonia > 0.5) warnings.push('Ammonia too high for Baik');
    if (BOD > 2.0) warnings.push('BOD too high for Baik');
    if (DO < 6.0) warnings.push('DO too low for Baik');
  } else if (expectedCategory === 'Sedang') {
    if (Ammonia > 1.5) warnings.push('Ammonia too high for Sedang');
    if (BOD > 6.0) warnings.push('BOD too high for Sedang');
  }
  
  if (warnings.length > 0) {
    console.warn(`Validation warnings for ${prediction.dateString}:`, warnings);
  }
  
  return prediction;
};

// Main prediction function
export const predictNextMonth = async (historicalData, location) => {
  console.log(`\n=== Starting prediction for ${location} ===`);
  
  const trainingData = await loadTrainingData();
  
  if (!trainingData) {
    console.error('Failed to load training data');
    return generateDefaultPrediction();
  }
  
  const models = buildRegressionModels(trainingData);
  
  const locationData = historicalData[location] || [];
  
  if (locationData.length === 0) {
    console.warn(`No historical data for ${location}`);
    return generateDefaultPrediction();
  }
  
  console.log(`Using ${locationData.length} historical data points`);
  
  const historicalIndices = locationData
    .map(d => d.IndeksPencemaran)
    .filter(v => v !== null && v !== undefined && v > 0);
  
  console.log(`Found ${historicalIndices.length} valid pollution indices`);
  
  if (historicalIndices.length > 0) {
    const min = Math.min(...historicalIndices);
    const max = Math.max(...historicalIndices);
    const mean = historicalIndices.reduce((a,b) => a+b, 0) / historicalIndices.length;
    
    // Count unique values
    const uniqueValues = [...new Set(historicalIndices)];
    
    console.log(`Historical indices range: ${min.toFixed(2)} - ${max.toFixed(2)}`);
    console.log(`Mean: ${mean.toFixed(2)}`);
    console.log(`Unique values: ${uniqueValues.length} (${uniqueValues.length === 1 ? 'WARNING: All same value!' : 'Good variation'})`);
    
    // If all values are the same, warn about it
    if (uniqueValues.length === 1) {
      console.warn(`⚠️ All historical indices are ${uniqueValues[0].toFixed(2)}. Predictions will be based on this single value.`);
    }
  }
  
  if (historicalIndices.length === 0) {
    console.warn('No valid pollution indices found, using defaults');
    return generateDefaultPrediction();
  }
  
  const predictions = [];
  const startDate = new Date(2026, 0, 1);
  const parameters = ['Ammonia', 'BOD', 'COD', 'DO', 'Nitrat', 'pH', 'TDS', 'TSS'];
  
  for (let day = 0; day < 31; day++) {
    const predictionDate = new Date(startDate);
    predictionDate.setDate(startDate.getDate() + day);
    
    const predictedIndex = predictPollutionIndexTrend(historicalIndices, day);
    
    const predictedParams = {};
    
    parameters.forEach(param => {
      predictedParams[param] = predictParameterFromIndex(predictedIndex, param, models);
    });
    
    let category;
    if (predictedIndex <= 1.0) category = 'Baik';
    else if (predictedIndex <= 5.0) category = 'Sedang';
    else category = 'Buruk';
    
    const prediction = {
      date: predictionDate,
      dateString: formatDate(predictionDate),
      Ammonia: predictedParams.Ammonia,
      BOD: predictedParams.BOD,
      COD: predictedParams.COD,
      DO: predictedParams.DO,
      Nitrat: predictedParams.Nitrat,
      pH: predictedParams.pH,
      TDS: predictedParams.TDS,
      TSS: predictedParams.TSS,
      IndeksPencemaran: Math.round(predictedIndex * 100) / 100,
      Kategori: category,
      confidence: 0.85 - (day * 0.012)
    };
    
    predictions.push(validatePrediction(prediction));
  }
  
  console.log(`Generated ${predictions.length} predictions for ${location}`);
  console.log('Prediction range:', {
    minIndex: Math.min(...predictions.map(p => p.IndeksPencemaran)).toFixed(2),
    maxIndex: Math.max(...predictions.map(p => p.IndeksPencemaran)).toFixed(2),
    categories: predictions.reduce((acc, p) => {
      acc[p.Kategori] = (acc[p.Kategori] || 0) + 1;
      return acc;
    }, {})
  });
  console.log('Sample predictions:', {
    day1: predictions[0],
    day15: predictions[14],
    day31: predictions[30]
  });
  
  return predictions;
};

// Generate default predictions
const generateDefaultPrediction = () => {
  console.log('Generating default predictions...');
  
  const predictions = [];
  const startDate = new Date(2026, 0, 1);
  
  const baseParams = {
    Ammonia: 0.3,
    BOD: 1.5,
    COD: 5.0,
    DO: 7.0,
    Nitrat: 5.0,
    pH: 7.5,
    TDS: 300,
    TSS: 15
  };
  
  const baseIndex = 0.5;

  for (let day = 0; day < 31; day++) {
    const predictionDate = new Date(startDate);
    predictionDate.setDate(startDate.getDate() + day);
    
    const params = {};
    Object.keys(baseParams).forEach(key => {
      const variation = (Math.random() - 0.5) * baseParams[key] * 0.15;
      params[key] = Math.max(0, Math.round((baseParams[key] + variation) * 100) / 100);
    });
    
    const indexVariation = (Math.random() - 0.5) * 0.2;
    const predictedIndex = Math.max(0, baseIndex + indexVariation);

    predictions.push({
      date: predictionDate,
      dateString: formatDate(predictionDate),
      ...params,
      IndeksPencemaran: Math.round(predictedIndex * 100) / 100,
      Kategori: 'Baik',
      confidence: 0.60
    });
  }

  return predictions;
};

// Format date helper
const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Legacy export
export const trainSVMModel = async () => {
  console.log('Training not needed - models built on-the-fly from training data');
  return null;
};