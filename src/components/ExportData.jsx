import { useState } from 'react';
import * as XLSX from 'xlsx';

const ExportData = ({ currentData, allData, selectedDate, viewMode }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = () => {
    setIsExporting(true);

    try {
      const workbook = XLSX.utils.book_new();

      // Export current data
      const currentSheet = [];
      currentSheet.push(['Lokasi', 'Tanggal', 'Ammonia', 'BOD', 'COD', 'DO', 'Nitrat', 'pH', 'TDS', 'TSS', 'Indeks Pencemaran', 'Kategori']);

      Object.keys(currentData).forEach(location => {
        const data = currentData[location];
        currentSheet.push([
          location,
          selectedDate,
          data.Ammonia || 0,
          data.BOD || 0,
          data.COD || 0,
          data.DO || 0,
          data.Nitrat || 0,
          data.pH || 0,
          data.TDS || 0,
          data.TSS || 0,
          data.IndeksPencemaran || 0,
          data.Kategori || 'Baik'
        ]);
      });

      const ws1 = XLSX.utils.aoa_to_sheet(currentSheet);
      XLSX.utils.book_append_sheet(workbook, ws1, 'Data Saat Ini');

      // Export all data if available
      if (allData && Object.keys(allData).length > 0) {
        Object.keys(allData).forEach(location => {
          const locationData = allData[location];
          if (locationData && locationData.length > 0) {
            const sheetData = [];
            sheetData.push(['Tanggal', 'Ammonia', 'BOD', 'COD', 'DO', 'Nitrat', 'pH', 'TDS', 'TSS', 'Indeks Pencemaran', 'Kategori']);

            locationData.forEach(row => {
              sheetData.push([
                row.dateString || '',
                row.Ammonia || 0,
                row.BOD || 0,
                row.COD || 0,
                row.DO || 0,
                row.Nitrat || 0,
                row.pH || 0,
                row.TDS || 0,
                row.TSS || 0,
                row.IndeksPencemaran || 0,
                row.Kategori || 'Baik'
              ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(workbook, ws, location);
          }
        });
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Danau_Toba_${viewMode === 'prediction' ? 'Prediksi' : 'Historis'}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);

    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          selectedDate: selectedDate,
          viewMode: viewMode
        },
        currentData: currentData,
        allData: allData
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `Danau_Toba_${viewMode === 'prediction' ? 'Prediksi' : 'Historis'}_${timestamp}.json`;
      
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Export Data
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Export data kualitas air dalam format Excel atau JSON untuk analisis lebih lanjut.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportToExcel}
          disabled={isExporting || !currentData || Object.keys(currentData).length === 0}
          className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {isExporting ? 'Mengekspor...' : 'Export ke Excel'}
        </button>

        <button
          onClick={exportToJSON}
          disabled={isExporting || !currentData || Object.keys(currentData).length === 0}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {isExporting ? 'Mengekspor...' : 'Export ke JSON'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Format Export:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Excel: Berisi sheet untuk setiap lokasi + ringkasan</li>
              <li>JSON: Format data lengkap untuk pemrosesan lebih lanjut</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportData;