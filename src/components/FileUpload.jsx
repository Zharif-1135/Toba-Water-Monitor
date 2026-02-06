import { useState } from 'react';
import { parseExcelFile } from '../utils/excelParser';

const FileUpload = ({ onDataLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [sheetsInfo, setSheetsInfo] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Mohon upload file Excel (.xlsx atau .xls)');
      return;
    }

    setFileName(file.name);
    setError('');
    setIsLoading(true);

    try {
      const parsedData = await parseExcelFile(file);
      
      // Validate that we have data
      const hasData = Object.values(parsedData).some(data => data.length > 0);
      
      if (!hasData) {
        throw new Error('Tidak ada data yang ditemukan dalam file Excel');
      }

      // Create sheets info
      const info = Object.entries(parsedData).map(([location, data]) => ({
        name: location,
        dataPoints: data.length,
        dateRange: data.length > 0 ? {
          start: data[0].dateString,
          end: data[data.length - 1].dateString
        } : null
      }));
      
      setSheetsInfo(info);
      onDataLoaded(parsedData);
      setError('');
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError(`Error: ${err.message}`);
      setFileName('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Upload Data Kualitas Air Danau Toba
      </h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isLoading}
        />
        
        <label
          htmlFor="file-upload"
          className="cursor-pointer inline-flex flex-col items-center"
        >
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <span className="text-lg font-medium text-gray-700 mb-2">
            {isLoading ? 'Memproses...' : 'Pilih File Excel'}
          </span>
          
          <span className="text-sm text-gray-500">
            Format: .xlsx atau .xls
          </span>
        </label>
      </div>

      {fileName && sheetsInfo && (
        <div className="mt-4">
          <div className="flex items-center text-green-600 mb-3">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">File berhasil dimuat: {fileName}</span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">
              Sheet yang ditemukan ({sheetsInfo.length}):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sheetsInfo.map((sheet, idx) => (
                <div key={idx} className="bg-white rounded p-2 text-sm">
                  <div className="font-medium text-gray-800">{sheet.name}</div>
                  <div className="text-gray-600">
                    {sheet.dataPoints} data points
                  </div>
                  {sheet.dateRange && (
                    <div className="text-xs text-gray-500">
                      {sheet.dateRange.start} - {sheet.dateRange.end}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Petunjuk:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>File harus berformat Excel (.xlsx atau .xls)</li>
          <li>Aplikasi akan otomatis membaca SEMUA sheet yang ada di file</li>
          <li>Setiap sheet akan dianggap sebagai satu lokasi sampling</li>
          <li>Setiap sheet harus memiliki kolom: <span className="font-medium">Tanggal, Ammonia, BOD, COD, DO, Nitrat, pH, TDS, TSS, Indeks Pencemaran</span></li>
          <li>Cell kosong akan otomatis diisi dengan nilai 0</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;