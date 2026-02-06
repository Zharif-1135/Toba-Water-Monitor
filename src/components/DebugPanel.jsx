import { useState } from 'react';

const DebugPanel = ({ historicalData, predictionData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  if (!historicalData && !predictionData) return null;

  const locations = historicalData ? Object.keys(historicalData) : [];

  const getHistoricalStats = (location) => {
    if (!historicalData || !historicalData[location]) return null;

    const data = historicalData[location];
    const validData = data.filter(d => d.IndeksPencemaran > 0);

    if (validData.length === 0) return null;

    const indices = validData.map(d => d.IndeksPencemaran);
    const min = Math.min(...indices);
    const max = Math.max(...indices);
    const mean = indices.reduce((a, b) => a + b, 0) / indices.length;

    let category;
    if (mean <= 1.0) category = 'Baik';
    else if (mean <= 5.0) category = 'Sedang';
    else category = 'Buruk';

    return {
      dataPoints: validData.length,
      min,
      max,
      mean,
      category,
      last5: validData.slice(-5)
    };
  };

  const getPredictionStats = (location) => {
    if (!predictionData || !predictionData[location]) return null;

    const predictions = predictionData[location];
    const indices = predictions.map(p => p.IndeksPencemaran);
    const min = Math.min(...indices);
    const max = Math.max(...indices);
    const mean = indices.reduce((a, b) => a + b, 0) / indices.length;

    const categories = predictions.reduce((acc, p) => {
      acc[p.Kategori] = (acc[p.Kategori] || 0) + 1;
      return acc;
    }, {});

    return {
      dataPoints: predictions.length,
      min,
      max,
      mean,
      categories,
      first5: predictions.slice(0, 5)
    };
  };

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-all"
        title="Debug Panel"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-bold">Debug Panel</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Location Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location:
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Choose a location...</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {selectedLocation && (
                <>
                  {/* Historical Stats */}
                  {(() => {
                    const stats = getHistoricalStats(selectedLocation);
                    if (!stats) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <p className="text-red-700">❌ No historical data found for {selectedLocation}</p>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          Historical Data
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-600">Data Points:</span>
                            <span className="ml-2 font-bold">{stats.dataPoints}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Category:</span>
                            <span className={`ml-2 font-bold ${
                              stats.category === 'Baik' ? 'text-green-600' :
                              stats.category === 'Sedang' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>{stats.category}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Min IP:</span>
                            <span className="ml-2 font-bold">{stats.min.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Max IP:</span>
                            <span className="ml-2 font-bold">{stats.max.toFixed(2)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600">Mean IP:</span>
                            <span className="ml-2 font-bold text-blue-700">{stats.mean.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Last 5 Data Points:</p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead className="bg-blue-100">
                                <tr>
                                  <th className="px-2 py-1 text-left">Date</th>
                                  <th className="px-2 py-1 text-left">IP</th>
                                  <th className="px-2 py-1 text-left">Category</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stats.last5.map((d, i) => (
                                  <tr key={i} className="border-b">
                                    <td className="px-2 py-1">{d.dateString}</td>
                                    <td className="px-2 py-1 font-bold">{d.IndeksPencemaran.toFixed(2)}</td>
                                    <td className="px-2 py-1">
                                      <span className={`${
                                        d.Kategori === 'Baik' ? 'text-green-600' :
                                        d.Kategori === 'Sedang' ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>{d.Kategori}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Prediction Stats */}
                  {(() => {
                    const stats = getPredictionStats(selectedLocation);
                    if (!stats) {
                      return (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-600">⚠️ No prediction data yet. Run prediction first.</p>
                        </div>
                      );
                    }

                    const historicalStats = getHistoricalStats(selectedLocation);
                    const deviation = historicalStats ? Math.abs(stats.mean - historicalStats.mean) : 0;

                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-bold text-green-900 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          Prediction Data
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-600">Days:</span>
                            <span className="ml-2 font-bold">{stats.dataPoints}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Deviation:</span>
                            <span className={`ml-2 font-bold ${
                              deviation > 1.0 ? 'text-red-600' : 'text-green-600'
                            }`}>±{deviation.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Min IP:</span>
                            <span className="ml-2 font-bold">{stats.min.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Max IP:</span>
                            <span className="ml-2 font-bold">{stats.max.toFixed(2)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600">Mean IP:</span>
                            <span className="ml-2 font-bold text-green-700">{stats.mean.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Category Distribution:</p>
                          <div className="flex gap-2">
                            {Object.entries(stats.categories).map(([cat, count]) => (
                              <div key={cat} className={`flex-1 p-2 rounded text-center ${
                                cat === 'Baik' ? 'bg-green-100 text-green-800' :
                                cat === 'Sedang' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                <div className="text-xs font-semibold">{cat}</div>
                                <div className="text-lg font-bold">{count}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">First 5 Predictions:</p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead className="bg-green-100">
                                <tr>
                                  <th className="px-2 py-1 text-left">Date</th>
                                  <th className="px-2 py-1 text-left">IP</th>
                                  <th className="px-2 py-1 text-left">Category</th>
                                  <th className="px-2 py-1 text-left">Ammonia</th>
                                  <th className="px-2 py-1 text-left">BOD</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stats.first5.map((p, i) => (
                                  <tr key={i} className="border-b">
                                    <td className="px-2 py-1">{p.dateString}</td>
                                    <td className="px-2 py-1 font-bold">{p.IndeksPencemaran.toFixed(2)}</td>
                                    <td className="px-2 py-1">
                                      <span className={`${
                                        p.Kategori === 'Baik' ? 'text-green-600' :
                                        p.Kategori === 'Sedang' ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>{p.Kategori}</span>
                                    </td>
                                    <td className="px-2 py-1">{p.Ammonia.toFixed(2)}</td>
                                    <td className="px-2 py-1">{p.BOD.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Validation */}
                        {historicalStats && (
                          <div className={`mt-3 p-2 rounded ${
                            deviation > 1.0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-green-100 border border-green-300'
                          }`}>
                            <p className="text-xs font-semibold">
                              {deviation > 1.0 ? '⚠️ Warning' : '✅ Validation'}:
                            </p>
                            <p className="text-xs">
                              {deviation > 1.0 
                                ? `Large deviation detected (${deviation.toFixed(2)}). Prediction may be inaccurate.`
                                : `Prediction is consistent with historical data (deviation: ${deviation.toFixed(2)})`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;