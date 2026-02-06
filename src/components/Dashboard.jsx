import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Tooltip Component untuk singkatan
const InfoTooltip = ({ text }) => (
  <div className="group relative inline-block ml-1">
    <svg className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
    <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const Dashboard = ({ currentData, selectedDate, historicalData, predictionData, viewMode }) => {
  // Calculate RMSE if we have both historical and prediction
  const rmseData = useMemo(() => {
    if (!historicalData || !predictionData || viewMode !== 'prediction') return null;

    const rmseByLocation = {};
    const locations = Object.keys(currentData);

    locations.forEach(location => {
      const historical = historicalData[location] || [];
      const predictions = predictionData[location] || [];

      if (historical.length === 0 || predictions.length === 0) return;

      const parameters = ['Ammonia', 'BOD', 'COD', 'DO', 'Nitrat', 'pH', 'TDS', 'TSS'];
      const rmseValues = {};
      
      // Get last historical data point
      const lastHistorical = historical[historical.length - 1];
      const firstPrediction = predictions[0];

      parameters.forEach(param => {
        const actualValue = lastHistorical[param] || 0;
        const predictedValue = firstPrediction[param] || 0;
        const squaredError = Math.pow(actualValue - predictedValue, 2);
        rmseValues[param] = Math.sqrt(squaredError);
      });

      rmseByLocation[location] = rmseValues;
    });

    return rmseByLocation;
  }, [historicalData, predictionData, currentData, viewMode]);

  // Prepare data for radar chart
  const radarData = useMemo(() => {
    const parameters = [
      { param: 'Ammonia', full: 'Amonia', max: 3 },
      { param: 'BOD', full: 'Biological Oxygen Demand', max: 12 },
      { param: 'COD', full: 'Chemical Oxygen Demand', max: 50 },
      { param: 'DO', full: 'Dissolved Oxygen', max: 10 },
      { param: 'Nitrat', full: 'Nitrat', max: 40 },
      { param: 'pH', full: 'pH', max: 10 },
      { param: 'TDS', full: 'Total Dissolved Solids', max: 2000 },
      { param: 'TSS', full: 'Total Suspended Solids', max: 100 }
    ];

    return parameters.map(({ param, full, max }) => {
      const dataPoint = { parameter: full };
      Object.keys(currentData).forEach(location => {
        // Normalize to 0-100 scale
        const value = currentData[location][param] || 0;
        dataPoint[location] = (value / max) * 100;
      });
      return dataPoint;
    });
  }, [currentData]);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    return Object.keys(currentData).map(location => {
      const data = currentData[location];
      return {
        location: location.replace('KLHK ', 'K').replace('Samosir', 'S'),
        fullName: location,
        IP: data.IndeksPencemaran || 0,
        kategori: data.Kategori || 'Baik',
        Ammonia: data.Ammonia || 0,
        BOD: data.BOD || 0,
        COD: data.COD || 0,
        DO: data.DO || 0
      };
    });
  }, [currentData]);

  // Get color for category
  const getCategoryColor = (kategori) => {
    switch (kategori) {
      case 'Baik': return '#22c55e';
      case 'Sedang': return '#eab308';
      case 'Buruk': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header dengan Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Dashboard Kualitas Air</h2>
            <p className="text-blue-100 text-sm">
              {viewMode === 'prediction' ? '🔮 Data Prediksi' : '📊 Data Historis'} - {selectedDate}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Object.keys(currentData).length}</div>
            <div className="text-sm text-blue-100">Lokasi Sampling</div>
          </div>
        </div>
      </div>

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2">
        {Object.keys(currentData).map(location => {
          const data = currentData[location];
          const kategori = data.Kategori || 'Baik';
          const bgColor = kategori === 'Baik' ? 'bg-green-50' : kategori === 'Sedang' ? 'bg-yellow-50' : 'bg-red-50';
          const borderColor = kategori === 'Baik' ? 'border-green-200' : kategori === 'Sedang' ? 'border-yellow-200' : 'border-red-200';
          const textColor = kategori === 'Baik' ? 'text-green-700' : kategori === 'Sedang' ? 'text-yellow-700' : 'text-red-700';

          return (
            <div key={location} className={`${bgColor} border ${borderColor} rounded-lg p-3 hover:shadow-md transition-shadow`}>
              <div className="text-xs font-semibold text-gray-600 mb-1 truncate" title={location}>
                {location.replace('KLHK ', 'K')}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {(data.IndeksPencemaran || 0).toFixed(2)}
              </div>
              <div className={`text-xs font-bold ${textColor}`}>
                {kategori}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Grid - 2 columns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pollution Index Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
            Indeks Pencemaran per Lokasi
            <InfoTooltip text="Indeks Pencemaran: Nilai yang menunjukkan tingkat pencemaran air. Baik (≤1.0), Sedang (1.0-5.0), Buruk (>5.0)" />
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="location" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value, name) => [value.toFixed(2), 'Indeks Pencemaran']}
                labelFormatter={(label) => {
                  const item = comparisonData.find(d => d.location === label);
                  return item ? item.fullName : label;
                }}
              />
              <Bar 
                dataKey="IP" 
                shape={(props) => {
                  const { x, y, width, height, payload } = props;
                  const fill = getCategoryColor(payload.kategori);
                  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart - Water Quality Profile */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Profil Parameter (Normalized)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              {Object.keys(currentData).slice(0, 4).map((location, idx) => (
                <Radar
                  key={location}
                  name={location.replace('KLHK ', 'K').replace('Samosir-1', 'S-1')}
                  dataKey={location}
                  stroke={['#3b82f6', '#ef4444', '#22c55e', '#eab308'][idx]}
                  fill={['#3b82f6', '#ef4444', '#22c55e', '#eab308'][idx]}
                  fillOpacity={0.3}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parameter Details - Compact Table */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          Detail Parameter Kualitas Air
          <InfoTooltip text="Satuan: Ammonia/BOD/COD/DO/Nitrat (mg/L), pH (skala), TDS/TSS (mg/L)" />
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Lokasi</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  Ammonia
                  <InfoTooltip text="Amonia (NH₃): Senyawa nitrogen yang tinggi dapat membahayakan organisme air" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  BOD
                  <InfoTooltip text="Biological Oxygen Demand: Jumlah oksigen yang dibutuhkan mikroorganisme untuk menguraikan bahan organik" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  COD
                  <InfoTooltip text="Chemical Oxygen Demand: Jumlah oksigen yang dibutuhkan untuk mengoksidasi zat organik dan anorganik" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  DO
                  <InfoTooltip text="Dissolved Oxygen: Jumlah oksigen terlarut dalam air, penting untuk kehidupan akuatik" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  Nitrat
                  <InfoTooltip text="Nitrat (NO₃⁻): Nutrisi yang berlebihan dapat menyebabkan eutrofikasi" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">pH</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  TDS
                  <InfoTooltip text="Total Dissolved Solids: Total padatan terlarut dalam air" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  TSS
                  <InfoTooltip text="Total Suspended Solids: Total padatan tersuspensi dalam air" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Object.keys(currentData).map((location, idx) => {
                const data = currentData[location];
                return (
                  <tr key={location} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 py-2 font-medium text-gray-900 text-xs">{location}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.Ammonia || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.BOD || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.COD || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.DO || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.Nitrat || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.pH || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.TDS || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{(data.TSS || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RMSE Display - Only for Prediction Mode */}
      {viewMode === 'prediction' && rmseData && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-4 border border-purple-200">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-purple-900">
                RMSE (Root Mean Square Error)
                <InfoTooltip text="RMSE mengukur perbedaan antara nilai prediksi dan nilai historis terakhir. Semakin kecil nilai RMSE, semakin akurat prediksi." />
              </h3>
              <p className="text-xs text-purple-700">Akurasi Prediksi: Selisih antara data historis terakhir dan prediksi pertama</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
            {Object.keys(rmseData).map(location => {
              const rmse = rmseData[location];
              const avgRMSE = Object.values(rmse).reduce((a, b) => a + b, 0) / Object.values(rmse).length;
              const quality = avgRMSE < 0.5 ? 'Excellent' : avgRMSE < 1.0 ? 'Good' : avgRMSE < 2.0 ? 'Fair' : 'Poor';
              const color = avgRMSE < 0.5 ? 'green' : avgRMSE < 1.0 ? 'blue' : avgRMSE < 2.0 ? 'yellow' : 'red';

              return (
                <div key={location} className={`bg-white rounded-lg p-3 border-2 border-${color}-200 hover:shadow-md transition-shadow`}>
                  <div className="text-xs font-semibold text-gray-600 mb-1 truncate" title={location}>
                    {location.replace('KLHK ', 'K')}
                  </div>
                  <div className={`text-xl font-bold text-${color}-600 mb-1`}>
                    {avgRMSE.toFixed(3)}
                  </div>
                  <div className={`text-xs font-semibold text-${color}-700`}>
                    {quality}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Parameter Comparison Line Chart */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Perbandingan Parameter Utama</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="location" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
              labelFormatter={(label) => {
                const item = comparisonData.find(d => d.location === label);
                return item ? item.fullName : label;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line type="monotone" dataKey="Ammonia" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Ammonia (mg/L)" />
            <Line type="monotone" dataKey="BOD" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="BOD (mg/L)" />
            <Line type="monotone" dataKey="COD" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="COD (mg/L)" />
            <Line type="monotone" dataKey="DO" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} name="DO (mg/L)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Info */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Kategori Baik (IP ≤ 1.0)
            </h4>
            <p className="text-xs text-gray-600">Air dalam kondisi baik, aman untuk ekosistem</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              Kategori Sedang (1.0 &lt; IP ≤ 5.0)
            </h4>
            <p className="text-xs text-gray-600">Air tercemar ringan, perlu monitoring</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Kategori Buruk (IP &gt; 5.0)
            </h4>
            <p className="text-xs text-gray-600">Air tercemar berat, perlu tindakan segera</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;