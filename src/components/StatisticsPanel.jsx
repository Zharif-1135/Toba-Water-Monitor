import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatisticsPanel = ({ historicalData, predictionData, currentLocation }) => {
  const statistics = useMemo(() => {
    if (!historicalData || !currentLocation || !historicalData[currentLocation]) {
      return null;
    }

    const data = historicalData[currentLocation];
    const validData = data.filter(d => d.IndeksPencemaran > 0);

    if (validData.length === 0) return null;

    const indices = validData.map(d => d.IndeksPencemaran);
    const mean = indices.reduce((a, b) => a + b, 0) / indices.length;
    const min = Math.min(...indices);
    const max = Math.max(...indices);
    
    const sorted = [...indices].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = indices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / indices.length;
    const stdDev = Math.sqrt(variance);

    // Calculate trend
    const n = indices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = indices.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * indices[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    const trendDirection = slope > 0.01 ? 'Meningkat' : slope < -0.01 ? 'Menurun' : 'Stabil';
    const trendColor = slope > 0.01 ? 'text-red-600' : slope < -0.01 ? 'text-green-600' : 'text-gray-600';

    // Category distribution
    const categories = validData.reduce((acc, d) => {
      acc[d.Kategori] = (acc[d.Kategori] || 0) + 1;
      return acc;
    }, {});

    return {
      mean,
      median,
      min,
      max,
      stdDev,
      slope,
      trendDirection,
      trendColor,
      categories,
      dataPoints: validData.length
    };
  }, [historicalData, currentLocation]);

  const chartData = useMemo(() => {
    if (!historicalData || !currentLocation || !historicalData[currentLocation]) {
      return [];
    }

    const historical = historicalData[currentLocation]
      .filter(d => d.IndeksPencemaran > 0)
      .slice(-30)
      .map(d => ({
        date: d.dateString.substring(0, 5),
        value: d.IndeksPencemaran,
        type: 'Historis'
      }));

    if (predictionData && predictionData[currentLocation]) {
      const predictions = predictionData[currentLocation].map(d => ({
        date: d.dateString.substring(0, 5),
        value: d.IndeksPencemaran,
        type: 'Prediksi'
      }));
      return [...historical, ...predictions];
    }

    return historical;
  }, [historicalData, predictionData, currentLocation]);

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <p className="text-gray-500 text-center">Pilih lokasi untuk melihat statistik</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Statistik Data - {currentLocation}
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Rata-rata</div>
          <div className="text-2xl font-bold text-blue-600">
            {statistics.mean.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Median</div>
          <div className="text-2xl font-bold text-green-600">
            {statistics.median.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Range</div>
          <div className="text-2xl font-bold text-orange-600">
            {statistics.min.toFixed(2)} - {statistics.max.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Std Dev</div>
          <div className="text-2xl font-bold text-purple-600">
            ±{statistics.stdDev.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Trend & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Trend</div>
          <div className={`text-xl font-bold ${statistics.trendColor}`}>
            {statistics.trendDirection}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Slope: {statistics.slope.toFixed(4)}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Distribusi Kategori</div>
          <div className="space-y-1">
            {Object.entries(statistics.categories).map(([cat, count]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="font-medium">{cat}:</span>
                <span className="text-gray-600">
                  {count} ({((count / statistics.dataPoints) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Trend Indeks Pencemaran
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Indeks Pencemaran"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Quality Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <span className="font-medium">Data Points:</span> {statistics.dataPoints} pengukuran valid
            {statistics.dataPoints < 30 && (
              <span className="block mt-1 text-blue-600">
                ⚠️ Data terbatas. Prediksi mungkin kurang akurat.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;