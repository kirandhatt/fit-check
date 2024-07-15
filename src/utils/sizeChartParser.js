async function getUserPreferredUnit() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['preferredUnit'], function(result) {
      resolve(result.preferredUnit || 'in'); // default to inches if no preference is set
    });
  });
}

export async function parseSizeChart(document) {
  const preferredUnit = await getUserPreferredUnit();

  const sizeChart = parseSizeChartFromDocument(document, preferredUnit);
  if (sizeChart) {
    return sizeChart;
  }

  const sizeGuideLinks = Array.from(document.querySelectorAll('a')).filter(link =>
    /size\s*guide|sizing\s*guide|size\s*chart|sizing\s*chart/i.test(link.innerText)
  );

  for (const link of sizeGuideLinks) {
    const response = await fetch(link.href);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const sizeChart = parseSizeChartFromDocument(doc, preferredUnit);
    if (sizeChart) {
      return sizeChart;
    }
  }

  return null;
}

function parseSizeChartFromDocument(doc, preferredUnit) {
  const tables = doc.querySelectorAll('table');
  let sizeChart = null;
  let detectedUnit = null;

  for (const table of tables) {
    const headers = Array.from(table.querySelectorAll('th, td')).map(cell => cell.innerText ? cell.innerText.trim().toLowerCase() : '');
    const sizeIndex = headers.findIndex(header => /size|^s$|^m$|^l$/i.test(header));
    const measurementIndices = {
      bust: headers.findIndex(header => /bust/i.test(header)),
      waist: headers.findIndex(header => /waist/i.test(header)),
      hips: headers.findIndex(header => /hip/i.test(header)),
    };

    if (sizeIndex === -1 || Object.values(measurementIndices).every(index => index === -1)) {
      continue;
    }

    // detect unit from headers
    for (const header of Object.keys(measurementIndices)) {
      const index = measurementIndices[header];
      if (index !== -1) {
        const headerText = headers[index];
        if (/cm|centimetre|centimeter/i.test(headerText)) {
          detectedUnit = 'cm';
          break;
        } else if (/inch|inches/i.test(headerText)) {
          detectedUnit = 'in';
          break;
        }
      }
    }

    if (!detectedUnit) {
      continue;
    }

    sizeChart = parseSizeTable(table, preferredUnit, detectedUnit);
    if (sizeChart) {
      break;
    }
  }

  return sizeChart;
}

function parseSizeTable(table, preferredUnit, detectedUnit) {
  const headers = Array.from(table.querySelectorAll('th, td')).map(cell => cell.innerText ? cell.innerText.trim().toLowerCase() : '');
  const sizeIndex = headers.findIndex(header => /size|^s$|^m$|^l$/i.test(header));
  const measurementIndices = {
    bust: headers.findIndex(header => /bust/i.test(header)),
    waist: headers.findIndex(header => /waist/i.test(header)),
    hips: headers.findIndex(header => /hip/i.test(header)),
  };

  if (sizeIndex === -1 || Object.values(measurementIndices).every(index => index === -1)) {
    return null;
  }

  const sizeChart = {};
  const rows = table.querySelectorAll('tr');

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length <= sizeIndex) continue;
    const size = cells[sizeIndex].innerText ? cells[sizeIndex].innerText.trim() : '';
    if (!size) continue;
    sizeChart[size] = {};

    for (const [measure, index] of Object.entries(measurementIndices)) {
      if (index !== -1 && cells.length > index) {
        let rangeText = cells[index].innerText.trim();
        let values = rangeText.split('-').map(val => parseFloat(val.trim()));
        let min = values[0];
        let max = values.length > 1 ? values[1] : values[0];

        if (isNaN(min) || isNaN(max)) {
          continue;
        }

        // convert measurements based on detectedUnit and preferredUnit
        if (detectedUnit === 'cm' && preferredUnit === 'in') {
          min = convertCmToInches(min);
          max = convertCmToInches(max);
        } else if (detectedUnit === 'in' && preferredUnit === 'cm') {
          min = convertInchesToCm(min);
          max = convertInchesToCm(max);
        }

        sizeChart[size][measure] = { min, max };
      }
    }
  }

  return Object.keys(sizeChart).length > 0 ? sizeChart : null;
}

function convertCmToInches(cm) {
  return cm / 2.54;
}

function convertInchesToCm(inches) {
  return inches * 2.54;
}
