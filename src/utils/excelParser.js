import * as XLSX from 'xlsx';

// Parse Excel file dan extract data untuk semua lokasi
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const parsedData = {};
        
        // Baca SEMUA sheet yang ada di workbook
        console.log('Found sheets:', workbook.SheetNames);
        
        workbook.SheetNames.forEach(sheetName => {
          // Skip sheet yang namanya kosong atau dimulai dengan underscore (hidden sheets)
          if (!sheetName || sheetName.startsWith('_')) {
            return;
          }
          
          console.log('Processing sheet:', sheetName);
          
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          
          // Parse sheet dan simpan dengan nama sheet sebagai key
          const locationData = parseLocationSheet(jsonData, sheetName);
          
          if (locationData.length > 0) {
            parsedData[sheetName] = locationData;
          }
        });
        
        // Validasi apakah ada data yang berhasil di-parse
        if (Object.keys(parsedData).length === 0) {
          reject(new Error('Tidak ada data valid yang ditemukan di file Excel'));
          return;
        }
        
        console.log('Parsed data for locations:', Object.keys(parsedData));
        console.log('Total data points per location:', 
          Object.fromEntries(
            Object.entries(parsedData).map(([loc, data]) => [loc, data.length])
          )
        );
        
        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Parse sheet untuk satu lokasi
const parseLocationSheet = (jsonData, sheetName) => {
  if (jsonData.length < 2) {
    console.warn(`Sheet ${sheetName} tidak memiliki cukup data (minimal 2 rows)`);
    return [];
  }
  
  const headers = jsonData[0];
  const dataRows = jsonData.slice(1);
  
  console.log(`Sheet ${sheetName} headers:`, headers);
  
  // Find column indices - lebih fleksibel dengan lowercase matching
  const dateIndex = headers.findIndex(h => 
    h && h.toString().toLowerCase().includes('tanggal')
  );
  
  const ammoniaIndex = headers.findIndex(h => 
    h && h.toString().toLowerCase().includes('ammonia')
  );
  
  const bodIndex = headers.findIndex(h => 
    h && (h.toString().toLowerCase().includes('bod') && !h.toString().toLowerCase().includes('cod'))
  );
  
  const codIndex = headers.findIndex(h => 
    h && h.toString().toLowerCase().includes('cod')
  );
  
  const doIndex = headers.findIndex(h => 
    h && (h.toString().toLowerCase() === 'do' || h.toString().toLowerCase().includes('dissolved'))
  );
  
  const nitratIndex = headers.findIndex(h => 
    h && h.toString().toLowerCase().includes('nitrat')
  );
  
  const phIndex = headers.findIndex(h => 
    h && (h.toString().toLowerCase() === 'ph' || h.toString().toLowerCase().includes('ph'))
  );
  
  const tdsIndex = headers.findIndex(h => 
    h && h.toString().toLowerCase().includes('tds')
  );
  
  const tssIndex = headers.findIndex(h => 
    h && h.toString().toLowerCase().includes('tss')
  );
  
  const indeksIndex = headers.findIndex(h => 
    h && (h.toString().toLowerCase().includes('indeks') || 
          h.toString().toLowerCase().includes('pencemar') ||
          h.toString().toLowerCase().includes('pencemaran'))
  );
  
  console.log(`Sheet ${sheetName} column indices:`, {
    dateIndex, ammoniaIndex, bodIndex, codIndex, doIndex, 
    nitratIndex, phIndex, tdsIndex, tssIndex, indeksIndex
  });
  
  // Validasi: minimal harus ada kolom Tanggal dan Indeks Pencemaran
  if (dateIndex === -1) {
    console.error(`Sheet ${sheetName} tidak memiliki kolom Tanggal`);
    return [];
  }
  
  const result = [];
  
  dataRows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (!row || row.length === 0 || !row[dateIndex]) {
      return;
    }
    
    const dateValue = row[dateIndex];
    let parsedDate;
    
    // Handle Excel date serial number
    if (typeof dateValue === 'number') {
      parsedDate = XLSX.SSF.parse_date_code(dateValue);
      parsedDate = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
    } else if (typeof dateValue === 'string') {
      // Try parsing string date
      parsedDate = new Date(dateValue);
    } else {
      parsedDate = new Date(dateValue);
    }
    
    // Skip invalid dates
    if (isNaN(parsedDate.getTime())) {
      console.warn(`Sheet ${sheetName}, row ${rowIndex + 2}: Invalid date "${dateValue}"`);
      return;
    }
    
    const dataPoint = {
      date: parsedDate,
      dateString: formatDate(parsedDate),
      Ammonia: parseValue(row[ammoniaIndex]),
      BOD: parseValue(row[bodIndex]),
      COD: parseValue(row[codIndex]),
      DO: parseValue(row[doIndex]),
      Nitrat: parseValue(row[nitratIndex]),
      pH: parseValue(row[phIndex]),
      TDS: parseValue(row[tdsIndex]),
      TSS: parseValue(row[tssIndex]),
      IndeksPencemaran: parseValue(row[indeksIndex])
    };
    
    // Jika IndeksPencemaran kosong, hitung dari parameter
    if (dataPoint.IndeksPencemaran === 0) {
      dataPoint.IndeksPencemaran = calculatePollutionIndex(dataPoint);
    }
    
    // Determine category based on Indeks Pencemaran
    if (dataPoint.IndeksPencemaran <= 1.0) {
      dataPoint.Kategori = 'Baik';
    } else if (dataPoint.IndeksPencemaran <= 5.0) {
      dataPoint.Kategori = 'Sedang';
    } else {
      dataPoint.Kategori = 'Buruk';
    }
    
    result.push(dataPoint);
  });
  
  // Sort by date
  result.sort((a, b) => a.date - b.date);
  
  console.log(`Sheet ${sheetName}: Parsed ${result.length} data points`);
  
  return result;
};

// Parse value dengan handling untuk empty cells
const parseValue = (value) => {
  if (value === null || value === undefined || value === '' || value === '-') {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Format date ke string
const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Calculate pollution index from parameters
const calculatePollutionIndex = (params) => {
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

// Get data untuk tanggal tertentu
export const getDataByDate = (parsedData, date) => {
  const result = {};
  
  Object.keys(parsedData).forEach(location => {
    const locationData = parsedData[location];
    const dataPoint = locationData.find(d => d.dateString === date);
    
    if (dataPoint) {
      result[location] = dataPoint;
    } else {
      // Return default values if no data
      result[location] = {
        date: new Date(date),
        dateString: date,
        Ammonia: 0,
        BOD: 0,
        COD: 0,
        DO: 0,
        Nitrat: 0,
        pH: 0,
        TDS: 0,
        TSS: 0,
        IndeksPencemaran: 0,
        Kategori: 'Baik'
      };
    }
  });
  
  return result;
};

// Get all unique dates from parsed data
export const getAllDates = (parsedData) => {
  const datesSet = new Set();
  
  Object.values(parsedData).forEach(locationData => {
    locationData.forEach(dataPoint => {
      datesSet.add(dataPoint.dateString);
    });
  });
  
  const datesArray = Array.from(datesSet).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
  
  return datesArray;
};